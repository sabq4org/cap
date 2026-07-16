import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderSeoShell, resolveSpaSeo } from "../server/vite";
import {
  computeContentRobots,
  hasLegacySpamQuery,
  newsCanonicalPath,
  newsSharePath,
  seoTitleSlug,
  truncateMetaDescription,
} from "../shared/seoSignals";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const template = fs.readFileSync(path.join(projectRoot, "client/index.html"), "utf8");

const about = resolveSpaSeo({ originalUrl: "/about" });
assert.equal(about.status, 200);
assert.equal(about.noIndex, false);
assert.equal(about.canonical, "https://capsulah.com/about");
assert.match(about.title, /عن صحيفة كبسولة/);

for (const privatePath of [
  "/admin/dashboard",
  "/portal",
  "/nutrition",
  "/capsule",
  "/profile",
]) {
  assert.equal(
    resolveSpaSeo({ originalUrl: privatePath }).noIndex,
    true,
    `${privatePath} must be noindex`,
  );
}

const dirty = resolveSpaSeo({
  originalUrl: "/news?category=nutrition&page=2&utm_source=x",
});
assert.equal(dirty.noIndex, true);
assert.equal(
  dirty.canonical,
  "https://capsulah.com/news?category=nutrition&page=2",
);

const deepPage = resolveSpaSeo({ originalUrl: "/news?page=6" });
assert.equal(deepPage.noIndex, true);

assert.equal(hasLegacySpamQuery({ "items/A274011723": "" }), true);
assert.equal(hasLegacySpamQuery({ "products/detail/60316046": "" }), true);
assert.equal(hasLegacySpamQuery({ utm_source: "nabdapp.com" }), false);
const legacySpamShell = resolveSpaSeo({ originalUrl: "/?items/A274011723" });
assert.equal(legacySpamShell.noIndex, true);

assert.equal(
  seoTitleSlug("تأثير المكياج على صحة البشرة"),
  "تأثير-المكياج-على-صحة-البشرة",
);
const readableNewsPath = newsCanonicalPath({
  id: "news-id",
  shortCode: "FelRlGE",
  title: "عنوان تحريري أطول",
  seoTitle: "تأثير المكياج على صحة البشرة",
});
assert.equal(
  readableNewsPath,
  "/n/FelRlGE/تأثير-المكياج-على-صحة-البشرة",
);
assert.equal(
  newsSharePath({
    id: "news-id",
    shortCode: "FelRlGE",
    title: "تأثير المكياج على صحة البشرة",
  }),
  "/n/FelRlGE",
);
assert.equal(newsSharePath({ id: "news-id" }), "/news/news-id");
const readableNewsShell = resolveSpaSeo({ originalUrl: readableNewsPath });
assert.equal(readableNewsShell.status, 200);
assert.equal(readableNewsShell.noIndex, false);

const missing = resolveSpaSeo({ originalUrl: "/definitely-not-a-route" });
assert.equal(missing.status, 404);
assert.equal(missing.noIndex, true);

const rendered = renderSeoShell(template, { originalUrl: "/about" });
assert.equal(rendered.status, 200);
assert.match(rendered.html, /<title data-rh="true">عن صحيفة كبسولة الصحية<\/title>/);
assert.match(rendered.html, /rel="canonical" href="https:\/\/capsulah\.com\/about"/);
assert.equal((rendered.html.match(/rel="canonical"/g) || []).length, 1);
assert.equal((rendered.html.match(/name="description"/g) || []).length, 1);
assert.equal((rendered.html.match(/property="og:title"/g) || []).length, 1);

const renderedPrivate = renderSeoShell(template, { originalUrl: "/nutrition" });
assert.match(renderedPrivate.html, /name="robots" content="noindex, follow"/);

const longDescription = "كلمة ".repeat(80).trim();
const shortened = truncateMetaDescription(longDescription);
assert.ok(shortened.length <= 223);
assert.ok(shortened.endsWith("..."));

const dayMs = 24 * 60 * 60 * 1000;
const oldNews = computeContentRobots(new Date(Date.now() - 31 * dayMs), "published");
assert.equal(oldNews.googlebotNews, "noindex");
const archivedNews = computeContentRobots(new Date(Date.now() - 366 * dayMs), "published");
assert.match(archivedNews.robots, /noarchive/);

console.log("SEO checks passed");
