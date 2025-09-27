export default function Organization() {
  return (
    <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Organization</h1>
        <p className="text-slate-600 mt-1">Manage your organization settings, sites, and team members</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button className="border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
            Overview
          </button>
          <button className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
            Sites & Areas
          </button>
          <button className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
            Team Members
          </button>
          <button className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm">
            Settings
          </button>
        </nav>
      </div>

      {/* Organization Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Organization Info */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Organization Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value="Acme Corporation"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Industry
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Manufacturing</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value="123 Business Ave, Suite 100, New York, NY 10001"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-4 pt-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                Save Changes
              </button>
              <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Total Sites</span>
                <span className="text-sm font-medium text-slate-900">8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Active Areas</span>
                <span className="text-sm font-medium text-slate-900">24</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Team Members</span>
                <span className="text-sm font-medium text-slate-900">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Monthly Budget</span>
                <span className="text-sm font-medium text-slate-900">$50,000</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Sites</h3>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Add New Site
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      </div>

      {/* Recent Team Activity */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Team Activity</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900">
                  <span className="font-medium">{activity.user}</span> {activity.action}
                </p>
                <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SiteCard({ site }: { site: any }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-medium text-slate-900">{site.name}</h4>
          <p className="text-sm text-slate-600">{site.address}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          site.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {site.status}
        </span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Areas:</span>
          <span className="text-slate-900">{site.areas}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600">Employees:</span>
          <span className="text-slate-900">{site.employees}</span>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          View Areas
        </button>
        <button className="bg-slate-100 text-slate-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors">
          Edit
        </button>
      </div>
    </div>
  )
}

const sites = [
  { id: 1, name: 'Headquarters', address: 'New York, NY', areas: 8, employees: 45, status: 'active' },
  { id: 2, name: 'West Coast Office', address: 'San Francisco, CA', areas: 6, employees: 32, status: 'active' },
  { id: 3, name: 'Manufacturing Plant', address: 'Detroit, MI', areas: 12, employees: 78, status: 'active' },
  { id: 4, name: 'R&D Center', address: 'Austin, TX', areas: 4, employees: 23, status: 'active' },
]

const recentActivity = [
  { user: 'Sarah Chen', action: 'added new area "Conference Room B" to Headquarters', time: '2 hours ago' },
  { user: 'Mike Johnson', action: 'updated West Coast Office employee count', time: '4 hours ago' },
  { user: 'Emily Davis', action: 'created new site "Remote Office"', time: '1 day ago' },
  { user: 'John Doe', action: 'modified R&D Center settings', time: '2 days ago' },
]