import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ClientProviders from "@/components/providers/ClientProviders";
import { AtmosphereBackground } from "@/components/dashboard/AtmosphereBackground";

const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const sans = Outfit({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "AirPulse - Terminal",
  description: "Advanced Pollution Governance System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased selection:bg-primary/20 selection:text-primary bg-[#020617]`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientProviders>
            <AtmosphereBackground />
            {children}
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
