import React, { useState } from 'react';
import Logo from './Logo';
import { Search, ShoppingBag, PhoneCall, Truck, ClipboardList, Menu, X, HelpCircle, MessageSquare, Sliders } from 'lucide-react';
import { CartItem } from '../types';

interface HeaderProps {
  cartItems: CartItem[];
  onCartClick: () => void;
  onTrackerClick: () => void;
  onManagerClick: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  categories: { id: string; name: string }[];
  activeCategory: string;
  onCategorySelect: (id: string) => void;
}

export default function Header({
  cartItems,
  onCartClick,
  onTrackerClick,
  onManagerClick,
  searchQuery,
  onSearchChange,
  categories,
  activeCategory,
  onCategorySelect
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const cartCount = cartItems.reduce((acc, current) => acc + current.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-brand-black/5">
      {/* Top Bar Announcement */}
      <div className="bg-brand-black text-white text-[10px] sm:text-xs font-mono font-medium tracking-wider py-2 px-4 flex flex-col sm:flex-row justify-between items-center gap-1.5 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <Truck className="h-3.5 w-3.5 text-brand-gold" />
          <span>FREE SHIPPING IN PAKISTAN ON ORDERS ABOVE RS. 2,500</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="tel:+9203303511464" className="hover:text-brand-gold transition-colors flex items-center gap-1">
            <PhoneCall className="h-3 w-3" />
            <span>CALL: 0330 3511464</span>
          </a>
          <span className="opacity-20">|</span>
          <a href="https://wa.me/9203303511464" target="_blank" referrerPolicy="no-referrer" className="hover:text-brand-whatsapp transition-colors flex items-center gap-1 font-bold">
            <MessageSquare className="h-3 w-3 fill-current text-brand-whatsapp" />
            <span>ORDER ON WHATSAPP</span>
          </a>
        </div>
      </div>

      {/* Main Core Header bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        {/* Mobile menu trigger */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-brand-lightgray text-brand-black cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Brand Logo component */}
        <div className="flex-shrink-0 md:mt-2">
          <Logo size="md" showPhone={false} className="scale-95 sm:scale-100 origin-left" />
        </div>

        {/* Live Search Block matching inputs */}
        <div className="hidden md:flex flex-1 max-w-lg relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-black/45">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input 
            type="text"
            placeholder="Search premium sofa covers, gadgets, micro charging cables, dynamic lamps..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-brand-lightgray border border-brand-black/5 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:bg-white focus:ring-1 focus:ring-brand-black focus:outline-hidden text-brand-black font-medium transition-all"
          />
        </div>

        {/* Actions Button panel (Orders list, shopping cart) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Owner Catalog Desk */}
          <button
            onClick={onManagerClick}
            className="flex items-center gap-1.5 rounded-lg border border-[#ca8a04]/20 bg-[#ca8a04]/5 px-2.5 sm:px-3.5 py-2 text-xs font-extrabold text-[#ca8a04] hover:bg-brand-black hover:text-white hover:border-brand-black transition-all cursor-pointer"
            title="Manage store items, edit prices & stock"
          >
            <Sliders className="h-4 w-4" />
            <span className="hidden lg:inline">Manage Items</span>
          </button>

          {/* Order Tracker */}
          <button
            onClick={onTrackerClick}
            className="flex items-center gap-1.5 rounded-lg border border-brand-black/5 px-2.5 sm:px-3.5 py-2 text-xs font-semibold text-brand-black hover:bg-brand-black hover:text-white transition-all cursor-pointer"
            title="Track my Cash On Delivery orders"
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">My Orders</span>
          </button>

          {/* Cart triggers */}
          <button
            onClick={onCartClick}
            className="relative flex items-center gap-2 rounded-lg bg-brand-black hover:bg-zinc-800 text-white px-3 sm:px-4 py-2 text-xs font-semibold transition-all shadow-sm cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gold text-[10px] font-black text-white font-mono shadow-xs ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expanded categories row lists on Desktop */}
      <div className="hidden md:block border-t border-brand-black/5 bg-brand-offwhite">
        <div className="max-w-7xl mx-auto px-6 py-2.5 flex justify-center gap-8 text-xs font-semibold tracking-wide">
          <button 
            onClick={() => onCategorySelect('all')}
            className={`pb-1 uppercase tracking-wider relative cursor-pointer ${
              activeCategory === 'all' 
                ? 'text-brand-black font-extrabold border-b-2 border-brand-black' 
                : 'text-brand-black/50 hover:text-brand-black transition-colors'
            }`}
          >
            All Products
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onCategorySelect(c.id)}
              className={`pb-1 uppercase tracking-wider relative cursor-pointer ${
                activeCategory === c.id 
                  ? 'text-brand-black font-extrabold border-b-2 border-brand-black' 
                  : 'text-brand-black/50 hover:text-brand-black transition-colors'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile search list block */}
      <div className="px-4 py-3 md:hidden border-t border-brand-black/5 bg-brand-lightgray/30">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-black/40">
            <Search className="h-4 w-4" />
          </span>
          <input 
            type="text"
            placeholder="Search 1000+ products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-white border border-brand-black/10 rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
          />
        </div>
      </div>

      {/* Mobile menu panel overlay drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div onClick={() => setMobileMenuOpen(false)} className="absolute inset-0 bg-brand-black/40 backdrop-blur-xs" />
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6">
            <div className="space-y-6 text-left">
              <div className="flex items-center justify-between border-b border-brand-black/5 pb-4">
                <Logo size="sm" showPhone={false} className="origin-left" />
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="h-5 w-5 text-brand-black" />
                </button>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-brand-black/40 uppercase tracking-[0.15em] mb-3">Shop Categories</h4>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      onCategorySelect('all');
                      setMobileMenuOpen(false);
                    }}
                    className={`text-xs font-semibold py-2.5 px-3 rounded-lg text-left transition-colors ${
                      activeCategory === 'all' ? 'bg-brand-black text-white' : 'hover:bg-brand-lightgray text-brand-black/80'
                    }`}
                  >
                    All Collections
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        onCategorySelect(c.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`text-xs font-semibold py-2.5 px-3 rounded-lg text-left transition-colors ${
                        activeCategory === c.id ? 'bg-brand-black text-white' : 'hover:bg-brand-lightgray text-brand-black/80'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-brand-black/10 pt-4 text-left space-y-3">
              {/* Owner Portal Shortcut */}
              <button
                onClick={() => {
                  onManagerClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full bg-[#ca8a04] hover:bg-yellow-600 text-brand-black font-extrabold text-xs py-2.5 rounded-lg text-center block cursor-pointer"
              >
                Owner Panel: Manage Items ⚙️
              </button>

              <div className="flex items-center gap-3">
                <a href="tel:+9203303511464" className="w-full bg-brand-black text-white py-2.5 rounded-lg text-xs font-bold text-center block">
                  Call Support
                </a>
                <a href="https://wa.me/9203303511464" className="w-full bg-[#25d366] text-white py-2.5 rounded-lg text-xs font-bold text-center block">
                  WhatsApp Support
                </a>
              </div>
              <p className="text-[10px] text-zinc-400 mt-3 text-center">Faizan Traders - Liaqutabad Karachi</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
