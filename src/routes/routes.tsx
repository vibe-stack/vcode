
import React, { Suspense } from "react";
import { createRoute } from "@tanstack/react-router";
import { RootRoute } from "./__root";

const LazyHomePage = React.lazy(() => import("../pages/home"));
const LazyWorkspacePage = React.lazy(() => import("@/pages/workspace"));
const LazyScreenRecorder = React.lazy(() => import("@/pages/apps").then(mod => ({ default: mod.ScreenRecorder })));
const LazyMapBuilderPage = React.lazy(() => import("@/pages/apps/map-builder"));


// TODO: Steps to add a new route:
// 1. Create a new page component in the '../pages/' directory (e.g., NewPage.tsx)
// 2. Import the new page component at the top of this file
// 3. Define a new route for the page using createRoute()
// 4. Add the new route to the routeTree in RootRoute.addChildren([...])
// 5. Add a new Link in the navigation section of RootRoute if needed

// Example of adding a new route:
// 1. Create '../pages/NewPage.tsx'
// 2. Import: import NewPage from '../pages/NewPage';
// 3. Define route:
//    const NewRoute = createRoute({
//      getParentRoute: () => RootRoute,
//      path: '/new',
//      component: NewPage,
//    });
// 4. Add to routeTree: RootRoute.addChildren([HomeRoute, NewRoute, ...])
// 5. Add Link: <Link to="/new">New Page</Link>

export const HomeRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={null}>
      <LazyHomePage />
    </Suspense>
  ),
});

export const WorkspaceRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/workspace",
  component: () => (
    <Suspense fallback={null}>
      <LazyWorkspacePage />
    </Suspense>
  ),
});

export const ScreenRecorderRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/apps/screen-recorder",
  component: () => (
    <Suspense fallback={null}>
      <LazyScreenRecorder />
    </Suspense>
  ),
});

export const MapBuilderRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: "/apps/map-builder",
  component: () => (
    <Suspense fallback={null}>
      <LazyMapBuilderPage />
    </Suspense>
  ),
});

export const rootTree = RootRoute.addChildren([
  HomeRoute, 
  WorkspaceRoute,
  ScreenRecorderRoute,
  MapBuilderRoute
]);
