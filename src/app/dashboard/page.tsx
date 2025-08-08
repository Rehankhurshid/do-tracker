"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Check user role from cookie/token and redirect
    fetch("/api/auth/me", {
      credentials: 'include' // Ensure cookies are sent
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Not authenticated');
        }
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          switch (data.user.role) {
            case "ADMIN":
              router.push("/admin");
              break;
            case "AREA_OFFICE":
              router.push("/area-office");
              break;
            case "PROJECT_OFFICE":
              router.push("/project-office");
              break;
            case "CISF":
              router.push("/cisf");
              break;
            case "ROAD_SALE":
              router.push("/road-sale");
              break;
            default:
              router.push("/login");
          }
        } else {
          router.push("/login");
        }
      })
      .catch((error) => {
        console.error('Auth check failed:', error);
        router.push("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}