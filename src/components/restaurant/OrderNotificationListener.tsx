"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { orderService } from "@/services/orderService";
import {
  playNewOrderSound,
  vibrateDevice,
  requestNotificationPermission,
  isNotificationGranted,
  sendOrderPushNotification,
} from "@/lib/soundNotification";
import { formatCurrency } from "@/lib/utils";
import { Bell, BellRing, Volume2, X, ShoppingBag, ChevronRight } from "lucide-react";

interface Props {
  restaurantId?: string;
  restaurantName?: string;
}

export function OrderNotificationListener({ restaurantId, restaurantName }: Props) {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [latestOrder, setLatestOrder] = useState<any | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Check initial notification permission state
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setHasPermission(Notification.permission === "granted");
      setShowPermissionPrompt(Notification.permission === "default");
    }
  }, []);

  // Handle incoming new order
  const handleIncomingOrder = (order: any) => {
    if (!order || !order.id) return;
    if (knownOrderIdsRef.current.has(order.id)) return;

    knownOrderIdsRef.current.add(order.id);

    // Only alert for NEW orders and not during initial page sync
    if (!isInitialLoadRef.current && order.status === "NUEVO") {
      // 1. Play sound
      playNewOrderSound();

      // 2. Vibrate mobile phone
      vibrateDevice();

      // 3. Send system push notification
      const customer = order.customer_name || "Cliente";
      const total = order.total_amount ? formatCurrency(order.total_amount) : "";
      sendOrderPushNotification(
        "🛎️ ¡Nuevo Pedido Recibido!",
        `Pedido #${order.order_number || ""} de ${customer} (${total})`,
        () => router.push("/app/pedidos")
      );

      // 4. Show on-screen toast alert
      setLatestOrder(order);
    }
  };

  // Realtime listener and Polling fallback
  useEffect(() => {
    if (!restaurantId) return;

    let isMounted = true;

    // Fetch current orders to populate known IDs
    async function initOrders() {
      try {
        const orders = await orderService.getOrders(restaurantId!);
        orders.forEach((o: any) => knownOrderIdsRef.current.add(o.id));
      } catch (err) {
        console.warn("Could not initial fetch orders for notification listener:", err);
      } finally {
        isInitialLoadRef.current = false;
      }
    }

    initOrders();

    // Supabase Realtime channel
    const supabase = createClient();
    const channel = supabase
      .channel(`restaurant_orders_${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          if (isMounted) {
            handleIncomingOrder(payload.new);
          }
        }
      )
      .subscribe();

    // Backup polling check every 7 seconds in case WebSockets drop
    const interval = setInterval(async () => {
      if (!isMounted) return;
      try {
        const currentOrders = await orderService.getOrders(restaurantId);
        currentOrders.forEach((order: any) => {
          if (!knownOrderIdsRef.current.has(order.id)) {
            handleIncomingOrder(order);
          }
        });
      } catch {
        // Ignore polling network issues
      }
    }, 7000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [restaurantId, router]);

  const handleEnableAlerts = async () => {
    // Play test sound to unlock browser AudioContext on user gesture
    playNewOrderSound();
    vibrateDevice([150, 50, 150]);

    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    setShowPermissionPrompt(false);
  };

  return (
    <>
      {/* 1. PERMISSION PROMPT BANNER (Shown once if notifications not yet enabled) */}
      {showPermissionPrompt && (
        <div className="bg-gradient-to-r from-brand-900 to-emerald-900 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 shadow-md z-40 sticky top-0 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <BellRing className="h-4 w-4 text-emerald-300 animate-pulse" />
            </span>
            <p className="font-medium text-slate-200">
              <strong className="text-white font-bold">Activa las alertas: </strong>
              Recibe sonido y aviso en tu celular cada vez que un cliente haga un pedido.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleEnableAlerts}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>Activar Sonido y Avisos</span>
            </button>
            <button
              type="button"
              onClick={() => setShowPermissionPrompt(false)}
              className="p-1 text-slate-400 hover:text-white transition-colors"
              title="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. FLOATING NEW ORDER TOAST (Shown whenever a new order arrives) */}
      {latestOrder && (
        <div className="fixed top-5 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-top-3 duration-300">
          <div className="bg-slate-950 border-2 border-emerald-500 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-500/30 relative overflow-hidden backdrop-blur-md">
            {/* Ambient glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 animate-bounce">
                  <Bell className="h-5 w-5 fill-slate-950" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    ¡Nuevo Pedido Recibido!
                  </span>
                  <h4 className="font-black text-sm text-white">
                    Pedido #{latestOrder.order_number || ""}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLatestOrder(null)}
                className="text-slate-400 hover:text-white p-1"
                title="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="text-slate-300">
                <p className="font-bold text-white truncate max-w-[170px]">
                  {latestOrder.customer_name || "Cliente"}
                </p>
                <p className="text-emerald-400 font-extrabold">
                  {latestOrder.total_amount ? formatCurrency(latestOrder.total_amount) : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setLatestOrder(null);
                  router.push("/app/pedidos");
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-500/25 active:scale-95 transition-all"
              >
                <span>Ver Pedido</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
