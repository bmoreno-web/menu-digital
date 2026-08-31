export const SITE_CONFIG = {
  name: "PROJECT_NAME", // Centralized name as required in Section 0
  tagline: "Tu menú de hoy. Tus pedidos. Sin complicaciones.",
  subheading: "Publica tu menú diario en menos de 2 minutos, recibe pedidos directamente de tus clientes y administra todo desde un solo lugar sin pagar comisiones por venta.",
  currency: {
    code: "COP",
    symbol: "$",
    locale: "es-CO",
  },
  support: {
    whatsapp: "+573000000000",
    email: "hola@projectname.com",
  },
  urls: {
    login: "/login",
    register: "/registro",
    app: "/app/dashboard",
  },
  plans: [
    {
      id: "free",
      name: "Prueba / Básico",
      description: "Ideal para comenzar a digitalizar tu restaurante.",
      priceMonthly: 0,
      features: [
        "1 Menú diario publicado a la vez",
        "Hasta 30 pedidos por día",
        "Código QR permanente de alta calidad",
        "Panel móvil de cocina y despacho",
        "Sin comisión por pedido",
      ],
      isPopular: false,
      ctaText: "Comenzar Gratis",
    },
    {
      id: "pro",
      name: "Pro Restaurante",
      description: "Para restaurantes activos que necesitan rapidez y control total.",
      priceMonthly: 49000,
      features: [
        "Menús ilimitados e histórico de recetas",
        "Pedidos ilimitados en tiempo real",
        "Alertas sonoras de nuevos pedidos",
        "Botón de WhatsApp directo al cliente",
        "Control instantáneo de platos agotados",
        "Directorio automático de clientes frecuentes",
        "Estadísticas de ventas diarias y semanales",
      ],
      isPopular: true,
      ctaText: "Crear Restaurante Pro",
    },
    {
      id: "enterprise",
      name: "Cadenas / Sedes",
      description: "Multi-sede y soporte prioritario.",
      priceMonthly: 99000,
      features: [
        "Todo lo incluido en el Plan Pro",
        "Múltiples sedes o sucursales",
        "Múltiples usuarios y roles (Cajero, Cocina)",
        "Soporte prioritario WhatsApp 24/7",
        "Capacitación personalizada para tu equipo",
      ],
      isPopular: false,
      ctaText: "Contactar Asesor",
    },
  ],
  restaurantTypes: [
    { id: "corrientazo", label: "Corrientazo / Almuerzo Casero" },
    { id: "ejecutivo", label: "Menú Ejecutivo / Gourmet" },
    { id: "restaurante", label: "Restaurante a la Carta" },
    { id: "cafeteria", label: "Cafetería / Panadería" },
    { id: "comidas_rapidas", label: "Comidas Rápidas" },
    { id: "otro", label: "Otro Tipo de Negocio" },
  ],
  defaultCategories: [
    "Sopa o Entrada",
    "Proteína Principal",
    "Acompañamientos",
    "Bebida del Día",
    "Adicionales y Postres",
  ],
} as const;

export type SiteConfig = typeof SITE_CONFIG;
