import { requireAuth } from "@/lib/context";

export default async function ProfilePage() {
  const session = await requireAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Profile settings</h1>
        <p className="mt-2 text-sm text-slate-600">
          We&apos;re preparing a personalizeable profile experience for {session.user.name ?? session.user.email}. Soon you&apos;ll be able to manage notification preferences, authentication options, and personal details from here.
        </p>
      </div>
    </div>
  );
}
