-- Create experiment_products table for detailed product tracking
CREATE TABLE experiment_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID REFERENCES experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2),
  original_price NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  quantity_sold INTEGER DEFAULT 0,
  quantity_available INTEGER DEFAULT 0,
  category TEXT,
  tags TEXT[],
  materials TEXT[],
  images TEXT[],
  variations JSONB DEFAULT '{}',
  sku TEXT,
  status TEXT DEFAULT 'active',
  etsy_listing_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE experiment_products ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "Public can read experiment products"
  ON experiment_products FOR SELECT
  USING (true);

-- Admin write policy using has_role function
CREATE POLICY "Admins can manage experiment products"
  ON experiment_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_experiment_products_updated_at
  BEFORE UPDATE ON experiment_products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();