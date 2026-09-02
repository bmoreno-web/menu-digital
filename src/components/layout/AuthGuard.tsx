"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authService } from "@/services/authService";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { SITE_CONFIG } from "@/config/site";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const session = await authService.getSession();
        if (!session) {
          setIsAuthenticated(false);
          router.replace("/login");
        } else {
          setSessionData(session);
          setIsAuthenticated(true);
          
          // Role-based route guard
          if (pathname.startsWith("/admin") && session.user.role !== "SUPER_ADMIN") {
            router.replace("/app/menu");
          }
        }
      } catch {
        setIsAuthenticated(false);
        router.replace("/login");
      }
    }

    checkAuth();
  }, [router, pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center space-y-4 z-50">
        <div className="h-12 w-12 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30 animate-pulse">
          <UtensilsCrossed className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
          <span>Verificando Sesión en {SITE_CONFIG.name}...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirecting...
  }

  // Inject session data to children if needed via cloning or standard context,
  // or components can fetch from authService/localStorage.
  return <>{children}</>;
}
