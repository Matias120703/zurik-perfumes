"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgePercent,
  Boxes,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Productos", href: "/admin/productos", icon: Package },
  { label: "Categorías", href: "/admin/categorias", icon: Tags },
  { label: "Inventario", href: "/admin/inventario", icon: Boxes },
  { label: "Pedidos", href: "/admin/pedidos", icon: ShoppingCart },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Promociones", href: "/admin/promociones", icon: BadgePercent },
  { label: "Logística", href: "/admin/logistica", icon: Truck },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings },
];

function NavLinks({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              collapsed && "justify-center",
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="size-5 shrink-0" aria-hidden="true" />
            {!collapsed ? <span>{item.label}</span> : <span className="sr-only">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Tres variantes, un solo listado de navegación (NavLinks): fija en
 * desktop, colapsada a íconos en tablet, y como Sheet (mismo componente
 * que ya usa el Header del storefront para su menú mobile) en mobile. Se
 * coordina con AdminShell vía mobileOpen/onMobileOpenChange -- la Sidebar
 * no decide cuándo abrirse, solo refleja el estado que le pasan.
 */
export function AdminSidebar({
  mobileOpen,
  onMobileOpenChange,
}: {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      {/* Desktop: fija, con labels */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-background">
        <div className="flex h-16 items-center border-b border-border px-6">
          <span className="text-sm font-semibold text-muted-foreground">Panel administrativo</span>
        </div>
        <NavLinks />
        <div className="border-t border-border p-3">
          <LogoutButton />
        </div>
      </aside>

      {/* Tablet: colapsada a íconos */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-20 md:flex md:w-[72px] md:flex-col md:items-center md:border-r md:border-border md:bg-background lg:hidden">
        <div className="flex h-16 w-full items-center justify-center border-b border-border">
          <span className="size-2 rounded-full bg-foreground" aria-hidden="true" />
        </div>
        <div className="w-full flex-1">
          <NavLinks collapsed />
        </div>
        <div className="w-full border-t border-border p-2">
          <LogoutButton variant="icon" className="mx-auto flex" />
        </div>
      </aside>

      {/* Mobile: drawer */}
      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="h-16 justify-center border-b border-border">
            <SheetTitle>Panel administrativo</SheetTitle>
          </SheetHeader>
          <NavLinks onNavigate={() => onMobileOpenChange(false)} />
          <div className="border-t border-border p-3">
            <LogoutButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
