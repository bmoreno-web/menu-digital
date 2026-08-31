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

  const addToCart = (item: MenuItem, quantity = 1, notes = "") => {
    const existingIdx = cart.findIndex((c) => c.item.id === item.id);
    let newCart = [...cart];

    if (existingIdx !== -1) {
      newCart[existingIdx].quantity += quantity;
      if (notes) newCart[existingIdx].notes = notes;
    } else {
      newCart.push({ item, quantity, notes });
    }
    saveCart(newCart);
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
    return cart.reduce((acc, c) => acc + Number(c.item.price) * c.quantity, 0);
  };

  return {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getSubtotal,
  };
}
