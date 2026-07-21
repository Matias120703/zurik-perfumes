"use client";

import { useState, type ReactNode } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

/**
 * Único componente que sabe si el drawer mobile está abierto -- ni
 * AdminHeader ni AdminSidebar tienen estado propio, ambos son
 * controlados desde acá (mismo criterio que CatalogResults orquestando
 * CatalogToolbar/ProductGrid en el storefront). No usa un store de
 * Zustand: es un booleano de UI de un solo layout, no estado que otro
 * componente en otra parte del árbol necesite leer.
 */
export function AdminShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />

      <div className="flex min-h-screen flex-col md:pl-[72px] lg:pl-64">
        <AdminHeader userEmail={userEmail} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
