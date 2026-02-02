

# Experiments Enhancement: Product Catalog & GlucoHaus Business Experiment

## Overview

This plan adds detailed product tracking for experiments and creates a comprehensive GlucoHaus plant business experiment. Since the Etsy listings file contains only headers (no product data), I'll enhance the system to support manually adding detailed products and create rich business documentation for both experiments.

## Important Note About Etsy File

The uploaded Excel file `EtsyListingsDownload.xlsx` contains only column headers with no actual product data rows. The headers show the expected format:
- TITLE, DESCRIPTION, PRICE, QUANTITY, TAGS, MATERIALS, IMAGE1-10, VARIATIONS, SKU

You may need to re-export the data from Etsy or manually add the products.

## Database Changes

### 1. Create `experiment_products` Table

```sql
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

-- Admin write policy
CREATE POLICY "Admins can manage experiment products"
  ON experiment_products FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.email = 'shanealecompte@gmail.com'
    )
  );
```

### 2. Data Insertions

**GlucoHaus Experiment:**
```sql
INSERT INTO experiments (
  name, slug, platform, description, long_description,
  status, start_date, end_date, revenue, costs, profit,
  products_sold, total_orders,
  products_offered, skills_demonstrated, lessons_learned,
  management_info, operation_details, case_study
) VALUES (
  'GlucoHaus',
  'glucohaus',
  'Independent / Research',
  'An eco-conscious plant delivery experiment exploring biodegradable packaging and sustainable shipping for live plants.',
  'GlucoHaus was a conceptual business experiment...',
  'closed',
  '2023-05-01',
  '2023-08-01',
  0, -- No revenue (planning only)
  150, -- Research/material costs
  -150,
  0, 0,
  ARRAY['Sunflower Seedlings', 'Herb Starter Kits', ...],
  ARRAY['Business Planning', 'Logistics', 'Sustainability', ...],
  ARRAY['Live plant shipping requires careful timing', ...],
  'Full business planning documentation...',
  'Operational workflow and shipping research...',
  'Detailed case study of the planning process...'
);
```

## File Changes

### 1. Upload Plant Images to Storage

Upload the 6 plant images to the `content-images` bucket under `experiments/glucohaus/`:
- `seedling-1.jpg` through `seedling-6.jpg`

These will be used as:
- Main experiment image
- Product showcase screenshots
- Gallery images

### 2. Create Admin Product Editor Component

**New file: `src/components/admin/ExperimentProductEditor.tsx`**

A reusable component for managing experiment products:
- Add/edit/delete products linked to an experiment
- Multi-image upload per product
- Price and inventory tracking
- Tags and materials arrays
- Variation support (size, color, etc.)

### 3. Update ExperimentEditor.tsx

Add a new section after "Products Offered" to manage detailed products:

```
┌──────────────────────────────────────────────────────────┐
│ Products Catalog                                          │
├──────────────────────────────────────────────────────────┤
│ [+ Add Product]                                          │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Image] Sunflower Seedling Kit                      │ │
│ │         $12.99 • 25 sold • In Stock                 │ │
│ │         [Edit] [Delete]                             │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [Image] Herb Starter Collection                     │ │
│ │         $18.99 • 12 sold • Out of Stock             │ │
│ │         [Edit] [Delete]                             │ │
│ └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

### 4. Update ExperimentDetail.tsx (Public)

Add a "Product Gallery" section to display products with images, prices, and details:

```
┌──────────────────────────────────────────────────────────┐
│ Products Sold                                             │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│ │ [Image]  │  │ [Image]  │  │ [Image]  │                │
│ │ Product  │  │ Product  │  │ Product  │                │
│ │ $12.99   │  │ $18.99   │  │ $24.99   │                │
│ │ 25 sold  │  │ 12 sold  │  │ 8 sold   │                │
│ └──────────┘  └──────────┘  └──────────┘                │
└──────────────────────────────────────────────────────────┘
```

## GlucoHaus Experiment Content

### Description
GlucoHaus was an eco-conscious plant delivery concept exploring sustainable packaging for live plant shipping. Using biodegradable pots and eco-friendly materials, the experiment researched how to ship live seedlings while minimizing environmental impact.

### Business Planning Details

**Market Research:**
- Target market: Eco-conscious urban gardeners
- Competitive analysis of plant subscription services
- Pricing strategy for sustainable premium

**Financial Planning:**
- Startup costs: ~$500-1000
- Material costs per unit: $3-5
- Shipping costs: $8-15 depending on zone
- Target margin: 40-50%

**Product Line:**
- Sunflower Seedlings in Biodegradable Cups
- Herb Starter Kits (Basil, Cilantro, Mint)
- Vegetable Seedling Bundles
- Seasonal Flower Collections

**Shipping Plan:**
- Zone-based shipping rates
- 2-day priority for live plants
- Climate-controlled packaging research
- Seasonal shipping restrictions

**Operational Workflow:**
1. Seed germination timeline (7-14 days)
2. Growth monitoring and quality control
3. Order processing and packaging
4. Carrier selection and tracking
5. Customer communication and care instructions

### Skills Demonstrated
- Business Planning & Strategy
- Supply Chain Logistics
- Sustainability Research
- Product Photography
- E-commerce Operations
- Cost Analysis & Pricing
- Packaging Design

### Lessons Learned
- Live plant shipping requires careful timing and climate consideration
- Biodegradable materials need moisture protection
- Customer education is critical for plant care success
- Seasonal timing affects both plant availability and shipping viability
- Local fulfillment may be more practical than national shipping

## Implementation Order

1. **Database Migration** - Create `experiment_products` table
2. **Upload Images** - Store plant photos in content-images bucket
3. **Create GlucoHaus** - Insert experiment with full business documentation
4. **Admin Components** - Build ExperimentProductEditor component
5. **Update ExperimentEditor** - Add products management section
6. **Update ExperimentDetail** - Display product gallery on public page
7. **Add Sample Products** - Create product entries for both experiments

## Files to Modify/Create

| File | Action |
|------|--------|
| `supabase/migrations/[timestamp]_experiment_products.sql` | Create new migration |
| `src/components/admin/ExperimentProductEditor.tsx` | New component |
| `src/pages/admin/ExperimentEditor.tsx` | Add products section |
| `src/pages/ExperimentDetail.tsx` | Add product gallery |
| `src/integrations/supabase/types.ts` | Auto-updates |

## Sample CompteHaus Products (Manual Entry)

Since the Etsy export was empty, you can manually add products like:
- Vintage Leather Jacket - $45
- Antique Brass Candlestick Set - $28
- Retro Pyrex Mixing Bowl - $22
- Mid-Century Modern Lamp - $65
- Vintage Band T-Shirt Collection - $15-25

These can be added through the admin interface once built, or I can insert them via SQL if you provide the product details.

