"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  Home,
  Package,
  Users,
  Building,
  LogOut,
  FileText,
  AlertCircle,
  Settings,
  Globe,
  ChevronLeft,
  Plus,
  MoreVertical,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { UserRole } from "@/types";
import { cn } from "@/lib/utils";

interface NavigationProps {
  user: {
    username: string;
    email?: string | null;
    role: UserRole;
  };
}

export function Navigation({ user }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const getNavigationItems = () => {
    const baseItems = [
      { label: "Dashboard", href: `/${user.role.toLowerCase().replace('_', '-')}`, icon: Home, mobileOnly: false },
    ];

    const commonEndItems = [
      { label: "Settings", href: "/settings", icon: Settings, mobileOnly: false },
    ];

    switch (user.role) {
      case "ADMIN":
        return [
          ...baseItems,
          { label: "Users", href: "/admin/users", icon: Users, mobileOnly: false },
          { label: "Parties", href: "/admin/parties", icon: Building, mobileOnly: false },
          { label: "Orders", href: "/admin/delivery-orders", icon: Package, mobileOnly: false },
          { label: "Reports", href: "/admin/reports", icon: FileText, mobileOnly: false },
          ...commonEndItems,
        ];
      case "AREA_OFFICE":
        return [
          ...baseItems,
          { label: "Create", href: "/area-office/create", icon: Plus, mobileOnly: false },
          { label: "Process", href: "/area-office/process", icon: Package, mobileOnly: false },
          { label: "Issues", href: "/area-office/issues", icon: AlertCircle, mobileOnly: false },
          ...commonEndItems,
        ];
      case "PROJECT_OFFICE":
        return [
          ...baseItems,
          { label: "Process", href: "/project-office/process", icon: Package, mobileOnly: false },
          { label: "Issues", href: "/project-office/issues", icon: AlertCircle, mobileOnly: false },
          ...commonEndItems,
        ];
      case "CISF":
        return [
          ...baseItems,
          { label: "Process", href: "/cisf/process", icon: Shield, mobileOnly: false },
          { label: "Issues", href: "/cisf/issues", icon: AlertCircle, mobileOnly: false },
          ...commonEndItems,
        ];
      case "ROAD_SALE":
        return [
          ...baseItems,
          { label: "Process", href: "/road-sale/process", icon: Package, mobileOnly: false },
          { label: "Issues", href: "/road-sale/issues", icon: AlertCircle, mobileOnly: false },
          ...commonEndItems,
        ];
      default:
        return [...baseItems, ...commonEndItems];
    }
  };

  const navigationItems = getNavigationItems();
  // Get first 4 items for mobile bottom nav
  const mobileNavItems = navigationItems.slice(0, 4);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/" className="flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          {!sidebarCollapsed && (
            <span className="font-bold text-xl">OrderFlow</span>
          )}
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 space-y-1 p-3">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground",
                sidebarCollapsed && "justify-center"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
        
        <Separator className="my-3" />
        
        <Link
          href="/consumer"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
            sidebarCollapsed && "justify-center"
          )}
          title={sidebarCollapsed ? "Consumer Portal" : undefined}
        >
          <Globe className="h-4 w-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>Consumer Portal</span>}
        </Link>
      </div>

      {/* User Section */}
      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full justify-start gap-3 px-3",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium">{user.username}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            className="w-56" 
            align={sidebarCollapsed ? "center" : "end"}
            side="top"
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.role.replace('_', ' ')}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden md:flex md:flex-col bg-card border-r transition-all duration-300 relative",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarContent />
        
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-sm hover:shadow-md"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className={cn(
            "h-3 w-3 transition-transform",
            sidebarCollapsed && "rotate-180"
          )} />
        </Button>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg">OrderFlow</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.role.replace('_', ' ')}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t">
        <nav className="flex items-center justify-around h-16 px-2">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 transition-all",
                  isActive && "scale-110"
                )} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* More menu for additional items */}
          {navigationItems.length > 4 && (
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="flex flex-col items-center justify-center flex-1 h-full gap-1 p-0"
              >
                <MoreVertical className="h-5 w-5" />
                <span className="text-[10px] font-medium">More</span>
              </Button>
              
              <SheetContent side="bottom" className="h-auto max-h-[80vh]">
                <SheetHeader className="pb-4">
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                
                <div className="grid grid-cols-3 gap-4 pb-6">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-lg transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-6 w-6 mb-2" />
                        <span className="text-xs font-medium text-center">{item.label}</span>
                      </Link>
                    );
                  })}
                  
                  <Link
                    href="/consumer"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center justify-center p-4 rounded-lg hover:bg-accent hover:text-accent-foreground"
                  >
                    <Globe className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center">Consumer</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </nav>
      </div>
    </>
  );
}