export const TAGS = {
  PRODUCTS: 'products',
  PRODUCT: (slug: string) => `product-${slug}`,
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ORDER: (id: string) => `order-${id}`,
  COUPONS: 'coupons',
  SITE_CONFIG: 'site-config',
  HOMEPAGE: 'homepage',
  SHIPPING: 'shipping-zones',
  TENANT: 'tenant-config',
} as const
