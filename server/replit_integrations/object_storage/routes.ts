import type { Express, Request, Response } from "express";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { isAuthenticated } from "../../replitAuth";
import { isS3Configured, verifyUploadTicket } from "./s3Client";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "application/pdf",
  "text/plain",
  "application/json",
]);

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
]);

export function registerObjectStorageRoutes(app: Express): void {
  const objectStorageService = new ObjectStorageService();

  /**
   * Request a presigned URL for file upload.
   *
   * Requires authentication to prevent anonymous bucket abuse.
   * Validates contentType against an allowlist to block active content
   * (HTML, SVG, etc.) that could be used for same-origin XSS.
   *
   * Request body (JSON):
   * {
   *   "name": "filename.jpg",
   *   "size": 12345,
   *   "contentType": "image/jpeg"
   * }
   *
   * Response:
   * {
   *   "uploadURL": "https://storage.googleapis.com/...",
   *   "objectPath": "/objects/uploads/uuid"
   * }
   *
   * IMPORTANT: The client should NOT send the file to this endpoint.
   * Send JSON metadata only, then upload the file directly to uploadURL.
   */
  app.post(
    "/api/uploads/request-url",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const { name, size, contentType } = req.body as {
          name?: string;
          size?: number;
          contentType?: string;
        };

        if (!name) {
          return res.status(400).json({
            error: "Missing required field: name",
          });
        }

        if (!contentType || !ALLOWED_MIME_TYPES.has(contentType)) {
          return res.status(400).json({
            error:
              "Unsupported or missing contentType. Allowed types: " +
              [...ALLOWED_MIME_TYPES].join(", "),
          });
        }

        const uploadURL = await objectStorageService.getObjectEntityUploadURL();

        const objectPath =
          objectStorageService.normalizeObjectEntityPath(uploadURL);

        res.json({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        });
      } catch (error) {
        console.error("Error generating upload URL:", error);
        res.status(500).json({ error: "Failed to generate upload URL" });
      }
    }
  );

  /**
   * S3 mode only: browser PUTs the file to this same-origin route (HMAC ticket)
   * instead of a bucket presigned URL (avoids CORS on Railway/R2 buckets).
   */
  if (isS3Configured) {
    app.put(
      "/api/objects/upload/:objectId",
      async (req: Request, res: Response) => {
        try {
          const objectId = String(req.params.objectId || "");
          if (
            !objectId ||
            !verifyUploadTicket(
              objectId,
              typeof req.query.exp === "string" ? req.query.exp : undefined,
              typeof req.query.sig === "string" ? req.query.sig : undefined,
            )
          ) {
            return res.status(403).json({ error: "Invalid or expired upload ticket" });
          }

          const contentType = String(
            req.headers["content-type"] || "application/octet-stream",
          );
          if (!ALLOWED_MIME_TYPES.has(contentType)) {
            return res.status(400).json({ error: "Unsupported contentType" });
          }

          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const body = Buffer.concat(chunks);
          if (body.length === 0) {
            return res.status(400).json({ error: "Empty body" });
          }

          const privateObjectDir = objectStorageService.getPrivateObjectDir();
          const fullPath = `${privateObjectDir}/uploads/${objectId}`;
          const pathParts = fullPath.startsWith("/")
            ? fullPath.slice(1).split("/")
            : fullPath.split("/");
          const bucketName = pathParts[0];
          const objectName = pathParts.slice(1).join("/");

          const file = objectStorageClient.bucket(bucketName).file(objectName);
          await file.save(body, {
            contentType,
            metadata: { contentType, cacheControl: "public, max-age=31536000" },
          });

          res.json({
            ok: true,
            objectPath: `/objects/uploads/${objectId}`,
          });
        } catch (error) {
          console.error("Error uploading object via ticket:", error);
          res.status(500).json({ error: "Failed to upload object" });
        }
      },
    );
  }

  /**
   * Serve uploaded objects publicly (no auth required).
   *
   * GET /objects/:objectPath(*)
   *
   * Images are served inline so browsers can render them directly in <img> tags.
   * Non-image files (PDFs, etc.) are served as attachments (download).
   * X-Content-Type-Options: nosniff prevents MIME-type sniffing on all files.
   */
  app.get(
    "/objects/:objectPath(*)",
    async (req: Request, res: Response) => {
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(
          req.path
        );

        // Determine content type from file extension to set appropriate headers
        const path = req.path.toLowerCase();
        const isImage =
          path.endsWith(".jpg") || path.endsWith(".jpeg") ||
          path.endsWith(".png") || path.endsWith(".gif") ||
          path.endsWith(".webp") || path.endsWith(".avif");

        res.set({
          "Content-Disposition": isImage ? "inline" : "attachment",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "X-Frame-Options": "DENY",
          // Cache images aggressively since they don't change after upload
          "Cache-Control": isImage ? "public, max-age=31536000, immutable" : "no-store",
        });

        await objectStorageService.downloadObject(objectFile, res);
      } catch (error) {
        console.error("Error serving object:", error);
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: "Object not found" });
        }
        return res.status(500).json({ error: "Failed to serve object" });
      }
    }
  );
}
