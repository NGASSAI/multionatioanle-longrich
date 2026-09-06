import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";

const escapeXml = (str) =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const generateSitemap = async () => {
  const baseUrl = env.CLIENT_URL.replace(/\/$/, "");

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticUrls = [
    { loc: "/", priority: "1.0", changefreq: "daily" },
    { loc: "/produits", priority: "0.9", changefreq: "daily" },
  ];

  const productUrls = products.map((p) => ({
    loc: `/produits/${p.slug}`,
    lastmod: p.updatedAt.toISOString(),
    priority: "0.8",
    changefreq: "weekly",
  }));

  const categoryUrls = categories.map((c) => ({
    loc: `/produits?categorie=${c.slug}`,
    lastmod: c.updatedAt.toISOString(),
    priority: "0.6",
    changefreq: "weekly",
  }));

  const allUrls = [...staticUrls, ...productUrls, ...categoryUrls];

  const urlEntries = allUrls
    .map(
      (u) => `  <url>
    <loc>${escapeXml(baseUrl + u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};