'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/cart')
      .then(res => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            throw new Error('Unauthorized');
          }
          throw new Error('Failed to load cart');
        }
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setCart(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') {
          setError(err.message);
          setLoading(false);
        }
      });
  }, [router]);

  const handlePlaceOrder = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/place', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place order');
      }
      
      setSuccess(true);
      window.dispatchEvent(new Event('cartUpdated')); // Update navbar
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div style={loaderWrapper}>
      <div style={spinner}></div>
      <p style={{marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569'}}>SYNCING CART DATA...</p>
    </div>
  );

  if (success) return (
    <div style={pageBg}>
      <div style={container}>
        <div style={successCard}>
          <div style={successIcon}>✓</div>
          <h1 style={title}>Order Placed Successfully!</h1>
          <p style={subtitle}>Your transaction was processed across the relational ledger and NoSQL cluster.</p>
          <Link href="/admin/orders" style={btnPrimary}>View in Command Center</Link>
          <Link href="/" style={btnSecondary}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );

  const subtotal = cart?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;

  return (
    <div style={pageBg}>
      <div style={container}>
        <h1 style={title}>Distributed Checkout</h1>
        <p style={subtitle}>Review your items from the NoSQL Cart Collection before placing an ACID transaction.</p>
        
        {error && <div style={errorBox}>{error}</div>}

        <div style={grid}>
          <div style={cartCol}>
            {cart && cart.length === 0 ? (
              <div style={emptyCart}>
                <p>Your cart is empty.</p>
                <Link href="/" style={btnPrimary}>Browse Catalog</Link>
              </div>
            ) : (
              cart?.map((item, idx) => (
                <div key={idx} style={cartItem}>
                  <img src={item.image_url || '/logo.png'} alt={item.sku} style={itemImg} />
                  <div style={itemInfo}>
                    <div style={itemName}>SKU: {item.sku}</div>
                    <div style={itemMeta}>Variant ID: {item.variant_id}</div>
                    <div style={itemPrice}>{item.price?.toLocaleString(undefined, { style: 'currency', currency: item.currency || 'USD' })} x {item.quantity}</div>
                  </div>
                  <div style={itemTotal}>
                    {(item.price * item.quantity).toLocaleString(undefined, { style: 'currency', currency: item.currency || 'USD' })}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {cart && cart.length > 0 && (
            <div style={summaryCol}>
              <div style={summaryCard}>
                <h3 style={summaryTitle}>Order Summary</h3>
                <div style={summaryRow}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={summaryRow}>
                  <span>Estimated Tax</span>
                  <span>Calculated at execution</span>
                </div>
                <div style={divider}></div>
                <div style={summaryTotal}>
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}+</span>
                </div>
                
                <button 
                  style={processing ? btnDisabled : btnPrimaryFull} 
                  onClick={handlePlaceOrder}
                  disabled={processing}
                >
                  {processing ? 'Processing Transaction...' : 'Place ACID Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const pageBg = { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '60px 24px' };
const container = { maxWidth: '1000px', margin: '0 auto' };
const title = { fontSize: '32px', fontWeight: '900', color: '#0f172a', marginBottom: '8px' };
const subtitle = { fontSize: '15px', color: '#64748b', marginBottom: '40px' };

const grid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' };
const cartCol = { display: 'flex', flexDirection: 'column', gap: '16px' };
const summaryCol = { position: 'sticky', top: '40px' };

const cartItem = { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '20px' };
const itemImg = { width: '80px', height: '80px', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '8px' };
const itemInfo = { flex: 1 };
const itemName = { fontSize: '16px', fontWeight: '700', color: '#0f172a' };
const itemMeta = { fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' };
const itemPrice = { fontSize: '14px', color: '#475569', fontWeight: '600', marginTop: '8px' };
const itemTotal = { fontSize: '18px', fontWeight: '800', color: '#0f172a' };

const emptyCart = { padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' };

const summaryCard = { backgroundColor: 'white', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' };
const summaryTitle = { fontSize: '20px', fontWeight: '800', color: '#0f172a', marginBottom: '24px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' };
const summaryRow = { display: 'flex', justifyContent: 'space-between', fontSize: '15px', color: '#475569', marginBottom: '16px', fontWeight: '500' };
const divider = { height: '1px', backgroundColor: '#e2e8f0', margin: '24px 0' };
const summaryTotal = { display: 'flex', justifyContent: 'space-between', fontSize: '24px', fontWeight: '900', color: '#0f172a', marginBottom: '32px' };

const btnPrimaryFull = { width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: 'white', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(15,23,42,0.3)' };
const btnDisabled = { ...btnPrimaryFull, backgroundColor: '#94a3b8', cursor: 'not-allowed', boxShadow: 'none' };
const btnPrimary = { display: 'inline-block', padding: '14px 28px', backgroundColor: '#0f172a', color: 'white', textDecoration: 'none', fontWeight: '700', borderRadius: '12px', marginTop: '16px', marginRight: '16px' };
const btnSecondary = { display: 'inline-block', padding: '14px 28px', backgroundColor: 'white', color: '#0f172a', textDecoration: 'none', fontWeight: '700', borderRadius: '12px', border: '2px solid #0f172a', marginTop: '16px' };

const errorBox = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontWeight: '600' };

const loaderWrapper = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };

const successCard = { backgroundColor: 'white', padding: '60px 40px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' };
const successIcon = { width: '80px', height: '80px', backgroundColor: '#10b981', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 24px auto', boxShadow: '0 10px 20px -5px rgba(16,185,129,0.4)' };
