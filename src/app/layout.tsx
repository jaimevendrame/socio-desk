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

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Socio Desk",
    template: "%s | Socio Desk",
  },
  description: "Plataforma SaaS multi-tenant para gestao de reservas, associados e financas de clubes recreivos.",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏌️</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
};

const DEFAULT_TENANT = {
  tenantId: "1bdd8429-6dce-42ea-bf5b-6dc39a7a5490",
  tenantName: "Clube Exemplo",
  tenantSlug: "dev",
};

async function getServerTenant() {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({
      headers: { cookie: cookieStore.toString() },
    });

    if (!session?.user?.id) {
      return DEFAULT_TENANT;
    }

    // Buscar tenant real do banco via teamMembers
    const memberResult = await db
      .select({ tenantId: teamMembers.tenantId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, session.user.id))
      .limit(1);

    if (!memberResult[0]) {
      return DEFAULT_TENANT;
    }

    const tenantResult = await db
      .select({ name: tenants.name, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.id, memberResult[0].tenantId))
      .limit(1);

    if (!tenantResult[0]) {
      return DEFAULT_TENANT;
    }

    return {
      tenantId: memberResult[0].tenantId,
      tenantName: tenantResult[0].name,
      tenantSlug: tenantResult[0].slug,
    };
  } catch (error) {
    console.error("[ServerTenant] Error fetching tenant:", error);
    return DEFAULT_TENANT;
  }
}

async function getServerSession(): Promise<ServerSession | null> {
  try {
    const cookieStore = await cookies();
    const session = await auth.api.getSession({
      headers: { cookie: cookieStore.toString() },
    });

    if (!session) return null;

    return {
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email,
        image: session.user.image ?? null,
        tenantId: (session.user as any).tenantId,
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt.toString(),
      },
    };
  } catch (error) {
    console.error("[ServerSession] Error fetching session:", error);
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [initialTenant, initialSession] = await Promise.all([
    getServerTenant(),
    getServerSession(),
  ]);

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${geistMono.variable} min-h-screen antialiased font-sans`}>
        <AuthProvider initialSession={initialSession}>
          <TenantProvider initialTenant={initialTenant}>
            {children}
          </TenantProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
