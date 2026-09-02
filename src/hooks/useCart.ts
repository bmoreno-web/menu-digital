"use client";

import { useState, useEffect } from "react";
import { MenuItem, CartItem } from "@/types";

export function useCart(restaurantSlug: string) {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const key = `cart_${restaurantSlug}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        setCart([]);
      }
    }
  }, [restaurantSlug]);

  const saveCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem(`cart_${restaurantSlug}`, JSON.stringify(newCart));
  };

  const addToCart = (
    item: MenuItem,
    quantity = 1,
    notes = "",
    priceMode: "MESA" | "LLEVAR" = "LLEVAR"
  ) => {
    const existingIdx = cart.findIndex((c) => c.item.id === item.id);
    let newCart = [...cart];

    const activePrice =
      priceMode === "MESA"
        ? Number(item.price_dinein || item.price)
        : Number(item.price_takeaway || item.price);

    if (existingIdx !== -1) {
      newCart[existingIdx].quantity += quantity;
      newCart[existingIdx].price_mode = priceMode;
      newCart[existingIdx].selected_price = activePrice;
      if (notes) newCart[existingIdx].notes = notes;
    } else {
      newCart.push({
        item: { ...item, price: activePrice },
        quantity,
        notes,
        price_mode: priceMode,
        selected_price: activePrice,
      });
    }
    saveCart(newCart);
  };

  const syncPriceMode = (mode: "MESA" | "LLEVAR") => {
    const updated = cart.map((c) => {
      const activePrice =
        mode === "MESA"
          ? Number(c.item.price_dinein || c.item.price)
          : Number(c.item.price_takeaway || c.item.price);
      return {
        ...c,
        price_mode: mode,
        selected_price: activePrice,
        item: { ...c.item, price: activePrice },
      };
    });
    saveCart(updated);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newCart = cart.map((c) => (c.item.id === itemId ? { ...c, quantity } : c));
    saveCart(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const newCart = cart.filter((c) => c.item.id !== itemId);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const getSubtotal = () => {
    return cart.reduce((acc, c) => {
      const price = Number(c.selected_price !== undefined ? c.selected_price : c.item.price);
      return acc + (isNaN(price) ? 0 : price) * c.quantity;
    }, 0);
  };

  return {
    cart,
    addToCart,
    syncPriceMode,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
  };
}
