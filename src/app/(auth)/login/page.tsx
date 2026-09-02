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
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { user } = await authService.login(formData.email.trim(), formData.password.trim());
      if (user.role === "SUPER_ADMIN") {
        window.location.href = "/admin/restaurantes";
      } else {
        window.location.href = "/app/menu";
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (
        msg.includes("Invalid login credentials") ||
        msg.includes("invalid_grant") ||
        msg.includes("Credenciales inválidas")
      ) {
        setError("Correo o contraseña incorrectos. Por favor verifica tus credenciales.");
      } else if (msg.includes("Email not confirmed")) {
        setError("El correo electrónico aún no ha sido confirmado.");
      } else {
        setError(msg || "Error al iniciar sesión. Revisa tus credenciales.");
      }
      setIsLoading(false);
    }
  };

  // Helper helper to load a fast mock demo session
  const handleLoadDemo = async () => {
    setIsLoading(true);
    try {
      // Register or login a default demo restaurant
      await authService.register({
        restaurantName: "Restaurante El Buen Sabor",
        responsibleName: "Carlos Pérez",
        email: "demo@buensabor.com",
        phone: "3001234567",
        whatsapp: "573001234567",
        password: "demopassword",
        city: "Barranquilla",
        address: "Calle 72 # 44-20",
        restaurantType: "corrientazo",
      }).catch(() => {
        // If already registered, ignore error and login
      });

      await authService.login("demo@buensabor.com", "demopassword");
      router.push("/app/menu");
    } catch (err) {
      setError("No se pudo iniciar la sesión demo de prueba.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      {/* Back to main landing */}
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
          Ingresa a tu cuenta
        </h2>
        <p className="text-xs text-slate-500">
          Gestiona tu menú diario y administra los pedidos recibidos
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200">
          <CardContent className="p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-xs font-semibold text-rose-700">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Correo o Usuario"
                name="email"
                type="text"
                required
                placeholder="ej: usuario o correo@ejemplo.com"
                leftIcon={<Mail className="h-4 w-4" />}
                value={formData.email}
                onChange={handleChange}
              />

              <Input
                label="Contraseña"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                value={formData.password}
                onChange={handleChange}
              />

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded-lg"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-slate-600 font-medium">
                    Recordarme
                  </label>
                </div>

                <Link
                  href="/recuperar"
                  className="font-semibold text-brand-700 hover:text-brand-800"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full text-base font-bold h-12"
                  isLoading={isLoading}
                >
                  Iniciar Sesión <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase font-bold tracking-wider">
                Prueba Rápida
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <Button
              type="button"
              variant="accent"
              onClick={handleLoadDemo}
              className="w-full h-11 text-sm font-bold gap-2"
              isLoading={isLoading}
            >
              <Sparkles className="h-4 w-4" />
              Ingresar con Restaurante Demo (Acceso Inmediato)
            </Button>
          </CardContent>
          
          <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-center text-xs font-semibold">
            <span className="text-slate-500 mr-1.5">¿Aún no tienes cuenta?</span>
            <Link href={SITE_CONFIG.urls.register} className="text-brand-700 hover:text-brand-800">
              Regístrate Gratis Aquí
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
