import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Solo corre sobre el panel administrativo -- la tienda pública no tiene
  // login ni necesita que este middleware la toque.
  matcher: ["/admin/:path*"],
};
