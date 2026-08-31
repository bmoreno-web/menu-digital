"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SITE_CONFIG } from "@/config/site";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { UtensilsCrossed, Mail, ArrowRight, ArrowLeft } from "lucide-react";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    setSuccess(true);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      <div className="absolute top-6 left-6">
        <Link
          href={SITE_CONFIG.urls.login}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors bg-white px-3.5 py-2 rounded-xl shadow-xs border border-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al Login
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
          Recuperar Contraseña
        </h2>
        <p className="text-xs text-slate-500">
          Te enviaremos un correo con las instrucciones para restablecer tu contraseña
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border-slate-200">
          <CardContent className="p-6 sm:p-8">
            {success ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 text-emerald-600">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Correo Enviado</h3>
                <p className="text-xs text-slate-500">
                  Hemos enviado un correo a <strong>{email}</strong> con el enlace de recuperación.
                  Verifica tu bandeja de entrada y tu carpeta de spam.
                </p>
                <div className="pt-2">
                  <Link href={SITE_CONFIG.urls.login}>
                    <Button variant="outline" className="w-full font-bold">
                      Regresar al Inicio de Sesión
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  leftIcon={<Mail className="h-4 w-4" />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full text-base font-bold h-12"
                    isLoading={isLoading}
                  >
                    Enviar Enlace <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
