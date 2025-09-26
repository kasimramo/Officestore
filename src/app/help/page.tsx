import Link from "next/link";
import { requireAuth } from "@/lib/context";

export default async function HelpPage() {
  await requireAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Help &amp; Support</h1>
        <p className="mt-2 text-sm text-slate-600">
          Browse quick links while we build out in-app guides and contextual tips.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-blue-600">
          <li>
            <Link className="hover:text-blue-700" href="/requests">
              Submit a new request
            </Link>
          </li>
          <li>
            <Link className="hover:text-blue-700" href="/catalogue">
              Browse the catalogue
            </Link>
          </li>
          <li>
            <Link className="hover:text-blue-700" href="/organization/setup">
              Organization setup guide
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
