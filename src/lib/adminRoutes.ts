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

/** Per-table column metadata so queries only select columns that actually exist */
export interface TableColumnConfig {
  label: string;           // the display-name column: "title", "name", "project_name", "product_name"
  hasSlug: boolean;
  hasUpdatedAt: boolean;
  hasPublished: boolean;
  hasReviewStatus: boolean;
}

export const TABLE_COLUMNS: Record<string, TableColumnConfig> = {
  articles:         { label: "title",        hasSlug: true,  hasUpdatedAt: true,  hasPublished: true,  hasReviewStatus: true },
  projects:         { label: "title",        hasSlug: true,  hasUpdatedAt: true,  hasPublished: true,  hasReviewStatus: true },
  updates:          { label: "title",        hasSlug: true,  hasUpdatedAt: true,  hasPublished: true,  hasReviewStatus: false },
  experiments:      { label: "name",         hasSlug: true,  hasUpdatedAt: true,  hasPublished: false, hasReviewStatus: true },
  experiences:      { label: "title",        hasSlug: true,  hasUpdatedAt: true,  hasPublished: true,  hasReviewStatus: false },
  product_reviews:  { label: "product_name", hasSlug: true,  hasUpdatedAt: true,  hasPublished: true,  hasReviewStatus: true },
  client_projects:  { label: "project_name", hasSlug: true,  hasUpdatedAt: true,  hasPublished: false, hasReviewStatus: false },
  certifications:   { label: "name",         hasSlug: false, hasUpdatedAt: true,  hasPublished: false, hasReviewStatus: false },
  products:         { label: "name",         hasSlug: true,  hasUpdatedAt: true,  hasPublished: false, hasReviewStatus: false },
  artwork:          { label: "title",        hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
  favorites:        { label: "title",        hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
  inspirations:     { label: "title",        hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
  life_periods:     { label: "title",        hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
  skills:           { label: "name",         hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
  learning_goals:   { label: "title",        hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
  funding_campaigns:{ label: "title",        hasSlug: false, hasUpdatedAt: true,  hasPublished: false, hasReviewStatus: false },
  supplies_needed:  { label: "name",         hasSlug: false, hasUpdatedAt: false, hasPublished: false, hasReviewStatus: false },
};

/** Build a PostgREST select string for a table using only columns that exist */
export function getTableSelectFields(table: string): string {
  const config = TABLE_COLUMNS[table];
  if (!config) return "id";
  const fields = ["id", config.label];
  if (config.hasSlug) fields.push("slug");
  if (config.hasUpdatedAt) fields.push("updated_at");
  if (config.hasPublished) fields.push("published");
  if (config.hasReviewStatus) fields.push("review_status");
  return fields.join(", ");
}

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
