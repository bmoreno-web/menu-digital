"use client";

import React, { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { orderService } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ShoppingBag,
  Clock,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle,
  XCircle,
  Truck,
  Store,
  ChevronDown,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function OrdersManagementPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("TODOS");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadOrdersData() {
    try {
      const session = await authService.getSession();
      if (session) {
        setRestaurant(session.restaurant);
        const list = await orderService.getOrders(session.restaurant.id);
        setOrders(list);
      }
    } catch (err) {
      console.error("Error al cargar pedidos:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrdersData();
    // Realtime polling check
    const interval = setInterval(loadOrdersData, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadOrdersData();
  };

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      // Fast UI state update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status } : o))
      );
      loadOrdersData();
    } catch {
      alert("Error al actualizar el estado del pedido.");
    }
  };

  const getFilteredOrders = () => {
    if (activeTab === "TODOS") return orders;
    if (activeTab === "NUEVO") return orders.filter((o) => o.status === "NUEVO");
    if (activeTab === "EN_PREPARACION") return orders.filter((o) => o.status === "EN_PREPARACION" || o.status === "ACEPTADO");
    if (activeTab === "LISTO") return orders.filter((o) => o.status === "LISTO");
    if (activeTab === "ENTREGADO") return orders.filter((o) => o.status === "ENTREGADO");
    if (activeTab === "CANCELADO") return orders.filter((o) => o.status === "CANCELADO");
    return orders;
  };

  const tabs = [
    { id: "TODOS", label: "Todos" },
    { id: "NUEVO", label: "Nuevos", count: orders.filter((o) => o.status === "NUEVO").length },
    { id: "EN_PREPARACION", label: "Cocina", count: orders.filter((o) => o.status === "EN_PREPARACION" || o.status === "ACEPTADO").length },
    { id: "LISTO", label: "Listos", count: orders.filter((o) => o.status === "LISTO").length },
    { id: "ENTREGADO", label: "Entregados" },
    { id: "CANCELADO", label: "Cancelados" },
  ];

  const filteredOrders = getFilteredOrders();

  const statusColors: Record<string, "brand" | "warning" | "info" | "success" | "danger" | "neutral"> = {
    NUEVO: "brand",
    ACEPTADO: "info",
    EN_PREPARACION: "warning",
    LISTO: "success",
    ENTREGADO: "neutral",
    CANCELADO: "danger",
  };

  // Helper helper to generate custom WhatsApp update messages
  const getWhatsAppMessage = (order: any) => {
    let msg = `¡Hola ${order.customer_name}! Te saludamos de ${restaurant?.name}. `;
    if (order.status === "ACEPTADO") msg += `Tu pedido #${order.order_number} ha sido aceptado y ya va para la cocina.`;
    else if (order.status === "EN_PREPARACION") msg += `Tu pedido #${order.order_number} está en preparación en nuestra cocina.`;
    else if (order.status === "LISTO") msg += `Tu pedido #${order.order_number} está listo. ${order.delivery_type === "DOMICILIO" ? "Va en camino a tu dirección." : "Puedes pasar a retirarlo."}`;
    else if (order.status === "ENTREGADO") msg += `Tu pedido #${order.order_number} ha sido entregado. ¡Gracias por tu compra!`;
    return `https://wa.me/${order.customer_phone.replace(/\+/g, "")}?text=${encodeURIComponent(msg)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Operaciones
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Gestión de Pedidos
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

      {/* FILTER TABS (Section 25) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3.5 py-2.5 rounded-t-xl font-bold transition-all shrink-0 border-b-2 -mb-[2px] ${
              activeTab === tab.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 bg-brand-600 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
            <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No hay pedidos en esta categoría</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Cuando tus clientes pidan desde el código QR o enlace web, aparecerán organizados en este tablero.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
              <CardContent className="p-4 sm:p-5 space-y-4">
                
                {/* Header line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-950">
                        Pedido #{order.order_number}
                      </span>
                      <Badge variant={statusColors[order.status]} size="sm">
                        {order.status}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-bold">
                      {order.customer_name} • <span className="text-slate-500">{order.customer_phone}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block leading-none">
                      Total Cobrado
                    </span>
                    <span className="text-base font-black text-brand-700 mt-1 block">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Delivery details and notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {order.delivery_type === "DOMICILIO" ? (
                        <>
                          <Truck className="h-4 w-4 text-brand-600 shrink-0" />
                          <span>Envío a Domicilio {order.delivery_fee > 0 && `(${formatCurrency(order.delivery_fee)})`}</span>
                        </>
                      ) : (
                        <>
                          <Store className="h-4 w-4 text-brand-600 shrink-0" />
                          <span>Llevar / Recoger en local</span>
                        </>
                      )}
                    </div>

                    {order.delivery_type === "DOMICILIO" && order.delivery_address && (
                      <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                        <span className="text-slate-800 font-bold leading-tight">{order.delivery_address}</span>
                      </div>
                    )}
                  </div>

                  {order.delivery_notes && (
                    <div className="bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-amber-800">
                      <span className="text-[9px] font-black uppercase tracking-wider block">Nota del Cliente:</span>
                      <p className="mt-0.5 font-medium leading-tight">{order.delivery_notes}</p>
                    </div>
                  )}
                </div>

                {/* Plates listing */}
                <div className="bg-slate-50/60 p-3 rounded-2xl border border-slate-100 space-y-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Platos del pedido</span>
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-800">
                        {item.quantity}x {item.item_name} <span className="text-[10px] text-slate-400">({item.category_name})</span>
                      </span>
                      {item.notes && <span className="text-[10px] text-amber-700 italic ml-2">({item.notes})</span>}
                      <span className="text-slate-900">{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Operations quick actions (Section 25) */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
                  {/* WhatsApp contact */}
                  <a
                    href={getWhatsAppMessage(order)}
                    target="_blank"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors"
                  >
                    <MessageSquare className="h-4 w-4" /> Notificar WhatsApp
                  </a>

                  {/* Status workflow triggers */}
                  <div className="flex items-center gap-2">
                    {order.status === "NUEVO" && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:bg-rose-50 text-xs font-bold px-3"
                          onClick={() => handleUpdateStatus(order.id, "CANCELADO")}
                        >
                          <XCircle className="h-4 w-4 mr-1" /> Cancelar
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-xs font-bold h-9 px-4"
                          onClick={() => handleUpdateStatus(order.id, "ACEPTADO")}
                        >
                          Aceptar Pedido
                        </Button>
                      </>
                    )}

                    {order.status === "ACEPTADO" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold h-9 px-4"
                        onClick={() => handleUpdateStatus(order.id, "EN_PREPARACION")}
                      >
                        Preparar
                      </Button>
                    )}

                    {order.status === "EN_PREPARACION" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold h-9 px-4"
                        onClick={() => handleUpdateStatus(order.id, "LISTO")}
                      >
                        Listo
                      </Button>
                    )}

                    {order.status === "LISTO" && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4"
                        onClick={() => handleUpdateStatus(order.id, "ENTREGADO")}
                      >
                        Entregar
                      </Button>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
