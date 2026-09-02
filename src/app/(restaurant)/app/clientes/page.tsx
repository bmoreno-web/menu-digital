"use client";

import React, { useState, useEffect } from "react";
import { authService } from "@/services/authService";
import { orderService } from "@/services/orderService";
import { formatCurrency, formatDate, cleanWhatsAppPhone } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Users,
  Search,
  ShoppingBag,
  Coins,
  Clock,
  Phone,
  MessageSquare,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function CustomersDirectoryPage() {
  const [restaurant, setRestaurant] = useState<any>(null);
  const [customers, setCustomers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadCustomersData() {
    try {
      const session = await authService.getSession();
      if (session) {
        setRestaurant(session.restaurant);
        const list = await orderService.getCustomers(session.restaurant.id);
        setCustomers(list);
      }
    } catch (err) {
      console.error("Error al cargar clientes:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadCustomersData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCustomersData();
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargando directorio...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md">
            Directorio
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Clientes Frecuentes
          </h1>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-1.5"
          isLoading={isRefreshing}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* SEARCH BAR */}
      <div className="max-w-md">
        <Input
          placeholder="Buscar por nombre o teléfono celular..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-slate-400" />}
        />
      </div>

      {/* CUSTOMERS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="py-16 text-center bg-white border border-slate-200 rounded-3xl p-6 col-span-2 space-y-3">
            <Users className="h-10 w-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No se encontraron clientes</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Los datos se recopilan y actualizan automáticamente cuando tus comensales envían un pedido.
            </p>
          </div>
        ) : (
          filteredCustomers.map((customer) => (
            <Card key={customer.id} className="border-slate-200 shadow-xs hover:shadow-sm transition-all">
              <CardContent className="p-4 sm:p-5 space-y-4">
                
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-extrabold text-slate-950 truncate max-w-[200px]">
                      {customer.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-semibold block">{customer.phone}</span>
                  </div>
                  
                  <div className="h-9 w-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <Users className="h-4.5 w-4.5" />
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider leading-none">Pedidos</span>
                      <span className="text-slate-800 mt-1 block">{customer.total_orders} compras</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider leading-none">Total gastado</span>
                      <span className="text-slate-800 mt-1 block">{formatCurrency(customer.total_spent)}</span>
                    </div>
                  </div>
                </div>

                {/* Footer with last order date & contact links */}
                <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Último pedido: {formatDate(customer.last_order_at)}</span>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`tel:${customer.phone}`}
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                      title="Llamar"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                    <a
                      href={`https://wa.me/${cleanWhatsAppPhone(customer.phone)}`}
                      target="_blank"
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
                      title="WhatsApp"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  </div>
                </div>

              </CardContent>
            </Card>
          ))
        )}
      </div>

    </div>
  );
}
