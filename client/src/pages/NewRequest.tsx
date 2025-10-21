import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Search, Plus, Minus, ShoppingCart, AlertCircle, Package, Tag, ChevronRight, Check
} from 'lucide-react'
import { apiClient } from '../lib/api'

type CatalogueItem = {
  id: string
  name: string
  description?: string
  category_id: string
  unit: string
  cost_per_unit: string
  supplier?: string
  is_active: boolean
}

type Category = {
  id: string
  name: string
  description?: string
}

type Site = {
  id: string
  name: string
}

type Area = {
  id: string
  name: string
  siteId: string
}

type CartItem = {
  catalogueItem: CatalogueItem
  quantity: number
  notes?: string
}

export default function NewRequest() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)

  // Form data
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedSiteId, setSelectedSiteId] = useState('')
  const [selectedAreaId, setSelectedAreaId] = useState('')
  const [requestNotes, setRequestNotes] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')

  // Master data
  const [sites, setSites] = useState<Site[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [catalogueItems, setCatalogueItems] = useState<CatalogueItem[]>([])

  // Search and cart
  const [searchTerm, setSearchTerm] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Load master data
  useEffect(() => {
    fetchMasterData()
  }, [])

  // Load catalogue items when category changes
  useEffect(() => {
    if (selectedCategoryId) {
      fetchCatalogueItems()
    }
  }, [selectedCategoryId])

  const fetchMasterData = async () => {
    try {
      const [sitesRes, areasRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/sites'),
        apiClient.get('/api/areas'),
        apiClient.get('/api/categories'),
      ])
      setSites(sitesRes.data || [])
      setAreas(areasRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (err: any) {
      console.error('Error fetching master data:', err)
      setError('Failed to load form data')
    }
  }

  const fetchCatalogueItems = async () => {
    try {
      const params = new URLSearchParams()
      params.append('category_id', selectedCategoryId)
      params.append('status', 'active')
      const response = await apiClient.get(`/api/catalogue?${params.toString()}`)
      setCatalogueItems(response.data || [])
    } catch (err: any) {
      console.error('Error fetching catalogue items:', err)
    }
  }

  const addToCart = (item: CatalogueItem) => {
    const existing = cart.find((c) => c.catalogueItem.id === item.id)
    if (existing) {
      setCart(
        cart.map((c) =>
          c.catalogueItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      )
    } else {
      setCart([...cart, { catalogueItem: item, quantity: 1 }])
    }
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
    } else {
      setCart(cart.map((c) => (c.catalogueItem.id === itemId ? { ...c, quantity } : c)))
    }
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((c) => c.catalogueItem.id !== itemId))
  }

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart(cart.map((c) => (c.catalogueItem.id === itemId ? { ...c, notes } : c)))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const cost = parseFloat(item.catalogueItem.cost_per_unit || '0')
      return sum + cost * item.quantity
    }, 0)
  }

  const hasItemsWithoutPrice = () => {
    return cart.some(item => !item.catalogueItem.cost_per_unit || isNaN(parseFloat(item.catalogueItem.cost_per_unit)))
  }

  const formatPrice = (price: string | undefined | null) => {
    if (!price || isNaN(parseFloat(price))) {
      return null
    }
    return parseFloat(price)
  }

  const getItemTotal = (item: CartItem) => {
    const price = formatPrice(item.catalogueItem.cost_per_unit)
    if (price === null) return null
    return price * item.quantity
  }

  const handleNext = () => {
    setError(null)

    if (currentStep === 1 && !selectedCategoryId) {
      setError('Please select a category')
      return
    }

    if (currentStep === 2) {
      if (!selectedSiteId || !selectedAreaId) {
        setError('Please select both site and area')
        return
      }
    }

    if (currentStep === 3 && cart.length === 0) {
      setError('Please add at least one item to your cart')
      return
    }

    setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    setError(null)
    setCurrentStep(currentStep - 1)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      setError(null)

      const requestData = {
        site_id: selectedSiteId,
        area_id: selectedAreaId,
        priority,
        notes: requestNotes || undefined,
        items: cart.map((item) => ({
          catalogue_item_id: item.catalogueItem.id,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      }

      await apiClient.post('/api/requests', requestData)
      navigate('/requests')
    } catch (err: any) {
      console.error('Error creating request:', err)
      setError(err.response?.data?.error?.message || 'Failed to create request')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setCart([]) // Clear cart when changing category
  }

  // Filter catalogue items by search
  const filteredItems = catalogueItems.filter((item) => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      item.name.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.supplier?.toLowerCase().includes(search)
    )
  })

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId)
  const selectedSite = sites.find((s) => s.id === selectedSiteId)
  const selectedArea = areas.find((a) => a.id === selectedAreaId)

  const steps = [
    { number: 1, title: 'Category', completed: !!selectedCategoryId },
    { number: 2, title: 'Location', completed: !!(selectedSiteId && selectedAreaId) },
    { number: 3, title: 'Items', completed: cart.length > 0 },
    { number: 4, title: 'Review', completed: false },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Compact Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/requests')}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-slate-900">New Request</h1>
                <p className="text-xs text-slate-500">Step {currentStep} of 4</p>
              </div>
            </div>
            {/* Compact Progress Indicator */}
            <div className="flex items-center gap-1.5">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentStep === step.number
                      ? 'bg-emerald-600 w-6'
                      : step.completed
                      ? 'bg-emerald-300'
                      : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Error Alert */}
        {error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Select Category */}
        {currentStep === 1 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-center mb-4">
              <h2 className="text-base font-semibold text-slate-900 mb-1">Select Category</h2>
              <p className="text-xs text-slate-600">
                All items in a request must be from the same category
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`p-3 border-2 rounded-lg transition-all text-center ${
                    selectedCategoryId === category.id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <Tag
                    className={`w-5 h-5 mx-auto mb-1.5 ${
                      selectedCategoryId === category.id ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      selectedCategoryId === category.id ? 'text-emerald-900' : 'text-slate-900'
                    }`}
                  >
                    {category.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Site & Area */}
        {currentStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <ChevronRight className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Select Location</h2>
                <p className="text-slate-600">Choose the site and area for this request</p>
                {selectedCategory && (
                  <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full">
                    <Tag className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">{selectedCategory.name}</span>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Site Selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Site <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    {sites.map((site) => (
                      <button
                        key={site.id}
                        onClick={() => {
                          setSelectedSiteId(site.id)
                          setSelectedAreaId('') // Reset area when site changes
                        }}
                        className={`p-4 border-2 rounded-lg text-left transition-all ${
                          selectedSiteId === site.id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-medium ${
                              selectedSiteId === site.id ? 'text-emerald-900' : 'text-slate-900'
                            }`}
                          >
                            {site.name}
                          </span>
                          {selectedSiteId === site.id && (
                            <Check className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Area Selection */}
                {selectedSiteId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Area <span className="text-red-500">*</span>
                    </label>
                    {areas.filter((area) => area.siteId === selectedSiteId).length === 0 ? (
                      <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <p className="text-sm text-slate-600">No areas found for this site</p>
                        <p className="text-xs text-slate-500 mt-1">Please contact your administrator to create areas for this site</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {areas
                          .filter((area) => area.siteId === selectedSiteId)
                          .map((area) => (
                          <button
                            key={area.id}
                            onClick={() => setSelectedAreaId(area.id)}
                            className={`p-4 border-2 rounded-lg text-left transition-all ${
                              selectedAreaId === area.id
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-slate-200 hover:border-emerald-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`font-medium ${
                                  selectedAreaId === area.id ? 'text-emerald-900' : 'text-slate-900'
                                }`}
                              >
                                {area.name}
                              </span>
                              {selectedAreaId === area.id && (
                                <Check className="w-5 h-5 text-emerald-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Add Items */}
        {currentStep === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Items Selection */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Select Items</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Add items from {selectedCategory?.name} category
                    </p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-600">No items found</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {filteredItems.map((item) => {
                      const inCart = cart.find((c) => c.catalogueItem.id === item.id)
                      return (
                        <div
                          key={item.id}
                          className={`border rounded-lg p-4 transition-all ${
                            inCart
                              ? 'border-emerald-300 bg-emerald-50'
                              : 'border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-sm font-medium text-slate-900">{item.name}</h3>
                              {item.description && (
                                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                                <span className="font-medium">
                                  {formatPrice(item.cost_per_unit) !== null
                                    ? `$${item.cost_per_unit} / ${item.unit}`
                                    : <span className="text-amber-600">Price not set</span>
                                  }
                                </span>
                                {item.supplier && <span>• {item.supplier}</span>}
                              </div>
                            </div>
                            <button
                              onClick={() => addToCart(item)}
                              className="ml-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                              title="Add to cart"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          {inCart && (
                            <div className="mt-3 pt-3 border-t border-emerald-200">
                              <p className="text-xs text-emerald-700 font-medium">
                                ✓ In cart: {inCart.quantity} {item.unit}(s)
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Cart */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-200 rounded-lg p-6 sticky top-24">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Cart ({cart.length})</h2>
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.catalogueItem.id} className="border border-slate-200 rounded-lg p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">
                                {item.catalogueItem.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatPrice(item.catalogueItem.cost_per_unit) !== null
                                  ? `$${item.catalogueItem.cost_per_unit} / ${item.catalogueItem.unit}`
                                  : <span className="text-amber-600">Price not set</span>
                                }
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.catalogueItem.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.catalogueItem.id, item.quantity - 1)}
                              className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.catalogueItem.id, parseInt(e.target.value) || 1)
                              }
                              className="w-16 px-2 py-1 border border-slate-200 rounded text-center"
                              min="1"
                            />
                            <button
                              onClick={() => updateQuantity(item.catalogueItem.id, item.quantity + 1)}
                              className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50"
                            >
                              +
                            </button>
                            <span className="ml-auto text-sm font-medium text-slate-900">
                              {(() => {
                                const total = getItemTotal(item)
                                return total !== null ? `$${total.toFixed(2)}` : <span className="text-amber-600 text-xs">TBD</span>
                              })()}
                            </span>
                          </div>
                          <textarea
                            value={item.notes || ''}
                            onChange={(e) => updateItemNotes(item.catalogueItem.id, e.target.value)}
                            placeholder="Item notes (optional)"
                            rows={2}
                            className="mt-2 w-full px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <div className="flex items-center justify-between text-lg font-semibold text-slate-900">
                        <span>Total</span>
                        <span>
                          {hasItemsWithoutPrice() ? (
                            <span className="text-amber-600 text-sm">To be confirmed</span>
                          ) : (
                            `$${calculateTotal().toFixed(2)}`
                          )}
                        </span>
                      </div>
                      {hasItemsWithoutPrice() && (
                        <p className="text-xs text-amber-600 mt-2">
                          * Some items don't have prices set
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {currentStep === 4 && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-lg p-8">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Review Request</h2>
                <p className="text-slate-600">Please review your request before submitting</p>
              </div>

              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Category</p>
                    <p className="text-slate-900">{selectedCategory?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Location</p>
                    <p className="text-slate-900">
                      {selectedSite?.name} / {selectedArea?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Items</p>
                    <p className="text-slate-900">{cart.length} item(s)</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Total Value</p>
                    <p className="text-lg font-semibold text-emerald-600">
                      {hasItemsWithoutPrice() ? (
                        <span className="text-amber-600">To be confirmed</span>
                      ) : (
                        `$${calculateTotal().toFixed(2)}`
                      )}
                    </p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Items</h3>
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-200">
                    {cart.map((item) => (
                      <div key={item.catalogueItem.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.catalogueItem.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatPrice(item.catalogueItem.cost_per_unit) !== null
                              ? `$${item.catalogueItem.cost_per_unit} × ${item.quantity} ${item.catalogueItem.unit}`
                              : `Price not set × ${item.quantity} ${item.catalogueItem.unit}`
                            }
                          </p>
                          {item.notes && (
                            <p className="text-xs text-slate-600 mt-1 italic">Note: {item.notes}</p>
                          )}
                        </div>
                        <p className="text-sm font-medium text-slate-900">
                          {(() => {
                            const total = getItemTotal(item)
                            return total !== null ? `$${total.toFixed(2)}` : <span className="text-amber-600">TBD</span>
                          })()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Request Notes (Optional)
                    </label>
                    <textarea
                      value={requestNotes}
                      onChange={(e) => setRequestNotes(e.target.value)}
                      rows={3}
                      placeholder="Add any additional information..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="max-w-7xl mx-auto mt-8 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Request'}
              <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
