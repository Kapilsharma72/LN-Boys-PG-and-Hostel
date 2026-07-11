import { Accordion } from '@/components/ui/Accordion';

/**
 * AccordionPolicies — renders branch house rules/policies as an accordion.
 *
 * Server Component — no DB calls; receives pre-fetched data as props.
 *
 * Requirements: 3.6
 * - Policies sorted by `order` ascending before rendering.
 * - When zero policies: displays "House rules coming soon."
 * - Each policy renders as an accordion item: title as header, body as content.
 * - Body text preserves whitespace and line breaks (whitespace-pre-wrap).
 */

export interface Policy {
  _id: string;
  branchId: string;
  title: string;
  body: string;
  order: number;
}

interface AccordionPoliciesProps {
  policies: Policy[];
  /** Optional className forwarded to the Accordion root wrapper */
  className?: string;
}

export default function AccordionPolicies({
  policies,
  className,
}: AccordionPoliciesProps) {
  if (policies.length === 0) {
    return (
      <p className="text-white/70 italic text-sm py-4">
        House rules coming soon.
      </p>
    );
  }

  // Sort a shallow copy by `order` ascending — never mutate props
  const sorted = [...policies].sort((a, b) => a.order - b.order);

  const items = sorted.map((policy) => ({
    id: policy._id,
    title: policy.title,
    content: (
      <p className="whitespace-pre-wrap text-white/80 text-sm leading-relaxed">
        {policy.body}
      </p>
    ),
  }));

  return (
    <Accordion
      items={items}
      className={className}
      // Each item: bottom border to visually separate rules
      itemClassName="border-b border-white/10 last:border-b-0"
      // Trigger: full-width flex row, gold accent on hover, navy background
      triggerClassName={[
        'flex w-full items-center justify-between gap-4',
        'py-4 px-1 text-left',
        'text-white font-medium text-sm',
        'hover:text-[#F5C518] transition-colors duration-150',
      ].join(' ')}
      // Content padding
      contentClassName="px-1 pb-4"
    />
  );
}
