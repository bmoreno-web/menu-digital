"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AuthGuard } from "@/components/layout/AuthGuard";
import { authService } from "@/services/authService";
import { SITE_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import {
  UtensilsCrossed,
  LayoutDashboard,
  Menu as MenuIcon,
  ShoppingBag,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Bell,
  Clock,
  ExternalLink,
  MessageSquare,
  X,
} from "lucide-react";

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const session = await authService.getSession();
      if (session) {
        setUser(session.user);
        setRestaurant(session.restaurant);
      }
    }
    loadData();

    // Refresh layout data if configs change
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await authService.logout();
    router.replace("/login");
  };

  const navItems = [
    { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
    { label: "Menú Diario", href: "/app/menu", icon: MenuIcon },
    { label: "Pedidos", href: "/app/pedidos", icon: ShoppingBag },
    { label: "Clientes", href: "/app/clientes", icon: Users },
    { label: "Estadísticas", href: "/app/estadisticas", icon: BarChart3 },
    { label: "Configuración", href: "/app/configuracion", icon: Settings },
  ];

  return (
    <AuthGuard>
      {/* SUPER ADMIN ACTIVE BANNER */}
      {user?.role === "SUPER_ADMIN" && (
        <div className="bg-amber-400 text-slate-950 px-4 py-2 text-xs font-black flex flex-wrap items-center justify-between shadow-sm border-b border-amber-500/40 z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-400 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-extrabold">
              Super Admin
            </span>
            <span>
              Gestionando: <strong>{restaurant?.name || "Restaurante"}</strong>
            </span>
          </div>
          <Link
            href="/admin/restaurantes"
            className="inline-flex items-center gap-1 bg-slate-950 text-white hover:bg-slate-800 px-3 py-1 rounded-lg text-[11px] font-extrabold transition-all shadow"
          >
            ← Volver a Consola Admin
          </Link>
        </div>
      )}

      {/* PENDING APPROVAL BANNER FOR RESTAURANT OWNER */}
      {restaurant && !restaurant.is_active && user?.role !== "SUPER_ADMIN" && (
        <div className="bg-amber-400 text-slate-950 px-4 py-3 text-xs font-bold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 shadow-sm border-b border-amber-500 z-40 sticky top-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 shrink-0 text-slate-950" />
            <span>
              <strong>Cuenta en Proceso de Activación:</strong> Tu restaurante está en proceso de verificación por el equipo de Menú Digital.
            </span>
          </div>
          <a
            href={`https://wa.me/573001234567?text=${encodeURIComponent(
              `Hola, acabo de registrar mi restaurante "${restaurant?.name}" en Menú Digital. ¿Podrían activar mi cuenta para comenzar a vender por favor?`
            )}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950 text-white hover:bg-slate-900 text-xs font-black shrink-0 transition-colors shadow-xs"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Pedir Activación por WhatsApp</span>
          </a>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row pb-20 md:pb-0">
        
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shrink-0">
          {/* Logo Brand */}
          <div className="h-16 border-b border-slate-100 flex items-center px-6 gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20">
              <UtensilsCrossed className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm text-slate-900 leading-none truncate max-w-[170px]">
                {restaurant?.name || SITE_CONFIG.name}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Panel de Control
              </span>
            </div>
          </div>

          {/* Restaurant Profile summary */}
          {restaurant && (
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-sm">
                  {restaurant.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-950 truncate">{restaurant.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium truncate">r/{restaurant.slug}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <Link
                  href={`/r/${restaurant.slug}`}
                  target="_blank"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 text-[10px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 py-1.5 rounded-lg transition-colors"
                >
                  <ExternalLink className="h-3 w-3" /> Ver Sitio Público
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* PWA Install shortcut */}
          <div className="px-4 pb-2">
            <InstallPwaButton variant="button" label="📱 Añadir Icono al Celular" className="w-full justify-center bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200" />
          </div>

          {/* Logout controls */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="h-4.5 w-4.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* MOBILE HEADER */}
        <header className="md:hidden sticky top-0 z-30 w-full h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-1.5 -ml-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
            <div className="h-8 w-8 rounded-lg bg-brand-600 text-white flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            {restaurant && (
              <span className="font-extrabold text-xs text-slate-900 truncate max-w-[150px]">
                {restaurant.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {restaurant && (
              <Link
                href={`/r/${restaurant.slug}`}
                target="_blank"
                className="p-2 text-slate-500 hover:text-brand-600"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="p-2 text-rose-600"
              title="Cerrar Sesión"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* MAIN PAGE CONTAINER */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-5xl mx-auto w-full overflow-y-auto">
          {children}
        </main>

        {/* MOBILE NAVIGATION BAR (BOTTOM FIXED) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white border-t border-slate-200 flex justify-around items-center px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-semibold transition-all ${
                  isActive ? "text-brand-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className={`h-5 w-5 mb-0.5 ${isActive ? "text-brand-600" : "text-slate-400"}`} />
                <span>{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </nav>

        {/* MOBILE DRAWER */}
        {isMobileDrawerOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
              onClick={() => setIsMobileDrawerOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 truncate max-w-[150px]">
                      {restaurant?.name || SITE_CONFIG.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Panel de Control</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Nav links */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Public link and PWA */}
              <div className="p-3 border-t border-slate-100 space-y-2 bg-slate-50/50">
                {restaurant && (
                  <Link
                    href={`/r/${restaurant.slug}`}
                    target="_blank"
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 py-2 rounded-xl transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Ver Menú Público
                  </Link>
                )}
                <InstallPwaButton
                  variant="button"
                  label="📱 Añadir Icono al Celular"
                  className="w-full justify-center bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200 text-xs"
                />
                <button
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AuthGuard>
  );
}
