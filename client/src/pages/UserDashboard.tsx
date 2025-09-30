import { useState } from 'react'

type StockItem = {
  id: string
  name: string
  category: string
  currentStock: number
  unit: string
  minStock: number
  lastUpdated: string
}

type UserRequest = {
  id: string
  items: { name: string; quantity: number; unit: string }[]
  status: 'PENDING' | 'APPROVED' | 'FULFILLED' | 'REJECTED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  requestedDate: string
  notes?: string
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState<'requests' | 'stock'>('requests')
  const [showNewRequest, setShowNewRequest] = useState(false)

  // Mock data - in real app this would come from API based on user's site/area access
  const [requests] = useState<UserRequest[]>([
    {
      id: '1',
      items: [
        { name: 'Coffee Pods', quantity: 50, unit: 'pieces' },
        { name: 'Paper Towels', quantity: 10, unit: 'rolls' }
      ],
      status: 'PENDING',
      priority: 'MEDIUM',
      requestedDate: '2024-01-28',
      notes: 'Kitchen supplies running low'
    },
    {
      id: '2',
      items: [
        { name: 'Printer Paper', quantity: 5, unit: 'reams' }
      ],
      status: 'FULFILLED',
      priority: 'LOW',
      requestedDate: '2024-01-25'
    }
  ])

  const [stockItems] = useState<StockItem[]>([
    {
      id: '1',
      name: 'Coffee Pods',
      category: 'Pantry',
      currentStock: 25,
      unit: 'pieces',
      minStock: 50,
      lastUpdated: '2024-01-27'
    },
    {
      id: '2',
      name: 'Paper Towels',
      category: 'Cleaning',
      currentStock: 8,
      unit: 'rolls',
      minStock: 12,
      lastUpdated: '2024-01-26'
    },
    {
      id: '3',
      name: 'Printer Paper',
      category: 'Office Supplies',
      currentStock: 15,
      unit: 'reams',
      minStock: 10,
      lastUpdated: '2024-01-28'
    }
  ])

  const lowStockItems = stockItems.filter(item => item.currentStock <= item.minStock)
  const pendingRequests = requests.filter(req => req.status === 'PENDING')

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Requests</p>
                <p className="text-2xl font-bold text-orange-600">{pendingRequests.length}</p>
              </div>
              <div className="text-orange-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
              <div className="text-red-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{requests.length}</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'requests'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Requests
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex-1 px-6 py-4 text-sm font-medium ${
                activeTab === 'stock'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Stock Levels
            </button>
          </div>

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">My Requests</h3>
                <button
                  onClick={() => setShowNewRequest(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  New Request
                </button>
              </div>

              <div className="space-y-4">
                {requests.map((request) => (
                  <div key={request.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {request.status}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {request.items.map((item, index) => (
                            <div key={index} className="text-sm text-slate-700">
                              {item.quantity} {item.unit} of {item.name}
                            </div>
                          ))}
                        </div>
                        {request.notes && (
                          <p className="text-sm text-slate-600 mt-2">Note: {request.notes}</p>
                        )}
                      </div>
                      <div className="text-right text-sm text-slate-500">
                        {new Date(request.requestedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock Tab */}
          {activeTab === 'stock' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-slate-900">Stock Levels</h3>
                <div className="text-sm text-slate-600">
                  Last updated: {new Date().toLocaleDateString()}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Current Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Min Stock</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {stockItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4 text-sm font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{item.category}</td>
                        <td className="px-4 py-4 text-sm text-slate-900">
                          {item.currentStock} {item.unit}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">
                          {item.minStock} {item.unit}
                        </td>
                        <td className="px-4 py-4">
                          {item.currentStock <= item.minStock ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <button className="text-blue-600 hover:text-blue-900 mr-2">Update Count</button>
                          {item.currentStock <= item.minStock && (
                            <button className="text-orange-600 hover:text-orange-900">Request More</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequest && (
        <NewRequestModal onClose={() => setShowNewRequest(false)} />
      )}
    </div>
  )
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'bg-orange-100 text-orange-800'
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800'
    case 'FULFILLED':
      return 'bg-green-100 text-green-800'
    case 'REJECTED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800'
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800'
    case 'LOW':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function NewRequestModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    items: [{ name: '', quantity: 1, unit: '' }],
    priority: 'MEDIUM',
    notes: ''
  })

  const availableItems = [
    { name: 'Coffee Pods', unit: 'pieces' },
    { name: 'Paper Towels', unit: 'rolls' },
    { name: 'Printer Paper', unit: 'reams' },
    { name: 'Cleaning Supplies', unit: 'bottles' },
    { name: 'Pens', unit: 'pieces' }
  ]

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, unit: '' }]
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    })
  }

  const updateItem = (index: number, field: string, value: string | number) => {
    const updatedItems = formData.items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    )
    setFormData({ ...formData, items: updatedItems })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle request submission
    console.log('New request:', formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">New Request</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Items Requested</label>
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <select
                    value={item.name}
                    onChange={(e) => {
                      const selectedItem = availableItems.find(ai => ai.name === e.target.value)
                      updateItem(index, 'name', e.target.value)
                      if (selectedItem) {
                        updateItem(index, 'unit', selectedItem.unit)
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select item</option>
                    {availableItems.map(ai => (
                      <option key={ai.name} value={ai.name}>{ai.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    min="1"
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={item.unit}
                    readOnly
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md text-sm bg-slate-50"
                  />
                  {formData.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                + Add another item
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low - When convenient</option>
                <option value="MEDIUM">Medium - Within a week</option>
                <option value="HIGH">High - Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information about this request"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.items[0].name}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}