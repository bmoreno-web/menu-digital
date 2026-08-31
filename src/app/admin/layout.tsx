"use client";

import React from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Store, LogOut, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0">
          <div>
            <div className="p-6 border-b border-slate-800 flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-600/30">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-sm font-black text-white uppercase tracking-wider leading-none">Super Admin</h1>
                <span className="text-[9px] text-slate-500 font-bold block mt-1">Control del Sistema</span>
              </div>
            </div>

            <nav className="p-4 space-y-1">
              <Link
                href="/admin/restaurantes"
                className="flex items-center gap-3 px-4 py-3 text-sm font-extrabold text-white bg-slate-800/80 rounded-xl transition-all"
              >
                <Store className="h-5 w-5 text-brand-500" />
                <span>Restaurantes</span>
              </Link>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-10 w-full overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
