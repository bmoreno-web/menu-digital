"use client";

import React, { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { orderService } from "@/services/orderService";
import { restaurantService } from "@/services/restaurantService";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  TrendingUp,
  ShoppingBag,
  Users,
  Utensils,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function StatisticsDashboardPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeMenu, setActiveMenu] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadStatsData() {
    try {
      const session = await authService.getSession();
      if (session) {
        setRestaurant(session.restaurant);
        const list = await orderService.getOrders(session.restaurant.id);
        setOrders(list);

        const menu = await restaurantService.getActiveMenu(session.restaurant.id);
        setActiveMenu(menu);
      }
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadStatsData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadStatsData();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando estadísticas...</p>
      </div>
    );
  }

  // Calculate Metrics (Section 27)
  const todayStr = new Date().toISOString().split("T")[0];
  const todayOrders = orders.filter((o) => o.created_at.startsWith(todayStr));
  const todaySales = todayOrders.filter((o) => o.status !== "CANCELADO").reduce((acc, o) => acc + Number(o.total_amount), 0);

  // Week calculation (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weekOrders = orders.filter((o) => new Date(o.created_at) >= sevenDaysAgo);
  const weekSales = weekOrders.filter((o) => o.status !== "CANCELADO").reduce((acc, o) => acc + Number(o.total_amount), 0);

  // Products Top Popularity calculation
  const productCounts: Record<string, { count: number; sales: number }> = {};
  orders.forEach((o) => {
    if (o.status === "CANCELADO") return;
    o.items?.forEach((i: any) => {
      if (!productCounts[i.item_name]) {
        productCounts[i.item_name] = { count: 0, sales: 0 };
      }
      productCounts[i.item_name].count += i.quantity;
      productCounts[i.item_name].sales += Number(i.subtotal);
    });
  });

  const topProducts = Object.entries(productCounts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Métricas
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Análisis de Rendimiento
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

      {/* METRICS GRID (Section 27) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pedidos Hoy</span>
              <h3 className="text-2xl font-black text-slate-950">{todayOrders.length}</h3>
              <span className="text-[9px] text-slate-400 font-semibold block">En las últimas 24h</span>
            </div>
            <div className="h-10 w-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Hoy</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950">{formatCurrency(todaySales)}</h3>
              <span className="text-[9px] text-brand-700 bg-brand-50 font-bold px-1.5 py-0.5 rounded inline-block">Sin comisiones</span>
            </div>
            <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pedidos Semana</span>
              <h3 className="text-2xl font-black text-slate-950">{weekOrders.length}</h3>
              <span className="text-[9px] text-slate-400 font-semibold block">Últimos 7 días</span>
            </div>
            <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ventas Semana</span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950">{formatCurrency(weekSales)}</h3>
              <span className="text-[9px] text-slate-400 font-semibold block">Últimos 7 días</span>
            </div>
            <div className="h-10 w-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* TOP PRODUCTS CHART LIST */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <Utensils className="h-4 w-4 text-brand-600" /> Platos Más Vendidos
            </CardTitle>
            <CardDescription>Los preferidos de tus comensales en el período.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-12 italic">Aún no hay platos vendidos.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {topProducts.map((prod, idx) => (
                  <div key={prod.name} className="p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {idx + 1}. {prod.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">{prod.count} porciones vendidas</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-brand-700">{formatCurrency(prod.sales)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* RECURRING CUSTOMERS OVERVIEW */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-slate-950 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-brand-600" /> Análisis de Clientes
            </CardTitle>
            <CardDescription>Resumen de comensales frecuentes.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 flex flex-col justify-center items-center text-center space-y-4 min-h-[220px]">
            <div className="h-14 w-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800">Visualización de Comportamiento</h4>
              <p className="text-[10px] text-slate-500 max-w-xs leading-relaxed">
                El 100% de tus ventas han sido cobradas mediante pago directo (efectivo y transferencias), eliminando las comisiones de terceros.
              </p>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
