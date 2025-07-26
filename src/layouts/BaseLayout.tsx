import React from "react";
import AppHeader from "@/components/AppHeader";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/realtime";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <AppHeader title="vibes" />
      <main className="h-full grow flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
