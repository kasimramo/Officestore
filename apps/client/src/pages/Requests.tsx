export default function Requests() {
  return (
    <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Requests</h1>
          <p className="text-slate-600 mt-1">Track and manage procurement requests</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-sm font-medium">
              All (12)
            </button>
            <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium">
              Pending (8)
            </button>
            <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium">
              Approved (3)
            </button>
            <button className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-sm font-medium">
              Fulfilled (1)
            </button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              placeholder="Search requests..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Requester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {requests.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RequestRow({ request }: { request: any }) {
  const statusColors = {
    pending: 'bg-orange-100 text-orange-700',
    approved: 'bg-green-100 text-green-700',
    fulfilled: 'bg-blue-100 text-blue-700',
    rejected: 'bg-red-100 text-red-700'
  }

  return (
    <tr className="hover:bg-slate-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">#{request.id}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-900">
          {request.items.length} item(s)
        </div>
        <div className="text-sm text-slate-500">
          {request.items[0]?.name}
          {request.items.length > 1 && ` +${request.items.length - 1} more`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">{request.requester}</div>
        <div className="text-sm text-slate-500">{request.department}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[request.status]}`}>
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {request.date}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
        ${request.total}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
        <button className="text-blue-600 hover:text-blue-700 font-medium mr-3">
          View
        </button>
        {request.status === 'pending' && (
          <button className="text-green-600 hover:text-green-700 font-medium">
            Approve
          </button>
        )}
      </td>
    </tr>
  )
}

const requests = [
  {
    id: 'REQ-2024-001',
    items: [{ name: 'Wireless Mouse' }, { name: 'Keyboard' }],
    requester: 'Sarah Chen',
    department: 'Marketing',
    status: 'pending',
    date: '2024-01-15',
    total: '89.98'
  },
  {
    id: 'REQ-2024-002',
    items: [{ name: 'Office Chair' }],
    requester: 'John Doe',
    department: 'Engineering',
    status: 'approved',
    date: '2024-01-14',
    total: '299.99'
  },
  {
    id: 'REQ-2024-003',
    items: [{ name: 'Printer Paper' }, { name: 'Notebooks' }],
    requester: 'Mike Johnson',
    department: 'Operations',
    status: 'fulfilled',
    date: '2024-01-13',
    total: '28.98'
  },
  {
    id: 'REQ-2024-004',
    items: [{ name: 'Standing Desk' }],
    requester: 'Emily Davis',
    department: 'Design',
    status: 'pending',
    date: '2024-01-12',
    total: '199.99'
  },
]