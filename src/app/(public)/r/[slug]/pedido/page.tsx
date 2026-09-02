"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { restaurantService } from "@/services/restaurantService";
import { orderService } from "@/services/orderService";
import { subscriptionService } from "@/services/subscriptionService";
import { formatCurrency } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  UtensilsCrossed,
  ArrowLeft,
  MapPin,
  Coins,
  Truck,
  Store,
  CheckCircle2,
  Loader2,
  FileText,
  Utensils,
} from "lucide-react";

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);

  const [isOrderSubmitted, setIsOrderSubmitted] = useState(false);

  // Cart
  const { cart, syncPriceMode, getSubtotal, clearCart } = useCart(slug);

  // Form states (Section 21)
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    deliveryType: "DOMICILIO" as "DOMICILIO" | "RECOGER" | "MESA",
    deliveryAddress: "",
    deliveryNotes: "",
    paymentMethod: "EFECTIVO" as "EFECTIVO" | "TRANSFERENCIA",
  });

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const profile = await restaurantService.getProfile(slug);
        setRestaurant(profile);

        const status = await subscriptionService.checkTrialStatus(profile.id);
        setTrialStatus(status);
        if (status && !status.active) {
          setError("La recepción de pedidos en línea está temporalmente pausada.");
        }

        // Adjust default delivery type based on query or restaurant capabilities
        if (typeof window !== "undefined") {
          const urlParams = new URLSearchParams(window.location.search);
          const mode = urlParams.get("mode");
          if (mode === "mesa") {
            setFormData((prev) => ({ ...prev, deliveryType: "MESA" }));
            syncPriceMode("MESA");
            return;
          }
        }

        if (!profile.allows_delivery && profile.allows_pickup) {
          setFormData((prev) => ({ ...prev, deliveryType: "RECOGER" }));
        }
      } catch (err) {
        setError("Error al cargar datos del restaurante.");
      } finally {
        setIsLoading(false);
      }
    }

    loadRestaurant();
  }, [slug]);

  // Handle empty cart redirect (only if user arrived with empty cart, not after placing order)
  useEffect(() => {
    if (!isLoading && cart.length === 0 && !isOrderSubmitted && !isSubmitting) {
      router.replace(`/r/${slug}`);
    }
  }, [cart, isLoading, isOrderSubmitted, isSubmitting, slug, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDeliverySelect = (type: "DOMICILIO" | "RECOGER" | "MESA") => {
    setFormData((prev) => ({ ...prev, deliveryType: type }));
    syncPriceMode(type === "MESA" ? "MESA" : "LLEVAR");
  };

  const handlePaymentSelect = (method: "EFECTIVO" | "TRANSFERENCIA") => {
    setFormData((prev) => ({ ...prev, paymentMethod: method }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0 || !restaurant) return;
    
    if (trialStatus && !trialStatus.active) {
      setError("La recepción de pedidos está temporalmente desactivada para este restaurante.");
      return;
    }

    if (formData.deliveryType === "DOMICILIO" && !formData.deliveryAddress.trim()) {
      setError("Por favor ingresa una dirección de entrega.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const rawDeliveryFee = restaurant?.delivery_fee ? Number(restaurant.delivery_fee) : 0;
    const deliveryFee = formData.deliveryType === "DOMICILIO" ? (isNaN(rawDeliveryFee) ? 0 : rawDeliveryFee) : 0;

    try {
      const order = await orderService.createOrder({
        restaurantId: restaurant.id,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        deliveryType: formData.deliveryType,
        deliveryAddress: formData.deliveryType === "DOMICILIO" ? formData.deliveryAddress : undefined,
        deliveryNotes: formData.deliveryNotes || undefined,
        paymentMethod: formData.paymentMethod,
        deliveryFee,
        items: cart.map((c) => {
          const itemPrice = Number(c.selected_price !== undefined ? c.selected_price : c.item.price);
          return {
            menuItemId: c.item.id,
            name: c.item.name,
            categoryName: c.item.category_name,
            quantity: c.quantity,
            price: isNaN(itemPrice) ? 0 : itemPrice,
            notes: c.notes,
          };
        }),
      });

      // Mark order as submitted so empty cart listener doesn't kick the user back
      setIsOrderSubmitted(true);
      clearCart();

      // Navigate to Thank You / Confirmation Page
      window.location.href = `/r/${slug}/confirmacion/${order.id}`;
    } catch (err: any) {
      setError(err?.message || "Hubo un error al crear tu pedido. Intenta nuevamente.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando Checkout...</p>
      </div>
    );
  }

  const subtotal = Number(getSubtotal()) || 0;
  const rawDeliveryFee = restaurant?.delivery_fee ? Number(restaurant.delivery_fee) : 0;
  const deliveryFee = formData.deliveryType === "DOMICILIO" ? (isNaN(rawDeliveryFee) ? 0 : rawDeliveryFee) : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 selection:bg-brand-500 selection:text-white">
      {/* Header navbar */}
      <header className="sticky top-0 z-30 w-full h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4">
        <Link
          href={`/r/${slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Atrás
        </Link>
        <span className="text-xs font-black text-slate-900 truncate max-w-[200px]">
          Confirmar Pedido — EBS
        </span>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <main className="max-w-xl mx-auto px-4 mt-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* DELIVERY TYPE SWITCHER */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Método de Entrega
              </span>
              
              <div className="grid grid-cols-3 gap-2">
                {restaurant.allows_delivery && (
                  <button
                    type="button"
                    onClick={() => handleDeliverySelect("DOMICILIO")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                      formData.deliveryType === "DOMICILIO"
                        ? "border-brand-600 bg-brand-50/40 text-brand-700 font-bold"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Truck className="h-5 w-5" />
                    <span className="text-[11px]">A Domicilio</span>
                  </button>
                )}

                {restaurant.allows_pickup && (
                  <button
                    type="button"
                    onClick={() => handleDeliverySelect("RECOGER")}
                    className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                      formData.deliveryType === "RECOGER"
                        ? "border-brand-600 bg-brand-50/40 text-brand-700 font-bold"
                        : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    <Store className="h-5 w-5" />
                    <span className="text-[11px]">Para Llevar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDeliverySelect("MESA")}
                  className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                    formData.deliveryType === "MESA"
                      ? "border-brand-600 bg-brand-50/40 text-brand-700 font-bold"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <Utensils className="h-5 w-5" />
                  <span className="text-[11px]">En la Mesa</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* CONTACT INFO */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Datos de Contacto
              </span>

              <Input
                label="Nombre Completo"
                name="customerName"
                required
                placeholder="Ej: Juan Pérez"
                value={formData.customerName}
                onChange={handleChange}
              />

              <Input
                label="Teléfono Celular"
                name="customerPhone"
                type="tel"
                required
                placeholder="Ej: 3001234567"
                value={formData.customerPhone}
                onChange={handleChange}
              />

              {formData.deliveryType === "DOMICILIO" && (
                <Input
                  label="Dirección de Entrega"
                  name="deliveryAddress"
                  required
                  placeholder="Ej: Calle 45 # 12-34, Apto 201"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                />
              )}

              {formData.deliveryType === "MESA" && (
                <Input
                  label="Número de Mesa (Opcional)"
                  name="deliveryAddress"
                  placeholder="Ej: Mesa 4 (o deja vacío)"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                />
              )}

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Notas o Instrucciones Especiales
                </label>
                <textarea
                  name="deliveryNotes"
                  rows={2}
                  className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl transition-all duration-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600"
                  placeholder="Ej: Sin cebolla, dejar en portería, llevar cambio de 50mil..."
                  value={formData.deliveryNotes}
                  onChange={handleChange}
                />
              </div>
            </CardContent>
          </Card>

          {/* PAYMENT METHOD */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Método de Pago
              </span>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handlePaymentSelect("EFECTIVO")}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                    formData.paymentMethod === "EFECTIVO"
                      ? "border-brand-600 bg-brand-50/40 text-brand-700 font-bold"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <Coins className="h-5 w-5" />
                  <span className="text-xs">Efectivo</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePaymentSelect("TRANSFERENCIA")}
                  className={`p-3.5 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
                    formData.paymentMethod === "TRANSFERENCIA"
                      ? "border-brand-600 bg-brand-50/40 text-brand-700 font-bold"
                      : "border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="text-xs">Transferencia (Nequi/Daviplata)</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* TOTAL & BILLING SUMMARY */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-100 pb-2">
                Resumen de Compra
              </span>

              <div className="space-y-2 text-xs font-semibold text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal platos:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                {formData.deliveryType === "DOMICILIO" && (
                  <div className="flex justify-between">
                    <span>Envío / Domicilio:</span>
                    <span>{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-sm font-black text-slate-950 border-t border-slate-100 pt-2.5">
                  <span>Total a pagar:</span>
                  <span className="text-brand-700">{formatCurrency(total)}</span>
                </div>
              </div>
            </CardContent>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                className="w-full text-base font-bold h-12"
                isLoading={isSubmitting}
                disabled={!!(trialStatus && !trialStatus.active)}
              >
                Enviar Pedido <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>

        </form>
      </main>
    </div>
  );
}
