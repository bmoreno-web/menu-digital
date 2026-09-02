"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { restaurantService } from "@/services/restaurantService";
import { orderService } from "@/services/orderService";
import { formatCurrency, formatDate } from "@/lib/utils";
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
  Phone,
  MapPin,
  Sparkles,
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
        setError("El pedido solicitado no fue encontrado.");
      } else {
        setOrder(orderData);
      }
    } catch {
      setError("Error al cargar la información del pedido.");
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

    // 2. Poll every 5 seconds as fallback for status updates
    const interval = setInterval(loadOrderDetails, 5000);

    return () => {
      window.removeEventListener(`order_update_${orderId}`, handleLocalUpdate);
      clearInterval(interval);
    };
  }, [slug, orderId]);

  const hasLaunchedConfetti = useRef(false);

  // Launch initial celebration confetti only once on load for NUEVO order
  useEffect(() => {
    if (order && !isLoading && !hasLaunchedConfetti.current) {
      hasLaunchedConfetti.current = true;
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    }
  }, [order, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando confirmación de pedido...</p>
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
        <p className="text-xs text-slate-500 max-w-xs">{error || "La orden solicitada es incorrecta o no existe."}</p>
        <Link href={`/r/${slug}`}>
          <Button variant="primary" size="sm">Ir al Menú del Restaurante</Button>
        </Link>
      </div>
    );
  }

  const steps = [
    { label: "NUEVO", title: "Enviado", desc: "El restaurante está revisando tu pedido" },
    { label: "ACEPTADO", title: "Aceptado", desc: "Tu orden fue confirmada por el restaurante" },
    { label: "EN_PREPARACION", title: "En Cocina", desc: "Tus platos se están preparando" },
    { label: "LISTO", title: "Listo", desc: "Preparado para entrega o retiro" },
    { label: "ENTREGADO", title: "Entregado", desc: "¡Buen provecho!" },
  ];

  const getStepIndex = (status: string) => {
    return steps.findIndex((s) => s.label === status);
  };

  const currentStepIdx = getStepIndex(order.status);

  // Generate WhatsApp Message for 1-click notification
  const itemsText = order.items
    ? order.items
        .map((i: any) => `• ${i.quantity}x ${i.item_name} (${formatCurrency(i.subtotal)})`)
        .join("\n")
    : "Sin detalles";

  const whatsappMessage = `*¡Hola ${restaurant.name}!* Acabo de realizar el *Pedido #${order.order_number}* a través del Menú Digital:\n\n👤 *Cliente:* ${order.customer_name}\n📱 *Teléfono:* ${order.customer_phone}\n🛵 *Tipo de Entrega:* ${order.delivery_type === "DOMICILIO" ? "Domicilio" : "Para Recoger"}${order.delivery_address ? `\n📍 *Dirección:* ${order.delivery_address}` : ""}${order.delivery_notes ? `\n📝 *Notas:* ${order.delivery_notes}` : ""}\n\n📋 *Detalle del Pedido:*\n${itemsText}\n\n💵 *Total:* ${formatCurrency(order.total_amount)}\n💳 *Método de Pago:* ${order.payment_method}\n\n¿Me confirman recibido por favor? ¡Muchas gracias!`;

  const whatsappUrl = `https://wa.me/${restaurant.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 selection:bg-brand-500 selection:text-white">
      {/* Header navbar */}
      <header className="sticky top-0 z-30 w-full h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4">
        <Link href={`/r/${slug}`} className="flex items-center gap-2 font-extrabold text-sm text-slate-900">
          <div className="h-7 w-7 rounded-lg bg-brand-600 text-white flex items-center justify-center font-black text-xs">
            {restaurant.name.slice(0, 2).toUpperCase()}
          </div>
          <span>{restaurant.name}</span>
        </Link>
        <Badge variant="neutral" size="sm">
          #{order.order_number}
        </Badge>
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6 space-y-6">
        
        {/* SUCCESS HERO BANNER */}
        <div className="text-center space-y-3 py-3">
          <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md animate-bounce-short">
            <CheckCircle className="h-9 w-9" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              ¡Muchas Gracias por tu Pedido!
            </h1>
            <p className="text-xs text-slate-500 font-bold">
              Tu orden <span className="text-brand-700 font-extrabold">#{order.order_number}</span> ha sido registrada exitosamente.
            </p>
          </div>
        </div>

        {/* 1-CLICK WHATSAPP NOTIFICATION BUTTON */}
        <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm overflow-hidden">
          <CardContent className="p-4 sm:p-5 space-y-3 text-center">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                Agiliza tu Entrega
              </span>
              <p className="text-xs text-slate-700 font-semibold">
                Envía el comprobante directamente al WhatsApp del restaurante con un solo toque:
              </p>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-black h-12 rounded-xl shadow-md transition-all text-sm"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Enviar Resumen por WhatsApp</span>
            </a>
          </CardContent>
        </Card>

        {/* STEP PROGRESS TRACKER */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Estado del Pedido en Tiempo Real
              </span>
              <Badge variant={order.status === "ENTREGADO" ? "success" : "brand"} size="sm" dot pulse={order.status !== "ENTREGADO" && order.status !== "CANCELADO"}>
                {order.status === "NUEVO" ? "Recibido" : order.status}
              </Badge>
            </div>

            {order.status === "CANCELADO" ? (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-rose-800">Pedido Cancelado</h4>
                  <p className="text-[10px] text-rose-600 mt-0.5">
                    El restaurante canceló este pedido. Comunícate por WhatsApp si tienes alguna consulta.
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
              Resumen del Pedido #{order.order_number}
            </span>

            {/* Customer Details */}
            <div className="space-y-2 text-xs font-semibold text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Cliente</span>
                  <span className="text-slate-900 mt-1 block">{order.customer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Teléfono</span>
                  <span className="text-slate-900 mt-1 block">{order.customer_phone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Tipo de Entrega</span>
                  <span className="text-slate-900 mt-1 block font-bold">
                    {order.delivery_type === "DOMICILIO" ? "🛵 Domicilio" : "🏬 Para Recoger"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Método de Pago</span>
                  <span className="text-slate-900 mt-1 block font-bold">
                    {order.payment_method === "EFECTIVO" ? "💵 Efectivo" : "📱 Transferencia"}
                  </span>
                </div>
              </div>

              {order.delivery_type === "DOMICILIO" && order.delivery_address && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Dirección de Entrega</span>
                  <span className="text-slate-900 mt-1 block">{order.delivery_address}</span>
                </div>
              )}

              {order.delivery_notes && (
                <div className="pt-1">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none">Notas del Pedido</span>
                  <span className="text-slate-600 mt-1 block italic">{order.delivery_notes}</span>
                </div>
              )}
            </div>

            {/* Items list */}
            <div className="border-t border-slate-100 pt-3 space-y-2">
              <span className="text-slate-400 block text-[9px] uppercase tracking-wider leading-none mb-1">Platos Solicitados</span>
              
              {order.items?.map((item: any, idx: number) => (
                <div key={item.id || idx} className="flex justify-between items-center text-xs font-semibold py-1">
                  <div className="space-y-0.5">
                    <span className="text-slate-800 block">
                      <strong className="text-brand-700 font-bold">{item.quantity}x</strong> {item.item_name}
                    </span>
                    {item.notes && (
                      <span className="text-[10px] text-slate-400 italic block pl-4">Nota: {item.notes}</span>
                    )}
                  </div>
                  <span className="text-slate-900 font-bold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            {/* Breakdown & Total */}
            <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
              {Number(order.delivery_fee) > 0 && (
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Costo de Domicilio:</span>
                  <span>{formatCurrency(order.delivery_fee)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-sm font-black text-slate-950 pt-1">
                <span>Total a Pagar:</span>
                <span className="text-base text-brand-700 font-black">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* BOTTOM CTA: RETURN TO MENU */}
        <div className="text-center pt-2">
          <Link href={`/r/${slug}`}>
            <Button variant="outline" className="w-full font-bold h-11">
              Volver al Menú Principal
            </Button>
          </Link>
        </div>

      </main>
    </div>
  );
}
