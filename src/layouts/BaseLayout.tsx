import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";
import { Toaster } from "@/components/ui/sonner";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col">
      <DragWindowRegion title="vCode" />
      <main className="h-full grow flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
