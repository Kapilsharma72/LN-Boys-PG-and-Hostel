import { connectDB } from '@/lib/db/mongoose';
import Branch from '@/lib/db/models/Branch';
import Policy from '@/lib/db/models/Policy';
import AccordionPolicies, {
  Policy as PolicyType,
} from '@/components/branch/AccordionPolicies';
import type { Metadata } from 'next';

export const revalidate = 3600;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lnboyspg.com';

export const metadata: Metadata = {
  title: 'House Rules & Policies | LN Boys PG & Hostel Jaipur',
  description:
    'Read the policies and house rules for LN Boys PG & Hostel branches in Jaipur. Know what to expect before booking.',
  openGraph: {
    title: 'House Rules & Policies | LN Boys PG & Hostel Jaipur',
    description:
      'Read the policies and house rules for LN Boys PG & Hostel branches in Jaipur. Know what to expect before booking.',
    url: `${siteUrl}/policies`,
    type: 'website',
    images: [{ url: `${siteUrl}/images/og-image.jpg` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'House Rules & Policies | LN Boys PG & Hostel Jaipur',
    description:
      'Read the policies and house rules for LN Boys PG & Hostel branches in Jaipur. Know what to expect before booking.',
    images: [`${siteUrl}/images/og-image.jpg`],
  },
};

interface BranchDoc {
  branchId: string;
  name: string;
  status: 'active' | 'coming-soon';
}

interface PolicyDoc {
  _id: string;
  branchId: string;
  title: string;
  body: string;
  order: number;
}

interface BranchWithPolicies {
  branchId: string;
  branchName: string;
  policies: PolicyType[];
}

/**
 * Fetches all branches and policies, groups policies by branch,
 * and sorts branches alphabetically.
 */
async function getBranchesWithPolicies(): Promise<BranchWithPolicies[]> {
  try {
    await connectDB();

    // Fetch all branches and policies in parallel
    const [branches, policies] = await Promise.all([
      Branch.find().lean<BranchDoc[]>(),
      Policy.find().lean<PolicyDoc[]>(),
    ]);

    // Sort branches alphabetically by name
    const sortedBranches = [...branches].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    // Build a map of branchId → policies[]
    const policyMap = new Map<string, PolicyType[]>();
    for (const policy of policies) {
      if (!policyMap.has(policy.branchId)) {
        policyMap.set(policy.branchId, []);
      }
      policyMap.get(policy.branchId)!.push({
        _id: policy._id.toString(),
        branchId: policy.branchId,
        title: policy.title,
        body: policy.body,
        order: policy.order,
      });
    }

    // Sort policies within each branch by `order` ascending
    for (const policiesArray of Array.from(policyMap.values())) {
      policiesArray.sort((a, b) => a.order - b.order);
    }

    // Build the result array
    return sortedBranches.map((branch) => ({
      branchId: branch.branchId,
      branchName: branch.name,
      policies: policyMap.get(branch.branchId) || [],
    }));
  } catch {
    return [];
  }
}

export default async function PoliciesPage() {
  const branchesWithPolicies = await getBranchesWithPolicies();

  return (
    <div className="min-h-screen bg-[#0B0B3B]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 text-center">
          Policies & <span className="text-[#F5C518]">House Rules</span>
        </h1>
        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          Read the policies and house rules for each branch before booking your
          stay.
        </p>

        {branchesWithPolicies.length === 0 ? (
          <p className="text-center text-gray-400 text-lg py-12">
            No policies available at the moment. Check back soon!
          </p>
        ) : (
          <div className="space-y-12">
            {branchesWithPolicies.map((branch) => (
              <section
                key={branch.branchId}
                className="bg-[#0B0B3B] border border-white/10 rounded-lg p-6"
                aria-labelledby={`branch-${branch.branchId}-heading`}
              >
                <h2
                  id={`branch-${branch.branchId}-heading`}
                  className="text-xl sm:text-2xl font-bold text-white mb-4"
                >
                  {branch.branchName}
                </h2>

                {branch.policies.length === 0 ? (
                  <p className="text-white/70 italic text-sm py-4">
                    Policies coming soon for this branch.
                  </p>
                ) : (
                  <AccordionPolicies policies={branch.policies} />
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
