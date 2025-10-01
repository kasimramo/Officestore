import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Grid3x3, List, Search, Filter, ChevronDown, ChevronRight, Package, Tag, Upload, Link, Edit, Power, PowerOff, X, Save } from 'lucide-react'
import { apiClient } from '../lib/api.ts'


// Helper function to handle queries - let apiClient handle refresh automatically
async function queryWithRefresh<T>(queryFn: () => Promise<T>): Promise<T> {
  try {
    return await queryFn()
  } catch (error: any) {
    // The apiClient already handles token refresh internally,
    // so if we still get an error here, it means refresh also failed
    console.error('Query failed after token refresh attempt:', error)
    throw error
  }
}

interface Category {
  id: string
  name: string
  description?: string
  is_active: boolean
}

interface CatalogItem {
  id: string
  name: string
  description?: string
  category_id?: string
  category_name?: string
  unit: string
  cost_per_unit?: string
  supplier?: string
  minimum_stock?: number
  is_active: boolean
  image_url?: string
}

type ViewMode = 'card' | 'list'

export default function Catalog() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('card')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [showEditItemForm, setShowEditItemForm] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => queryWithRefresh(async () => {
      const result = await apiClient.getCategories()
      return result.data as Category[]
    }),
    retry: false // Let our wrapper handle retries
  })

  // Fetch catalog items
  const { data: catalogItems = [], isLoading } = useQuery({
    queryKey: ['catalog-items', searchTerm, selectedCategory, statusFilter],
    queryFn: () => queryWithRefresh(async () => {
      const params: { search?: string; category_id?: string; status?: string } = {}
      if (searchTerm) params.search = searchTerm
      if (selectedCategory) params.category_id = selectedCategory
      if (statusFilter) params.status = statusFilter

      const result = await apiClient.getCatalogueItems(params)
      return result.data as CatalogItem[]
    }),
    retry: false // Let our wrapper handle retries
  })

  // Update catalog item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CatalogItem> }) => {
      const result = await apiClient.updateCatalogueItem(id, data)
      return result.data as CatalogItem
    },
    onSuccess: (updatedItem) => {
      // Invalidate all catalog-items queries regardless of parameters
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] })
      // Force immediate refetch to show updated data
      queryClient.refetchQueries({ queryKey: ['catalog-items'] })
    }
  })

  // Toggle item status mutation
  const toggleItemStatusMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await apiClient.toggleCatalogueItemStatus(id)
      return result.data as CatalogItem
    },
    onSuccess: () => {
      // Invalidate all catalog-items queries regardless of parameters
      queryClient.invalidateQueries({ queryKey: ['catalog-items'] })
      // Force immediate refetch to show updated data
      queryClient.refetchQueries({ queryKey: ['catalog-items'] })
    }
  })

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // Group items by category
  const groupedItems = catalogItems.reduce((acc, item) => {
    const categoryId = item.category_id || 'uncategorized'
    const categoryName = item.category_name || 'Uncategorized'

    if (!acc[categoryId]) {
      acc[categoryId] = {
        categoryId,
        categoryName,
        items: []
      }
    }
    acc[categoryId].items.push(item)
    return acc
  }, {} as Record<string, { categoryId: string; categoryName: string; items: CatalogItem[] }>)

  // Auto-expand categories when data loads (only once)
  useEffect(() => {
    if (catalogItems.length > 0 && expandedCategories.size === 0) {
      const categoryIds = Object.keys(groupedItems)
      setExpandedCategories(new Set(categoryIds))
    }
  }, [catalogItems.length, groupedItems])

  return (
    <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalog</h1>
          <p className="text-slate-600 mt-1">Manage your office supplies and equipment catalog</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Category
          </button>
          <button
            onClick={() => setShowItemForm(true)}
            className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Item
          </button>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 items-center flex-1">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search catalog items..."
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-100 rounded-md p-1">
            <button
              onClick={() => setViewMode('card')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'card'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid3x3 size={16} />
              Cards
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={16} />
              List
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        /* Catalog Display - Parent-Child Structure */
        <div className="space-y-4">
          {catalogItems.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No catalog items found</p>
              <p className="text-sm mt-1">Add your first category and items to get started</p>
              <div className="flex gap-2 justify-center mt-6">
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="bg-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2"
                >
                  <Tag size={16} />
                  Create First Category
                </button>
                <button
                  onClick={() => setShowItemForm(true)}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <Package size={16} />
                  Add First Item
                </button>
              </div>
            </div>
          ) : (
            Object.values(groupedItems).map((group) => (
              <div key={group.categoryId} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                {/* Category Header */}
                <div className="bg-slate-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCategoryExpansion(group.categoryId)}
                        className="p-1 hover:bg-slate-200 rounded"
                        title={expandedCategories.has(group.categoryId) ? 'Collapse' : 'Expand'}
                      >
                        {expandedCategories.has(group.categoryId) ? (
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <Tag className="w-5 h-5 text-emerald-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{group.categoryName}</h3>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {group.items.length} item{group.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          // Set selected category for new item form
                          setSelectedCategory(group.categoryId === 'uncategorized' ? '' : group.categoryId)
                          setShowItemForm(true)
                        }}
                        className="p-2 text-emerald-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
                        title="Add Item to Category"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items (shown when expanded) */}
                {expandedCategories.has(group.categoryId) && (
                  <div className="bg-white">
                    {viewMode === 'card' ? (
                      <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {group.items.map((item) => (
                          <CatalogCard
                            key={item.id}
                            item={item}
                            onEdit={(item) => {
                              setEditingItem(item)
                              setShowEditItemForm(true)
                            }}
                            onToggleStatus={async (id) => {
                              try {
                                await toggleItemStatusMutation.mutateAsync(id)
                              } catch (error) {
                                console.error('Failed to toggle item status:', error)
                                alert(error instanceof Error ? error.message : 'Failed to toggle item status')
                              }
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {group.items.map((item) => (
                          <div key={item.id} className="px-6 py-4">
                            <CatalogListItem
                              item={item}
                              onEdit={(item) => {
                                setEditingItem(item)
                                setShowEditItemForm(true)
                              }}
                              onToggleStatus={async (id) => {
                                try {
                                  await toggleItemStatusMutation.mutateAsync(id)
                                } catch (error) {
                                  console.error('Failed to toggle item status:', error)
                                  alert(error instanceof Error ? error.message : 'Failed to toggle item status')
                                }
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showCategoryForm && (
        <CategoryForm
          onClose={() => setShowCategoryForm(false)}
          onSuccess={() => {
            setShowCategoryForm(false)
            queryClient.invalidateQueries({ queryKey: ['categories'] })
          }}
        />
      )}

      {showItemForm && (
        <ItemForm
          categories={categories}
          selectedCategoryId={selectedCategory}
          onClose={() => {
            setShowItemForm(false)
            setSelectedCategory('')
          }}
          onSuccess={() => {
            setShowItemForm(false)
            setSelectedCategory('')
            queryClient.invalidateQueries({ queryKey: ['catalog-items'] })
          }}
        />
      )}

      {showEditItemForm && editingItem && (
        <EditItemForm
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowEditItemForm(false)
            setEditingItem(null)
          }}
          onSuccess={() => {
            setShowEditItemForm(false)
            setEditingItem(null)
            queryClient.invalidateQueries({ queryKey: ['catalog-items'] })
          }}
        />
      )}
    </div>
  )
}

function CatalogCard({ item, onEdit, onToggleStatus }: {
  item: CatalogItem
  onEdit: (item: CatalogItem) => void
  onToggleStatus: (id: string) => void
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-slate-100 rounded-md mb-4 flex items-center justify-center overflow-hidden">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-slate-400 text-4xl">📦</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-slate-900 flex-1">{item.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${statusColors[item.is_active ? 'active' : 'inactive']}`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {item.description && (
          <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
        )}

        <div className="text-sm text-slate-500 space-y-1">
          {item.category_name && (
            <div className="flex items-center gap-2">
              <span className="font-medium">Category:</span>
              <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.category_name}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span><span className="font-medium">Unit:</span> {item.unit}</span>
            {item.cost_per_unit && (
              <span className="font-medium text-slate-900">${item.cost_per_unit}</span>
            )}
          </div>
          {item.supplier && (
            <div><span className="font-medium">Supplier:</span> {item.supplier}</div>
          )}
          {item.minimum_stock && (
            <div><span className="font-medium">Min Stock:</span> {item.minimum_stock}</div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button className="flex-1 bg-emerald-500 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors">
            Request
          </button>
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-emerald-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors"
            title="Edit Item"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggleStatus(item.id)}
            className={`p-2 rounded-md transition-colors ${
              item.is_active
                ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                : 'text-green-600 hover:text-green-800 hover:bg-green-100'
            }`}
            title={item.is_active ? 'Disable Item' : 'Enable Item'}
          >
            {item.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  )
}

function CatalogListItem({ item, onEdit, onToggleStatus }: {
  item: CatalogItem
  onEdit: (item: CatalogItem) => void
  onToggleStatus: (id: string) => void
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-red-100 text-red-700'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {/* Small Image */}
        <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-400 text-xl">📦</span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-slate-900 truncate">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-slate-600 truncate mt-1">{item.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {item.cost_per_unit && (
                <span className="font-medium text-slate-900">${item.cost_per_unit}</span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[item.is_active ? 'active' : 'inactive']}`}>
                {item.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-slate-500">
              {item.category_name && (
                <span className="bg-slate-100 px-2 py-1 rounded text-xs">{item.category_name}</span>
              )}
              <span>{item.unit}</span>
              {item.supplier && <span>Supplier: {item.supplier}</span>}
              {item.minimum_stock && <span>Min: {item.minimum_stock}</span>}
            </div>

            <div className="flex gap-2 items-center">
              <button className="bg-emerald-500 text-white py-1 px-3 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors">
                Request
              </button>
              <button
                onClick={() => onEdit(item)}
                className="p-1.5 text-emerald-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                title="Edit Item"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => onToggleStatus(item.id)}
                className={`p-1.5 rounded transition-colors ${
                  item.is_active
                    ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                    : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                }`}
                title={item.is_active ? 'Disable Item' : 'Enable Item'}
              >
                {item.is_active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Category Form Component
function CategoryForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create category')
      }

      onSuccess()
    } catch (error) {
      console.error('Error creating category:', error)
      alert(error instanceof Error ? error.message : 'Failed to create category')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold mb-4">Create New Category</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter category description"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Item Form Component
function ItemForm({ categories, selectedCategoryId, onClose, onSuccess }: {
  categories: Category[]
  selectedCategoryId?: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: selectedCategoryId || '',
    unit: '',
    cost_per_unit: '',
    supplier: '',
    minimum_stock: '',
    image_url: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.unit.trim()) return

    setIsSubmitting(true)
    try {
      let imageUrl = formData.image_url.trim()

      // Handle file upload if a file is selected
      if (imageUploadMode === 'upload' && selectedFile) {
        // Convert file to base64 data URL for storage
        imageUrl = await convertFileToDataUrl(selectedFile)
      }

      const response = await fetch('/api/catalogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category_id: formData.category_id || undefined,
          unit: formData.unit.trim(),
          cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : undefined,
          supplier: formData.supplier.trim() || undefined,
          minimum_stock: formData.minimum_stock ? parseInt(formData.minimum_stock) : undefined,
          image_url: imageUrl || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to create item')
      }

      onSuccess()
    } catch (error) {
      console.error('Error creating item:', error)
      alert(error instanceof Error ? error.message : 'Failed to create item')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to convert file to data URL
  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Update image preview when image URL changes
    if (field === 'image_url') {
      setImagePreview(value.trim())
      setSelectedFile(null) // Clear file selection when URL is entered
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      setFormData(prev => ({ ...prev, image_url: '' })) // Clear URL when file is selected

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Create New Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter item name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter item description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Unit *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., each, box, kg"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Cost per Unit
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost_per_unit}
                onChange={(e) => handleInputChange('cost_per_unit', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Minimum Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.minimum_stock}
                onChange={(e) => handleInputChange('minimum_stock', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Supplier
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter supplier name"
            />
          </div>

          {/* Image Upload Section */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Item Image
            </label>

            {/* Toggle between URL and Upload */}
            <div className="flex bg-slate-100 rounded-md p-1 mb-4 w-fit">
              <button
                type="button"
                onClick={() => {
                  setImageUploadMode('url')
                  setSelectedFile(null)
                  setImagePreview('')
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  imageUploadMode === 'url'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Link size={14} />
                URL
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageUploadMode('upload')
                  setFormData(prev => ({ ...prev, image_url: '' }))
                  setImagePreview('')
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  imageUploadMode === 'upload'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload size={14} />
                Upload
              </button>
            </div>

            <div className="space-y-3">
              {imageUploadMode === 'url' ? (
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Enter image URL (e.g., https://example.com/image.jpg)"
                />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500">
                          <span className="font-medium">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-md">
                      <Package size={16} className="text-slate-400" />
                      <span className="text-sm text-slate-600 flex-1">{selectedFile.name}</span>
                      <span className="text-xs text-slate-400">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null)
                          setImagePreview('')
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Preview:</span>
                  <div className="w-16 h-16 bg-slate-100 rounded-md flex items-center justify-center overflow-hidden border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview('')}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-slate-500">
                {imageUploadMode === 'url'
                  ? 'Provide a URL to an image for this item. Supported formats: JPG, PNG, GIF, WebP'
                  : 'Upload an image file for this item. Maximum file size: 5MB. Supported formats: JPG, PNG, GIF, WebP'
                }
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.unit.trim()}
              className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Item Form Component
function EditItemForm({ item, categories, onClose, onSuccess }: {
  item: CatalogItem
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: item.name,
    description: item.description || '',
    category_id: item.category_id || '',
    unit: item.unit,
    cost_per_unit: item.cost_per_unit || '',
    supplier: item.supplier || '',
    minimum_stock: item.minimum_stock?.toString() || '',
    image_url: item.image_url || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>(item.image_url || '')
  const [imageUploadMode, setImageUploadMode] = useState<'url' | 'upload'>('url')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.unit.trim()) return

    setIsSubmitting(true)
    try {
      let imageUrl = formData.image_url.trim()

      // Handle file upload if a file is selected
      if (imageUploadMode === 'upload' && selectedFile) {
        // Convert file to base64 data URL for storage
        imageUrl = await convertFileToDataUrl(selectedFile)
      }

      const response = await fetch(`/api/catalogue/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          category_id: formData.category_id || undefined,
          unit: formData.unit.trim(),
          cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : undefined,
          supplier: formData.supplier.trim() || undefined,
          minimum_stock: formData.minimum_stock ? parseInt(formData.minimum_stock) : undefined,
          image_url: imageUrl || undefined
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Failed to update item')
      }

      const updatedItem = await response.json()
      onSuccess()
    } catch (error) {
      console.error('Error updating item:', error)
      alert(error instanceof Error ? error.message : 'Failed to update item')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper function to convert file to data URL
  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Update image preview when image URL changes
    if (field === 'image_url') {
      setImagePreview(value.trim())
      setSelectedFile(null) // Clear file selection when URL is entered
    }
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB')
        return
      }

      setSelectedFile(file)
      setFormData(prev => ({ ...prev, image_url: '' })) // Clear URL when file is selected

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Edit Item</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form content - NO scroll, fixed height */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Row 1: Name & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                  placeholder="Enter name"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => handleInputChange('category_id', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                placeholder="Enter description"
                rows={2}
              />
            </div>

            {/* Row 3: Unit, Cost, Stock */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                  placeholder="e.g., box"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cost per Unit
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) => handleInputChange('cost_per_unit', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Min Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minimum_stock}
                  onChange={(e) => handleInputChange('minimum_stock', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Row 4: Supplier */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={formData.supplier}
                onChange={(e) => handleInputChange('supplier', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                placeholder="Enter supplier name"
              />
            </div>

            {/* Row 5: Image - Compact */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-2">
                Item Image
              </label>

              <div className="flex gap-4 items-start">
                {/* Mode Toggle - Smaller */}
                <div className="flex bg-slate-100 rounded-md p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setImageUploadMode('url')
                      setSelectedFile(null)
                      setImagePreview(formData.image_url)
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      imageUploadMode === 'url'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Link size={12} />
                    URL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageUploadMode('upload')
                      setFormData(prev => ({ ...prev, image_url: '' }))
                      setImagePreview('')
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                      imageUploadMode === 'upload'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload size={12} />
                    Upload
                  </button>
                </div>

                {/* Input/Upload area */}
                <div className="flex-1">
                  {imageUploadMode === 'url' ? (
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => handleInputChange('image_url', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-blue-500"
                      placeholder="Enter image URL"
                    />
                  ) : (
                    <div>
                      <label className="flex items-center justify-center w-full h-16 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-2">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-500">Click to upload</span>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleFileSelect}
                        />
                      </label>
                      {selectedFile && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded text-sm">
                          <Package size={14} className="text-slate-400" />
                          <span className="flex-1 truncate">{selectedFile.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFile(null)
                              setImagePreview('')
                            }}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Preview */}
                {imagePreview && (
                  <div className="w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border shrink-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview('')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer with save button */}
          <div className="flex items-center justify-end pt-6 mt-6 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSubmitting || !formData.name.trim() || !formData.unit.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg font-medium shadow-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}