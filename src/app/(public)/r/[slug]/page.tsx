"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { restaurantService } from "@/services/restaurantService";
import { subscriptionService } from "@/services/subscriptionService";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import {
  UtensilsCrossed,
  MapPin,
  Clock,
  Phone,
  MessageSquare,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
  Loader2,
  HelpCircle,
  Sparkles,
  Star,
} from "lucide-react";

export default function PublicRestaurantPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Todos");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trialStatus, setTrialStatus] = useState<any>(null);

  // Cart Management
  const [orderMode, setOrderMode] = useState<"LLEVAR" | "MESA">("LLEVAR");

  // Cart
  const { cart, addToCart, syncPriceMode, updateQuantity, removeFromCart, getSubtotal } = useCart(slug);
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  useEffect(() => {
    async function loadPublicMenu() {
      try {
        const profile = await restaurantService.getProfile(slug);
        setRestaurant(profile);

        const activeMenu = await restaurantService.getActiveMenu(profile.id, true);
        setMenu(activeMenu);

        const status = await subscriptionService.checkTrialStatus(profile.id);
        setTrialStatus(status);
      } catch (err: any) {
        setError("El restaurante solicitado no existe o no se encuentra activo.");
      } finally {
        setIsLoading(false);
      }
    }
    loadPublicMenu();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando Menú del Día...</p>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="h-14 w-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <HelpCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-black text-slate-900">Restaurante no encontrado</h2>
        <p className="text-xs text-slate-500 max-w-xs">{error || "El enlace ingresado es incorrecto."}</p>
        <Link href="/">
          <Button variant="primary" size="sm">Volver al Inicio</Button>
        </Link>
      </div>
    );
  }

  // Helper to identify special items
  const isItemSpecial = (item: any) =>
    Boolean(item.is_special || (item.description && item.description.startsWith("[ESPECIAL]")));

  // Categories list (excludes categories that only contain specials)
  const categories = ["Todos"];
  if (menu && menu.items) {
    menu.items.forEach((item: any) => {
      if (!categories.includes(item.category_name)) {
        categories.push(item.category_name);
      }
    });
  }

  const specialItems = menu && menu.items
    ? menu.items.filter((i: any) => isItemSpecial(i))
    : [];

  // Exclude special items from repeating below because they are already featured at the top
  const filteredItems = menu && menu.items
    ? menu.items.filter(
        (i: any) =>
          !isItemSpecial(i) && (activeCategory === "Todos" || i.category_name === activeCategory)
      )
    : [];

  const cartCount = cart.reduce((acc, c) => acc + c.quantity, 0);
  const subtotal = getSubtotal();

  const handleModeChange = (mode: "LLEVAR" | "MESA") => {
    setOrderMode(mode);
    syncPriceMode(mode);
  };

  const handleCheckoutRedirect = () => {
    if (cart.length === 0) return;
    router.push(`/r/${slug}/pedido?mode=${orderMode.toLowerCase()}`);
  };

  // Maps Link
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${restaurant.name} ${restaurant.address} ${restaurant.city}`
  )}`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 selection:bg-brand-500 selection:text-white relative">
      {/* Schema.org SEO Structured Data (Section 30) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Restaurant",
            "name": restaurant.name,
            "image": restaurant.logo_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
            "telephone": restaurant.phone || restaurant.whatsapp,
            "address": {
              "@type": "PostalAddress",
              "streetAddress": restaurant.address,
              "addressLocality": restaurant.city,
              "addressCountry": "CO",
            },
            "servesCuisine": restaurant.restaurant_type,
            "priceRange": "$$",
          }),
        }}
      />

      {/* RESTAURANT HERO HEADER */}
      <div className="bg-slate-900 text-white relative overflow-hidden">
        {/* Decorative blur elements */}
        <div className="absolute top-0 right-0 h-48 w-48 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 bg-accent-500/10 rounded-full blur-3xl" />

        <div className="max-w-xl mx-auto px-4 pt-10 pb-6 space-y-4 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
                {restaurant.restaurant_type}
              </span>
              <h1 className="text-2xl font-black tracking-tight leading-tight">
                {restaurant.name}
              </h1>
              <p className="text-xs text-slate-300 max-w-xs">{restaurant.description}</p>
            </div>
            
            <div className="h-14 w-14 rounded-2xl bg-brand-600 flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0">
              {restaurant.name.slice(0, 2).toUpperCase()}
            </div>
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-400 shrink-0" />
              <span className="truncate">{restaurant.address} • {restaurant.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-400 shrink-0" />
              <span>{restaurant.opening_hours || "Abierto Hoy"}</span>
            </div>
          </div>

          {/* Action pills (Section 18) */}
          <div className="flex gap-2 pt-2">
            <a
              href={`https://wa.me/${restaurant.whatsapp}`}
              target="_blank"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              <MessageSquare className="h-4 w-4" /> WhatsApp
            </a>
            <a
              href={mapsUrl}
              target="_blank"
              className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs py-2.5 rounded-xl transition-colors"
            >
              <MapPin className="h-4 w-4 text-slate-300" /> Cómo Llegar
            </a>
          </div>
        </div>
      </div>

      {/* BODY CONTENT - MENU LIST */}
      <div className="max-w-xl mx-auto px-4 mt-4 space-y-4">
        
        {/* PWA INSTALL BANNER */}
        <InstallPwaButton variant="banner" />
        
        {/* Trial Expired Alert */}
        {trialStatus && !trialStatus.active && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center space-y-1.5 shadow-sm">
            <span className="text-xs font-black text-rose-800 uppercase tracking-widest block">Servicio Pausado</span>
            <p className="text-xs text-rose-600 leading-relaxed font-semibold">
              Este restaurante ha pausado temporalmente la recepción de pedidos en línea.
            </p>
          </div>
        )}

        {/* Menu Date title */}
        {menu ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                {menu.title}
              </h2>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{formatDate(menu.menu_date)}</p>
            </div>
            <Badge variant="success" size="sm" dot pulse>
              Activo hoy
            </Badge>
          </div>
        ) : (
          <div className="py-12 text-center bg-white border border-slate-200 rounded-3xl p-6 space-y-3">
            <UtensilsCrossed className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">Aún no hay menú publicado hoy</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              El restaurante actualizará la lista de almuerzos del día pronto. Regresa más tarde.
            </p>
          </div>
        )}

        {/* ORDER MODE SELECTOR (MESA vs LLEVAR) */}
        {menu && (
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleModeChange("LLEVAR")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                orderMode === "LLEVAR"
                  ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>🛵 Para Llevar / Domicilio</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange("MESA")}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                orderMode === "MESA"
                  ? "bg-brand-600 text-white shadow-sm shadow-brand-600/20"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span>🍽️ Para Comer en Mesa</span>
            </button>
          </div>
        )}

        {/* SPECIAL OF THE DAY FEATURED SECTION */}
        {menu && specialItems.length > 0 && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/30">
                  <Sparkles className="h-3.5 w-3.5 fill-white" />
                  Especial del Día
                </span>
                <span className="text-xs font-bold text-amber-900 hidden sm:inline">
                  Recomendado de hoy
                </span>
              </div>
              <span className="text-[11px] font-extrabold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                ⭐ Plato Estrella
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {specialItems.map((item: any) => {
                const cleanDescription = (item.description || "")
                  .replace(/^\[ESPECIAL\]\s*/i, "")
                  .trim();
                const activePrice =
                  orderMode === "MESA"
                    ? Number(item.price_dinein || item.price)
                    : Number(item.price_takeaway || item.price);
                const otherPrice =
                  orderMode === "MESA"
                    ? Number(item.price_takeaway || item.price)
                    : Number(item.price_dinein || item.price);

                return (
                  <div
                    key={`special-${item.id || item.name}`}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-50/50 to-orange-50/40 border-2 border-amber-300 shadow-md transition-all hover:shadow-lg hover:border-amber-400 group"
                  >
                    {/* Glowing highlight background effect */}
                    <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-amber-300/30 to-orange-300/20 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

                    <div className="p-4 sm:p-5 relative z-10 space-y-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {item.image_url ? (
                          <div className="relative shrink-0 self-center sm:self-auto group-hover:scale-[1.02] transition-transform">
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-amber-300/60"
                            />
                            <span className="absolute -top-1.5 -left-1.5 h-6 w-6 rounded-full bg-amber-500 text-white flex items-center justify-center shadow text-xs">
                              ⭐
                            </span>
                          </div>
                        ) : (
                          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-amber-200 to-amber-300 flex items-center justify-center text-amber-800 text-2xl shrink-0 shadow-inner">
                            ✨
                          </div>
                        )}

                        <div className="flex-1 min-w-0 space-y-1.5 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2.5 py-0.5 rounded-full">
                              {item.category_name}
                            </span>
                            {!item.is_available && (
                              <Badge variant="danger" size="sm">
                                Agotado
                              </Badge>
                            )}
                          </div>

                          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                            {item.name}
                          </h3>

                          {cleanDescription && (
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                              {cleanDescription}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-amber-200/60">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            {orderMode === "MESA" ? "Precio en Mesa" : "Precio Para Llevar"}
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg sm:text-xl font-black text-emerald-700">
                              {formatCurrency(activePrice)}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-400">
                              ({orderMode === "MESA" ? "Llevar: " : "En mesa: "}
                              {formatCurrency(otherPrice)})
                            </span>
                          </div>
                        </div>

                        {item.is_available && (!trialStatus || trialStatus.active) && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              addToCart(
                                { ...item, price: activePrice, description: cleanDescription },
                                1,
                                "",
                                orderMode
                              )
                            }
                            className="h-10 px-4 rounded-xl font-black gap-1.5 text-xs bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-700 hover:to-brand-700 text-white shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
                          >
                            <Plus className="h-4 w-4 stroke-[3]" /> Pedir Especial
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Categories filters */}
        {menu && categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-xs px-4 py-2 rounded-full font-bold transition-all shrink-0 border ${
                  activeCategory === cat
                    ? "bg-brand-600 border-brand-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Menu items list (Section 18) - Displays dishes that are not featured as specials */}
        {menu && (
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              specialItems.length === 0 ? (
                <p className="text-center text-xs text-slate-400 italic py-6">No hay platos disponibles en este momento.</p>
              ) : activeCategory !== "Todos" ? (
                <p className="text-center text-xs text-slate-400 italic py-6">No hay otros platos en esta categoría hoy.</p>
              ) : null
            ) : (
              filteredItems.map((item: any) => {
                const isSpecial = Boolean(
                  item.is_special || (item.description && item.description.startsWith("[ESPECIAL]"))
                );
                const cleanDescription = (item.description || "")
                  .replace(/^\[ESPECIAL\]\s*/i, "")
                  .trim();
                const activePrice =
                  orderMode === "MESA"
                    ? Number(item.price_dinein || item.price)
                    : Number(item.price_takeaway || item.price);
                const otherPrice =
                  orderMode === "MESA"
                    ? Number(item.price_takeaway || item.price)
                    : Number(item.price_dinein || item.price);

                return (
                  <Card
                    key={item.id || item.name}
                    className={`border-slate-200/80 transition-opacity ${
                      !item.is_available && "opacity-60 bg-slate-50/50"
                    } ${isSpecial ? "border-amber-200 bg-amber-50/10 shadow-xs" : ""}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-slate-100 shrink-0 shadow-xs"
                            />
                          )}
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {item.category_name}
                              </span>
                              {isSpecial && (
                                <span className="text-[9px] font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  ⭐ Especial
                                </span>
                              )}
                              {!item.is_available && (
                                <Badge variant="danger" size="sm">
                                  Agotado
                                </Badge>
                              )}
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-950">{item.name}</h4>
                            {cleanDescription && (
                              <p className="text-xs text-slate-500 leading-relaxed pt-0.5">{cleanDescription}</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <span className="text-sm font-black text-brand-700 block">
                            {formatCurrency(activePrice)}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {orderMode === "MESA" ? "Llevar: " : "Mesa: "}
                            {formatCurrency(otherPrice)}
                          </span>
                        </div>
                      </div>

                      {/* Add to cart action */}
                      {item.is_available && (!trialStatus || trialStatus.active) && (
                        <div className="flex justify-end pt-1">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              addToCart(
                                { ...item, price: activePrice, description: cleanDescription },
                                1,
                                "",
                                orderMode
                              )
                            }
                            className="h-9 px-3 rounded-lg font-bold gap-1 text-xs"
                          >
                            <Plus className="h-3.5 w-3.5" /> Agregar al Pedido
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}

      </div>

      {/* FLOATING CLIENT CART DRAWER TRIGGER (Section 20) */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => setShowCartDrawer(true)}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold h-14 rounded-2xl flex items-center justify-between px-5 shadow-xl transition-transform active:scale-[0.99] select-none"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-black text-xs">
                  {cartCount}
                </div>
                <div className="text-left">
                  <span className="text-xs font-black block leading-none">Mi Pedido</span>
                  <span className="text-[10px] text-brand-100 font-semibold">Total: {formatCurrency(subtotal)}</span>
                </div>
              </div>
              
              <span className="text-xs font-black flex items-center gap-0.5 uppercase tracking-wider">
                Ver Carrito <ChevronRight className="h-4 w-4" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* CART DRAWER MODAL */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-xs">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setShowCartDrawer(false)} />
          
          {/* Content Card */}
          <div className="relative w-full max-w-xl bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 z-10 overflow-hidden max-h-[85vh] flex flex-col justify-between">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Detalle del Pedido</h3>
              </div>
              <button
                onClick={() => setShowCartDrawer(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg"
              >
                Cerrar
              </button>
            </div>

            {/* Cart Items list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map((cartItem) => (
                <div key={cartItem.item.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">{cartItem.item.name}</span>
                    <span className="text-[10px] text-brand-700 font-bold block">{formatCurrency(cartItem.item.price)} c/u</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(cartItem.item.id, cartItem.quantity - 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{cartItem.quantity}</span>
                      <button
                        onClick={() => addToCart(cartItem.item, 1)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-500"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart footer total & redirection */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-950">
                <span>Subtotal platos:</span>
                <span className="text-sm font-black text-brand-700">{formatCurrency(subtotal)}</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none">Las tarifas de envío a domicilio se calculan en el siguiente paso.</p>
              
              <Button
                onClick={handleCheckoutRedirect}
                variant="primary"
                className="w-full font-bold h-12 text-sm"
              >
                Pedir Ahora <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
