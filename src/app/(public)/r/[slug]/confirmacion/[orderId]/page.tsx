"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { restaurantService } from "@/services/restaurantService";
import { orderService } from "@/services/orderService";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  UtensilsCrossed,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  MessageSquare,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function OrderConfirmationPage() {
  const params = useParams();
  const slug = params.slug as string;
  const orderId = params.orderId as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadOrderDetails() {
    try {
      const profile = await restaurantService.getProfile(slug);
      setRestaurant(profile);

      const orderData = await orderService.getOrderById(orderId);
      if (!orderData) {
        setError("El pedido solicitado no existe.");
      } else {
        setOrder(orderData);
      }
    } catch {
      setError("Error al cargar la información de confirmación.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadOrderDetails();

    // 1. Realtime updates fallback for Mock Mode (Simulated via custom local events)
    const handleLocalUpdate = (e: Event) => {
      const nextStatus = (e as CustomEvent).detail;
      setOrder((prev: any) => (prev ? { ...prev, status: nextStatus } : prev));
      
      // Trigger success confetti if state becomes LISTO or ENTREGADO
      if (nextStatus === "LISTO" || nextStatus === "ENTREGADO") {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }
    };

    window.addEventListener(`order_update_${orderId}`, handleLocalUpdate);

    // 2. Poll every 5 seconds as fallback for both mock and real db connection
    const interval = setInterval(loadOrderDetails, 5000);

    return () => {
      window.removeEventListener(`order_update_${orderId}`, handleLocalUpdate);
      clearInterval(interval);
    };
  }, [slug, orderId]);

  // Launch initial confetti on load for NUEVO order
  useEffect(() => {
    if (order && order.status === "NUEVO" && !isLoading) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }
  }, [order, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando estado del pedido...</p>
      </div>
    );
  }

  if (error || !order || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Pedido no encontrado</h2>
        <p className="text-xs text-slate-500 max-w-xs">{error || "La orden solicitada es incorrecta."}</p>
        <Link href={`/r/${slug}`}>
          <Button variant="primary" size="sm">Ir al Menú</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { label: "NUEVO", title: "Enviado", desc: "Esperando confirmación de la cocina" },
    { label: "ACEPTADO", title: "Aceptado", desc: "El restaurante recibió tu pedido" },
    { label: "EN_PREPARACION", title: "Preparando", desc: "Tu almuerzo se está cocinando" },
    { label: "LISTO", title: "Listo", desc: "Listo para despachar o retirar" },
    { label: "ENTREGADO", title: "Entregado", desc: "¡Buen provecho!" },
  ];

  const getStepIndex = (status: string) => {
    return steps.findIndex((s) => s.label === status);
  };

  const currentStepIdx = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12 selection:bg-brand-500 selection:text-white">
      <header className="sticky top-0 z-30 w-full h-14 bg-white border-b border-slate-200/80 flex items-center justify-center px-4">
        <Link href={`/r/${slug}`} className="flex items-center gap-1.5 font-extrabold text-sm text-slate-900">
          <UtensilsCrossed className="h-4 w-4 text-brand-600" />
          <span>{restaurant.name}</span>
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        
        {/* SUCCESS SUMMARY */}
        <div className="text-center space-y-2 py-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-black text-slate-950 tracking-tight">
            {order.status === "NUEVO" ? "¡Pedido Recibido con Éxito!" : "Estado de tu Pedido"}
          </h2>
          <p className="text-xs text-slate-500 font-semibold leading-none">
            Pedido #{order.order_number} • EBS
          </p>
        </div>

        {/* STEP PROGRESS LIST (Section 22) */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Seguimiento del Estado
            </span>

            {order.status === "CANCELADO" ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-800">Pedido Cancelado</h4>
                  <p className="text-[10px] text-rose-600 mt-0.5">
                    El restaurante ha cancelado tu pedido. Por favor comunícate por WhatsApp si tienes alguna duda.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6 ml-2.5">
                {steps.map((step, idx) => {
                  const isCompleted = idx < currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div key={step.label} className="relative">
                      {/* Node bullet */}
                      <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                        isCompleted
                          ? "bg-brand-600 border-brand-600 text-white"
                          : isCurrent
                          ? "bg-white border-brand-600 text-brand-600 ring-4 ring-brand-100"
                          : "bg-white border-slate-300 text-slate-300"
                      }`}>
                        {isCompleted ? (
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        ) : (
                          <span className={`h-1.5 w-1.5 rounded-full ${isCurrent ? "bg-brand-600" : "bg-slate-300"}`} />
                        )}
                      </span>

                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-bold ${
                          isCurrent ? "text-brand-700" : isCompleted ? "text-slate-900" : "text-slate-400"
                        }`}>
                          {step.title}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ORDER DETAILS SUMMARY */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 space-y-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
              Resumen del Pedido
            </span>

            {/* Customer Details */}
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div>
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Cliente</span>
                <span className="text-slate-900 mt-1 block">{order.customer_name}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Teléfono</span>
                  <span className="text-slate-900 mt-1 block">{order.customer_phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Entrega</span>
                  <span className="text-slate-900 mt-1 block">{order.delivery_type}</span>
                </div>
              </div>
              {order.delivery_type === "DOMICILIO" && order.delivery_address && (
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Dirección</span>
                  <span className="text-slate-900 mt-1 block">{order.delivery_address}</span>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none mb-1">Platos</span>
              
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-slate-800">
                    {item.quantity}x {item.item_name}
                  </span>
                  <span className="text-slate-900">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-xs font-black text-slate-950">
              <span>Total a pagar:</span>
              <span className="text-sm text-brand-700 font-black">{formatCurrency(order.total_amount)}</span>
            </div>

          </CardContent>
        </Card>

        {/* BOTTOM CTA: WHATSAPP DIRECT LINK */}
        <div className="text-center">
          <a
            href={`https://wa.me/${restaurant.whatsapp}`}
            target="_blank"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12 rounded-2xl shadow-md transition-colors text-sm"
          >
            <MessageSquare className="h-4.5 w-4.5" />
            Preguntar por WhatsApp
          </a>
          <Link
            href={`/r/${slug}`}
            className="block text-xs font-bold text-slate-500 hover:text-slate-900 mt-4 underline"
          >
            Volver al Menú
          </Link>
        </div>

      </main>
    </div>
  );
}
