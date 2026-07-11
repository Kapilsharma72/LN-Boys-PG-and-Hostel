import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import BranchCard from '@/components/home/BranchCard';
import { ALL_BRANCHES } from '@/lib/data/branches';
import type { Metadata } from 'next';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.com';

export const metadata: Metadata = {
  title: 'Our Locations | LN Boys PG & Hostel Jaipur',
  description:
    'Explore all LN Boys PG & Hostel branches in Jaipur. Find the most convenient location near your college or workplace.',
  openGraph: {
    title: 'Our Locations | LN Boys PG & Hostel Jaipur',
    description: 'Explore all LN Boys PG & Hostel branches in Jaipur. Find the most convenient location near your college or workplace.',
    url: `${siteUrl}/locations`,
    type: 'website',
    images: [{ url: `${siteUrl}/images/og-image.jpg` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Locations | LN Boys PG & Hostel Jaipur',
    description: 'Explore all LN Boys PG & Hostel branches in Jaipur. Find the most convenient location near your college or workplace.',
    images: [`${siteUrl}/images/og-image.jpg`],
  },
};

interface BranchDoc {
  branchId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string[];
  startingPrice: number;
  rating: number;
  status: 'active' | 'coming-soon';
  occupancyTypes: string[];
}

async function getBranches(): Promise<BranchDoc[]> {
  try {
    await connectDB();
    const branches = await Branch.find().lean<BranchDoc[]>();
    if (branches.length > 0) return branches;
  } catch {
    // fall through to static data
  }
  // Static fallback — always works without DB
  return ALL_BRANCHES.map(b => ({
    branchId: b.branchId,
    name: b.name,
    address: b.address,
    city: b.city,
    state: b.state,
    pincode: b.pincode,
    phone: b.phone,
    startingPrice: b.startingPrice,
    rating: b.rating,
    status: b.status,
    occupancyTypes: ['Double', 'Triple'],
  }));
}

/** Sort: active branches first (A-Z), then coming-soon (A-Z) */
function sortBranches(branches: BranchDoc[]): BranchDoc[] {
  const active = branches
    .filter((b) => b.status === 'active')
    .sort((a, b) => a.name.localeCompare(b.name));
  const comingSoon = branches
    .filter((b) => b.status === 'coming-soon')
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...active, ...comingSoon];
}

export default async function LocationsPage() {
  const branches = await getBranches();
  const sorted = sortBranches(branches);

  return (
    <div className="min-h-screen bg-[#0B0B3B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 text-center">
          Our <span className="text-[#F5C518]">Locations</span>
        </h1>
        <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
          Find the most convenient LN Boys PG near your college or workplace.
        </p>

        {sorted.length === 0 ? (
          <p className="text-center text-gray-400 text-lg py-12">
            No branches found. Check back soon!
          </p>
        ) : (
          <ul
            role="list"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {sorted.map((branch) => (
              <li key={branch.branchId}>
                <BranchCard
                  branchId={branch.branchId}
                  name={branch.name}
                  startingPrice={branch.startingPrice}
                  rating={branch.rating}
                  city={branch.city}
                  status={branch.status}
                  address={branch.address}
                  occupancyTypes={branch.occupancyTypes}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
