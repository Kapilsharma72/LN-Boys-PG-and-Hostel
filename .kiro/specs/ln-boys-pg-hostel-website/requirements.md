# Requirements Document

## Introduction

LN Boys PG & Hostel is a paying-guest and hostel accommodation brand operating across multiple branches in Jaipur, Rajasthan. This document defines the requirements for a full-stack, SEO-optimized website that functions as the brand's primary digital presence — letting students and working professionals discover branches, browse room types, pricing, amenities, and food menus, and then directly contact or book a visit with the hostel. The site is modelled after platforms like Stanza Living but purpose-built for the LN brand. All content is database-driven (MongoDB), media is stored in Cloudinary, and the frontend is built with Next.js + Tailwind CSS for maximum SEO performance.

---

## Glossary

- **Website**: The full-stack Next.js web application described in this document.
- **Branch**: A physical LN Boys PG & Hostel location (up to 3 branches, 1 active and 2 coming-soon at launch).
- **Visitor**: An unauthenticated user browsing the Website.
- **Lead**: A submitted enquiry record containing a Visitor's contact details and intent (visit or reservation).
- **Admin**: An authenticated operator who manages Website content through the Admin Panel.
- **Admin_Panel**: The password-protected management interface at `/admin`.
- **Enquiry_Form**: The "Schedule a Visit / Reserve Now" form available on branch detail pages and the home page.
- **Lead_Notification**: An instant message sent to the hostel owner via WhatsApp Business API (or email/Telegram fallback) when a Lead is created.
- **Auto_Reply**: An automated confirmation message sent to the Visitor after a Lead is submitted.
- **Gallery**: A collection of images and videos associated with a Branch, stored in Cloudinary with metadata in MongoDB.
- **Amenity**: A service or facility offered at a Branch (e.g., Wi-Fi, CCTV, Geyser).
- **Room**: A room configuration at a Branch, characterised by occupancy type and pricing.
- **Food_Menu**: A weekly or daily meal plan associated with a Branch.
- **Testimonial**: A user review associated with a Branch.
- **Policy**: A house rule or policy document associated with a Branch.
- **Landmark**: A nearby point of interest (college, hospital, bus stop) associated with a Branch.
- **Sitemap**: The auto-generated `sitemap.xml` file used by search engine crawlers.
- **Structured_Data**: Schema.org JSON-LD markup embedded in branch pages for rich search results.
- **NAP**: Name, Address, Phone — the consistent contact information used across all pages for local SEO.
- **SSR**: Server-Side Rendering — HTML generated per request on the server.
- **SSG**: Static Site Generation — HTML pre-built at deploy time.
- **ISR**: Incremental Static Regeneration — SSG pages that revalidate on a defined interval.

---

## Requirements

### Requirement 1: Branch Data Management

**User Story:** As an Admin, I want to create and update branch records in MongoDB, so that all branch information displayed on the Website stays accurate without requiring code changes.

#### Acceptance Criteria

1. THE Website SHALL store each Branch as a document in the `branches` MongoDB collection with fields: `branchId` (unique slug, 3–80 characters), `name` (1–120 characters), `address` (1–300 characters), `city` (1–60 characters), `state` (1–60 characters), `pincode` (exactly 6 digits), `phone` (array, 1–5 entries), `whatsapp` (1 entry), `startingPrice` (numeric, 0.01–999999.99), `rating` (numeric, 0.0–5.0), `status` (`active` | `coming-soon`), `occupancyTypes` (array, 1–10 entries), `latitude` (numeric or null), `longitude` (numeric or null), `metaTitle` (1–70 characters or null), `metaDescription` (1–160 characters or null), `createdAt`, `updatedAt`.
2. THE Website SHALL store each Room as a document in the `rooms` collection linked to a Branch via `branchId`, with fields: `occupancyType` (`Single` | `Double` | `Triple`), `pricePerMonth` (numeric, 0.01–999999.99), `amenities` (array of Amenity IDs, 0–30 entries), `description` (0–500 characters), `available` (boolean).
3. THE Website SHALL store each Amenity as a document in the `amenities` collection with fields: `branchId`, `name` (1–100 characters), `icon` (1–100 characters), `category` (`basic` | `safety` | `comfort` | `food`).
4. THE Website SHALL store each Food_Menu item as a document in the `foodMenu` collection linked to a Branch via `branchId`, with fields: `day` (`Monday` | `Tuesday` | `Wednesday` | `Thursday` | `Friday` | `Saturday` | `Sunday`), `meal` (`breakfast` | `lunch` | `dinner`), `items` (array of strings, 1–20 entries, each 1–100 characters).
5. THE Website SHALL store each Testimonial as a document in the `testimonials` collection linked to a Branch via `branchId`, with fields: `authorName` (1–80 characters), `rating` (integer, 1–5), `text` (1–1000 characters), `date` (ISO 8601 date), `approved` (boolean).
6. THE Website SHALL store each Policy as a document in the `policies` collection linked to a Branch via `branchId`, with fields: `title` (1–120 characters), `body` (1–5000 characters), `order` (non-negative integer).
7. THE Website SHALL store each Landmark as a document in a `landmarks` collection linked to a Branch via `branchId`, with fields: `name` (1–120 characters), `category` (`college` | `hospital` | `transport` | `other`), `distanceMetres` (non-negative integer), `googleMapsUrl` (valid URL string, 1–500 characters).
8. WHEN a Branch document is created or updated via the Admin_Panel, THE Website SHALL validate that `branchId` is unique and URL-safe (lowercase alphanumeric with hyphens only, matching the pattern `^[a-z0-9]+(-[a-z0-9]+)*$`).
9. IF a required field (`name`, `address`, `phone`, `status`) is missing or empty when saving a Branch, THEN THE Admin_Panel SHALL display a field-level validation error adjacent to the invalid field and reject the save operation without submitting data to the server.
10. IF a server-side constraint prevents saving a Branch (e.g., duplicate `branchId`, database write failure), THEN THE Website API SHALL return an HTTP 422 response and THE Admin_Panel SHALL display the error message returned in the response body without clearing other field values.
11. IF a required field (`occupancyType`, `pricePerMonth` for Room; `name`, `category` for Amenity; `day`, `meal`, `items` for Food_Menu) is missing or empty when saving a child record, THEN THE Admin_Panel SHALL display a field-level validation error and reject the save operation.

---

### Requirement 2: Public Home Page

**User Story:** As a Visitor, I want to land on a visually compelling home page, so that I can immediately understand what LN Boys PG & Hostel offers and explore available branches.

#### Acceptance Criteria

1. THE Website SHALL render the Home Page at the `/` route using SSG with ISR revalidation of 3600 seconds.
2. THE Website SHALL display a full-width hero banner on the Home Page containing the brand name "LN Boys PG & Hostel", the tagline "PG & Accommodation", and a primary call-to-action button labelled "Explore Branches".
3. THE Website SHALL display a Branch card for each Branch document in the `branches` collection on the Home Page, showing branch name, starting price in INR/month, rating out of 5, city, status badge, and a "View Details" link.
4. WHEN a Branch has `status` equal to `coming-soon`, THE Website SHALL render the Branch card with a "Coming Soon" badge, render the "View Details" control as a visually disabled button (not an `<a>` tag), and prevent navigation when that button is clicked.
5. IF a Branch has `status` equal to `active`, THEN THE Website SHALL render the "View Details" link as a fully enabled `<a>` tag navigating to `/branch/[branchId]`.
6. THE Website SHALL display a trust strip on the Home Page listing exactly these four trust signals: "3 Meals/Day", "24×7 CCTV Security", "High-Speed Wi-Fi", and "Starting ₹8,000/month", each accompanied by an icon.
7. THE Website SHALL render a sticky WhatsApp floating button on every public page (all routes outside `/admin`) linking to `https://wa.me/918385857902?text=Hi%2C%20I%20want%20to%20know%20more%20about%20LN%20Boys%20PG`.
8. THE Website SHALL apply the brand color palette: deep navy blue (`#0B0B3B`) as page background, gold/yellow (`#F5C518`) as accent color for CTAs and highlights, and white (`#FFFFFF`) as primary text color across all public pages.
9. THE Website SHALL produce no horizontal scrollbar on any viewport width between 320 px and 1920 px inclusive, verified by rendering the page at each breakpoint (320, 375, 768, 1024, 1280, 1920 px wide).
10. WHEN the `branches` collection contains zero documents, THE Website SHALL display the hero banner and trust strip on the Home Page and replace the branch cards section with a message: "Branches coming soon — check back shortly."

---

### Requirement 3: Branch Detail Page

**User Story:** As a Visitor, I want to view a dedicated page for each branch, so that I can explore photos, room types, amenities, food, reviews, and policies before deciding to enquire.

#### Acceptance Criteria

1. THE Website SHALL render a Branch Detail Page at the route `/branch/[branchId]` for each Branch with `status` equal to `active`, using SSR with ISR revalidation of 3600 seconds.
2. THE Website SHALL display a Gallery section on the Branch Detail Page with category tabs: All, Rooms, Common Area, Food, Exterior — each tab filtering Gallery items from the `gallery` collection by `category`; WHEN a selected category tab contains zero Gallery items, THE Website SHALL display the message "No photos available for this category yet." within that tab.
3. THE Website SHALL display an information tab bar on the Branch Detail Page with tabs labelled "Occupancy & Pricing", "Amenities", and "Details"; THE Website SHALL render "Occupancy & Pricing" as the default active tab on initial page load.
4. THE Website SHALL display a Food Menu table on the Branch Detail Page showing breakfast, lunch, and dinner rows for each day of the week (Monday through Sunday) sourced from the `foodMenu` collection; WHERE a meal entry is absent for a given day, THE Website SHALL render "–" in that cell.
5. THE Website SHALL display a Testimonials section on the Branch Detail Page showing at most 10 Testimonial documents with `approved` equal to `true`, ordered by `date` descending; WHEN zero approved Testimonials exist, THE Website SHALL display the message "Be the first to share your experience."
6. THE Website SHALL display a Policies section on the Branch Detail Page rendering each Policy document as an accordion item ordered by the `order` field; WHEN zero Policy documents are linked to the Branch, THE Website SHALL display the message "House rules coming soon."
7. THE Website SHALL display an "Around This Place" section on the Branch Detail Page listing Landmark documents linked to the Branch, grouped by `category`, with a "Get Directions" deep-link using the `googleMapsUrl` field; WHEN zero Landmarks are linked to the Branch, THE Website SHALL display the message "Nearby places information coming soon."
8. THE Website SHALL display a sticky sidebar Enquiry_Form on the Branch Detail Page on desktop viewports (>1024 px wide), and an inline Enquiry_Form below the Policies section on mobile and tablet viewports (≤1024 px wide).
9. WHEN a Visitor navigates to `/branch/[branchId]` for a `coming-soon` Branch, THE Website SHALL redirect the Visitor to `/locations` with an HTTP 302 status.
10. WHEN a Visitor navigates to `/branch/[branchId]` for a non-existent `branchId`, THE Website SHALL return an HTTP 404 response and render the 404 error page.

---

### Requirement 4: All Branches / Locations Page

**User Story:** As a Visitor, I want to see all branches listed in one place, so that I can compare options and choose the most convenient location.

#### Acceptance Criteria

1. THE Website SHALL render the All Branches page at the `/locations` route using SSG with ISR revalidation of 3600 seconds.
2. THE Website SHALL display a card for every Branch document in the `branches` collection on the All Branches page, showing branch name, address, starting price in INR/month, occupancy types, rating as a value out of 5, and status displayed as "Active" or "Coming Soon".
3. THE Website SHALL display active branches before coming-soon branches on the All Branches page; within each group, branches SHALL be sorted alphabetically by `name` (A–Z).
4. WHEN a Visitor clicks "View Details" on an active Branch card, THE Website SHALL navigate the Visitor to `/branch/[branchId]`.
5. WHEN the `branches` collection contains zero documents, THE Website SHALL display the message "No branches found. Check back soon!" instead of the branch card list.
6. THE Website SHALL render the "View Details" control on a coming-soon Branch card as a visually disabled button that does not navigate when activated.

---

### Requirement 5: About Us Page

**User Story:** As a Visitor, I want to learn about the brand story and values, so that I can decide whether LN Boys PG & Hostel is a trustworthy place to stay.

#### Acceptance Criteria

1. THE Website SHALL render an About Us page at the `/about` route.
2. THE Website SHALL display the brand story, founding year, mission statement, and contact information (NAP) on the About Us page.
3. THE Website SHALL display the NAP string "LN Boys PG & Hostel, Vidhani (JECRC), Jaipur, Rajasthan, +91 83858 57902" as a textually identical string across the About Us page, the Home Page footer, and the Contact Us page — any difference in spelling, punctuation, or formatting between these three locations constitutes a failure.

---

### Requirement 6: Contact Us Page

**User Story:** As a Visitor, I want a dedicated contact page, so that I can find phone numbers, addresses, and a contact form quickly.

#### Acceptance Criteria

1. THE Website SHALL render a Contact Us page at the `/contact` route.
2. THE Website SHALL display a contact form on the Contact Us page with fields: Name (required, 1–100 characters), Mobile (required, exactly 10 digits, first digit must be 6, 7, 8, or 9), Branch of interest (optional dropdown listing all `active` branches by name), and Message (optional, 0–500 characters).
3. WHEN a Visitor submits the Contact Us form with all required fields valid, THE Website SHALL save the submission to the `leads` collection and display a success confirmation message inline on the form without navigating away from the page.
4. IF the form submission fails due to a network or database error, THEN THE Website SHALL display an inline error message on the form reading "Something went wrong. Please try again." and preserve all field values so the Visitor does not need to re-enter data.
5. WHEN a field value becomes invalid (on blur for text inputs, on change for the dropdown), THE Website SHALL display an inline validation error adjacent to that field without clearing any other field's value.
6. THE Website SHALL display the NAP string "LN Boys PG & Hostel, Vidhani (JECRC), Jaipur, Rajasthan, +91 83858 57902" on the Contact Us page as a textually identical string to the one shown on the About Us page and the Home Page footer (per Requirement 5 Criterion 3).
7. THE Website SHALL display a Google Maps embed on the Contact Us page showing the location of the confirmed active branch (branchId: "ln-vidhani-jecrc"); IF more than one active branch exists, THE Website SHALL display a separate map embed for each active branch, each labeled with the branch name.

---

### Requirement 7: Policies & House Rules Page

**User Story:** As a Visitor, I want to read all policies and house rules, so that I know what is expected of me before committing to a stay.

#### Acceptance Criteria

1. THE Website SHALL render a Policies & House Rules page at the `/policies` route.
2. THE Website SHALL display all Policy documents from the `policies` collection, grouped by Branch and sorted alphabetically by Branch `name` (A–Z), as accordion items on the Policies page; within each Branch group, policies SHALL be ordered by the `order` field ascending.
3. WHEN no Policy documents exist for a Branch, THE Website SHALL display an accordion section for that Branch containing placeholder text "Policies coming soon for this branch."
4. WHEN a Visitor clicks an accordion item header, THE Website SHALL toggle the policy body between expanded (visible) and collapsed (hidden) states; only one accordion item per Branch group SHALL be expanded at a time.

---

### Requirement 8: Blog / Local Guide Page

**User Story:** As a Visitor searching for PGs near specific landmarks, I want to find location-specific blog articles, so that I can discover LN Boys PG through organic search.

#### Acceptance Criteria

1. THE Website SHALL render a Blog index page at the `/blog` route listing all published blog posts (where `published` equals `true`) with title, excerpt, published date, and slug; THE Website SHALL paginate the listing at 10 posts per page and display pagination controls when more than 10 published posts exist.
2. THE Website SHALL render individual blog post pages at `/blog/[slug]` with the post's full Markdown content rendered as sanitized HTML, published date, and author name.
3. THE Website SHALL store blog posts in a `posts` MongoDB collection with fields: `slug` (unique, 3–100 URL-safe characters), `title` (1–120 characters), `excerpt` (1–300 characters), `content` (Markdown string, 1–100000 characters), `author` (1–80 characters), `publishedAt` (ISO 8601 date), `tags` (array of strings, 0–10 entries), `metaTitle` (1–70 characters), `metaDescription` (1–160 characters), `published` (boolean); THE Website SHALL enforce `slug` uniqueness at the database level via a unique index.
4. WHEN a Visitor navigates to `/blog/[slug]` for an unpublished post (`published` equals `false`) or for a non-existent slug, THE Website SHALL return an HTTP 404 status and render a 404 error page that retains full site navigation, without exposing any post content or the post's existence.
5. THE Website SHALL render each blog post page with a unique `<title>` tag sourced from the post's `metaTitle` field and a `<meta name="description">` tag sourced from the post's `metaDescription` field.

---

### Requirement 9: Enquiry Form and Lead Management

**User Story:** As a Visitor, I want to submit a "Schedule a Visit" or "Reserve Now" request, so that the hostel owner can follow up with me quickly.

#### Acceptance Criteria

1. THE Enquiry_Form SHALL provide a toggle between two modes: "Schedule a Visit" and "Reserve Now".
2. THE Enquiry_Form SHALL collect the following fields: Name (required, 1–100 characters), Mobile (required, exactly 10 digits, first digit must be 6–9, non-numeric characters rejected on input), preferred date (required only in "Schedule a Visit" mode, must be today or a future date), WhatsApp opt-in checkbox (default unchecked), and Terms & Conditions acceptance checkbox (default unchecked).
3. WHEN a Visitor submits the Enquiry_Form with all required fields valid, THE Website SHALL save a Lead document to the `leads` MongoDB collection with fields: `name`, `mobile`, `preferredDate`, `whatsappOptIn`, `intent` (`visit` | `reserve`), `branchId`, `source` (`enquiry-form` | `contact-form`), `status` (`new`), `createdAt`; AFTER a successful save, THE Website SHALL reset all Enquiry_Form fields to their default empty/unchecked state and display a success message.
4. IF a Lead with the same `mobile` and `branchId` was created within the previous 30 minutes, THEN THE Website SHALL not save a duplicate Lead and SHALL display the message "We already received your enquiry. Our team will contact you shortly." to the Visitor.
5. WHEN a Lead is saved, THE Website SHALL dispatch a Lead_Notification to the owner's WhatsApp number `+91 83858 57902` using the WhatsApp Business API; IF the WhatsApp API returns a non-success response or is unreachable, THEN THE Website SHALL fall back to sending an email notification to the configured owner email address.
6. WHEN a Lead is saved and `whatsappOptIn` is `true`, THE Website SHALL send an Auto_Reply WhatsApp message to the Visitor's mobile number containing the branch name and the text "We'll contact you within 2 hours."
7. WHEN a Visitor submits the Enquiry_Form without accepting the Terms & Conditions checkbox, THE Website SHALL display a validation error adjacent to the checkbox and prevent form submission.
8. IF the Lead save operation fails due to a database or network error, THEN THE Website SHALL display an inline error message "Something went wrong. Please try again." and log the full error server-side without exposing stack traces to the client.
9. THE Enquiry_Form SHALL disable the submit button and display a loading spinner while the submission HTTP request is in flight.

---

### Requirement 10: SEO and Structured Data

**User Story:** As the hostel owner, I want the website to rank highly in local search results, so that prospective residents can find LN Boys PG & Hostel when searching for PGs near JECRC or Vidhani Jaipur.

#### Acceptance Criteria

1. THE Website SHALL generate a unique `<title>` tag for each Branch Detail Page using the pattern: `[Branch Name] | Best Boys PG near [Landmark], [City] | LN Boys PG & Hostel`.
2. THE Website SHALL embed a `LodgingBusiness` Schema.org JSON-LD block in the `<head>` of each Branch Detail Page containing at minimum: `name`, `address` (PostalAddress), `telephone`, `priceRange`, `aggregateRating`, `url`, and `image`.
3. THE Website SHALL include Open Graph meta tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`) on every public page.
4. THE Website SHALL include Twitter Card meta tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`) on every public page.
5. THE Website SHALL auto-generate a `sitemap.xml` at `/sitemap.xml` using `next-sitemap`, listing: all Branch Detail Pages where `status` equals `active`, all static public pages, and all blog posts where `published` equals `true`; each entry SHALL include `lastmod` and `changefreq` values.
6. THE Website SHALL serve a `robots.txt` at `/robots.txt` permitting crawling of all public pages and disallowing crawling of `/admin` and `/api`.
7. THE Website SHALL include an `alt` attribute on every `<img>` element across all public pages; the `alt` value SHALL be a non-empty string of at least 3 characters.
8. WHEN a page is rendered in production, THE Website SHALL achieve a Lighthouse Performance score of 90 or above and a Lighthouse SEO score of 100, measured on a mobile device profile using the PageSpeed Insights API.
9. THE Website SHALL include `LocalBusiness` JSON-LD structured data on the Home Page and Contact Us page where the `name`, `address`, and `telephone` field values are identical to those stored in the corresponding Branch document in the `branches` collection.

---

### Requirement 11: Gallery Media Management

**User Story:** As an Admin, I want to upload images and videos for each branch, so that Visitors see real, high-quality media that builds trust.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide an upload interface for Gallery items per Branch, accepting JPEG, PNG, WebP, and MP4 files up to 50 MB each.
2. WHEN an Admin uploads a Gallery item, THE Website SHALL upload the file to Cloudinary and store the returned URL, `publicId`, `resourceType` (`image` | `video`), `category` (one of: `room`, `common-area`, `food`, `exterior`, `event`), `altText` (1–200 characters), `branchId`, and `uploadedAt` in the `gallery` MongoDB collection.
3. THE Website SHALL serve all Gallery images using the Next.js `<Image>` component with `width`, `height`, and `alt` attributes populated from the `gallery` collection.
4. WHEN a Visitor views the Gallery section on a Branch Detail Page, THE Website SHALL render all `<img>` elements for Gallery images that are outside the initial viewport with the `loading="lazy"` attribute.
5. IF a Cloudinary upload returns a non-success HTTP status or a network error occurs, THEN THE Admin_Panel SHALL display an error message and retain the file selection so the Admin can retry without re-selecting the file; IF displaying the error message itself fails, THEN THE Admin_Panel SHALL clear the file selection.

---

### Requirement 12: Admin Panel

**User Story:** As an Admin, I want a secure, password-protected management panel, so that I can update content, manage leads, and upload media without touching code.

#### Acceptance Criteria

1. THE Admin_Panel SHALL be accessible only at routes prefixed with `/admin`.
2. WHEN an unauthenticated user navigates to any `/admin` route, THE Website SHALL redirect the user to `/admin/login`.
3. THE Admin_Panel SHALL authenticate the Admin using a username and bcrypt-hashed password stored as environment variables; session state SHALL be maintained via a signed HTTP-only cookie with a 24-hour expiry.
4. THE Admin_Panel SHALL provide CRUD (Create, Read, Update, Delete) interfaces for: Branch details, Room types and pricing, Amenities, Food Menu items, Testimonials, Policies, Gallery items, Blog posts, and Landmarks.
5. THE Admin_Panel SHALL display a Leads dashboard at `/admin/leads` listing all Lead documents with columns: Name, Mobile, Intent, Branch, Status, Created Date, and WhatsApp opt-in flag.
6. WHEN an Admin updates a Lead's `status` field from the Leads dashboard, THE Website SHALL persist the change to MongoDB immediately; IF the Admin's session has expired before the update request is sent, THE Website SHALL redirect the Admin to `/admin/login` and, after successful re-authentication, display the Leads dashboard without the prior update applied, requiring the Admin to manually re-submit the status change.
7. THE Admin_Panel SHALL allow the Admin to approve or reject Testimonials; WHEN a Testimonial is rejected (`approved` set to `false`), THE Website SHALL exclude it from the Branch Detail Page testimonials section.
8. THE Admin_Panel SHALL implement CSRF protection on all state-mutating API routes (POST, PATCH, PUT, DELETE).
9. IF an Admin session cookie is absent, expired, or has been tampered with (invalid signature), THEN THE Website SHALL redirect the Admin to `/admin/login` on the next request to any `/admin` route.

---

### Requirement 13: API Layer

**User Story:** As a developer, I want a clean, documented API layer, so that the frontend and Admin Panel can fetch and mutate data reliably.

#### Acceptance Criteria

1. THE Website SHALL expose all data-fetching operations via HTTP GET Route Handlers and all create operations via HTTP POST Route Handlers and all update operations via HTTP PATCH Route Handlers under the `/api` path prefix using the Next.js App Router.
2. THE Website SHALL return all API responses in JSON format with a consistent envelope: `{ success: boolean, data?: any, error?: string }`.
3. WHEN an API route receives a request with an invalid or missing required parameter, THE Website SHALL return an HTTP 400 response; WHERE a descriptive error message can be generated without exposing internal implementation details, THE Website SHALL include it in the `error` field of the response envelope.
4. WHEN an API route encounters an unhandled server error, THE Website SHALL return an HTTP 500 response with the generic `error` message "Internal server error" and log the full error (including stack trace) server-side without including any stack trace or internal detail in the client response.
5. THE Website SHALL rate-limit the Lead submission endpoint (`POST /api/leads`) to a maximum of 5 requests per IP address per 10-minute sliding window; IF the limit is exceeded, THEN THE Website SHALL return an HTTP 429 response with a `Retry-After` header indicating the number of seconds until the window resets.
6. THE Website SHALL reject any API request body larger than 1 MB with an HTTP 413 response.

---

### Requirement 14: Performance and Accessibility

**User Story:** As a Visitor on a mobile device with a slow connection, I want the website to load quickly and be easy to navigate, so that I don't abandon the page before finding what I need.

#### Acceptance Criteria

1. THE Website SHALL use Next.js `<Image>` with automatic format selection (WebP/AVIF) and responsive `srcSet` for all gallery and hero images.
2. THE Website SHALL load web fonts using `next/font` with `display: swap` to prevent invisible text during font load.
3. THE Website SHALL implement keyboard navigation conforming to WCAG 2.1 AA for all interactive elements (buttons, links, form inputs, tab panels, accordion items); each focused element SHALL display a visible focus indicator consisting of at least a 2 px solid outline with a contrast ratio of at least 3:1 against the adjacent background color.
4. THE Website SHALL provide ARIA labels on all icon-only buttons and all form inputs that lack a visible `<label>` element.
5. THE Website SHALL achieve a WCAG 2.1 AA color contrast ratio of at least 4.5:1 for all body text (font size below 18 pt or below 14 pt bold) and at least 3:1 for all large text (18 pt or above, or 14 pt bold or above) against their respective backgrounds across the brand color palette.
6. WHEN the Visitor's browser does not support JavaScript, THE Website SHALL render all public page content (branch details, gallery thumbnails, food menu, policies) using server-rendered HTML without requiring client-side JavaScript.
7. WHEN a Visitor has enabled the `prefers-reduced-motion` media feature in their OS or browser, THE Website SHALL disable or replace all CSS transitions and JavaScript-driven animations on public pages with instant state changes.

---

### Requirement 15: Seed Data and Placeholder Content

**User Story:** As a developer, I want the database seeded with the confirmed Branch 1 data and placeholder data for Branches 2 and 3, so that the website is functional and demonstrable from day one.

#### Acceptance Criteria

1. THE Website SHALL include an idempotent seed script that checks for an existing document with `branchId: "ln-vidhani-jecrc"` before inserting; IF the document already exists, THE seed script SHALL skip insertion and exit without error; IF the document does not exist, THE seed script SHALL insert the following record and confirm the write was acknowledged by MongoDB: `branchId: "ln-vidhani-jecrc"`, `name: "LN Boys PG & Hostel - Vidhani (JECRC)"`, `address: "In front of Audi Service Centre, Vidhani, Near JECRC, Jaipur, Rajasthan, 302022"`, `phone: ["+91 83858 57902", "+91 70146 88874"]`, `whatsapp: "+91 83858 57902"`, `startingPrice: 8000`, `rating: 4.5`, `status: "active"`, `occupancyTypes: ["Double Sharing", "Triple Sharing"]`.
2. THE seed script SHALL validate the MongoDB connection (receive a successful ping response) before attempting any insert operations; IF the connection fails, THE seed script SHALL exit with a non-zero exit code and print an error message.
3. THE Website SHALL include a seed script that inserts two placeholder Branch records with `status: "coming-soon"` and all non-mandatory fields set to `null` or a `"TODO"` placeholder string; the script SHALL be idempotent (skip if already seeded by checking `branchId`).
4. THE Website SHALL include placeholder Food_Menu data for Branch 1 consisting of 21 documents (3 meals × 7 days), covering Monday through Sunday for breakfast, lunch, and dinner, using a representative Indian vegetarian thali-style menu with at least 3 items per meal.
5. THE Website SHALL include at least 5 placeholder Testimonial documents for Branch 1 with `approved: true` and distinct realistic sample text of at least 30 characters each.
6. THE Website SHALL include placeholder Policy documents for Branch 1 covering exactly these 5 topics: Check-in/Check-out times, Guest policy, Noise policy, Rent payment terms, and ID requirements; each policy `body` SHALL be at least 50 characters of placeholder text.
