/* eslint-disable */
// @ts-nocheck

import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as AuthRouteImport } from "./routes/auth";
import { Route as DashboardRouteImport } from "./routes/dashboard";
import { Route as JobsRouteImport } from "./routes/jobs";

const IndexRoute = IndexRouteImport.update({ id: "/", path: "/", getParentRoute: () => rootRouteImport } as any);
const AuthRoute = AuthRouteImport.update({ id: "/auth", path: "/auth", getParentRoute: () => rootRouteImport } as any);
const DashboardRoute = DashboardRouteImport.update({ id: "/dashboard", path: "/dashboard", getParentRoute: () => rootRouteImport } as any);
const JobsRoute = JobsRouteImport.update({ id: "/jobs", path: "/jobs", getParentRoute: () => rootRouteImport } as any);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
  "/jobs": typeof JobsRoute;
}
export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
  "/jobs": typeof JobsRoute;
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport;
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
  "/jobs": typeof JobsRoute;
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "/" | "/auth" | "/dashboard" | "/jobs";
  fileRoutesByTo: FileRoutesByTo;
  to: "/" | "/auth" | "/dashboard" | "/jobs";
  id: "__root__" | "/" | "/auth" | "/dashboard" | "/jobs";
  fileRoutesById: FileRoutesById;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": { id: "/"; path: "/"; fullPath: "/"; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport };
    "/auth": { id: "/auth"; path: "/auth"; fullPath: "/auth"; preLoaderRoute: typeof AuthRouteImport; parentRoute: typeof rootRouteImport };
    "/dashboard": { id: "/dashboard"; path: "/dashboard"; fullPath: "/dashboard"; preLoaderRoute: typeof DashboardRouteImport; parentRoute: typeof rootRouteImport };
    "/jobs": { id: "/jobs"; path: "/jobs"; fullPath: "/jobs"; preLoaderRoute: typeof JobsRouteImport; parentRoute: typeof rootRouteImport };
  }
}

const rootRouteChildren = { IndexRoute, AuthRoute, DashboardRoute, JobsRoute };

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();
