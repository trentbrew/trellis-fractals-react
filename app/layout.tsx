import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TrellisProvider } from "@/lib/trellis/provider";
import { BootstrapSchemas } from "@/components/trellis/bootstrap-schemas";
import { SessionRoomBootstrap } from "@/components/trellis/session-room-bootstrap";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/lib/shell/theme";
import { ColorThemeProvider } from "@/components/shell/color-theme-provider";
import { getServerTheme } from "@/lib/shell/theme-server";
import { VantageMotionProvider } from "@/lib/fractal/vantage-motion";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fractals Playground (Next)",
  description: "React/Next.js port of the fractal projection contract samples",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getServerTheme();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full${theme === "dark" ? " dark" : ""}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('fractals-color-theme');if(!t)t='notebook';if(t!=='neutral')document.documentElement.dataset.colorTheme=t}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geistSans.className} h-full min-h-0 antialiased`}>
        <ThemeProvider defaultTheme={theme}>
        <ColorThemeProvider>
        <VantageMotionProvider>
        <TrellisProvider>
          <BootstrapSchemas>
            <SessionRoomBootstrap>
              <TooltipProvider>
                <Suspense fallback={null}>
                  <AppShell>{children}</AppShell>
                </Suspense>
              </TooltipProvider>
            </SessionRoomBootstrap>
          </BootstrapSchemas>
        </TrellisProvider>
        </VantageMotionProvider>
        </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
