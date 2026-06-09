import React from 'react';
import { Product } from '../types';
import { Star, ShoppingCart, MessageSquare, Eye } from 'lucide-react';

interface ProductCardProps {
  key?: string;
  product: Product;
  onViewDetails: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  isItemInCart: boolean;
}

export default function ProductCard({ 
  product, 
  onViewDetails, 
  onAddToCart, 
  isItemInCart 
}: ProductCardProps) {
  // Safeguards for pricing and discounts
  const price = product.price || 0;
  const originalPrice = product.originalPrice || price;
  const discountPct = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  // Generate WhatsApp order link
  const handleWhatsAppOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const productName = product.name || 'Product';
    const message = `Hello Faizan Traders!\nI want to order your "${productName}"\nPrice: Rs. ${price.toLocaleString()}\nStock Status: In Stock\nPlease confirm my order!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/9203303511464?text=${encodedMessage}`, '_blank');
  };

  return (
    <div 
      onClick={() => onViewDetails(product)}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-brand-black/5 bg-white shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-black/15 hover:shadow-md cursor-pointer"
    >
      {/* Badge container info overlay */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 items-start">
        {discountPct > 0 && (
          <span className="rounded-md bg-brand-black px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase font-mono">
            SAVE {discountPct}%
          </span>
        )}
        {product.badge && (
          <span className="rounded-md bg-brand-gold px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white uppercase font-mono">
            {product.badge}
          </span>
        )}
      </div>

      {/* Stock indicators */}
      <div className="absolute top-2.5 right-2.5 z-10">
        {(product.stock || 0) < 15 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-medium text-amber-700 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Only {product.stock || 0} Left
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-medium text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            In Stock
          </span>
        )}
      </div>

      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden bg-brand-lightgray">
        <img 
          src={product.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop'} 
          alt={product.name || 'Product'} 
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-brand-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(product);
            }}
            className="flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-brand-black shadow-sm transform translate-y-3 transition-transform duration-300 group-hover:translate-y-0 hover:bg-brand-black hover:text-white"
          >
            <Eye className="h-4.5 w-4.5" />
            Quick View
          </button>
        </div>
      </div>

      {/* Product Information Body */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category micro indicator */}
        <span className="text-[10px] uppercase tracking-wider text-brand-black/40 font-mono font-medium mb-1">
          {(product.category || 'general').replace('-', ' ')}
        </span>

        {/* Product Title */}
        <h3 className="font-display text-sm font-semibold text-brand-black line-clamp-1 group-hover:text-brand-gold transition-colors duration-200">
          {product.name || 'Unnamed Product'}
        </h3>

        {/* Star Rating summary and review triggers */}
        <div className="mt-1.5 flex items-center gap-1">
          <div className="flex text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < Math.floor(product.rating || 0) ? 'fill-current' : 'opacity-35'}`} 
              />
            ))}
          </div>
          <span className="text-[10px] font-semibold text-brand-black/70 font-mono">
            {product.rating || 0}
          </span>
          <span className="text-[9px] text-brand-black/40 font-mono">
            ({product.reviewsCount || 0} reviews)
          </span>
        </div>

        {/* Brief description */}
        <p className="mt-2 text-xs text-brand-black/60 line-clamp-2 leading-relaxed">
          {product.description || ''}
        </p>

        {/* Price layout */}
        <div className="mt-auto pt-3.5 flex items-baseline gap-2">
          <span className="font-mono text-base font-bold text-brand-black">
            Rs. {price.toLocaleString()}
          </span>
          {originalPrice > price && (
            <span className="font-mono text-xs text-brand-black/35 line-through">
              Rs. {originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        {/* Double-action button panel */}
        <div className="mt-3.5 grid grid-cols-2 gap-2">
          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            className={`flex items-center justify-center gap-1 rounded-lg py-2.5 text-xs font-semibold transition-all duration-200 border ${
              isItemInCart 
                ? 'bg-brand-lightgray border-brand-black/10 text-brand-black/60' 
                : 'bg-white border-brand-black/10 hover:border-brand-black text-brand-black'
            }`}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {isItemInCart ? 'In Cart' : 'Add to Cart'}
          </button>

          {/* Quick WhatsApp Order Button */}
          <button
            onClick={handleWhatsAppOrder}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#25d366] hover:bg-[#20ba5a] py-2.5 text-xs font-semibold text-white shadow-xs transition-colors duration-200 cursor-pointer"
          >
            <svg 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="h-3.5 w-3.5 shrink-0 fill-current"
            >
              <path d="M12.012 2c-5.506 0-9.985 4.479-9.985 9.985 0 2.14.675 4.12 1.826 5.748L2.03 22l4.385-1.152c1.558.85 3.336 1.33 5.228 1.33 5.506 0 10.021-4.479 10.021-9.985S17.518 2 12.012 2zm4.72 13.784c-.21.595-1.225 1.155-1.68 1.19-.455.035-.91.175-2.94-.63-2.45-.98-4.025-3.465-4.13-3.64-.105-.175-.875-1.19-.875-2.24 0-1.05.525-1.575.735-1.82.21-.245.455-.315.595-.315.14 0 .28 0 .42.035.14.035.315-.035.49.385.175.42.63 1.54.665 1.645.035.105.07.245 0 .385-.07.14-.14.28-.245.42-.105.14-.21.28-.315.385-.105.105-.21.245-.07.49.14.245.63 1.05 1.365 1.715.945.84 1.715 1.12 1.96 1.225.245.105.385.07.525-.07.14-.175.63-.735.805-.98.175-.245.35-.21.595-.105.245.105 1.54.735 1.82.875.28.14.455.21.525.315.07.14.07.77-.14 1.365z" />
            </svg>
            <span>WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
