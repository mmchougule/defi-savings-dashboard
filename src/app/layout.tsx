import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Web3Provider } from "../providers/Web3Provider";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ApiUsageStatus } from "../components/ApiUsageStatus";
import { AaveProviderWrapper } from "../providers/AaveProvider";
import { PrivyProvider } from "../providers/PrivyProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hedge Agent - Prediction Market Portfolio Protection",
  description: "AI-powered hedge recommendations using prediction markets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <PrivyProvider>
            <Web3Provider>
              <AaveProviderWrapper>
                {children}
                {process.env.NODE_ENV === 'development' && <ApiUsageStatus />}
              </AaveProviderWrapper>
            </Web3Provider>
          </PrivyProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
