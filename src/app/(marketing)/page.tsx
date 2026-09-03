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
  Star,
  Plus,
  Minus,
  MapPin,
} from "lucide-react";

export default function MarketingLandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Demo Interactive State
  const [demoOrderMode, setDemoOrderMode] = useState<"LLEVAR" | "MESA">("LLEVAR");
  const [demoShowCartDrawer, setDemoShowCartDrawer] = useState(false);
  const [demoOrderSuccess, setDemoOrderSuccess] = useState(false);

  // Demo Menu Items
  const demoSpecialItem = {
    id: "demo-special-1",
    name: "Bandeja Paisa con Chicharrón Crocante",
    desc: "Frijoles caseros, chicharrón carnudo, carne molida, huevo frito, arroz, tajada y aguacate fresco.",
    priceLlevar: 24000,
    priceMesa: 22000,
    category: "Proteína",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80",
    isSpecial: true,
    available: true,
  };

  const demoMenuItems = [
    {
      id: "demo-1",
      category: "Proteína",
      name: "Pechuga a la Plancha en Salsa Criolla",
      desc: "Acompañada de arroz de coco, ensalada de aguacate y tajadas de plátano maduro.",
      priceLlevar: 18000,
      priceMesa: 17000,
      imageUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=400&auto=format&fit=crop&q=80",
      available: true,
      tag: "Más Pedido",
    },
    {
      id: "demo-2",
      category: "Sopa",
      name: "Sancocho Trifásico de Costilla",
      desc: "Con mazorca tierna, plátano verde, yuca y toque de cilantro fresco.",
      priceLlevar: 17000,
      priceMesa: 16000,
      imageUrl: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&auto=format&fit=crop&q=80",
      available: true,
      tag: "Tradicional",
    },
    {
      id: "demo-3",
      category: "Proteína",
      name: "Carne Desmechada en Jugo Casero",
      desc: "Cocción lenta con especias naturales de la casa, arroz y patacón con hogao.",
      priceLlevar: 19000,
      priceMesa: 18000,
      imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
      available: true,
      tag: "Recomendado",
    },
    {
      id: "demo-4",
      category: "Proteína",
      name: "Sierra Frita con Patacón",
      desc: "Pescado fresco del día con limón mandarino y patacones crocantes.",
      priceLlevar: 22000,
      priceMesa: 20000,
      available: false, // Demo out of stock item
      tag: "Agotado",
    },
    {
      id: "demo-5",
      category: "Bebida",
      name: "Jugo Natural de Corozo Frío",
      desc: "100% pulpa natural bien helada en vaso de 14oz.",
      priceLlevar: 4500,
      priceMesa: 4000,
      imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&auto=format&fit=crop&q=80",
      available: true,
      tag: "Bebida del Día",
    },
    {
      id: "demo-6",
      category: "Acompañamiento",
      name: "Porción de Patacones con Hogao",
      desc: "4 patacones crocantes con hogao tradicional de tomate y cebolla.",
      priceLlevar: 5000,
      priceMesa: 4500,
      available: true,
      tag: "Extra",
    },
  ];

  // Demo Cart state initialized with 1 special and 1 beverage
  const [demoCart, setDemoCart] = useState<Array<{ id: string; name: string; priceLlevar: number; priceMesa: number; qty: number }>>([
    {
      id: "demo-special-1",
      name: "Bandeja Paisa con Chicharrón",
      priceLlevar: 24000,
      priceMesa: 22000,
      qty: 1,
    },
    {
      id: "demo-5",
      name: "Jugo Natural de Corozo",
      priceLlevar: 4500,
      priceMesa: 4000,
      qty: 1,
    },
  ]);

  const handleDemoAddToCart = (item: { id: string; name: string; priceLlevar: number; priceMesa: number }) => {
    setDemoCart((prev) => {
      const idx = prev.findIndex((i) => i.id === item.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...item, qty: 1 }];
    });
    setDemoOrderSuccess(false);
  };

  const handleDemoUpdateQty = (id: string, delta: number) => {
    setDemoCart((prev) => {
      return prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.qty + delta;
            return newQty > 0 ? { ...i, qty: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as typeof prev;
    });
  };

  const demoTotalItems = demoCart.reduce((acc, i) => acc + i.qty, 0);
  const demoSubtotal = demoCart.reduce((acc, i) => {
    const price = demoOrderMode === "MESA" ? i.priceMesa : i.priceLlevar;
    return acc + price * i.qty;
  }, 0);

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
      <section id="demo-en-vivo" className="py-16 md:py-24 bg-slate-900 text-white overflow-hidden relative">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-10 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* LEFT COLUMN: FEATURES & HIGHLIGHTS */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/20 text-accent-300 text-xs font-black tracking-wider uppercase border border-accent-500/30">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Vista Previa Interactiva</span>
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                La experiencia que tus clientes van a amar
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                Prueba el demo interactivo en el celular: cambia entre <strong>Para Llevar</strong> y <strong>En Mesa</strong>, pide el <strong>Especial del Día</strong> o agrega platos al carrito.
              </p>

              <div className="space-y-3.5 pt-1">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Precios Duales (Llevar vs Mesa)</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Configura tarifas diferenciadas con 1 clic. El menú recalcula los totales automáticamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Star className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Especial del Día Destacado</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Resalta tu mejor plato con tarjeta dorada para impulsar tus ventas diarias.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60">
                  <div className="h-8 w-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Carrito Rápido & Sin Registro</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Tus clientes piden en menos de 60 segundos directo a tu WhatsApp o comanda interna.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <Link href={SITE_CONFIG.urls.register} className="w-full sm:w-auto">
                  <Button variant="accent" size="lg" className="w-full sm:w-auto gap-2 font-bold shadow-lg shadow-accent-500/20">
                    Crear Menú Para Mi Restaurante <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* RIGHT COLUMN: INTERACTIVE SMARTPHONE MOCKUP */}
            <div className="lg:col-span-7 flex justify-center">
              <div className="w-full max-w-[380px] bg-slate-950 rounded-[2.8rem] p-3 shadow-2xl border-4 border-slate-800 relative ring-1 ring-white/10">
                {/* Dynamic Island / Speaker Pill */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 h-5 w-28 bg-slate-900 rounded-full z-30 flex items-center justify-center border border-slate-800">
                  <div className="h-2 w-2 rounded-full bg-slate-950 mr-2" />
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-950/80 border border-blue-900/50" />
                </div>

                {/* Smartphone Screen Canvas */}
                <div className="bg-slate-50 text-slate-900 rounded-[2.3rem] overflow-hidden pt-7 pb-4 px-3 min-h-[620px] max-h-[620px] flex flex-col justify-between relative select-none">
                  
                  {/* SCROLLABLE INNER MENU CONTENT */}
                  <div className="overflow-y-auto no-scrollbar space-y-3 pb-16">
                    
                    {/* Header: Restaurant Profile (Dark slate modern) */}
                    <div className="bg-slate-900 text-white rounded-2xl p-3.5 space-y-2.5 shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 h-24 w-24 bg-brand-500/15 rounded-full blur-xl" />
                      
                      <div className="flex items-start justify-between gap-2 relative z-10">
                        <div className="space-y-0.5 min-w-0">
                          <span className="text-[9px] font-black uppercase tracking-wider text-brand-400 block">
                            Restaurante • Almuerzo Casero
                          </span>
                          <h4 className="text-sm font-black tracking-tight text-white leading-tight">
                            Restaurante El Buen Sabor
                          </h4>
                          <p className="text-[10px] text-slate-300 line-clamp-1">
                            Sazón tradicional y platos frescos del día
                          </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center font-black text-xs text-white shadow-md shrink-0">
                          EBS
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-300 border-t border-white/10 pt-2 relative z-10">
                        <span className="truncate">📍 Calle 72 # 44-20 • Barranquilla</span>
                        <span className="text-emerald-400 font-bold shrink-0">● Abierto</span>
                      </div>

                      {/* Quick action buttons */}
                      <div className="grid grid-cols-2 gap-1.5 pt-0.5 relative z-10">
                        <button
                          type="button"
                          onClick={() => alert("Simulación: Abre chat directo con el restaurante por WhatsApp.")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          <MessageSquare className="h-3 w-3" /> WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={() => alert("Simulación: Abre ubicación del restaurante en Google Maps.")}
                          className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold py-1.5 px-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                        >
                          <MapPin className="h-3 w-3" /> Cómo Llegar
                        </button>
                      </div>
                    </div>

                    {/* INTERACTIVE MODE SELECTOR (LLEVAR vs MESA) */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDemoOrderMode("LLEVAR")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                          demoOrderMode === "LLEVAR"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>🛵 Para Llevar / Domicilio</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDemoOrderMode("MESA")}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 ${
                          demoOrderMode === "MESA"
                            ? "bg-brand-600 text-white shadow-xs"
                            : "text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span>🍽️ Comer en Mesa</span>
                      </button>
                    </div>

                    {/* FEATURED: ⭐ ESPECIAL DEL DÍA */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-50/70 to-orange-50/50 border-2 border-amber-300 shadow-sm p-3 space-y-2.5">
                      <div className="flex items-start gap-2.5">
                        <div className="relative shrink-0">
                          <img
                            src={demoSpecialItem.imageUrl}
                            alt={demoSpecialItem.name}
                            className="h-16 w-16 rounded-xl object-cover border border-amber-300 shadow-xs"
                          />
                          <span className="absolute -top-1 -left-1 h-5 w-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow">
                            ⭐
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              ⭐ Especial del Día
                            </span>
                          </div>
                          <h5 className="text-xs font-black text-slate-900 leading-snug">
                            {demoSpecialItem.name}
                          </h5>
                          <p className="text-[10px] text-slate-600 line-clamp-2 leading-tight">
                            {demoSpecialItem.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-amber-200/60">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block">
                            {demoOrderMode === "MESA" ? "Precio en Mesa" : "Precio Para Llevar"}
                          </span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-sm font-black text-emerald-700">
                              {formatCurrency(demoOrderMode === "MESA" ? demoSpecialItem.priceMesa : demoSpecialItem.priceLlevar)}
                            </span>
                            <span className="text-[9px] font-semibold text-slate-400">
                              ({demoOrderMode === "MESA" ? "Llevar: " : "Mesa: "}
                              {formatCurrency(demoOrderMode === "MESA" ? demoSpecialItem.priceLlevar : demoSpecialItem.priceMesa)})
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDemoAddToCart(demoSpecialItem)}
                          className="text-[11px] bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-700 hover:to-brand-700 text-white px-3 py-1.5 rounded-lg font-black shadow-sm active:scale-95 transition-all flex items-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" /> Pedir Especial
                        </button>
                      </div>
                    </div>

                    {/* Regular Menu Items List */}
                    <div className="space-y-2">
                      {demoMenuItems.map((item) => {
                        const activePrice = demoOrderMode === "MESA" ? item.priceMesa : item.priceLlevar;
                        const otherPrice = demoOrderMode === "MESA" ? item.priceLlevar : item.priceMesa;

                        return (
                          <div
                            key={item.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              item.available
                                ? "bg-white border-slate-200/80 shadow-xs"
                                : "bg-slate-100/80 border-slate-200 opacity-60"
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-start gap-2 min-w-0">
                                {item.imageUrl && (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-lg object-cover border border-slate-100 shrink-0"
                                  />
                                )}
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                                      {item.category}
                                    </span>
                                    {item.tag && item.available && (
                                      <span className="text-[8px] font-extrabold text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded-full">
                                        {item.tag}
                                      </span>
                                    )}
                                  </div>
                                  <h6 className="text-[11px] font-extrabold text-slate-950 leading-tight">
                                    {item.name}
                                  </h6>
                                  <p className="text-[9px] text-slate-500 line-clamp-1 leading-tight">
                                    {item.desc}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[11px] font-black text-brand-700 block">
                                  {formatCurrency(activePrice)}
                                </span>
                                <span className="text-[8px] font-semibold text-slate-400 block">
                                  {demoOrderMode === "MESA" ? "Llevar: " : "Mesa: "}
                                  {formatCurrency(otherPrice)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              {item.available ? (
                                <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                  ● Disponible
                                </span>
                              ) : (
                                <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-full">
                                  ✕ AGOTADO
                                </span>
                              )}

                              {item.available && (
                                <button
                                  type="button"
                                  onClick={() => handleDemoAddToCart(item)}
                                  className="text-[10px] bg-brand-600 hover:bg-brand-700 active:scale-95 text-white px-2.5 py-1 rounded-md font-bold shadow-xs transition-all flex items-center gap-0.5"
                                >
                                  <Plus className="h-3 w-3" /> Agregar
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FLOATING CUSTOMER STICKY CART BAR (matches Section 20) */}
                  {demoTotalItems > 0 && (
                    <div className="absolute bottom-3 left-3 right-3 z-20">
                      <button
                        type="button"
                        onClick={() => setDemoShowCartDrawer(true)}
                        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-12 rounded-xl flex items-center justify-between px-3.5 shadow-xl transition-all active:scale-[0.98] select-none border border-brand-500/50 animate-in fade-in slide-in-from-bottom-2 duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-xs">
                            {demoTotalItems}
                          </div>
                          <div className="text-left">
                            <span className="text-[11px] font-black block leading-none">
                              {demoOrderMode === "MESA" ? "🍽️ Pedido en Mesa" : "🛵 Mi Pedido"}
                            </span>
                            <span className="text-[9px] text-brand-100 font-semibold">
                              Total: {formatCurrency(demoSubtotal)}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-black flex items-center gap-0.5 uppercase tracking-wider bg-white/15 px-2 py-1 rounded-lg">
                          Ver Carrito <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    </div>
                  )}

                  {/* IN-MOCKUP CART DRAWER MODAL (Real customer checkout preview) */}
                  {demoShowCartDrawer && (
                    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs rounded-[2.3rem] overflow-hidden animate-in fade-in duration-150">
                      <div className="bg-white rounded-t-2xl shadow-2xl border-t border-slate-200 max-h-[82%] flex flex-col justify-between overflow-hidden animate-in slide-in-from-bottom duration-200">
                        {/* Drawer Header */}
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                          <div className="flex items-center gap-1.5">
                            <ShoppingBag className="h-4 w-4 text-brand-600" />
                            <h6 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                              Detalle del Pedido
                            </h6>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDemoShowCartDrawer(false)}
                            className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-200/70 px-2 py-1 rounded-md"
                          >
                            Cerrar
                          </button>
                        </div>

                        {/* Order Mode Pill in Cart */}
                        <div className="px-3 pt-2">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            demoOrderMode === "MESA"
                              ? "bg-brand-50 text-brand-700 border border-brand-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}>
                            {demoOrderMode === "MESA" ? "🍽️ Modo: Comer en Mesa" : "🛵 Modo: Para Llevar / Domicilio"}
                          </span>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[220px]">
                          {demoCart.map((cartItem) => {
                            const itemPrice = demoOrderMode === "MESA" ? cartItem.priceMesa : cartItem.priceLlevar;
                            return (
                              <div
                                key={cartItem.id}
                                className="p-2 bg-slate-50 border border-slate-200/80 rounded-lg flex items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <span className="text-[11px] font-bold text-slate-900 block truncate">
                                    {cartItem.name}
                                  </span>
                                  <span className="text-[9px] text-brand-700 font-bold block">
                                    {formatCurrency(itemPrice)} c/u
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-md p-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleDemoUpdateQty(cartItem.id, -1)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-[10px] font-bold w-4 text-center">
                                    {cartItem.qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDemoUpdateQty(cartItem.id, 1)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-500"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Drawer Footer & Checkout Action */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-900">
                            <span>Subtotal platos:</span>
                            <span className="text-xs font-black text-brand-700">
                              {formatCurrency(demoSubtotal)}
                            </span>
                          </div>

                          {demoOrderSuccess ? (
                            <div className="p-2 bg-emerald-500 text-white rounded-xl text-center space-y-0.5 animate-in zoom-in-95">
                              <span className="text-[10px] font-black block">🎉 ¡Pedido Enviado con Éxito!</span>
                              <p className="text-[8px] opacity-90">Llega directo a la comanda del restaurante.</p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDemoOrderSuccess(true)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl text-xs flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                            >
                              <MessageSquare className="h-3.5 w-3.5" /> Enviar Pedido por WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
