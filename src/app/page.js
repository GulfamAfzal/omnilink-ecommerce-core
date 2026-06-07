'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

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

  const router = useRouter();

  const handleAddToCart = (e, variantId) => {
    e.stopPropagation(); // Prevent navigation to product page
    console.log(`Prepared to link Variant ID: ${variantId} to Azure SQL Ledger`);
  };

  if (loading) return (
    <div style={loaderWrapper}>
      <div style={spinner}></div>
      <p style={{marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569'}}>Syncing with Global Catalog...</p>
    </div>
  );

  if (error) return (
    <div style={loaderWrapper}>
      <div style={{fontSize: '32px', marginBottom: '12px'}}>⚠️</div>
      <p style={{fontSize: '14px', fontWeight: '700', color: '#ef4444'}}>Catalog Unavailable</p>
      <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '6px'}}>{error}</p>
      <button onClick={() => { setError(null); setLoading(true); fetch('/api/products').then(r=>r.json()).then(d=>{setProducts(Array.isArray(d)?d:[]);setLoading(false);}).catch(e=>{setError(e.message);setLoading(false);}); }} style={{marginTop:'16px', padding:'8px 18px', backgroundColor:'#0f172a', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700', fontSize:'12px'}}>Retry</button>
    </div>
  );

  return (
    <div style={pageBg}>
      <div style={mainContainer} className="page-layout">
        
        {/* --- DYNAMIC SIDEBAR FILTER --- */}
        <aside style={sidebar} className="filter-sidebar">
          <h2 style={filterTitle}>Parameters</h2>
          
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
            <select 
              style={filterSelect}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
                <option value="All">All Hardware</option>
                <option value="Laptops">Laptops</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Audio">Audio Gear</option>
            </select>
          </div>

          <button style={applyBtn} onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}>Reset Filters</button>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <div style={contentArea}>
          <section style={heroSection}>
            <div style={heroOverlay}></div>
            <div style={heroContent}>
              <span style={heroBadge}>GLOBAL OPERATIONS</span>
              <h1 style={heroTitle}>Enterprise Solutions</h1>
              <p style={heroSub}>Unified provisioning for sharded distributed networks.</p>
            </div>
          </section>

          {/* --- 4 COLUMN GRID (Forced 4-Column Symmetry) --- */}
          <div style={gridStyle} className="product-grid">
            {products
              .filter(p => {
                const searchTarget = `${p.productName || p.name || ''} ${p.brand || ''}`.toLowerCase();
                const currentQuery = (searchQuery || '').toLowerCase().trim();
                const matchesSearch = !currentQuery || searchTarget.includes(currentQuery);

                const categoryKeywords = {
                  'Laptops':     ['laptop', 'macbook', 'notebook', 'mbp'],
                  'Smartphones': ['phone', 'iphone', 'galaxy'],
                  'Audio':       ['audio', 'headphone', 'earphone', 'speaker', 'wh'],
                };
                const matchesCat = selectedCategory === 'All' || (
                  categoryKeywords[selectedCategory] || []
                ).some(kw => searchTarget.includes(kw));

                return matchesSearch && matchesCat;
              })
              .map((item, index) => {
                const primaryImage = item.media?.[0]?.url || '/logo.png';
                const brandName = (item.brand || 'OMS OMNILINK').toUpperCase();
                const productName = item.productName || item.name || 'Hardware Node';
                
                // Get the first variant to display a base price and action link
                const firstVariant = item.variants?.[0];
                const basePrice = firstVariant?.price || 0;
                const currency = firstVariant?.currency || 'USD';
                const variantId = firstVariant?.variant_id || 'N/A';

                return (
                  <div 
                    key={item._id || index} 
                    style={cardStyle}
                    onClick={() => { /* Navigation could be updated here if needed */ }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.borderColor = '#818cf8';
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(99, 102, 241, 0.1), 0 8px 10px -6px rgba(99, 102, 241, 0.1)';
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
                      
                      <h3 style={variantTitle}>
                        {productName}
                      </h3>
                      
                      <div style={priceArea}>
                          <div style={priceWrapper}>
                              <span style={currencyStyle}>{currency}</span>
                              <span style={amount}>{basePrice.toLocaleString(undefined, { style: 'currency', currency: currency, maximumFractionDigits: 0 })}</span>
                          </div>
                          <button onClick={(e) => handleAddToCart(e, variantId)} style={cartAddBtn}>+</button>
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

// --- DESIGN SYSTEM (PREMIUM & VIBRANT) ---
const pageBg = { backgroundColor: '#f8fafc', minHeight: '100vh', backgroundImage: 'radial-gradient(#6366f111 1px, transparent 1px)', backgroundSize: '30px 30px' };
const mainContainer = { maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '32px', padding: '32px 24px', flexWrap: 'wrap' };
const sidebar = { width: '280px', minWidth: '240px', backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(10px)', borderRadius: '24px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', height: 'fit-content', position: 'sticky', top: '100px' };
const filterTitle = { fontSize: '20px', fontWeight: '900', marginBottom: '28px', color: '#0f172a', letterSpacing: '-0.5px' };
const filterGroup = { marginBottom: '24px' };
const filterLabel = { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' };
const filterSelect = { width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc', transition: 'border-color 0.2s', cursor: 'pointer' };
const filterInputFull = { ...filterSelect, cursor: 'text' };
const applyBtn = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)', border: 'none', borderRadius: '12px', fontWeight: '800', color: '#475569', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };

const contentArea = { flex: 1 };
const heroSection = { background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', padding: '50px 60px', borderRadius: '24px', marginBottom: '40px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px -10px rgba(79,70,229,0.3)' };
const heroOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 };
const heroContent = { position: 'relative', zIndex: 2 };
const heroBadge = { display: 'inline-block', fontSize: '11px', fontWeight: '800', color: '#1e293b', backgroundColor: '#f8fafc', padding: '6px 12px', borderRadius: '20px', letterSpacing: '1px', marginBottom: '16px' };
const heroTitle = { fontSize: '42px', fontWeight: '900', margin: '0 0 12px 0', letterSpacing: '-1px', textShadow: '0 2px 4px rgba(0,0,0,0.1)' };
const heroSub = { fontSize: '16px', opacity: 0.9, maxWidth: '500px', lineHeight: '1.6' };

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', width: '100%' };
const cardStyle = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer' };
const imageBox = { height: '140px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' };
const imgMain = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'transform 0.3s ease' };
const detailsArea = { padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9' };
const metaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' };
const brandTag = { fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', backgroundColor: '#e0e7ff', padding: '4px 8px', borderRadius: '6px' };

const variantTitle = { fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', minHeight: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', textOverflow: 'ellipsis', lineHeight: '1.4' };

const priceArea = { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const priceWrapper = { display: 'flex', flexDirection: 'column' };
const currencyStyle = { fontSize: '10px', fontWeight: '800', color: '#64748b' };
const amount = { fontSize: '20px', fontWeight: '900', color: '#0f172a' };
const cartAddBtn = { background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s ease, box-shadow 0.2s ease', boxShadow: '0 4px 6px rgba(15,23,42,0.2)' };

const loaderWrapper = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };