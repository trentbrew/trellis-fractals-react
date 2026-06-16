import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TrellisProvider } from "@/lib/trellis/provider";
import { BootstrapSchemas } from "@/components/trellis/bootstrap-schemas";
import { SessionRoomBootstrap } from "@/components/trellis/session-room-bootstrap";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/lib/shell/theme";
import { ColorThemeProvider } from "@/components/shell/color-theme-provider";
import { COLOR_THEME_STORAGE_KEY } from "@/lib/color-theme";
import { THEME_STORAGE_KEY } from "@/lib/shell/theme-types";
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
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var m=sessionStorage.getItem('${THEME_STORAGE_KEY}');if(m==='dark')document.documentElement.classList.add('dark');var t=sessionStorage.getItem('${COLOR_THEME_STORAGE_KEY}');if(!t)t='notebook';if(t!=='neutral')document.documentElement.dataset.colorTheme=t}catch(e){}`,
          }}
        />
      </head>
      <body className={`${geistSans.className} h-full min-h-0 antialiased`}>
        <ThemeProvider>
        <ColorThemeProvider>
        <VantageMotionProvider>
        <Suspense fallback={null}>
          <TrellisProvider>
            <BootstrapSchemas>
              <SessionRoomBootstrap>
                <TooltipProvider>
                  <AppShell>{children}</AppShell>
                  <Toaster position="bottom-right" closeButton />
                </TooltipProvider>
              </SessionRoomBootstrap>
            </BootstrapSchemas>
          </TrellisProvider>
        </Suspense>
        </VantageMotionProvider>
        </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
