import type { Metadata } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ClientProviders from "@/components/providers/ClientProviders";

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
      <body className={`${sans.variable} ${mono.variable} font-sans antialiased selection:bg-primary/20 selection:text-primary`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ClientProviders>
            {children}
            {/* Background Gradient Mesh - Theme Aware */}
            <div className="fixed inset-0 z-[-1] bg-background transition-colors duration-500">
              {/* Light mode: Vibrant purple & cyan gradients */}
              {/* Dark mode: Clean Warm Black (No ambient glow) */}
              <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 dark:opacity-0 rounded-full blur-[128px] opacity-30 animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-pink-500/10 dark:opacity-0 rounded-full blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/8 dark:opacity-0 rounded-full blur-[150px] opacity-20" />
            </div>
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
