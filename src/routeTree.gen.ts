/* eslint-disable */
// @ts-nocheck

import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as AuthRouteImport } from "./routes/auth";
import { Route as DashboardRouteImport } from "./routes/dashboard";

const IndexRoute = IndexRouteImport.update({
  id: "/",
  path: "/",
  getParentRoute: () => rootRouteImport,
} as any);
const AuthRoute = AuthRouteImport.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => rootRouteImport,
} as any);
const DashboardRoute = DashboardRouteImport.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => rootRouteImport,
} as any);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
}
export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport;
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "/" | "/auth" | "/dashboard";
  fileRoutesByTo: FileRoutesByTo;
  to: "/" | "/auth" | "/dashboard";
  id: "__root__" | "/" | "/auth" | "/dashboard";
  fileRoutesById: FileRoutesById;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": {
      id: "/";
      path: "/";
      fullPath: "/";
      preLoaderRoute: typeof IndexRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/auth": {
      id: "/auth";
      path: "/auth";
      fullPath: "/auth";
      preLoaderRoute: typeof AuthRouteImport;
      parentRoute: typeof rootRouteImport;
    };
    "/dashboard": {
      id: "/dashboard";
      path: "/dashboard";
      fullPath: "/dashboard";
      preLoaderRoute: typeof DashboardRouteImport;
      parentRoute: typeof rootRouteImport;
    };
  }
}

const rootRouteChildren = { IndexRoute, AuthRoute, DashboardRoute };

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();
