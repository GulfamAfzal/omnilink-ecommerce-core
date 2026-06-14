'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search, SlidersHorizontal, ShoppingCart, ChevronLeft, ChevronRight,
  PackageX, AlertCircle, RefreshCw, Clock, X, ArrowRight, Zap
} from 'lucide-react';
import { resolveImageUrl, handleImageError } from '@/lib/imageUtils';

const ITEMS_PER_PAGE = 12;
const MAX_RECENT = 5;

export default function HomePage() {
  const router = useRouter();

  // Data state
  const [products, setProducts]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const [toast, setToast]           = useState(null);

  // Filter state
  const [searchQuery, setSearchQuery]   = useState('');
  const [selectedBrands, setSelectedBrands]  = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange]     = useState([0, 200000]);
  const [maxPrice, setMaxPrice]         = useState(200000);
  const [currentPage, setCurrentPage]   = useState(1);

  // Recently searched SKUs
  const [recentSearches, setRecentSearches] = useState([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('oms_recent_searches') || '[]');
      setRecentSearches(stored);
    } catch { setRecentSearches([]); }
  }, []);

  const saveSearch = useCallback((q) => {
    if (!q || q.trim().length < 2) return;
    const term = q.trim();
    setRecentSearches(prev => {
      const updated = [term, ...prev.filter(s => s !== term)].slice(0, MAX_RECENT);
      localStorage.setItem('oms_recent_searches', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('oms_recent_searches');
  };

  // Fetch products
  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch('/api/products')
      .then(r => { if (!r.ok) throw new Error(`Server error: ${r.status}`); return r.json(); })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        // Derive max price for slider
        const prices = list.flatMap(p => p.variants?.map(v => v.price || 0) || [0]);
        const top = prices.length ? Math.ceil(Math.max(...prices) / 1000) * 1000 : 200000;
        setMaxPrice(top);
        setPriceRange([0, top]);
        setLoading(false);
      })
      .catch(err => { setError(err.message || 'Failed to load products.'); setLoading(false); });
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Toast helper
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Add to cart
  const handleAddToCart = async (e, item) => {
    e.stopPropagation();
    const variantId = item.variants?.[0]?.variant_id;
    if (!variantId) return;
    setAddingToCart(variantId);
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id: variantId, quantity: 1 })
      });
      if (res.status === 401) {
        showToast('Please log in to add items to your cart.', 'error');
        setTimeout(() => router.push('/login'), 1200);
        return;
      }
      if (!res.ok) throw new Error('Failed');
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`Added to cart successfully.`);
    } catch {
      showToast('Unable to add item. Please try again.', 'error');
    } finally {
      setAddingToCart(null);
    }
  };

  // Derive brand list
  const allBrands = useMemo(() => {
    const set = new Set(products.map(p => p.brand).filter(Boolean));
    return [...set].sort();
  }, [products]);

  // Filter logic
  const filtered = useMemo(() => {
    return products.filter(p => {
      const target = `${p.productName || p.name || ''} ${p.brand || ''} ${p.description || ''}`.toLowerCase();
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q || target.includes(q);

      const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);

      const catMap = {
        'Smartphones': ['phone', 'smart', 'iphone', 'galaxy', 'infinix', 'samsung', 'xiaomi', 'oppo', 'vivo'],
        'Laptops':     ['laptop', 'macbook', 'notebook', 'mbp', 'thinkpad'],
        'Audio':       ['audio', 'headphone', 'earphone', 'speaker', 'wh', 'airpod'],
        'Tablets':     ['tablet', 'ipad'],
      };
      const matchesCat = selectedCategory === 'All' ||
        (catMap[selectedCategory] || []).some(kw => target.includes(kw));

      const price = p.variants?.[0]?.price || 0;
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];

      return matchesSearch && matchesBrand && matchesCat && matchesPrice;
    });
  }, [products, searchQuery, selectedBrands, selectedCategory, priceRange]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, selectedBrands, selectedCategory, priceRange]);

  const toggleBrand = (brand) => {
    setSelectedBrands(prev =>
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedCategory('All');
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') saveSearch(searchQuery);
  };

  /* ─── Loading State ─────────────────────────── */
  if (loading) return (
    <div style={centerWrap}>
      <div className="spinner spinner-lg" />
      <p style={{ color: '#6B7280', fontSize: '0.8125rem', marginTop: '1rem', fontWeight: '600' }}>
        Syncing with Global Catalog…
      </p>
    </div>
  );

  /* ─── Error State ───────────────────────────── */
  if (error) return (
    <div style={centerWrap}>
      <div style={errorCard}>
        <AlertCircle size={32} color="#EF4444" strokeWidth={1.5} style={{ marginBottom: '0.75rem' }} />
        <p style={{ fontWeight: '700', color: '#F9FAFB', marginBottom: '0.25rem' }}>Catalog Unavailable</p>
        <p style={{ fontSize: '0.8125rem', color: '#6B7280', marginBottom: '1.25rem' }}>
          Unable to load products. Please check your connection or try again.
        </p>
        <button onClick={fetchProducts} style={retryBtn}>
          <RefreshCw size={14} strokeWidth={2} />
          Retry
        </button>
      </div>
    </div>
  );

  /* ─── Main Page ─────────────────────────────── */
  return (
    <div style={pageBg}>

      {/* Toast */}
      {toast && (
        <div style={{
          ...toastStyle,
          backgroundColor: toast.type === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
          borderColor: toast.type === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
          color: toast.type === 'error' ? '#EF4444' : '#10B981',
        }}>
          {toast.type === 'error'
            ? <AlertCircle size={14} strokeWidth={2} />
            : <Zap size={14} strokeWidth={2} />}
          {toast.msg}
        </div>
      )}

      <div style={pageLayout} className="page-layout">

        {/* ── SIDEBAR FILTER ─────────────────── */}
        <aside style={sidebar} className="filter-sidebar">

          <div style={sidebarHead}>
            <SlidersHorizontal size={15} color="#06B6D4" strokeWidth={2} />
            <span style={sidebarTitle}>Filters</span>
            <span style={resultBadge}>{filtered.length}</span>
          </div>

          {/* Search */}
          <div style={filterGroup}>
            <label style={filterLabel}>Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={14} color="#4B5563" style={{ position: 'absolute', left: '0.625rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                id="product-search"
                className="input-dark"
                placeholder="Product name or brand…"
                style={{ paddingLeft: '2rem' }}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchSubmit}
              />
            </div>

            {/* Recently Searched */}
            {recentSearches.length > 0 && (
              <div style={recentWrap}>
                <div style={recentHeader}>
                  <Clock size={11} color="#6B7280" strokeWidth={2} />
                  <span style={recentTitle}>Recent</span>
                  <button onClick={clearRecent} style={clearBtn} aria-label="Clear recent searches">
                    <X size={10} strokeWidth={2.5} />
                  </button>
                </div>
                <div style={recentPills}>
                  {recentSearches.map(s => (
                    <button key={s} style={recentPill} onClick={() => setSearchQuery(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div style={filterGroup}>
            <label style={filterLabel}>Category</label>
            <div style={catGrid}>
              {['All', 'Smartphones', 'Laptops', 'Audio', 'Tablets'].map(cat => (
                <button
                  key={cat}
                  style={selectedCategory === cat ? catBtnActive : catBtn}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Checkboxes */}
          {allBrands.length > 0 && (
            <div style={filterGroup}>
              <label style={filterLabel}>Brand</label>
              <div style={brandList}>
                {allBrands.map(brand => (
                  <label key={brand} style={checkRow}>
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleBrand(brand)}
                      style={{ accentColor: '#06B6D4', width: '14px', height: '14px' }}
                    />
                    <span style={checkLabel}>{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Price Range */}
          <div style={filterGroup}>
            <label style={filterLabel}>Price Range</label>
            <div style={priceDisplay}>
              <span style={priceVal}>{priceRange[0].toLocaleString()}</span>
              <span style={{ color: '#4B5563' }}>—</span>
              <span style={priceVal}>{priceRange[1].toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={0}
              max={maxPrice}
              step={500}
              value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
              style={sliderStyle}
            />
          </div>

          {/* Reset */}
          <button onClick={resetFilters} style={resetBtn}>
            <RefreshCw size={13} strokeWidth={2} />
            Reset Filters
          </button>
        </aside>

        {/* ── MAIN CONTENT ───────────────────── */}
        <div style={mainArea}>

          {/* Hero Banner */}
          <section style={heroBanner}>
            <div style={heroMesh} />
            <div style={heroContent}>
              <span style={heroBadge}>
                <Zap size={10} strokeWidth={2.5} /> GLOBAL CATALOG
              </span>
              <h1 style={heroTitle}>Enterprise Commerce</h1>
              <p style={heroSub}>
                Unified product provisioning across 3 global regions.
              </p>
              <Link href="/register" style={heroCta}>
                Get Started <ArrowRight size={14} strokeWidth={2.5} />
              </Link>
            </div>
          </section>

          {/* Product Grid */}
          {paginated.length === 0 ? (
            <div style={emptyState}>
              <PackageX size={40} color="#374151" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
              <p style={{ fontWeight: '700', color: '#9CA3AF', fontSize: '1rem' }}>No products found</p>
              <p style={{ color: '#6B7280', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Try adjusting your filters or search terms.
              </p>
              <button onClick={resetFilters} style={{ ...retryBtn, marginTop: '1.25rem' }}>
                <RefreshCw size={13} strokeWidth={2} /> Clear Filters
              </button>
            </div>
          ) : (
            <div style={gridStyle} className="product-grid">
              {paginated.map((item, idx) => {
                const imgSrc     = resolveImageUrl(item.media?.[0]?.url);
                const brandName  = (item.brand || 'OMNILINK').toUpperCase();
                const name       = item.productName || item.name || 'Product';
                const variant    = item.variants?.[0];
                const price      = variant?.price || 0;
                const currency   = variant?.currency || 'USD';
                const variantId  = variant?.variant_id;
                const isAdding   = addingToCart === variantId;
                const colorSpecs = item.variants?.slice(0, 4).map(v => v.specifications?.color).filter(Boolean);

                return (
                  <div
                    key={item._id || idx}
                    style={cardStyle}
                    className="card-hover"
                    onClick={() => router.push(`/products/${item._id}`)}
                    role="button"
                    tabIndex={0}
                  >
                    {/* Image */}
                    <div style={imgBox}>
                      <img
                        src={imgSrc}
                        alt={name}
                        style={imgMain}
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </div>

                    {/* Details */}
                    <div style={cardBody}>
                      <span style={brandTag}>{brandName}</span>
                      <h3 style={cardName}>{name}</h3>

                      {/* Color variant badges */}
                      {colorSpecs?.length > 0 && (
                        <div style={colorRow}>
                          {colorSpecs.map((c, i) => (
                            <span key={i} style={colorBadge}>{c}</span>
                          ))}
                        </div>
                      )}

                      {/* Price + Cart */}
                      <div style={priceRow}>
                        <div>
                          <div style={currencyTag}>{currency}</div>
                          <div style={priceAmt}>
                            {price > 0 ? price.toLocaleString() : 'N/A'}
                          </div>
                        </div>
                        <button
                          id={`add-cart-${variantId}`}
                          onClick={e => handleAddToCart(e, item)}
                          style={{ ...cartBtn, opacity: isAdding ? 0.6 : 1 }}
                          disabled={isAdding || !variantId}
                          aria-label={`Add ${name} to cart`}
                        >
                          {isAdding
                            ? <span className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }} />
                            : <ShoppingCart size={15} strokeWidth={2} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={paginationBar}>
              {currentPage > 1 && (
                <button onClick={() => setCurrentPage(p => p - 1)} style={pageBtn}>
                  <ChevronLeft size={15} strokeWidth={2.5} />
                  Previous
                </button>
              )}
              <span style={pageInfo}>
                Page {currentPage} of {totalPages} &nbsp;·&nbsp; {filtered.length} results
              </span>
              {currentPage < totalPages && (
                <button onClick={() => setCurrentPage(p => p + 1)} style={pageBtn}>
                  Next
                  <ChevronRight size={15} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Design Tokens ──────────────────────────────────────── */
const pageBg      = { backgroundColor: 'transparent', minHeight: '100vh' };
const pageLayout  = { maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '1.5rem', padding: '1.5rem', alignItems: 'flex-start' };
const centerWrap  = { minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' };

const errorCard   = { backgroundColor: '#FFFFFF', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0', borderRadius: '16px', padding: '2rem', textAlign: 'center', maxWidth: '360px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' };
const retryBtn    = { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', backgroundColor: '#06B6D4', color: '#000', border: 'none', borderRadius: '6px', fontWeight: '700', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' };

/* Toast */
const toastStyle  = {
  position: 'fixed', top: '80px', right: '1.5rem', zIndex: 2000,
  display: 'flex', alignItems: 'center', gap: '0.5rem',
  padding: '0.75rem 1.125rem',
  border: '1px solid',
  borderRadius: '8px', fontSize: '0.8125rem', fontWeight: '600',
  animation: 'slideInRight 0.3s ease', maxWidth: '300px',
  backdropFilter: 'blur(10px)',
};

/* Sidebar */
const sidebar     = {
  width: '260px', minWidth: '220px', flexShrink: 0,
  backgroundColor: '#FFFFFF',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0',
  borderRadius: '16px', padding: '1.25rem',
  position: 'sticky', top: '80px', height: 'fit-content',
  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
};
const sidebarHead = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' };
const sidebarTitle = { fontSize: '0.875rem', fontWeight: '800', color: '#0F172A', flex: 1 };
const resultBadge  = { fontSize: '0.75rem', fontWeight: '800', color: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.1)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(6,182,212,0.2)', padding: '0.1rem 0.5rem', borderRadius: '10px' };

const filterGroup  = { marginBottom: '1.25rem' };
const filterLabel  = { display: 'block', fontSize: '0.7rem', fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' };

/* Recent searches */
const recentWrap   = { marginTop: '0.5rem', padding: '0.625rem', backgroundColor: '#F8FAFB', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0' };
const recentHeader = { display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.375rem' };
const recentTitle  = { fontSize: '0.7rem', color: '#94A3B8', fontWeight: '600', flex: 1 };
const clearBtn     = { background: 'none', border: 'none', color: '#CBD5E1', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' };
const recentPills  = { display: 'flex', flexWrap: 'wrap', gap: '0.3rem' };
const recentPill   = { fontSize: '0.7rem', color: '#475569', backgroundColor: '#EDF2F7', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0', padding: '0.2rem 0.5rem', borderRadius: '10px', cursor: 'pointer', fontFamily: 'inherit' };

/* Category buttons */
const catGrid  = { display: 'flex', flexWrap: 'wrap', gap: '0.375rem' };
const catBtn   = { fontSize: '0.75rem', fontWeight: '600', color: '#475569', backgroundColor: '#F8FAFB', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0', padding: '0.3rem 0.625rem', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s' };
const catBtnActive = { ...catBtn, color: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.3)' };

/* Brands */
const brandList = { display: 'flex', flexDirection: 'column', gap: '0.375rem', maxHeight: '160px', overflowY: 'auto' };
const checkRow  = { display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' };
const checkLabel = { fontSize: '0.8125rem', color: '#475569', fontWeight: '500' };

/* Price slider */
const priceDisplay = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem' };
const priceVal     = { color: '#06B6D4', fontWeight: '700', fontSize: '0.75rem' };
const sliderStyle  = { width: '100%', accentColor: '#06B6D4', cursor: 'pointer' };

const resetBtn = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
  padding: '0.5rem', backgroundColor: '#F8FAFB', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0',
  borderRadius: '6px', color: '#64748B', fontSize: '0.8125rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
};

/* Main area */
const mainArea = { flex: 1, minWidth: 0 };

/* Hero */
const heroBanner = {
  background: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 60%, #0891B2 100%)',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#BFDBFE',
  borderRadius: '16px',
  padding: '2.5rem 3rem',
  marginBottom: '1.5rem',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(37,99,235,0.2)',
};
const heroMesh = {
  position: 'absolute', inset: 0,
  backgroundImage: 'radial-gradient(rgba(6,182,212,0.06) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};
const heroContent = { position: 'relative', zIndex: 2 };
const heroBadge   = {
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.7rem', fontWeight: '800', color: '#06B6D4',
  backgroundColor: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
  padding: '0.25rem 0.625rem', borderRadius: '20px', letterSpacing: '0.08em',
  marginBottom: '0.875rem',
};
const heroTitle = { fontSize: '1.75rem', fontWeight: '800', color: '#F9FAFB', margin: '0 0 0.5rem', letterSpacing: '-0.5px' };
const heroSub   = { fontSize: '0.875rem', color: '#6B7280', marginBottom: '1.25rem', maxWidth: '400px', lineHeight: '1.6' };
const heroCta   = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  backgroundColor: '#06B6D4', color: '#000',
  padding: '0.5rem 1.125rem', borderRadius: '6px',
  fontWeight: '700', fontSize: '0.875rem', textDecoration: 'none',
};

/* Product Grid */
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', width: '100%' };
const emptyState = { textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#FFFFFF', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' };

const cardStyle = {
  backgroundColor: '#FFFFFF',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: '#E2E8F0',
  borderRadius: '12px',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  cursor: 'pointer',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  transition: 'border-color 0.2s, transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s',
};
const imgBox  = {
  height: '140px',
  backgroundColor: '#F8FAFB',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1rem',
  borderBottom: '1px solid #E2E8F0',
};
const imgMain = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };

const cardBody  = { padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', flex: 1 };
const brandTag  = { fontSize: '0.65rem', fontWeight: '800', color: '#2563EB', backgroundColor: 'rgba(37,99,235,0.08)', padding: '0.15rem 0.45rem', borderRadius: '4px', alignSelf: 'flex-start', letterSpacing: '0.04em' };
const cardName  = { fontSize: '0.8125rem', fontWeight: '700', color: '#0F172A', lineHeight: '1.4', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis', minHeight: '2.3em' };

const colorRow  = { display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.125rem' };
const colorBadge = { fontSize: '0.65rem', color: '#64748B', backgroundColor: '#EDF2F7', borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0', padding: '0.1rem 0.4rem', borderRadius: '4px' };

const priceRow  = { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '0.5rem' };
const currencyTag = { fontSize: '0.65rem', fontWeight: '700', color: '#94A3B8' };
const priceAmt  = { fontSize: '1rem', fontWeight: '800', color: '#0F172A' };
const cartBtn   = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: '32px', height: '32px',
  backgroundColor: '#06B6D4', color: '#000',
  border: 'none', borderRadius: '6px', cursor: 'pointer',
  transition: 'background-color 0.2s',
};

/* Pagination */
const paginationBar = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  gap: '1rem', marginTop: '2rem', padding: '1rem',
};
const pageBtn  = {
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  padding: '0.5rem 1rem', backgroundColor: '#FFFFFF',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#E2E8F0',
  borderRadius: '6px', color: '#475569',
  fontSize: '0.875rem', fontWeight: '600',
  cursor: 'pointer', fontFamily: 'inherit',
  transition: 'border-color 0.2s, color 0.2s',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};
const pageInfo = { fontSize: '0.8125rem', color: '#64748B', fontWeight: '500' };