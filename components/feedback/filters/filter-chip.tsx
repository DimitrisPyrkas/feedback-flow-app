"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type FilterChipProps = {
  label: string;
  param: string;
  value?: string;      
  isDefault?: boolean; 
};

export function FilterChip({
  label,
  param,
  value,
  isDefault = false,
}: FilterChipProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const current = searchParams.get(param);

  const selected = isDefault
    ? !current || current === "" || current === "all"
    : current === value;

  function handleClick() {
    const sp = new URLSearchParams(searchParams.toString());

    if (isDefault) {
      // "All" reset this filter
      if (current) {
        sp.delete(param);
      }
    } else {
      if (current === value) {
        // clicking the same chip again -> clear filter
        sp.delete(param);
      } else if (value) {
        // set this filter
        sp.set(param, value);
      }
    }

    // whenever filters change, reset pagination
    sp.delete("page");

    const qs = sp.toString();
    router.push(qs ? `/feedback?${qs}` : "/feedback");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "px-3 py-1 rounded-full text-xs border transition-colors",
        selected
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground hover:bg-muted"
      )}
    >
      {label}
    </button>
  );
}
