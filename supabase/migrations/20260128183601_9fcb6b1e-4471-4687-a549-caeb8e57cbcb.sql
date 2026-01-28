-- Create experiments table for business ventures
CREATE TABLE public.experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,
  description TEXT,
  long_description TEXT,
  image_url TEXT,
  screenshots TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  revenue NUMERIC DEFAULT 0,
  costs NUMERIC DEFAULT 0,
  profit NUMERIC DEFAULT 0,
  cost_breakdown JSONB DEFAULT '{}',
  products_sold INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_rating NUMERIC,
  review_count INTEGER DEFAULT 0,
  sample_reviews TEXT[] DEFAULT '{}',
  products_offered TEXT[] DEFAULT '{}',
  skills_demonstrated TEXT[] DEFAULT '{}',
  lessons_learned TEXT[] DEFAULT '{}',
  management_info TEXT,
  operation_details TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products table for store (Shopify-ready)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  compare_at_price NUMERIC,
  images TEXT[] DEFAULT '{}',
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  inventory_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'draft',
  shopify_product_id TEXT,
  shopify_variant_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add logo_url to projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Enable RLS on experiments
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read experiments"
ON public.experiments FOR SELECT
USING (true);

CREATE POLICY "Admins can manage experiments"
ON public.experiments FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active products"
ON public.products FOR SELECT
USING (status = 'active');

CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on experiments
CREATE TRIGGER update_experiments_updated_at
BEFORE UPDATE ON public.experiments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on products
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();