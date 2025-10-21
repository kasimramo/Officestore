import { Link } from 'react-router-dom'
import {
  Bell, FilePlus, Settings2, RefreshCcw, Flag, Check, MessageSquare,
  ShoppingCart, Download, Sliders, CheckCircle2, Truck, AlertTriangle,
  UploadCloud, TrendingUp, Timer, TriangleAlert
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function AdminDashboard() {
  const { org } = useAuth()

  return (
    <div className="bg-slate-50">
      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
            {org?.name && (
              <p className="text-sm text-slate-500 mt-1">
                Managing <span className="font-medium text-slate-700">{org.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* KPI Row */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-600">Spend (MTD)</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-semibold">$142,380</div>
              <div className="text-xs inline-flex items-center gap-1 text-green-600">
                <TrendingUp className="w-3.5 h-3.5" />
                +6.3%
              </div>
            </div>
            <div className="mt-2 h-2 rounded bg-slate-100">
              <div className="h-2 w-2/3 rounded bg-emerald-500"></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-600">Open POs</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-semibold">37</div>
              <div className="text-xs inline-flex items-center gap-1 text-slate-600">$58.2k value</div>
            </div>
            <div className="mt-2 grid grid-cols-3 text-xs text-slate-600">
              <div>Awaiting</div>
              <div>In Transit</div>
              <div>Delivered</div>
            </div>
            <div className="mt-1 grid grid-cols-3 gap-1">
              <div className="h-1.5 bg-amber-500 rounded"></div>
              <div className="h-1.5 bg-emerald-500 rounded"></div>
              <div className="h-1.5 bg-green-500 rounded"></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-600">Pending Approvals</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-semibold">12</div>
              <div className="text-xs inline-flex items-center gap-1 text-amber-600">
                <Timer className="w-3.5 h-3.5" />
                SLA: 6 due today
              </div>
            </div>
            <div className="mt-2 h-2 rounded bg-slate-100">
              <div className="h-2 w-1/2 rounded bg-amber-500"></div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-slate-600">Stockout Risks</div>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-3xl font-semibold">9</div>
              <div className="text-xs inline-flex items-center gap-1 text-red-600">
                <TriangleAlert className="w-3.5 h-3.5" />
                High: 3
              </div>
            </div>
            <div className="mt-2 h-2 rounded bg-slate-100">
              <div className="h-2 w-1/3 rounded bg-red-500"></div>
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <section className="grid gap-4 lg:grid-cols-3">
          {/* Approval Queue */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Approval Queue</h3>
              <div className="flex items-center gap-2 text-sm">
                <select className="rounded-md border-slate-300 text-sm">
                  <option>All</option>
                  <option>Over SLA</option>
                  <option>High Priority</option>
                  <option>By Site</option>
                </select>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 hover:bg-slate-100">
                  <RefreshCcw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>

            <ul className="mt-3 divide-y divide-slate-100">
              <li className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 text-xs">
                        <Flag className="w-3.5 h-3.5" />
                        High
                      </span>
                      <span className="text-sm font-medium">PR-2024-184 • Avery Johnson</span>
                      <span className="text-xs text-slate-500">HQ — Floor 2</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">3 items • Wireless Keyboard x 5, Copy Paper x 10, Gel Pens x 24</div>
                  </div>
                  <div className="text-right min-w-[12rem]">
                    <div className="text-sm font-semibold">$1,248.00</div>
                    <div className="text-xs text-slate-500">Aging: 18h</div>
                    <div className="mt-2 inline-flex gap-2">
                      <button className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs text-white hover:bg-emerald-700">
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs hover:bg-slate-50">
                        <MessageSquare className="w-4 h-4" />
                        Request Changes
                      </button>
                    </div>
                  </div>
                </div>
              </li>

              <li className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 text-xs">
                        <Flag className="w-3.5 h-3.5" />
                        Medium
                      </span>
                      <span className="text-sm font-medium">PR-2024-185 • Jordan Lee</span>
                      <span className="text-xs text-slate-500">Warehouse A</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">2 items • Label Printer x 2, Shipping Labels x 20</div>
                  </div>
                  <div className="text-right min-w-[12rem]">
                    <div className="text-sm font-semibold">$732.10</div>
                    <div className="text-xs text-slate-500">Aging: 3h</div>
                    <div className="mt-2 inline-flex gap-2">
                      <button className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs text-white hover:bg-emerald-700">
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs hover:bg-slate-50">
                        <MessageSquare className="w-4 h-4" />
                        Request Changes
                      </button>
                    </div>
                  </div>
                </div>
              </li>

              <li className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 text-xs">
                        <Flag className="w-3.5 h-3.5" />
                        Low
                      </span>
                      <span className="text-sm font-medium">PR-2024-186 • Casey Patel</span>
                      <span className="text-xs text-slate-500">Remote</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-600">1 item • HDMI Cable x 3</div>
                  </div>
                  <div className="text-right min-w-[12rem]">
                    <div className="text-sm font-semibold">$24.00</div>
                    <div className="text-xs text-slate-500">Aging: 1h</div>
                    <div className="mt-2 inline-flex gap-2">
                      <button className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs text-white hover:bg-emerald-700">
                        <Check className="w-4 h-4" />
                        Approve
                      </button>
                      <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1.5 text-xs hover:bg-slate-50">
                        <MessageSquare className="w-4 h-4" />
                        Request Changes
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Low Stock Alerts</h3>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100">
                  <Settings2 className="w-4 h-4" />
                  Thresholds
                </button>
              </div>

              <ul className="mt-3 space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Copy Paper • A4</div>
                    <div className="text-xs text-slate-500">HQ — Floor 2</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">8 reams</div>
                    <button className="mt-1 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                      <ShoppingCart className="w-4 h-4" />
                      Reorder 12
                    </button>
                  </div>
                </li>

                <li className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Gel Pens • Blue</div>
                    <div className="text-xs text-slate-500">Warehouse A</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-amber-600">24 pcs</div>
                    <button className="mt-1 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                      <ShoppingCart className="w-4 h-4" />
                      Reorder 48
                    </button>
                  </div>
                </li>

                <li className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Coffee Pods</div>
                    <div className="text-xs text-slate-500">HQ — Pantry</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">30 pcs</div>
                    <button className="mt-1 inline-flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50">
                      <ShoppingCart className="w-4 h-4" />
                      Reorder 100
                    </button>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Supplier Performance</h3>
                <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700">On-time Delivery</div>
                  <div className="text-2xl font-semibold text-emerald-700 mt-1">96%</div>
                </div>
                <div className="rounded-lg bg-emerald-50 p-3">
                  <div className="text-xs text-emerald-700">Fill Rate</div>
                  <div className="text-2xl font-semibold text-emerald-700 mt-1">98%</div>
                </div>
                <div className="rounded-lg bg-amber-50 p-3">
                  <div className="text-xs text-amber-700">Quality Issues</div>
                  <div className="text-2xl font-semibold text-amber-700 mt-1">2.1%</div>
                </div>
              </div>

              <div className="mt-3 h-28 rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 grid place-items-center text-slate-500 text-sm">
                Performance chart placeholder
              </div>
            </div>
          </div>
        </section>

        {/* Spend & Activity */}
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Spend by Category</h3>
              <button className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-slate-100">
                <Sliders className="w-4 h-4" />
                Customize
              </button>
            </div>

            <div className="mt-3 h-64 rounded-lg bg-gradient-to-br from-indigo-50 to-violet-50 grid place-items-center text-slate-500 text-sm">
              Category spend chart placeholder
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Paper • $28k</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-violet-700">Electronics • $24k</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">Pantry • $14k</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">Cleaning • $8k</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">Recent Activity</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-medium">PO-10231</span> approved by <span className="font-medium">A. Johnson</span>
                  <div className="text-xs text-slate-500">2m ago</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <Truck className="w-4 h-4 mt-0.5 text-emerald-600" />
                <div>
                  <span className="font-medium">PO-10208</span> delivered by <span className="font-medium">FastSupplies</span>
                  <div className="text-xs text-slate-500">1h ago</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600" />
                <div>
                  Low stock: <span className="font-medium">Copy Paper</span> at HQ
                  <div className="text-xs text-slate-500">4h ago</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <UploadCloud className="w-4 h-4 mt-0.5 text-slate-600" />
                <div>
                  Catalog import completed (24 items)
                  <div className="text-xs text-slate-500">Yesterday</div>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
