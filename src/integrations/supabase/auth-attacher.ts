import { createMiddleware } from "@tanstack/react-start";

import { supabase } from "./client";

/** Attach the signed-in user's bearer token to TanStack server-function RPCs. */
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  },
);
