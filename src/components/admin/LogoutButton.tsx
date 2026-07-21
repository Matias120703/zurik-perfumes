"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

/**
 * Único punto que sabe cerrar sesión -- reutilizado tal cual por la
 * Sidebar (con label) y por el Header (variant más compacta), en vez de
 * repetir supabase.auth.signOut() en dos componentes distintos.
 */
export function LogoutButton({
  variant = "full",
  className,
}: {
  variant?: "full" | "icon";
  className?: string;
}) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar sesión"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={className}
      >
        <LogOut className="size-4" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      className={cn("w-full justify-start gap-3 text-muted-foreground hover:text-foreground", className)}
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      <LogOut className="size-4" />
      {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
    </Button>
  );
}
