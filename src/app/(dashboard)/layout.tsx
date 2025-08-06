"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navigation } from "@/components/layout/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);

      // Role-based routing
      const rolePaths = {
        ADMIN: "/admin",
        AREA_OFFICE: "/area-office",
        PROJECT_OFFICE: "/project-office",
        ROAD_SALE: "/road-sale",
      };

      const expectedBasePath = rolePaths[data.user.role as keyof typeof rolePaths];
      
      // Check if user is accessing the correct role-based path
      if (expectedBasePath && !pathname.startsWith(expectedBasePath)) {
        router.push(expectedBasePath);
        return;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Navigation user={user} />
      <main className="flex-1 overflow-y-auto bg-background pb-16 md:pb-0">
        <div className="md:hidden h-16" /> {/* Spacer for mobile header */}
        {children}
      </main>
    </div>
  );
}