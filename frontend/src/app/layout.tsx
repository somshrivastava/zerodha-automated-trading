import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import "primereact/resources/themes/lara-light-blue/theme.css"; // theme
import "primereact/resources/primereact.min.css"; // core css
import "primeicons/primeicons.css"; // icons

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Delta Monitor | Options Trading Platform",
  description:
    "Professional options delta monitoring and automated trading alerts",
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
        <div className="min-h-screen flex flex-col bg-gray-50">
          {/* Enhanced Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-5">
            <div className="flex items-center justify-between max-w-7xl mx-auto">
              <div className="flex items-center space-x-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  Zerodha Automated Trading
                </h1>
                {/* <div className="connection-status">
                  <div className="connection-dot"></div>
                  <span className="text-gray-600">Connected</span>
                </div> */}
              </div>
              <div className="text-sm text-gray-500 font-medium"></div>
            </div>
          </header>

          {/* Main Content with improved spacing */}
          <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
            {children}
          </main>

          {/* Enhanced Footer */}
          <footer className="bg-white border-t border-gray-200 px-6 py-5">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-gray-600 font-medium">
                Built by Som Shrivastava
              </div>
              <div className="flex items-center space-x-6">
                <a
                  href="https://github.com/somshrivastava"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  GitHub Profile
                </a>
                <a
                  href="https://github.com/somshrivastava/zerodha-automated-trading"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  Source Code
                </a>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
