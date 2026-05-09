'use client';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setVariants(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleAddToCart = (item) => {
    alert(`Provisioned to Cart: ${item.productName}`);
  };

  if (loading) return (
    <div style={loaderWrapper}>
      <div style={spinner}></div>
      <p style={{marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569'}}>SYNCING GLOBAL CATALOG...</p>
    </div>
  );

  return (
    <div style={pageBg}>
      <div style={mainContainer}>
        
        {/* --- DYNAMIC SIDEBAR FILTER --- */}
        <aside style={sidebar}>
          <h2 style={filterTitle}>Parameters</h2>
          
          <div style={filterGroup}>
            <label style={filterLabel}>Quick Search</label>
            <input 
              placeholder="e.g. MacBook..." 
              style={filterInputFull} 
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

          <button style={applyBtn} onClick={() => alert("Filters Applied")}>Execute Filter</button>
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
          <div style={gridStyle}>
            {variants
              .filter(v => {
                // SAFE GUARD: Create a safe searchable string
                // It checks productName first, then sku, then defaults to empty string
                const searchTarget = (v.productName || v.sku || "").toLowerCase();
                const currentQuery = (searchQuery || "").toLowerCase();
                
                const matchesSearch = searchTarget.includes(currentQuery);
                
                // Category Filter logic (Safe version)
                const matchesCat = selectedCategory === 'All' || 
                                  (v.productName && v.productName.includes(selectedCategory.slice(0,-1)));
                                  
                return matchesSearch && matchesCat;
              })
              .map((item) => (
                // ... rest of your card code
              <div 
                key={item._id} 
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.borderColor = '#6366f1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={imageBox}>
                  <img 
                    src={item.image_url} 
                    alt={item.productName} 
                    style={imgMain} 
                    onError={(e) => e.target.src = '/logo.png'} 
                  />
                </div>

                <div style={detailsArea}>
                  <div style={metaRow}>
                    <span style={brandTag}>{item.brand}</span>
                    <div style={statusChip}><span style={pulseDot}></span> Live</div>
                  </div>
                  
                  {/* --- DISPLAYING PRODUCT NAME INSTEAD OF SKU --- */}
                  <h3 style={variantTitle}>
                    {item.productName}
                    {item.variant_attributes?.[0] && (
                        <span style={variantLabel}> — {item.variant_attributes[0].label}</span>
                    )}
                  </h3>
                  
                  <div style={specGrid}>
                    {item.specifications && Object.entries(item.specifications).slice(0, 2).map(([key, value]) => (
                      <div key={key} style={specItem}>
                        <span style={{opacity: 0.6, textTransform: 'capitalize'}}>{key}:</span> {value}
                      </div>
                    ))}
                  </div>

                  <div style={priceArea}>
                      <div style={priceWrapper}>
                          <span style={currency}>{item.currency}</span>
                          <span style={amount}>${item.price?.toLocaleString()}</span>
                      </div>
                      <button onClick={() => handleAddToCart(item)} style={cartAddBtn}>+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DESIGN SYSTEM (COMPACT & PROFESSIONAL) ---
const pageBg = { backgroundColor: '#f8fafc', minHeight: '100vh' };
const mainContainer = { maxWidth: '1440px', margin: '0 auto', display: 'flex', gap: '25px', padding: '25px 24px' };
const sidebar = { width: '260px', backgroundColor: 'white', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', height: 'fit-content', position: 'sticky', top: '100px' };
const filterTitle = { fontSize: '18px', fontWeight: '800', marginBottom: '25px', color: '#0f172a' };
const filterGroup = { marginBottom: '20px' };
const filterLabel = { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '8px' };
const filterSelect = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' };
const filterInputFull = { ...filterSelect };
const applyBtn = { width: '100%', padding: '12px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', fontWeight: '700', color: '#475569', fontSize: '12px', cursor: 'pointer' };

const contentArea = { flex: 1 };
const heroSection = { background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', padding: '40px 50px', borderRadius: '20px', marginBottom: '30px', color: 'white', position: 'relative', overflow: 'hidden' };
const heroOverlay = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(#6366f122 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.3 };
const heroContent = { position: 'relative', zIndex: 2 };
const heroBadge = { fontSize: '10px', fontWeight: '800', color: '#818cf8', letterSpacing: '1.5px', marginBottom: '10px', display: 'block' };
const heroTitle = { fontSize: '32px', fontWeight: '900', margin: '0 0 10px 0' };
const heroSub = { fontSize: '15px', opacity: 0.7 };

const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' };
const cardStyle = { backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column' };
const imageBox = { height: '150px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', borderBottom: '1px solid #f1f5f9' };
const imgMain = { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' };
const detailsArea = { padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f0f7ff' };
const metaRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' };
const brandTag = { fontSize: '10px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase' };
const statusChip = { fontSize: '9px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' };
const pulseDot = { height: '5px', width: '5px', backgroundColor: '#10b981', borderRadius: '50%' };

const variantTitle = { fontSize: '14px', fontWeight: '800', color: '#0f172a', margin: '0 0 12px 0', height: '34px', overflow: 'hidden' };
const variantLabel = { color: '#6366f1', fontWeight: '600' };
const specGrid = { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '20px' };
const specItem = { fontSize: '11px', color: '#475569' };

const priceArea = { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' };
const priceWrapper = { display: 'flex', flexDirection: 'column' };
const currency = { fontSize: '8px', fontWeight: '800', color: '#64748b' };
const amount = { fontSize: '18px', fontWeight: '900', color: '#0f172a' };
const cartAddBtn = { backgroundColor: '#0f172a', color: 'white', border: 'none', width: '32px', height: '32px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' };

const loaderWrapper = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '35px', height: '35px', border: '3px solid #f3f3f3', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };