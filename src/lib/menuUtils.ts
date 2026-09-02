import { MenuItem } from "@/types";

export function encodeMenuItemMeta(item: any): { finalDesc: string; price: number } {
  const rawDesc = (item.description || "").trim();
  const cleanDesc = rawDesc
    .replace(/\[META:[^\]]+\]\s*/gi, "")
    .replace(/^\[ESPECIAL\]\s*/gi, "")
    .trim();

  const priceTakeaway = Number(item.price_takeaway) || Number(item.price) || 0;
  const priceDinein = Number(item.price_dinein) || priceTakeaway;
  const isSpecial = item.is_special ? 1 : 0;
  const isActive = item.is_active_today === false ? 0 : 1;

  const metaTag = `[META:dinein=${priceDinein};takeaway=${priceTakeaway};special=${isSpecial};active=${isActive}]`;
  const finalDesc = `${metaTag} ${cleanDesc}`.trim();

  return { finalDesc, price: priceTakeaway };
}

export function decodeMenuItemMeta(item: any): MenuItem {
  const rawDesc = item.description || "";
  let priceDinein = Number(item.price) || 0;
  let priceTakeaway = Number(item.price) || 0;
  let isSpecial = Boolean(item.is_special || rawDesc.includes("[ESPECIAL]"));
  let isActiveToday = true;

  const metaMatch = rawDesc.match(/\[META:([^\]]+)\]/i);
  if (metaMatch) {
    const parts = metaMatch[1].split(";");
    for (const part of parts) {
      const [k, v] = part.split("=");
      if (k === "dinein" && v) priceDinein = Number(v) || priceDinein;
      if (k === "takeaway" && v) priceTakeaway = Number(v) || priceTakeaway;
      if (k === "special") isSpecial = v === "1";
      if (k === "active") isActiveToday = v !== "0";
    }
  }

  const cleanDescription = rawDesc
    .replace(/\[META:[^\]]+\]\s*/gi, "")
    .replace(/^\[ESPECIAL\]\s*/gi, "")
    .trim();

  return {
    ...item,
    price: priceTakeaway,
    price_takeaway: priceTakeaway,
    price_dinein: priceDinein,
    is_special: isSpecial,
    is_active_today: isActiveToday,
    description: cleanDescription,
  };
}
