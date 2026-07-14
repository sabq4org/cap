// S3-compatible storage driver (Railway Bucket, R2, MinIO, ...).
//
// The rest of the app talks to object storage through the small subset of the
// Google Cloud Storage–compatible surface (bucket().file() with
// exists/getMetadata/setMetadata/createReadStream/save/download/delete).
// This module implements that subset on top of the AWS SDK so no callsite
// changes when switching storage backends. Activated when the S3 env vars are
// present; see isS3Configured.
import {
  S3Client,
  HeadObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { PassThrough, type Readable } from "stream";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const endpoint =
  process.env.S3_ENDPOINT ||
  process.env.BUCKET_ENDPOINT_URL ||
  process.env.AWS_ENDPOINT_URL ||
  "";
const accessKeyId =
  process.env.S3_ACCESS_KEY_ID ||
  process.env.BUCKET_ACCESS_KEY_ID ||
  process.env.AWS_ACCESS_KEY_ID ||
  "";
const secretAccessKey =
  process.env.S3_SECRET_ACCESS_KEY ||
  process.env.BUCKET_SECRET_ACCESS_KEY ||
  process.env.AWS_SECRET_ACCESS_KEY ||
  "";
const region =
  process.env.S3_REGION ||
  process.env.BUCKET_REGION ||
  process.env.AWS_REGION ||
  "auto";

export const isS3Configured = Boolean(endpoint && accessKeyId && secretAccessKey);

// GCS allows arbitrary custom-metadata keys ("custom:aclPolicy"); S3 metadata
// keys must be header-safe, so the ACL key is translated at this boundary and
// the rest of the app keeps using the GCS key.
const GCS_ACL_KEY = "custom:aclPolicy";
const S3_ACL_KEY = "acl-policy";

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });
  }
  return s3;
}

function toGcsMetadata(s3Metadata: Record<string, string> | undefined) {
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(s3Metadata ?? {})) {
    metadata[key === S3_ACL_KEY ? GCS_ACL_KEY : key] = value;
  }
  return metadata;
}

export class S3File {
  constructor(
    public readonly bucketName: string,
    public readonly name: string,
  ) {}

  private get location() {
    return { Bucket: this.bucketName, Key: this.name };
  }

  async exists(): Promise<[boolean]> {
    try {
      await getS3().send(new HeadObjectCommand(this.location));
      return [true];
    } catch (error: any) {
      const status = error?.$metadata?.httpStatusCode;
      if (
        error?.name === "NotFound" ||
        error?.name === "NoSuchKey" ||
        status === 404
      ) {
        return [false];
      }
      // 403 = wrong credentials / bucket ACL — surface clearly (not "UnknownError")
      if (status === 403) {
        const err = new Error(
          `S3 AccessDenied (403) for s3://${this.bucketName}/${this.name} — check Railway bucket credentials and PRIVATE_OBJECT_DIR`,
        );
        (err as any).code = "S3_ACCESS_DENIED";
        (err as any).$metadata = error.$metadata;
        throw err;
      }
      throw error;
    }
  }

  async getMetadata(): Promise<[any]> {
    const head = await getS3().send(new HeadObjectCommand(this.location));
    return [
      {
        contentType: head.ContentType,
        size: String(head.ContentLength ?? 0),
        cacheControl: head.CacheControl,
        metadata: toGcsMetadata(head.Metadata),
      },
    ];
  }

  // S3 can't update metadata in place — copy the object onto itself.
  async setMetadata(options: {
    metadata?: Record<string, string | null>;
  }): Promise<void> {
    const head = await getS3().send(new HeadObjectCommand(this.location));
    const merged: Record<string, string> = { ...(head.Metadata ?? {}) };
    for (const [key, value] of Object.entries(options.metadata ?? {})) {
      const s3Key = key === GCS_ACL_KEY ? S3_ACL_KEY : key.toLowerCase();
      if (value == null) {
        delete merged[s3Key];
      } else {
        merged[s3Key] = String(value);
      }
    }
    await getS3().send(
      new CopyObjectCommand({
        ...this.location,
        CopySource: `${this.bucketName}/${this.name}`
          .split("/")
          .map(encodeURIComponent)
          .join("/"),
        Metadata: merged,
        MetadataDirective: "REPLACE",
        ContentType: head.ContentType,
        CacheControl: head.CacheControl,
      }),
    );
  }

  createReadStream(): Readable {
    const passthrough = new PassThrough();
    getS3()
      .send(new GetObjectCommand(this.location))
      .then((response) => {
        const body = response.Body as Readable;
        body.on("error", (error) => passthrough.destroy(error));
        body.pipe(passthrough);
      })
      .catch((error) => passthrough.destroy(error));
    return passthrough;
  }

  async save(
    data: Buffer | string,
    options?: {
      contentType?: string;
      resumable?: boolean;
      metadata?: { contentType?: string; cacheControl?: string };
    },
  ): Promise<void> {
    await getS3().send(
      new PutObjectCommand({
        ...this.location,
        Body: typeof data === "string" ? Buffer.from(data) : data,
        ContentType: options?.contentType ?? options?.metadata?.contentType,
        CacheControl: options?.metadata?.cacheControl,
      }),
    );
  }

  async download(): Promise<[Buffer]> {
    const response = await getS3().send(new GetObjectCommand(this.location));
    const bytes = await response.Body!.transformToByteArray();
    return [Buffer.from(bytes)];
  }

  async delete(): Promise<void> {
    await getS3().send(new DeleteObjectCommand(this.location));
  }
}

class S3Bucket {
  constructor(public readonly name: string) {}
  file(objectName: string): S3File {
    return new S3File(this.name, objectName);
  }
}

export class S3Storage {
  bucket(bucketName: string): S3Bucket {
    return new S3Bucket(bucketName);
  }
}

// ---------------------------------------------------------------------------
// Server-proxied uploads.
//
// Legacy mode handed the browser a presigned PUT URL straight to the
// bucket. Railway's bucket endpoint isn't CORS-configured for the site, so in
// S3 mode the "upload URL" is a same-origin route (/api/objects/upload/:id)
// that the server verifies with an HMAC ticket and streams into the bucket.
// ---------------------------------------------------------------------------

const uploadSecret =
  process.env.UPLOAD_URL_SECRET ||
  process.env.SESSION_SECRET ||
  // Boot-time fallback keeps uploads working; tickets die on restart.
  randomBytes(32).toString("hex");

function ticketSignature(objectId: string, expiresAt: number): string {
  return createHmac("sha256", uploadSecret)
    .update(`${objectId}:${expiresAt}`)
    .digest("hex");
}

export function createUploadTicketURL(objectId: string, ttlSec = 900): string {
  const expiresAt = Date.now() + ttlSec * 1000;
  const signature = ticketSignature(objectId, expiresAt);
  return `/api/objects/upload/${objectId}?exp=${expiresAt}&sig=${signature}`;
}

export function verifyUploadTicket(
  objectId: string,
  exp: string | undefined,
  sig: string | undefined,
): boolean {
  const expiresAt = Number(exp);
  if (!sig || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return false;
  }
  const expected = ticketSignature(objectId, expiresAt);
  const provided = Buffer.from(sig);
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
}
