import Image from "next/image";

interface CatalogueItemCardProps {
  item: {
    id: string;
    name: string;
    sku: string;
    vendorSku?: string | null;
    category?: string;
    unit?: string;
    packSize?: string | null;
    imageUrl?: string | null;
    unitPrice?: number | null;
    currency?: string;
    showPriceToUsers?: boolean;
  };
  showDetails?: boolean;
  showPrice?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CatalogueItemCard({
  item,
  showDetails = true,
  showPrice = false,
  size = "md",
  className = ""
}: CatalogueItemCardProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16"
  };

  const imageSize = {
    sm: 32,
    md: 48,
    lg: 64
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Item Image or Placeholder */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        {item.imageUrl ? (
          <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={item.imageUrl}
              alt={item.name}
              width={imageSize[size]}
              height={imageSize[size]}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = `
                  <div class="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                `;
              }}
            />
          </div>
        ) : (
          // Placeholder when no image is available
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <svg
              className={`${size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        <div className={`${size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg'} font-medium text-gray-900 truncate`}>
          {item.name}
        </div>

        {showDetails && (
          <div className="flex flex-col space-y-1">
            <div className="flex flex-col space-y-0.5">
              <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-500 truncate`}>
                SKU: {item.sku}
              </span>
              {item.vendorSku && (
                <span className="text-xs text-gray-400 truncate">Vendor: {item.vendorSku}</span>
              )}
            </div>

            {item.category && (
              <div className="flex items-center space-x-2">
                <span className={`inline-flex px-2 py-1 ${size === 'sm' ? 'text-xs' : 'text-xs'} font-medium bg-blue-100 text-blue-800 rounded-full`}>
                  {item.category}
                </span>
                {item.unit && (
                  <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} text-gray-500`}>
                    {item.unit}
                    {item.packSize && ` â€¢ ${item.packSize}`}
                  </span>
                )}
              </div>
            )}

            {showPrice && item.unitPrice && (
              <div className="flex items-center space-x-2 mt-1">
                <span className={`${size === 'sm' ? 'text-xs' : 'text-sm'} font-medium text-gray-900`}>
                  {item.currency} {Number(item.unitPrice).toFixed(2)}
                </span>
                {item.showPriceToUsers && (
                  <span className="inline-flex px-1.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                    Visible
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for dropdown/select lists
export function CatalogueItemOption({ item, selected = false }: {
  item: CatalogueItemCardProps['item'],
  selected?: boolean
}) {
  return (
    <div className={`flex items-center space-x-2 p-2 ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'} rounded-md`}>
      <div className="w-6 h-6 flex-shrink-0">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={24}
            height={24}
            className="w-full h-full object-cover rounded"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center">
            <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">
          {item.name}
        </div>
        <div className="text-xs text-gray-500 truncate">
          {item.sku}
          {item.vendorSku && ` • Vendor: ${item.vendorSku}`}
          {item.category && ` • ${item.category}`}
        </div>
      </div>
    </div>
  );
}
