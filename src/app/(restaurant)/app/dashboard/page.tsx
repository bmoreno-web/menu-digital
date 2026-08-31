"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { restaurantService } from "@/services/restaurantService";
import { orderService } from "@/services/orderService";
import { subscriptionService } from "@/services/subscriptionService";
import { SITE_CONFIG } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShoppingBag,
  TrendingUp,
  Utensils,
  AlertTriangle,
  Clock,
  Check,
  ChevronRight,
  Loader2,
  RefreshCw,
  Phone,
  MessageSquare,
} from "lucide-react";

export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  async function loadDashboardData() {
    try {
      const session = await authService.getSession();
      if (session) {
        setRestaurant(session.restaurant);
        const menu = await restaurantService.getActiveMenu(session.restaurant.id);
        setActiveMenu(menu);

        const ordersList = await orderService.getOrders(session.restaurant.id);
        setOrders(ordersList);

        const status = await subscriptionService.checkTrialStatus(session.restaurant.id);
        setTrialStatus(status);
      }
    } catch (err) {
      console.error("Error al cargar datos del dashboard:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();

    // Auto-polling for new orders simulation (realtime fallback)
    const interval = setInterval(loadDashboardData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData();
  };

  const handleUpgrade = async () => {
    if (!restaurant) return;
    setIsUpgrading(true);
    try {
      await restaurantService.updateRestaurant(restaurant.id, { plan_tier: "pro" });
      const session = await authService.getSession();
      if (session) {
        setRestaurant(session.restaurant);
      }
      await loadDashboardData();
      alert("¡Suscripción actualizada a Plan Pro con éxito! La recepción de pedidos se encuentra activa.");
    } catch (err) {
      alert("Error al actualizar la suscripción.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      // Local immediate state update for fast UX feedback
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      loadDashboardData();
    } catch (err) {
      alert("No se pudo actualizar el estado del pedido.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando métricas de hoy...</p>
      </div>
    );
  }

  // Calculate stats for HOY (Section 24)
  const todayDateStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayDateStr));
  const activeOrders = todayOrders.filter((o) => o.status !== "ENTREGADO" && o.status !== "CANCELADO");
  
  const todaySalesSum = todayOrders
    .filter((o) => o.status !== "CANCELADO")
    .reduce((acc, o) => acc + Number(o.total_amount), 0);

  const outOfStockItemsCount = activeMenu
    ? activeMenu.items.filter((i: any) => !i.is_available).length
    : 0;

  const recentOrders = orders.slice(0, 5);

  const statusColors: Record<string, "brand" | "warning" | "info" | "success" | "danger" | "neutral"> = {
    NUEVO: "brand",
    ACEPTADO: "info",
    EN_PREPARACION: "warning",
    LISTO: "success",
    ENTREGADO: "neutral",
    CANCELADO: "danger",
  };

  return (
    <div className="space-y-6">

      {/* Trial Plan Warning Banner */}
      {trialStatus && trialStatus.planTier === "free" && (
        trialStatus.active ? (
          <div className="bg-gradient-to-r from-brand-500/10 to-emerald-500/10 border border-brand-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-brand-600 text-white shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">Periodo de Prueba Activo</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Te quedan <strong className="text-brand-700">{trialStatus.daysLeft} días</strong> de prueba y <strong className="text-brand-700">{trialStatus.ordersLeft} pedidos</strong> restantes. Actualiza a Pro para pedidos ilimitados.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-bold gap-1.5 shrink-0 h-9 px-4 rounded-xl"
              onClick={handleUpgrade}
              isLoading={isUpgrading}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Actualizar a Plan Pro</span>
            </Button>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 animate-pulse">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-rose-950 uppercase tracking-wide">¡Prueba Gratis Expirada!</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  {trialStatus.reason === "TRIAL_EXPIRED" 
                    ? "Tu prueba gratuita de 7 días ha finalizado." 
                    : "Has alcanzado el límite de 30 pedidos de prueba."} Tu restaurante ya no puede recibir nuevos pedidos en línea. Actualiza a Pro para reactivar el servicio.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white border-transparent gap-1.5 shrink-0 h-9 px-4 rounded-xl"
              onClick={handleUpgrade}
              isLoading={isUpgrading}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Activar Plan Pro</span>
            </Button>
          </div>
        )
      )}
      
      {/* HEADER WITH REFRESH */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Métricas de Hoy
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Resumen Operativo
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5"
          isLoading={isRefreshing}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* METRIC CARDS GRID (Section 24) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* PEDIDOS HOY */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pedidos Hoy</p>
              <h3 className="text-2xl font-black text-slate-950 mt-1">{todayOrders.length}</h3>
              {activeOrders.length > 0 && (
                <span className="text-[9px] font-bold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                  {activeOrders.length} Activos
                </span>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* VENTAS HOY */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ventas Hoy</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">
                {formatCurrency(todaySalesSum)}
              </h3>
              <span className="text-[9px] text-slate-500 font-semibold mt-1 inline-block">Sin comisiones</span>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* MENÚ DE HOY ESTADO */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menú de Hoy</p>
              {activeMenu ? (
                <div className="mt-1">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    activeMenu.status === "PUBLISHED"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {activeMenu.status === "PUBLISHED" ? "Publicado" : "Borrador"}
                  </span>
                  <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[120px] mt-1.5">
                    {activeMenu.title}
                  </p>
                </div>
              ) : (
                <div className="mt-1">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    Sin Crear
                  </span>
                  <Link href="/app/menu" className="block text-[9px] text-brand-700 font-bold hover:underline mt-1.5">
                    Crear menú del día →
                  </Link>
                </div>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Utensils className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* PLATOS AGOTADOS */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agotados Hoy</p>
              <h3 className="text-2xl font-black text-slate-950 mt-1">{outOfStockItemsCount}</h3>
              <Link href="/app/menu" className="text-[9px] text-slate-500 font-bold hover:underline mt-1 inline-block">
                Ajustar disponibilidad
              </Link>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* RECENT ORDERS PANEL (Section 24 & 25) */}
      <Card className="border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Pedidos Recientes
          </h3>
          <Link
            href="/app/pedidos"
            className="text-xs font-bold text-brand-700 hover:text-brand-800 flex items-center gap-0.5"
          >
            Ver todos los pedidos <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <CardContent className="p-0">
          {recentOrders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">Aún no hay pedidos registrados</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Los pedidos de tus comensales aparecerán aquí de forma automática y en tiempo real.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentOrders.map((order) => (
                <div key={order.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Customer info & items */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-950">
                        Pedido #{order.order_number}
                      </span>
                      <Badge variant={statusColors[order.status]} size="sm" dot pulse={order.status === "NUEVO"}>
                        {order.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-700 font-semibold">
                      {order.customer_name} • <span className="text-slate-500">{order.customer_phone}</span>
                    </div>

                    {/* Order summary string */}
                    <div className="text-[11px] text-slate-500 font-medium max-w-md truncate">
                      {order.items?.map((i: any) => `${i.quantity}x ${i.item_name}`).join(", ")}
                    </div>
                  </div>

                  {/* Actions & amounts */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100/60">
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-slate-400 font-bold uppercase block tracking-wider">
                        Total
                      </span>
                      <span className="text-sm font-black text-brand-700">
                        {formatCurrency(order.total_amount)}
                      </span>
                    </div>

                    {/* Quick controls */}
                    <div className="flex items-center gap-1.5">
                      {order.status === "NUEVO" && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="h-9 px-3 rounded-lg text-xs"
                          onClick={() => handleUpdateStatus(order.id, "ACEPTADO")}
                        >
                          Aceptar
                        </Button>
                      )}
                      {order.status === "ACEPTADO" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 px-3 rounded-lg text-xs bg-amber-500 hover:bg-amber-600 text-slate-950"
                          onClick={() => handleUpdateStatus(order.id, "EN_PREPARACION")}
                        >
                          Preparar
                        </Button>
                      )}
                      {order.status === "EN_PREPARACION" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 px-3 rounded-lg text-xs bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleUpdateStatus(order.id, "LISTO")}
                        >
                          Listo
                        </Button>
                      )}
                      {order.status === "LISTO" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-9 px-3 rounded-lg text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleUpdateStatus(order.id, "ENTREGADO")}
                        >
                          Entregar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
