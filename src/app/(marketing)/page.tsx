"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import {
  UtensilsCrossed,
  QrCode,
  Smartphone,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
  Menu as MenuIcon,
  X,
} from "lucide-react";

export default function MarketingLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [demoActiveCategory, setDemoActiveCategory] = useState("Proteína");
  const [demoOrderCount, setDemoOrderCount] = useState(2);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const demoMenuItems = [
    {
      category: "Sopa",
      name: "Sancocho Trifásico de Costilla",
      desc: "Con mazorca tierna, plátano verde y toque de cilantro fresco.",
      price: 18000,
      available: true,
      tag: "Tradicional",
    },
    {
      category: "Proteína",
      name: "Pechuga a la Plancha en Salsa Criolla",
      desc: "Acompañada de arroz de coco, ensalada de aguacate y tajadas de plátano maduro.",
      price: 18000,
      available: true,
      tag: "Más Pedido",
    },
    {
      category: "Proteína",
      name: "Carne Desmechada en Jugo de Tomate",
      desc: "Cocción lenta de 4 horas con especias naturales de la casa.",
      price: 19000,
      available: true,
      tag: "Recomendado",
    },
    {
      category: "Proteína",
      name: "Sierra Frita con Patacón",
      desc: "Pescado fresco del día con limón mandarino y patacones crocantes.",
      price: 22000,
      available: false, // Demo out of stock item
      tag: "Agotado",
    },
    {
      category: "Acompañamiento",
      name: "Porción de Arroz Blanco + Frijol",
      desc: "Guiso casero con tocino crocante.",
      price: 4500,
      available: true,
      tag: "Extra",
    },
    {
      category: "Bebida",
      name: "Jugo Natural de Corozo Frío",
      desc: "100% fruta natural bien helado (14oz).",
      price: 4000,
      available: true,
      tag: "Bebida del Día",
    },
  ];

  const filteredDemoItems = demoMenuItems.filter(
    (item) => demoActiveCategory === "Todos" || item.category === demoActiveCategory
  );

  const faqs = [
    {
      q: "¿Mis clientes necesitan descargar una app para hacer pedidos?",
      a: "No. Tus clientes solo escanean el código QR con la cámara de su celular o abren el enlace que les envíes por WhatsApp. Ven el menú del día y piden en menos de 1 minuto sin crear cuentas ni contraseñas.",
    },
    {
      q: "¿Cobran comisión por cada almuerzo o pedido vendido?",
      a: "Cero comisiones. El 100% de lo que vendes es tuyo. Solo pagas una suscripción mensual fija y muy económica.",
    },
    {
      q: "¿Cuánto tiempo me toma publicar el menú cada mañana?",
      a: "Menos de 2 minutos. Puedes reutilizar platos de días anteriores con el botón 'Copiar Menú', marcar qué proteínas se acabaron en tiempo real con un solo clic y publicar inmediatamente.",
    },
    {
      q: "¿Tengo que cambiar el código QR todos los días?",
      a: "Nunca. Tu código QR es permanente. Lo imprimes una sola vez para tus mesas, servilleteros o volante y siempre mostrará automáticamente el menú del día que tengas publicado hoy.",
    },
    {
      q: "¿Puedo recibir pedidos para recoger en el local o para domicilio?",
      a: "Sí. Puedes activar o desactivar opciones de domicilio, recoger en restaurante o pedido en mesa según cómo opere tu negocio.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                {SITE_CONFIG.name}
              </span>
              <span className="text-[10px] font-semibold text-brand-600 uppercase tracking-wider mt-0.5">
                Menú & Pedidos SaaS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#como-funciona" className="hover:text-brand-600 transition-colors">
              Cómo funciona
            </a>
            <a href="#demo-en-vivo" className="hover:text-brand-600 transition-colors">
              Demo Interactivo
            </a>
            <a href="#beneficios" className="hover:text-brand-600 transition-colors">
              Beneficios
            </a>
            <a href="#precios" className="hover:text-brand-600 transition-colors">
              Precios
            </a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">
              Preguntas
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href={SITE_CONFIG.urls.login} className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="font-semibold">
                Iniciar Sesión
              </Button>
            </Link>
            <Link href={SITE_CONFIG.urls.register} className="hidden sm:inline-flex">
              <Button variant="primary" size="sm" className="shadow-sm">
                Crear Mi Restaurante
              </Button>
            </Link>

            {/* MOBILE HAMBURGER BUTTON */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200/80 bg-white p-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
            <div className="space-y-1">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-brand-50 text-brand-700 font-extrabold text-sm"
              >
                <span>🔐 Iniciar Sesión / Administrar</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/registro"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-sm"
              >
                <span>🚀 Crear Mi Restaurante</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2 text-xs font-bold text-slate-600">
              <a
                href="#como-funciona"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                Cómo funciona
              </a>
              <a
                href="#demo-en-vivo"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                Demo Interactivo
              </a>
              <a
                href="#beneficios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                Beneficios
              </a>
              <a
                href="#precios"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                Precios
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-50 rounded-lg"
              >
                Preguntas Frecuentes
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-gradient-to-b from-brand-50/60 via-slate-50 to-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-100 text-brand-800 text-xs font-bold border border-brand-200 shadow-sm animate-pulse-subtle">
              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
              <span>Sin comisiones por pedido • 100% para tu restaurante</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              Tu menú de hoy. <br className="hidden sm:inline" />
              <span className="text-brand-600 bg-clip-text">Tus pedidos.</span> Sin complicaciones.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Publica el almuerzo del día en <strong>menos de 2 minutos</strong>, genera tu QR permanente y recibe pedidos organizados directamente en tu celular o computador.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link href={SITE_CONFIG.urls.register} className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto text-base gap-2 px-8 py-3.5">
                  <Store className="h-5 w-5" />
                  Quiero Mi Restaurante
                </Button>
              </Link>
              <a href="#demo-en-vivo" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base gap-2">
                  <Smartphone className="h-5 w-5 text-slate-600" />
                  Ver Demo en Vivo
                </Button>
              </a>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <span>Listo en 3 minutos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <span>Clientes piden sin app</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-brand-600" />
                <span>Control de platos agotados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA (3 PASOS) */}
      <section id="como-funciona" className="py-16 md:py-24 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Badge variant="brand">Flujo Simple</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Diseñado para la velocidad de tu cocina
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Olvídate de fotos borrosas por WhatsApp y chats desordenados. Todo en 3 pasos directos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-brand-300 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-brand-600/20">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Publicas el Menú de Hoy</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Ingresas las sopas, carnes y jugos del día o copias el menú de ayer con un solo clic.
              </p>
              <div className="pt-2 text-xs font-semibold text-brand-700 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Tiempo: ~2 minutos
              </div>
            </div>

            <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-brand-300 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-accent-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-md shadow-accent-500/20">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Compartes tu QR o Enlace</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Tu código QR permanente está en las mesas o envías tu enlace web por WhatsApp y redes.
              </p>
              <div className="pt-2 text-xs font-semibold text-accent-800 flex items-center gap-1">
                <QrCode className="h-3.5 w-3.5" /> Código QR que nunca cambia
              </div>
            </div>

            <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200/80 space-y-4 hover:border-brand-300 transition-colors">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-xl shadow-md">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Recibes y Despachas</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Los pedidos llegan ordenados en tu tablero con nombres, teléfono, tipo de entrega y notas.
              </p>
              <div className="pt-2 text-xs font-semibold text-slate-900 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-brand-600" /> Tiempo real & Alerta sonora
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEMO INTERACTIVO EN VIVO */}
      <section id="demo-en-vivo" className="py-16 md:py-24 bg-slate-900 text-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <Badge variant="accent">Vista Previa Interactiva</Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Así de fácil lo ven tus comensales
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Sin registros ni complicaciones. Tus clientes eligen su comida favorita, agregan acompañamientos y envían su pedido en menos de 60 segundos.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Diseño optimizado para cualquier smartphone</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Actualización inmediata de platos agotados</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-200">
                  <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <span>Resumen claro con total y dirección de entrega</span>
                </div>
              </div>

              <div className="pt-4">
                <Link href={SITE_CONFIG.urls.register}>
                  <Button variant="accent" size="lg" className="gap-2">
                    Crear Menú Para Mi Negocio <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* MOCKUP INTERACTIVO SMARTPHONE */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-sm bg-slate-950 rounded-[2.5rem] p-3 shadow-2xl border-4 border-slate-800 relative">
                {/* Speaker pill */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 h-4 w-28 bg-slate-800 rounded-full z-20" />

                <div className="bg-slate-50 text-slate-900 rounded-[2rem] overflow-hidden pt-7 pb-4 px-4 min-h-[580px] flex flex-col justify-between">
                  {/* Restaurant Public Header */}
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider">
                          Menú de Hoy
                        </span>
                        <h4 className="text-base font-extrabold text-slate-900">
                          Restaurante El Buen Sabor
                        </h4>
                        <p className="text-[11px] text-slate-500">Calle 72 # 44-20 • Abierto</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
                        EBS
                      </div>
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
                      {["Todos", "Sopa", "Proteína", "Acompañamiento", "Bebida"].map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setDemoActiveCategory(cat)}
                          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                            demoActiveCategory === cat
                              ? "bg-slate-900 text-white"
                              : "bg-slate-200/80 text-slate-700 hover:bg-slate-300"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Menu Items List */}
                    <div className="space-y-2 mt-1 max-h-[300px] overflow-y-auto pr-1">
                      {filteredDemoItems.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border transition-all ${
                            item.available
                              ? "bg-white border-slate-200/80 shadow-sm"
                              : "bg-slate-100 border-slate-200 opacity-60"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">
                                  {item.name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-brand-700">
                                {formatCurrency(item.price)}
                              </span>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            {item.available ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                ● Disponible
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                                ✕ AGOTADO
                              </span>
                            )}

                            {item.available && (
                              <button
                                onClick={() => setDemoOrderCount((c) => c + 1)}
                                className="text-xs bg-brand-600 hover:bg-brand-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs active:scale-95 transition-all"
                              >
                                + Agregar
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Sticky Cart Bar */}
                  <div className="mt-3 p-3 bg-brand-700 rounded-2xl text-white flex items-center justify-between shadow-lg">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{demoOrderCount} Platos añadidos</div>
                        <div className="text-[10px] text-brand-100">
                          Total: {formatCurrency(demoOrderCount * 18000)}
                        </div>
                      </div>
                    </div>
                    <button className="bg-white text-brand-800 text-xs font-extrabold px-3 py-1.5 rounded-xl hover:bg-brand-50 transition-colors">
                      Pedir Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS CLAVE */}
      <section id="beneficios" className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Badge variant="brand">Por qué elegirnos</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Diseñado exclusivamente para restaurantes y corrientazos
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              A diferencia de plataformas pesadas que cobran hasta el 30% de tus ventas, aquí tú mantienes el control.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 space-y-3.5 border-slate-200">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">0% Comisiones por Pedido</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Todo lo que cobras va directo a tu bolsillo por efectivo o transferencia directa sin intermediarios.
              </p>
            </Card>

            <Card className="p-6 space-y-3.5 border-slate-200">
              <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">QR Permanente Sin Reemplazos</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Descarga e imprime tu código una sola vez. Cuando publicas el menú del día, se actualiza solo.
              </p>
            </Card>

            <Card className="p-6 space-y-3.5 border-slate-200">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Directo a WhatsApp</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Notifica a tus clientes con un clic cuando su pedido esté en preparación o listo para recoger.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* PLANES & PRECIOS */}
      <section id="precios" className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <Badge variant="brand">Precios Transparentes</Badge>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Un solo pago mensual. Sin sorpresas.
            </h2>
            <p className="text-sm sm:text-base text-slate-600">
              Empieza gratis hoy mismo y escala cuando tu negocio lo necesite.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {SITE_CONFIG.plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all ${
                  plan.isPopular
                    ? "bg-white border-2 border-brand-600 shadow-xl relative"
                    : "bg-white border border-slate-200/80 shadow-card"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                    <span className="bg-brand-600 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-4 py-1 rounded-full shadow-md inline-flex items-center gap-1">
                      ⭐ Más Elegido
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.description}</p>

                  <div className="mt-6 mb-6">
                    <span className="text-3xl sm:text-4xl font-black text-slate-950">
                      {plan.priceMonthly === 0 ? "Gratis" : formatCurrency(plan.priceMonthly)}
                    </span>
                    {plan.priceMonthly > 0 && (
                      <span className="text-xs text-slate-500 font-medium ml-1.5">/ mes</span>
                    )}
                  </div>

                  <ul className="space-y-3 text-xs sm:text-sm text-slate-600 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link href={SITE_CONFIG.urls.register} className="w-full">
                  <Button
                    variant={plan.isPopular ? "primary" : "outline"}
                    className="w-full font-bold"
                  >
                    {plan.ctaText}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 space-y-3">
            <Badge variant="brand">Preguntas Frecuentes</Badge>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Resolvemos tus dudas
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                      activeFaq === idx ? "rotate-180 text-brand-600" : ""
                    }`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 bg-brand-700 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            ¿Listo para digitalizar tu menú en minutos?
          </h2>
          <p className="text-sm sm:text-base text-brand-100 max-w-xl mx-auto leading-relaxed">
            Únete a los restaurantes que ya reciben sus pedidos organizados sin perder tiempo ni pagar comisiones.
          </p>
          <div className="pt-2">
            <Link href={SITE_CONFIG.urls.register}>
              <Button size="lg" variant="accent" className="text-base px-8 py-3.5 shadow-lg">
                Crear Mi Restaurante Ahora
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-black">
              P
            </div>
            <span className="font-bold text-white text-sm">{SITE_CONFIG.name}</span>
            <span className="text-slate-600">|</span>
            <span>Plataforma SaaS para Restaurantes</span>
          </div>
          <p>© {new Date().getFullYear()} {SITE_CONFIG.name}. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
