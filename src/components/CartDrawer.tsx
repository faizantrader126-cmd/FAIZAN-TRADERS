import React, { useState } from 'react';
import { CartItem } from '../types';
import { X, Trash2, ShieldCheck, Ticket, ArrowRight, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';

interface CartDrawerProps {
  cartItems: CartItem[];
  onClose: () => void;
  onUpdateQty: (productId: string, val: number, color?: string, size?: string) => void;
  onRemoveItem: (productId: string, color?: string, size?: string) => void;
  onProceedToCheckout: () => void;
}

export default function CartDrawer({
  cartItems,
  onClose,
  onUpdateQty,
  onRemoveItem,
  onProceedToCheckout
}: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const [discountApplied, setDiscountApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Calculate base price adjustments if Sofa sizes are selected
  const getItemPrice = (item: CartItem) => {
    let p = item.product?.price || 0;
    const size = item.selectedSize;
    if (!size) return p;
    if (size.includes('2 Seater')) p += 500;
    if (size.includes('3 Seater')) p += 1000;
    if (size.includes('4 Seater')) p += 1500;
    if (size.includes('5 Seater')) p += 2500;
    if (size.includes('7 Seater')) p += 4500;
    if (size.includes('Extra Large')) p += 800;
    return p;
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (getItemPrice(item) * item.quantity), 0);
  
  // Dynamic free shipping target index
  const freeShippingThreshold = 2500;
  const shippingCost = subtotal === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : 150;
  
  // Custom coupon discounts
  const discountAmount = discountApplied ? Math.round(subtotal * 0.1) : 0;
  const netTotal = subtotal - discountAmount + shippingCost;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'FAIZAN10' || couponCode.toUpperCase() === 'FIRST10') {
      setDiscountApplied(true);
      setCouponError('');
    } else {
      setCouponError('Invalid coupon! Try "FAIZAN10"');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Black ambient backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-black/60 backdrop-blur-xs"
      />

      {/* Cart Drawer Panel */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.35, ease: 'easeInOut' }}
        className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl border-l border-brand-black/10"
      >
        {/* Header bar of Cart */}
        <div className="flex items-center justify-between border-b border-brand-black/5 px-6 py-5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-brand-black" />
            <h3 className="font-display text-base font-bold text-brand-black">Shopping Bag</h3>
            <span className="rounded-full bg-brand-black px-2 py-0.5 text-xs font-bold text-white font-mono">
              {cartItems.reduce((acc, current) => acc + current.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full bg-brand-lightgray p-1.5 text-brand-black/75 hover:bg-brand-black hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Free Shipping Alert ticker if applicable */}
        {subtotal > 0 && (
          <div className="bg-brand-lightgray/80 border-b border-brand-black/5 px-6 py-3">
            {subtotal >= freeShippingThreshold ? (
              <p className="text-center text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                🎉 Congratulations! Your order qualifies for *FREE NATIONWIDE SHIPPING*!
              </p>
            ) : (
              <div className="space-y-1.5">
                <p className="text-left text-[11px] text-brand-black/60 flex items-center justify-between">
                  <span>Add <strong className="font-mono text-brand-black">Rs. {(freeShippingThreshold - subtotal).toLocaleString()}</strong> more to unlock <strong>Free Shipping</strong></span>
                  <span className="font-bold text-brand-black">Rs. {subtotal.toLocaleString()} / {freeShippingThreshold}</span>
                </p>
                <div className="h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${Math.min((subtotal / freeShippingThreshold) * 100, 100)}%` }}
                    className="h-full bg-brand-gold rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dynamic scrollable items matrix */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center opacity-70 mt-12">
              <div className="rounded-full bg-brand-lightgray p-6 text-brand-black/40 mb-4 animate-bounce">
                <ShoppingBag className="h-10 w-10" />
              </div>
              <h4 className="font-display text-sm font-bold text-brand-black">Your cart is empty!</h4>
              <p className="text-xs text-brand-black/60 max-w-xs mt-1.5 leading-relaxed">
                Unlock great savings by exploring our sofa covers, table cloths, mobile accessories, kitchen utilities, and gadgets.
              </p>
              <button 
                onClick={onClose}
                className="mt-5 rounded-lg bg-brand-black px-5 py-2.5 text-xs font-bold text-white uppercase tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Start Shopping Now
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => {
                const itemPrice = getItemPrice(item);
                const productId = item.product?.id || `unknown-${index}`;
                const productName = item.product?.name || 'Product';
                const productImage = item.product?.image || '';
                return (
                  <div 
                    key={`${productId}-${item.selectedColor || ''}-${item.selectedSize || ''}-${index}`}
                    className="flex gap-4 p-3.5 bg-brand-lightgray/50 rounded-xl border border-brand-black/5 relative group transition-all hover:bg-zinc-50"
                  >
                    {/* Item Thumbnail */}
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white border border-brand-black/5 shadow-xs">
                      <img 
                        src={productImage} 
                        alt={productName} 
                        className="h-full w-full object-cover"
                      />
                    </div>

                    {/* Meta Fields block */}
                    <div className="flex-1 flex flex-col justify-between text-left">
                      <div>
                        <h4 className="text-xs font-bold text-brand-black leading-tight line-clamp-1 pr-6">
                          {productName}
                        </h4>
                        
                        {/* Selections indicators values */}
                        <div className="flex gap-2 flex-wrap mt-1">
                           {item.selectedColor && (
                             <span className="bg-white/80 border border-brand-black/5 text-[9px] px-1.5 py-0.5 rounded-md text-brand-black/60 font-mono font-medium">
                               Color: {item.selectedColor}
                             </span>
                           )}
                           {item.selectedSize && (
                             <span className="bg-white/80 border border-brand-black/5 text-[9px] px-1.5 py-0.5 rounded-md text-brand-gold font-mono font-bold">
                               Size: {item.selectedSize}
                             </span>
                           )}
                        </div>
                      </div>

                      {/* Quantity operations panel & active sums */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white border border-brand-black/5 rounded-lg overflow-hidden scale-90 origin-left">
                          <button 
                            onClick={() => onUpdateQty(productId, -1, item.selectedColor, item.selectedSize)}
                            className="px-2 py-1 hover:bg-brand-lightgray text-brand-black font-extrabold"
                          >
                            -
                          </button>
                          <span className="px-3 font-mono font-bold text-brand-black/80 text-xs text-center min-w-[1.5rem]">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => onUpdateQty(productId, 1, item.selectedColor, item.selectedSize)}
                            className="px-2 py-1 hover:bg-brand-lightgray text-brand-black font-extrabold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-mono text-xs font-bold text-brand-black">
                          Rs. {(itemPrice * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Trash Delete button */}
                    <button 
                      onClick={() => onRemoveItem(productId, item.selectedColor, item.selectedSize)}
                      className="absolute top-3.5 right-3.5 text-brand-black/30 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Checkout aggregates & footer inputs */}
        {cartItems.length > 0 && (
          <div className="border-t border-brand-black/10 bg-brand-lightgray/30 p-6 space-y-4">
            
            {/* Coupon Application Block */}
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <div className="relative flex-1">
                <Ticket className="absolute left-3 top-3.5 h-4 w-4 text-brand-black/40" />
                <input 
                  type="text" 
                  placeholder="Promo Code (e.g., FAIZAN10)" 
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={discountApplied}
                  className="w-full bg-white border border-brand-black/10 rounded-lg pl-9 pr-3 py-3 text-xs uppercase focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                />
              </div>
              <button 
                type="submit" 
                disabled={discountApplied || !couponCode.trim()}
                className="bg-brand-black text-white hover:bg-zinc-800 transition-colors font-bold px-4 rounded-lg text-xs tracking-wider uppercase disabled:opacity-50 cursor-pointer"
              >
                Apply
              </button>
            </form>

            {/* Error or Success notification badges */}
            {couponError && (
              <p className="text-[10px] text-red-600 font-bold tracking-wide font-mono text-left">{couponError}</p>
            )}
            {discountApplied && (
              <p className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5 font-bold tracking-wide font-mono text-left flex items-center gap-1.5">
                ✓ Coupon Approved! 10% discount (-Rs. {discountAmount.toLocaleString()}) applied to subtotal.
              </p>
            )}

            {/* Invoices detail aggregates */}
            <div className="space-y-2 border-t border-b border-brand-black/5 py-4 text-left">
              <div className="flex justify-between text-xs text-brand-black/60">
                <span>Value Subtotal:</span>
                <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
              </div>
              {discountApplied && (
                <div className="flex justify-between text-xs text-emerald-700">
                  <span>Coupon Deduction (10%):</span>
                  <span className="font-mono">-Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-brand-black/60">
                <span>Shipping & Delivery Cost:</span>
                <span className="font-mono">
                  {shippingCost === 0 ? 'FREE DELIVERY' : `Rs. ${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between font-display text-base font-black text-brand-black pt-2 border-t border-brand-black/5">
                <span>Net Outflow:</span>
                <span className="font-mono">Rs. {netTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Secure Checkout trigger CTA */}
            <div className="space-y-2.5">
              <button 
                onClick={onProceedToCheckout}
                className="w-full bg-brand-black hover:bg-zinc-800 text-white py-4.5 px-6 rounded-xl font-bold font-display text-sm tracking-wide gap-2 flex items-center justify-center transition-all shadow-md group cursor-pointer"
              >
                Secure Cash on Delivery Checkout
                <ArrowRight className="h-4.5 w-4.5 group-hover:translate-x-1.5 transition-transform" />
              </button>
              
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-medium text-brand-black/40 font-mono">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                No credit card needed • Cash On Delivery nationwide Pakistan
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
