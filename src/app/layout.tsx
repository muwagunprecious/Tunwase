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
    <html lang="en" className="dark">
      <body className="bg-[#0d0f12] text-neutral-100 antialiased flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-[#0f1217]">
          {children}
        </main>
      </body>
    </html>
  );
}
