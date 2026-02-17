

# Extended Plan: Site Design Controls, Mobile Layout, and Content Wiring Gaps

## What This Adds to the Existing Plan

Beyond the already-planned multi-select media, AI editing enhancements, and file upload features, this extension addresses **6 additional gaps** that prevent full control over the site from the admin panel.

---

## 1. Theme and Color Customizer in Admin Settings

**Problem:** All colors (Gold, Teal, Terracotta, Cream, Navy, etc.) are hardcoded in `src/index.css`. There's no way to adjust the site palette without editing code.

**Solution:** Add a "Theme & Colors" section to `src/pages/admin/Settings.tsx` that:
- Shows color pickers for each palette color (primary/Gold, secondary/Teal, accent/Terracotta, background/Cream, foreground/Navy)
- Stores selected values in the `site_content` table as JSON under a `theme_colors` key
- Applies them at runtime by setting CSS custom properties on the document root
- Includes preset palettes ("Gallery Warmth" default, "Monochrome", "Ocean", "Sunset") for one-click switching
- Shows a live preview swatch row so you can see changes before saving

**Files:** `src/pages/admin/Settings.tsx`, `src/index.css` (no change, just read by the runtime), new `src/hooks/useThemeColors.ts` hook that reads from `site_content` and applies CSS variables on load.

---

## 2. Dark Mode Toggle

**Problem:** Dark mode CSS variables exist in `src/index.css` (lines 112-139) but there's no toggle anywhere on the site for users to switch.

**Solution:** 
- Add a sun/moon toggle button in the site Header (both desktop and mobile nav)
- Use `next-themes` (already installed) to manage the theme state with localStorage persistence
- Wrap the app in a `ThemeProvider` in `src/main.tsx`
- In admin Settings, add a "Default Theme" option (Light / Dark / System) stored in `site_content`

**Files:** `src/main.tsx`, `src/components/layout/Header.tsx`, `src/pages/admin/Settings.tsx`

---

## 3. Wire Up About Page to Database Content

**Problem:** The About page (`src/pages/About.tsx`) is entirely hardcoded text. The admin has an About Content editor (`src/pages/admin/AboutContent.tsx`) that saves to `site_content`, but the public About page doesn't read from it.

**Solution:** Update `src/pages/About.tsx` to:
- Fetch `profile_image`, `bio_intro`, `bio_full`, `about_services`, `about_interests`, `speech_bubble_quote`, `about_location`, `experience_years` from the `site_content` table
- Replace hardcoded text with the database values, falling back to current hardcoded defaults when no value exists
- This means edits in the admin About Content editor will actually appear on the live site

**Files:** `src/pages/About.tsx`

---

## 4. Wire Up Footer and Header to Database Content

**Problem:** The Footer has hardcoded text ("Exploring the human experience..."), hardcoded project links (Notardex, Solutiodex, Zodaci), and hardcoded section labels. The Header nav items are hardcoded. The admin SiteContent editor saves `footer_text`, `social_*` links, and `nav_items` but the actual components don't read them.

**Solution:**
- Update `src/components/layout/Footer.tsx` to fetch `footer_text`, `site_tagline`, `social_twitter`, `social_instagram`, `social_github`, `social_linkedin` from `site_content` and render dynamically
- Update `src/components/layout/Header.tsx` to optionally read `nav_items` from `site_content` (if set), falling back to the current hardcoded array
- Add a "Navigation Manager" section to `src/pages/admin/SiteContent.tsx` with drag-to-reorder nav items, show/hide toggles, and label editing

**Files:** `src/components/layout/Footer.tsx`, `src/components/layout/Header.tsx`, `src/pages/admin/SiteContent.tsx`

---

## 5. Mobile Layout Preview and Responsive Controls

**Problem:** No way to preview or fine-tune how content looks on mobile from the admin panel. Some pages (like the Certifications page with its sticky filter bar) may have layout issues on small screens.

**Solution:** Add a "Mobile Preview" panel to admin editors and Settings:
- In `src/pages/admin/Settings.tsx`, add a "Layout" section with toggles for:
  - Mobile nav style: "Hamburger" vs "Bottom tabs"
  - Card columns on mobile: 1 or 2
  - Hero image visibility on mobile (show/hide)
  - Sticky filter bar behavior (sticky vs scroll-away)
- Store these as `site_content` entries (`layout_mobile_nav`, `layout_mobile_columns`, etc.)
- Read them in the relevant public components via a `useSiteSettings` hook
- In the admin Dashboard, add a phone-frame preview iframe showing the live site at 375px width

**Files:** `src/pages/admin/Settings.tsx`, new `src/hooks/useSiteSettings.ts`, `src/components/layout/Header.tsx` (bottom nav option), `src/pages/admin/Dashboard.tsx` (preview frame)

---

## 6. Page Section Ordering and Visibility

**Problem:** The homepage has a fixed section order (Hero, Ticker, Featured Projects, Nav Panels, Film Strip, etc.) with no admin control over which sections appear or their order.

**Solution:** Add a "Homepage Sections" manager to `src/pages/admin/HomeContent.tsx`:
- List all homepage sections with toggle switches (show/hide) and drag-to-reorder
- Store section order and visibility as JSON in `site_content` under `homepage_sections`
- Update `src/pages/Index.tsx` to read this configuration and render sections conditionally in the stored order
- Sections: Hero, Ticker, Featured Projects, Navigation Panels, Film Strip, Latest Updates, Featured Artwork, CTA

**Files:** `src/pages/admin/HomeContent.tsx`, `src/pages/Index.tsx`

---

## Summary of All New Files and Changes

| File | Changes |
|---|---|
| `src/pages/admin/Settings.tsx` | Add Theme Colors section with color pickers, dark mode default, mobile layout toggles |
| `src/hooks/useThemeColors.ts` | New hook: fetch theme colors from site_content, apply CSS variables at runtime |
| `src/hooks/useSiteSettings.ts` | New hook: fetch layout/mobile settings from site_content |
| `src/main.tsx` | Wrap app in ThemeProvider from next-themes |
| `src/components/layout/Header.tsx` | Add dark mode toggle, read nav items from DB, optional bottom-tab mobile nav |
| `src/components/layout/Footer.tsx` | Read footer text, social links, tagline from site_content |
| `src/pages/About.tsx` | Fetch all content from site_content instead of hardcoded text |
| `src/pages/admin/SiteContent.tsx` | Add Navigation Manager with reorder and show/hide |
| `src/pages/admin/HomeContent.tsx` | Add Homepage Sections manager with ordering and visibility |
| `src/pages/Index.tsx` | Read section order/visibility config, render conditionally |
| `src/pages/admin/Dashboard.tsx` | Add mobile preview iframe |

These additions combine with the existing plan (multi-select media, file uploads, AI context, quick actions) to give complete control over the site's content, design, and layout from the admin panel.
