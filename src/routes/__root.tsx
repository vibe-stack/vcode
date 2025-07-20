import React from "react";
import BaseLayout from "@/layouts/BaseLayout";
import { Outlet, createRootRoute, useLocation } from "@tanstack/react-router";

export const RootRoute = createRootRoute({
  component: Root,
});

function Root() {
  const location = useLocation();
  
  // Don't apply BaseLayout to workspace routes
  if (location.pathname === '/workspace' || location.pathname.startsWith('/workspace/')) {
    return <Outlet />;
  }
  
  return (
    <BaseLayout>
      <Outlet />
    </BaseLayout>
  );
}
