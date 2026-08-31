"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { restaurantService } from "@/services/restaurantService";
import { formatCurrency, getLocalDateString } from "@/lib/utils";
import { optimizeDishImage } from "@/lib/imageOptimizer";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Save,
  Copy,
  Eye,
  Loader2,
  Calendar,
  Camera,
  Image as ImageIcon,
  X,
  Sparkles,
} from "lucide-react";

interface FormItem {
  id?: string;
  category_name: string;
  name: string;
  description: string;
  price: number;
  image_url?: string | null;
  is_available: boolean;
}

export default function DailyMenuPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuDate, setMenuDate] = useState<string>("");
  const [menuTitle, setMenuTitle] = useState("Menú del Día");
  const [menuStatus, setMenuStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [menuItems, setMenuItems] = useState<FormItem[]>([]);
  const [pastMenus, setPastMenus] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  useEffect(() => {
    // Default menu date is current local date
    const today = getLocalDateString();
    setMenuDate(today);

    async function loadData() {
      try {
        const session = await authService.getSession();
        if (session) {
          setRestaurant(session.restaurant);

          // Get categories
          const cats = await restaurantService.getCategories(session.restaurant.id);
          setCategories(cats);

          // Try to load active menu for today
          const activeMenu = await restaurantService.getActiveMenu(session.restaurant.id);
          if (activeMenu) {
            setMenuId(activeMenu.id);
            setMenuDate(activeMenu.menu_date);
            setMenuTitle(activeMenu.title);
            setMenuStatus(activeMenu.status as any);
            setMenuItems(
              activeMenu.items?.map((i: any) => ({
                id: i.id,
                category_name: i.category_name,
                name: i.name,
                description: i.description || "",
                price: Number(i.price),
                image_url: i.image_url || null,
                is_available: i.is_available,
              })) || []
            );
          } else {
            setMenuItems([]);
          }

          // Fetch historical menus for cloning
          const history = await restaurantService.getMenusList(session.restaurant.id);
          setPastMenus(history);
        }
      } catch (err) {
        console.error("Error al cargar menú:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddItem = (categoryName: string) => {
    const defaultPrice = menuItems.length > 0 ? menuItems[menuItems.length - 1].price : 18000;
    setMenuItems((prev) => [
      ...prev,
      {
        category_name: categoryName,
        name: "",
        description: "",
        price: defaultPrice,
        image_url: null,
        is_available: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setMenuItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    setMenuItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleToggleAvailable = async (index: number, itemId?: string) => {
    const nextVal = !menuItems[index].is_available;
    handleItemChange(index, "is_available", nextVal);

    if (itemId) {
      try {
        await restaurantService.updateItemAvailability(itemId, nextVal);
      } catch {
        // Ignore fallback
      }
    }
  };

  // Handle Photo Upload with 350x350 WebP Optimization
  const handlePhotoUpload = async (index: number, file: File) => {
    setUploadingIdx(index);
    try {
      const webpDataUrl = await optimizeDishImage(file, 350, 0.8);
      handleItemChange(index, "image_url", webpDataUrl);
    } catch (err: any) {
      alert(err?.message || "No se pudo procesar la foto.");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleRemovePhoto = (index: number) => {
    handleItemChange(index, "image_url", null);
  };

  // Copy Menu from history
  const handleCloneMenu = async (pastMenuId: string) => {
    setIsLoading(true);
    setShowHistoryModal(false);
    try {
      const pastMenu = await restaurantService.getMenuById(pastMenuId);
      if (pastMenu && pastMenu.items) {
        setMenuTitle(pastMenu.title);
        setMenuItems(
          pastMenu.items.map((i) => ({
            category_name: i.category_name,
            name: i.name,
            description: i.description || "",
            price: Number(i.price),
            image_url: i.image_url || null,
            is_available: true,
          }))
        );
        setFeedback("Menú copiado con éxito. Haz clic en Guardar para publicarlo hoy.");
      }
    } catch {
      setFeedback("Error al copiar el menú anterior.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Auto-filter blank dish cards
    const validItems = menuItems.filter((i) => i.name && i.name.trim().length > 0);

    if (validItems.length === 0) {
      setFeedback("Por favor agrega al menos un plato con nombre.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const saved = await restaurantService.saveMenu(
        restaurant.id,
        menuDate,
        menuTitle,
        menuStatus,
        validItems
      );
      setMenuId(saved.id);
      setMenuItems(validItems);
      setFeedback("¡Menú guardado y publicado con éxito!");
      
      const history = await restaurantService.getMenusList(restaurant.id);
      setPastMenus(history);
    } catch (err) {
      setFeedback("No se pudo guardar el menú.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando creador de menú...</p>
      </div>
    );
  }

  const defaultCategories = SITE_CONFIG.defaultCategories || [
    "Platos Ejecutivos / Menú del Día",
    "Sopas del Día",
    "Bebidas",
    "Adicionales",
  ];
  const categoriesList =
    categories.length > 0
      ? categories.map((c) => (typeof c === "string" ? c : c.name))
      : defaultCategories;

  return (
    <div className="space-y-6">
      
      {/* HEADER TOPBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Creador de Menú
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Menú del Día
          </h1>
          <p className="text-xs text-slate-500">
            Define los platos, descripciones y fotos de tus almuerzos de hoy.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleAddItem(categoriesList[0] || "Platos Ejecutivos / Menú del Día")}
            className="gap-1.5 font-bold shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Plato</span>
          </Button>

          {pastMenus.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="gap-1.5 font-bold"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar Menú Anterior</span>
            </Button>
          )}

          <Link href={`/r/${restaurant?.slug}`} target="_blank">
            <Button type="button" variant="outline" size="sm" className="gap-1.5 font-bold">
              <Eye className="h-3.5 w-3.5" />
              <span>Ver Menú Público</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-xs ${
          feedback.includes("éxito")
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-rose-50 border border-rose-200 text-rose-800"
        }`}>
          {feedback}
        </div>
      )}

      {/* FORM BUILDER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* HEADER CONFIG CARD */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Título del Menú
                </label>
                <input
                  type="text"
                  required
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-600 text-slate-900"
                  placeholder="Ej: Menú del Día"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={menuDate}
                  onChange={(e) => setMenuDate(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-600 text-slate-900"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Estado
                </label>
                <select
                  value={menuStatus}
                  onChange={(e: any) => setMenuStatus(e.target.value)}
                  className="w-full h-11 px-3.5 text-sm font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-600 text-slate-900"
                >
                  <option value="PUBLISHED">🟢 Publicado (Visible hoy)</option>
                  <option value="DRAFT">⚪ Borrador</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CATEGORIES AND DISHES */}
        <div className="space-y-6">
          {categoriesList.map((category) => {
            const categoryItems = menuItems.filter((i) => i.category_name === category);

            return (
              <Card key={category} className="border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50/80 border-b border-slate-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-1 bg-brand-600 rounded-full" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                      {category}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {categoryItems.length} {categoryItems.length === 1 ? "plato" : "platos"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddItem(category)}
                    className="font-bold text-xs gap-1 bg-white hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Agregar Plato</span>
                  </Button>
                </div>

                <CardContent className="p-4 space-y-3">
                  {categoryItems.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs text-slate-400 font-semibold mb-2">No has agregado platos a esta categoría.</p>
                      <button
                        type="button"
                        onClick={() => handleAddItem(category)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-800 inline-flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar primer plato
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {menuItems.map((item, idx) => {
                        if (item.category_name !== category) return null;

                        return (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border transition-all ${
                              item.is_available
                                ? "bg-white border-slate-200 hover:border-slate-300"
                                : "bg-slate-50 border-slate-200 opacity-70"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              
                              {/* PHOTO THUMBNAIL / UPLOADER (350x350 WebP) */}
                              <div className="relative shrink-0 self-center sm:self-auto">
                                <input
                                  type="file"
                                  id={`photo-input-${idx}`}
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoUpload(idx, file);
                                  }}
                                />

                                {item.image_url ? (
                                  <div className="relative group">
                                    <img
                                      src={item.image_url}
                                      alt={item.name || "Foto del plato"}
                                      className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-slate-200 shadow-xs"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePhoto(idx)}
                                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow hover:bg-rose-700"
                                      title="Quitar foto"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <label
                                    htmlFor={`photo-input-${idx}`}
                                    className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-400 hover:text-brand-600 group"
                                    title="Subir foto del plato (Auto optimizada a 350x350 WebP)"
                                  >
                                    {uploadingIdx === idx ? (
                                      <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
                                    ) : (
                                      <>
                                        <Camera className="h-5 w-5 group-hover:scale-110 transition-transform" />
                                        <span className="text-[9px] font-extrabold uppercase tracking-tight mt-1">
                                          Foto
                                        </span>
                                      </>
                                    )}
                                  </label>
                                )}
                              </div>

                              {/* DISH NAME, PRICE & DESCRIPTION */}
                              <div className="flex-1 w-full space-y-2.5">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                  <div className="sm:col-span-2">
                                    <input
                                      type="text"
                                      placeholder="Nombre del plato (ej: Pechuga a la Plancha)"
                                      value={item.name}
                                      onChange={(e) => handleItemChange(idx, "name", e.target.value)}
                                      className="w-full h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-slate-900"
                                    />
                                  </div>
                                  <div>
                                    <input
                                      type="number"
                                      placeholder="Precio (COP)"
                                      value={item.price}
                                      onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                                      className="w-full h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-brand-700"
                                    />
                                  </div>
                                </div>

                                <input
                                  type="text"
                                  placeholder="Acompañamiento o descripción (ej: arroz con coco, ensalada rusa y patacón)"
                                  value={item.description}
                                  onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                  className="w-full h-9 px-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-slate-600"
                                />
                              </div>

                              {/* AVAILABILITY TOGGLE & DELETE */}
                              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleToggleAvailable(idx, item.id)}
                                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                    item.is_available
                                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                      : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                                  }`}
                                >
                                  {item.is_available ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5" /> Disponible
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="h-3.5 w-3.5" /> Agotado
                                    </>
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Eliminar plato"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-500">
            {menuItems.filter((i) => i.name.trim()).length} platos configurados para hoy
          </div>

          <Button
            type="submit"
            variant="primary"
            className="font-bold text-sm h-11 px-8 gap-2 shadow-md"
            isLoading={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>Guardar y Publicar Menú</span>
          </Button>
        </div>

      </form>

      {/* CLONING HISTORY MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 z-10 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Copiar Menú Anterior</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Cerrar
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-y-auto space-y-3">
              {pastMenus.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-6">No hay menús registrados anteriormente.</p>
              ) : (
                pastMenus.map((menu) => (
                  <div
                    key={menu.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{menu.title}</span>
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" /> {menu.menu_date}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloneMenu(menu.id)}
                      className="font-bold text-xs"
                    >
                      Copiar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
