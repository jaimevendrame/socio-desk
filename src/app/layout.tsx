import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import { TenantProvider } from "@/lib/context/tenant-context";
import { AuthProvider, type ServerSession } from "@/lib/auth/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenants, teamMembers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateSEO } from "@/lib/seo";
import { ServiceWorkerProvider } from "@/lib/service-worker";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const APP_NAME = "Socio Desk";
const APP_DESCRIPTION = "Plataforma SaaS multi-tenant para gestão de reservas, associados e finanças de clubes recreativos.";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://sociodesk.com.br";

export const metadata: Metadata = generateSEO({
  title: "Socio Desk",
  description: APP_DESCRIPTION,
});

const DEFAULT_TENANT = {
  tenantId: "1bdd8429-6dce-42ea-bf5b-6dc39a7a5490",
  tenantName: "Clube Exemplo",
  tenantSlug: "dev",
};

interface ServerContext {
  tenant: {
    tenantId: string;
    tenantName: string;
    tenantSlug: string;
  };
  session: ServerSession | null;
}

async function getServerContext(): Promise<ServerContext> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = { cookie: cookieStore.toString() };

    const [session] = await Promise.all([
      auth.api.getSession({ headers: cookieHeader }),
    ]);

    if (!session) {
      return { tenant: DEFAULT_TENANT, session: null };
    }

    // Buscar tenant real do banco via teamMembers
    let tenant = DEFAULT_TENANT;

    try {
      const memberResult = await db
        .select({ tenantId: teamMembers.tenantId })
        .from(teamMembers)
        .where(eq(teamMembers.userId, session.user.id))
        .limit(1);

      if (memberResult[0]) {
        const tenantResult = await db
          .select({ name: tenants.name, slug: tenants.slug })
          .from(tenants)
          .where(eq(tenants.id, memberResult[0].tenantId))
          .limit(1);

        if (tenantResult[0]) {
          tenant = {
            tenantId: memberResult[0].tenantId,
            tenantName: tenantResult[0].name,
            tenantSlug: tenantResult[0].slug,
          };
        }
      }
    } catch (dbError) {
      console.error("[ServerContext] Error fetching tenant:", dbError);
    }

    const serverSession: ServerSession = {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email,
        image: session.user.image ?? null,
        tenantId: tenant.tenantId,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt.toString(),
      },
    };

    return { tenant, session: serverSession };
  } catch (error) {
    console.error("[ServerContext] Error:", error);
    return { tenant: DEFAULT_TENANT, session: null };
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { tenant: initialTenant, session: initialSession } = await getServerContext();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Socio Desk" />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} min-h-screen antialiased font-sans`}>
        <ServiceWorkerProvider>
          <AuthProvider initialSession={initialSession}>
            <TenantProvider initialTenant={initialTenant}>
              {children}
            </TenantProvider>
          </AuthProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
