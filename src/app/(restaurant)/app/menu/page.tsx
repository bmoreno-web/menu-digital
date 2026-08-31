"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { restaurantService } from "@/services/restaurantService";
import { getLocalDateString } from "@/lib/utils";
import { optimizeDishImage } from "@/lib/imageOptimizer";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
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
  X,
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
    const today = getLocalDateString();
    setMenuDate(today);

    async function loadData() {
      try {
        const session = await authService.getSession();
        if (session) {
          setRestaurant(session.restaurant);

          // Try to load active menu for today
          const activeMenu = await restaurantService.getActiveMenu(session.restaurant.id);
          if (activeMenu && activeMenu.items && activeMenu.items.length > 0) {
            setMenuId(activeMenu.id);
            setMenuDate(activeMenu.menu_date);
            setMenuTitle(activeMenu.title);
            setMenuStatus(activeMenu.status as any);
            setMenuItems(
              activeMenu.items.map((i: any) => ({
                id: i.id,
                category_name: i.category_name || "Platos del Día",
                name: i.name,
                description: i.description || "",
                price: Number(i.price),
                image_url: i.image_url || null,
                is_available: i.is_available,
              }))
            );
          } else {
            // Start with 1 ready dish row
            setMenuItems([
              {
                category_name: "Platos del Día",
                name: "",
                description: "",
                price: 18000,
                image_url: null,
                is_available: true,
              },
            ]);
          }

          // Fetch historical menus for copying
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

  const handleAddItem = () => {
    const lastPrice = menuItems.length > 0 ? menuItems[menuItems.length - 1].price : 18000;
    setMenuItems((prev) => [
      ...prev,
      {
        category_name: "Platos del Día",
        name: "",
        description: "",
        price: lastPrice,
        image_url: null,
        is_available: true,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (menuItems.length === 1) {
      // Just clear the single remaining item
      setMenuItems([
        {
          category_name: "Platos del Día",
          name: "",
          description: "",
          price: 18000,
          image_url: null,
          is_available: true,
        },
      ]);
      return;
    }
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

  const handleCloneMenu = async (pastMenuId: string) => {
    setIsLoading(true);
    setShowHistoryModal(false);
    try {
      const pastMenu = await restaurantService.getMenuById(pastMenuId);
      if (pastMenu && pastMenu.items && pastMenu.items.length > 0) {
        setMenuTitle(pastMenu.title);
        setMenuItems(
          pastMenu.items.map((i) => ({
            category_name: "Platos del Día",
            name: i.name,
            description: i.description || "",
            price: Number(i.price),
            image_url: i.image_url || null,
            is_available: true,
          }))
        );
        setFeedback("Menú copiado. Haz clic en Guardar para publicarlo hoy.");
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
      alert("Por favor ingresa el nombre de al menos un plato.");
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      let targetRestaurantId = restaurant?.id;
      if (!targetRestaurantId) {
        const session = await authService.getSession();
        if (session?.restaurant?.id) {
          targetRestaurantId = session.restaurant.id;
          setRestaurant(session.restaurant);
        }
      }

      if (!targetRestaurantId) {
        throw new Error("No se encontró el restaurante activo. Por favor selecciona un restaurante.");
      }

      const saved = await restaurantService.saveMenu(
        targetRestaurantId,
        menuDate,
        menuTitle,
        menuStatus,
        validItems
      );
      setMenuId(saved.id);
      setMenuItems(validItems);
      setFeedback("¡Menú guardado y publicado con éxito!");

      const history = await restaurantService.getMenusList(targetRestaurantId);
      setPastMenus(history);
    } catch (err: any) {
      console.error("Error saving menu:", err);
      setFeedback(err?.message || "No se pudo guardar el menú.");
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* HEADER TOPBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Armar Menú
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Platos del Día
          </h1>
          <p className="text-xs text-slate-500">
            Agrega los platos que ofrecerás hoy con su nombre, detalles y precio.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {pastMenus.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHistoryModal(true)}
              className="gap-1.5 font-bold"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>Copiar Anterior</span>
            </Button>
          )}

          <Link href={`/r/${restaurant?.slug}`} target="_blank">
            <Button type="button" variant="outline" size="sm" className="gap-1.5 font-bold">
              <Eye className="h-3.5 w-3.5" />
              <span>Ver Menú</span>
            </Button>
          </Link>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-2xl text-xs font-bold shadow-xs ${
          feedback.includes("éxito") || feedback.includes("copiado")
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-rose-50 border border-rose-200 text-rose-800"
        }`}>
          {feedback}
        </div>
      )}

      {/* FORM BUILDER */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* DATE & TITLE */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Título del Menú
                </label>
                <input
                  type="text"
                  required
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-600 text-slate-900"
                  placeholder="Ej: Menú del Día"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={menuDate}
                  onChange={(e) => setMenuDate(e.target.value)}
                  className="w-full h-10 px-3.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-brand-600 text-slate-900"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* LIST OF DISHES */}
        <div className="space-y-3">
          {menuItems.map((item, idx) => (
            <Card
              key={idx}
              className={`border transition-all ${
                item.is_available
                  ? "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                  : "bg-slate-50/70 border-slate-200 opacity-70"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5">
                  
                  {/* PHOTO (Max 350x350 WebP) */}
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
                          className="h-16 w-16 sm:h-18 sm:w-18 rounded-xl object-cover border border-slate-200 shadow-xs"
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
                        className="h-16 w-16 sm:h-18 sm:w-18 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/50 flex flex-col items-center justify-center cursor-pointer transition-all text-slate-400 hover:text-brand-600 group"
                        title="Subir foto (Optimizada a 350x350 WebP)"
                      >
                        {uploadingIdx === idx ? (
                          <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                        ) : (
                          <>
                            <Camera className="h-4 w-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px] font-extrabold uppercase mt-1">Foto</span>
                          </>
                        )}
                      </label>
                    )}
                  </div>

                  {/* DISH NAME, DETAILS & PRICE */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
                          placeholder="Precio ($)"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                          className="w-full h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-brand-700"
                        />
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Detalles / Acompañamiento (ej: Arroz de coco, ensalada rusa y patacón)"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full h-8.5 px-3 text-xs bg-slate-50/70 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-slate-600"
                    />
                  </div>

                  {/* AVAILABILITY & DELETE */}
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
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ADD DISH BUTTON */}
        <div>
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-3.5 border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50/40 rounded-2xl flex items-center justify-center gap-2 text-xs font-black text-brand-700 transition-all active:scale-[0.99]"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>Añadir Otro Plato</span>
          </button>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="sticky bottom-4 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-4">
          <div className="text-xs font-bold text-slate-500">
            {menuItems.filter((i) => i.name.trim()).length} platos en la lista
          </div>

          <Button
            type="submit"
            variant="primary"
            className="font-bold text-sm h-11 px-8 gap-2 shadow-md"
            isLoading={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>Guardar Menú</span>
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
