import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXTAUTH_URL ?? "https://devbridgekerala.com").replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/report/", "/advisor/report/", "/pitch-deck/report/", "/chat/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
