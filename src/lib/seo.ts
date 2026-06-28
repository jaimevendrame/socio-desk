import { Metadata } from "next";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
  };
}

export function generateSEO({
  title,
  description,
  keywords = [],
  canonical,
  openGraph,
}: SEOProps): Metadata {
  const APP_NAME = "Socio Desk";
  const APP_DESCRIPTION = "Plataforma SaaS multi-tenant para gestão de reservas, associados e finanças de clubes recreativos.";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sociodesk.com.br";

  return {
    metadataBase: new URL(APP_URL),
    title: {
      default: title || APP_NAME,
      template: title ? `${title} | ${APP_NAME}` : `%s | ${APP_NAME}`,
    },
    description: description || APP_DESCRIPTION,
    keywords: [
      "clube recreativo",
      "gestão de reservas",
      "sistema para associações",
      "controle de associados",
      "sistema multi-tenant",
      ...keywords,
    ],
    authors: [{ name: "Socio Desk" }],
    creator: "Socio Desk",
    publisher: "Socio Desk",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: canonical || APP_URL,
    },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      url: APP_URL,
      siteName: APP_NAME,
      title: title || APP_NAME,
      description: description || APP_DESCRIPTION,
      images: openGraph?.images || [
        {
          url: "/api/og",
          width: 1200,
          height: 630,
          alt: APP_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title || APP_NAME,
      description: description || APP_DESCRIPTION,
      images: ["/api/og"],
    },
    icons: {
      icon: [
        {
          url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏌️</text></svg>",
          type: "image/svg+xml",
        },
      ],
      apple: "/apple-touch-icon.svg",
    },
  };
}