-- Phase 2: Add Life Timeline Events

INSERT INTO life_periods (title, start_date, end_date, description, detailed_content, themes, image_url, is_current, order_index)
VALUES 
(
  'Early Discoveries',
  '2010-01-01',
  '2014-12-31',
  'Childhood artistic awakening, first encounters with illustration, and discovering the work that would shape my visual language.',
  '<h2>The Beginning</h2>
<p>This period marked my first conscious engagement with art as more than just drawing—it was the discovery that images could tell stories, evoke emotions, and create entire worlds.</p>

<h3>Key Moments</h3>
<ul>
<li>Discovered "A Series of Unfortunate Events" and Brett Helquist''s illustrations</li>
<li>Started keeping sketchbooks filled with characters and scenes</li>
<li>First experiments with digital art tools</li>
</ul>

<p>Looking back, these years planted seeds that would bloom into everything that followed.</p>',
  ARRAY['curiosity', 'imagination', 'foundation'],
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  false,
  1
),
(
  'The Learning Years',
  '2015-01-01',
  '2018-12-31',
  'High school brought a deepening interest in both technology and art, as I began to see connections between creativity and code.',
  '<h2>Growing Perspective</h2>
<p>High school wasn''t just about academics—it was about discovering that technology and art weren''t separate disciplines, but complementary forces.</p>

<h3>Explorations</h3>
<ul>
<li>First programming projects sparked interest in building digital tools</li>
<li>Art classes formalized technique while encouraging experimentation</li>
<li>Began thinking about how design affects how people interact with the world</li>
</ul>

<p>The seeds of UX thinking were planted here, even if I didn''t have the vocabulary yet.</p>',
  ARRAY['education', 'exploration', 'identity'],
  'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=800',
  false,
  2
),
(
  'Creative Awakening',
  '2019-01-01',
  '2021-12-31',
  'College years brought exposure to pop art, started first real projects, and began developing a distinct creative voice.',
  '<h2>Finding My Voice</h2>
<p>These years transformed casual interest into intentional practice. Pop art showed me that bold, accessible art could carry serious ideas.</p>

<h3>Milestones</h3>
<ul>
<li>Deep dive into Pop Art history—Warhol, Lichtenstein, and the democratization of art</li>
<li>First web projects that merged design thinking with development</li>
<li>Started documenting and sharing work publicly</li>
</ul>

<p>The COVID-19 pandemic, while challenging, provided unexpected time for focused creative development.</p>',
  ARRAY['expression', 'experimentation', 'growth'],
  'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
  false,
  3
),
(
  'The Building Phase',
  '2022-01-01',
  '2024-06-30',
  'Major project development including CompteHaus experiment, portfolio building, and launching meaningful products.',
  '<h2>Making It Real</h2>
<p>Theory became practice. This period saw the launch of real projects serving real people, including the CompteHaus Etsy experiment and early versions of T1D Compass.</p>

<h3>Key Achievements</h3>
<ul>
<li>CompteHaus on Etsy—learning e-commerce and customer experience firsthand</li>
<li>T1D Compass development began, driven by personal need and community feedback</li>
<li>Built this portfolio as a living document of the creative journey</li>
</ul>

<p>Failure became as valuable as success—every experiment taught something essential.</p>',
  ARRAY['creation', 'entrepreneurship', 'purpose'],
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800',
  false,
  4
),
(
  'Present Evolution',
  '2024-07-01',
  NULL,
  'Current creative period focused on integrating art with technology, building community, and creating work that will matter.',
  '<h2>The Now</h2>
<p>This is the moment of synthesis—bringing together everything learned across previous periods into focused, intentional creation.</p>

<h3>Current Focus</h3>
<ul>
<li>T1D Compass development continues toward full public launch</li>
<li>Writing that connects personal experience to universal themes</li>
<li>Building a portfolio that represents both past work and future direction</li>
<li>Contributing to communities that matter—T1D, design, and open source</li>
</ul>

<p>Every day is an opportunity to create something that might become a "future artifact of humanity."</p>',
  ARRAY['synthesis', 'impact', 'community'],
  'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
  true,
  5
);

-- Phase 3: Add Store Products
INSERT INTO products (name, slug, price, compare_at_price, description, long_description, category, status, images, inventory_count, tags)
VALUES 
(
  'Art Print: Golden Hour',
  'print-golden-hour',
  45.00,
  60.00,
  'Limited edition giclée print capturing the warm, nostalgic light of Southern California evening.',
  '<p>This museum-quality print brings the magic of golden hour into your space. Printed on archival-grade paper with pigment inks that will last generations.</p><ul><li>Size: 16x20 inches</li><li>Paper: 310gsm cotton rag</li><li>Edition: Limited to 50 prints</li><li>Signed and numbered</li></ul>',
  'Prints',
  'active',
  ARRAY['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800'],
  25,
  ARRAY['limited edition', 'california', 'landscape']
),
(
  'Art Print: Venice Palms',
  'print-venice-palms',
  35.00,
  NULL,
  'Signed print featuring iconic palm silhouettes against a gradient sky.',
  '<p>Venice Beach''s famous palm-lined streets captured in a composition that balances simplicity with emotional depth. Perfect for any space that needs a touch of West Coast energy.</p><ul><li>Size: 11x14 inches</li><li>Paper: Premium matte finish</li><li>Signed by artist</li></ul>',
  'Prints',
  'active',
  ARRAY['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800'],
  50,
  ARRAY['palm trees', 'venice beach', 'sunset']
),
(
  'T1D Compass Sticker Pack',
  'stickers-t1d-compass',
  8.00,
  NULL,
  'Awareness stickers for the Type 1 Diabetes community. Spread the word, share your story.',
  '<p>A collection of 5 vinyl stickers designed for the T1D community. Water-resistant and perfect for laptops, water bottles, or anywhere you want to show your support.</p><ul><li>5 unique designs</li><li>Vinyl, waterproof</li><li>Various sizes (2-3 inches)</li></ul>',
  'Merchandise',
  'active',
  ARRAY['https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400'],
  100,
  ARRAY['T1D', 'diabetes', 'awareness', 'community']
),
(
  'Digital Art Bundle',
  'digital-art-bundle',
  15.00,
  25.00,
  'Downloadable wallpapers and digital art for your devices. Instant access.',
  '<p>Transform your screens with this collection of 10 high-resolution digital artworks. Optimized for phone, tablet, and desktop displays.</p><ul><li>10 unique designs</li><li>Multiple resolutions included</li><li>Instant download after purchase</li><li>Personal use license</li></ul>',
  'Digital',
  'active',
  ARRAY['https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800'],
  NULL,
  ARRAY['digital', 'wallpapers', 'download']
),
(
  'Original Sketch: Sailboat Study',
  'original-sailboat-study',
  150.00,
  NULL,
  'One-of-a-kind original sketch. Graphite on paper, signed.',
  '<p>An original study from my sketchbook exploring nautical themes. This is a unique piece—no prints, no reproductions. Frame-ready and perfect for collectors.</p><ul><li>Original graphite on paper</li><li>Size: 9x12 inches</li><li>Signed and dated</li><li>Certificate of authenticity included</li></ul>',
  'Originals',
  'draft',
  ARRAY['https://images.unsplash.com/photo-1500514966906-fe245eea9344?w=800'],
  1,
  ARRAY['original', 'sketch', 'nautical', 'one of a kind']
),
(
  'Pop Art Poster Set',
  'poster-set-pop-art',
  55.00,
  75.00,
  'Set of 3 vibrant pop art inspired posters. Bold colors, bolder statements.',
  '<p>Three coordinated posters that bring the energy of pop art into your space. Each poster features bold colors and graphic compositions inspired by the masters.</p><ul><li>Set of 3 posters</li><li>Size: 18x24 inches each</li><li>Premium satin finish</li><li>Ships flat</li></ul>',
  'Prints',
  'active',
  ARRAY['https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'],
  30,
  ARRAY['pop art', 'poster', 'set', 'bold']
);

-- Phase 4: Add Learning Goals  
INSERT INTO learning_goals (title, description, target_amount, raised_amount, progress_percent)
VALUES 
(
  'Advanced AI/ML Course',
  'Deep learning and machine learning fundamentals to integrate AI into future projects and tools.',
  500,
  125,
  25
),
(
  'UX Research Certification',
  'Professional certification in user research methods, usability testing, and analysis techniques.',
  800,
  320,
  40
),
(
  '3D Modeling & Animation',
  'Expand artistic capabilities into 3D digital art, motion graphics, and interactive experiences.',
  400,
  60,
  15
),
(
  'Data Visualization Mastery',
  'Advanced techniques for presenting complex data in compelling, accessible visual formats.',
  300,
  180,
  60
);