-- Phase 5: Add Favorites Content
INSERT INTO favorites (title, type, description, image_url, creator_name, creator_url, impact_statement, tags, is_current, discovered_date)
VALUES 
(
  'A Series of Unfortunate Events',
  'book',
  'Lemony Snicket''s gothic children''s series that shaped my understanding of storytelling, dark humor, and the power of illustration.',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800',
  'Lemony Snicket (Daniel Handler)',
  'https://www.lemonysnicket.com/',
  'This series taught me that children''s media can be sophisticated, emotionally complex, and visually striking. Brett Helquist''s illustrations are half the magic.',
  ARRAY['fiction', 'illustrated', 'gothic', 'childhood'],
  true,
  '2010-01-01'
),
(
  'Whaam! by Roy Lichtenstein',
  'art',
  'The iconic 1963 pop art painting that captures the tension between high art and mass media.',
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800',
  'Roy Lichtenstein',
  NULL,
  'Lichtenstein showed me that "low" culture could be elevated without losing its energy. The comic book aesthetic isn''t just style—it''s a statement about accessibility.',
  ARRAY['pop art', 'comics', 'iconic', 'political'],
  true,
  '2019-03-15'
),
(
  'Her (2013 Film)',
  'movie',
  'Spike Jonze''s masterpiece about love, technology, and what it means to connect in a digital age.',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800',
  'Spike Jonze',
  NULL,
  'This film made me think about how technology mediates human experience. Every interface I design now carries echoes of this meditation on connection.',
  ARRAY['sci-fi', 'romance', 'technology', 'philosophical'],
  true,
  '2014-01-01'
),
(
  'Cal Newport''s Work',
  'creator',
  'Author and professor whose ideas about deep work, digital minimalism, and focused productivity have shaped how I approach creative work.',
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=800',
  'Cal Newport',
  'https://calnewport.com/',
  'Newport''s emphasis on deep, focused work over shallow busyness transformed how I structure my creative practice. Quality requires protection.',
  ARRAY['productivity', 'philosophy', 'focus', 'digital minimalism'],
  true,
  '2020-06-01'
),
(
  'The Last of Us Soundtrack',
  'music',
  'Gustavo Santaolalla''s haunting acoustic score that proves minimalism can carry maximum emotional weight.',
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
  'Gustavo Santaolalla',
  NULL,
  'This soundtrack showed me how restraint amplifies emotion. A single guitar can carry more weight than an orchestra when placed correctly.',
  ARRAY['soundtrack', 'acoustic', 'emotional', 'minimalist'],
  true,
  '2020-07-01'
),
(
  'Atomic Habits',
  'book',
  'James Clear''s practical guide to building good habits and breaking bad ones through small, incremental changes.',
  'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800',
  'James Clear',
  'https://jamesclear.com/',
  'This book''s systems-based approach to self-improvement directly influenced how I approach skill development and creative practice.',
  ARRAY['self-improvement', 'habits', 'systems', 'practical'],
  true,
  '2021-01-15'
),
(
  'CGP Grey',
  'creator',
  'Educational YouTuber whose clear, engaging explanations of complex topics set a standard for accessible communication.',
  'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
  'CGP Grey',
  'https://www.cgpgrey.com/',
  'Grey''s ability to make complex ideas accessible without dumbing them down is a model for how I approach explanation in my own work.',
  ARRAY['education', 'youtube', 'explanation', 'visual'],
  true,
  '2015-09-01'
),
(
  'The Psychology of Color in Design',
  'research',
  'Academic and practical research on how color affects perception, emotion, and behavior in visual design.',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800',
  NULL,
  NULL,
  'Understanding color psychology transformed my approach to design. Every palette choice now carries intentional emotional weight.',
  ARRAY['design', 'psychology', 'color theory', 'research'],
  true,
  '2019-09-01'
);

-- Phase 6: Expand Project Content (Update 5 key projects)
UPDATE projects SET
  long_description = '<h2>Navigating Life with Type 1 Diabetes</h2>
<p>T1D Compass is a comprehensive platform designed by someone who lives with Type 1 Diabetes, for others who share this journey. Unlike generic health trackers, every feature addresses real challenges faced by the T1D community.</p>

<h3>Core Features</h3>
<ul>
<li><strong>Blood glucose tracking</strong> - Log and visualize patterns with context-aware insights</li>
<li><strong>Insulin management</strong> - Track doses, set reminders, calculate corrections</li>
<li><strong>Carb counting tools</strong> - Database of common foods with community contributions</li>
<li><strong>Pattern recognition</strong> - AI-powered analysis to identify trends before they become problems</li>
<li><strong>Community features</strong> - Connect with others, share tips, find support</li>
</ul>

<h3>Why This Matters</h3>
<p>Managing T1D is a 24/7 responsibility that affects every aspect of life. T1D Compass aims to reduce the cognitive burden while empowering users with insights that improve outcomes.</p>',
  features = ARRAY['Blood glucose tracking', 'Insulin dose logging', 'Carb counting database', 'Pattern analysis', 'Community support', 'Medical team sharing'],
  tech_stack = ARRAY['React', 'TypeScript', 'Supabase', 'Tailwind CSS', 'Chart.js'],
  problem_statement = 'People with Type 1 Diabetes lack tools designed by those who understand the daily reality of managing the condition.',
  solution_summary = 'A comprehensive platform built from lived experience, offering intuitive tracking, community support, and AI-powered insights.'
WHERE id = '66dc83b6-4ebf-477a-87eb-9169aac32d26';

UPDATE projects SET
  long_description = '<h2>Amplifying Voices for Change</h2>
<p>Pulse Network is a platform for organizing, activism, and social change. In an era where movements happen online as much as in the streets, activists need tools designed for their unique challenges.</p>

<h3>Platform Capabilities</h3>
<ul>
<li><strong>Campaign coordination</strong> - Organize actions, track participation, measure impact</li>
<li><strong>Secure communication</strong> - Privacy-focused tools for sensitive organizing</li>
<li><strong>Resource sharing</strong> - Distribute materials, guides, and training</li>
<li><strong>Community building</strong> - Connect activists across geography and cause</li>
</ul>

<h3>The Vision</h3>
<p>Social change requires sustained, coordinated effort. Pulse Network provides the infrastructure for movements to grow, adapt, and succeed.</p>',
  features = ARRAY['Campaign management', 'Secure messaging', 'Event organization', 'Resource library', 'Impact tracking', 'Coalition building'],
  tech_stack = ARRAY['React', 'Node.js', 'PostgreSQL', 'End-to-end encryption'],
  problem_statement = 'Activists lack purpose-built tools that prioritize their safety and unique organizational needs.',
  solution_summary = 'A secure, feature-rich platform designed specifically for social movements and community organizing.'
WHERE id = '7a504a88-d18f-40d9-affa-4ae2af87b823';

UPDATE projects SET
  long_description = '<h2>Your Second Brain for Productivity</h2>
<p>Notardex reimagines note-taking as a networked thought process. Instead of siloed documents, your ideas connect and build on each other organically.</p>

<h3>Key Features</h3>
<ul>
<li><strong>Bi-directional linking</strong> - Notes that reference each other automatically</li>
<li><strong>Graph visualization</strong> - See your knowledge as an interconnected map</li>
<li><strong>Daily notes</strong> - Frictionless capture that integrates into your knowledge base</li>
<li><strong>Templates</strong> - Consistent structure for recurring note types</li>
</ul>

<h3>Philosophy</h3>
<p>Knowledge isn''t linear—why should your notes be? Notardex encourages the kind of associative thinking that leads to creative breakthroughs.</p>',
  features = ARRAY['Bi-directional linking', 'Graph visualization', 'Daily notes', 'Templates', 'Tags and search', 'Export/import'],
  tech_stack = ARRAY['React', 'TypeScript', 'IndexedDB', 'D3.js'],
  problem_statement = 'Traditional note-taking tools treat ideas as isolated documents rather than interconnected thoughts.',
  solution_summary = 'A networked note-taking app that mirrors how your brain actually processes and connects ideas.'
WHERE id = '0bcfa15a-57a2-4478-bc2c-7ec965f711fc';

UPDATE projects SET
  long_description = '<h2>Cosmic Insights, Personal Growth</h2>
<p>Zodaci brings astrology into the digital age with personalized readings, daily insights, and a community of curious souls exploring cosmic patterns.</p>

<h3>Features</h3>
<ul>
<li><strong>Birth chart analysis</strong> - Deep dive into your astrological blueprint</li>
<li><strong>Daily horoscopes</strong> - Personalized guidance based on current transits</li>
<li><strong>Compatibility readings</strong> - Explore relationship dynamics</li>
<li><strong>Learning resources</strong> - Understand the symbols and systems</li>
</ul>

<h3>Approach</h3>
<p>Whether you see astrology as cosmic truth or psychological framework, Zodaci provides thoughtful content that encourages self-reflection.</p>',
  features = ARRAY['Birth chart generation', 'Daily horoscopes', 'Compatibility analysis', 'Transit tracking', 'Learning modules'],
  tech_stack = ARRAY['React', 'Python', 'Astronomical APIs', 'PostgreSQL'],
  problem_statement = 'Most astrology apps offer generic content without genuine personalization or educational depth.',
  solution_summary = 'A thoughtful astrology platform combining personalized readings with educational content.'
WHERE id = 'c6898416-7b60-42bd-9c59-c665e4f7868b';

UPDATE projects SET
  long_description = '<h2>Community-Powered Problem Solving</h2>
<p>Solutiodex is a search engine for solutions—a place where people share what worked for them and discover answers to common problems.</p>

<h3>How It Works</h3>
<ul>
<li><strong>Problem-focused search</strong> - Find solutions by describing your challenge</li>
<li><strong>Community curation</strong> - Solutions rated by those who tried them</li>
<li><strong>Context awareness</strong> - Filter by your specific situation</li>
<li><strong>Contribution system</strong> - Share what worked for you</li>
</ul>

<h3>Vision</h3>
<p>Everyone has solved problems that others are still struggling with. Solutiodex captures that distributed knowledge and makes it searchable.</p>',
  features = ARRAY['Problem search', 'Solution ratings', 'User contributions', 'Category filtering', 'Bookmarks', 'Discussion threads'],
  tech_stack = ARRAY['React', 'Elasticsearch', 'Node.js', 'PostgreSQL'],
  problem_statement = 'Valuable solutions to common problems are scattered across forums, blogs, and personal knowledge.',
  solution_summary = 'A community-driven search engine that organizes solutions by the problems they solve.'
WHERE id = 'af1de33b-703b-4e65-9b15-1768dd31e1ae';