import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Menu, ArrowRight, Workflow, Sparkles, Boxes, Building2, ShieldCheck,
  Truck, ChartNoAxesCombined, ClipboardList, CheckCircle2, FilePlus, Lock
} from 'lucide-react'

export default function Landing() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="bg-white text-slate-900">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">O</div>
              <span className="text-slate-900 font-semibold">Officestore</span>
            </div>

            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-700">
              <a href="#product" className="hover:text-slate-900">Product</a>
              <a href="#workflows" className="hover:text-slate-900">Workflows</a>
              <a href="#security" className="hover:text-slate-900">Security</a>
              <a href="#pricing" className="hover:text-slate-900">Pricing</a>
              <Link to="/login" className="text-slate-700 hover:text-slate-900">Sign in</Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-white shadow hover:opacity-95 transition"
              >
                Create Organization
                <ArrowRight className="w-4 h-4" />
              </Link>
            </nav>

            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200">
            <div className="px-4 py-3 space-y-2 text-slate-700">
              <a className="block" href="#product">Product</a>
              <a className="block" href="#workflows">Workflows</a>
              <a className="block" href="#security">Security</a>
              <a className="block" href="#pricing">Pricing</a>
              <Link className="block" to="/login">Sign in</Link>
              <Link className="block rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-white transition" to="/register">
                Create Organization
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero (Vibrant) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 text-slate-900">
        <div className="absolute inset-0 -z-10 opacity-30" aria-hidden="true">
          <svg className="absolute -top-20 -right-20 w-[40rem] h-[40rem]" viewBox="0 0 400 400" fill="none">
            <circle cx="200" cy="200" r="200" fill="url(#gradient)" />
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1">
                <stop stopColor="#ffffff" stopOpacity=".6" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
              <Sparkles className="w-3.5 h-3.5" />
              New: Multi-level approvals and SLA tracking
            </span>

            <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900">
              Procurement, simplified for every office.
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Manage requests, catalogs, suppliers, and budgets in one place. Automate approvals, stay compliant, and never stock out.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 px-5 py-3 text-white font-medium hover:opacity-90 transition shadow-lg"
              >
                Create Organization
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#workflows"
                className="inline-flex items-center justify-center gap-2 rounded-md border-2 border-emerald-500 bg-transparent px-5 py-3 text-emerald-600 hover:bg-emerald-50 transition"
              >
                See Workflows
                <Workflow className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6 items-center opacity-90">
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="h-8 bg-white/20 rounded"></div>
            <div className="h-8 bg-white/20 rounded hidden lg:block"></div>
            <div className="h-8 bg-white/20 rounded hidden lg:block"></div>
          </div>
        </div>
      </section>

      {/* Product Highlights */}
      <section id="product" className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-slate-900">Everything your procurement team needs</h2>
            <p className="mt-2 text-slate-600">Role-based workflows, multi-site inventory, and supplier management out of the box.</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold">Approval Workflows</h3>
              <p className="mt-2 text-sm text-slate-600">Multi-level approvals with SLAs, comments, and change requests.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold">Inventory & Catalog</h3>
              <p className="mt-2 text-sm text-slate-600">Centralized catalog with min/max thresholds and low-stock alerts.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold">Multi-Site Support</h3>
              <p className="mt-2 text-sm text-slate-600">Manage HQ, warehouses, and remote locations with ease.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold">Controls & Compliance</h3>
              <p className="mt-2 text-sm text-slate-600">Budgets, audit logs, and role-based permissions built-in.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Truck className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold">Supplier Management</h3>
              <p className="mt-2 text-sm text-slate-600">Track performance, on-time delivery, and quality issues.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <ChartNoAxesCombined className="w-5 h-5" />
              </div>
              <h3 className="mt-4 font-semibold">Analytics</h3>
              <p className="mt-2 text-sm text-slate-600">Spend by category, forecast stockouts, and budget adherence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Workflows */}
      <section id="workflows" className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-slate-900">How teams use Officestore</h2>
            <p className="mt-2 text-slate-600">From request to PO and delivery — automated and auditable.</p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <span className="font-medium">1. Request</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Staff browse internal catalog, add items, set priority, and submit.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-medium">2. Approve</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Approvers review cost centers, budgets, and SLA; approve or request changes.</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-700">
                <FilePlus className="w-5 h-5 text-emerald-600" />
                <span className="font-medium">3. Purchase</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">Procurement issues POs, tracks supplier performance, and reconciles receipts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Pricing teaser */}
      <section id="security" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid gap-6 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Enterprise-grade security</h2>
              <ul className="mt-4 space-y-2 text-slate-700 text-sm">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  Role-based access and audit logs
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  Encrypted at rest and in transit
                </li>
                <li className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-green-600" />
                  Multi-site controls and budgets
                </li>
              </ul>
              <Link
                to="/register"
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                Get Started
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 h-56 grid place-items-center text-slate-500">
              Compliance badges placeholder
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">O</div>
              <span className="text-slate-600">© {new Date().getFullYear()} Officestore. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <a href="#pricing" className="hover:text-slate-900">Pricing</a>
              <a href="#security" className="hover:text-slate-900">Security</a>
              <a href="#" className="hover:text-slate-900">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}