import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { SITE_CONFIG } from "@/config/site";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | null | undefined): string {
  const numericAmount = Number(amount);
  const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
  return new Intl.NumberFormat(SITE_CONFIG.currency.locale, {
    style: "currency",
    currency: SITE_CONFIG.currency.code,
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  try {
    // If format is YYYY-MM-DD, parse manually to avoid UTC midnight shifting back in UTC-5
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day, 12, 0, 0);
      return new Intl.DateTimeFormat("es-CO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    }
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Cleans and formats phone numbers for WhatsApp links (wa.me)
 * - Automatically prepends 57 (Colombia) if 10-digit mobile number is provided (e.g. 3001234567 -> 573001234567)
 * - Strips all non-digit characters (+, spaces, hyphens, parentheses)
 * - Preserves international country codes if already specified
 */
export function cleanWhatsAppPhone(phone?: string | null, defaultCountryCode: string = "57"): string {
  if (!phone) return "";
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return "";

  // If already starts with country code (e.g. 573001234567)
  if (digits.startsWith(defaultCountryCode) && digits.length >= 12) {
    return digits;
  }

  // If 10-digit mobile number (e.g. 3001234567)
  if (digits.length === 10) {
    return `${defaultCountryCode}${digits}`;
  }

  // If starts with 00 prefix (e.g. 0057...)
  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  // If short number <= 10 digits
  if (digits.length <= 10) {
    return `${defaultCountryCode}${digits}`;
  }

  return digits;
}

