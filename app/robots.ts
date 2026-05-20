import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/advisor/report/", "/pitch-deck/report/", "/chat/"],
      },
    ],
    sitemap: "https://devbridgekerala.com/sitemap.xml",
  };
}
