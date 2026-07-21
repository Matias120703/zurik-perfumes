"use client";

import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { siteConfig } from "@/config/site";

export function AdminHeader({
  userEmail,
  onMenuClick,
}: {
  userEmail: string;
  onMenuClick: () => void;
}) {
  const initials = userEmail.charAt(0).toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Abrir menú"
          onClick={onMenuClick}
        >
          <Menu className="size-5" />
        </Button>
        <span className="text-lg font-semibold text-foreground">{siteConfig.name}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{userEmail}</span>
        <span
          className="flex size-9 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background"
          aria-hidden="true"
        >
          {initials}
        </span>
        <LogoutButton variant="icon" />
      </div>
    </header>
  );
}
