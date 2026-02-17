/** Central mapping of DB table names to admin routes */
export const ADMIN_ROUTES: Record<string, { manager: string; editor: (id: string) => string }> = {
  articles: { manager: "/admin/articles", editor: (id) => `/admin/articles/${id}/edit` },
  projects: { manager: "/admin/projects", editor: (id) => `/admin/projects/${id}/edit` },
  updates: { manager: "/admin/updates", editor: (id) => `/admin/updates/${id}/edit` },
  artwork: { manager: "/admin/artwork", editor: (id) => `/admin/artwork/${id}/edit` },
  experiments: { manager: "/admin/experiments", editor: (id) => `/admin/experiments/${id}/edit` },
  favorites: { manager: "/admin/favorites", editor: (id) => `/admin/favorites/${id}/edit` },
  inspirations: { manager: "/admin/inspirations", editor: (id) => `/admin/inspirations/${id}/edit` },
  experiences: { manager: "/admin/experiences", editor: (id) => `/admin/experiences/${id}/edit` },
  certifications: { manager: "/admin/certifications", editor: (id) => `/admin/certifications/${id}/edit` },
  client_projects: { manager: "/admin/client-work", editor: (id) => `/admin/client-work/${id}/edit` },
  products: { manager: "/admin/products", editor: (id) => `/admin/products/${id}/edit` },
  product_reviews: { manager: "/admin/product-reviews", editor: (id) => `/admin/product-reviews/${id}/edit` },
  life_periods: { manager: "/admin/life-periods", editor: (id) => `/admin/life-periods/${id}/edit` },
  skills: { manager: "/admin/skills", editor: () => "/admin/skills" },
  supplies_needed: { manager: "/admin/supplies", editor: () => "/admin/supplies" },
  learning_goals: { manager: "/admin/learning-goals", editor: () => "/admin/learning-goals" },
  funding_campaigns: { manager: "/admin/funding-campaigns", editor: () => "/admin/funding-campaigns" },
};

/** Tables that have a `published` boolean column */
export const PUBLISHABLE_TABLES = ["articles", "updates", "projects", "experiments", "product_reviews", "experiences"];

/** Tables that have a `review_status` column */
export const REVIEWABLE_TABLES = ["articles", "experiments", "product_reviews", "projects"];

/** Tables with text fields to check for completeness. 
 * Only truly important fields are listed — optional fields like image_url, tags, themes are excluded 
 * to reduce false-positive noise in suggestions. */
export const CONTENT_FIELDS: Record<string, string[]> = {
  articles: ["content", "excerpt"],
  projects: ["description"],
  updates: ["content"],
  artwork: [],
  experiments: ["description"],
  favorites: ["description"],
  inspirations: ["description"],
  experiences: ["description"],
  certifications: ["description"],
  client_projects: ["description"],
  products: ["description"],
  product_reviews: ["content", "summary"],
  life_periods: ["description"],
  learning_goals: ["description"],
  funding_campaigns: ["description"],
};
