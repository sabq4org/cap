import type { Express, Request, Response } from "express";
import sharp from "sharp";
import { ObjectStorageService, ObjectNotFoundError, objectStorageClient } from "./objectStorage";
import { isAuthenticated } from "../../auth";
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

/** In-memory cache for resized WebP variants (mobile-friendly). */
const variantCache = new Map<string, { body: Buffer; contentType: string; expiresAt: number }>();
const VARIANT_TTL_MS = 15 * 60 * 1000;
const VARIANT_MAX_ENTRIES = 120;

function getVariant(key: string) {
  const hit = variantCache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    variantCache.delete(key);
    return null;
  }
  return hit;
}

function setVariant(key: string, body: Buffer, contentType: string) {
  if (variantCache.size >= VARIANT_MAX_ENTRIES) {
    const oldest = variantCache.keys().next().value;
    if (oldest) variantCache.delete(oldest);
  }
  variantCache.set(key, {
    body,
    contentType,
    expiresAt: Date.now() + VARIANT_TTL_MS,
  });
}

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

          const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          for await (const chunk of req) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += buf.length;
            if (totalBytes > MAX_UPLOAD_BYTES) {
              return res.status(413).json({ error: "File too large (max 25MB)" });
            }
            chunks.push(buf);
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
   * Resized/WebP variants for news images.
   * Path-based (not query-string) so CDN caches don't collide with full originals.
   *
   * GET /objects/t/:width/webp/:objectPath(*)
   * Example: /objects/t/720/webp/uploads/ai-….png
   */
  app.get(
    "/objects/t/:width/:format/:objectPath(*)",
    async (req: Request, res: Response) => {
      try {
        const widthRaw = parseInt(String(req.params.width || ""), 10);
        const width = Number.isFinite(widthRaw)
          ? Math.min(Math.max(widthRaw, 64), 1600)
          : 720;
        const format = String(req.params.format || "webp").toLowerCase();
        const wantWebp = format === "webp";
        const objectPath = `/objects/${String(req.params.objectPath || "")}`;

        const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
        const variantKey = `${objectPath}?w=${width}&fm=${wantWebp ? "webp" : "jpeg"}`;
        let variant = getVariant(variantKey);
        if (!variant) {
          const [original] = await objectFile.download();
          let pipeline = sharp(original, { failOn: "none" })
            .rotate()
            .resize({ width, withoutEnlargement: true });
          const body = wantWebp
            ? await pipeline.webp({ quality: 72 }).toBuffer()
            : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
          variant = {
            body,
            contentType: wantWebp ? "image/webp" : "image/jpeg",
            expiresAt: Date.now() + VARIANT_TTL_MS,
          };
          setVariant(variantKey, variant.body, variant.contentType);
        }

        res.set({
          "Content-Disposition": "inline",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "X-Frame-Options": "DENY",
          "Content-Type": variant.contentType,
          "Content-Length": String(variant.body.length),
          "Cache-Control": "public, max-age=31536000, immutable",
        });
        return res.send(variant.body);
      } catch (error: any) {
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: "Object not found" });
        }
        const code = error?.code || error?.name || "Unknown";
        const status = error?.$metadata?.httpStatusCode;
        console.error(
          `Error serving object variant ${req.path}: ${code}${status ? ` (${status})` : ""}`,
        );
        return res.status(500).json({ error: "Failed to serve object variant" });
      }
    },
  );

  /**
   * Serve uploaded objects publicly (no auth required).
   *
   * GET /objects/:objectPath(*)
   *
   * Images are served inline so browsers can render them directly in <img> tags.
   * Non-image files (PDFs, etc.) are served as attachments (download).
   */
  app.get(
    "/objects/:objectPath(*)",
    async (req: Request, res: Response) => {
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(
          req.path
        );

        const path = req.path.toLowerCase();
        const isImageExt =
          path.endsWith(".jpg") || path.endsWith(".jpeg") ||
          path.endsWith(".png") || path.endsWith(".gif") ||
          path.endsWith(".webp") || path.endsWith(".avif");
        // Many legacy uploads have no extension but live under /objects/uploads/
        const isUploadEntity = path.startsWith("/objects/uploads/");
        const treatAsImage = isImageExt || isUploadEntity;

        const widthRaw = parseInt(String(req.query.w || ""), 10);
        const width = Number.isFinite(widthRaw)
          ? Math.min(Math.max(widthRaw, 64), 1600)
          : 0;
        const wantWebp = String(req.query.fm || "") === "webp" || width > 0;

        res.set({
          "Content-Disposition": treatAsImage ? "inline" : "attachment",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "X-Frame-Options": "DENY",
        });

        if (treatAsImage && (width > 0 || String(req.query.fm || "") === "webp")) {
          const variantKey = `${req.path}?w=${width || "full"}&fm=${wantWebp ? "webp" : "orig"}`;
          let variant = getVariant(variantKey);
          if (!variant) {
            const [original] = await objectFile.download();
            let pipeline = sharp(original, { failOn: "none" }).rotate();
            if (width > 0) {
              pipeline = pipeline.resize({
                width,
                withoutEnlargement: true,
              });
            }
            const body = wantWebp
              ? await pipeline.webp({ quality: 72 }).toBuffer()
              : await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
            variant = {
              body,
              contentType: wantWebp ? "image/webp" : "image/jpeg",
              expiresAt: Date.now() + VARIANT_TTL_MS,
            };
            setVariant(variantKey, variant.body, variant.contentType);
          }

          res.set({
            "Content-Type": variant.contentType,
            "Content-Length": String(variant.body.length),
            "Cache-Control": "public, max-age=31536000, immutable",
          });
          return res.send(variant.body);
        }

        // Public long-lived cache so Cloudflare (and browsers) keep images
        // instead of proxying every refresh through Railway → S3.
        await objectStorageService.downloadObject(objectFile, res, 31536000, {
          forcePublic: true,
        });
      } catch (error: any) {
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ error: "Object not found" });
        }
        // One-line log — full AWS stacks were flooding Railway (500 logs/sec limit)
        const code = error?.code || error?.name || "Unknown";
        const status = error?.$metadata?.httpStatusCode;
        console.error(
          `Error serving object ${req.path}: ${code}${status ? ` (${status})` : ""}`,
        );
        if (code === "S3_ACCESS_DENIED" || status === 403) {
          return res.status(503).json({
            error: "Object storage access denied — check S3 credentials on Railway",
          });
        }
        return res.status(500).json({ error: "Failed to serve object" });
      }
    }
  );
}
