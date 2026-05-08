import type { Express, Request, Response } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { isAuthenticated } from "../../replitAuth";

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
   * Serve uploaded objects.
   *
   * GET /objects/:objectPath(*)
   *
   * Requires authentication to prevent unauthenticated access to private
   * bucket objects. Security headers are set on every response to prevent
   * script execution even if an unexpected content type was stored:
   *   - Content-Disposition: attachment  — forces download, blocks rendering
   *   - X-Content-Type-Options: nosniff  — prevents MIME-type sniffing
   *   - Content-Security-Policy: default-src 'none'  — no script execution
   *   - X-Frame-Options: DENY  — prevents framing
   */
  app.get(
    "/objects/:objectPath(*)",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(
          req.path
        );

        res.set({
          "Content-Disposition": "attachment",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "X-Frame-Options": "DENY",
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
