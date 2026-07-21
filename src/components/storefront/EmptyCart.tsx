import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";

export function EmptyCart() {
  const { title, description, cta } = siteConfig.cartPage.emptyState;

  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-muted">
        <ShoppingCart aria-hidden="true" className="size-8 text-muted-foreground" />
      </span>

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>

      <Button size="lg" nativeButton={false} render={<Link href="/productos" />}>
        {cta}
      </Button>
    </div>
  );
}
