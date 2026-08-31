"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminService } from "@/services/adminService";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SITE_CONFIG } from "@/config/site";
import {
  Store,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  LogIn,
  Edit2,
  Lock,
  Mail,
  User,
} from "lucide-react";

export default function AdminRestaurantes() {
  const router = useRouter();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [planFilter, setPlanFilter] = useState<"ALL" | "free" | "pro" | "enterprise">("ALL");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Modal State for New Restaurant
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newRestaurantForm, setNewRestaurantForm] = useState({
    name: "",
    ownerName: "",
    email: "",
    password: "",
    whatsapp: "",
    phone: "",
    city: "Barranquilla",
    address: "",
    restaurantType: "Corrientazo / Almuerzo Casero",
    planTier: "free",
  });

  // Modal State for Edit Restaurant
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editRestaurantForm, setEditRestaurantForm] = useState({
    id: "",
    ownerId: "",
    name: "",
    ownerName: "",
    email: "",
    password: "",
    whatsapp: "",
    phone: "",
    city: "Barranquilla",
    address: "",
    restaurantType: "Corrientazo / Almuerzo Casero",
    planTier: "free",
    isActive: true,
  });

  const handleManageRestaurant = (res: any) => {
    localStorage.setItem("admin_active_restaurant", JSON.stringify(res));
    router.push("/app/dashboard");
  };

  async function loadRestaurants() {
    try {
      const list = await adminService.getAllRestaurants();
      setRestaurants(list);
    } catch (err) {
      console.error("Error loading restaurants:", err);
      alert("Error al cargar la lista de restaurantes.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadRestaurants();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    setActionLoadingId(id);
    try {
      const nextStatus = !currentStatus;
      await adminService.toggleRestaurantActive(id, nextStatus);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: nextStatus } : r))
      );
    } catch (err) {
      alert("No se pudo cambiar el estado del restaurante.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePlanChange = async (id: string, newPlan: string) => {
    setActionLoadingId(id);
    try {
      await adminService.updateRestaurantPlan(id, newPlan);
      setRestaurants((prev) =>
        prev.map((r) => (r.id === id ? { ...r, plan_tier: newPlan } : r))
      );
    } catch (err) {
      alert("No se pudo actualizar el plan.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteRestaurant = async (id: string, name: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar permanentemente el restaurante "${name}"?\nEsta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    setActionLoadingId(id);
    try {
      await adminService.deleteRestaurant(id);
      setRestaurants((prev) => prev.filter((r) => r.id !== id));
      alert(`Restaurante "${name}" eliminado con éxito.`);
    } catch (err: any) {
      alert(err?.message || "No se pudo eliminar el restaurante.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const openEditModal = (res: any) => {
    setEditRestaurantForm({
      id: res.id,
      ownerId: res.owner_id || "",
      name: res.name || "",
      ownerName: res.owner?.full_name || "",
      email: res.owner?.email || "",
      password: "",
      whatsapp: res.whatsapp || "",
      phone: res.phone || "",
      city: res.city || "Barranquilla",
      address: res.address || "",
      restaurantType: res.restaurant_type || "Corrientazo / Almuerzo Casero",
      planTier: res.plan_tier || "free",
      isActive: res.is_active !== undefined ? res.is_active : true,
    });
    setIsEditModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRestaurantForm.name.trim() || !newRestaurantForm.whatsapp.trim()) {
      alert("Por favor ingresa el nombre y el WhatsApp del restaurante.");
      return;
    }

    setIsCreating(true);
    try {
      const created = await adminService.createRestaurant(newRestaurantForm);
      alert(`¡Restaurante "${created.name}" creado con éxito!`);
      setIsCreateModalOpen(false);
      setNewRestaurantForm({
        name: "",
        ownerName: "",
        email: "",
        password: "",
        whatsapp: "",
        phone: "",
        city: "Barranquilla",
        address: "",
        restaurantType: "Corrientazo / Almuerzo Casero",
        planTier: "free",
      });
      await loadRestaurants();
    } catch (err: any) {
      alert(err?.message || "Error al crear el restaurante.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRestaurantForm.name.trim() || !editRestaurantForm.whatsapp.trim()) {
      alert("Por favor ingresa el nombre y el WhatsApp del restaurante.");
      return;
    }

    setIsEditing(true);
    try {
      await adminService.updateRestaurant(editRestaurantForm);
      alert(`¡Restaurante "${editRestaurantForm.name}" actualizado con éxito!`);
      setIsEditModalOpen(false);
      await loadRestaurants();
    } catch (err: any) {
      alert(err?.message || "Error al actualizar el restaurante.");
    } finally {
      setIsEditing(false);
    }
  };

  const [isClearingOrders, setIsClearingOrders] = useState(false);

  const handleClearOrders = async () => {
    const confirmClear = window.confirm(
      "⚠️ ¿Deseas eliminar permanentemente TODOS los pedidos de prueba de la base de datos?\n\nEsta acción reiniciará el historial de ventas y pedidos a cero."
    );
    if (!confirmClear) return;

    setIsClearingOrders(true);
    try {
      await adminService.clearOrders("ALL");
      alert("¡Todos los pedidos han sido eliminados de la base de datos con éxito!");
      await loadRestaurants();
    } catch (err: any) {
      alert(err?.message || "No se pudieron eliminar los pedidos.");
    } finally {
      setIsClearingOrders(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando directorio de restaurantes...</p>
      </div>
    );
  }

  // Calculate Metrics
  const totalCount = restaurants.length;
  const activeCount = restaurants.filter((r) => r.is_active).length;
  const freeCount = restaurants.filter((r) => r.plan_tier === "free").length;
  const proCount = restaurants.filter((r) => r.plan_tier === "pro").length;
  const enterpriseCount = restaurants.filter((r) => r.plan_tier === "enterprise").length;

  // Filter Logic
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.owner?.full_name && r.owner.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.owner?.email && r.owner.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      r.slug.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && r.is_active) ||
      (statusFilter === "INACTIVE" && !r.is_active);

    const matchesPlan =
      planFilter === "ALL" || r.plan_tier === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Consola General
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Gestión de Restaurantes
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearOrders}
            isLoading={isClearingOrders}
            className="gap-1.5 font-bold text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
            title="Vaciar todos los pedidos de prueba de la base de datos"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Vaciar Pedidos</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-1.5 font-bold"
            isLoading={isRefreshing}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Actualizar</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" />
            <span>Crear Restaurante</span>
          </Button>
        </div>
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* TOTAL */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Creados</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">{totalCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* ACTIVOS */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Activos en Línea</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 text-emerald-600">{activeCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* GRATUITOS */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Prueba/Free</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1">{freeCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-slate-50 text-slate-500 flex items-center justify-center shrink-0">
              <Store className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* PRO */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Pro</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 text-brand-600">{proCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* ENTERPRISE */}
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan Enterprise</p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 text-blue-600">{enterpriseCount}</h3>
            </div>
            <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* FILTER BAR PANEL */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Input */}
          <div className="w-full md:w-96">
            <Input
              placeholder="Buscar por restaurante, propietario o correo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          {/* Filters Selectors */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Filtros:</span>
            </div>

            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-brand-600"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="ACTIVE">🟢 Activos en Línea</option>
              <option value="INACTIVE">🟡 Pendientes de Aprobación</option>
            </select>

            {/* Plan Select */}
            <select
              value={planFilter}
              onChange={(e: any) => setPlanFilter(e.target.value)}
              className="text-xs p-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-brand-600"
            >
              <option value="ALL">Todos los Planes</option>
              <option value="free">Prueba / Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* LIST TABLE */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          {filteredRestaurants.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Store className="h-12 w-12 text-slate-300 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">No se encontraron restaurantes</h4>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                No hay resultados que coincidan con la búsqueda o los filtros actuales.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th className="p-4 pl-6">Restaurante / Slug</th>
                  <th className="p-4">Propietario / Acceso</th>
                  <th className="p-4">Creado el</th>
                  <th className="p-4 text-center">Estado de Operación</th>
                  <th className="p-4 text-center">Plan Asignado</th>
                  <th className="p-4 pr-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRestaurants.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Restaurante details */}
                    <td className="p-4 pl-6 space-y-0.5">
                      <span className="text-xs font-black text-slate-900 block leading-tight">
                        {res.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block leading-none">
                        Slug: /{res.slug}
                      </span>
                      <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                        {res.restaurant_type || "No especificado"}
                      </span>
                    </td>

                    {/* Owner Details */}
                    <td className="p-4 space-y-0.5">
                      <span className="text-xs font-bold text-slate-700 block leading-tight">
                        {res.owner?.full_name || "Desconocido"}
                      </span>
                      <span className="text-[10px] text-brand-600 font-bold block leading-none">
                        {res.owner?.email || "sin-correo@sistema.com"}
                      </span>
                      {res.whatsapp && (
                        <span className="text-[9px] text-slate-500 block font-semibold mt-1">WA: {res.whatsapp}</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="p-4 text-xs font-semibold text-slate-500">
                      {res.created_at ? new Date(res.created_at).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }) : "Fecha no disp."}
                    </td>

                    {/* Toggle Active Button / Aprobar */}
                    <td className="p-4 text-center">
                      {res.is_active ? (
                        <button
                          onClick={() => handleToggleActive(res.id, true)}
                          disabled={actionLoadingId === res.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-[0.97] bg-emerald-50 text-emerald-800 border border-emerald-100 hover:bg-emerald-100/60"
                          title="Clic para pausar el restaurante"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Activo</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>Pendiente</span>
                          </span>
                          <button
                            onClick={() => handleToggleActive(res.id, false)}
                            disabled={actionLoadingId === res.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.97]"
                            title="Aprobar y activar restaurante"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Aprobar</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Plan Tier Select Dropdown */}
                    <td className="p-4 text-center">
                      <select
                        value={res.plan_tier || "free"}
                        onChange={(e) => handlePlanChange(res.id, e.target.value)}
                        disabled={actionLoadingId === res.id}
                        className={`text-xs p-1.5 font-bold rounded-lg border focus:outline-none ${
                          res.plan_tier === "pro"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : res.plan_tier === "enterprise"
                            ? "bg-blue-50 border-blue-200 text-blue-800"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <option value="free">Prueba / Free</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>
                    </td>

                    {/* Actions: Manage, Edit, View Link & Delete */}
                    <td className="p-4 pr-6 text-right space-x-1.5">
                      <button
                        onClick={() => handleManageRestaurant(res)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 transition-colors text-xs font-black shadow-xs"
                        title="Entrar al Dashboard de este restaurante como Super Admin"
                      >
                        <LogIn className="h-3.5 w-3.5" />
                        <span>Gestionar</span>
                      </button>

                      <button
                        onClick={() => openEditModal(res)}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        title="Editar Datos y Contraseña del Restaurante"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      <a
                        href={`/r/${res.slug}`}
                        target="_blank"
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                        title="Ver Menú Público"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      <button
                        onClick={() => handleDeleteRestaurant(res.id, res.name)}
                        disabled={actionLoadingId === res.id}
                        className="inline-flex items-center justify-center p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        title="Eliminar Restaurante"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* CREATE RESTAURANT MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nuevo Restaurante"
        description="Agrega un restaurante y configura sus credenciales de acceso directamente."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-left">
          <Input
            label="Nombre del Restaurante"
            required
            placeholder="Ej: Restaurante El Buen Sabor"
            value={newRestaurantForm.name}
            onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del Propietario / Contacto"
              required
              placeholder="Ej: Juan Pérez"
              value={newRestaurantForm.ownerName}
              onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, ownerName: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Correo / Usuario de Acceso"
              required
              placeholder="Ej: buensabor@menu-digital.com"
              value={newRestaurantForm.email}
              onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, email: e.target.value })}
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contraseña de Acceso (Opcional)"
              type="text"
              placeholder="Por defecto: Moremore2026"
              value={newRestaurantForm.password}
              onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, password: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="WhatsApp para Pedidos"
              required
              placeholder="Ej: 3001234567"
              value={newRestaurantForm.whatsapp}
              onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, whatsapp: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              required
              value={newRestaurantForm.city}
              onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, city: e.target.value })}
            />

            <Input
              label="Dirección"
              required
              placeholder="Ej: Carrera 43 # 72-10"
              value={newRestaurantForm.address}
              onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipo de Restaurante
              </label>
              <select
                value={newRestaurantForm.restaurantType}
                onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, restaurantType: e.target.value })}
                className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-brand-600"
              >
                {SITE_CONFIG.restaurantTypes.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Plan Inicial Asignado
              </label>
              <select
                value={newRestaurantForm.planTier}
                onChange={(e) => setNewRestaurantForm({ ...newRestaurantForm, planTier: e.target.value })}
                className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="free">Prueba / Free (7 días / 30 pedidos)</option>
                <option value="pro">Pro Restaurante (Ilimitado)</option>
                <option value="enterprise">Enterprise (Cadenas / Sedes)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isCreating}
              className="font-bold"
            >
              Guardar Restaurante
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT RESTAURANT MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Editar Restaurante: ${editRestaurantForm.name}`}
        description="Modifica la información, plan y credenciales de acceso (usuario y contraseña)."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-left">
          <Input
            label="Nombre del Restaurante"
            required
            value={editRestaurantForm.name}
            onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del Propietario / Contacto"
              required
              value={editRestaurantForm.ownerName}
              onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, ownerName: e.target.value })}
              leftIcon={<User className="h-4 w-4" />}
            />

            <Input
              label="Correo / Usuario de Acceso"
              required
              value={editRestaurantForm.email}
              onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, email: e.target.value })}
              leftIcon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nueva Contraseña (Opcional)"
              type="text"
              placeholder="Dejar vacío para no cambiarla"
              value={editRestaurantForm.password}
              onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, password: e.target.value })}
              leftIcon={<Lock className="h-4 w-4" />}
            />

            <Input
              label="WhatsApp para Pedidos"
              required
              value={editRestaurantForm.whatsapp}
              onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, whatsapp: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Ciudad"
              required
              value={editRestaurantForm.city}
              onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, city: e.target.value })}
            />

            <Input
              label="Dirección"
              required
              value={editRestaurantForm.address}
              onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Tipo de Restaurante
              </label>
              <select
                value={editRestaurantForm.restaurantType}
                onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, restaurantType: e.target.value })}
                className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-brand-600"
              >
                {SITE_CONFIG.restaurantTypes.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Plan Asignado
              </label>
              <select
                value={editRestaurantForm.planTier}
                onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, planTier: e.target.value })}
                className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="free">Prueba / Free</option>
                <option value="pro">Pro Restaurante</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Estado de Operación
              </label>
              <select
                value={editRestaurantForm.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(e) => setEditRestaurantForm({ ...editRestaurantForm, isActive: e.target.value === "ACTIVE" })}
                className="w-full p-3.5 text-sm bg-white border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-brand-600"
              >
                <option value="ACTIVE">Activo en Línea</option>
                <option value="INACTIVE">Pausado / Desactivado</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isEditing}
              className="font-bold"
            >
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
