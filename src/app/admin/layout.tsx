"use client";

import React, { useState } from "react";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { Store, LogOut, ShieldAlert, Menu as MenuIcon, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await authService.logout();
    router.push("/login");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
        {/* MOBILE HEADER */}
        <header className="md:hidden sticky top-0 z-30 w-full h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-3 text-white">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 font-black text-xs active:scale-95 transition-all"
              aria-label="Abrir menú"
            >
              <MenuIcon className="h-4.5 w-4.5 text-brand-400" />
              <span>Menú</span>
            </button>
            <div className="flex items-center gap-1.5">
              <div className="h-7 w-7 rounded-lg bg-brand-600 flex items-center justify-center text-white shrink-0">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-xs tracking-wide">Super Admin</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-rose-400 hover:bg-slate-800 transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* MOBILE DRAWER */}
        {isMobileOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-64 bg-slate-900 text-slate-300 h-full shadow-2xl flex flex-col justify-between z-10 p-4 animate-in slide-in-from-left duration-150">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-black text-white uppercase">Super Admin</h2>
                      <span className="text-[9px] text-slate-500 font-bold block">Control del Sistema</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileOpen(false)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="pt-4 space-y-1">
                  <Link
                    href="/admin/restaurantes"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-xs font-extrabold text-white bg-slate-800 rounded-xl"
                  >
                    <Store className="h-4 w-4 text-brand-400" />
                    <span>Restaurantes</span>
                  </Link>
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between shrink-0">
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
