# Implementation Plan: LN Boys PG & Hostel Website

## Overview

Build a full-stack Next.js 14 App Router website for LN Boys PG & Hostel — a multi-branch paying-guest accommodation brand in Jaipur. The implementation follows a bottom-up dependency order: project scaffolding → database models → validation schemas → utility/auth/notification libraries → API routes → public UI components → public pages → admin panel → tests → seed script → deployment config.

## Tasks

- [x] 1. Project scaffolding and configuration
  - Initialise Next.js 14 App Router project with TypeScript, Tailwind CSS, ESLint, and Prettier using `create-next-app`
  - Configure `tsconfig.json` with path aliases (`@/*` → project root)
  - Configure Tailwind with the brand palette: navy `#0B0B3B`, gold `#F5C518`, white `#FFFFFF`
  - Add `next/font` with Inter (or Poppins) and configure `display: swap`
  - Create `.env.example` documenting all required variables: `MONGODB_URI`, `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `WA_PHONE_NUMBER_ID`, `WA_ACCESS_TOKEN`, `OWNER_WHATSAPP`, `OWNER_EMAIL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_SITE_URL`
  - Install and pin all production dependencies: `mongoose`, `iron-session`, `bcryptjs`, `nodemailer`, `cloudinary`, `@upstash/ratelimit`, `@upstash/redis`, `next-sitemap`, `zod`, `react-hook-form`, `@hookform/resolvers`, `marked`, `dompurify`
  - Install and pin all dev dependencies: `fast-check`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `mongodb-memory-server`, `@types/bcryptjs`, `@types/nodemailer`
  - Create `vitest.config.ts` with jsdom environment, globals, coverage thresholds (80 % statements/branches/functions/lines), and `vitest.setup.ts`
  - _Requirements: 14 (performance/testing infra)_


- [x] 2. MongoDB connection singleton and all Mongoose models
  - [x] 2.1 Create `lib/db/mongoose.ts` — connection singleton with `global._mongooseCache`
    - Implement `connectDB()` using `bufferCommands: false`
    - _Requirements: 1.1_

  - [x] 2.2 Create `lib/db/models/Branch.ts` — BranchSchema with all fields, regex, enum, and array validators as specified in design
    - Add unique index on `branchId`
    - _Requirements: 1.1, 1.8_

  - [x] 2.3 Create `lib/db/models/Room.ts` — RoomSchema linked to Branch via `branchId`
    - _Requirements: 1.2_

  - [x] 2.4 Create `lib/db/models/Amenity.ts` — AmenitySchema with category enum
    - _Requirements: 1.3_

  - [x] 2.5 Create `lib/db/models/FoodMenu.ts` — FoodMenuSchema with compound unique index `{ branchId, day, meal }`
    - _Requirements: 1.4_

  - [x] 2.6 Create `lib/db/models/Testimonial.ts` — TestimonialSchema with integer rating validator
    - _Requirements: 1.5_

  - [x] 2.7 Create `lib/db/models/Policy.ts` — PolicySchema with compound index `{ branchId, order }`
    - _Requirements: 1.6_

  - [x] 2.8 Create `lib/db/models/Landmark.ts` — LandmarkSchema with category enum
    - _Requirements: 1.7_

  - [x] 2.9 Create `lib/db/models/Gallery.ts` — GallerySchema with compound index `{ branchId, category }`
    - _Requirements: 11.2_

  - [x] 2.10 Create `lib/db/models/Lead.ts` — LeadSchema with mobile regex, intent/source/status enums, and index `{ mobile, branchId, createdAt }`
    - _Requirements: 9.3_

  - [x] 2.11 Create `lib/db/models/Post.ts` — PostSchema with unique index on `slug`, tag array validator
    - _Requirements: 8.3_

  - [x] 2.12 Write integration tests for schema round-trips and constraint enforcement (Property 2, Property 25)
    - Use `mongodb-memory-server`; verify that valid documents persist correctly and constraint violations throw
    - **Property 2: Branch schema field constraints hold after round-trip persistence**
    - **Property 25: Blog post slug uniqueness — duplicate slugs are rejected at the database level**
    - **Validates: Requirements 1.1, 8.3**


- [x] 3. Zod validation schemas and utility helpers
  - [x] 3.1 Create `lib/validations/branch.ts` — Zod schemas for branch create/update; export `validateBranchId()` helper
    - Include all field constraints from BranchSchema (lengths, enums, regex)
    - _Requirements: 1.8, 1.9, 1.10_

  - [x] 3.2 Create `lib/validations/lead.ts` — Zod LeadSchema with mobile regex `^[6-9]\d{9}$`, intent enum, preferredDate refinement (today-or-future)
    - _Requirements: 9.2, 9.3_

  - [x] 3.3 Create `lib/validations/post.ts` — Zod PostSchema with slug regex, field length constraints
    - _Requirements: 8.3_

  - [x] 3.4 Create `lib/utils/seo.ts` — `generateBranchTitle()` and `generatePageMeta()` helpers following title patterns from design
    - _Requirements: 10.1_

  - [x] 3.5 Create `lib/utils/formatters.ts` — `formatINR()`, `formatDate()`, and `buildFoodMenuMap()` (7-day × 3-meal Map builder)
    - _Requirements: 3.4_

  - [x] 3.6 Write property tests for branch slug validator (Property 1)
    - **Property 1: Branch slug validation rejects non-URL-safe strings**
    - **Validates: Requirements 1.8**

  - [x] 3.7 Write property tests for mobile number validator (Property 10)
    - **Property 10: Mobile number validation accepts only 10-digit numbers beginning with 6–9**
    - **Validates: Requirements 6.2, 9.2**

  - [x] 3.8 Write property tests for preferred-date validator (Property 11)
    - **Property 11: Preferred-date validation rejects past dates**
    - **Validates: Requirements 9.2**


- [x] 4. Auth, session, CSRF, rate-limit, and notification libraries
  - [x] 4.1 Create `lib/auth/session.ts` — iron-session `SessionOptions` config (24-hour expiry, HTTP-only, SameSite=Lax)
    - Export `getSession()` helper
    - _Requirements: 12.3_

  - [x] 4.2 Create `lib/csrf.ts` — `generateCsrfToken()` (32-byte hex), `validateCsrfToken(header, cookie)` helpers
    - _Requirements: 12.8_

  - [x] 4.3 Create `lib/ratelimit.ts` — `@upstash/ratelimit` sliding-window config (5 requests / 10 min)
    - _Requirements: 13.5_

  - [x] 4.4 Create `lib/notifications/whatsapp.ts` — `sendLeadNotification(lead)` and `sendAutoReply(mobile, name, branchName)` using WhatsApp Business Cloud API
    - _Requirements: 9.5, 9.6_

  - [x] 4.5 Create `lib/notifications/email.ts` — `sendEmailNotification(lead)` via Nodemailer SMTP transport
    - _Requirements: 9.5_

  - [x] 4.6 Create `lib/cloudinary.ts` — Cloudinary SDK config singleton and `uploadToCloudinary(file, folder)` helper
    - _Requirements: 11.2_

  - [x] 4.7 Create `middleware.ts` — Next.js middleware that guards `/admin/**` routes (except `/admin/login`) by verifying iron-session; redirects to `/admin/login` on missing/invalid session
    - _Requirements: 12.2, 12.9_

  - [x] 4.8 Write integration tests for admin auth flow and CSRF (Property 12 support)
    - Test login → session cookie set → CSRF cookie set; test CSRF mismatch returns 403; test expired session redirects
    - **Validates: Requirements 12.3, 12.8, 12.9**

  - [x] 4.9 Write integration tests for WhatsApp notification and email fallback
    - Mock `fetch` for WhatsApp API (success path); mock non-2xx response to trigger Nodemailer fallback; mock Nodemailer transport
    - **Validates: Requirements 9.5, 9.6**


- [x] 5. Checkpoint — core libraries verified
  - Ensure all unit and integration tests written so far pass; verify TypeScript compiles without errors across `lib/`; ask the user if questions arise.

- [x] 6. API route handlers — branches and sub-resources
  - [x] 6.1 Create `app/api/branches/route.ts` — `GET` (list all), `POST` (create; admin-only, Zod validation, 201/400/422/500)
    - Return response envelope `{ success, data?, error? }`
    - _Requirements: 1.1, 13.1, 13.2_

  - [x] 6.2 Create `app/api/branches/[id]/route.ts` — `GET` (fetch one by branchId; 200/404), `PATCH` (admin+CSRF; 200/400/404/422), `DELETE` (admin+CSRF; 200/404)
    - _Requirements: 1.1, 12.8, 13.2_

  - [x] 6.3 Create `app/api/branches/[id]/rooms/route.ts` — `GET` list, `POST` create (admin+CSRF)
    - _Requirements: 1.2, 1.11_

  - [x] 6.4 Create nested room sub-resource: `app/api/branches/[id]/rooms/[roomId]/route.ts` — `PATCH`, `DELETE` (admin+CSRF)
    - _Requirements: 1.2_

  - [x] 6.5 Create `app/api/branches/[id]/amenities/route.ts` and `[aId]/route.ts` — full CRUD
    - _Requirements: 1.3, 1.11_

  - [x] 6.6 Create `app/api/branches/[id]/food-menu/route.ts` and `[fId]/route.ts` — `GET`, `POST` (upsert), `DELETE`
    - _Requirements: 1.4, 1.11_

  - [x] 6.7 Create `app/api/branches/[id]/testimonials/route.ts` and `[tId]/route.ts` — `GET` (approved only for public), `POST`, `PATCH` (approve/reject), `DELETE`
    - _Requirements: 1.5, 12.7_

  - [x] 6.8 Create `app/api/branches/[id]/policies/route.ts` and `[pId]/route.ts` — full CRUD with `order` field
    - _Requirements: 1.6_

  - [x] 6.9 Create `app/api/branches/[id]/landmarks/route.ts` and `[lId]/route.ts` — full CRUD
    - _Requirements: 1.7_

  - [x] 6.10 Create `app/api/branches/[id]/gallery/route.ts` and `[gId]/route.ts` — `GET` list, `DELETE` (admin+CSRF; also deletes from Cloudinary)
    - _Requirements: 11.2_

  - [x] 6.11 Write property tests for API response envelope shape (Property 20)
    - **Property 20: API response envelope is always present and well-formed**
    - **Validates: Requirements 13.2**

  - [x] 6.12 Write property tests for API 400 behavior on invalid inputs (Property 21)
    - **Property 21: API 400 response on invalid or missing required parameters**
    - **Validates: Requirements 13.3**


- [x] 7. API route handlers — leads, posts, gallery upload, and auth
  - [x] 7.1 Create `app/api/leads/route.ts` — `GET` (admin-only, paginated), `POST` (public, rate-limited, 1 MB body limit, Zod validation, 30-min dedup check → 409, WhatsApp/email notification async)
    - _Requirements: 9.3, 9.4, 9.5, 13.5, 13.6_

  - [x] 7.2 Create `app/api/leads/[id]/route.ts` — `PATCH` (admin+CSRF; update lead status)
    - _Requirements: 12.6_

  - [x] 7.3 Create `app/api/posts/route.ts` — `GET` (list published, paginated), `POST` (admin+CSRF, Zod validation)
    - _Requirements: 8.1, 8.3_

  - [x] 7.4 Create `app/api/posts/[id]/route.ts` — `GET` (admin only, includes unpublished), `PATCH` (admin+CSRF), `DELETE` (admin+CSRF)
    - _Requirements: 8.4_

  - [x] 7.5 Create `app/api/gallery/upload/route.ts` — `POST` multipart (admin+CSRF); validate file type/size (≤50 MB); upload to Cloudinary; save Gallery document to MongoDB; return 201 with metadata
    - _Requirements: 11.1, 11.2, 13.6_

  - [x] 7.6 Create `app/api/auth/login/route.ts` — `POST`; Zod-validate body; `bcryptjs.compare` against `ADMIN_PASSWORD_HASH`; set iron-session cookie + CSRF cookie on success; return 401 on mismatch
    - _Requirements: 12.3_

  - [x] 7.7 Create `app/api/auth/logout/route.ts` — `POST` (admin+CSRF); destroy session; clear both cookies
    - _Requirements: 12.3_

  - [x] 7.8 Write property tests for duplicate-lead suppression (Property 12)
    - **Property 12: Duplicate lead suppression within 30-minute window**
    - **Validates: Requirements 9.4**

  - [x] 7.9 Write property tests for rate limiter behavior (Property 13)
    - **Property 13: Rate limiter allows at most 5 lead submissions per IP per 10-minute window**
    - **Validates: Requirements 13.5**

  - [x] 7.10 Write integration tests for gallery upload route (Property 19)
    - Mock `cloudinary.uploader.upload`; verify Gallery document stored with all fields from Cloudinary response
    - **Property 19: Gallery round-trip — uploaded item metadata is stored and retrievable with all fields intact**
    - **Validates: Requirements 11.2, 11.3**

- [x] 8. Checkpoint — all API routes functional
  - Run full test suite; verify all API handlers compile; ensure TypeScript has no errors in `app/api/`; ask the user if questions arise.


- [x] 9. Global layout components (Navbar, Footer, WhatsAppFAB)
  - [x] 9.1 Create `components/layout/Navbar.tsx` — responsive nav with brand logo, links to Home, Locations, About, Contact, Blog; hamburger menu for mobile; keyboard-navigable (WCAG 2.1 AA)
    - _Requirements: 14.3, 14.4_

  - [x] 9.2 Create `components/layout/Footer.tsx` — NAP string "LN Boys PG & Hostel, Vidhani (JECRC), Jaipur, Rajasthan, +91 83858 57902" in identical text; social links; nav links
    - _Requirements: 5.3, 6.6_

  - [x] 9.3 Create `components/layout/WhatsAppFAB.tsx` — fixed floating button linking to `https://wa.me/918385857902?text=Hi%2C%20I%20want%20to%20know%20more%20about%20LN%20Boys%20PG`; ARIA label; visible on all public pages
    - _Requirements: 2.7_

  - [x] 9.4 Create `app/layout.tsx` — root layout wrapping all public pages; includes Navbar, Footer, WhatsAppFAB; loads `next/font`; sets root `<html>` styles (brand navy background)
    - _Requirements: 2.8, 14.2_

  - [x] 9.5 Write property test for NAP string consistency (Property 9)
    - Render Footer, About page fragment, and Contact page fragment; assert extracted NAP string is byte-for-byte identical in all three
    - **Property 9: NAP string is identical across all three page contexts**
    - **Validates: Requirements 5.3, 6.6**


- [x] 10. Home page and shared branch-listing components
  - [x] 10.1 Create `components/home/HeroBanner.tsx` — full-width hero with brand name, tagline "PG & Accommodation", "Explore Branches" CTA button; responsive
    - _Requirements: 2.2_

  - [x] 10.2 Create `components/home/TrustStrip.tsx` — exactly four trust signals: "3 Meals/Day", "24×7 CCTV Security", "High-Speed Wi-Fi", "Starting ₹8,000/month", each with an icon
    - _Requirements: 2.6_

  - [x] 10.3 Create `components/home/BranchCard.tsx` — renders branch name, starting price, rating, city, status badge; active branch renders `<a href="/branch/[branchId]">`; coming-soon renders disabled `<button>` (not `<a>`)
    - _Requirements: 2.3, 2.4, 2.5_

  - [x] 10.4 Create `app/page.tsx` — Home page (ISR, revalidate 3600); fetches all branches server-side; renders HeroBanner, BranchCard list (or "Branches coming soon" message), TrustStrip, LocalBusinessJsonLd
    - _Requirements: 2.1, 2.10, 10.9_

  - [x] 10.5 Write property tests for BranchCard active/coming-soon rendering (Properties 4, 5)
    - **Property 4: Active branch cards render an enabled anchor to the correct branch detail URL**
    - **Property 5: Coming-soon branch cards render a disabled button, not a navigable anchor**
    - **Validates: Requirements 2.4, 2.5, 4.6**


- [x] 11. Locations page
  - [x] 11.1 Create `app/locations/page.tsx` — ISR (revalidate 3600); fetches all branches; renders sorted list (active first, then coming-soon; each group sorted A–Z by name); renders BranchCard for each; shows "No branches found." on empty collection
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 11.2 Write property test for Locations page sort order (Property 6)
    - Generate arbitrary mixed-status branch lists and assert rendered order matches the spec
    - **Property 6: Locations page card list is sorted — active branches before coming-soon, each group alphabetically by name**
    - **Validates: Requirements 4.3**

- [x] 12. About Us and Contact Us pages
  - [x] 12.1 Create `app/about/page.tsx` — static SSG; brand story, founding year, mission, NAP string
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 12.2 Create `components/forms/ContactForm.tsx` — controlled form (react-hook-form + Zod): Name, Mobile, Branch dropdown (active only), Message; inline validation on blur/change; submit calls `POST /api/leads`; success banner; error message preserves values
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 12.3 Create `app/contact/page.tsx` — static SSG; ContactForm, NAP string (identical text to footer/about), Google Maps embed for active branches, LocalBusinessJsonLd
    - _Requirements: 6.1, 6.6, 6.7, 10.9_

- [x] 13. Policies page
  - [x] 13.1 Create `components/ui/Accordion.tsx` — accessible accordion (aria-expanded, role="button"); exclusivity: one item open per group; respects `prefers-reduced-motion`
    - _Requirements: 7.4, 14.7_

  - [x] 13.2 Create `app/policies/page.tsx` — ISR (revalidate 3600); fetches all policies grouped by branch; renders AccordionPolicies sorted by `order`; shows branch-level placeholder when no policies exist
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 13.3 Write property tests for accordion policies sort order and exclusivity (Properties 22, 23)
    - **Property 22: Policies are ordered by `order` field ascending within each branch group**
    - **Property 23: Accordion exclusivity — at most one item per branch group is expanded at a time**
    - **Validates: Requirements 3.6, 7.2, 7.4**


- [x] 14. Blog pages
  - [x] 14.1 Create `app/blog/page.tsx` — ISR (revalidate 3600); fetches published posts paginated at 10/page; renders post list with title, excerpt, date; pagination controls
    - _Requirements: 8.1_

  - [x] 14.2 Create `app/blog/[slug]/page.tsx` — ISR (revalidate 3600); fetches post by slug; renders Markdown content via `marked` + `dompurify`; returns 404 for unpublished or non-existent slug; sets `<title>` and `<meta name="description">` from post fields
    - _Requirements: 8.2, 8.4, 8.5_

  - [x] 14.3 Write property test for blog pagination (Property 24)
    - **Property 24: Blog pagination shows at most 10 posts per page**
    - **Validates: Requirements 8.1**

- [x] 15. Enquiry form component
  - [x] 15.1 Create `components/forms/EnquiryForm.tsx` — react-hook-form + Zod; toggle "Schedule a Visit" / "Reserve Now"; Name, Mobile (10-digit, first digit 6–9, reject non-numeric on input), preferredDate (today-or-future, visible only in "Schedule a Visit" mode), WhatsApp opt-in checkbox, T&C checkbox (required); submit spinner; idle/submitting/success/error state machine; 409 dedup message without reset
    - _Requirements: 9.1, 9.2, 9.7, 9.8, 9.9_

  - [x] 15.2 Create `components/branch/StickyEnquiryForm.tsx` — wraps EnquiryForm in a sticky sidebar container for desktop (>1024 px); passes `branchId` prop
    - _Requirements: 3.8_

- [x] 16. Branch detail page components
  - [x] 16.1 Create `components/ui/Tabs.tsx` — accessible tab panel (role="tablist", role="tab", role="tabpanel", aria-selected, keyboard ← → navigation)
    - _Requirements: 14.3_

  - [x] 16.2 Create `components/branch/GalleryTabs.tsx` — tab bar [All, Rooms, Common Area, Food, Exterior]; CSS grid 2–4 cols; `<Image loading="lazy">` for below-fold items; "No photos available for this category yet." when filtered list is empty
    - _Requirements: 3.2, 11.3, 11.4_

  - [x] 16.3 Create `components/branch/OccupancyPricingTable.tsx` — table of Single/Double/Triple room types with price per month and availability
    - _Requirements: 3.3_

  - [x] 16.4 Create `components/branch/AmenitiesGrid.tsx` — grid of amenity icons grouped by category (basic, safety, comfort, food)
    - _Requirements: 3.3_

  - [x] 16.5 Create `components/branch/FoodMenuTable.tsx` — 3-row × 7-col table built from `buildFoodMenuMap()`; "–" for missing cells; responsive mobile stack (day cards at <640 px)
    - _Requirements: 3.4_

  - [x] 16.6 Create `components/branch/TestimonialsSection.tsx` — renders at most 10 approved testimonials ordered by `date` descending; "Be the first to share your experience." when empty
    - _Requirements: 3.5_

  - [x] 16.7 Create `components/branch/AccordionPolicies.tsx` — uses Accordion UI component; renders policies ordered by `order` ascending; "House rules coming soon." when empty
    - _Requirements: 3.6_

  - [x] 16.8 Create `components/branch/LandmarksSection.tsx` — groups landmarks by category (college, hospital, transport, other); "Get Directions" link using `googleMapsUrl`; "Nearby places information coming soon." when empty
    - _Requirements: 3.7_

  - [x] 16.9 Create `components/branch/InfoTabs.tsx` — tab panel with "Occupancy & Pricing" (default), "Amenities", "Details" tabs; wraps OccupancyPricingTable, AmenitiesGrid
    - _Requirements: 3.3_

  - [x] 16.10 Write property tests for GalleryTabs category filtering (Property 7)
    - **Property 7: Gallery tab filtering shows only items matching the selected category**
    - **Validates: Requirements 3.2**

  - [x] 16.11 Write property tests for FoodMenuTable cell rendering (Property 3)
    - **Property 3: FoodMenuTable renders all day/meal combinations with "–" for missing entries**
    - **Validates: Requirements 3.4**

  - [x] 16.12 Write property tests for TestimonialsSection filtering and ordering (Property 8)
    - **Property 8: Only approved testimonials appear on the branch detail page, at most 10, ordered by date descending**
    - **Validates: Requirements 3.5, 12.7**


- [x] 17. SEO components and Branch Detail page
  - [x] 17.1 Create `components/seo/BranchJsonLd.tsx` — renders `<script type="application/ld+json">` with `LodgingBusiness` schema; all required fields (name, address, telephone, priceRange, aggregateRating, url, image) from branch document
    - _Requirements: 10.2_

  - [x] 17.2 Create `components/seo/LocalBusinessJsonLd.tsx` — renders `LocalBusiness` JSON-LD; name/address/telephone values sourced from branch document (not hardcoded)
    - _Requirements: 10.9_

  - [x] 17.3 Create `app/branch/[branchId]/page.tsx` — SSR + ISR (revalidate 3600); redirect coming-soon → `/locations` (302); 404 for non-existent branchId; `generateMetadata()` for title, OG, Twitter tags; GalleryTabs, InfoTabs, FoodMenuTable, TestimonialsSection, AccordionPolicies, LandmarksSection, StickyEnquiryForm (desktop) / inline EnquiryForm (mobile); BranchJsonLd
    - _Requirements: 3.1, 3.8, 3.9, 3.10, 10.1, 10.2, 10.3, 10.4_

  - [x] 17.4 Write property tests for Branch Detail Page title pattern (Property 15)
    - **Property 15: Branch Detail Page title conforms to the specified pattern**
    - **Validates: Requirements 10.1**

  - [x] 17.5 Write property tests for LodgingBusiness JSON-LD field completeness (Property 16)
    - **Property 16: LodgingBusiness JSON-LD on Branch Detail Page contains all required fields matching the branch document**
    - **Validates: Requirements 10.2**

  - [x] 17.6 Write property tests for LocalBusiness JSON-LD field consistency (Property 17)
    - **Property 17: LocalBusiness JSON-LD on Home and Contact pages matches the branch document**
    - **Validates: Requirements 10.9**

  - [x] 17.7 Write property tests for Open Graph and Twitter Card meta tags on all public pages (Property 14)
    - **Property 14: Every public page render includes all required Open Graph and Twitter Card meta tags**
    - **Validates: Requirements 10.3, 10.4**

  - [x] 17.8 Write property tests for image alt text completeness (Property 18)
    - **Property 18: Every `<img>` element rendered on public pages has a non-empty alt attribute of at least 3 characters**
    - **Validates: Requirements 10.7**

- [x] 18. Checkpoint — all public pages functional
  - Run full test suite; verify all public pages render correctly with `next build`; check no horizontal scrollbar at 320–1920 px; ask the user if questions arise.


- [x] 19. Admin panel — layout, login, and dashboard
  - [x] 19.1 Create `app/admin/layout.tsx` — admin root layout; no Navbar/Footer/WhatsAppFAB; sidebar nav with links to all admin sections; reads CSRF token cookie to set in memory for subsequent mutations
    - _Requirements: 12.1_

  - [x] 19.2 Create `app/admin/login/page.tsx` — login form (username + password); calls `POST /api/auth/login`; redirects to `/admin/dashboard` on success; shows error message on 401
    - _Requirements: 12.3_

  - [x] 19.3 Create `app/admin/dashboard/page.tsx` — SSR; shows summary counts (branches, leads, posts); links to all sub-sections
    - _Requirements: 12.4_

- [x] 20. Admin panel — Branch CRUD
  - [x] 20.1 Create `app/admin/branches/page.tsx` — SSR; list all branches with edit/delete actions
    - _Requirements: 12.4_

  - [x] 20.2 Create `app/admin/branches/new/page.tsx` and `app/admin/branches/[id]/page.tsx` — branch create/edit form with client-side Zod validation; field-level errors on invalid input; submits PATCH/POST with CSRF header; shows 422 errors without clearing fields
    - _Requirements: 1.8, 1.9, 1.10_

  - [x] 20.3 Create `app/admin/branches/[id]/rooms/page.tsx` — list, create, edit, delete rooms for branch; field-level validation for occupancyType and pricePerMonth
    - _Requirements: 1.2, 1.11_

  - [x] 20.4 Create `app/admin/branches/[id]/amenities/page.tsx` — CRUD amenities; field-level validation for name and category
    - _Requirements: 1.3, 1.11_

  - [x] 20.5 Create `app/admin/branches/[id]/food-menu/page.tsx` — CRUD food menu items; field-level validation for day, meal, items; uses upsert endpoint
    - _Requirements: 1.4, 1.11_

  - [x] 20.6 Create `app/admin/branches/[id]/testimonials/page.tsx` — list testimonials with approve/reject toggle and delete
    - _Requirements: 12.7_

  - [x] 20.7 Create `app/admin/branches/[id]/policies/page.tsx` — CRUD policies with `order` field; reorder UI
    - _Requirements: 1.6_

  - [x] 20.8 Create `app/admin/branches/[id]/landmarks/page.tsx` — CRUD landmarks
    - _Requirements: 1.7_

  - [x] 20.9 Create `app/admin/branches/[id]/gallery/page.tsx` — gallery upload interface (JPEG/PNG/WebP/MP4 ≤50 MB); calls `POST /api/gallery/upload` with CSRF; shows error with file retained on failure; displays existing gallery items with delete option
    - _Requirements: 11.1, 11.5_


- [x] 21. Admin panel — Leads dashboard and Blog CRUD
  - [x] 21.1 Create `app/admin/leads/page.tsx` — SSR; paginated table with columns Name, Mobile, Intent, Branch, Status, Created Date, WhatsApp opt-in; status dropdown per row calls `PATCH /api/leads/[id]` with CSRF; on 401 redirect to login
    - _Requirements: 12.5, 12.6_

  - [x] 21.2 Create `app/admin/blog/page.tsx` — SSR; list all posts (published and draft) with publish status, edit/delete actions
    - _Requirements: 12.4_

  - [x] 21.3 Create `app/admin/blog/new/page.tsx` and `app/admin/blog/[id]/page.tsx` — blog post create/edit form with slug, title, excerpt, content (Markdown textarea with live preview), author, publishedAt, tags, metaTitle, metaDescription, published toggle; Zod client-side validation
    - _Requirements: 8.3_

- [x] 22. SEO infrastructure — sitemap, robots, metadata
  - [x] 22.1 Create `next-sitemap.config.ts` — configure siteUrl, `generateRobotsTxt: true`, disallow `/admin` and `/api`, `additionalPaths` fetching active branches and published posts from DB
    - _Requirements: 10.5, 10.6_

  - [x] 22.2 Create `app/sitemap.ts` — dynamic sitemap supplement (Next.js 14 native sitemap API) as fallback
    - _Requirements: 10.5_

  - [x] 22.3 Create `app/robots.ts` — allow all public pages; disallow `/admin` and `/api`
    - _Requirements: 10.6_

  - [x] 22.4 Add `generateMetadata()` to every page that doesn't already have it: `app/page.tsx` (Home), `app/locations/page.tsx`, `app/about/page.tsx`, `app/contact/page.tsx`, `app/policies/page.tsx`, `app/blog/page.tsx`; include OG and Twitter Card tags on all pages
    - _Requirements: 10.3, 10.4_

  - [x] 22.5 Create `app/not-found.tsx` — 404 page with full site navigation and home-page link; no internal details exposed
    - _Requirements: 3.10, 8.4_

  - [x] 22.6 Create `app/error.tsx` — generic React error boundary page with "Something went wrong" message and retry button
    - _Requirements: 13.4_


- [x] 23. Seed script
  - [x] 23.1 Create `scripts/seed.ts` — idempotent seed that: (1) validates MongoDB connection with ping before any inserts; (2) upserts Branch 1 (`ln-vidhani-jecrc`) with all specified fields; (3) inserts 2 coming-soon placeholder branches if not present; (4) inserts 21 FoodMenu documents (3 meals × 7 days, Indian vegetarian, ≥3 items each); (5) inserts 5 Testimonials with `approved: true` and distinct realistic text ≥30 chars; (6) inserts 5 Policies covering check-in/out, guest, noise, rent, ID topics with body ≥50 chars; exits non-zero on connection failure
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 23.2 Add `"seed": "tsx scripts/seed.ts"` script to `package.json`

- [x] 24. Deployment configuration
  - [x] 24.1 Update `next.config.ts` — configure `images.remotePatterns` for `res.cloudinary.com`; set `images.formats: ['image/avif', 'image/webp']`; add any required headers (HSTS, X-Frame-Options)
    - _Requirements: 11.3, 14.1_

  - [x] 24.2 Create `vercel.json` if needed — configure build command and output directory; ensure `next-sitemap` runs in `postbuild`
    - _Requirements: 10.5_

  - [x] 24.3 Add `"postbuild": "next-sitemap"` to `package.json` scripts

- [x] 25. Final checkpoint — full build and test suite
  - Run `npm run build` and verify no TypeScript or build errors; run full vitest suite; confirm `next-sitemap` generates `sitemap.xml` and `robots.txt`; ask the user if questions arise.


## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP, but are required for full correctness coverage.
- Each property test task explicitly references a numbered property from the design document's "Correctness Properties" section.
- The dependency order is strict: models (Task 2) → validators + utils (Task 3) → auth/notification libs (Task 4) → API routes (Tasks 6–7) → UI components (Tasks 9–16) → pages (Tasks 10–17) → admin (Tasks 19–21) → SEO infra (Task 22) → seed (Task 23) → deploy config (Task 24).
- All API routes must use the `{ success, data?, error? }` envelope — never return raw objects or arrays.
- CSRF headers must be included in every state-mutating call from admin pages; the admin layout is responsible for reading the `csrf-token` cookie and making it available to all mutation calls.
- The `mongodb-memory-server` in integration tests requires `@types/node` and a compatible Node.js version — ensure these are present before running Tasks 2.12 and 7.10.
- `next build` must succeed before the seed script can be run against production MongoDB.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.4", "3.5"] },
    { "id": 1, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9", "2.10", "2.11", "3.1", "3.2", "3.3"] },
    { "id": 2, "tasks": ["2.12", "3.6", "3.7", "3.8", "4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7"] },
    { "id": 3, "tasks": ["4.8", "4.9", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10"] },
    { "id": 4, "tasks": ["6.11", "6.12", "7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"] },
    { "id": 5, "tasks": ["7.8", "7.9", "7.10", "9.1", "9.2", "9.3"] },
    { "id": 6, "tasks": ["9.4", "9.5", "10.1", "10.2", "10.3", "16.1", "17.1", "17.2"] },
    { "id": 7, "tasks": ["10.4", "11.1", "12.1", "12.2", "13.1", "14.1", "15.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8", "16.9"] },
    { "id": 8, "tasks": ["10.5", "11.2", "12.3", "13.2", "13.3", "14.2", "15.2", "16.10", "16.11", "16.12", "17.3"] },
    { "id": 9, "tasks": ["14.3", "17.4", "17.5", "17.6", "17.7", "17.8", "19.1", "22.5", "22.6"] },
    { "id": 10, "tasks": ["19.2", "19.3", "20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8", "20.9", "22.1", "22.2", "22.3", "22.4"] },
    { "id": 11, "tasks": ["21.1", "21.2", "21.3", "23.1", "24.1", "24.2"] },
    { "id": 12, "tasks": ["23.2", "24.3"] }
  ]
}
```
