"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { authService } from "@/services/authService";
import { restaurantService } from "@/services/restaurantService";
import { getLocalDateString } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Utensils,
  Plus,
  Trash2,
  Save,
  Copy,
  ToggleLeft,
  ToggleRight,
  Eye,
  CheckCircle,
  Loader2,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";

interface FormItem {
  id?: string;
  category_name: string;
  name: string;
  description: string;
  price: number;
  is_available: boolean;
}

export default function MenuCreatorPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuDate, setMenuDate] = useState<string>("");
  const [menuTitle, setMenuTitle] = useState<string>("Menú del Día");
  const [menuStatus, setMenuStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [menuItems, setMenuItems] = useState<FormItem[]>([]);
  const [pastMenus, setPastMenus] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

          // Try to load menu for today
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
                is_available: i.is_available,
              })) || []
            );
          } else {
            // Start clean with empty items list
            setMenuItems([]);
          }

          // Fetch historical menus for cloning (Section 15)
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

  const handleAddInitialItems = () => {
    setMenuItems([]);
  };

  const handleAddItem = (categoryName: string) => {
    // Pick the most common price for new items or default to 18000
    const defaultPrice = menuItems.length > 0 ? menuItems[menuItems.length - 1].price : 18000;
    setMenuItems((prev) => [
      ...prev,
      { category_name: categoryName, name: "", description: "", price: defaultPrice, is_available: true },
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

  // Switch availability instantly (Section 17)
  const handleToggleAvailable = async (index: number, itemId?: string) => {
    const nextVal = !menuItems[index].is_available;
    handleItemChange(index, "is_available", nextVal);

    if (itemId) {
      try {
        await restaurantService.updateItemAvailability(itemId, nextVal);
      } catch {
        // Fallback or ignore
      }
    }
  };

  // Copy Menu from history (Section 15)
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
            is_available: true, // Reset cloned items to available
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

    // Auto-filter out any blank or untouched dish cards
    const validItems = menuItems.filter((i) => i.name && i.name.trim().length > 0);

    if (validItems.length === 0) {
      setFeedback("Agrega al menos un plato con nombre a tu menú.");
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
      
      // Reload history list
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

  // Group items by category to display in a clean structure
  const categoriesList = categories.map((c) => c.name);
  if (!categoriesList.includes("General")) categoriesList.push("General");

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Menú del Día
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Diseñador de Platos
          </h1>
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
              <span>Copiar Menú Anterior</span>
            </Button>
          )}

          <Link href={`/r/${restaurant?.slug}`} target="_blank">
            <Button type="button" variant="outline" size="sm" className="gap-1.5 font-bold">
              <Eye className="h-3.5 w-3.5" />
              <span>Ver Vista Pública</span>
            </Button>
          </Link>
        </div>
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

      {/* FORM AND CONFIGS */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* MENU BUILDER DETAILS */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Título del Menú"
                  name="menuTitle"
                  required
                  value={menuTitle}
                  onChange={(e) => setMenuTitle(e.target.value)}
                />
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Fecha del Menú
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl transition-all duration-200 text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
                      value={menuDate}
                      onChange={(e) => setMenuDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {categoriesList.map((category) => {
                const categoryItems = menuItems.filter((i) => i.category_name === category);

                return (
                  <div key={category} className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <h4 className="text-xs font-extrabold text-brand-800 uppercase tracking-widest">
                        {category}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleAddItem(category)}
                        className="text-xs font-bold text-brand-700 hover:text-brand-900 flex items-center gap-1"
                      >
                        <Plus className="h-3.5 w-3.5" /> Agregar Plato
                      </button>
                    </div>

                    {categoryItems.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic py-2 pl-2">
                        No hay platos agregados en esta categoría.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {menuItems.map((item, idx) => {
                          if (item.category_name !== category) return null;
                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-2xl border transition-colors ${
                                item.is_available
                                  ? "bg-white border-slate-200"
                                  : "bg-slate-50 border-slate-200 opacity-75"
                              }`}
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <div className="flex-1 space-y-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="sm:col-span-2">
                                      <input
                                        type="text"
                                        placeholder="Nombre del plato (ej: Pollo Guisado)"
                                        className="w-full h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600"
                                        value={item.name}
                                        onChange={(e) =>
                                          handleItemChange(idx, "name", e.target.value)
                                        }
                                      />
                                    </div>
                                    <div>
                                      <input
                                        type="number"
                                        placeholder="Precio"
                                        className="w-full h-10 px-3 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-brand-700"
                                        value={item.price}
                                        onChange={(e) =>
                                          handleItemChange(idx, "price", e.target.value)
                                        }
                                      />
                                    </div>
                                  </div>

                                  <input
                                    type="text"
                                    placeholder="Descripción o acompañamiento (ej: arroz, ensalada y tajadas)"
                                    className="w-full h-9 px-3 text-xs bg-slate-50/50 border border-slate-200 rounded-lg focus:outline-none focus:border-brand-600 text-slate-600"
                                    value={item.description}
                                    onChange={(e) =>
                                      handleItemChange(idx, "description", e.target.value)
                                    }
                                  />
                                </div>

                                {/* Availability & Delete */}
                                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 shrink-0">
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
                                        <AlertCircle className="h-3.5 w-3.5" /> AGOTADO
                                      </>
                                    )}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(idx)}
                                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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
                  </div>
                );
              })}
            </CardContent>

            {/* Form footer actions */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600">Estado:</label>
                <select
                  value={menuStatus}
                  onChange={(e: any) => setMenuStatus(e.target.value)}
                  className="text-xs font-bold bg-white border border-slate-200 rounded-lg h-9 px-2 focus:outline-none"
                >
                  <option value="PUBLISHED">Publicado (Activo hoy)</option>
                  <option value="DRAFT">Borrador</option>
                </select>
              </div>

              <Button type="submit" variant="primary" className="font-bold gap-2 px-6" isLoading={isSaving}>
                <Save className="h-4 w-4" /> Guardar Menú
              </Button>
            </div>
          </Card>
        </div>

        {/* SIDEBAR METRICS / QUICK STOCK SWITCH (Lg: col-4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xs uppercase tracking-wider text-slate-900">Productos Agotados</CardTitle>
              <CardDescription>Márcalos aquí al instante para que no se puedan pedir.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {menuItems.length === 0 ? (
                <div className="p-5 text-center text-xs text-slate-400 italic">
                  Diseña platos primero.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {menuItems.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/40">
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 block truncate">{item.name || "Sin nombre"}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">{item.category_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleAvailable(idx, item.id)}
                        className="shrink-0"
                      >
                        {item.is_available ? (
                          <ToggleRight className="h-7 w-7 text-brand-600" />
                        ) : (
                          <ToggleLeft className="h-7 w-7 text-slate-300" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </form>

      {/* CLONING HISTORY MODAL (Section 15) */}
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
