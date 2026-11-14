import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/pricing", "/features", "/contact", "/signup", "/login"],
      disallow: [
        "/admin/",
        "/teacher/",
        "/parent/",
        "/student/",
        "/superadmin/",
        "/api/",
        "/change-password",
      ],
    },
    sitemap: "https://academyhub.app/sitemap.xml",
  };
}
