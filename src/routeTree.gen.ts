/* eslint-disable */
// @ts-nocheck

import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as AuthRouteImport } from "./routes/auth";
import { Route as DashboardRouteImport } from "./routes/dashboard";
import { Route as JobsRouteImport } from "./routes/jobs";
import { Route as ApplicationsRouteImport } from "./routes/applications";
import { Route as DocumentsRouteImport } from "./routes/documents";

const IndexRoute = IndexRouteImport.update({ id: "/", path: "/", getParentRoute: () => rootRouteImport } as any);
const AuthRoute = AuthRouteImport.update({ id: "/auth", path: "/auth", getParentRoute: () => rootRouteImport } as any);
const DashboardRoute = DashboardRouteImport.update({ id: "/dashboard", path: "/dashboard", getParentRoute: () => rootRouteImport } as any);
const JobsRoute = JobsRouteImport.update({ id: "/jobs", path: "/jobs", getParentRoute: () => rootRouteImport } as any);
const ApplicationsRoute = ApplicationsRouteImport.update({ id: "/applications", path: "/applications", getParentRoute: () => rootRouteImport } as any);
const DocumentsRoute = DocumentsRouteImport.update({ id: "/documents", path: "/documents", getParentRoute: () => rootRouteImport } as any);

export interface FileRoutesByFullPath {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
  "/jobs": typeof JobsRoute;
  "/applications": typeof ApplicationsRoute;
  "/documents": typeof DocumentsRoute;
}
export interface FileRoutesByTo {
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
  "/jobs": typeof JobsRoute;
  "/applications": typeof ApplicationsRoute;
  "/documents": typeof DocumentsRoute;
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport;
  "/": typeof IndexRoute;
  "/auth": typeof AuthRoute;
  "/dashboard": typeof DashboardRoute;
  "/jobs": typeof JobsRoute;
  "/applications": typeof ApplicationsRoute;
  "/documents": typeof DocumentsRoute;
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths: "/" | "/auth" | "/dashboard" | "/jobs" | "/applications" | "/documents";
  fileRoutesByTo: FileRoutesByTo;
  to: "/" | "/auth" | "/dashboard" | "/jobs" | "/applications" | "/documents";
  id: "__root__" | "/" | "/auth" | "/dashboard" | "/jobs" | "/applications" | "/documents";
  fileRoutesById: FileRoutesById;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/": { id: "/"; path: "/"; fullPath: "/"; preLoaderRoute: typeof IndexRouteImport; parentRoute: typeof rootRouteImport };
    "/auth": { id: "/auth"; path: "/auth"; fullPath: "/auth"; preLoaderRoute: typeof AuthRouteImport; parentRoute: typeof rootRouteImport };
    "/dashboard": { id: "/dashboard"; path: "/dashboard"; fullPath: "/dashboard"; preLoaderRoute: typeof DashboardRouteImport; parentRoute: typeof rootRouteImport };
    "/jobs": { id: "/jobs"; path: "/jobs"; fullPath: "/jobs"; preLoaderRoute: typeof JobsRouteImport; parentRoute: typeof rootRouteImport };
    "/applications": { id: "/applications"; path: "/applications"; fullPath: "/applications"; preLoaderRoute: typeof ApplicationsRouteImport; parentRoute: typeof rootRouteImport };
    "/documents": { id: "/documents"; path: "/documents"; fullPath: "/documents"; preLoaderRoute: typeof DocumentsRouteImport; parentRoute: typeof rootRouteImport };
  }
}

const rootRouteChildren = { IndexRoute, AuthRoute, DashboardRoute, JobsRoute, ApplicationsRoute, DocumentsRoute };

export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();
