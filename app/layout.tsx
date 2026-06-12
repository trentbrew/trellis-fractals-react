import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TrellisProvider } from "@/lib/trellis/provider";
import { BootstrapSchemas } from "@/components/trellis/bootstrap-schemas";
import { SessionRoomBootstrap } from "@/components/trellis/session-room-bootstrap";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppShell } from "@/components/shell/AppShell";
import { ThemeProvider } from "@/lib/shell/theme";
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
      <body className={`${geistSans.className} h-full min-h-0 antialiased`}>
        <ThemeProvider defaultTheme={theme}>
        <VantageMotionProvider>
        <TrellisProvider>
          <BootstrapSchemas>
            <SessionRoomBootstrap>
              <TooltipProvider>
                <AppShell>{children}</AppShell>
              </TooltipProvider>
            </SessionRoomBootstrap>
          </BootstrapSchemas>
        </TrellisProvider>
        </VantageMotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
