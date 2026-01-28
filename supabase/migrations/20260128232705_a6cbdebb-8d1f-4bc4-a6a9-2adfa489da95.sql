-- Phase 1: Update existing inspirations with images and detailed content, add 3 new inspirations

-- Update Brett Helquist with image and detailed content
UPDATE inspirations 
SET 
  image_url = 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800',
  detailed_content = '<h2>The Gothic Illustrator</h2>
<p>Brett Helquist''s illustrations for "A Series of Unfortunate Events" shaped my understanding of visual storytelling. His ability to convey melancholy, mystery, and dark humor through carefully composed scenes taught me that art can simultaneously be beautiful and unsettling.</p>

<h3>Key Influences</h3>
<ul>
<li><strong>Atmospheric depth</strong> - His use of shadows and muted palettes creates worlds that feel lived-in and slightly dangerous</li>
<li><strong>Character expression</strong> - Faces that reveal inner worlds through subtle details</li>
<li><strong>Narrative composition</strong> - Every element serves the story being told</li>
</ul>

<p>His work reminds me that the most powerful illustrations don''t just depict scenes—they evoke entire emotional landscapes.</p>',
  influence_areas = ARRAY['illustration', 'storytelling', 'visual atmosphere', 'character design']
WHERE id = 'c054e09c-f320-4ec4-9094-27330c99caf9';

-- Update Society & Struggle with image and detailed content
UPDATE inspirations 
SET 
  image_url = 'https://images.unsplash.com/photo-1591901206069-ed60c4429a2e?w=800',
  detailed_content = '<h2>The Human Condition</h2>
<p>The tension between individual aspiration and collective struggle forms the bedrock of meaningful art. From labor movements to civil rights, the stories of people fighting for dignity inspire my work to connect with something larger than myself.</p>

<h3>Themes I Explore</h3>
<ul>
<li><strong>Resistance and resilience</strong> - How communities maintain hope against systemic forces</li>
<li><strong>Individual vs. collective</strong> - The beautiful friction between personal dreams and shared responsibility</li>
<li><strong>Documented truth</strong> - Art as witness to history''s difficult moments</li>
</ul>

<p>Every project I create asks: How can this serve the human experience? How can it honor struggle while celebrating our capacity for change?</p>',
  influence_areas = ARRAY['philosophy', 'social commentary', 'activism', 'human rights']
WHERE id = 'c4c6312f-24c6-4a4c-8ce8-ef00d2f5731d';

-- Update Pop Art Movement with image and detailed content
UPDATE inspirations 
SET 
  image_url = 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
  detailed_content = '<h2>Art for Everyone</h2>
<p>Pop Art democratized visual culture by making everyday objects worthy of artistic attention. Warhol''s soup cans, Lichtenstein''s comics—these weren''t just clever commentary, they were invitations for everyone to see art in their daily lives.</p>

<h3>What Pop Art Teaches Me</h3>
<ul>
<li><strong>Bold is beautiful</strong> - Primary colors and hard edges can convey complex ideas</li>
<li><strong>Accessibility matters</strong> - Great art doesn''t need to be exclusive or intimidating</li>
<li><strong>Commentary through celebration</strong> - Critiquing culture while embracing its energy</li>
</ul>

<p>The pop art aesthetic in this portfolio isn''t just style—it''s philosophy. Art should be vivid, accessible, and joyful, even when exploring serious themes.</p>',
  influence_areas = ARRAY['visual design', 'color theory', 'accessibility', 'cultural commentary']
WHERE id = '3908fcb5-b179-4952-8fb5-f509b050ddde';

-- Add new inspiration: The Human Experience
INSERT INTO inspirations (title, category, description, image_url, detailed_content, influence_areas, order_index)
VALUES (
  'The Human Experience',
  'concept',
  'Exploring what connects us all—vulnerability, hope, love, fear, and the search for meaning that defines our shared humanity.',
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800',
  '<h2>What Makes Us Human</h2>
<p>At the core of every project I create is a simple question: What does it mean to be human? This isn''t abstract philosophy—it''s a practical design principle that shapes every decision.</p>

<h3>Manifestations in My Work</h3>
<ul>
<li><strong>T1D Compass</strong> - Chronic illness connects us to our vulnerability and resilience</li>
<li><strong>Writing</strong> - Personal essays that find universal truths in specific experiences</li>
<li><strong>Visual art</strong> - Portraits and scenes that capture emotional authenticity</li>
</ul>

<p>Technology should amplify human connection, not replace it. Every interface, every feature, every word should honor the person on the other side.</p>',
  ARRAY['philosophy', 'UX design', 'empathy', 'storytelling'],
  4
);

-- Add new inspiration: Type 1 Diabetes Community
INSERT INTO inspirations (title, category, description, image_url, detailed_content, influence_areas, order_index)
VALUES (
  'Type 1 Diabetes Community',
  'experience',
  'Living with T1D has connected me to a global community of resilient individuals who face daily challenges with courage and creativity.',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800',
  '<h2>A Personal Mission</h2>
<p>Type 1 Diabetes isn''t just a condition I manage—it''s become a lens through which I see design, community, and purpose. The T1D community inspires me every day with their advocacy, innovation, and support for one another.</p>

<h3>What T1D Has Taught Me</h3>
<ul>
<li><strong>Data as empowerment</strong> - Constant monitoring creates opportunities for better tools and insights</li>
<li><strong>Community strength</strong> - Shared struggle creates bonds that transcend geography</li>
<li><strong>Designing for real needs</strong> - Living with a condition reveals gaps that technology can fill</li>
</ul>

<p>T1D Compass emerged from this understanding—a tool built by someone who lives the experience, for others who share it.</p>',
  ARRAY['health technology', 'community building', 'advocacy', 'personal experience'],
  5
);

-- Add new inspiration: California Landscape
INSERT INTO inspirations (title, category, description, image_url, detailed_content, influence_areas, order_index)
VALUES (
  'California Landscape',
  'experience',
  'The golden light, palm-lined streets, and dramatic coastlines of Southern California have profoundly shaped my visual aesthetic and color sensibilities.',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
  '<h2>Light and Color</h2>
<p>Growing up in Southern California means living in a world of golden hour, ocean blues, and desert warmth. These aren''t just backgrounds—they''re the foundation of how I see and create.</p>

<h3>Visual Influences</h3>
<ul>
<li><strong>Golden hour</strong> - That warm, nostalgic light that makes everything feel cinematic</li>
<li><strong>Palm silhouettes</strong> - Iconic shapes that instantly evoke place and mood</li>
<li><strong>Ocean gradients</strong> - The infinite blues from shore to horizon</li>
<li><strong>Desert contrast</strong> - Bold shadows and sun-bleached surfaces</li>
</ul>

<p>You''ll see these influences throughout my work—warm color palettes, dramatic contrast, and compositions that capture the feeling of looking toward a California sunset.</p>',
  ARRAY['color palette', 'visual identity', 'photography', 'sense of place'],
  6
);