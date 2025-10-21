import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, Clock, CheckCircle, XCircle, Package, ChevronDown, Eye, Check, X, User
} from 'lucide-react'
import { apiClient } from '../lib/api'
import { usePermissions } from '../hooks/usePermissions'

type ApprovalLevel = {
  id: string
  level_order: number
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING'
  approved_by?: string
  approved_at?: string
  rejection_reason?: string
  comments?: string
  role_name?: string
  approver_name?: string
}

type Request = {
  id: string
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  notes?: string
  requested_by_date?: string
  approved_at?: string
  fulfilled_at?: string
  created_at: string
  requester: {
    id: string
    username: string
    firstName: string
    lastName: string
  }
  site: {
    id: string
    name: string
  }
  area: {
    id: string
    name: string
  }
  items: Array<{
    id: string
    quantity: number
    catalogueItem: {
      id: string
      name: string
      unit: string
      costPerUnit: string
    }
  }>
  totalValue: string
  workflow?: {
    id: string
    name: string
    approvalLevels?: ApprovalLevel[]
  }
}

export default function Requests() {
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      const response = await apiClient.get(`/api/requests?${params.toString()}`)
      setRequests(response.data || [])
    } catch (err: any) {
      console.error('Error fetching requests:', err)
      setError(err.message || 'Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchRequestDetails = async (requestId: string) => {
    try {
      setLoadingDetails(true)
      const response = await apiClient.get(`/api/requests/${requestId}`)
      setSelectedRequest(response.data)
    } catch (err: any) {
      console.error('Error fetching request details:', err)
      alert('Failed to load request details')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      await apiClient.post(`/api/requests/${requestId}/approve`)
      await fetchRequests()
      setSelectedRequest(null)
    } catch (err: any) {
      console.error('Error approving request:', err)
      alert(err.response?.data?.error?.message || 'Failed to approve request')
    }
  }

  const handleReject = async (requestId: string) => {
    const notes = prompt('Reason for rejection:')
    if (!notes) return

    try {
      await apiClient.post(`/api/requests/${requestId}/reject`, { notes })
      await fetchRequests()
      setSelectedRequest(null)
    } catch (err: any) {
      console.error('Error rejecting request:', err)
      alert(err.response?.data?.error?.message || 'Failed to reject request')
    }
  }

  const handleFulfill = async (requestId: string) => {
    try {
      await apiClient.post(`/api/requests/${requestId}/fulfill`)
      await fetchRequests()
      setSelectedRequest(null)
    } catch (err: any) {
      console.error('Error fulfilling request:', err)
      alert(err.response?.data?.error?.message || 'Failed to fulfill request')
    }
  }

  // Filter requests by search term
  const filteredRequests = requests.filter((req) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      req.id.toLowerCase().includes(search) ||
      `${req.requester.firstName} ${req.requester.lastName}`.toLowerCase().includes(search) ||
      req.site.name.toLowerCase().includes(search) ||
      req.items.some((item) => item.catalogueItem.name.toLowerCase().includes(search))
    )
  })

  // Count by status
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
    fulfilled: requests.filter((r) => r.status === 'fulfilled').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Requests</h1>
              <p className="text-sm text-slate-600">Track and manage procurement requests</p>
            </div>
            <button
              onClick={() => navigate('/requests/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'fulfilled', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)} ({counts[status]})
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-2 text-slate-600">Loading requests...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-900 mb-2">No requests yet</p>
            <p className="text-sm text-slate-600 mb-4">Get started by creating your first request</p>
            <button
              onClick={() => navigate('/requests/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Your First Request
            </button>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No requests match your search</p>
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
              }}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium text-sm"
            >
              Clear filters
            </button>
          </div>
        ) : (
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
                      Site/Area
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredRequests.map((request) => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      onView={() => fetchRequestDetails(request.id)}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      onFulfill={handleFulfill}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onFulfill={handleFulfill}
        />
      )}
    </div>
  )
}

function RequestRow({
  request,
  onView,
  onApprove,
  onReject,
  onFulfill,
}: {
  request: Request
  onView: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onFulfill: (id: string) => void
}) {
  const { hasPermission } = usePermissions()

  const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
    pending: { bg: 'bg-orange-100', text: 'text-orange-700', icon: Clock },
    approved: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle },
    fulfilled: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Package },
  }

  const config = statusConfig[request.status]
  const StatusIcon = config.icon

  return (
    <tr className="hover:bg-slate-50 cursor-pointer" onClick={onView}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-slate-900">#{request.id.slice(0, 8)}</div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-slate-900">{request.items.length} item(s)</div>
        <div className="text-sm text-slate-500 truncate max-w-xs">
          {request.items[0]?.catalogueItem.name}
          {request.items.length > 1 && ` +${request.items.length - 1} more`}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">
          {request.requester.firstName} {request.requester.lastName}
        </div>
        <div className="text-sm text-slate-500">@{request.requester.username}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-slate-900">{request.site.name}</div>
        <div className="text-sm text-slate-500">{request.area.name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
          <StatusIcon className="w-3 h-3" />
          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
        {request.totalValue && !isNaN(parseFloat(request.totalValue)) && parseFloat(request.totalValue) > 0
          ? `$${request.totalValue}`
          : <span className="text-amber-600 text-xs">TBD</span>
        }
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
        {new Date(request.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onView}
          className="text-emerald-600 hover:text-emerald-700 font-medium mr-3"
        >
          View
        </button>
        {request.status === 'pending' && hasPermission('requests.approve_requests') && (
          <button
            onClick={() => onApprove(request.id)}
            className="text-green-600 hover:text-green-700 font-medium mr-3"
          >
            Approve
          </button>
        )}
        {request.status === 'approved' && hasPermission('requests.fulfill_requests') && (
          <button
            onClick={() => onFulfill(request.id)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Fulfill
          </button>
        )}
      </td>
    </tr>
  )
}

function RequestDetailsModal({
  request,
  onClose,
  onApprove,
  onReject,
  onFulfill,
}: {
  request: Request
  onClose: () => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onFulfill: (id: string) => void
}) {
  const { hasPermission } = usePermissions()

  const statusConfig: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-orange-100', text: 'text-orange-700' },
    approved: { bg: 'bg-green-100', text: 'text-green-700' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700' },
    fulfilled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  }

  const config = statusConfig[request.status]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Request Details</h2>
              <p className="text-sm text-slate-600">#{request.id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${config.bg} ${config.text}`}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Total Value</label>
              <p className="text-lg font-semibold text-slate-900">
                {request.totalValue && !isNaN(parseFloat(request.totalValue)) && parseFloat(request.totalValue) > 0
                  ? `$${request.totalValue}`
                  : <span className="text-amber-600">To be confirmed</span>
                }
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Requester</label>
              <p className="text-sm text-slate-900">
                {request.requester.firstName} {request.requester.lastName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site/Area</label>
              <p className="text-sm text-slate-900">
                {request.site.name} / {request.area.name}
              </p>
            </div>
          </div>

          {/* Items */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Requested Items</label>
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
              {request.items.map((item) => {
                const hasPrice = item.catalogueItem.costPerUnit && !isNaN(parseFloat(item.catalogueItem.costPerUnit))
                const itemTotal = hasPrice ? (parseFloat(item.catalogueItem.costPerUnit) * item.quantity).toFixed(2) : null

                return (
                  <div key={item.id} className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{item.catalogueItem.name}</p>
                      <p className="text-xs text-slate-500">
                        {hasPrice
                          ? `$${item.catalogueItem.costPerUnit} per ${item.catalogueItem.unit}`
                          : <span className="text-amber-600">Price not set</span>
                        }
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-900">x{item.quantity}</p>
                      <p className="text-xs text-slate-500">
                        {itemTotal !== null ? `$${itemTotal}` : <span className="text-amber-600">TBD</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          {request.notes && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">{request.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-xs text-slate-500">
            <div>
              <span className="font-medium">Created:</span>{' '}
              {new Date(request.created_at).toLocaleString()}
            </div>
            {request.approved_at && (
              <div>
                <span className="font-medium">Approved:</span>{' '}
                {new Date(request.approved_at).toLocaleString()}
              </div>
            )}
            {request.fulfilled_at && (
              <div>
                <span className="font-medium">Fulfilled:</span>{' '}
                {new Date(request.fulfilled_at).toLocaleString()}
              </div>
            )}
          </div>

          {/* Approval Workflow */}
          {request.workflow && request.workflow.approvalLevels && request.workflow.approvalLevels.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Approval Workflow: {request.workflow.name}
              </label>
              <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                {request.workflow.approvalLevels.map((level, index) => {
                  const statusConfig = {
                    PENDING: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending' },
                    APPROVED: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
                    REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected' },
                    AWAITING: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Awaiting' },
                  };
                  const config = statusConfig[level.status] || statusConfig.AWAITING;

                  return (
                    <div key={level.id} className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium text-sm">
                            {level.level_order}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{level.role_name || 'Unknown Role'}</p>
                            {level.approver_name && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-slate-600">
                                <User className="w-3 h-3" />
                                <span>{level.approver_name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
                          {config.label}
                        </span>
                      </div>

                      {level.approved_at && (
                        <div className="mt-2 text-xs text-slate-500">
                          <span className="font-medium">
                            {level.status === 'APPROVED' ? 'Approved' : 'Rejected'} on:
                          </span>{' '}
                          {new Date(level.approved_at).toLocaleString()}
                        </div>
                      )}

                      {level.comments && (
                        <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                          <span className="font-medium">Comments:</span> {level.comments}
                        </div>
                      )}

                      {level.rejection_reason && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                          <span className="font-medium">Rejection Reason:</span> {level.rejection_reason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
          {request.status === 'pending' && (
            <>
              {hasPermission('requests.reject_requests') && (
                <button
                  onClick={() => onReject(request.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reject
                </button>
              )}
              {hasPermission('requests.approve_requests') && (
                <button
                  onClick={() => onApprove(request.id)}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Approve
                </button>
              )}
            </>
          )}
          {request.status === 'approved' && hasPermission('requests.fulfill_requests') && (
            <button
              onClick={() => onFulfill(request.id)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark as Fulfilled
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
