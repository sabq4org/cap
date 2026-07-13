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
 *   MIGRATE_FORCE=1             أعد الرفع حتى لو الملف موجود
 *
 * الاستئناف: يسرد باكت الوجهة مرة واحدة ويتخطى المفاتيح الموجودة بنفس الحجم.
 */

import { Storage } from "@google-cloud/storage";
import {
  S3Client,
  PutObjectCommand,
  ListObjectsV2Command,
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
  console.log("[migrate] listing destination bucket (resume inventory)...");

  // One list beats 20k HeadObject calls — and avoids S3's 403-on-missing quirk
  // that made every file look "new" and restart the whole copy.
  const existing = new Map<string, number>();
  let continuationToken: string | undefined;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: destBucket,
        Prefix: destPrefix || undefined,
        ContinuationToken: continuationToken,
      }),
    );
    for (const obj of page.Contents || []) {
      if (obj.Key) existing.set(obj.Key, Number(obj.Size ?? 0));
    }
    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined;
    if (existing.size > 0 && existing.size % 2000 === 0) {
      console.log(`[migrate] listed ${existing.size} dest objects so far...`);
    }
  } while (continuationToken);

  console.log(
    `[migrate] dest already has ${existing.size} objects under ${destPrefix || "(root)"}`,
  );
  if (existing.size === 0) {
    console.log("[migrate] note: empty dest inventory — full copy will run");
  } else {
    console.log("[migrate] resume mode: existing keys will be skipped (same size)");
  }

  let copied = 0;
  let skipped = 0;
  let failed = 0;
  let announcedFirstUpload = false;
  const force = process.env.MIGRATE_FORCE === "1";
  const startedAt = Date.now();

  const logProgress = (forceLog = false) => {
    const processed = copied + skipped + failed;
    if (!forceLog && processed > 0 && processed % 50 !== 0) return;
    const elapsedSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const rate = Math.round(processed / elapsedSec);
    console.log(
      `[migrate] progress ${processed}/${files.length} | copied=${copied} skipped=${skipped} failed=${failed} | ${rate}/s`,
    );
  };

  for (const file of files) {
    if (copied + skipped + failed >= limit) break;

    const relative = sourcePrefix
      ? file.name.slice(sourcePrefix.length)
      : file.name;
    if (!relative || relative.endsWith("/")) {
      skipped++;
      logProgress();
      continue;
    }

    const destKey = `${destPrefix}${relative}`;

    try {
      const destSize = existing.get(destKey);
      if (destSize !== undefined && !force) {
        const [meta] = await file.getMetadata();
        const srcSize = Number(meta.size ?? 0);
        // Skip when sizes match, or when dest exists with unknown/zero src meta
        if (srcSize === 0 || srcSize === destSize) {
          skipped++;
          logProgress();
          continue;
        }
      }

      if (dryRun) {
        console.log(`[dry-run] ${file.name} → s3://${destBucket}/${destKey}`);
        copied++;
        logProgress();
        continue;
      }

      if (!announcedFirstUpload) {
        announcedFirstUpload = true;
        console.log(`[migrate] uploading: ${file.name}`);
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
      existing.set(destKey, buf.length);
      copied++;
      logProgress();
    } catch (err: any) {
      failed++;
      console.error(`[migrate] FAIL ${file.name}:`, err?.message || err);
      logProgress();
    }
  }

  logProgress(true);

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
