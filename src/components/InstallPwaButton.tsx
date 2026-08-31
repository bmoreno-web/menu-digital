"use client";

import React, { useState, useEffect } from "react";
import { Download, Smartphone, Share2, PlusSquare, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InstallPwaButtonProps {
  variant?: "floating" | "button" | "banner";
  className?: string;
  label?: string;
}

export function InstallPwaButton({
  variant = "button",
  className = "",
  label = "Añadir a Pantalla",
}: InstallPwaButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const isRunningStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsStandalone(isRunningStandalone);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Capture Android / Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  if (isStandalone || isInstalled) {
    return null; // Already installed as PWA icon on home screen
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Native prompt on Android / Chrome / Edge
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Show iOS step-by-step modal guide
      setShowIOSModal(true);
    } else {
      // Fallback instructions
      setShowIOSModal(true);
    }
  };

  return (
    <>
      {variant === "floating" ? (
        <button
          type="button"
          onClick={handleInstallClick}
          className={`fixed bottom-20 right-4 z-40 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-brand-500/30 transition-all ${className}`}
        >
          <Smartphone className="h-4 w-4 animate-bounce" />
          <span>{label}</span>
        </button>
      ) : variant === "banner" ? (
        <div className={`bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-xs ${className}`}>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">¿Quieres tener el acceso directo?</p>
              <p className="text-[11px] text-slate-500 font-medium">Añade el icono a tu pantalla de inicio en 1 segundo.</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={handleInstallClick}
            className="text-xs font-bold shrink-0 gap-1.5 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Instalar</span>
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleInstallClick}
          className={`font-bold text-xs gap-1.5 ${className}`}
        >
          <Smartphone className="h-3.5 w-3.5 text-brand-600" />
          <span>{label}</span>
        </Button>
      )}

      {/* MODAL GUÍA DE INSTALACIÓN (Para iOS Safari y Navegadores) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="h-16 w-16 mx-auto rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 flex items-center justify-center shadow-xs">
              <Smartphone className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900">Añadir a la Pantalla de Inicio</h3>
              <p className="text-xs text-slate-500 mt-1">
                Accede al menú como si fuera una aplicación instalada en tu teléfono.
              </p>
            </div>

            <div className="space-y-2.5 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-xs text-slate-700 font-medium">
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Toca el botón <strong className="text-slate-900">Compartir</strong> (icono <Share2 className="h-3.5 w-3.5 inline mx-0.5 text-brand-600" /> abajo en Safari o los 3 puntos en Chrome).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Baja y selecciona <strong className="text-slate-900">"Añadir a la pantalla de inicio"</strong> (<PlusSquare className="h-3.5 w-3.5 inline mx-0.5 text-brand-600" />).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="h-5 w-5 rounded-full bg-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Toca <strong className="text-slate-900">"Añadir"</strong> y ¡listo! Tendrás el icono en tu pantalla.
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={() => setShowIOSModal(false)}
              className="w-full font-bold text-xs"
            >
              Entendido
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
