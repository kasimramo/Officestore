export default function Reports() {
  return (
    <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="text-slate-600 mt-1">Track spending, usage patterns, and organizational insights</p>
      </div>

      {/* Time Period Selector */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-blue-100 text-emerald-700 rounded-md text-sm font-medium">
              Last 30 Days
            </button>
            <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium">
              Last Quarter
            </button>
            <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium">
              Last Year
            </button>
          </div>
          <button className="ml-auto bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors">
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <ReportCard
          title="Total Spending"
          value="$12,847"
          change="+23%"
          trend="up"
          description="vs. last month"
        />
        <ReportCard
          title="Active Requests"
          value="34"
          change="-12%"
          trend="down"
          description="vs. last month"
        />
        <ReportCard
          title="Items Purchased"
          value="156"
          change="+8%"
          trend="up"
          description="vs. last month"
        />
        <ReportCard
          title="Avg. Request Time"
          value="2.4 days"
          change="-15%"
          trend="down"
          description="vs. last month"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Spending Trend</h3>
          <div className="h-64 bg-slate-50 rounded-md flex items-center justify-center">
            <span className="text-slate-400">📊 Chart Placeholder</span>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Spending by Category</h3>
          <div className="h-64 bg-slate-50 rounded-md flex items-center justify-center">
            <span className="text-slate-400">🥧 Pie Chart Placeholder</span>
          </div>
        </div>
      </div>

      {/* Top Categories Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Top Categories This Month</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Requests
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Avg. per Request
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categoryData.map((category, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <span className="text-sm font-medium text-slate-900">{category.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    {category.requests}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                    ${category.totalSpent}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                    ${category.avgPerRequest}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      category.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {category.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function ReportCard({ title, value, change, trend, description }: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  description: string
}) {
  const changeColor = trend === 'up' ? 'text-green-600' : 'text-red-600'

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <div className="flex items-baseline space-x-2">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <span className={`text-sm font-medium ${changeColor}`}>
            {change}
          </span>
        </div>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}

const categoryData = [
  {
    name: 'Office Supplies',
    icon: '📝',
    requests: 24,
    totalSpent: '1,247',
    avgPerRequest: '52.00',
    change: '+12%'
  },
  {
    name: 'Furniture',
    icon: '🪑',
    requests: 8,
    totalSpent: '3,456',
    avgPerRequest: '432.00',
    change: '+8%'
  },
  {
    name: 'Electronics',
    icon: '💻',
    requests: 15,
    totalSpent: '2,890',
    avgPerRequest: '192.67',
    change: '-5%'
  },
  {
    name: 'Kitchen Supplies',
    icon: '☕',
    requests: 12,
    totalSpent: '234',
    avgPerRequest: '19.50',
    change: '+15%'
  },
]