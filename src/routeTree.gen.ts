/* eslint-disable */
// @ts-nocheck

import { Route as rootRouteImport } from "./routes/__root";
import { Route as IndexRouteImport } from "./routes/index";
import { Route as AuthRouteImport } from "./routes/auth";
import { Route as ResetPasswordRouteImport } from "./routes/reset-password";
import { Route as DashboardRouteImport } from "./routes/dashboard";
import { Route as DiscoverRouteImport } from "./routes/discover";
import { Route as JobsRouteImport } from "./routes/jobs";
import { Route as ApplicationsRouteImport } from "./routes/applications";
import { Route as ApplicationDetailRouteImport } from "./routes/applications_.$applicationId";
import { Route as DocumentsRouteImport } from "./routes/documents";
import { Route as ProfileRouteImport } from "./routes/profile";
import { Route as SettingsRouteImport } from "./routes/settings";
import { Route as PrepareRouteImport } from "./routes/prepare";
import { Route as AnswersRouteImport } from "./routes/answers";
import { Route as PricingRouteImport } from "./routes/pricing";
import { Route as BillingRouteImport } from "./routes/billing";
import { Route as EmployerRouteImport } from "./routes/employer";
import { Route as InterestsRouteImport } from "./routes/interests";
import { Route as ReviewRouteImport } from "./routes/review";
import { Route as AutomationSettingsRouteImport } from "./routes/automation-settings";
import { Route as AutomationCenterRouteImport } from "./routes/automation-center";
import { Route as ApiStripeWebhookRouteImport } from "./routes/api.stripe.webhook";
import { Route as ApiApplicationMailWebhookRouteImport } from "./routes/api.application-mail.webhook";

const IndexRoute=IndexRouteImport.update({id:"/",path:"/",getParentRoute:()=>rootRouteImport} as any);
const AuthRoute=AuthRouteImport.update({id:"/auth",path:"/auth",getParentRoute:()=>rootRouteImport} as any);
const ResetPasswordRoute=ResetPasswordRouteImport.update({id:"/reset-password",path:"/reset-password",getParentRoute:()=>rootRouteImport} as any);
const DashboardRoute=DashboardRouteImport.update({id:"/dashboard",path:"/dashboard",getParentRoute:()=>rootRouteImport} as any);
const DiscoverRoute=DiscoverRouteImport.update({id:"/discover",path:"/discover",getParentRoute:()=>rootRouteImport} as any);
const JobsRoute=JobsRouteImport.update({id:"/jobs",path:"/jobs",getParentRoute:()=>rootRouteImport} as any);
const ApplicationsRoute=ApplicationsRouteImport.update({id:"/applications",path:"/applications",getParentRoute:()=>rootRouteImport} as any);
const ApplicationDetailRoute=ApplicationDetailRouteImport.update({id:"/applications_/$applicationId",path:"/applications/$applicationId",getParentRoute:()=>rootRouteImport} as any);
const DocumentsRoute=DocumentsRouteImport.update({id:"/documents",path:"/documents",getParentRoute:()=>rootRouteImport} as any);
const ProfileRoute=ProfileRouteImport.update({id:"/profile",path:"/profile",getParentRoute:()=>rootRouteImport} as any);
const SettingsRoute=SettingsRouteImport.update({id:"/settings",path:"/settings",getParentRoute:()=>rootRouteImport} as any);
const PrepareRoute=PrepareRouteImport.update({id:"/prepare",path:"/prepare",getParentRoute:()=>rootRouteImport} as any);
const AnswersRoute=AnswersRouteImport.update({id:"/answers",path:"/answers",getParentRoute:()=>rootRouteImport} as any);
const PricingRoute=PricingRouteImport.update({id:"/pricing",path:"/pricing",getParentRoute:()=>rootRouteImport} as any);
const BillingRoute=BillingRouteImport.update({id:"/billing",path:"/billing",getParentRoute:()=>rootRouteImport} as any);
const EmployerRoute=EmployerRouteImport.update({id:"/employer",path:"/employer",getParentRoute:()=>rootRouteImport} as any);
const InterestsRoute=InterestsRouteImport.update({id:"/interests",path:"/interests",getParentRoute:()=>rootRouteImport} as any);
const ReviewRoute=ReviewRouteImport.update({id:"/review",path:"/review",getParentRoute:()=>rootRouteImport} as any);
const AutomationSettingsRoute=AutomationSettingsRouteImport.update({id:"/automation-settings",path:"/automation-settings",getParentRoute:()=>rootRouteImport} as any);
const AutomationCenterRoute=AutomationCenterRouteImport.update({id:"/automation-center",path:"/automation-center",getParentRoute:()=>rootRouteImport} as any);
const ApiStripeWebhookRoute=ApiStripeWebhookRouteImport.update({id:"/api/stripe/webhook",path:"/api/stripe/webhook",getParentRoute:()=>rootRouteImport} as any);
const ApiApplicationMailWebhookRoute=ApiApplicationMailWebhookRouteImport.update({id:"/api/application-mail/webhook",path:"/api/application-mail/webhook",getParentRoute:()=>rootRouteImport} as any);

export interface FileRoutesByFullPath {
  "/":typeof IndexRoute;"/auth":typeof AuthRoute;"/reset-password":typeof ResetPasswordRoute;"/dashboard":typeof DashboardRoute;"/discover":typeof DiscoverRoute;"/jobs":typeof JobsRoute;"/applications":typeof ApplicationsRoute;"/applications/$applicationId":typeof ApplicationDetailRoute;"/documents":typeof DocumentsRoute;"/profile":typeof ProfileRoute;"/settings":typeof SettingsRoute;"/prepare":typeof PrepareRoute;"/answers":typeof AnswersRoute;"/pricing":typeof PricingRoute;"/billing":typeof BillingRoute;"/employer":typeof EmployerRoute;"/interests":typeof InterestsRoute;"/review":typeof ReviewRoute;"/automation-settings":typeof AutomationSettingsRoute;"/automation-center":typeof AutomationCenterRoute;"/api/stripe/webhook":typeof ApiStripeWebhookRoute;"/api/application-mail/webhook":typeof ApiApplicationMailWebhookRoute;
}
export interface FileRoutesByTo extends FileRoutesByFullPath {}
export interface FileRoutesById {
  __root__:typeof rootRouteImport;"/":typeof IndexRoute;"/auth":typeof AuthRoute;"/reset-password":typeof ResetPasswordRoute;"/dashboard":typeof DashboardRoute;"/discover":typeof DiscoverRoute;"/jobs":typeof JobsRoute;"/applications":typeof ApplicationsRoute;"/applications_/$applicationId":typeof ApplicationDetailRoute;"/documents":typeof DocumentsRoute;"/profile":typeof ProfileRoute;"/settings":typeof SettingsRoute;"/prepare":typeof PrepareRoute;"/answers":typeof AnswersRoute;"/pricing":typeof PricingRoute;"/billing":typeof BillingRoute;"/employer":typeof EmployerRoute;"/interests":typeof InterestsRoute;"/review":typeof ReviewRoute;"/automation-settings":typeof AutomationSettingsRoute;"/automation-center":typeof AutomationCenterRoute;"/api/stripe/webhook":typeof ApiStripeWebhookRoute;"/api/application-mail/webhook":typeof ApiApplicationMailWebhookRoute;
}
export interface FileRouteTypes {
  fileRoutesByFullPath:FileRoutesByFullPath;
  fullPaths:"/"|"/auth"|"/reset-password"|"/dashboard"|"/discover"|"/jobs"|"/applications"|"/applications/$applicationId"|"/documents"|"/profile"|"/settings"|"/prepare"|"/answers"|"/pricing"|"/billing"|"/employer"|"/interests"|"/review"|"/automation-settings"|"/automation-center"|"/api/stripe/webhook"|"/api/application-mail/webhook";
  fileRoutesByTo:FileRoutesByTo;
  to:FileRouteTypes["fullPaths"];
  id:"__root__"|"/"|"/auth"|"/reset-password"|"/dashboard"|"/discover"|"/jobs"|"/applications"|"/applications_/$applicationId"|"/documents"|"/profile"|"/settings"|"/prepare"|"/answers"|"/pricing"|"/billing"|"/employer"|"/interests"|"/review"|"/automation-settings"|"/automation-center"|"/api/stripe/webhook"|"/api/application-mail/webhook";
  fileRoutesById:FileRoutesById;
}

declare module "@tanstack/react-router" {
  interface FileRoutesByPath {
    "/":{id:"/";path:"/";fullPath:"/";preLoaderRoute:typeof IndexRouteImport;parentRoute:typeof rootRouteImport};
    "/auth":{id:"/auth";path:"/auth";fullPath:"/auth";preLoaderRoute:typeof AuthRouteImport;parentRoute:typeof rootRouteImport};
    "/reset-password":{id:"/reset-password";path:"/reset-password";fullPath:"/reset-password";preLoaderRoute:typeof ResetPasswordRouteImport;parentRoute:typeof rootRouteImport};
    "/dashboard":{id:"/dashboard";path:"/dashboard";fullPath:"/dashboard";preLoaderRoute:typeof DashboardRouteImport;parentRoute:typeof rootRouteImport};
    "/discover":{id:"/discover";path:"/discover";fullPath:"/discover";preLoaderRoute:typeof DiscoverRouteImport;parentRoute:typeof rootRouteImport};
    "/jobs":{id:"/jobs";path:"/jobs";fullPath:"/jobs";preLoaderRoute:typeof JobsRouteImport;parentRoute:typeof rootRouteImport};
    "/applications":{id:"/applications";path:"/applications";fullPath:"/applications";preLoaderRoute:typeof ApplicationsRouteImport;parentRoute:typeof rootRouteImport};
    "/applications_/$applicationId":{id:"/applications_/$applicationId";path:"/applications/$applicationId";fullPath:"/applications/$applicationId";preLoaderRoute:typeof ApplicationDetailRouteImport;parentRoute:typeof rootRouteImport};
    "/documents":{id:"/documents";path:"/documents";fullPath:"/documents";preLoaderRoute:typeof DocumentsRouteImport;parentRoute:typeof rootRouteImport};
    "/profile":{id:"/profile";path:"/profile";fullPath:"/profile";preLoaderRoute:typeof ProfileRouteImport;parentRoute:typeof rootRouteImport};
    "/settings":{id:"/settings";path:"/settings";fullPath:"/settings";preLoaderRoute:typeof SettingsRouteImport;parentRoute:typeof rootRouteImport};
    "/prepare":{id:"/prepare";path:"/prepare";fullPath:"/prepare";preLoaderRoute:typeof PrepareRouteImport;parentRoute:typeof rootRouteImport};
    "/answers":{id:"/answers";path:"/answers";fullPath:"/answers";preLoaderRoute:typeof AnswersRouteImport;parentRoute:typeof rootRouteImport};
    "/pricing":{id:"/pricing";path:"/pricing";fullPath:"/pricing";preLoaderRoute:typeof PricingRouteImport;parentRoute:typeof rootRouteImport};
    "/billing":{id:"/billing";path:"/billing";fullPath:"/billing";preLoaderRoute:typeof BillingRouteImport;parentRoute:typeof rootRouteImport};
    "/employer":{id:"/employer";path:"/employer";fullPath:"/employer";preLoaderRoute:typeof EmployerRouteImport;parentRoute:typeof rootRouteImport};
    "/interests":{id:"/interests";path:"/interests";fullPath:"/interests";preLoaderRoute:typeof InterestsRouteImport;parentRoute:typeof rootRouteImport};
    "/review":{id:"/review";path:"/review";fullPath:"/review";preLoaderRoute:typeof ReviewRouteImport;parentRoute:typeof rootRouteImport};
    "/automation-settings":{id:"/automation-settings";path:"/automation-settings";fullPath:"/automation-settings";preLoaderRoute:typeof AutomationSettingsRouteImport;parentRoute:typeof rootRouteImport};
    "/automation-center":{id:"/automation-center";path:"/automation-center";fullPath:"/automation-center";preLoaderRoute:typeof AutomationCenterRouteImport;parentRoute:typeof rootRouteImport};
    "/api/stripe/webhook":{id:"/api/stripe/webhook";path:"/api/stripe/webhook";fullPath:"/api/stripe/webhook";preLoaderRoute:typeof ApiStripeWebhookRouteImport;parentRoute:typeof rootRouteImport};
    "/api/application-mail/webhook":{id:"/api/application-mail/webhook";path:"/api/application-mail/webhook";fullPath:"/api/application-mail/webhook";preLoaderRoute:typeof ApiApplicationMailWebhookRouteImport;parentRoute:typeof rootRouteImport};
  }
}

const rootRouteChildren={IndexRoute,AuthRoute,ResetPasswordRoute,DashboardRoute,DiscoverRoute,JobsRoute,ApplicationsRoute,ApplicationDetailRoute,DocumentsRoute,ProfileRoute,SettingsRoute,PrepareRoute,AnswersRoute,PricingRoute,BillingRoute,EmployerRoute,InterestsRoute,ReviewRoute,AutomationSettingsRoute,AutomationCenterRoute,ApiStripeWebhookRoute,ApiApplicationMailWebhookRoute};
export const routeTree=rootRouteImport._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>();
