import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";

export const metadata: Metadata = {
  title: "Adetunwase Adenle | AI Executive & Brand Assistant",
  description: "Private AI executive and brand assistant for Adetunwase Adenle.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 antialiased flex flex-col md:flex-row h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 min-w-0">
          {children}
        </main>
      </body>
    </html>
  );
}
