import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Protege todo lo que cuelga de /admin (excepto /admin/login). Se ejecuta
 * en el edge, antes de que se renderice cualquier página -- la
 * verificación "de verdad" (la que no se puede saltear) vive además en
 * app/admin/(panel)/layout.tsx, vía supabase.auth.getUser() del lado del
 * servidor. Este archivo vive en lib/supabase/ (no en middleware.ts
 * directamente) siguiendo el mismo criterio que client.ts/server.ts: la
 * lógica de Supabase vive en lib/, middleware.ts solo la invoca.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!user && !isLoginPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    return NextResponse.redirect(loginUrl);
  }

  // Ya con sesión: no tiene sentido volver a mostrarle el formulario de login.
  if (user && isLoginPage) {
    const panelUrl = request.nextUrl.clone();
    panelUrl.pathname = "/admin";
    return NextResponse.redirect(panelUrl);
  }

  return supabaseResponse;
}
