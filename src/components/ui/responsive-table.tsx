import React from "react";
import { cn } from "@/lib/utils";

interface ResponsiveTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveTable({ children, className }: ResponsiveTableProps) {
  return (
    <div className={cn("w-full", className)}>
      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        {children}
      </div>
      
      {/* Mobile view - will be replaced by mobile cards */}
      <div className="md:hidden">
        {children}
      </div>
    </div>
  );
}

interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCard({ children, className }: MobileCardProps) {
  return (
    <div className={cn(
      "bg-card rounded-lg border p-4 space-y-3 mb-3",
      className
    )}>
      {children}
    </div>
  );
}

interface MobileCardRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function MobileCardRow({ label, value, className }: MobileCardRowProps) {
  return (
    <div className={cn("flex justify-between items-start gap-2", className)}>
      <span className="text-sm text-muted-foreground min-w-[100px]">{label}:</span>
      <div className="flex-1 text-sm font-medium text-right">{value}</div>
    </div>
  );
}

interface MobileCardActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardActions({ children, className }: MobileCardActionsProps) {
  return (
    <div className={cn(
      "flex gap-2 pt-3 border-t",
      className
    )}>
      {children}
    </div>
  );
}