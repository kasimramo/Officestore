export default function Catalog() {
  return (
    <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Catalog</h1>
          <p className="text-slate-600 mt-1">Manage your office supplies and equipment catalog</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
          Add New Item
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <input
              placeholder="Search catalog items..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Categories</option>
            <option>Office Supplies</option>
            <option>Furniture</option>
            <option>Electronics</option>
            <option>Kitchen</option>
          </select>
          <select className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Low Stock</option>
            <option>Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {catalogItems.map((item) => (
          <CatalogCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}

function CatalogCard({ item }: { item: any }) {
  const stockStatus = item.stock <= 5 ? 'low' : item.stock > 0 ? 'good' : 'out'
  const statusColors = {
    good: 'bg-green-100 text-green-700',
    low: 'bg-orange-100 text-orange-700',
    out: 'bg-red-100 text-red-700'
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
      <div className="aspect-square bg-slate-100 rounded-md mb-4 flex items-center justify-center">
        <span className="text-slate-400 text-4xl">📦</span>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-slate-900">{item.name}</h3>
        <p className="text-sm text-slate-600">{item.description}</p>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">${item.price}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[stockStatus]}`}>
            {item.stock} in stock
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Request
          </button>
          <button className="bg-slate-100 text-slate-700 py-2 px-3 rounded-md text-sm font-medium hover:bg-slate-200 transition-colors">
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}

const catalogItems = [
  { id: 1, name: 'Wireless Mouse', description: 'Ergonomic wireless mouse with USB receiver', price: 29.99, stock: 15, category: 'Electronics' },
  { id: 2, name: 'Office Chair', description: 'Adjustable height office chair with lumbar support', price: 299.99, stock: 3, category: 'Furniture' },
  { id: 3, name: 'Printer Paper', description: 'A4 white printer paper - 500 sheets', price: 12.99, stock: 0, category: 'Office Supplies' },
  { id: 4, name: 'Standing Desk', description: 'Height adjustable standing desk converter', price: 199.99, stock: 8, category: 'Furniture' },
  { id: 5, name: 'Notebook Set', description: 'Spiral bound notebooks - pack of 5', price: 15.99, stock: 25, category: 'Office Supplies' },
  { id: 6, name: 'Monitor Stand', description: 'Adjustable laptop and monitor stand', price: 49.99, stock: 12, category: 'Electronics' },
]