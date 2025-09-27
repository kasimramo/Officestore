import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white w-10 h-10 font-bold text-lg">OS</span>
            <span className="font-bold text-xl text-slate-900">OfficeStore</span>
          </div>
          <Link
            to="/login"
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-8">
          {/* Logo Large */}
          <div className="flex justify-center">
            <span className="inline-flex items-center justify-center rounded-2xl bg-blue-600 text-white w-24 h-24 font-bold text-4xl shadow-lg">OS</span>
          </div>

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-900">
              Welcome to <span className="text-blue-600">OfficeStore</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Your comprehensive pantry and office supplies management system.
              Streamline procurement, track inventory, and manage requests across your organization.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
            >
              Get Started
            </Link>
            <button className="text-slate-600 hover:text-slate-900 px-8 py-3 rounded-lg text-lg font-medium transition-colors">
              Learn More
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            icon="📦"
            title="Inventory Management"
            description="Track stock levels, manage catalogs, and get alerts for low inventory across all locations."
          />
          <FeatureCard
            icon="📋"
            title="Request Workflow"
            description="Streamlined approval process for procurement requests with multi-level authorization."
          />
          <FeatureCard
            icon="📊"
            title="Analytics & Reports"
            description="Comprehensive reporting on spending, usage patterns, and organizational insights."
          />
          <FeatureCard
            icon="🏢"
            title="Multi-Site Support"
            description="Manage multiple office locations and areas with centralized oversight and control."
          />
          <FeatureCard
            icon="👥"
            title="Team Collaboration"
            description="Role-based access control with procurement managers, approvers, and staff users."
          />
          <FeatureCard
            icon="⚡"
            title="Enterprise Ready"
            description="Scalable architecture with audit trails, compliance features, and data security."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-24">
        <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-600">
            <p>&copy; 2024 OfficeStore. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: {
  icon: string
  title: string
  description: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>
  )
}