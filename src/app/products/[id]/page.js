'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // You could dynamically pass region_id here if known
    fetch(`/api/products/${productId}`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load product details.');
        setLoading(false);
      });
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product || !product.variants || product.variants.length === 0) return;
    
    // Pick the primary variant for the cart
    const variant_id = product.variants[0].variant_id;
    
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id, quantity: 1 })
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          alert("Please login to add items to your cart.");
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to add to cart");
      }
      
      // Notify the navbar (layout.js listens for this)
      window.dispatchEvent(new Event('cartUpdated'));
      alert("Added to cart successfully in Distributed NoSQL Engine!");
    } catch (e) {
      console.error(e);
      alert("Error adding to cart.");
    }
  };

  if (loading) return (
    <div style={loaderWrapper}>
      <div style={spinner}></div>
      <p style={{marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569'}}>RETRIEVING ASSET DATA...</p>
    </div>
  );

  if (error) return (
    <div style={loaderWrapper}>
      <div style={{fontSize: '32px', marginBottom: '12px'}}>⚠️</div>
      <p style={{fontSize: '14px', fontWeight: '700', color: '#ef4444'}}>Catalog Sync Error</p>
      <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '6px'}}>{error}</p>
      <Link href="/" style={retryBtn}>Back to Catalog</Link>
    </div>
  );

  const primaryVariant = product.variants?.[0] || {};
  const sku = primaryVariant.sku || 'N/A';
  const price = primaryVariant.price || 0;
  const currency = primaryVariant.currency || 'USD';
  
  // Real-time stock from inventory pivot
  const inventoryData = primaryVariant.inventory_data?.[0];
  const inStock = inventoryData ? inventoryData.quantity > 0 : false;
  const primaryImage = product.media?.[0]?.url || '/logo.png';

  return (
    <div style={pageBg}>
      <div style={container}>
        <div style={breadcrumb}>
          <Link href="/" style={breadcrumbLink}>Catalog</Link>
          <span style={breadcrumbSep}>/</span>
          <span style={breadcrumbCurrent}>{product.productName}</span>
        </div>

        <div style={productGrid}>
          {/* --- LEFT: IMAGE VIEWPORT --- */}
          <div style={imageCol}>
            <div style={mainImageCard}>
              <img 
                src={primaryImage} 
                alt={product.productName} 
                style={mainImg} 
                onError={(e) => e.target.src = '/logo.png'} 
              />
            </div>
          </div>

          {/* --- RIGHT: PRODUCT INTELLIGENCE --- */}
          <div style={detailsCol}>
            <div style={brandBadge}>{product.brand || 'OMS OMNILINK'}</div>
            <h1 style={productTitle}>{product.productName}</h1>
            
            <div style={statusRow}>
              <div style={{...statusChip, color: inStock ? '#10b981' : '#ef4444'}}>
                {inStock ? <span style={pulseDot}></span> : <span style={{...pulseDot, backgroundColor: '#ef4444', animation: 'none'}}></span>}
                {inStock ? 'Inventory Active' : 'Out of Stock'}
              </div>
              <span style={skuTag}>SKU: {sku}</span>
            </div>

            <div style={priceContainer}>
              <div style={priceWrapper}>
                <span style={currencyStyle}>{currency}</span>
                <span style={amount}>{price.toLocaleString(undefined, { style: 'currency', currency: currency })}</span>
              </div>
              <div style={taxInfo}>* Taxes and shipping calculated at checkout</div>
            </div>

            <div style={descriptionBox}>
              <h3 style={sectionHead}>Description</h3>
              <p style={descriptionText}>
                {product.description || `Enterprise-grade ${product.productName} optimized for high-performance workflows within the Omnilink ecosystem. This unit features unified provisioning and native integration with sharded distributed networks.`}
              </p>
            </div>

            <div style={actionRow}>
              <button onClick={handleAddToCart} style={cartBtn}>Add to Cart</button>
              <Link href={`/checkout`} style={buyBtn}>Initiate Purchase</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- DESIGN SYSTEM (PREMIUM) ---
const pageBg = { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '60px 24px' };
const container = { maxWidth: '1200px', margin: '0 auto' };

const breadcrumb = { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' };
const breadcrumbLink = { fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: '600' };
const breadcrumbSep = { fontSize: '13px', color: '#cbd5e1' };
const breadcrumbCurrent = { fontSize: '13px', color: '#0f172a', fontWeight: '700' };

const productGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'start' };

const imageCol = { position: 'sticky', top: '120px' };
const mainImageCard = { backgroundColor: 'white', borderRadius: '32px', border: '1px solid #e2e8f0', padding: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 50px -12px rgba(0,0,0,0.05)' };
const mainImg = { maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' };

const detailsCol = { display: 'flex', flexDirection: 'column' };
const brandBadge = { fontSize: '12px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' };
const productTitle = { fontSize: '40px', fontWeight: '900', color: '#0f172a', margin: '0 0 16px 0', letterSpacing: '-1px', lineHeight: '1.1' };

const statusRow = { display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' };
const statusChip = { fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px' };
const pulseDot = { height: '8px', width: '8px', backgroundColor: '#10b981', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' };
const skuTag = { fontSize: '11px', color: '#94a3b8', fontWeight: '600' };

const priceContainer = { marginBottom: '40px', padding: '24px', backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' };
const priceWrapper = { display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' };
const currencyStyle = { fontSize: '14px', fontWeight: '800', color: '#64748b' };
const amount = { fontSize: '36px', fontWeight: '900', color: '#0f172a' };
const taxInfo = { fontSize: '11px', color: '#94a3b8', fontWeight: '500' };

const sectionHead = { fontSize: '14px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' };
const descriptionBox = { marginBottom: '32px' };
const descriptionText = { fontSize: '16px', color: '#475569', lineHeight: '1.6' };

const actionRow = { display: 'flex', gap: '16px', marginTop: '20px' };
const cartBtn = { flex: 1, padding: '18px', borderRadius: '16px', border: '2px solid #0f172a', backgroundColor: 'transparent', color: '#0f172a', fontWeight: '800', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s' };
const buyBtn = { flex: 2, padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)', transition: 'all 0.2s' };

const loaderWrapper = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const retryBtn = { marginTop:'24px', padding:'12px 24px', backgroundColor:'#0f172a', color:'white', border:'none', borderRadius:'12px', cursor:'pointer', fontWeight:'800', fontSize:'14px', textDecoration: 'none' };
