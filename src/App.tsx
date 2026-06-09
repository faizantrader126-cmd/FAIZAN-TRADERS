import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderTrackerModal from './components/OrderTrackerModal';
import Logo from './components/Logo';
import ProductManagerModal from './components/ProductManagerModal';

// Data models
import { PRODUCTS, CATEGORIES, BANNER_SLIDES, REVIEWS } from './data';
import { Product, CartItem, Order, BannerSlide } from './types';
import { saveInquiryToSupabase } from './lib/supabase';

// Icons
import { 
  Armchair, Sparkles, Utensils, Tv, Smartphone, Zap,
  ChevronLeft, ChevronRight, CheckCircle2, ShieldCheck, 
  Truck, HelpCircle, Mail, Send, AlertCircle, ShoppingBag, 
  ThumbsUp, Clock, MapPin, Phone, Award, Gem, Star
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// Help helper for category icons
const getCategoryIcon = (iconName: string) => {
  const iconClasses = "h-5 w-5 md:h-6 md:w-6 group-hover:rotate-12 transition-transform duration-300";
  switch (iconName) {
    case 'Armchair': return <Armchair className={`${iconClasses} text-[#4b5563]`} />;
    case 'Sparkles': return <Sparkles className={`${iconClasses} text-[#ca8a04]`} />;
    case 'Utensils': return <Utensils className={`${iconClasses} text-[#064e3b]`} />;
    case 'Tv': return <Tv className={`${iconClasses} text-[#1d4ed8]`} />;
    case 'Smartphone': return <Smartphone className={`${iconClasses} text-[#7c3aed]`} />;
    case 'Zap': return <Zap className={`${iconClasses} text-[#dc2626]`} />;
    case 'Gem': return <Gem className={`${iconClasses} text-[#db2777]`} />;
    default: return <Sparkles className={`${iconClasses} text-brand-black`} />;
  }
};

export default function App() {
  // Navigation & Catalogs filter state
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // popular, price-low, price-high, rating

  // Cart, Orders & checkout structures
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Modal open states
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  // Dynamic Products Inventory state loaded from LocalStorage or PRODUCTS defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('faizan_traders_products');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved) as Product[];
        if (Array.isArray(parsed)) {
          // Merge missing default items (e.g. newly introduced categories/items)
          const existingIds = new Set(parsed.map(p => p.id));
          const missing = PRODUCTS.filter(p => !existingIds.has(p.id));
          if (missing.length > 0) {
            const merged = [...parsed, ...missing];
            localStorage.setItem('faizan_traders_products', JSON.stringify(merged));
            return merged;
          }
          return parsed; 
        }
      } catch (e) { 
        console.error(e); 
      }
    }
    return PRODUCTS;
  });

  const saveProductsToStorage = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    localStorage.setItem('faizan_traders_products', JSON.stringify(updatedProducts));
  };

  // Dynamic Banners / Slideshow state loaded from LocalStorage or default BANNER_SLIDES
  const [slides, setSlides] = useState<BannerSlide[]>(() => {
    const saved = localStorage.getItem('faizan_traders_slides');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) { console.error(e); }
    }
    return BANNER_SLIDES;
  });

  const saveSlidesToStorage = (updatedSlides: BannerSlide[]) => {
    setSlides(updatedSlides);
    localStorage.setItem('faizan_traders_slides', JSON.stringify(updatedSlides));
  };

  // Home slides banner ticker
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);

  // Safeguard: Ensure currentSlideIdx is always within bounds of active slides
  useEffect(() => {
    const activeLength = Array.isArray(slides) ? slides.length : 0;
    if (activeLength > 0 && currentSlideIdx >= activeLength) {
      setCurrentSlideIdx(0);
    }
  }, [slides, currentSlideIdx]);

  // Flash sales deal countdown
  const [countdown, setCountdown] = useState({ hours: 4, minutes: 34, seconds: 12 });

  // Custom feedback/inquiry states
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryPhone, setInquiryPhone] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  // Sync state with LocalStorage for high fidelity persistence
  useEffect(() => {
    const savedCart = localStorage.getItem('faizan_traders_cart');
    const savedOrders = localStorage.getItem('faizan_traders_orders');
    if (savedCart) {
      try { 
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          setCartItems(parsed);
        }
      } catch (e) { console.error(e); }
    }
    if (savedOrders) {
      try { 
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
        }
      } catch (e) { console.error(e); }
    }
  }, []);

  const saveCartToStorage = (updatedCart: CartItem[]) => {
    setCartItems(updatedCart);
    localStorage.setItem('faizan_traders_cart', JSON.stringify(updatedCart));
  };

  const saveOrdersToStorage = (updatedOrders: Order[]) => {
    setOrders(updatedOrders);
    localStorage.setItem('faizan_traders_orders', JSON.stringify(updatedOrders));
  };

  // Automatic slideshow ticking
  useEffect(() => {
    if (slides.length === 0) return;
    const slideTimer = setInterval(() => {
      setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(slideTimer);
  }, [slides.length]);

  // Flash Sale Dynamic ticking countdown
  useEffect(() => {
    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Reset simulated clock
          return { hours: 4, minutes: 34, seconds: 12 };
        }
      });
    }, 1000);
    return () => clearInterval(countdownTimer);
  }, []);

  // Product Selection management
  const handleAddToCart = (product: Product, quantity = 1, color?: string, size?: string) => {
    const existingIdx = cartItems.findIndex(
      (item) => item.product.id === product.id && 
                item.selectedColor === color && 
                item.selectedSize === size
    );

    let updatedCart = [...cartItems];
    if (existingIdx > -1) {
      updatedCart[existingIdx].quantity += quantity;
    } else {
      updatedCart.push({
        product,
        quantity,
        selectedColor: color,
        selectedSize: size
      });
    }

    saveCartToStorage(updatedCart);
    setSelectedProduct(null); // Close modal on add for simple UX
    setIsCartOpen(true); // Open Sidebar to prompt checkout!
  };

  const handleUpdateQty = (productId: string, val: number, color?: string, size?: string) => {
    const updated = cartItems.map((item) => {
      if (item.product.id === productId && item.selectedColor === color && item.selectedSize === size) {
        const nextQty = item.quantity + val;
        return { ...item, quantity: nextQty < 1 ? 1 : nextQty };
      }
      return item;
    });
    saveCartToStorage(updated);
  };

  const handleRemoveFromCart = (productId: string, color?: string, size?: string) => {
    const filtered = cartItems.filter(
      (item) => !(item.product.id === productId && item.selectedColor === color && item.selectedSize === size)
    );
    saveCartToStorage(filtered);
  };

  const hangleOrderCompleted = (newOrder: Order) => {
    const nextOrders = [newOrder, ...orders];
    saveOrdersToStorage(nextOrders);
    setIsCheckoutOpen(false);
    setIsTrackerOpen(true); // Auto view status!
  };

  const handleSimulateStatus = (orderId: string) => {
    const nextList = orders.map((ord) => {
      if (ord.id === orderId) {
        const nextStatus = ord.status === 'Pending' ? 'Shipped' : 'Delivered';
        return { ...ord, status: nextStatus as any };
      }
      return ord;
    });
    saveOrdersToStorage(nextList);
  };

  const handleClearCart = () => {
    saveCartToStorage([]);
  };

  // Inquiry submit to Supabase
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryName.trim() || !inquiryPhone.trim()) return;

    setInquirySubmitted(true);
    try {
      const res = await saveInquiryToSupabase({
        name: inquiryName,
        phone: inquiryPhone,
        message: inquiryMessage
      });
      
      setInquiryName('');
      setInquiryPhone('');
      setInquiryMessage('');
      
      if (res.success) {
        alert(`Inquiry Sent Successfully! ✅\nSaved into your Supabase "${res.table}" table. Our agent will contact you shortly.`);
      } else {
        alert(`Inquiry Registered Locally! ⚠️\n(Warning: Could not save to Supabase because the target tables do not exist or are offline: ${res.error}).\n\nPlease create the "appointments" or "bookings" table inside your Supabase dashboard to enable database syncing.`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Inquiry Sent. Supabase network connection offline.");
    } finally {
      setInquirySubmitted(false);
    }
  };

  // Filter & Sort Logic for Product catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = activeCategory === 'all' || prod.category === activeCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prod.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    return b.reviewsCount - a.reviewsCount; // popular/best sellers first
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-offwhite text-brand-black selection:bg-brand-black selection:text-white">
      
      {/* 1. Header Layout Block */}
      <Header
        cartItems={cartItems}
        onCartClick={() => setIsCartOpen(true)}
        onTrackerClick={() => setIsTrackerOpen(true)}
        onManagerClick={() => setIsManagerOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onCategorySelect={(id) => {
          setActiveCategory(id);
          // Scroll smoothly to products grid
          document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
      {/* 2. Hero Slideshow banner (Full Width Edge-to-Edge) */}
      <section className="relative overflow-hidden bg-brand-charcoal w-full text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-800/20 via-transparent to-transparent opacity-85 pointer-events-none" />

        {slides.length > 0 && slides[currentSlideIdx] ? (
          <div className="w-full relative z-10">
            {/* Full Width Image Slide element */}
            <div 
              onClick={() => {
                if (slides[currentSlideIdx].linkCategory) {
                  setActiveCategory(slides[currentSlideIdx].linkCategory);
                  document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="relative group aspect-[2.1/1] sm:aspect-[2.8/1] md:aspect-[3.1/1] xl:aspect-[3.4/1] w-full overflow-hidden bg-zinc-900 cursor-pointer"
            >
              <img 
                src={slides[currentSlideIdx].image} 
                alt={slides[currentSlideIdx].title || "Banner Slide"} 
                className="h-full w-full object-cover transform scale-100 hover:scale-[1.015] transition-transform duration-700"
              />
              
              {/* Premium dark shading on left part to assist typography visibility if any */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />

              {/* Dynamic Overlay Text & CTA Button if slide is configured with information */}
              {(slides[currentSlideIdx].title || slides[currentSlideIdx].subtitle) && (
                <div className="absolute inset-0 flex items-center justify-start p-6 sm:p-12 md:p-16 text-left select-none">
                  <div className="max-w-xs sm:max-w-lg md:max-w-xl space-y-1.5 sm:space-y-3.5 z-20 animate-fade-in">
                    {slides[currentSlideIdx].badge && (
                      <span className="inline-block bg-brand-gold text-brand-black text-[9px] sm:text-[11px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-wider shadow-md">
                        {slides[currentSlideIdx].badge}
                      </span>
                    )}
                    <h1 className="font-display text-base sm:text-2xl md:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
                      {slides[currentSlideIdx].title}
                    </h1>
                    <p className="text-zinc-200 text-xs sm:text-base md:text-lg font-bold drop-shadow-sm font-sans">
                      {slides[currentSlideIdx].subtitle}
                    </p>
                    {slides[currentSlideIdx].priceText && (
                      <div className="text-brand-gold text-xs sm:text-sm md:text-lg font-black font-mono tracking-wide">
                        {slides[currentSlideIdx].priceText}
                      </div>
                    )}
                    
                    <div className="pt-1 sm:pt-3">
                      <span className="inline-flex items-center gap-1.5 bg-white text-brand-black hover:bg-brand-gold hover:text-brand-black font-black text-[8px] sm:text-[10px] md:text-xs px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-xl uppercase tracking-wider transition-all duration-300 shadow-lg">
                        <span>Shop Now</span>
                        <ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Slider Absolute Edge Actions - Left Chevron */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIdx((prev) => (prev - 1 + slides.length) % slides.length);
                }}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-25 h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-white/90 hover:bg-white text-brand-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Previous Banner"
              >
                <ChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>

              {/* Slider Absolute Edge Actions - Right Chevron */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentSlideIdx((prev) => (prev + 1) % slides.length);
                }}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-25 h-8 w-8 sm:h-12 sm:w-12 rounded-full bg-white/90 hover:bg-white text-brand-black flex items-center justify-center shadow-lg hover:scale-105 transition-all duration-300 md:opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Next Banner"
              >
                <ChevronRight className="h-4 w-4 sm:h-6 sm:w-6" />
              </button>

              {/* Dynamic Bottom Indicators dots overlay */}
              <div 
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-25 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/5"
                onClick={(e) => e.stopPropagation()}
              >
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIdx(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentSlideIdx === idx ? 'w-5 bg-brand-gold' : 'w-1.5 bg-white/45 hover:bg-white'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-950">
            <p className="text-zinc-400 font-mono text-xs">No Slider Banners Active. Configure some inside the Admin portal.</p>
          </div>
        )}
      </section>

      {/* 3. Circular Category Shortcuts bar */}
      <section className="py-12 bg-white border-b border-brand-black/5 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="font-display text-xs font-bold uppercase tracking-[0.2em] text-brand-black/45">Quick Category Shortcuts</h3>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-black mt-1">Explore Our Collections</h2>
          
          <div className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-4 sm:gap-6">
            <button
              onClick={() => {
                setActiveCategory('all');
                document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex flex-col items-center group cursor-pointer text-center"
            >
              <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center border-2 shadow-xs transition-all duration-300 ${
                activeCategory === 'all' 
                  ? 'border-brand-black bg-brand-black text-white scale-105' 
                  : 'border-zinc-200 bg-zinc-50 group-hover:border-zinc-400 group-hover:scale-105'
              }`}>
                <ShoppingBag className="h-6 w-6" />
              </div>
              <span className={`text-xs mt-3 font-semibold transition-colors leading-tight ${
                activeCategory === 'all' ? 'text-brand-black font-extrabold' : 'text-brand-black/60 group-hover:text-brand-black'
              }`}>
                All Products
              </span>
            </button>

            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex flex-col items-center group cursor-pointer text-center"
                >
                  <div className={`h-14 w-14 sm:h-16 sm:w-16 rounded-full flex items-center justify-center border-2 shortcut-icon-box shadow-xs transition-all duration-300 ${
                    isActive 
                      ? 'border-brand-black bg-brand-black text-white scale-105' 
                      : 'border-zinc-200 bg-zinc-50 group-hover:border-zinc-400 group-hover:scale-105'
                  }`}>
                    <div className={isActive ? 'text-white [&>*]:text-white' : ''}>
                      {getCategoryIcon(cat.icon)}
                    </div>
                  </div>
                  <span className={`text-xs mt-3 font-semibold transition-colors leading-tight line-clamp-1 ${
                    isActive ? 'text-brand-black font-extrabold' : 'text-brand-black/60 group-hover:text-brand-black'
                  }`}>
                    {cat.name.split(' & ')[0]}
                  </span>
                  <span className="text-[9px] text-zinc-400 font-mono mt-0.5">{cat.count} items</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Active Catalog Block (Sales Countdown + Filter options + Target Grid) */}
      <section id="product-catalog-grid" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Sales Headline Banner with Digital simulated Countdown clock */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-brand-black/10 pb-6 mb-8 text-left">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-600 animate-ping" />
              <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-black uppercase tracking-tight">
                {activeCategory === 'all' ? 'Faizan traders shop items' : CATEGORIES.find(c => c.id === activeCategory)?.name}
              </h2>
            </div>
            <p className="text-xs text-brand-black/50 mt-1 max-w-xl">
              Showing <span className="font-bold text-brand-black">{filteredProducts.length}</span> high-quality items available for nationwide delivery across Pakistan.
            </p>
          </div>

          {/* Flash Sale simulated clock limits */}
          <div className="flex items-center gap-3 bg-red-50 border border-red-200/60 p-3 rounded-xl shadow-xs self-stretch lg:self-auto">
            <span className="text-[10px] font-extrabold text-red-700 uppercase tracking-widest font-mono shrink-0 pl-1">
              ⚡ Flash Deals Ends In:
            </span>
            <div className="flex items-center gap-1 text-red-800 font-mono font-bold text-sm">
              <span className="bg-red-700/10 text-red-800 px-2 py-1 rounded-md min-w-[2rem] text-center">
                {String(countdown.hours).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-red-700/10 text-red-800 px-2 py-1 rounded-md min-w-[2rem] text-center">
                {String(countdown.minutes).padStart(2, '0')}
              </span>
              <span>:</span>
              <span className="bg-red-700/10 text-red-800 px-2 py-1 rounded-md min-w-[2rem] text-center">
                {String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Strip */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-brand-black/5 p-4 rounded-xl mb-8 shadow-xs w-full">
          {/* Active Search indicators tag */}
          <div className="text-left w-full sm:w-auto">
            {searchQuery ? (
              <p className="text-xs text-zinc-500 font-medium">
                Active search: <strong className="text-brand-black">"{searchQuery}"</strong>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="text-red-600 hover:underline font-bold ml-2 text-[10px] uppercase font-mono tracking-wide"
                >
                  Clear search✕
                </button>
              </p>
            ) : (
              <p className="text-xs text-zinc-500 font-medium">
                Filter: <span className="font-bold text-brand-black">{activeCategory === 'all' ? 'Comprehensive Inventory' : activeCategory.replace('-', ' ')}</span>
              </p>
            )}
          </div>

          {/* Sort By selects */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Sort By:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-brand-lightgray border border-brand-black/5 rounded-lg px-3 py-1.5 text-xs text-brand-black font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="popular">Popular Sellers</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Best Rated Reviews</option>
            </select>
          </div>
        </div>

        {/* Dynamic Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-brand-black/5 rounded-2xl p-12 text-center shadow-xs">
            <AlertCircle className="h-10 w-10 text-brand-black/35 mx-auto mb-3" />
            <h4 className="font-display text-sm font-bold text-brand-black">No products match your filters!</h4>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto mt-1 leading-relaxed">
              We couldn't locate items matching your exact search text. Try adjusting your vocabulary spelling or resetting category filters!
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
              }}
              className="mt-4 bg-brand-black text-white hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onViewDetails={setSelectedProduct}
                onAddToCart={(p) => handleAddToCart(p, 1)}
                isItemInCart={cartItems.some(item => item.product.id === prod.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Why Choose Faizan Traders Trust Section */}
      <section className="bg-brand-lightgray/50 py-16 border-t border-b border-brand-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-left">
          <span className="text-xs font-bold tracking-[0.15em] text-zinc-400 font-mono uppercase block mb-1">Our Standard Values</span>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-brand-black">Why Shop At Faizan Traders?</h2>
          
          {/* Bento grid layout items */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            
            <div className="bg-white p-6 rounded-xl border border-brand-black/5 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-xs">
              <div className="rounded-full bg-emerald-50 text-emerald-700 h-11 w-11 flex items-center justify-center border border-emerald-100 mb-4">
                <ShieldCheck className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-brand-black">Quality Assurance</h4>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Every item is carefully checked to verify durability, specifications, and performance.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-brand-black/5 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-xs">
              <div className="rounded-full bg-blue-50 text-blue-700 h-11 w-11 flex items-center justify-center border border-blue-100 mb-4 font-bold text-lg font-mono">
                Rs.
              </div>
              <h4 className="text-sm font-bold text-brand-black">Competitive Pricing</h4>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Direct sourcing allows us to offer premium products without middleman retail inflations.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-brand-black/5 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-xs">
              <div className="rounded-full bg-purple-50 text-purple-700 h-11 w-11 flex items-center justify-center border border-purple-100 mb-4">
                <Clock className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-brand-black">Customer Support</h4>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Friendly support assistants ready to assist on Call and WhatsApp chat queries instantly.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-brand-black/5 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-xs">
              <div className="rounded-full bg-amber-50 text-amber-700 h-11 w-11 flex items-center justify-center border border-amber-100 mb-4">
                <Sparkles className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-brand-black">Wide Product Range</h4>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Exploring thousand products across sofa configurations, smart gadgets, and appliances.</p>
            </div>

            <div className="bg-white p-6 rounded-xl border border-brand-black/5 flex flex-col items-center sm:items-start text-center sm:text-left transition-all hover:shadow-xs">
              <div className="rounded-full bg-rose-50 text-rose-700 h-11 w-11 flex items-center justify-center border border-rose-100 mb-4">
                <Truck className="h-5.5 w-5.5" />
              </div>
              <h4 className="text-sm font-bold text-brand-black">Fast Delivery</h4>
              <p className="text-xs text-zinc-500 mt-2 leading-relaxed">Quick and secure courier parcels nationwide across Pakistan with Cash on Delivery options.</p>
            </div>

          </div>
        </div>
      </section>

      {/* 6. Editorial Story & Mission / Vision Bento-grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12 items-center text-left">
        
        {/* Story Text left */}
        <div className="md:col-span-7 space-y-6">
          <span className="text-xs font-bold tracking-[0.15em] text-brand-gold uppercase font-mono">Faizan Traders Story</span>
          <h2 className="font-display text-3xl sm:text-4xl font-black text-brand-black leading-tight">
            Connecting Quality & Affordability Since Inception
          </h2>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Faizan Traders is a growing retail and wholesale business specializing in home improvement products, kitchen essentials, home appliances, mobile accessories, and innovative daily-use gadgets.
          </p>
          <p className="text-sm text-zinc-600 leading-relaxed">
            Our goal is to provide customers with practical, stylish, and affordable products that enhance everyday living. Whether you're upgrading your living room with premium fitted elastic sofa covers, organizing your pantry cabinets, or looking for useful gadgets, Faizan Traders offers reliable products for every single need.
          </p>
          <p className="text-sm text-zinc-700 font-bold leading-relaxed border-l-4 border-brand-black pl-4">
            We focus on quality, trust, and customer satisfaction, making us a preferred choice for thousands of shopping families and businesses across Pakistan.
          </p>
        </div>

        {/* Mission Vision values bento right column */}
        <div className="md:col-span-5 space-y-6">
          {/* Mission */}
          <div className="bg-white border border-brand-black/5 p-6 rounded-2xl shadow-xs">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-black text-white shrink-0 flex items-center justify-center">
                <Award className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black text-brand-black uppercase tracking-wider">Our Mission</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  To provide high-quality home essentials, accessories, and useful products at affordable prices while maintaining excellent, heartwarming customer support.
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="bg-white border border-brand-black/5 p-6 rounded-2xl shadow-xs">
            <div className="flex gap-4">
              <div className="h-10 w-10 rounded-xl bg-brand-gold text-white shrink-0 flex items-center justify-center">
                <Gem className="h-5.5 w-5.5" />
              </div>
              <div>
                <h3 className="font-display text-sm font-black text-brand-black uppercase tracking-wider">Our Vision</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  To become Pakistan’s most trusted online household products and lifestyle accessories e-commerce brand backed by absolute trust.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic statistics numbers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-lightgray p-4 rounded-xl border border-brand-black/5 text-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-brand-black">1000+</span>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Products Listed</p>
            </div>
            <div className="bg-brand-lightgray p-4 rounded-xl border border-brand-black/5 text-center">
              <span className="font-mono text-xl sm:text-2xl font-black text-brand-black">500+</span>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Happy Customers</p>
            </div>
          </div>
        </div>

      </section>

      {/* 7. Standalone Customer Reviews Banner */}
      <section className="bg-brand-charcoal py-16 text-white border-b border-brand-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-bold tracking-[0.2em] text-brand-gold uppercase font-mono">Verified Testimonials</span>
          <h2 className="font-display text-2xl sm:text-3xl font-black mt-1 text-white">What Our Customers Say</h2>
          
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map((rev) => (
              <div key={rev.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl text-left flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex text-brand-gold gap-0.5">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current text-brand-gold" />
                    ))}
                  </div>
                  <p className="text-zinc-300 text-xs italic mt-4 leading-relaxed font-medium">
                    "{rev.text}"
                  </p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-xs font-bold text-white pr-4">{rev.writer}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Contact Desk Form & Address Info Location Desk Grid */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-12 gap-12 items-start text-left">
        
        {/* left column coordinates address details info */}
        <div className="md:col-span-5 bg-white border border-brand-black/5 rounded-2xl p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-2">
            <Phone className="h-5.5 w-5.5 text-brand-black" />
            <h3 className="font-display text-lg font-bold text-brand-black">Contact Desk</h3>
          </div>
          
          <p className="text-xs text-zinc-500 leading-relaxed border-b border-brand-black/5 pb-4">
            Have questions regarding wholesale bulk rates or custom table measurements? Get connected immediately on our Liaqutabad support cell line.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <MapPin className="h-5 w-5 text-brand-black shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-black uppercase">Karachi Warehouse:</h4>
                <p className="text-xs text-zinc-600 mt-1 whitespace-pre-line">Faizan Traders, Liaqutabad Karachi, Pakistan</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Phone className="h-5 w-5 text-brand-black shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-black uppercase">Call Line support:</h4>
                <a href="tel:+9203303511464" className="text-xs font-bold text-brand-gold hover:underline mt-1 block">
                  +92 0330 3511464
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Mail className="h-5 w-5 text-brand-black shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-black uppercase">Official Email:</h4>
                <a href="mailto:info@faizantrader126.com" className="text-xs font-bold text-brand-gold hover:underline mt-1 block">
                  info@faizantrader126.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <Clock className="h-5 w-5 text-brand-black shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-brand-black uppercase">Timings Open:</h4>
                <p className="text-xs text-zinc-600 mt-1">Monday – Saturday | 10:00 AM - 09:00 PM</p>
              </div>
            </div>
          </div>

          {/* Simple neat map graphic mock */}
          <div className="h-28 bg-brand-lightgray/80 border border-brand-black/5 rounded-xl overflow-hidden relative flex items-center justify-center p-3">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative text-center">
              <MapPin className="h-5 w-5 text-brand-black mx-auto mb-1 animate-bounce" />
              <span className="text-[10px] uppercase font-bold text-brand-black tracking-wider block">Liaqutabad Central Karachi</span>
              <span className="text-[8px] text-zinc-500 font-mono mt-0.5 block">24.9080Â° N, 67.0423Â° E</span>
            </div>
          </div>
        </div>

        {/* right column enquiry forms */}
        <div className="md:col-span-7 bg-white border border-brand-black/5 rounded-2xl p-6 md:p-8">
          <h3 className="font-display text-lg font-bold text-brand-black">Send Us An Direct Inquiry</h3>
          <p className="text-xs text-zinc-500 mt-1">Submit your details and order query. Our agent will verify items in stock and reply on WhatsApp.</p>
          
          <form onSubmit={handleInquirySubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Your Full Name: *</label>
                <input 
                  type="text" 
                  value={inquiryName}
                  onChange={(e) => setInquiryName(e.target.value)}
                  placeholder="Enter full name"
                  required
                  className="w-full mt-1.5 bg-brand-lightgray border border-brand-black/10 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">WhatsApp Mobile No: *</label>
                <input 
                  type="tel" 
                  value={inquiryPhone}
                  onChange={(e) => setInquiryPhone(e.target.value)}
                  placeholder="e.g. 03303511464"
                  required
                  className="w-full mt-1.5 bg-brand-lightgray border border-brand-black/10 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-brand-black uppercase tracking-wider font-mono">Your Inquiry / Message details: *</label>
              <textarea 
                rows={3}
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                placeholder="Describe your household requests or product sizing requirements details..."
                required
                className="w-full mt-1.5 bg-brand-lightgray border border-brand-black/10 rounded-lg px-3.5 py-3 text-xs focus:ring-1 focus:ring-brand-black focus:outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={inquirySubmitted}
              className="w-full bg-brand-black hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase py-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {inquirySubmitted ? (
                <>Loading...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Transmit Inquiry Document</span>
                </>
              )}
            </button>
          </form>
        </div>

      </section>

      {/* 9. Brand footer area panel */}
      <footer className="mt-auto bg-brand-black text-white pt-16 pb-12 border-t border-white/5 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-12 gap-10">
          
          {/* Brand details and logo */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-3.5 rounded-2xl max-w-[12rem] border border-white/10 flex justify-center items-center">
              <Logo size="sm" showPhone={false} className="scale-95" />
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-sm pt-2">
              Faizan Traders is Pakistan’s growing retail and wholesale hub, specializing in modern stretch sofa slipcovers, waterproof dining table covers, culinary kitchenware, appliances, cables, Power banks, and everyday life-hack gadgets.
            </p>
            <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest pt-2">
              ⚡ www.faizantraders.com • Liaqutabad Karachi
            </div>
          </div>

          {/* Links Quick column */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-brand-gold">Catalogs Collections</h4>
            <div className="flex flex-col gap-2 text-zinc-400 text-xs">
              {CATEGORIES.slice(0, 4).map((c) => (
                <button 
                  key={c.id} 
                  onClick={() => {
                    setActiveCategory(c.id);
                    document.getElementById('product-catalog-grid')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors text-left font-semibold cursor-pointer"
                >
                  Shop Custom {c.name.split(' & ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Guidelines Links column */}
          <div className="md:col-span-4 space-y-4 text-xs font-mono">
            <h4 className="font-display text-xs font-black uppercase tracking-wider text-white">Trust Badges</h4>
            <div className="space-y-3 pt-1 text-zinc-400 font-sans">
              <p className="flex items-center gap-2.5">
                <Truck className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <span>Nationwide Pakistan Delivery COD</span>
              </p>
              <p className="flex items-center gap-2.5">
                <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-brand-gold" />
                <span>Verified Client Satisfaction Guarantee</span>
              </p>
              <p className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-500" />
                <span>100% Secure Package Deliveries</span>
              </p>
            </div>
          </div>

        </div>

        {/* Copy bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-white/5 mt-12 pt-8 space-y-4 text-zinc-500 text-[11px] font-mono text-center sm:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span>&copy; {new Date().getFullYear()} Faizan Traders. All Rights Reserved. Development version.</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Privacy Shield</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">Customer terms of use</a>
            </div>
          </div>

          {/* User-provided metadata info directly in footer */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-white font-bold uppercase tracking-wider text-[10px]">Database Connection Status</span>
              </div>
              <p className="text-zinc-400 text-[10px]">
                Connected to project <strong className="text-white">vwoqpxljyxqacadnpgfk</strong> | Owner Node <strong className="text-white">faizantrader126@gmail.com</strong>
              </p>
              <div className="text-[9px] text-zinc-500 overflow-hidden text-ellipsis whitespace-nowrap max-w-[280px] sm:max-w-md">
                Publishable Key: sb_publishable_8imO92Hxr2KGilgnAbNsVw_Dho4Vc9q
              </div>
            </div>
            
            <button
              onClick={() => setIsManagerOpen(true)}
              className="px-4 py-2 bg-brand-gold text-brand-black text-[10px] font-extrabold uppercase rounded-xl hover:bg-yellow-650 transition-colors shrink-0 tracking-wide cursor-pointer flex items-center gap-1.5"
            >
              🔐 Admin Panel & CRM Access
            </button>
          </div>
        </div>
      </footer>

      {/* 10. Sticky WhatsApp Floating badge indicator clickable bottom right */}
      <a
        href="https://wa.me/9203303511464?text=Assalam-o-Alaikum%20Faizan%20Traders!%20I%20am%20visiting%20your%20website%20and%20I%20need%20assistance%20on%20premium%20home%20products."
        target="_blank"
        referrerPolicy="no-referrer"
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center rounded-full bg-[#25d366] p-4 text-white shadow-2xl hover:scale-105 transition-transform group"
        title="Chat on WhatsApp"
      >
        <span className="max-w-0 overflow-hidden font-bold text-xs whitespace-nowrap group-hover:max-w-xs group-hover:mr-2 transition-all duration-300">
          Chat With Us
        </span>
        <svg 
          role="img" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 fill-current"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.57.15-.097.297-.378.735-.462.83-.084.1-.168.11-.465-.04-.3-.149-1.265-.467-2.41-1.485-.89-.79-1.49-1.77-1.666-2.07-.176-.3-.02-.462.13-.61.137-.134.3-.349.45-.523.15-.174.2-.297.3-.495.1-.2.05-.371-.02-.52-.07-.149-.572-1.378-.784-1.893-.207-.502-.416-.434-.57-.442-.143-.008-.308-.01-.472-.01a.92.92 0 0 0-.668.312c-.23.25-.875.855-.875 2.083c0 1.228.89 2.414.992 2.551c.102.137 1.748 2.67 4.232 3.742c.592.255 1.055.408 1.417.522c.594.19 1.131.163 1.558.1c.475-.072 1.472-.6 1.67-.183l.035.035a1.866 1.866 0 0 1-.806 1.157c-.23.111-.53.21-.926.3c.097-.091.196-.183.29-.278zM12.016 0C5.383 0 0 5.385 0 12.018c0 2.223.606 4.3 1.657 6.104l-1.65 6.03l6.175-1.618a11.96 11.96 0 0 0 5.834 1.503c6.634 0 12.018-5.385 12.018-12.019c0-6.633-5.384-12.018-12.018-12.018zm0 22.02c-1.956 0-3.873-.526-5.55-1.523l-.398-.236l-3.666.96l.978-3.57l-.26-.413A9.972 9.972 0 0 1 12.016 2.008c5.518 0 10.01 4.49 10.01 10.01c0 5.517-4.492 10.012-10.01 10.012z"/>
        </svg>
      </a>

      {/* 11. MODALS HANDLER PORTALS */}

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onAddToCart={handleAddToCart}
            isItemInCart={cartItems.some(item => item.product.id === selectedProduct.id)}
          />
        )}
      </AnimatePresence>

      {/* Cart Drawer off-canvas */}
      <AnimatePresence>
        {isCartOpen && (
          <CartDrawer
            cartItems={cartItems}
            onClose={() => setIsCartOpen(false)}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveFromCart}
            onProceedToCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Checkout Forms Portal Dialog */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <CheckoutModal
            cartItems={cartItems}
            onClose={() => setIsCheckoutOpen(false)}
            onClearCart={handleClearCart}
            onOrderCompleted={hangleOrderCompleted}
          />
        )}
      </AnimatePresence>

      {/* Past Orders Tracker Board overlay Dialog */}
      <AnimatePresence>
        {isTrackerOpen && (
          <OrderTrackerModal
            orders={orders}
            onClose={() => setIsTrackerOpen(false)}
            onSimulateStatus={handleSimulateStatus}
          />
        )}
      </AnimatePresence>

      {/* Product Catalog & Inventory Manage Portal */}
      <AnimatePresence>
        {isManagerOpen && (
          <ProductManagerModal
            products={products}
            onClose={() => setIsManagerOpen(false)}
            onSaveProducts={saveProductsToStorage}
            slides={slides}
            onSaveSlides={saveSlidesToStorage}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
