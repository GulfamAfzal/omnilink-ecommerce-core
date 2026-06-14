'use client';
import { useState, use } from 'react';

export default function CheckoutPage({ params }) {
  // Unwrap the dynamic route ID (e.g., PROD_MBP14_M3_001)
  const resolvedParams = use(params);
  const variant_id = resolvedParams.id;

  // Local state for the simulation
  const [userId, setUserId] = useState('1');
  const [regionId, setRegionId] = useState('1');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState(null);

  useEffect(() => {
    // Fetch product details to show real Product details instead of just the variant ID
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        const item = data.find(p => p._id === variant_id || p.sku === variant_id);
        if (item) setProductData(item);
      })
      .catch(console.error);
  }, [variant_id]);

  const handlePurchase = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Processing distributed transaction...' });

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variant_id,
          quantity: parseInt(quantity),
          user_id: parseInt(userId),
          region_id: parseInt(regionId),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Success! Order #${data.order_details?.order_id || data.order_id || 'Confirmed'} placed. Oracle Inventory updated.` 
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: data.details || data.error || 'Transaction Failed' 
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error or Server is down' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageBg}>
      <div style={container}>
        <div style={card}>
          <div style={header}>
            <h1 style={title}>Secure Checkout</h1>
            <p style={subtitle}>System: <strong style={{color: '#6366f1'}}>Hybrid OMS (Oracle + MongoDB)</strong></p>
          </div>
          
          <div style={formContainer}>
            {productData ? (
              <div style={productDetailsBox}>
                <div style={{display: 'flex', gap: '15px', alignItems: 'center'}}>
                  <div style={imageThumbBox}>
                    <img src={productData.image_url} alt={productData.productName} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                  </div>
                  <div>
                    <span style={{fontSize: '11px', fontWeight: '800', color: '#6366f1', textTransform: 'uppercase'}}>{productData.brand}</span>
                    <h3 style={{margin: '4px 0', fontSize: '16px', color: '#0f172a'}}>{productData.productName}</h3>
                    <div style={{fontSize: '14px', fontWeight: 'bold', color: '#475569'}}>
                      {productData.price?.toLocaleString(undefined, {style: 'currency', currency: productData.currency || 'USD'})}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={productBadge}>
                <span style={badgeLabel}>Product ID</span>
                <span style={badgeValue}>{variant_id}</span>
              </div>
            )}
            
            <div style={inputGroup}>
              <label style={label}>Simulation User ID</label>
              <input 
                type="number" 
                value={userId} 
                onChange={(e) => setUserId(e.target.value)}
                style={input}
              />
            </div>

            <div style={inputGroup}>
              <label style={label}>Quantity</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={(e) => setQuantity(e.target.value)}
                style={input}
                min="1"
              />
            </div>

            <button 
              onClick={handlePurchase}
              disabled={loading}
              style={{...button, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}
            >
              {loading ? (
                <span style={{display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center'}}>
                  <span style={spinner}></span> Executing ACID Transaction...
                </span>
              ) : 'CONFIRM PURCHASE'}
            </button>
          </div>

          {status && (
            <div style={{
              ...statusBox,
              backgroundColor: status.type === 'success' ? '#ecfdf5' : status.type === 'error' ? '#fef2f2' : '#eff6ff',
              borderColor: status.type === 'success' ? '#10b981' : status.type === 'error' ? '#ef4444' : '#3b82f6',
              color: status.type === 'success' ? '#065f46' : status.type === 'error' ? '#991b1b' : '#1e40af'
            }}>
              <strong style={{display: 'block', marginBottom: '4px'}}>System Message</strong> 
              {status.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- DESIGN SYSTEM ---
const pageBg = { backgroundColor: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' };
const container = { width: '100%', maxWidth: '500px' };
const card = { backgroundColor: 'var(--background)', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden' };
const header = { padding: '30px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' };
const title = { margin: '0 0 8px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' };
const subtitle = { margin: 0, fontSize: '13px', color: '#64748b' };
const formContainer = { padding: '30px' };
const productBadge = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px' };
const productDetailsBox = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', marginBottom: '24px' };
const imageThumbBox = { width: '60px', height: '60px', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const badgeLabel = { fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' };
const badgeValue = { fontSize: '14px', fontWeight: '800', color: '#6366f1' };
const inputGroup = { marginBottom: '20px' };
const label = { display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' };
const input = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' };
const button = { width: '100%', padding: '14px', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800', transition: 'background-color 0.2s' };
const statusBox = { margin: '0 30px 30px', padding: '16px', borderRadius: '8px', border: '1px solid', fontSize: '13px', lineHeight: '1.5' };
const spinner = { width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 1s linear infinite' };