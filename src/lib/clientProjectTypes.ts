export const PROJECT_TYPES = [
  { value: "web_design", label: "Web Design / Development", icon: "🌐" },
  { value: "logo_branding", label: "Logo / Branding", icon: "🎨" },
  { value: "business_plan", label: "Business Plan", icon: "📊" },
  { value: "copywriting", label: "Copywriting", icon: "✍️" },
  { value: "product_design", label: "Product Design", icon: "📐" },
  { value: "product_review", label: "Product Review / Analysis", icon: "🔍" },
  { value: "consulting", label: "Consulting / Strategy", icon: "💡" },
  { value: "social_media", label: "Social Media", icon: "📱" },
  { value: "photography_video", label: "Photography / Video", icon: "📷" },
  { value: "other", label: "Other", icon: "📁" },
] as const;

export type ProjectType = typeof PROJECT_TYPES[number]["value"];

export const getProjectTypeLabel = (type: string) =>
  PROJECT_TYPES.find(t => t.value === type)?.label || "Other";

export const getProjectTypeIcon = (type: string) =>
  PROJECT_TYPES.find(t => t.value === type)?.icon || "📁";

export interface LogoBrandingMeta {
  brand_colors: string[];
  font_names: string[];
  logo_variations: number;
  guidelines_url: string;
}

export interface CopywritingMeta {
  content_type: string;
  word_count: number;
  tone: string;
  sample_excerpt: string;
}

export interface BusinessPlanMeta {
  industry: string;
  executive_summary: string;
  sections: string[];
  format: string;
}

export interface ProductDesignMeta {
  materials: string[];
  dimensions: string;
  design_tools: string[];
}

export interface ProductReviewMeta {
  product_reviewed: string;
  rating: number;
  key_findings: string[];
  methodology: string;
}

export interface ConsultingMeta {
  focus_area: string;
  recommendations_count: number;
  outcome_metrics: string;
  duration: string;
}

export interface SocialMediaMeta {
  platforms: string[];
  campaign_type: string;
  reach: string;
  engagement: string;
}

export interface PhotographyVideoMeta {
  equipment: string[];
  deliverables_count: number;
  style: string;
}

export interface OtherMeta {
  notes: string;
}