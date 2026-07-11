# Design Document: LN Boys PG & Hostel Website

## Overview

LN Boys PG & Hostel is a multi-branch paying-guest accommodation brand in Jaipur, Rajasthan. This document describes the full-stack technical design for the brand's SEO-optimized website — a Next.js 14 App Router application backed by MongoDB Atlas, Cloudinary media storage, and deployed on Vercel.

The site serves two distinct user groups:

- **Visitors** — students and working professionals discovering branches, browsing amenities, and submitting enquiries.
- **Admins** — hostel operators managing all content (branches, rooms, media, leads, blog posts) through a protected admin panel.

The architecture prioritizes organic search discovery (local SEO for Jaipur PG queries), fast Time-to-First-Byte through ISR/SSG on public pages, and a low-maintenance content pipeline through a database-driven admin interface.

### Research Summary

Key technology decisions and their rationale:

- **Next.js 14 App Router** — enables mixing SSG, ISR, and SSR at the route level; built-in image optimization (`next/image`), font loading (`next/font`), and metadata API reduce boilerplate.
- **MongoDB Atlas + Mongoose** — flexible document model suits varied branch data shapes; Atlas provides managed hosting with built-in indexes and connection pooling.
- **Cloudinary** — purpose-built media CDN with automatic WebP/AVIF transcoding, responsive transformations, and a generous free tier.
- **iron-session** — lightweight, dependency-minimal signed-cookie session for admin auth; no database session store needed.
- **WhatsApp Business Cloud API (Meta)** — official REST API for sending template messages; Nodemailer email fallback handles API downtime.
- **next-sitemap** — post-build sitemap generation integrated with Next.js; supports dynamic routes via `additionalPaths`.
- **@upstash/ratelimit** — edge-compatible sliding-window rate limiter backed by Upstash Redis; works on Vercel Edge Functions and Node.js handlers.

---

## Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VERCEL EDGE NETWORK                           │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    NEXT.JS 14 APP ROUTER                           │ │
│  │                                                                    │ │
│  │  Public Routes (SSG/ISR)          Admin Routes (SSR)              │ │
│  │  ├── / (ISR 3600s)                ├── /admin/login                │ │
│  │  ├── /locations (ISR 3600s)       ├── /admin/dashboard            │ │
│  │  ├── /about (static)              ├── /admin/branches/...         │ │
│  │  ├── /contact (static)            ├── /admin/leads                │ │
│  │  ├── /policies (ISR 3600s)        └── /admin/gallery/...          │ │
│  │  ├── /blog (ISR 3600s)                                            │ │
│  │  ├── /blog/[slug] (ISR 3600s)     API Route Handlers (/api/...)  │ │
│  │  └── /branch/[branchId] (SSR)     ├── GET  /api/branches         │ │
│  │                                   ├── POST /api/leads             │ │
│  │  Rendering Strategy:              ├── GET  /api/leads             │ │
│  │  • Public static = SSG+ISR        ├── PATCH /api/leads/[id]       │ │
│  │  • Branch detail = SSR+ISR        ├── POST /api/gallery/upload    │ │
│  │  • Admin = SSR (no cache)         └── ... (full table below)      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                │                                    │                   │
│                ▼                                    ▼                   │
│  ┌─────────────────────────┐       ┌──────────────────────────────┐    │
│  │   MongoDB Atlas         │       │   Cloudinary CDN             │    │
│  │   (cloud.mongodb.com)   │       │   (res.cloudinary.com)       │    │
│  │                         │       │                              │    │
│  │   Collections:          │       │   Folders:                   │    │
│  │   • branches            │       │   • ln-hostel/gallery        │    │
│  │   • rooms               │       │   • ln-hostel/heroes         │    │
│  │   • amenities           │       │                              │    │
│  │   • foodMenu            │       │   Transforms: w_auto,        │    │
│  │   • testimonials        │       │   f_auto, q_auto             │    │
│  │   • policies            │       └──────────────────────────────┘    │
│  │   • landmarks           │                                           │
│  │   • gallery             │       ┌──────────────────────────────┐    │
│  │   • leads               │       │   External Services          │    │
│  │   • posts               │       │                              │    │
│  └─────────────────────────┘       │   • WhatsApp Business API    │    │
│                                    │     (graph.facebook.com)     │    │
│                                    │   • Nodemailer / SMTP        │    │
│                                    │     (email fallback)         │    │
│                                    │   • Upstash Redis            │    │
│                                    │     (rate limiting)          │    │
│                                    └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Rendering Strategy per Route

| Route | Strategy | Revalidate | Rationale |
|---|---|---|---|
| `/` | SSG + ISR | 3600 s | High-traffic landing; content changes infrequently |
| `/locations` | SSG + ISR | 3600 s | Same as home |
| `/about` | Static SSG | — | Never changes |
| `/contact` | Static SSG | — | Never changes |
| `/policies` | SSG + ISR | 3600 s | Policy changes are infrequent |
| `/blog` | SSG + ISR | 3600 s | New posts are infrequent |
| `/blog/[slug]` | SSG + ISR | 3600 s | Post content rarely changes |
| `/branch/[branchId]` | SSR + ISR | 3600 s | Needs fresh gallery/testimonial data |
| `/admin/**` | SSR (no cache) | — | Always fresh; auth-gated |
| `/api/**` | Runtime | — | REST handlers, no caching |

---

## Components and Interfaces

### Folder Structure

```
ln-boys-hostel/
├── app/                                # Next.js App Router root
│   ├── layout.tsx                      # Root layout (fonts, WhatsApp button, Nav, Footer)
│   ├── page.tsx                        # Home page (ISR)
│   ├── locations/
│   │   └── page.tsx                    # All Branches page (ISR)
│   ├── about/
│   │   └── page.tsx                    # About Us page (static)
│   ├── contact/
│   │   └── page.tsx                    # Contact Us page (static)
│   ├── policies/
│   │   └── page.tsx                    # Policies page (ISR)
│   ├── blog/
│   │   ├── page.tsx                    # Blog index (ISR)
│   │   └── [slug]/
│   │       └── page.tsx                # Blog post (ISR)
│   ├── branch/
│   │   └── [branchId]/
│   │       └── page.tsx                # Branch Detail page (SSR+ISR)
│   ├── admin/
│   │   ├── layout.tsx                  # Admin layout (auth guard)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── branches/
│   │   │   ├── page.tsx                # Branch list
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx            # Edit branch
│   │   │       ├── rooms/page.tsx
│   │   │       ├── amenities/page.tsx
│   │   │       ├── food-menu/page.tsx
│   │   │       ├── testimonials/page.tsx
│   │   │       ├── policies/page.tsx
│   │   │       ├── landmarks/page.tsx
│   │   │       └── gallery/page.tsx
│   │   ├── leads/
│   │   │   └── page.tsx
│   │   └── blog/
│   │       ├── page.tsx
│   │       ├── new/page.tsx
│   │       └── [id]/page.tsx
│   ├── api/
│   │   ├── branches/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET one, PATCH, DELETE
│   │   │       ├── rooms/route.ts
│   │   │       ├── amenities/route.ts
│   │   │       ├── food-menu/route.ts
│   │   │       ├── testimonials/route.ts
│   │   │       ├── policies/route.ts
│   │   │       ├── landmarks/route.ts
│   │   │       └── gallery/route.ts
│   │   ├── leads/
│   │   │   ├── route.ts                # GET list, POST create
│   │   │   └── [id]/route.ts           # PATCH status
│   │   ├── posts/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── gallery/
│   │   │   └── upload/route.ts         # POST multipart upload → Cloudinary
│   │   └── auth/
│   │       ├── login/route.ts
│   │       └── logout/route.ts
│   ├── sitemap.ts                      # Dynamic sitemap (next-sitemap supplement)
│   └── robots.ts                       # robots.txt
├── components/
│   ├── ui/                             # Generic UI atoms
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Accordion.tsx
│   │   └── Tabs.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── WhatsAppFAB.tsx             # Floating Action Button
│   ├── home/
│   │   ├── HeroBanner.tsx
│   │   ├── BranchCard.tsx
│   │   └── TrustStrip.tsx
│   ├── branch/
│   │   ├── GalleryTabs.tsx
│   │   ├── InfoTabs.tsx
│   │   ├── OccupancyPricingTable.tsx
│   │   ├── AmenitiesGrid.tsx
│   │   ├── FoodMenuTable.tsx
│   │   ├── TestimonialsSection.tsx
│   │   ├── AccordionPolicies.tsx
│   │   ├── LandmarksSection.tsx
│   │   └── StickyEnquiryForm.tsx
│   ├── forms/
│   │   ├── EnquiryForm.tsx
│   │   └── ContactForm.tsx
│   └── seo/
│       ├── BranchJsonLd.tsx
│       └── LocalBusinessJsonLd.tsx
├── lib/
│   ├── db/
│   │   ├── mongoose.ts                 # Connection singleton
│   │   └── models/
│   │       ├── Branch.ts
│   │       ├── Room.ts
│   │       ├── Amenity.ts
│   │       ├── FoodMenu.ts
│   │       ├── Testimonial.ts
│   │       ├── Policy.ts
│   │       ├── Landmark.ts
│   │       ├── Gallery.ts
│   │       ├── Lead.ts
│   │       └── Post.ts
│   ├── auth/
│   │   ├── session.ts                  # iron-session config & helpers
│   │   └── middleware.ts               # Auth guard for admin routes
│   ├── cloudinary.ts                   # Cloudinary SDK config + upload helper
│   ├── notifications/
│   │   ├── whatsapp.ts                 # WhatsApp Business Cloud API client
│   │   └── email.ts                   # Nodemailer fallback
│   ├── ratelimit.ts                    # Upstash ratelimit config
│   ├── csrf.ts                         # Double-submit cookie helpers
│   ├── validations/
│   │   ├── branch.ts                   # Zod schemas
│   │   ├── lead.ts
│   │   └── post.ts
│   └── utils/
│       ├── seo.ts                      # Title/meta generators
│       └── formatters.ts
├── scripts/
│   └── seed.ts                         # Idempotent DB seed
├── public/
│   ├── icons/
│   └── images/
├── middleware.ts                       # Next.js middleware (admin auth check)
├── next.config.ts
├── next-sitemap.config.ts
└── tailwind.config.ts
```

### Key UI Component Designs

#### EnquiryForm

```
┌─────────────────────────────────────────┐
│  [Schedule a Visit] [Reserve Now]  ← toggle (radio/button group)
├─────────────────────────────────────────┤
│  Name *          [_________________]    │
│  Mobile *        [_________________]    │  ← 10-digit, first digit 6-9
│  Preferred Date  [_________________]    │  ← visible only in "Schedule a Visit"
│  □ Send updates on WhatsApp             │
│  □ I accept the Terms & Conditions *   │  ← required; error shown below
│                                         │
│  [  Book My Spot  ]  ← submit (spinner during flight)
└─────────────────────────────────────────┘
```

State machine:
- `idle` → `submitting` (on submit with valid data) → `success` (reset form, show banner) | `error` (show inline error, preserve values)
- Duplicate lead (409 from API) → show dedup message without resetting

#### GalleryTabs

```
[All] [Rooms] [Common Area] [Food] [Exterior]  ← tab bar (role="tablist")
┌───────────────────────────────────────────────────────────┐
│  [img] [img] [img] [img]      ← CSS grid, 2-4 cols        │
│  [img] [img] [img] [video]    ← lazy-loaded beyond fold   │
│                                                            │
│  "No photos available for this category yet."             │
│  ← shown when filtered list is empty                      │
└───────────────────────────────────────────────────────────┘
```

Data flow: gallery items fetched server-side; client filtering via React state on tab change (no extra network requests).

#### FoodMenuTable

```
         Mon    Tue    Wed    Thu    Fri    Sat    Sun
Breakfast  …      …      –      …      …      …      …
Lunch      …      …      …      –      …      …      …
Dinner     …      …      …      …      –      …      …
```

- Built from a `Map<day, Map<meal, string[]>>` derived from the `foodMenu` collection.
- Missing cells rendered as "–" (en-dash).
- Responsive: on mobile (<640 px) renders as a vertical stack (day cards).

#### AccordionPolicies

```
▶ Check-in / Check-out Times
▼ Guest Policy
    Guest entry is allowed between 8 AM–9 PM only. All
    guests must sign the visitor register at reception …
▶ Noise Policy
▶ Rent Payment Terms
▶ ID Requirements
```

Behavior: `aria-expanded` toggled; only one item open per group; `prefers-reduced-motion` respected (no transition).

---

## Data Models

### MongoDB Connection Singleton (`lib/db/mongoose.ts`)

```typescript
// Cached connection to avoid re-connecting on every hot reload in development
let cached: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } = 
  global._mongooseCache ?? { conn: null, promise: null };

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI!, {
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
```

### Mongoose Schema Definitions

#### Branch (`lib/db/models/Branch.ts`)

```typescript
const BranchSchema = new Schema({
  branchId:       { type: String, required: true, unique: true,
                    match: /^[a-z0-9]+(-[a-z0-9]+)*$/, minlength: 3, maxlength: 80 },
  name:           { type: String, required: true, minlength: 1, maxlength: 120 },
  address:        { type: String, required: true, minlength: 1, maxlength: 300 },
  city:           { type: String, required: true, minlength: 1, maxlength: 60 },
  state:          { type: String, required: true, minlength: 1, maxlength: 60 },
  pincode:        { type: String, required: true, match: /^\d{6}$/ },
  phone:          { type: [String], required: true, validate: [(a: string[]) => a.length >= 1 && a.length <= 5, 'phone array must have 1–5 entries'] },
  whatsapp:       { type: String, required: true },
  startingPrice:  { type: Number, required: true, min: 0.01, max: 999999.99 },
  rating:         { type: Number, default: 0, min: 0.0, max: 5.0 },
  status:         { type: String, required: true, enum: ['active', 'coming-soon'] },
  occupancyTypes: { type: [String], validate: [(a: string[]) => a.length >= 1 && a.length <= 10, '1–10 entries required'] },
  latitude:       { type: Number, default: null },
  longitude:      { type: Number, default: null },
  metaTitle:      { type: String, default: null, maxlength: 70 },
  metaDescription:{ type: String, default: null, maxlength: 160 },
}, { timestamps: true });
```

#### Room (`lib/db/models/Room.ts`)

```typescript
const RoomSchema = new Schema({
  branchId:       { type: String, required: true, ref: 'Branch' },
  occupancyType:  { type: String, required: true, enum: ['Single', 'Double', 'Triple'] },
  pricePerMonth:  { type: Number, required: true, min: 0.01, max: 999999.99 },
  amenities:      { type: [Schema.Types.ObjectId], ref: 'Amenity',
                    validate: [(a: unknown[]) => a.length <= 30, 'max 30 amenities'] },
  description:    { type: String, default: '', maxlength: 500 },
  available:      { type: Boolean, default: true },
}, { timestamps: true });
```

#### Amenity (`lib/db/models/Amenity.ts`)

```typescript
const AmenitySchema = new Schema({
  branchId: { type: String, required: true, ref: 'Branch' },
  name:     { type: String, required: true, minlength: 1, maxlength: 100 },
  icon:     { type: String, required: true, minlength: 1, maxlength: 100 },
  category: { type: String, required: true, enum: ['basic', 'safety', 'comfort', 'food'] },
});
```

#### FoodMenu (`lib/db/models/FoodMenu.ts`)

```typescript
const FoodMenuSchema = new Schema({
  branchId: { type: String, required: true, ref: 'Branch' },
  day:      { type: String, required: true,
              enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] },
  meal:     { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner'] },
  items:    { type: [String], required: true,
              validate: [(a: string[]) => a.length >= 1 && a.length <= 20, '1–20 items required'] },
});
// Compound unique index: one entry per (branchId, day, meal)
FoodMenuSchema.index({ branchId: 1, day: 1, meal: 1 }, { unique: true });
```

#### Testimonial (`lib/db/models/Testimonial.ts`)

```typescript
const TestimonialSchema = new Schema({
  branchId:   { type: String, required: true, ref: 'Branch' },
  authorName: { type: String, required: true, minlength: 1, maxlength: 80 },
  rating:     { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
  text:       { type: String, required: true, minlength: 1, maxlength: 1000 },
  date:       { type: Date, required: true },
  approved:   { type: Boolean, default: false },
}, { timestamps: true });
```

#### Policy (`lib/db/models/Policy.ts`)

```typescript
const PolicySchema = new Schema({
  branchId: { type: String, required: true, ref: 'Branch' },
  title:    { type: String, required: true, minlength: 1, maxlength: 120 },
  body:     { type: String, required: true, minlength: 1, maxlength: 5000 },
  order:    { type: Number, required: true, min: 0 },
});
PolicySchema.index({ branchId: 1, order: 1 });
```

#### Landmark (`lib/db/models/Landmark.ts`)

```typescript
const LandmarkSchema = new Schema({
  branchId:       { type: String, required: true, ref: 'Branch' },
  name:           { type: String, required: true, minlength: 1, maxlength: 120 },
  category:       { type: String, required: true, enum: ['college','hospital','transport','other'] },
  distanceMetres: { type: Number, required: true, min: 0 },
  googleMapsUrl:  { type: String, required: true, minlength: 1, maxlength: 500 },
});
```

#### Gallery (`lib/db/models/Gallery.ts`)

```typescript
const GallerySchema = new Schema({
  branchId:     { type: String, required: true, ref: 'Branch' },
  url:          { type: String, required: true },
  publicId:     { type: String, required: true },
  resourceType: { type: String, required: true, enum: ['image', 'video'] },
  category:     { type: String, required: true,
                  enum: ['room', 'common-area', 'food', 'exterior', 'event'] },
  altText:      { type: String, required: true, minlength: 1, maxlength: 200 },
  uploadedAt:   { type: Date, default: Date.now },
});
GallerySchema.index({ branchId: 1, category: 1 });
```

#### Lead (`lib/db/models/Lead.ts`)

```typescript
const LeadSchema = new Schema({
  name:          { type: String, required: true, minlength: 1, maxlength: 100 },
  mobile:        { type: String, required: true, match: /^[6-9]\d{9}$/ },
  preferredDate: { type: Date, default: null },
  whatsappOptIn: { type: Boolean, default: false },
  intent:        { type: String, required: true, enum: ['visit', 'reserve'] },
  branchId:      { type: String, required: true },
  source:        { type: String, required: true, enum: ['enquiry-form', 'contact-form'] },
  status:        { type: String, default: 'new',
                   enum: ['new', 'contacted', 'visited', 'converted', 'closed'] },
  createdAt:     { type: Date, default: Date.now },
});
LeadSchema.index({ mobile: 1, branchId: 1, createdAt: -1 });
```

#### Post (`lib/db/models/Post.ts`)

```typescript
const PostSchema = new Schema({
  slug:            { type: String, required: true, unique: true,
                     minlength: 3, maxlength: 100, match: /^[a-z0-9]+(-[a-z0-9]+)*$/ },
  title:           { type: String, required: true, minlength: 1, maxlength: 120 },
  excerpt:         { type: String, required: true, minlength: 1, maxlength: 300 },
  content:         { type: String, required: true, minlength: 1, maxlength: 100000 },
  author:          { type: String, required: true, minlength: 1, maxlength: 80 },
  publishedAt:     { type: Date, required: true },
  tags:            { type: [String], validate: [(a: string[]) => a.length <= 10, 'max 10 tags'] },
  metaTitle:       { type: String, required: true, minlength: 1, maxlength: 70 },
  metaDescription: { type: String, required: true, minlength: 1, maxlength: 160 },
  published:       { type: Boolean, default: false },
}, { timestamps: true });
```

---

## API Route Table

All responses conform to the envelope: `{ success: boolean, data?: any, error?: string }`.

| Method | Path | Auth | Description | Status Codes |
|--------|------|------|-------------|--------------|
| GET | `/api/branches` | — | List all branches | 200, 500 |
| POST | `/api/branches` | Admin | Create branch | 201, 400, 422, 500 |
| GET | `/api/branches/[id]` | — | Get branch by branchId | 200, 404, 500 |
| PATCH | `/api/branches/[id]` | Admin+CSRF | Update branch | 200, 400, 404, 422, 500 |
| DELETE | `/api/branches/[id]` | Admin+CSRF | Delete branch | 200, 404, 500 |
| GET | `/api/branches/[id]/rooms` | — | List rooms for branch | 200, 404, 500 |
| POST | `/api/branches/[id]/rooms` | Admin+CSRF | Create room | 201, 400, 500 |
| PATCH | `/api/branches/[id]/rooms/[roomId]` | Admin+CSRF | Update room | 200, 400, 404, 500 |
| DELETE | `/api/branches/[id]/rooms/[roomId]` | Admin+CSRF | Delete room | 200, 404, 500 |
| GET | `/api/branches/[id]/amenities` | — | List amenities | 200, 500 |
| POST | `/api/branches/[id]/amenities` | Admin+CSRF | Create amenity | 201, 400, 500 |
| PATCH | `/api/branches/[id]/amenities/[aId]` | Admin+CSRF | Update amenity | 200, 400, 404, 500 |
| DELETE | `/api/branches/[id]/amenities/[aId]` | Admin+CSRF | Delete amenity | 200, 404, 500 |
| GET | `/api/branches/[id]/food-menu` | — | Get food menu | 200, 500 |
| POST | `/api/branches/[id]/food-menu` | Admin+CSRF | Create/upsert menu item | 201, 400, 500 |
| DELETE | `/api/branches/[id]/food-menu/[fId]` | Admin+CSRF | Delete menu item | 200, 404, 500 |
| GET | `/api/branches/[id]/testimonials` | — | List approved testimonials | 200, 500 |
| POST | `/api/branches/[id]/testimonials` | Admin+CSRF | Create testimonial | 201, 400, 500 |
| PATCH | `/api/branches/[id]/testimonials/[tId]` | Admin+CSRF | Approve/reject | 200, 400, 404, 500 |
| DELETE | `/api/branches/[id]/testimonials/[tId]` | Admin+CSRF | Delete | 200, 404, 500 |
| GET | `/api/branches/[id]/policies` | — | List policies | 200, 500 |
| POST | `/api/branches/[id]/policies` | Admin+CSRF | Create policy | 201, 400, 500 |
| PATCH | `/api/branches/[id]/policies/[pId]` | Admin+CSRF | Update policy | 200, 400, 404, 500 |
| DELETE | `/api/branches/[id]/policies/[pId]` | Admin+CSRF | Delete policy | 200, 404, 500 |
| GET | `/api/branches/[id]/landmarks` | — | List landmarks | 200, 500 |
| POST | `/api/branches/[id]/landmarks` | Admin+CSRF | Create landmark | 201, 400, 500 |
| PATCH | `/api/branches/[id]/landmarks/[lId]` | Admin+CSRF | Update landmark | 200, 400, 404, 500 |
| DELETE | `/api/branches/[id]/landmarks/[lId]` | Admin+CSRF | Delete landmark | 200, 404, 500 |
| GET | `/api/branches/[id]/gallery` | — | List gallery items | 200, 500 |
| DELETE | `/api/branches/[id]/gallery/[gId]` | Admin+CSRF | Delete gallery item | 200, 404, 500 |
| POST | `/api/gallery/upload` | Admin+CSRF | Upload to Cloudinary + save metadata | 201, 400, 413, 500 |
| GET | `/api/leads` | Admin | List all leads (paginated) | 200, 401, 500 |
| POST | `/api/leads` | — (rate-limited) | Submit enquiry / contact | 201, 400, 409, 413, 429, 500 |
| PATCH | `/api/leads/[id]` | Admin+CSRF | Update lead status | 200, 400, 401, 404, 500 |
| GET | `/api/posts` | — | List published posts (paginated) | 200, 500 |
| POST | `/api/posts` | Admin+CSRF | Create post | 201, 400, 422, 500 |
| GET | `/api/posts/[id]` | Admin | Get any post (incl. unpublished) | 200, 401, 404, 500 |
| PATCH | `/api/posts/[id]` | Admin+CSRF | Update post | 200, 400, 404, 500 |
| DELETE | `/api/posts/[id]` | Admin+CSRF | Delete post | 200, 404, 500 |
| POST | `/api/auth/login` | — | Admin login | 200, 400, 401, 500 |
| POST | `/api/auth/logout` | Admin+CSRF | Admin logout | 200, 500 |

### Rate Limiting

`POST /api/leads` is protected by `@upstash/ratelimit` using a sliding-window algorithm:

```typescript
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '10 m'),
  analytics: false,
});
```

On limit exceeded, the handler returns HTTP 429 with header:
`Retry-After: <seconds until window expires>`.

### Request Body Size Limit

All API route handlers reject bodies exceeding 1 MB by checking `Content-Length` before parsing, returning HTTP 413 with `{ success: false, error: "Payload too large" }`.

### CSRF Protection

Double-submit cookie pattern:

1. On admin login success, the server sets two cookies:
   - `session` (HTTP-only, signed by iron-session)
   - `csrf-token` (non-HTTP-only, same `SameSite=Lax`) — a random 32-byte hex string
2. Every state-mutating admin request must include the `X-CSRF-Token` header whose value matches the `csrf-token` cookie.
3. The middleware compares header vs. cookie value; mismatch returns HTTP 403.

---

## Admin Auth Flow

### Login Flow

```
Admin Browser                  Next.js Server                  Env Vars
─────────────────────────────────────────────────────────────────────────
POST /api/auth/login
  { username, password }
                         ──►  1. Validate body (Zod)
                              2. Compare username === process.env.ADMIN_USERNAME
                              3. bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH)
                              4. If valid:
                                 a. Set iron-session cookie (HTTP-only, Secure, 24h)
                                 b. Generate csrf_token = randomBytes(32).toString('hex')
                                 c. Set csrf-token cookie (non-HTTP-only, SameSite=Lax, 24h)
                              5. Return { success: true }
  ◄──                          Set-Cookie: session=<signed>; HttpOnly; Secure; SameSite=Lax
                               Set-Cookie: csrf-token=<hex>; Secure; SameSite=Lax

Browser stores both cookies.
Admin frontend reads csrf-token and includes it in X-CSRF-Token header on every mutation.
```

### Session Guard (Next.js Middleware)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = await getIronSession(request, ...);
    if (!session.adminId) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
}

export const config = { matcher: ['/admin/:path*'] };
```

### Password Storage

- Admin credentials are stored **only in environment variables** (not in the database).
- `ADMIN_USERNAME` — plain text username.
- `ADMIN_PASSWORD_HASH` — bcrypt hash (cost factor 12) of the password.
- Hashing is done offline; the hash is deployed as a secret in Vercel.

```bash
# One-time setup (run locally, copy hash to Vercel env)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('yourPassword', 12).then(console.log)"
```

### Session Cookie Configuration

```typescript
const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,   // 32+ char random secret
  cookieName: 'ln-admin-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,                  // 24 hours
  },
};
```

---

## Lead Submission and Notification Flow

```
Visitor Browser              Next.js API               MongoDB / WhatsApp / Email
──────────────────────────────────────────────────────────────────────────────────
POST /api/leads
  { name, mobile, preferredDate?,
    whatsappOptIn, intent, branchId }
                       ──►  1. Check Content-Length ≤ 1MB (else 413)
                            2. Check rate limit: ≤5 req/IP/10min (else 429 + Retry-After)
                            3. Validate body via Zod LeadSchema (else 400)
                            4. Duplicate check:
                               query leads where mobile=X AND branchId=Y
                               AND createdAt >= now-30min
                               → If found: return 409 { error: "We already received..." }
                            5. Insert Lead document → MongoDB
                            6. Respond 201 { success: true }  ◄──── client gets success

                            [async, non-blocking after response]
                            7. sendLeadNotification(lead):
                               a. POST https://graph.facebook.com/v18.0/{phoneNumberId}/messages
                                  { template: "new_lead", to: "+918385857902", ... }
                               b. If non-2xx or network error:
                                  → sendEmailNotification(lead) via Nodemailer
                                    (to: process.env.OWNER_EMAIL)

                            8. If whatsappOptIn === true:
                               sendAutoReply(lead.mobile):
                               POST WhatsApp API → visitor's number
                               Body: "Hi {name}, thanks for your interest in {branch}.
                                      We'll contact you within 2 hours. — LN Boys PG"
```

### WhatsApp API Implementation

```typescript
// lib/notifications/whatsapp.ts
export async function sendLeadNotification(lead: ILead): Promise<void> {
  const url = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: process.env.OWNER_WHATSAPP,  // +918385857902
      type: 'template',
      template: {
        name: 'new_lead_notification',
        language: { code: 'en' },
        components: [{ type: 'body', parameters: [
          { type: 'text', text: lead.name },
          { type: 'text', text: lead.mobile },
          { type: 'text', text: lead.intent },
          { type: 'text', text: lead.branchId },
        ]}],
      },
    }),
  });
  if (!response.ok) throw new Error(`WhatsApp API: ${response.status}`);
}
```

### Email Fallback (Nodemailer)

```typescript
// lib/notifications/email.ts
export async function sendEmailNotification(lead: ILead): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.OWNER_EMAIL,
    subject: `New Lead: ${lead.name} — ${lead.branchId}`,
    text: `Name: ${lead.name}\nMobile: ${lead.mobile}\nIntent: ${lead.intent}\nBranch: ${lead.branchId}`,
  });
}
```

---

## SEO Strategy

### Page Title Pattern

| Page | Title Pattern |
|------|--------------|
| Home | `Best Boys PG & Hostel in Jaipur \| LN Boys PG & Hostel` |
| Branch Detail | `[Branch Name] \| Best Boys PG near [Landmark], [City] \| LN Boys PG & Hostel` |
| Locations | `All PG & Hostel Locations in Jaipur \| LN Boys PG & Hostel` |
| About | `About Us \| LN Boys PG & Hostel, Jaipur` |
| Contact | `Contact Us \| LN Boys PG & Hostel, Jaipur` |
| Blog index | `PG Guide & Local Tips \| LN Boys PG & Hostel Blog` |
| Blog post | `[post.metaTitle]` |

### Metadata API (Next.js 14)

```typescript
// app/branch/[branchId]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const branch = await getBranch(params.branchId);
  return {
    title: `${branch.name} | Best Boys PG near JECRC, ${branch.city} | LN Boys PG & Hostel`,
    description: branch.metaDescription ?? `Affordable PG & hostel accommodation at ${branch.name}. Starting ₹${branch.startingPrice}/month.`,
    openGraph: {
      title: branch.name,
      description: branch.metaDescription ?? '',
      url: `https://lnboyspg.in/branch/${branch.branchId}`,
      type: 'website',
      images: [{ url: branch.heroImageUrl ?? '/og-default.jpg' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: branch.name,
      description: branch.metaDescription ?? '',
      images: [branch.heroImageUrl ?? '/og-default.jpg'],
    },
  };
}
```

### JSON-LD: LodgingBusiness (Branch Detail Page)

```typescript
// components/seo/BranchJsonLd.tsx
export function BranchJsonLd({ branch }: { branch: IBranch }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: branch.name,
    url: `https://lnboyspg.in/branch/${branch.branchId}`,
    telephone: branch.phone[0],
    priceRange: `₹${branch.startingPrice}/month`,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: branch.rating,
      bestRating: 5,
      worstRating: 1,
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: branch.address,
      addressLocality: branch.city,
      addressRegion: branch.state,
      postalCode: branch.pincode,
      addressCountry: 'IN',
    },
    image: branch.heroImageUrl ?? '',
  };
  return (
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
  );
}
```

### JSON-LD: LocalBusiness (Home & Contact Pages)

```typescript
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'LN Boys PG & Hostel',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'In front of Audi Service Centre, Vidhani, Near JECRC',
    addressLocality: 'Jaipur',
    addressRegion: 'Rajasthan',
    postalCode: '302022',
    addressCountry: 'IN',
  },
  telephone: '+918385857902',
  url: 'https://lnboyspg.in',
};
```

### Sitemap Generation (`next-sitemap.config.ts`)

```typescript
const config: INextSitemapConfig = {
  siteUrl: 'https://lnboyspg.in',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    additionalSitemaps: [],
    policies: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/admin', '/api'] },
    ],
  },
  additionalPaths: async () => {
    // Fetch active branches and published posts from DB to generate dynamic entries
    const branches = await getActiveBranches();
    const posts = await getPublishedPosts();
    return [
      ...branches.map(b => ({
        loc: `/branch/${b.branchId}`,
        changefreq: 'weekly',
        priority: 0.9,
        lastmod: b.updatedAt.toISOString(),
      })),
      ...posts.map(p => ({
        loc: `/blog/${p.slug}`,
        changefreq: 'monthly',
        priority: 0.7,
        lastmod: p.updatedAt.toISOString(),
      })),
    ];
  },
};
```

### Image Alt Text Strategy

All `<Image>` components receive `alt` from:
- Gallery items: `galleryItem.altText` (required field, 1–200 chars)
- Branch hero: `"Hero image for {branch.name}"`
- Trust strip icons: descriptive string per icon
- No decorative-only images are present; all images carry semantic meaning

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

**Property Reflection:**
After reviewing all testable criteria identified in prework, the following consolidations were made:
- Requirements 5.3 and 6.6 both test NAP string consistency — combined into Property 9.
- Requirements 2.4 and 4.6 both test that coming-soon branch cards have disabled buttons — combined into Property 5.
- Requirements 2.5 and 4.2 both test active branch card rendering — Property 4 and Property 6 cover distinct aspects (active-link behavior vs. field completeness), so kept separate.
- Requirements 10.3 and 10.4 both test meta tags — combined into Property 14.
- Requirements 3.5 and 12.7 both test that only approved testimonials appear — covered by Property 8.

---

### Property 1: Branch slug validation rejects non-URL-safe strings

*For any* string, the `branchId` validator shall accept it if and only if it matches the pattern `^[a-z0-9]+(-[a-z0-9]+)*$` — accepting lowercase alphanumeric strings with internal hyphens and rejecting uppercase letters, leading/trailing hyphens, consecutive hyphens, spaces, or special characters.

**Validates: Requirements 1.8**

---

### Property 2: Branch schema field constraints hold after round-trip persistence

*For any* valid Branch object whose fields satisfy all specified constraints (field lengths, enum values, numeric ranges, array sizes), inserting it into MongoDB and fetching it back shall return a document where every field value is within its specified constraint.

**Validates: Requirements 1.1**

---

### Property 3: FoodMenu table renders all day/meal combinations with "–" for missing entries

*For any* subset of FoodMenu items (covering any combination of the 7 days × 3 meals), the FoodMenuTable component shall render a cell for every one of the 21 (day, meal) combinations; cells corresponding to absent menu items shall display exactly "–" and cells for present items shall display the item list.

**Validates: Requirements 3.4**

---

### Property 4: Active branch cards render an enabled anchor to the correct branch detail URL

*For any* Branch document with `status === "active"`, the branch card component shall render a single `<a>` element (not a `<button>`) whose `href` equals `/branch/{branchId}`.

**Validates: Requirements 2.5**

---

### Property 5: Coming-soon branch cards render a disabled button, not a navigable anchor

*For any* Branch document with `status === "coming-soon"`, the branch card component shall render the "View Details" control as a non-anchor element with a disabled or inert attribute, and it shall not produce any navigation when activated.

**Validates: Requirements 2.4, 4.6**

---

### Property 6: Locations page card list is sorted — active branches before coming-soon, each group alphabetically by name

*For any* list of Branch documents with mixed `status` values and arbitrary `name` strings, the Locations page shall render active-status branches before coming-soon-status branches; within each group the cards shall appear in case-insensitive ascending alphabetical order by `name`.

**Validates: Requirements 4.3**

---

### Property 7: Gallery tab filtering shows only items matching the selected category

*For any* collection of gallery items and any selected tab category, the GalleryTabs component shall render only gallery items whose `category` field equals the selected tab; if no items match, it shall render the placeholder message "No photos available for this category yet."

**Validates: Requirements 3.2**

---

### Property 8: Only approved testimonials appear on the branch detail page, at most 10, ordered by date descending

*For any* set of Testimonial documents (mix of `approved: true` and `approved: false`) linked to a branch, the TestimonialsSection component shall render only documents with `approved === true`, show at most 10 of them, and order them by `date` descending (newest first).

**Validates: Requirements 3.5, 12.7**

---

### Property 9: NAP string is identical across all three page contexts

*For any* rendering of the Home Page footer, the About Us page, and the Contact Us page, the extracted NAP string shall be byte-for-byte identical in all three locations: `"LN Boys PG & Hostel, Vidhani (JECRC), Jaipur, Rajasthan, +91 83858 57902"`.

**Validates: Requirements 5.3, 6.6**

---

### Property 10: Mobile number validation accepts only 10-digit numbers beginning with 6–9

*For any* string, the mobile number validator shall accept it if and only if it is exactly 10 characters, all digits, with the first character being one of '6', '7', '8', or '9'; any other string (wrong length, non-digit characters, or first digit 0–5) shall be rejected.

**Validates: Requirements 6.2, 9.2**

---

### Property 11: Preferred-date validation rejects past dates

*For any* date value, the preferred-date validator in the EnquiryForm shall accept dates that are today or in the future, and reject any date strictly before today's date (in the local timezone).

**Validates: Requirements 9.2**

---

### Property 12: Duplicate lead suppression within 30-minute window

*For any* lead submission where a Lead document with the same `mobile` and `branchId` already exists with `createdAt >= now - 30 minutes`, the `POST /api/leads` handler shall return HTTP 409 and shall not insert an additional document into the `leads` collection.

**Validates: Requirements 9.4**

---

### Property 13: Rate limiter allows at most 5 lead submissions per IP per 10-minute window

*For any* sequence of more than 5 `POST /api/leads` requests from the same IP address within a 10-minute sliding window, the first 5 requests shall receive HTTP 201 (or 400/409 depending on payload validity), and any subsequent request within that same window shall receive HTTP 429 with a `Retry-After` header whose value is a positive integer representing seconds until the window resets.

**Validates: Requirements 13.5**

---

### Property 14: Every public page render includes all required Open Graph and Twitter Card meta tags

*For any* public page rendered by the application, the resulting HTML `<head>` shall contain all five Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) and all four Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`), each with a non-empty content attribute.

**Validates: Requirements 10.3, 10.4**

---

### Property 15: Branch Detail Page title conforms to the specified pattern

*For any* active Branch document, the generated `<title>` tag on its detail page shall exactly match the pattern `"[Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel"` where `[Branch Name]` and `[City]` are sourced from the branch document.

**Validates: Requirements 10.1**

---

### Property 16: LodgingBusiness JSON-LD on Branch Detail Page contains all required fields matching the branch document

*For any* active Branch document, the JSON-LD script tag rendered on its detail page shall contain a `LodgingBusiness` object with `name`, `address.streetAddress`, `telephone`, `priceRange`, `aggregateRating.ratingValue`, `url`, and `image` fields whose values are consistent with the corresponding fields in the branch document.

**Validates: Requirements 10.2**

---

### Property 17: LocalBusiness JSON-LD on Home and Contact pages matches the branch document

*For any* rendering of the Home Page or Contact Us page, the `LocalBusiness` JSON-LD object shall have `name`, `address`, and `telephone` values that are identical to those stored in the corresponding Branch document.

**Validates: Requirements 10.9**

---

### Property 18: Every `<img>` element rendered on public pages has a non-empty alt attribute of at least 3 characters

*For any* public page render and any `<img>` element within that render, the `alt` attribute shall be present, non-empty, and at least 3 characters long.

**Validates: Requirements 10.7**

---

### Property 19: Gallery round-trip — uploaded item metadata is stored and retrievable with all fields intact

*For any* gallery upload where Cloudinary returns a success response, the stored Gallery document in MongoDB shall contain `url`, `publicId`, `resourceType`, `category`, `altText`, and `branchId` values that match the upload request parameters and Cloudinary response.

**Validates: Requirements 11.2, 11.3**

---

### Property 20: API response envelope is always present and well-formed

*For any* call to any `/api/` route handler (regardless of success or failure), the JSON response body shall be an object containing at minimum a boolean `success` field; on success it may include a `data` field; on failure it shall include a non-empty `error` string field; no other top-level structure is acceptable.

**Validates: Requirements 13.2**

---

### Property 21: API 400 response on invalid or missing required parameters

*For any* API endpoint, submitting a request with one or more required parameters missing or with values that fail Zod validation shall produce an HTTP 400 response whose envelope contains `success: false` and a descriptive `error` string that does not expose internal stack traces or implementation details.

**Validates: Requirements 13.3**

---

### Property 22: Policies are ordered by `order` field ascending within each branch group

*For any* set of Policy documents linked to a branch, the AccordionPolicies component shall render the policies in ascending order of the `order` field (lowest `order` value first); the Policies page shall additionally group policies by branch name in ascending alphabetical order.

**Validates: Requirements 3.6, 7.2**

---

### Property 23: Accordion exclusivity — at most one item per branch group is expanded at a time

*For any* sequence of user interactions (click events) on accordion items within a single branch policy group, the resulting DOM state shall have at most one accordion item in the expanded state; clicking an already-expanded item shall collapse it; clicking a collapsed item shall expand it and collapse any previously-expanded item in the same group.

**Validates: Requirements 7.4**

---

### Property 24: Blog pagination shows at most 10 posts per page

*For any* list of published posts, each page of the blog index shall display at most 10 posts; the total number of posts shown across all pages shall equal the count of posts where `published === true`.

**Validates: Requirements 8.1**

---

### Property 25: Blog post slug uniqueness — duplicate slugs are rejected at the database level

*For any* two Post documents where both have the same `slug` value, attempting to insert the second into the `posts` collection shall result in a MongoDB duplicate-key error (E11000), and only the first document shall remain in the collection.

**Validates: Requirements 8.3**

---

## Error Handling

### Client-Side Error Handling

| Scenario | Behavior |
|---|---|
| Form validation failure (client-side Zod) | Inline error adjacent to the field; no network request sent |
| Lead duplicate (HTTP 409) | Show "We already received your enquiry..." message; preserve form state |
| Network error or HTTP 5xx on form submit | Show "Something went wrong. Please try again." inline; preserve all field values |
| Rate limit (HTTP 429) | Show "Too many requests. Please try again in X minutes." with countdown |
| Cloudinary upload failure (admin) | Show error banner; retain file selection for retry |
| Admin session expired (HTTP 401 from API) | Redirect to `/admin/login`; no prior change applied |

### Server-Side Error Handling

```typescript
// Pattern used in all route handlers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    // ... business logic
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/leads]', err);    // full stack trace server-side
    return NextResponse.json(
      { success: false, error: 'Internal server error' },  // generic to client
      { status: 500 }
    );
  }
}
```

### HTTP Status Code Conventions

| Code | When used |
|---|---|
| 200 | Successful GET or PATCH |
| 201 | Successful POST (resource created) |
| 302 | Redirect (coming-soon branch → /locations) |
| 400 | Missing/invalid request parameters |
| 401 | Missing or expired admin session |
| 403 | CSRF token mismatch |
| 404 | Resource not found |
| 409 | Duplicate lead within 30-minute window |
| 413 | Request body > 1 MB |
| 422 | Business rule violation (e.g., duplicate branchId) |
| 429 | Rate limit exceeded |
| 500 | Unhandled server error |

### `not-found.tsx` and Error Pages

- `app/not-found.tsx` — renders a 404 page with full site navigation and a link back to the home page. No internal details or branch existence is leaked.
- `app/error.tsx` — catches React render errors; shows a generic "Something went wrong" message with a retry button.
- Admin 401/403 scenarios are handled by middleware redirect, not by a dedicated error page.

---

## Testing Strategy

### Overview

This feature uses a dual testing approach:

- **Unit / example-based tests** — specific scenarios, edge cases, error conditions, and component rendering checks.
- **Property-based tests** — universal properties verified across hundreds of randomly generated inputs. Implemented using **fast-check** (TypeScript-native PBT library).

### Property-Based Testing

**Library:** `fast-check` (version pinned to `^3.19.0`)

```bash
npm install --save-dev fast-check
```

Each property test uses a minimum of **100 runs** (fast-check default). Each test is tagged with a comment referencing its design property.

```typescript
// Example: Property 1 — Branch slug validator
import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { validateBranchId } from '@/lib/validations/branch';

describe('Branch slug validation', () => {
  // Feature: ln-boys-pg-hostel-website, Property 1: branchId validation rejects non-URL-safe strings
  it('accepts strings matching ^[a-z0-9]+(-[a-z0-9]+)*$', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z0-9]+(-[a-z0-9]+)*$/),
        (slug) => {
          expect(validateBranchId(slug).success).toBe(true);
        }
      ),
      { numRuns: 200 }
    );
  });

  it('rejects strings not matching the pattern', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)),
        (slug) => {
          expect(validateBranchId(slug).success).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
```

### Test File Organization

```
__tests__/
├── unit/
│   ├── validations/
│   │   ├── branch.property.test.ts     # Properties 1, 10, 11
│   │   └── lead.property.test.ts       # Properties 12, 21
│   ├── components/
│   │   ├── BranchCard.property.test.ts # Properties 4, 5
│   │   ├── GalleryTabs.property.test.ts# Property 7
│   │   ├── FoodMenuTable.property.test.ts # Property 3
│   │   ├── TestimonialsSection.property.test.ts # Property 8
│   │   ├── AccordionPolicies.property.test.ts   # Properties 22, 23
│   │   └── NAPString.property.test.ts  # Property 9
│   ├── api/
│   │   ├── leads.property.test.ts      # Properties 12, 13, 20, 21
│   │   └── envelope.property.test.ts   # Property 20
│   └── seo/
│       ├── metadata.property.test.ts   # Properties 14, 15, 16, 17
│       └── images.property.test.ts     # Property 18
├── integration/
│   ├── leads.integration.test.ts       # WhatsApp/email notification mocks (Req 9.5, 9.6)
│   ├── auth.integration.test.ts        # Login flow, session, CSRF (Req 12.3, 12.8)
│   ├── gallery.integration.test.ts     # Cloudinary mock + DB round-trip (Property 19)
│   └── db.integration.test.ts          # Schema round-trips (Property 2), slug uniqueness (Property 25)
└── e2e/
    └── enquiry-form.spec.ts            # Playwright: submit form, see success banner
```

### Unit Test Coverage Targets

| Area | Test Type | Key Scenarios |
|---|---|---|
| Zod validators | Property-based | All field constraints across generated inputs |
| BranchCard | Property-based | active vs. coming-soon rendering |
| FoodMenuTable | Property-based | Missing/present cells across all day-meal combos |
| GalleryTabs | Property-based | Category filtering for all 5 tab values |
| AccordionPolicies | Property-based | Sort order; exclusivity |
| NAP string | Property-based | Identical across three page renders |
| API envelope | Property-based | Every handler returns correct shape |
| SEO metadata | Property-based | Title pattern, OG/Twitter tags, JSON-LD |
| Lead dedup | Property-based | 30-minute window logic |
| Rate limiter | Property-based | 5-request window |

### Integration Test Coverage

| Area | Test Type | Mocking |
|---|---|---|
| WhatsApp notification | Integration | Mock `fetch` (WhatsApp API) |
| Email fallback | Integration | Mock Nodemailer transport |
| Admin auth flow | Integration | Real bcrypt, mocked iron-session cookie |
| CSRF protection | Integration | Real double-submit cookie |
| Cloudinary upload | Integration | Mock `cloudinary.uploader.upload` |
| MongoDB schema constraints | Integration | In-memory MongoDB (`mongodb-memory-server`) |

### Performance & Accessibility (Manual / CI Checks)

- **Lighthouse CI** runs on every PR via GitHub Actions; fails PR if Performance < 90 or SEO < 100.
- **axe-core** integrated into Playwright tests for automated accessibility scanning.
- **Responsive layout** tested manually at 320, 375, 768, 1024, 1280, 1920 px.

### Test Runner Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',         // for component tests
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
});
```
