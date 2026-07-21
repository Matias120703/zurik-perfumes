import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { createClient } from "@/lib/supabase/server";

/**
 * Segunda barrera de protección, del lado del servidor -- el middleware
 * (src/middleware.ts) ya redirige antes de llegar acá, pero
 * supabase.auth.getUser() es la única verificación que Supabase considera
 * confiable dentro de un Server Component (a diferencia de getSession(),
 * que no revalida el token contra el servidor de Auth). Todo lo que
 * cuelga de (panel) -- Dashboard y las 6 secciones -- pasa por acá; solo
 * /admin/login queda afuera de este layout.
 */
export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  return <AdminShell userEmail={user.email ?? ""}>{children}</AdminShell>;
}
