/**
 * Static branch data — hardcoded so pages work without a DB connection.
 * Update these values directly when details change.
 *
 * Real GPS coordinates (from Google Maps):
 *  PG-I  (Main Office) : 26.775711, 75.870879  — Vidhani, Near JECRC University
 *  PG-II               : 26.7759546, 75.8688499 — Tuwariyan Ki Dhani, Ramchandpura
 *  PG-III (LN Boys PG 2): 26.7604402, 75.8671524 — Sitapura/Rampura, Kanwarpura
 */

export interface GalleryMedia {
  url: string;
  publicId: string;
  resourceType: 'image' | 'video';
  altText: string;
  category: 'room' | 'common-area' | 'food' | 'exterior' | 'event';
}

export interface RoomOption {
  type: 'Double' | 'Triple';
  variant: 'AC' | 'Cooler' | 'Non-AC';
  pricePerMonth: number;
  available: boolean;
}

export interface AmenityItem {
  name: string;
  icon: string;
  category: 'basic' | 'safety' | 'comfort' | 'food';
}

export interface PolicyItem {
  title: string;
  body: string;
  order: number;
}

export interface LandmarkItem {
  name: string;
  category: 'college' | 'hospital' | 'transport' | 'other';
  distanceMetres: number;
  googleMapsUrl: string;
}

export interface FoodMenuItem {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  meal: 'breakfast' | 'lunch' | 'dinner';
  items: string[];
}

export interface BranchData {
  branchId: string;
  pgNumber: 'I' | 'II' | 'III';
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  whatsapp: string;
  startingPrice: number;
  rating: number;
  status: 'active' | 'coming-soon';
  /** Direct Google Maps share link for "Get Directions" CTA */
  googleMapsUrl: string;
  /** Lat/lng for accurate embed */
  lat: number;
  lng: number;
  mapEmbedUrl: string;
  gallery: GalleryMedia[];
  rooms: RoomOption[];
  amenities: AmenityItem[];
  policies: PolicyItem[];
  landmarks: LandmarkItem[];
  foodMenu: FoodMenuItem[];
}

// ---------------------------------------------------------------------------
// Shared amenities (same for all active PGs)
// ---------------------------------------------------------------------------
const COMMON_AMENITIES: AmenityItem[] = [
  { name: 'High-Speed Wi-Fi', icon: '📶', category: 'basic' },
  { name: 'Power Backup', icon: '⚡', category: 'basic' },
  { name: 'RO Purified Water', icon: '💧', category: 'basic' },
  { name: '24×7 CCTV Security', icon: '📷', category: 'safety' },
  { name: 'Security Guard', icon: '💂', category: 'safety' },
  { name: 'Geyser / Hot Water', icon: '🚿', category: 'comfort' },
  { name: 'Study Table & Chair', icon: '📚', category: 'comfort' },
  { name: 'Almirah / Wardrobe', icon: '🗄️', category: 'comfort' },
  { name: 'Attached Washroom', icon: '🚽', category: 'comfort' },
  { name: '3 Meals / Day', icon: '🍽️', category: 'food' },
  { name: 'Laundry Service', icon: '👕', category: 'comfort' },
  { name: 'Free Electric Auto to JECRC', icon: '🛺', category: 'comfort' },
];

// ---------------------------------------------------------------------------
// Shared policies
// ---------------------------------------------------------------------------
const COMMON_POLICIES: PolicyItem[] = [
  {
    title: 'Room Allotment',
    body: 'Students must stay in their allotted rooms only. Switching rooms without prior permission from the Warden is strictly not allowed.',
    order: 1,
  },
  {
    title: 'Anti-Ragging & Discipline',
    body: 'Any physical or mental harassment including ragging, quarrelling, abusive language, or violent behavior is strictly prohibited and will result in immediate expulsion.',
    order: 2,
  },
  {
    title: 'Prohibited Items',
    body: 'Smoking, chewing gutkha, and consumption of alcohol or any intoxicants is strictly prohibited inside hostel premises.',
    order: 3,
  },
  {
    title: 'Silence & Study Hours',
    body: 'The hostel is meant for studies. Silence must be maintained. Students must not disturb others by conducting parties, playing loud music, or talking loudly on mobile phones.',
    order: 4,
  },
  {
    title: 'Meal Schedule',
    body: 'Students must be present for breakfast, lunch, and dinner as per the scheduled timings. Food must be consumed in the mess only — carrying food to rooms is not permitted.',
    order: 5,
  },
  {
    title: 'Fee Payment',
    body: 'Monthly rent is due by the 5th of each month. A late fee of ₹100 per day will be charged after the due date. Fee must be paid in full — no partial payments accepted.',
    order: 6,
  },
  {
    title: 'Security Deposit',
    body: '2 months security deposit and 1 month advance rent is collected at the time of admission. The deposit is returned at the end of stay after deducting any damages.',
    order: 7,
  },
  {
    title: 'ID & Admission Requirements',
    body: 'Students and parents must bring a valid government-issued photo ID (Voter ID, Aadhaar Card, PAN Card, Passport, or D.L.) at the time of admission. Two passport-size photographs are also required.',
    order: 8,
  },
];

// ---------------------------------------------------------------------------
// Shared food menu (Indian vegetarian, 7 days × 3 meals)
// ---------------------------------------------------------------------------
const COMMON_FOOD_MENU: FoodMenuItem[] = [
  { day: 'Monday', meal: 'breakfast', items: ['Poha', 'Masala Chai', 'Banana'] },
  { day: 'Monday', meal: 'lunch', items: ['Dal Tadka', 'Steamed Rice', 'Phulka Roti', 'Aloo Sabzi', 'Salad'] },
  { day: 'Monday', meal: 'dinner', items: ['Phulka Roti', 'Dal Makhani', 'Steamed Rice', 'Bhindi Masala'] },
  { day: 'Tuesday', meal: 'breakfast', items: ['Upma', 'Masala Chai', 'Seasonal Fruit'] },
  { day: 'Tuesday', meal: 'lunch', items: ['Rajma Curry', 'Jeera Rice', 'Phulka Roti', 'Raita'] },
  { day: 'Tuesday', meal: 'dinner', items: ['Phulka Roti', 'Chana Masala', 'Steamed Rice', 'Salad'] },
  { day: 'Wednesday', meal: 'breakfast', items: ['Aloo Paratha', 'Curd', 'Masala Chai'] },
  { day: 'Wednesday', meal: 'lunch', items: ['Moong Dal', 'Steamed Rice', 'Phulka Roti', 'Gobi Sabzi', 'Pickle'] },
  { day: 'Wednesday', meal: 'dinner', items: ['Phulka Roti', 'Palak Paneer', 'Steamed Rice', 'Dal Tadka'] },
  { day: 'Thursday', meal: 'breakfast', items: ['Idli', 'Sambar', 'Coconut Chutney', 'Masala Chai'] },
  { day: 'Thursday', meal: 'lunch', items: ['Arhar Dal', 'Steamed Rice', 'Phulka Roti', 'Mix Veg Sabzi'] },
  { day: 'Thursday', meal: 'dinner', items: ['Phulka Roti', 'Kadhi Pakoda', 'Steamed Rice', 'Raita'] },
  { day: 'Friday', meal: 'breakfast', items: ['Poha', 'Masala Chai', 'Apple'] },
  { day: 'Friday', meal: 'lunch', items: ['Dal Fry', 'Jeera Rice', 'Phulka Roti', 'Tinda Sabzi', 'Salad'] },
  { day: 'Friday', meal: 'dinner', items: ['Phulka Roti', 'Shahi Paneer', 'Steamed Rice', 'Tomato Soup'] },
  { day: 'Saturday', meal: 'breakfast', items: ['Puri', 'Aloo Sabzi', 'Masala Chai'] },
  { day: 'Saturday', meal: 'lunch', items: ['Chole', 'Rice', 'Phulka Roti', 'Green Chutney', 'Onion Rings'] },
  { day: 'Saturday', meal: 'dinner', items: ['Phulka Roti', 'Aloo Matar', 'Steamed Rice', 'Boondi Raita'] },
  { day: 'Sunday', meal: 'breakfast', items: ['Dosa', 'Sambar', 'Coconut Chutney', 'Filter Coffee / Chai'] },
  { day: 'Sunday', meal: 'lunch', items: ['Special Dal', 'Steamed Rice', 'Phulka Roti', 'Paneer Butter Masala', 'Kheer'] },
  { day: 'Sunday', meal: 'dinner', items: ['Phulka Roti', 'Dal Makhani', 'Jeera Rice', 'Papad', 'Salad'] },
];

// ---------------------------------------------------------------------------
// PG-I — Vidhani (Main Office / Near JECRC University)
// GPS: 26.775711, 75.870879
// Maps: https://maps.app.goo.gl/BU2LhoBSQsEEzdSP8
// ---------------------------------------------------------------------------
const PG_1: BranchData = {
  branchId: 'ln-vidhani-jecrc',
  pgNumber: 'I',
  name: 'LN Boys PG & Hostel - I',
  address: 'Plot No. 14, Vidhani, Near JECRC University, Ramchandpura, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302022',
  phone: ['+91 83858 57902'],
  whatsapp: '918385857902',
  startingPrice: 7000,
  rating: 4.5,
  status: 'active',
  lat: 26.775711,
  lng: 75.870879,
  googleMapsUrl: 'https://maps.app.goo.gl/BU2LhoBSQsEEzdSP8',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d894.7!2d75.870879!3d26.775711!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDQ2JzMyLjYiTiA3NcKwNTInMTUuMiJF!5e0!3m2!1sen!2sin!4v1720000000001',
  gallery: [
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664129/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_4_47_40_pm.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_4_47_40_pm', resourceType: 'image', altText: 'LN Boys PG - I interior view', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664130/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__1_.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__1_', resourceType: 'image', altText: 'LN Boys PG - I common area', category: 'common-area' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664131/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__2_.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__2_', resourceType: 'image', altText: 'LN Boys PG - I room view', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664132/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm', resourceType: 'image', altText: 'LN Boys PG - I exterior view', category: 'exterior' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664133/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_52_pm__1_.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_52_pm__1_', resourceType: 'image', altText: 'LN Boys PG - I amenities area', category: 'common-area' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664134/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_52_pm.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_52_pm', resourceType: 'image', altText: 'LN Boys PG - I room facilities', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/video/upload/v1783664124/ln-hostel/gallery/ln-hostel/gallery/video_2026_07_10_11_30_49.mp4', publicId: 'ln-hostel/gallery/video_2026_07_10_11_30_49', resourceType: 'video', altText: 'LN Boys PG - I hostel video tour', category: 'common-area' },
    { url: 'https://res.cloudinary.com/dtprb1afw/video/upload/v1783664128/ln-hostel/gallery/ln-hostel/gallery/video_2026_07_10_11_31_03.mp4', publicId: 'ln-hostel/gallery/video_2026_07_10_11_31_03', resourceType: 'video', altText: 'LN Boys PG - I room tour video', category: 'room' },
  ],
  rooms: [
    { type: 'Double', variant: 'Non-AC', pricePerMonth: 7000, available: true },
    { type: 'Double', variant: 'Cooler', pricePerMonth: 7500, available: true },
    { type: 'Double', variant: 'AC', pricePerMonth: 9000, available: true },
    { type: 'Triple', variant: 'Non-AC', pricePerMonth: 6000, available: true },
    { type: 'Triple', variant: 'Cooler', pricePerMonth: 6500, available: true },
    { type: 'Triple', variant: 'AC', pricePerMonth: 8000, available: true },
  ],
  amenities: COMMON_AMENITIES,
  policies: COMMON_POLICIES,
  landmarks: [
    // ── Colleges ──────────────────────────────────────────────────────────
    // JECRC University: IS-2036-39, Ramchandrapura, Vidhani — same street as PG-I (~200m walk)
    { name: 'JECRC University', category: 'college', distanceMetres: 200,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=JECRC+University,+Vidhani,+Jaipur&travelmode=walking' },
    // JIET (JECRC Foundation): next to JECRC on same campus road (~400m)
    { name: 'JECRC Foundation (JIET)', category: 'college', distanceMetres: 400,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=JECRC+Foundation,+Sitapura,+Jaipur&travelmode=walking' },
    // ── Hospitals ─────────────────────────────────────────────────────────
    // MGH: RIICO Institutional Area, Sitapura — GPS 26.769982, 75.854503
    // Straight-line ~1.9km; road via Sitapura Industrial Road ~2.8km
    { name: 'Mahatma Gandhi Hospital (MGH)', category: 'hospital', distanceMetres: 2800,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=Mahatma+Gandhi+Hospital+Sitapura+Jaipur&travelmode=driving' },
    // Santokba Durlabhji Hospital: Bhawani Singh Road, ~16km — major private hospital
    { name: 'Santokba Durlabhji Hospital', category: 'hospital', distanceMetres: 16000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=Santokba+Durlabhji+Hospital+Jaipur&travelmode=driving' },
    // ── Transport ─────────────────────────────────────────────────────────
    // Sitapura Puliya bus stop on Tonk Road — nearest RSRTC stop, ~2.5km by road
    { name: 'Sitapura Puliya Bus Stop (Tonk Road)', category: 'transport', distanceMetres: 2500,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=Sitapura+Puliya,+Tonk+Road,+Jaipur&travelmode=driving' },
    // Jaipur International Airport — ~8km south via Sanganer Road
    { name: 'Jaipur International Airport', category: 'transport', distanceMetres: 8000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=Jaipur+International+Airport&travelmode=driving' },
    // ── Shopping ──────────────────────────────────────────────────────────
    // World Trade Park: Malviya Nagar, Tonk Road — biggest mall near this area, ~12km
    { name: 'World Trade Park (WTP Mall)', category: 'other', distanceMetres: 12000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=World+Trade+Park+Jaipur&travelmode=driving' },
    // ── Temples ───────────────────────────────────────────────────────────
    // Shri Balaji Mandir, Sitapura — local popular temple ~3km
    { name: 'Shri Balaji Mandir, Sitapura', category: 'other', distanceMetres: 3000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=Balaji+Mandir+Sitapura+Jaipur&travelmode=driving' },
    // Shri Govind Dev Ji Temple: City Palace complex — iconic Jaipur temple, ~20km
    { name: 'Shri Govind Dev Ji Temple', category: 'other', distanceMetres: 20000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.775711,75.870879&destination=Govind+Dev+Ji+Temple+Jaipur&travelmode=driving' },
  ],
  foodMenu: COMMON_FOOD_MENU,
};

// ---------------------------------------------------------------------------
// PG-II — Tuwariyan Ki Dhani, Ramchandpura
// GPS: 26.7759546, 75.8688499
// Maps: https://maps.app.goo.gl/d1kXy3JChZiqjhey7
// ---------------------------------------------------------------------------
const PG_2: BranchData = {
  branchId: 'ln-sanganer-ii',
  pgNumber: 'II',
  name: 'LN Boys PG & Hostel - II',
  address: 'Tuwariyan Ki Dhani, Ramchandpura, Near JECRC, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302022',
  phone: ['+91 83858 57902'],
  whatsapp: '918385857902',
  startingPrice: 7000,
  rating: 4.5,
  status: 'active',
  lat: 26.7759546,
  lng: 75.8688499,
  googleMapsUrl: 'https://maps.app.goo.gl/d1kXy3JChZiqjhey7',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d447.2!2d75.8688499!3d26.7759546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDQ2JzMzLjQiTiA3NcKwNTInMDcuOSJF!5e0!3m2!1sen!2sin!4v1720000000002',
  gallery: [
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664129/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_4_47_40_pm.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_4_47_40_pm', resourceType: 'image', altText: 'LN Boys PG - II interior view', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664130/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__1_.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__1_', resourceType: 'image', altText: 'LN Boys PG - II common area', category: 'common-area' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664131/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__2_.jpg', publicId: 'ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__2_', resourceType: 'image', altText: 'LN Boys PG - II room view', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/video/upload/v1783664124/ln-hostel/gallery/ln-hostel/gallery/video_2026_07_10_11_30_49.mp4', publicId: 'ln-hostel/gallery/video_2026_07_10_11_30_49', resourceType: 'video', altText: 'LN Boys PG - II video tour', category: 'common-area' },
  ],
  rooms: [
    { type: 'Double', variant: 'Non-AC', pricePerMonth: 7000, available: true },
    { type: 'Double', variant: 'Cooler', pricePerMonth: 7500, available: true },
    { type: 'Double', variant: 'AC', pricePerMonth: 9000, available: true },
    { type: 'Triple', variant: 'Non-AC', pricePerMonth: 6000, available: true },
    { type: 'Triple', variant: 'Cooler', pricePerMonth: 6500, available: true },
    { type: 'Triple', variant: 'AC', pricePerMonth: 8000, available: true },
  ],
  amenities: COMMON_AMENITIES,
  policies: COMMON_POLICIES,
  landmarks: [
    // ── Colleges ──────────────────────────────────────────────────────────
    // JECRC University: ~400m walk from PG-II (slightly further than PG-I)
    { name: 'JECRC University', category: 'college', distanceMetres: 400,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=JECRC+University,+Vidhani,+Jaipur&travelmode=walking' },
    { name: 'JECRC Foundation (JIET)', category: 'college', distanceMetres: 600,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=JECRC+Foundation,+Sitapura,+Jaipur&travelmode=walking' },
    // ── Hospitals ─────────────────────────────────────────────────────────
    // MGH: ~2.5km road (PG-II is ~200m from PG-I so similar distance)
    { name: 'Mahatma Gandhi Hospital (MGH)', category: 'hospital', distanceMetres: 2600,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=Mahatma+Gandhi+Hospital+Sitapura+Jaipur&travelmode=driving' },
    // ── Transport ─────────────────────────────────────────────────────────
    { name: 'Sitapura Puliya Bus Stop (Tonk Road)', category: 'transport', distanceMetres: 2300,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=Sitapura+Puliya,+Tonk+Road,+Jaipur&travelmode=driving' },
    { name: 'Jaipur International Airport', category: 'transport', distanceMetres: 7500,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=Jaipur+International+Airport&travelmode=driving' },
    // ── Shopping ──────────────────────────────────────────────────────────
    { name: 'World Trade Park (WTP Mall)', category: 'other', distanceMetres: 12000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=World+Trade+Park+Jaipur&travelmode=driving' },
    // ── Temples ───────────────────────────────────────────────────────────
    { name: 'Shri Balaji Mandir, Sitapura', category: 'other', distanceMetres: 3000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=Balaji+Mandir+Sitapura+Jaipur&travelmode=driving' },
    { name: 'Shri Govind Dev Ji Temple', category: 'other', distanceMetres: 20000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7759546,75.8688499&destination=Govind+Dev+Ji+Temple+Jaipur&travelmode=driving' },
  ],
  foodMenu: COMMON_FOOD_MENU,
};

// ---------------------------------------------------------------------------
// PG-III — Sitapura / Rampura at Kanwarpura (LN Boys PG 2 on Google Maps)
// GPS: 26.7604402, 75.8671524
// Maps: https://maps.app.goo.gl/ZQrCgLx8UFuT4C7dA
// ---------------------------------------------------------------------------
const PG_3: BranchData = {
  branchId: 'ln-sitapura-iii',
  pgNumber: 'III',
  name: 'LN Boys PG & Hostel - III',
  address: 'QV68+5VC, Sitapura, Rampura at Kanwarpura, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302022',
  phone: ['+91 83858 57902'],
  whatsapp: '918385857902',
  startingPrice: 7000,
  rating: 3.0,
  status: 'active',
  lat: 26.7604402,
  lng: 75.8671524,
  googleMapsUrl: 'https://maps.app.goo.gl/ZQrCgLx8UFuT4C7dA',
  mapEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d447.8!2d75.8671524!3d26.7604402!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMjbCsDQ1JzM3LjYiTiA3NcKwNTInMDIuNyJF!5e0!3m2!1sen!2sin!4v1720000000003',
  gallery: [
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664129/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_4_47_40_pm.jpg', publicId: 'ln-hostel/gallery/pg3-room-1', resourceType: 'image', altText: 'LN Boys PG - III interior view', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664130/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__1_.jpg', publicId: 'ln-hostel/gallery/pg3-common-1', resourceType: 'image', altText: 'LN Boys PG - III common area', category: 'common-area' },
    { url: 'https://res.cloudinary.com/dtprb1afw/image/upload/v1783664131/ln-hostel/gallery/ln-hostel/gallery/whatsapp_image_2026_07_08_at_6_02_51_pm__2_.jpg', publicId: 'ln-hostel/gallery/pg3-room-2', resourceType: 'image', altText: 'LN Boys PG - III room view', category: 'room' },
    { url: 'https://res.cloudinary.com/dtprb1afw/video/upload/v1783664124/ln-hostel/gallery/ln-hostel/gallery/video_2026_07_10_11_30_49.mp4', publicId: 'ln-hostel/gallery/pg3-video-1', resourceType: 'video', altText: 'LN Boys PG - III video tour', category: 'common-area' },
  ],
  rooms: [
    { type: 'Double', variant: 'Non-AC', pricePerMonth: 7000, available: true },
    { type: 'Double', variant: 'Cooler', pricePerMonth: 7500, available: true },
    { type: 'Double', variant: 'AC', pricePerMonth: 9000, available: true },
    { type: 'Triple', variant: 'Non-AC', pricePerMonth: 6000, available: true },
    { type: 'Triple', variant: 'Cooler', pricePerMonth: 6500, available: true },
    { type: 'Triple', variant: 'AC', pricePerMonth: 8000, available: true },
  ],
  amenities: COMMON_AMENITIES,
  policies: COMMON_POLICIES,
  landmarks: [
    // ── Colleges ──────────────────────────────────────────────────────────
    // JECRC University: from PG-3 (Kanwarpura), straight line ~1.8km north, road ~2.5km
    { name: 'JECRC University', category: 'college', distanceMetres: 2500,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=JECRC+University,+Vidhani,+Jaipur&travelmode=driving' },
    // ── Hospitals ─────────────────────────────────────────────────────────
    // MGH: GPS 26.769982, 75.854503 — straight-line ~1.5km, road ~2km from PG-3
    { name: 'Mahatma Gandhi Hospital (MGH)', category: 'hospital', distanceMetres: 2000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=Mahatma+Gandhi+Hospital+Sitapura+Jaipur&travelmode=driving' },
    // ── Transport ─────────────────────────────────────────────────────────
    // Sitapura Puliya on Tonk Road — ~1.5km from PG-3
    { name: 'Sitapura Puliya Bus Stop (Tonk Road)', category: 'transport', distanceMetres: 1500,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=Sitapura+Puliya,+Tonk+Road,+Jaipur&travelmode=driving' },
    // Jaipur Airport — ~6km south via Tonk Road
    { name: 'Jaipur International Airport', category: 'transport', distanceMetres: 6000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=Jaipur+International+Airport&travelmode=driving' },
    // ── Shopping ──────────────────────────────────────────────────────────
    // World Trade Park: Malviya Nagar — ~9km via Tonk Road from PG-3
    { name: 'World Trade Park (WTP Mall)', category: 'other', distanceMetres: 9000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=World+Trade+Park+Jaipur&travelmode=driving' },
    // ── Temples ───────────────────────────────────────────────────────────
    // Shri Balaji Mandir, Sitapura — local temple ~1km
    { name: 'Shri Balaji Mandir, Sitapura', category: 'other', distanceMetres: 1000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=Balaji+Mandir+Sitapura+Jaipur&travelmode=driving' },
    // Shri Govind Dev Ji Temple — iconic Jaipur temple, ~17km
    { name: 'Shri Govind Dev Ji Temple', category: 'other', distanceMetres: 17000,
      googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&origin=26.7604402,75.8671524&destination=Govind+Dev+Ji+Temple+Jaipur&travelmode=driving' },
  ],
  foodMenu: COMMON_FOOD_MENU,
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export const ALL_BRANCHES: BranchData[] = [PG_1, PG_2, PG_3];

export function getBranchById(branchId: string): BranchData | undefined {
  return ALL_BRANCHES.find((b) => b.branchId === branchId);
}
