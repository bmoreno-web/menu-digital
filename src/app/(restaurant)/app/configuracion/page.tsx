"use client";

import React, { useState, useEffect, useRef } from "react";
import { authService } from "@/services/authService";
import { restaurantService } from "@/services/restaurantService";
import { SITE_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  QrCode,
  Download,
  Printer,
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  Coins,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  TrendingUp,
} from "lucide-react";
import QRCode from "qrcode";
import { subscriptionService } from "@/services/subscriptionService";

export default function RestaurantConfiguration() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);

  async function loadData() {
    try {
      const session = await authService.getSession();
      if (session) {
        setRestaurant(session.restaurant);
        
        const status = await subscriptionService.checkTrialStatus(session.restaurant.id);
        setTrialStatus(status);
        
        // Generate Permanent QR Code
        const publicUrl = `${window.location.origin}/r/${session.restaurant.slug}`;
        const qrDataUrl = await QRCode.toDataURL(publicUrl, {
          width: 500,
          margin: 2,
          color: {
            dark: "#064e3b", // Deep forest brand color
            light: "#ffffff",
          },
        });
        setQrUrl(qrDataUrl);
      }
    } catch (err) {
      console.error("Error al cargar configuraciones:", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleUpgrade = async () => {
    if (!restaurant) return;
    setIsUpgrading(true);
    try {
      await restaurantService.updateRestaurant(restaurant.id, { plan_tier: "pro" });
      await loadData();
      setFeedback("¡Suscripción actualizada a Plan Pro con éxito! El servicio de pedidos se encuentra activo.");
    } catch (err) {
      setFeedback("Error al actualizar la suscripción.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    setRestaurant((prev: any) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      await restaurantService.updateRestaurant(restaurant.id, {
        name: restaurant.name,
        opening_hours: restaurant.opening_hours,
        address: restaurant.address,
        phone: restaurant.phone,
        whatsapp: restaurant.whatsapp,
        allows_delivery: restaurant.allows_delivery,
        allows_pickup: restaurant.allows_pickup,
        delivery_fee: Number(restaurant.delivery_fee) || 0,
        description: restaurant.description,
      });
      setFeedback("Configuraciones guardadas con éxito.");
    } catch (err) {
      setFeedback("Error al guardar las configuraciones.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadQr = () => {
    const link = document.createElement("a");
    link.href = qrUrl;
    link.download = `qr-menu-${restaurant?.slug || "restaurante"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintQr = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir QR — ${restaurant?.name}</title>
          <style>
            body {
              font-family: 'Plus Jakarta Sans', sans-serif;
              text-align: center;
              padding: 40px;
              color: #0f172a;
            }
            .container {
              border: 3px double #059669;
              border-radius: 24px;
              padding: 40px;
              max-width: 450px;
              margin: 0 auto;
            }
            h1 { font-size: 28px; font-weight: 800; margin-bottom: 5px; }
            p { font-size: 16px; color: #475569; margin-top: 0; }
            img { width: 300px; height: 300px; margin: 20px 0; }
            .footer { font-size: 18px; font-weight: 700; color: #059669; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${restaurant?.name}</h1>
            <p>Escanea y mira nuestro menú de hoy</p>
            <img src="${qrUrl}" />
            <div class="footer">¡Pide Directamente desde tu Celular!</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando configuraciones...</p>
      </div>
    );
  }

  const publicLink = `${window.location.origin}/r/${restaurant.slug}`;

  return (
    <div className="space-y-6">
      
      <div>
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
          Configuración
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
          Ajustes de Perfil y QR
        </h1>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl text-xs font-bold ${
          feedback.includes("éxito")
            ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
            : "bg-rose-50 border border-rose-100 text-rose-700"
        }`}>
          {feedback}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* PROFILE AND CONFIGS FORM (Lg: col-7) */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-900">Perfil del Restaurante</CardTitle>
              <CardDescription>Esta información es pública para tus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Nombre del Restaurante"
                name="name"
                required
                value={restaurant.name}
                onChange={handleChange}
                leftIcon={<Store className="h-4 w-4" />}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Descripción Corta
                </label>
                <textarea
                  name="description"
                  rows={2}
                  className="w-full p-4 text-sm bg-white border border-slate-200 rounded-xl transition-all duration-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
                  value={restaurant.description || ""}
                  onChange={handleChange}
                  placeholder="Ej: Comida casera, almuerzo ejecutivo fresco todos los días..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Dirección"
                  name="address"
                  required
                  value={restaurant.address}
                  onChange={handleChange}
                  leftIcon={<MapPin className="h-4 w-4" />}
                />

                <Input
                  label="Horario de Atención"
                  name="opening_hours"
                  value={restaurant.opening_hours || ""}
                  onChange={handleChange}
                  leftIcon={<Clock className="h-4 w-4" />}
                  placeholder="Ej: Lunes a Sábado: 11AM - 3:30PM"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  name="phone"
                  value={restaurant.phone || ""}
                  onChange={handleChange}
                  leftIcon={<Phone className="h-4 w-4" />}
                />

                <Input
                  label="WhatsApp para Pedidos"
                  name="whatsapp"
                  required
                  value={restaurant.whatsapp}
                  onChange={handleChange}
                  leftIcon={<MessageSquare className="h-4 w-4" />}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-900">Métodos de Entrega y Pagos</CardTitle>
              <CardDescription>Configura cómo los clientes pueden comprar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 block">Domicilio Activado</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Permite a los comensales pedir envío a su casa.</span>
                  </div>
                  <input
                    type="checkbox"
                    name="allows_delivery"
                    checked={restaurant.allows_delivery}
                    onChange={handleChange}
                    className="h-5 w-5 text-brand-600 border-slate-300 rounded-lg focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-slate-900 block">Recoger en Restaurante</span>
                    <span className="text-[10px] text-slate-400 font-semibold">Permite a los clientes pedir para retirar en el local.</span>
                  </div>
                  <input
                    type="checkbox"
                    name="allows_pickup"
                    checked={restaurant.allows_pickup}
                    onChange={handleChange}
                    className="h-5 w-5 text-brand-600 border-slate-300 rounded-lg focus:ring-brand-500"
                  />
                </div>
              </div>

              {restaurant.allows_delivery && (
                <div className="pt-2">
                  <Input
                    label="Costo de Domicilio"
                    name="delivery_fee"
                    type="number"
                    required
                    value={restaurant.delivery_fee}
                    onChange={handleChange}
                    leftIcon={<Coins className="h-4 w-4" />}
                    helperText="Costo en pesos (ej: 3000)"
                  />
                </div>
              )}
            </CardContent>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <Button type="submit" variant="primary" className="font-bold px-6" isLoading={isSaving}>
                Guardar Ajustes
              </Button>
            </div>
          </Card>
        </form>

        {/* QR GENERATOR AND DOWNLOAD (Lg: col-5) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-slate-200 shadow-sm text-center">
            <CardHeader className="text-left">
              <CardTitle className="text-sm uppercase tracking-wider text-slate-900">Tu QR Permanente</CardTitle>
              <CardDescription>Imprímelo una sola vez. El menú se actualiza diariamente.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center">
              
              {/* QR Preview Wrapper */}
              <div
                ref={printAreaRef}
                className="bg-white p-6 rounded-3xl border-2 border-dashed border-brand-200/80 shadow-md inline-block"
              >
                <div className="text-center space-y-1 mb-4">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                    {restaurant.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium">Escanea para ver nuestro menú de hoy</p>
                </div>

                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="Código QR del Menú"
                    className="h-48 w-48 mx-auto"
                  />
                ) : (
                  <div className="h-48 w-48 flex items-center justify-center bg-slate-50 text-slate-300 rounded-xl">
                    <QrCode className="h-10 w-10 animate-pulse" />
                  </div>
                )}
                
                <div className="text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-1 rounded-full inline-block mt-3 uppercase tracking-wider leading-none">
                  ⚡ PROJECT_NAME
                </div>
              </div>

              {/* URL sharing */}
              <div className="w-full mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-left space-y-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
                  Enlace Público
                </span>
                <a
                  href={publicLink}
                  target="_blank"
                  className="text-xs font-bold text-brand-700 hover:text-brand-800 break-all flex items-center gap-1 hover:underline"
                >
                  {publicLink}
                </a>
              </div>

              {/* QR Actions */}
              <div className="grid grid-cols-2 gap-3 w-full pt-6">
                <Button variant="outline" size="sm" onClick={handleDownloadQr} className="gap-1.5 font-bold">
                  <Download className="h-3.5 w-3.5" /> Descargar PNG
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintQr} className="gap-1.5 font-bold">
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </Button>
              </div>

            </CardContent>
          </Card>

          {/* PLAN AND BILLING CARD */}
          <Card className="border-slate-200 shadow-sm text-left">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider text-slate-900">Plan y Suscripción</CardTitle>
              <CardDescription>Administra y visualiza el estado de tu cuenta.</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plan Actual:</span>
                <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  restaurant.plan_tier === "pro" 
                    ? "bg-emerald-100 text-emerald-800" 
                    : restaurant.plan_tier === "enterprise"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700"
                }`}>
                  {restaurant.plan_tier === "pro" ? "Pro Restaurante" : restaurant.plan_tier === "enterprise" ? "Enterprise" : "Prueba Gratis (Free)"}
                </span>
              </div>

              {restaurant.plan_tier === "free" && trialStatus && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-600 leading-relaxed">
                    {trialStatus.active ? (
                      <div>
                        Te quedan <strong className="text-slate-900">{trialStatus.daysLeft} días</strong> de prueba y <strong className="text-slate-900">{trialStatus.ordersLeft} de {trialStatus.maxOrders} pedidos</strong> totales.
                      </div>
                    ) : (
                      <div className="text-rose-600 font-bold">
                        ⚠️ Tu prueba gratuita ha finalizado por {trialStatus.reason === "TRIAL_EXPIRED" ? "tiempo (7 días)" : "límite de pedidos (30)"}. La recepción de pedidos está suspendida.
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleUpgrade}
                    isLoading={isUpgrading}
                    variant="primary"
                    className="w-full text-xs font-bold h-10 gap-1.5"
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>Actualizar a Plan Pro</span>
                  </Button>
                </div>
              )}

              {restaurant.plan_tier === "pro" && (
                <div className="flex items-start gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Tu cuenta cuenta con Plan Pro Activo. Disfrutas de pedidos ilimitados y todas las herramientas de control.</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>

    </div>
  );
}
