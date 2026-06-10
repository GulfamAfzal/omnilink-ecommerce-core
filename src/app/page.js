'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [addingToCart, setAddingToCart] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load products.');
        setLoading(false);
      });
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

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
        showToast('Please log in to add items to cart.', 'error');
        setTimeout(() => router.push('/login'), 1200);
        return;
      }
      if (!res.ok) throw new Error('Failed');
      window.dispatchEvent(new Event('cartUpdated'));
      showToast(`Added to cart!`);
    } catch {
      showToast('Failed to add to cart.', 'error');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) return (
    <div style={loaderWrapper}>
      <div style={spinner} />
      <p style={{ marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>Syncing with Global Catalog...</p>
    </div>
  );

  if (error) return (
    <div style={loaderWrapper}>
      <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</div>
      <p style={{ fontSize: '14px', fontWeight: '700', color: '#ef4444' }}>Catalog Unavailable</p>
      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '6px' }}>{error}</p>
      <button
        onClick={() => { setError(null); setLoading(true); fetch('/api/products').then(r => r.json()).then(d => { setProducts(Array.isArray(d) ? d : []); setLoading(false); }).catch(e => { setError(e.message); setLoading(false); }); }}
        style={{ marginTop: '16px', padding: '8px 18px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}
      >Retry</button>
    </div>
  );

  const filtered = products.filter(p => {
    const searchTarget = `${p.productName || p.name || ''} ${p.brand || ''}`.toLowerCase();
    const q = (searchQuery || '').toLowerCase().trim();
    const matchesSearch = !q || searchTarget.includes(q);
    const catKw = { 'Laptops': ['laptop', 'macbook', 'notebook', 'mbp'], 'Smartphones': ['phone', 'iphone', 'galaxy'], 'Audio': ['audio', 'headphone', 'earphone', 'speaker', 'wh'] };
    const matchesCat = selectedCategory === 'All' || (catKw[selectedCategory] || []).some(kw => searchTarget.includes(kw));
    return matchesSearch && matchesCat;
  });

  return (
    <div style={pageBg}>
      {/* Toast Notification */}
      {toast && (
        <div style={{ ...toastStyle, backgroundColor: toast.type === 'error' ? '#fef2f2' : '#f0fdf4', borderColor: toast.type === 'error' ? '#fecaca' : '#bbf7d0', color: toast.type === 'error' ? '#dc2626' : '#15803d' }}>
          {toast.type === 'error' ? '⚠️' : '✓'} {toast.msg}
        </div>
      )}

      <div style={mainContainer} className="page-layout">

        {/* --- SIDEBAR FILTER --- */}
        <aside style={sidebar} className="filter-sidebar">
          <h2 style={filterTitle}>Filters</h2>
          <div style={filterGroup}>
            <label style={filterLabel}>Quick Search</label>
            <input
              placeholder="e.g. MacBook..."
              style={filterInputFull}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div style={filterGroup}>
            <label style={filterLabel}>Category</label>
            <select style={filterSelect} value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="All">All Hardware</option>
              <option value="Laptops">Laptops</option>
              <option value="Smartphones">Smartphones</option>
              <option value="Audio">Audio Gear</option>
            </select>
          </div>
          <div style={filterGroup}>
            <label style={filterLabel}>Results</label>
            <div style={resultCount}>{filtered.length} product{filtered.length !== 1 ? 's' : ''}</div>
          </div>
          <button style={applyBtn} onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>
            Reset Filters
          </button>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <div style={contentArea}>
          <section style={heroSection}>
            <div style={heroOverlay} />
            <div style={heroContent}>
              <span style={heroBadge}>GLOBAL OPERATIONS</span>
              <h1 style={heroTitle}>Enterprise Solutions</h1>
              <p style={heroSub}>Unified provisioning for sharded distributed networks.</p>
              <Link href="/register" style={heroCta}>Get Started →</Link>
            </div>
          </section>

          {/* Product Grid */}
          <div style={gridStyle} className="product-grid">
            {filtered.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
                <div style={{ fontWeight: '700', fontSize: '18px' }}>No products found</div>
                <div style={{ fontSize: '14px', marginTop: '8px' }}>Try adjusting your search or filters</div>
              </div>
            ) : filtered.map((item, index) => {
              const primaryImage = item.media?.[0]?.url || '/logo.png';
              const brandName = (item.brand || 'OMS OMNILINK').toUpperCase();
              const productName = item.productName || item.name || 'Hardware Node';
              const firstVariant = item.variants?.[0];
              const basePrice = firstVariant?.price || 0;
              const currency = firstVariant?.currency || 'USD';
              const variantId = firstVariant?.variant_id;
              const isAdding = addingToCart === variantId;

              return (
                <div
                  key={item._id || index}
                  style={cardStyle}
                  onClick={() => router.push(`/products/${item._id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-6px)';
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(99, 102, 241, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)';
                  }}
                >
                  <div style={imageBox}>
                    <img
                      src={primaryImage}
                      alt={productName}
                      style={imgMain}
                      onError={(e) => e.target.src = '/logo.png'}
                    />
                  </div>

                  <div style={detailsArea}>
                    <div style={metaRow}>
                      <span style={brandTag}>{brandName}</span>
                    </div>
                    <h3 style={variantTitle}>{productName}</h3>
                    <div style={priceArea}>
                      <div style={priceWrapper}>
                        <span style={currencyStyle}>{currency}</span>
                        <span style={amount}>
                          {basePrice.toLocaleString(undefined, { style: 'currency', currency, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        style={{ ...cartAddBtn, opacity: isAdding ? 0.6 : 1 }}
                        disabled={isAdding}
                        title="Add to Cart"
                      >
                        {isAdding ? '…' : '+'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DESIGN SYSTEM ---
const pageBg = { backgroundColor: '#f8fafc', minHeight: '100vh', backgroundImage: 'radial-gradient(#6366f111 1px, transparent 1px)', backgroundSize: '30px 30px', position: 'relative' };
const mainContainer = { maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '32px', padding: '32px 24px', flexWrap: 'wrap' };

const toastStyle = { position: 'fixed', top: '100px', right: '24px', zIndex: 2000, padding: '14px 20px', borderRadius: '12px', border: '1px solid', fontSize: '14px', fontWeight: '700', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', animation: 'slideInRight 0.3s ease', maxWidth: '320px' };

const sidebar = { width: '280px', minWidth: '240px', backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', height: 'fit-content', position: 'sticky', top: '100px' };
const filterTitle = { fontSize: '20px', fontWeight: '900', marginBottom: '28px', color: '#0f172a', letterSpacing: '-0.5px' };
const filterGroup = { marginBottom: '24px' };
const filterLabel = { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' };
const filterSelect = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', cursor: 'pointer' };
const filterInputFull = { ...filterSelect, cursor: 'text' };
const resultCount = { fontSize: '22px', fontWeight: '900', color: '#6366f1' };
const applyBtn = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', border: 'none', borderRadius: '12px', fontWeight: '800', color: '#475569', fontSize: '13px', cursor: 'pointer' };

const contentArea = { flex: 1 };
const heroSection = { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', padding: '50px 60px', borderRadius: '24px', marginBottom: '40px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(79,70,229,0.3)' };
const heroOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '24px 24px' };
const heroContent = { position: 'relative', zIndex: 2 };
const heroBadge = { display: 'inline-block', fontSize: '11px', fontWeight: '800', color: '#1e293b', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '20px', letterSpacing: '1px', marginBottom: '16px' };
const heroTitle = { fontSize: '42px', fontWeight: '900', margin: '0 0 12px 0', letterSpacing: '-1px' };
const heroSub = { fontSize: '16px', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6', marginBottom: '24px' };
const heroCta = { display: 'inline-block', backgroundColor: 'white', color: '#4f46e5', padding: '12px 24px', borderRadius: '12px', fontWeight: '800', fontSize: '14px', textDecoration: 'none' };

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', width: '100%' };
const cardStyle = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' };
const imageBox = { height: '140px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' };
const imgMain = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' };
const detailsArea = { padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', borderTop: '1px solid #f1f5f9' };
const metaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const brandTag = { fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: '#e0e7ff', padding: '4px 8px', borderRadius: '6px' };
const variantTitle = { fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', minHeight: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis', lineHeight: '1.4' };
const priceArea = { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const priceWrapper = { display: 'flex', flexDirection: 'column' };
const currencyStyle = { fontSize: '10px', fontWeight: '800', color: '#64748b' };
const amount = { fontSize: '20px', fontWeight: '900', color: '#0f172a' };
const cartAddBtn = { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 6px rgba(99,102,241,0.3)' };

const loaderWrapper = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };