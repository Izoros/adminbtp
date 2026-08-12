import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdminBTP",
    short_name: "AdminBTP",
    description: "Pilotage administratif et technique des chantiers BTP.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f3eb",
    theme_color: "#a94f35",
    lang: "fr",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
