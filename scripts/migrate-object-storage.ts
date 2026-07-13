/**
 * ترحيل ملفات Object Storage من Replit → S3/R2 (Railway).
 *
 * شغّله من داخل Replit (لأن Sidecar المحلي فقط هناك يصل لباكت المصدر):
 *
 *   npx tsx scripts/migrate-object-storage.ts
 *
 * متغيرات مطلوبة:
 *   PRIVATE_OBJECT_DIR          مسار المصدر على ريبلت  (/bucket/.private)
 *   S3_ENDPOINT                 مثل https://xxx.r2.cloudflarestorage.com
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 *   S3_BUCKET                   اسم باكت الوجهة (أو DEST_BUCKET)
 *   S3_REGION                   اختياري (افتراضي auto)
 *
 * اختياري:
 *   DEST_PREFIX                 بادئة مفاتيح الوجهة (افتراضي .private)
 *   MIGRATE_DRY_RUN=1           سرد فقط بدون رفع
 *   MIGRATE_LIMIT=N             حد أقصى للملفات (للاختبار)
 */

import { Storage } from "@google-cloud/storage";
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 1) throw new Error(`Invalid path: ${path}`);
  return {
    bucketName: parts[0],
    objectName: parts.slice(1).join("/"),
  };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

async function main() {
  const privateObjectDir = requireEnv("PRIVATE_OBJECT_DIR");
  const { bucketName: sourceBucket, objectName: sourcePrefixRaw } =
    parseObjectPath(privateObjectDir);
  const sourcePrefix = sourcePrefixRaw
    ? sourcePrefixRaw.endsWith("/")
      ? sourcePrefixRaw
      : `${sourcePrefixRaw}/`
    : "";

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
  const destBucket =
    process.env.S3_BUCKET ||
    process.env.DEST_BUCKET ||
    process.env.BUCKET_NAME ||
    "";
  const destPrefixRaw =
    process.env.DEST_PREFIX ??
    (sourcePrefixRaw || ".private");
  const destPrefix = destPrefixRaw
    ? destPrefixRaw.endsWith("/")
      ? destPrefixRaw
      : `${destPrefixRaw}/`
    : "";

  if (!endpoint || !accessKeyId || !secretAccessKey || !destBucket) {
    throw new Error(
      "Missing S3 destination env (S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET)",
    );
  }

  const dryRun = process.env.MIGRATE_DRY_RUN === "1";
  const limit = process.env.MIGRATE_LIMIT
    ? Number(process.env.MIGRATE_LIMIT)
    : Infinity;

  console.log("[migrate] source bucket:", sourceBucket);
  console.log("[migrate] source prefix:", sourcePrefix || "(root)");
  console.log("[migrate] dest bucket:", destBucket);
  console.log("[migrate] dest prefix:", destPrefix || "(root)");
  console.log("[migrate] dryRun:", dryRun);

  // Source: Replit sidecar GCS client (works only on Replit)
  const gcs = new Storage({
    credentials: {
      audience: "replit",
      subject_token_type: "access_token",
      token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
      type: "external_account",
      credential_source: {
        url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
        format: {
          type: "json",
          subject_token_field_name: "access_token",
        },
      },
      universe_domain: "googleapis.com",
    },
    projectId: "",
  });

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const [files] = await gcs.bucket(sourceBucket).getFiles({
    prefix: sourcePrefix || undefined,
  });

  console.log(`[migrate] found ${files.length} objects on Replit`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    if (copied + skipped + failed >= limit) break;

    const relative = sourcePrefix
      ? file.name.slice(sourcePrefix.length)
      : file.name;
    if (!relative || relative.endsWith("/")) {
      skipped++;
      continue;
    }

    const destKey = `${destPrefix}${relative}`;

    try {
      // Skip if already present with same size
      try {
        const head = await s3.send(
          new HeadObjectCommand({ Bucket: destBucket, Key: destKey }),
        );
        const [meta] = await file.getMetadata();
        const srcSize = Number(meta.size ?? 0);
        const destSize = Number(head.ContentLength ?? -1);
        if (srcSize > 0 && srcSize === destSize) {
          skipped++;
          continue;
        }
      } catch {
        // not found — continue upload
      }

      if (dryRun) {
        console.log(`[dry-run] ${file.name} → s3://${destBucket}/${destKey}`);
        copied++;
        continue;
      }

      const [buf] = await file.download();
      const [meta] = await file.getMetadata();
      await s3.send(
        new PutObjectCommand({
          Bucket: destBucket,
          Key: destKey,
          Body: buf,
          ContentType: meta.contentType || undefined,
          CacheControl: meta.cacheControl || "public, max-age=31536000",
        }),
      );
      copied++;
      if (copied % 25 === 0) {
        console.log(`[migrate] copied ${copied}...`);
      }
    } catch (err: any) {
      failed++;
      console.error(`[migrate] FAIL ${file.name}:`, err?.message || err);
    }
  }

  console.log("[migrate] done");
  console.log(`  copied:  ${copied}`);
  console.log(`  skipped: ${skipped}`);
  console.log(`  failed:  ${failed}`);

  const railwayPrivateDir = `/${destBucket}/${destPrefix.replace(/\/$/, "") || ".private"}`;
  console.log("\nعلى Railway ضع:");
  console.log(`  PRIVATE_OBJECT_DIR=${railwayPrivateDir}`);
  console.log(
    `  PUBLIC_OBJECT_SEARCH_PATHS=/${destBucket}/public`,
  );
  console.log("  S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_REGION");
}

main().catch((err) => {
  console.error("[migrate] fatal:", err);
  process.exit(1);
});
