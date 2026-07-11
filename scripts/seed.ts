/**
 * scripts/seed.ts
 *
 * Idempotent seed script for LN Boys PG & Hostel.
 * Run with: npm run seed
 *
 * Loads environment variables from .env.local (primary) then .env (fallback),
 * validates the MongoDB connection, then upserts all seed data.
 */

import * as dns from 'dns';
// Force Google DNS to avoid corporate/router DNS resolution failures
dns.setServers(['8.8.8.8', '8.8.4.4']);

import * as dotenv from 'dotenv';

// Load .env.local first (Next.js convention), then fall back to .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback to .env

import mongoose from 'mongoose';
import Branch from '../lib/db/models/Branch';
import Room from '../lib/db/models/Room';
import Amenity from '../lib/db/models/Amenity';
import Landmark from '../lib/db/models/Landmark';
import FoodMenu from '../lib/db/models/FoodMenu';
import Testimonial from '../lib/db/models/Testimonial';
import Policy from '../lib/db/models/Policy';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ---------------------------------------------------------------------------
// Branch seed data
// ---------------------------------------------------------------------------

const BRANCH_1 = {
  branchId: 'ln-vidhani-jecrc',
  name: 'LN Boys PG & Hostel - I (Vidhani)',
  address: 'Plot No. 14, Vidhani, Near JECRC University, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '303905',
  phone: ['+91 83858 57902'],
  whatsapp: '+91 83858 57902',
  startingPrice: 8000,
  rating: 4.5,
  status: 'active' as const,
  occupancyTypes: ['Double', 'Triple'],
  latitude: 26.8206,
  longitude: 75.6572,
  metaTitle: 'LN Boys PG near JECRC Vidhani Jaipur | Best Boys PG Hostel',
  metaDescription:
    'Affordable boys PG hostel near JECRC University, Vidhani, Jaipur. Double and triple rooms starting ₹8,000/month. 3 meals/day, CCTV, Wi-Fi.',
};

const BRANCH_2 = {
  branchId: 'ln-sanganer-ii',
  name: 'LN Boys PG & Hostel - II (Sanganer)',
  address: 'Plot No. 53, Shree Ram Nikunj, Block B, 200 Ft. Mahel Road, Near Bhora Petrol Pump, Sanganer, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '303902',
  phone: ['+91 83858 57902'],
  whatsapp: '+91 83858 57902',
  startingPrice: 7500,
  rating: 4.5,
  status: 'active' as const,
  occupancyTypes: ['Double', 'Triple'],
  latitude: 26.7932,
  longitude: 75.8057,
  metaTitle: 'LN Boys PG Sanganer Jaipur | Affordable Boys Hostel near Airport',
  metaDescription:
    'Affordable boys PG hostel in Sanganer, Jaipur. Double and triple rooms starting ₹7,500/month. 3 meals/day, CCTV, Wi-Fi, near Jaipur Airport.',
};

const BRANCH_3 = {
  branchId: 'ln-sitapura-iii',
  name: 'LN Boys PG & Hostel - III (Sitapura)',
  address: 'Near Sitapura Industrial Area, Jaipur',
  city: 'Jaipur',
  state: 'Rajasthan',
  pincode: '302022',
  phone: ['+91 83858 57902'],
  whatsapp: '+91 83858 57902',
  startingPrice: 8500,
  rating: 0,
  status: 'coming-soon' as const,
  occupancyTypes: ['Double', 'Triple'],
};

// ---------------------------------------------------------------------------
// Room seed data (6 variants per active PG)
// ---------------------------------------------------------------------------

interface RoomSeed {
  branchId: string;
  occupancyType: 'Single' | 'Double' | 'Triple';
  pricePerMonth: number;
  description: string;
  available: boolean;
}

const ROOMS: RoomSeed[] = [
  // ── PG-I (ln-vidhani-jecrc) ──────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', occupancyType: 'Double', pricePerMonth: 7000, description: 'Non-AC', available: true },
  { branchId: 'ln-vidhani-jecrc', occupancyType: 'Double', pricePerMonth: 7500, description: 'Cooler', available: true },
  { branchId: 'ln-vidhani-jecrc', occupancyType: 'Double', pricePerMonth: 9000, description: 'AC', available: true },
  { branchId: 'ln-vidhani-jecrc', occupancyType: 'Triple', pricePerMonth: 6000, description: 'Non-AC', available: true },
  { branchId: 'ln-vidhani-jecrc', occupancyType: 'Triple', pricePerMonth: 6500, description: 'Cooler', available: true },
  { branchId: 'ln-vidhani-jecrc', occupancyType: 'Triple', pricePerMonth: 8000, description: 'AC', available: true },
  // ── PG-II (ln-sanganer-ii) ───────────────────────────────────────────────
  { branchId: 'ln-sanganer-ii', occupancyType: 'Double', pricePerMonth: 7000, description: 'Non-AC', available: true },
  { branchId: 'ln-sanganer-ii', occupancyType: 'Double', pricePerMonth: 7500, description: 'Cooler', available: true },
  { branchId: 'ln-sanganer-ii', occupancyType: 'Double', pricePerMonth: 9000, description: 'AC', available: true },
  { branchId: 'ln-sanganer-ii', occupancyType: 'Triple', pricePerMonth: 6000, description: 'Non-AC', available: true },
  { branchId: 'ln-sanganer-ii', occupancyType: 'Triple', pricePerMonth: 6500, description: 'Cooler', available: true },
  { branchId: 'ln-sanganer-ii', occupancyType: 'Triple', pricePerMonth: 8000, description: 'AC', available: true },
];

// ---------------------------------------------------------------------------
// Amenity seed data
// ---------------------------------------------------------------------------

interface AmenitySeed {
  branchId: string;
  name: string;
  icon: string;
  category: 'basic' | 'safety' | 'comfort' | 'food';
}

const ACTIVE_BRANCH_IDS = ['ln-vidhani-jecrc', 'ln-sanganer-ii'];

const AMENITY_TEMPLATES: Omit<AmenitySeed, 'branchId'>[] = [
  { name: 'Wi-Fi', icon: 'wifi', category: 'basic' },
  { name: 'CCTV Security', icon: 'shield-check', category: 'safety' },
  { name: 'Geyser', icon: 'flame', category: 'comfort' },
  { name: 'RO Water', icon: 'droplets', category: 'basic' },
  { name: 'Study Table & Chair', icon: 'book-open', category: 'comfort' },
  { name: 'Almirah/Wardrobe', icon: 'package', category: 'comfort' },
  { name: 'Attached Washroom', icon: 'bath', category: 'comfort' },
  { name: '3 Meals/Day', icon: 'utensils', category: 'food' },
  { name: 'Laundry Service', icon: 'shirt', category: 'comfort' },
  { name: 'Power Backup', icon: 'zap', category: 'basic' },
];

const AMENITIES: AmenitySeed[] = ACTIVE_BRANCH_IDS.flatMap((branchId) =>
  AMENITY_TEMPLATES.map((a) => ({ ...a, branchId }))
);

// ---------------------------------------------------------------------------
// Landmark seed data
// ---------------------------------------------------------------------------

interface LandmarkSeed {
  branchId: string;
  name: string;
  category: 'college' | 'hospital' | 'transport' | 'other';
  distanceMetres: number;
  googleMapsUrl: string;
}

const LANDMARKS: LandmarkSeed[] = [
  // ── PG-I (ln-vidhani-jecrc) ──────────────────────────────────────────────
  {
    branchId: 'ln-vidhani-jecrc',
    name: 'JECRC University',
    category: 'college',
    distanceMetres: 200,
    googleMapsUrl: 'https://maps.google.com/?q=JECRC+University+Jaipur',
  },
  {
    branchId: 'ln-vidhani-jecrc',
    name: 'Sitapura Hospital',
    category: 'hospital',
    distanceMetres: 2000,
    googleMapsUrl: 'https://maps.google.com/?q=Sitapura+Hospital+Jaipur',
  },
  {
    branchId: 'ln-vidhani-jecrc',
    name: 'Vidhani Bus Stop',
    category: 'transport',
    distanceMetres: 300,
    googleMapsUrl: 'https://maps.google.com/?q=Vidhani+Bus+Stop+Jaipur',
  },
  // ── PG-II (ln-sanganer-ii) ───────────────────────────────────────────────
  {
    branchId: 'ln-sanganer-ii',
    name: 'Sanganer Airport (Jaipur Airport)',
    category: 'transport',
    distanceMetres: 5000,
    googleMapsUrl: 'https://maps.google.com/?q=Jaipur+Airport',
  },
  {
    branchId: 'ln-sanganer-ii',
    name: 'Sanganer Government Hospital',
    category: 'hospital',
    distanceMetres: 1500,
    googleMapsUrl: 'https://maps.google.com/?q=Sanganer+Hospital+Jaipur',
  },
  {
    branchId: 'ln-sanganer-ii',
    name: 'Sanganer Bus Stand',
    category: 'transport',
    distanceMetres: 800,
    googleMapsUrl: 'https://maps.google.com/?q=Sanganer+Bus+Stand+Jaipur',
  },
  {
    branchId: 'ln-sanganer-ii',
    name: 'JECRC University',
    category: 'college',
    distanceMetres: 8000,
    googleMapsUrl: 'https://maps.google.com/?q=JECRC+University+Jaipur',
  },
];

// ---------------------------------------------------------------------------
// Policy seed data (from PDF — applied to both active PGs)
// ---------------------------------------------------------------------------

interface PolicySeed {
  branchId: string;
  title: string;
  body: string;
  order: number;
}

const POLICY_TEMPLATES: Omit<PolicySeed, 'branchId'>[] = [
  {
    title: 'Room Allotment',
    body: 'Students must stay in their allotted rooms only. Switching rooms without prior permission from the Warden is not allowed.',
    order: 1,
  },
  {
    title: 'Anti-Ragging Policy',
    body: 'Any physical or mental harassment including ragging, quarrelling, abusive language, or violent behavior is strictly prohibited and will result in immediate expulsion.',
    order: 2,
  },
  {
    title: 'Prohibited Items',
    body: 'Smoking, chewing gutkha, and consumption of alcohol or any intoxicants is strictly prohibited inside hostel premises.',
    order: 3,
  },
  {
    title: 'Silence & Discipline',
    body: 'The hostel is meant for studies. Silence must be maintained. Students must not disturb others by conducting parties, playing loud music, or talking loudly on mobile phones.',
    order: 4,
  },
  {
    title: 'Meal Schedule',
    body: 'Students must be available for breakfast, lunch, and dinner as per the scheduled timings. Food must be consumed in the mess only — carrying food to rooms is not permitted.',
    order: 5,
  },
  {
    title: 'Fee Payment',
    body: 'Monthly rent is due by the 5th of each month. A late fee of ₹100 per day will be charged after the due date. Fee must be paid in full.',
    order: 6,
  },
  {
    title: 'Security Deposit',
    body: '2 months security deposit and 1 month advance rent is taken at the time of admission. The security deposit will be returned at the end of the stay after deducting damages if any.',
    order: 7,
  },
  {
    title: 'ID Requirements',
    body: 'Parents and students must come with voter ID card, Ration Card, Pan Card, Aadhar Card, or D.L. Card at the time of admission.',
    order: 8,
  },
];

const POLICIES: PolicySeed[] = ACTIVE_BRANCH_IDS.flatMap((branchId) =>
  POLICY_TEMPLATES.map((p) => ({ ...p, branchId }))
);

// ---------------------------------------------------------------------------
// Food menu seed data (PG-I only — same menu shared by both)
// ---------------------------------------------------------------------------

type Day =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';
type Meal = 'breakfast' | 'lunch' | 'dinner';

interface FoodMenuSeed {
  branchId: string;
  day: Day;
  meal: Meal;
  items: string[];
}

// 3 meals × 7 days = 21 documents for ln-vidhani-jecrc
const FOOD_MENUS: FoodMenuSeed[] = [
  // ── Monday ───────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Monday', meal: 'breakfast', items: ['Poha', 'Masala Chai', 'Banana'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Monday', meal: 'lunch', items: ['Dal Tadka', 'Steamed Rice', 'Phulka Roti', 'Aloo Sabzi', 'Salad'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Monday', meal: 'dinner', items: ['Phulka Roti', 'Dal Makhani', 'Steamed Rice', 'Bhindi Masala'] },
  // ── Tuesday ──────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Tuesday', meal: 'breakfast', items: ['Upma', 'Masala Chai', 'Seasonal Fruit'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Tuesday', meal: 'lunch', items: ['Rajma Curry', 'Jeera Rice', 'Phulka Roti', 'Raita'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Tuesday', meal: 'dinner', items: ['Phulka Roti', 'Chana Masala', 'Steamed Rice', 'Cucumber Salad'] },
  // ── Wednesday ────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Wednesday', meal: 'breakfast', items: ['Aloo Paratha', 'Curd', 'Masala Chai'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Wednesday', meal: 'lunch', items: ['Moong Dal', 'Steamed Rice', 'Phulka Roti', 'Gobi Sabzi', 'Pickle'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Wednesday', meal: 'dinner', items: ['Phulka Roti', 'Palak Paneer', 'Steamed Rice', 'Dal Tadka', 'Onion Salad'] },
  // ── Thursday ─────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Thursday', meal: 'breakfast', items: ['Idli', 'Sambar', 'Coconut Chutney', 'Masala Chai'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Thursday', meal: 'lunch', items: ['Arhar Dal', 'Steamed Rice', 'Phulka Roti', 'Mix Veg Sabzi'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Thursday', meal: 'dinner', items: ['Phulka Roti', 'Kadhi Pakoda', 'Steamed Rice', 'Vegetable Raita'] },
  // ── Friday ───────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Friday', meal: 'breakfast', items: ['Poha', 'Boiled Egg (opt.)', 'Masala Chai', 'Apple'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Friday', meal: 'lunch', items: ['Dal Fry', 'Jeera Rice', 'Phulka Roti', 'Tinda Sabzi', 'Salad'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Friday', meal: 'dinner', items: ['Phulka Roti', 'Shahi Paneer', 'Steamed Rice', 'Tomato Soup'] },
  // ── Saturday ─────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Saturday', meal: 'breakfast', items: ['Puri', 'Aloo Sabzi', 'Masala Chai'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Saturday', meal: 'lunch', items: ['Chole', 'Bhature / Rice', 'Phulka Roti', 'Onion Rings', 'Green Chutney'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Saturday', meal: 'dinner', items: ['Phulka Roti', 'Aloo Matar', 'Steamed Rice', 'Boondi Raita'] },
  // ── Sunday ───────────────────────────────────────────────────────────────
  { branchId: 'ln-vidhani-jecrc', day: 'Sunday', meal: 'breakfast', items: ['Dosa', 'Sambar', 'Coconut Chutney', 'Filter Coffee / Chai'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Sunday', meal: 'lunch', items: ['Special Dal', 'Steamed Rice', 'Phulka Roti', 'Paneer Butter Masala', 'Sweet (Kheer)'] },
  { branchId: 'ln-vidhani-jecrc', day: 'Sunday', meal: 'dinner', items: ['Phulka Roti', 'Dal Makhani', 'Jeera Rice', 'Papad', 'Salad'] },
];

// ---------------------------------------------------------------------------
// Testimonial seed data
// ---------------------------------------------------------------------------

interface TestimonialSeed {
  branchId: string;
  authorName: string;
  rating: number;
  text: string;
  date: Date;
  approved: boolean;
}

const TESTIMONIALS: TestimonialSeed[] = [
  {
    branchId: 'ln-vidhani-jecrc',
    authorName: 'Arjun Sharma',
    rating: 5,
    text: 'LN Boys PG is fantastic! The food is fresh and homely, the rooms are well-maintained, and the staff is always helpful. Living here made my college life much easier.',
    date: daysAgo(30),
    approved: true,
  },
  {
    branchId: 'ln-vidhani-jecrc',
    authorName: 'Rohit Meena',
    rating: 5,
    text: 'Best PG near JECRC. Wi-Fi works great for late-night studies, security is top-notch, and the mess provides delicious meals three times a day. Highly recommended!',
    date: daysAgo(60),
    approved: true,
  },
  {
    branchId: 'ln-vidhani-jecrc',
    authorName: 'Vivek Joshi',
    rating: 4,
    text: 'Clean rooms, tasty food, and a friendly environment. The management is responsive and resolves issues quickly. Great place for engineering students.',
    date: daysAgo(90),
    approved: true,
  },
  {
    branchId: 'ln-vidhani-jecrc',
    authorName: 'Karan Verma',
    rating: 4,
    text: 'I have stayed here for two years and it has been a comfortable experience. The three meals per day are filling and the cost is very affordable for Jaipur.',
    date: daysAgo(120),
    approved: true,
  },
  {
    branchId: 'ln-vidhani-jecrc',
    authorName: 'Aditya Gupta',
    rating: 5,
    text: 'Excellent PG with CCTV surveillance and 24x7 power backup. The location is very convenient — just a short walk from JECRC campus. My parents feel safe knowing I stay here.',
    date: daysAgo(180),
    approved: true,
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

async function main() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌  MONGODB_URI is not set in environment variables.');
    process.exit(1);
  }

  // Connect to MongoDB
  console.log('🔌  Connecting to MongoDB…');
  await mongoose.connect(mongoUri);

  // Validate connection with an admin ping
  try {
    await mongoose.connection.db!.admin().ping();
    console.log('✅  MongoDB connection verified (ping OK).');
  } catch (pingErr) {
    console.error('❌  MongoDB ping failed:', pingErr);
    await mongoose.disconnect();
    process.exit(1);
  }

  // Counters for summary
  let branchUpserted = 0;
  let roomUpserted = 0;
  let amenityUpserted = 0;
  let landmarkUpserted = 0;
  let foodMenuUpserted = 0;
  let testimonialUpserted = 0;
  let policyUpserted = 0;

  // ── 1. Upsert all 3 branches ──────────────────────────────────────────────
  console.log('\n📍  Upserting branches…');
  for (const branch of [BRANCH_1, BRANCH_2, BRANCH_3]) {
    const result = await Branch.findOneAndUpdate(
      { branchId: branch.branchId },
      { $set: branch },
      { upsert: true, new: true, runValidators: true }
    );
    branchUpserted++;
    console.log(`   ✓ Branch "${result.name}" (${result.branchId}) upserted.`);
  }

  // ── 2. Upsert rooms for active PGs ────────────────────────────────────────
  console.log('\n🛏️   Upserting rooms…');
  for (const room of ROOMS) {
    await Room.findOneAndUpdate(
      { branchId: room.branchId, occupancyType: room.occupancyType, description: room.description },
      { $set: room },
      { upsert: true, new: true, runValidators: true }
    );
    roomUpserted++;
    console.log(`   ✓ Room [${room.branchId}] ${room.occupancyType} ${room.description} upserted.`);
  }

  // ── 3. Upsert amenities for active PGs ────────────────────────────────────
  console.log('\n🏷️   Upserting amenities…');
  for (const amenity of AMENITIES) {
    await Amenity.findOneAndUpdate(
      { branchId: amenity.branchId, name: amenity.name },
      { $set: amenity },
      { upsert: true, new: true, runValidators: true }
    );
    amenityUpserted++;
  }
  console.log(`   ✓ ${amenityUpserted} amenities upserted.`);

  // ── 4. Upsert landmarks ───────────────────────────────────────────────────
  console.log('\n📌  Upserting landmarks…');
  for (const lm of LANDMARKS) {
    await Landmark.findOneAndUpdate(
      { branchId: lm.branchId, name: lm.name },
      { $set: lm },
      { upsert: true, new: true, runValidators: true }
    );
    landmarkUpserted++;
    console.log(`   ✓ Landmark "${lm.name}" (${lm.branchId}) upserted.`);
  }

  // ── 5. Upsert food menus ──────────────────────────────────────────────────
  console.log('\n🍱  Upserting food menu (21 entries)…');
  for (const fm of FOOD_MENUS) {
    await FoodMenu.findOneAndUpdate(
      { branchId: fm.branchId, day: fm.day, meal: fm.meal },
      { $set: { items: fm.items } },
      { upsert: true, new: true, runValidators: true }
    );
    foodMenuUpserted++;
  }
  console.log(`   ✓ ${foodMenuUpserted} food menu entries upserted.`);

  // ── 6. Upsert testimonials ────────────────────────────────────────────────
  console.log('\n💬  Upserting testimonials…');
  for (const t of TESTIMONIALS) {
    await Testimonial.findOneAndUpdate(
      { branchId: t.branchId, authorName: t.authorName },
      { $set: t },
      { upsert: true, new: true, runValidators: true }
    );
    testimonialUpserted++;
    console.log(`   ✓ Testimonial by "${t.authorName}" upserted.`);
  }

  // ── 7. Upsert policies ────────────────────────────────────────────────────
  console.log('\n📋  Upserting policies…');
  for (const p of POLICIES) {
    await Policy.findOneAndUpdate(
      { branchId: p.branchId, title: p.title },
      { $set: p },
      { upsert: true, new: true, runValidators: true }
    );
    policyUpserted++;
    console.log(`   ✓ Policy "${p.title}" (${p.branchId}) upserted.`);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊  Seed complete — summary:');
  console.log(`   Branches upserted:                   ${branchUpserted}`);
  console.log(`   Rooms upserted:                      ${roomUpserted}`);
  console.log(`   Amenities upserted:                  ${amenityUpserted}`);
  console.log(`   Landmarks upserted:                  ${landmarkUpserted}`);
  console.log(`   Food menu entries upserted:          ${foodMenuUpserted}`);
  console.log(`   Testimonials upserted:               ${testimonialUpserted}`);
  console.log(`   Policies upserted:                   ${policyUpserted}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error('❌  Unhandled error during seeding:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
