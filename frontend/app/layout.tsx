import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "../lib/authContext";
import { Navbar } from "../components/Navbar";

export const metadata: Metadata = {
  title: "PorulAxiom | Realistic Stock Paper Trading",
  description: "High-fidelity simulated trading platform with real-time market data, fair return leaderboards, and auditable financial state.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main style={{ minHeight: "calc(100vh - 100px)", padding: "24px 0" }}>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
