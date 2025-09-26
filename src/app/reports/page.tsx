import { requireOrgMembership } from "@/lib/context";

export default async function ReportsPage() {
  const { session } = await requireOrgMembership();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l6.75-6.75 3.75 3.75L21 3M3 21h18" />
        </svg>
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">Reports coming soon</h1>
        <p className="text-sm text-slate-600">
          Hi {session.user.name ?? session.user.email}, we&apos;re building rich analytics to help your organization understand spending and usage trends. Check back soon for interactive dashboards and exportable summaries.
        </p>
      </div>
    </div>
  );
}
