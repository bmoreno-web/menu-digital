"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SITE_CONFIG } from "@/config/site";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import {
  UtensilsCrossed,
  Store,
  User,
  Mail,
  Phone,
  Lock,
  MapPin,
  Building,
  ArrowRight,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    restaurantName: "",
    responsibleName: "",
    email: "",
    phone: "",
    whatsapp: "",
    password: "",
    city: "Barranquilla",
    address: "",
    restaurantType: "corrientazo",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await authService.register(formData);
      router.push("/app/dashboard");
    } catch (err: any) {
      setError(err?.message || "Ocurrió un error al registrar el restaurante.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Inicio
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2 group justify-center">
          <div className="h-10 w-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-600/20 group-hover:scale-105 transition-transform">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
            {SITE_CONFIG.name}
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
          Crea tu cuenta de restaurante
        </h2>
        <p className="text-xs text-slate-500">
          Comienza tu prueba y digitaliza tu operación hoy mismo
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <Card className="border-slate-200">
          <CardContent className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
                1. Información del Restaurante
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nombre del Restaurante"
                  name="restaurantName"
                  required
                  placeholder="Ej: El Buen Sabor"
                  leftIcon={<Store className="h-4 w-4" />}
                  value={formData.restaurantName}
                  onChange={handleChange}
                />

                <div className="space-y-1.5 text-left">
                  <label
                    htmlFor="restaurantType"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
                  >
                    Tipo de Restaurante
                  </label>
                  <div className="relative">
                    <select
                      id="restaurantType"
                      name="restaurantType"
                      required
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl transition-all duration-200 text-slate-900 focus:outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/10"
                      value={formData.restaurantType}
                      onChange={handleChange}
                    >
                      {SITE_CONFIG.restaurantTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ciudad"
                  name="city"
                  required
                  placeholder="Ej: Barranquilla"
                  leftIcon={<Building className="h-4 w-4" />}
                  value={formData.city}
                  onChange={handleChange}
                />

                <Input
                  label="Dirección Completa"
                  name="address"
                  required
                  placeholder="Ej: Calle 72 # 44-20"
                  leftIcon={<MapPin className="h-4 w-4" />}
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 pt-2">
                2. Contacto y Acceso
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Responsable o Propietario"
                  name="responsibleName"
                  required
                  placeholder="Ej: Carlos Pérez"
                  leftIcon={<User className="h-4 w-4" />}
                  value={formData.responsibleName}
                  onChange={handleChange}
                />

                <Input
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  required
                  placeholder="Ej: carlos@restaurante.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Teléfono Celular"
                  name="phone"
                  type="tel"
                  required
                  placeholder="Ej: 3001234567"
                  leftIcon={<Phone className="h-4 w-4" />}
                  value={formData.phone}
                  onChange={handleChange}
                />

                <Input
                  label="WhatsApp para Pedidos"
                  name="whatsapp"
                  type="tel"
                  required
                  placeholder="Ej: 573001234567"
                  leftIcon={<MessageSquare className="h-4 w-4" />}
                  helperText="Incluye código de país (ej: 57)"
                  value={formData.whatsapp}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Input
                  label="Contraseña"
                  name="password"
                  type="password"
                  required
                  placeholder="Mínimo 6 caracteres"
                  leftIcon={<Lock className="h-4 w-4" />}
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-base font-bold h-12"
                  isLoading={isLoading}
                >
                  Registrar Mi Restaurante <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-xs font-semibold">
            <span className="text-slate-500 mr-1.5">¿Ya tienes una cuenta registrada?</span>
            <Link href={SITE_CONFIG.urls.login} className="text-brand-700 hover:text-brand-800">
              Inicia Sesión Aquí
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
