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
    <div className="flex flex-col flex-1 h-full">
      <main className="flex-1 grow flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-hidden h-full">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
