"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href;

  const base =
    "relative flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground transition-all duration-200";

  const hover =
    "hover:text-foreground hover:bg-muted/60 hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.25)] dark:hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.15)]";

  const active =
    "bg-primary/10 text-primary font-semibold border border-primary/20 shadow-[0_0_8px_-1px_rgba(59,130,246,0.25)] dark:shadow-[0_0_8px_-1px_rgba(59,130,246,0.15)]";

  return (
    <Link
      href={href}
      className={cn(base, hover, isActive && active)}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
      {/* Decorative glow bar on active item */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[2px] bg-primary rounded-r-sm" />
      )}
    </Link>
  );
}
