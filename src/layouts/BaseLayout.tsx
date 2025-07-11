import React from "react";
import DragWindowRegion from "@/components/DragWindowRegion";

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DragWindowRegion title="Grok IDE" />
      <main className="h-screen flex flex-col overflow-hidden pb-8">
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </>
  );
}
