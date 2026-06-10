'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SAGA_STEPS = [
  { id: 1, label: 'Reserving Inventory', sub: 'Locking stock in MongoDB Atlas cluster...' },
  { id: 2, label: 'Creating Ledger Entry', sub: 'Writing ACID transaction to Azure SQL...' },
  { id: 3, label: 'Calculating Tax', sub: 'Applying regional tax invariants...' },
  { id: 4, label: 'Transaction Complete', sub: 'Cross-engine commit confirmed.' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [sagaStep, setSagaStep] = useState(0);  // 0 = idle, 1-4 = steps
  const [sagaError, setSagaError] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  useEffect(() => {
    fetch('/api/cart')
      .then(res => {
        if (res.status === 401) { router.push('/login'); throw new Error('Unauthorized'); }
        if (!res.ok) throw new Error('Failed to load cart');
        return res.json();
      })
      .then(data => {
        setCart(data.items || []);
        setLoading(false);
      })
      .catch(err => {
        if (err.message !== 'Unauthorized') { setError(err.message); setLoading(false); }
      });
  }, [router]);

  const handlePlaceOrder = async () => {
    setProcessing(true);
    setSagaError(false);
    setError(null);

    // Animate steps
    for (let i = 1; i <= 3; i++) {
      setSagaStep(i);
      await new Promise(r => setTimeout(r, 900));
    }

    try {
      const res = await fetch('/api/orders/place', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Transaction failed');

      setSagaStep(4);
      await new Promise(r => setTimeout(r, 600));
      setOrderId(data.orderId);
      setSuccess(true);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      setSagaError(true);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div style={loaderWrapper}>
      <div style={spinner} />
      <p style={{ marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569' }}>SYNCING CART DATA...</p>
    </div>
  );

  if (success) return (
    <div style={pageBg}>
      <div style={container}>
        <div style={successCard}>
          <div style={successIconWrap}>
            <div style={successIcon}>✓</div>
          </div>
          <h1 style={successTitle}>Order Confirmed!</h1>
          <p style={successSub}>Your distributed transaction was committed across Azure SQL and MongoDB Atlas.</p>
          {orderId && <div style={orderIdBadge}>Order #{orderId}</div>}
          <div style={successSteps}>
            {SAGA_STEPS.map(step => (
              <div key={step.id} style={successStepRow}>
                <div style={successStepCheck}>✓</div>
                <span style={successStepLabel}>{step.label}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '32px' }}>
            <Link href="/profile" style={btnPrimary}>View My Orders</Link>
            <Link href="/" style={btnSecondary}>Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );

  const subtotal = cart?.reduce((acc, item) => acc + (item.price * item.quantity), 0) || 0;

  return (
    <div style={pageBg}>
      <div style={container}>
        <div style={pageHeader}>
          <Link href="/" style={backLink}>← Back to Catalog</Link>
          <h1 style={title}>Distributed Checkout</h1>
          <p style={subtitle}>ACID-compliant cross-engine order processing via Saga Architecture</p>
        </div>

        {/* Saga Step Tracker */}
        {processing && (
          <div style={sagaTrackerCard}>
            <div style={sagaTitle}>⚙ Processing Transaction</div>
            <div style={sagaStepsContainer}>
              {SAGA_STEPS.map((step) => {
                const isDone = sagaStep > step.id;
                const isActive = sagaStep === step.id;
                const isError = sagaError && isActive;
                return (
                  <div key={step.id} style={sagaStepRow}>
                    <div style={{
                      ...sagaStepIndicator,
                      backgroundColor: isError ? '#fee2e2' : isDone ? '#dcfce7' : isActive ? '#e0e7ff' : '#f1f5f9',
                      borderColor: isError ? '#ef4444' : isDone ? '#16a34a' : isActive ? '#6366f1' : '#e2e8f0',
                    }}>
                      {isDone ? <span style={{ color: '#16a34a', fontWeight: '800' }}>✓</span>
                        : isError ? <span style={{ color: '#ef4444', fontWeight: '800' }}>✕</span>
                        : isActive ? <div style={stepSpinner} />
                        : <div style={stepDot} />}
                    </div>
                    <div>
                      <div style={{ ...sagaStepLabel, color: isError ? '#dc2626' : isDone ? '#15803d' : isActive ? '#4f46e5' : '#94a3b8' }}>
                        {step.label}
                      </div>
                      {isActive && <div style={sagaStepSub}>{step.sub}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!processing && error && (
          <div style={errorBox}>
            <strong>⚠ Transaction Aborted</strong>
            <p style={{ margin: '8px 0 0', fontSize: '13px', opacity: 0.9 }}>{error}</p>
            <p style={{ margin: '8px 0 0', fontSize: '12px', opacity: 0.7 }}>Compensating rollback executed. No charges applied.</p>
          </div>
        )}

        <div style={grid}>
          {/* Cart Items */}
          <div style={cartCol}>
            <div style={sectionHeader}>
              <h2 style={sectionTitle}>Cart Items</h2>
              <span style={dbBadge}>NoSQL Cart Collection</span>
            </div>

            {cart && cart.length === 0 ? (
              <div style={emptyCart}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🛒</div>
                <p style={{ fontWeight: '700', color: '#475569' }}>Your cart is empty.</p>
                <Link href="/" style={btnPrimary}>Browse Catalog</Link>
              </div>
            ) : (
              cart?.map((item, idx) => (
                <div key={idx} style={cartItem}>
                  <img src={item.image_url || '/logo.png'} alt={item.sku} style={itemImg} onError={(e) => e.target.src = '/logo.png'} />
                  <div style={itemInfo}>
                    <div style={itemName}>{item.sku || 'Product'}</div>
                    <div style={itemMeta}>Variant ID: {item.variant_id}</div>
                    <div style={itemPriceStr}>
                      {item.price?.toLocaleString(undefined, { style: 'currency', currency: item.currency || 'USD' })} × {item.quantity}
                    </div>
                  </div>
                  <div style={itemTotal}>
                    {(item.price * item.quantity).toLocaleString(undefined, { style: 'currency', currency: item.currency || 'USD' })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Summary */}
          {cart && cart.length > 0 && (
            <div style={summaryCol}>
              <div style={summaryCard}>
                <div style={sectionHeader}>
                  <h3 style={summaryTitle}>Order Summary</h3>
                  <span style={dbBadge}>Azure SQL Ledger</span>
                </div>
                <div style={summaryRow}>
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div style={summaryRow}>
                  <span>Tax (Regional)</span>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Calculated at commit</span>
                </div>
                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '20px 0' }} />
                <div style={summaryTotal}>
                  <span>Total</span>
                  <span>${subtotal.toFixed(2)}+</span>
                </div>

                <div style={sagaInfoBox}>
                  <div style={sagaInfoTitle}>⚙ Saga Architecture Active</div>
                  <div style={sagaInfoText}>This transaction uses a distributed 4-step pipeline with automatic compensating rollback if any step fails.</div>
                </div>

                <button
                  style={processing ? btnDisabled : btnPrimaryFull}
                  onClick={handlePlaceOrder}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : 'Place Order'}
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
const pageBg = { backgroundColor: '#f8fafc', minHeight: '100vh', padding: '48px 24px' };
const container = { maxWidth: '1100px', margin: '0 auto' };
const pageHeader = { marginBottom: '40px' };
const backLink = { fontSize: '13px', color: '#6366f1', fontWeight: '700', textDecoration: 'none' };
const title = { fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '12px 0 6px', letterSpacing: '-0.5px' };
const subtitle = { fontSize: '14px', color: '#64748b' };

const sagaTrackerCard = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e0e7ff', padding: '28px 32px', marginBottom: '32px', boxShadow: '0 4px 20px rgba(99,102,241,0.08)' };
const sagaTitle = { fontSize: '14px', fontWeight: '800', color: '#4f46e5', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const sagaStepsContainer = { display: 'flex', flexDirection: 'column', gap: '14px' };
const sagaStepRow = { display: 'flex', alignItems: 'center', gap: '14px' };
const sagaStepIndicator = { width: '36px', height: '36px', borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.4s ease' };
const stepSpinner = { width: '14px', height: '14px', border: '2px solid #c7d2fe', borderTop: '2px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };
const stepDot = { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#cbd5e1' };
const sagaStepLabel = { fontSize: '14px', fontWeight: '700', transition: 'color 0.3s' };
const sagaStepSub = { fontSize: '12px', color: '#94a3b8', marginTop: '2px' };

const grid = { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' };
const cartCol = { display: 'flex', flexDirection: 'column', gap: '16px' };
const summaryCol = { position: 'sticky', top: '40px', height: 'fit-content' };

const sectionHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' };
const sectionTitle = { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 };
const dbBadge = { fontSize: '10px', fontWeight: '800', color: '#6366f1', backgroundColor: '#e0e7ff', padding: '4px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' };

const cartItem = { display: 'flex', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', gap: '16px' };
const itemImg = { width: '80px', height: '80px', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '12px', padding: '8px', flexShrink: 0 };
const itemInfo = { flex: 1 };
const itemName = { fontSize: '15px', fontWeight: '700', color: '#0f172a' };
const itemMeta = { fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontFamily: 'monospace' };
const itemPriceStr = { fontSize: '13px', color: '#475569', fontWeight: '600', marginTop: '8px' };
const itemTotal = { fontSize: '18px', fontWeight: '800', color: '#0f172a', flexShrink: 0 };
const emptyCart = { padding: '40px', textAlign: 'center', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' };

const summaryCard = { backgroundColor: 'white', padding: '28px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' };
const summaryTitle = { fontSize: '18px', fontWeight: '800', color: '#0f172a', margin: 0 };
const summaryRow = { display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#475569', marginBottom: '14px', fontWeight: '500' };
const summaryTotal = { display: 'flex', justifyContent: 'space-between', fontSize: '22px', fontWeight: '900', color: '#0f172a', marginBottom: '20px' };

const sagaInfoBox = { backgroundColor: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: '12px', padding: '14px', marginBottom: '20px' };
const sagaInfoTitle = { fontSize: '12px', fontWeight: '800', color: '#4f46e5', marginBottom: '6px' };
const sagaInfoText = { fontSize: '12px', color: '#64748b', lineHeight: '1.5' };

const btnPrimaryFull = { width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: 'linear-gradient(135deg, #4f46e5 0%, #0f172a 100%)', color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.3)', transition: 'transform 0.2s' };
const btnDisabled = { ...btnPrimaryFull, background: '#cbd5e1', cursor: 'not-allowed', boxShadow: 'none' };
const btnPrimary = { display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #4f46e5 0%, #0f172a 100%)', color: 'white', textDecoration: 'none', fontWeight: '700', borderRadius: '12px' };
const btnSecondary = { display: 'inline-block', padding: '12px 24px', backgroundColor: 'white', color: '#0f172a', textDecoration: 'none', fontWeight: '700', borderRadius: '12px', border: '2px solid #e2e8f0' };

const errorBox = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '20px', borderRadius: '16px', marginBottom: '24px' };

const loaderWrapper = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '40px', height: '40px', border: '4px solid #f1f5f9', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };

const successCard = { backgroundColor: 'white', padding: '60px 48px', borderRadius: '32px', textAlign: 'center', boxShadow: '0 25px 60px rgba(0,0,0,0.1)', maxWidth: '560px', margin: '0 auto' };
const successIconWrap = { marginBottom: '24px' };
const successIcon = { width: '80px', height: '80px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', margin: '0 auto', boxShadow: '0 12px 30px rgba(16,185,129,0.35)' };
const successTitle = { fontSize: '28px', fontWeight: '900', color: '#0f172a', margin: '0 0 12px' };
const successSub = { fontSize: '14px', color: '#64748b', lineHeight: '1.6', marginBottom: '20px' };
const orderIdBadge = { display: 'inline-block', backgroundColor: '#f0f4ff', color: '#4f46e5', padding: '8px 20px', borderRadius: '20px', fontWeight: '800', fontSize: '14px', marginBottom: '24px' };
const successSteps = { display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc', borderRadius: '16px', padding: '20px', textAlign: 'left' };
const successStepRow = { display: 'flex', alignItems: 'center', gap: '10px' };
const successStepCheck = { width: '24px', height: '24px', backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '800', flexShrink: 0 };
const successStepLabel = { fontSize: '13px', fontWeight: '600', color: '#1e293b' };
