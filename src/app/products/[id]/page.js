'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Star, Trash2, Plus, Minus, ShoppingCart, CreditCard } from 'lucide-react';

export default function ProductDetailPage({ params }) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    setUser(saved ? JSON.parse(saved) : null);

    Promise.all([
      fetch(`/api/products/${productId}`).then(r => r.json()),
      fetch(`/api/reviews?productId=${productId}`).then(r => r.json())
    ])
    .then(([prodData, revData]) => {
      if (prodData.error) throw new Error(prodData.error);
      setProduct(prodData);
      if (revData && !revData.error) {
        setReviews(revData.reviews || []);
      }
      setLoading(false);
    })
    .catch((err) => {
      setError(err.message || 'Failed to load product details.');
      setLoading(false);
    });
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product || !product.variants || product.variants.length === 0) return;
    const variant_id = product.variants[0].variant_id;
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variant_id, quantity })
      });
      if (!res.ok) {
        if (res.status === 401) {
          alert("Please login to add items to your cart.");
          window.location.href = "/login";
          return;
        }
        throw new Error("Failed to add to cart");
      }
      window.dispatchEvent(new Event('cartUpdated'));
      alert("Added to cart successfully!");
    } catch (e) {
      console.error(e);
      alert("Error adding to cart.");
    }
  };

  const handleDeleteProduct = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Failed to delete product");
      alert("Product deleted successfully");
      window.location.href = "/";
    } catch(e) {
      console.error(e);
      alert(e.message);
    }
  };

  if (loading) return (
    <div style={centerStyle}>
      <div style={spinnerStyle}></div>
      <p style={{marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569'}}>RETRIEVING ASSET DATA...</p>
    </div>
  );

  if (error) return (
    <div style={centerStyle}>
      <div style={{fontSize: '32px', marginBottom: '12px'}}>⚠️</div>
      <p style={{fontSize: '14px', fontWeight: '700', color: '#ef4444'}}>Catalog Sync Error</p>
      <p style={{fontSize: '12px', color: '#94a3b8', marginTop: '6px'}}>{error}</p>
      <Link href="/" style={{...btnSecondary, marginTop: '24px'}}>Back to Catalog</Link>
    </div>
  );

  const primaryVariant = product.variants?.[0] || {};
  const sku = primaryVariant.sku || 'N/A';
  const price = primaryVariant.price || 0;
  const currency = primaryVariant.currency || 'USD';
  
  const inventoryData = primaryVariant.inventory_data?.[0];
  const inStock = inventoryData ? inventoryData.quantity > 0 : false;
  const primaryImage = product.media?.[0]?.url || product.imageUrl || '/logo.png';
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div style={pageWrapper}>
      <div style={container}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', fontWeight: '600', color: '#64748B', textDecoration: 'none' }}>Catalog</Link>
          <span style={{ fontSize: '13px', color: '#CBD5E1' }}>/</span>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{product.productName}</span>
        </div>

        <div style={gridContainer}>
          {/* LEFT: IMAGE VIEWPORT */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={imageCard}>
              <img 
                src={primaryImage} 
                alt={product.productName} 
                style={mainImg}
                onError={(e) => { e.target.onerror = null; e.target.src = '/logo.png'; }}
              />
            </div>
          </div>

          {/* RIGHT: PRODUCT INTELLIGENCE */}
          <div style={detailsCard}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              {product.brand || 'OMNILINK Core'}
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0F172A', marginBottom: '16px', lineHeight: '1.2' }}>
              {product.productName}
            </h1>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{...statusBadge, color: inStock ? '#10B981' : '#EF4444'}}>
                <span style={{...pulseDot, backgroundColor: inStock ? '#10B981' : '#EF4444', animation: inStock ? 'pulse 2s infinite' : 'none'}}></span>
                {inStock ? 'Inventory Active' : 'Out of Stock'}
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>SKU: {sku}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', color: '#F59E0B' }}>
              <div style={{ display: 'flex' }}>
                {[1,2,3,4,5].map(star => (
                  <Star key={star} size={16} fill={star <= Math.round(avgRating) ? "currentColor" : "transparent"} strokeWidth={2} />
                ))}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>{reviews.length} Review(s)</span>
            </div>

            <div style={priceCard}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#64748B' }}>{currency}</span>
                <span style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A' }}>{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>* Taxes and shipping calculated at checkout</div>
              
              <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569', uppercase: 'true' }}>Quantity:</span>
                <div style={qtyControl}>
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} style={qtyBtn}><Minus size={16} strokeWidth={2.5}/></button>
                  <span style={qtyText}>{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} style={qtyBtn}><Plus size={16} strokeWidth={2.5}/></button>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>Description</h3>
              <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6' }}>
                {product.description || `Enterprise-grade ${product.productName} optimized for high-performance workflows within the Omnilink ecosystem.`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={handleAddToCart} style={btnGhost}>
                <ShoppingCart size={18} strokeWidth={2.5} />
                Add to Cart
              </button>
              <Link href="/checkout" style={btnPrimary}>
                <CreditCard size={18} strokeWidth={2.5} />
                Initiate Purchase
              </Link>
            </div>

            {user?.userType === 'Admin' && (
              <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #B0C4DE' }}>
                <button onClick={handleDeleteProduct} style={btnDanger}>
                  <Trash2 size={16} strokeWidth={2.5} />
                  Delete Product (Admin)
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* REVIEWS SECTION */}
        <div style={reviewsCard}>
          <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', marginBottom: '24px' }}>Customer Feedback Matrix</h3>
          {reviews.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#64748B', fontStyle: 'italic' }}>No reviews yet for this asset.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {reviews.map(review => (
                <div key={review._id} style={{ paddingBottom: '24px', borderBottom: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', color: '#F59E0B' }}>
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} size={14} fill={star <= review.rating ? "currentColor" : "transparent"} strokeWidth={2} />
                      ))}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#334155' }}>{review.title || 'Verified Purchase'}</span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>{review.comment}</p>
                  <p style={{ fontSize: '11px', color: '#94A3B8', fontWeight: '500' }}>User ID: {review.user_id}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// --- DESIGN SYSTEM (PREMIUM) ---
const pageWrapper = { padding: '48px 24px', minHeight: '100vh' };
const container = { maxWidth: '1200px', margin: '0 auto' };

const gridContainer = { display: 'grid', gridTemplateColumns: '1fr', gap: '40px', alignItems: 'start' };
// Injecting media query equivalent
if (typeof window !== 'undefined' && window.innerWidth >= 768) {
  gridContainer.gridTemplateColumns = '1fr 1fr';
}

const imageCard = { backgroundColor: '#D9E6F0', borderRadius: '24px', padding: '32px', display: 'flex', justifyContent: 'center', border: '1px solid #B0C4DE', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' };
const mainImg = { maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' };

const detailsCard = { backgroundColor: 'rgba(208, 225, 253, 0.4)', padding: '32px', borderRadius: '24px', border: '1px solid #B0C4DE' };

const statusBadge = { fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FFFFFF', border: '1px solid #B0C4DE', padding: '6px 12px', borderRadius: '20px' };
const pulseDot = { width: '8px', height: '8px', borderRadius: '50%' };

const priceCard = { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #B0C4DE', marginBottom: '32px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };

const qtyControl = { display: 'flex', alignItems: 'center', backgroundColor: '#EBF2F7', borderRadius: '8px', border: '1px solid #B0C4DE' };
const qtyBtn = { padding: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569' };
const qtyText = { width: '40px', textAlign: 'center', fontSize: '14px', fontWeight: '700', color: '#0F172A' };

const btnPrimary = { flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '14px', textDecoration: 'none', cursor: 'pointer', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' };
const btnGhost = { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', backgroundColor: 'transparent', color: '#0F172A', border: '2px solid #0F172A', borderRadius: '12px', fontWeight: '800', fontSize: '14px', cursor: 'pointer' };
const btnSecondary = { display: 'inline-block', padding: '12px 24px', backgroundColor: '#0F172A', color: 'white', textDecoration: 'none', fontWeight: '700', borderRadius: '12px' };
const btnDanger = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' };

const reviewsCard = { marginTop: '64px', backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '24px', border: '1px solid #B0C4DE', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };

const centerStyle = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinnerStyle = { width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTop: '4px solid #06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite' };
