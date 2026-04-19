"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Settings, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="h-16 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-50 flex items-center justify-between px-6">
      <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
        <div className="h-8 w-8 rounded-full bg-[#0073ea]/10 flex items-center justify-center">
          <Bot className="h-4 w-4 text-[#0073ea]" />
        </div>
        <span className="font-semibold text-lg tracking-tight">BI-Bot</span>
      </Link>

      <nav className="flex items-center gap-1">
        <Link 
          href="/" 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <Link 
          href="/settings" 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            pathname === "/settings" ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Link>
      </nav>
    </header>
  );
}
