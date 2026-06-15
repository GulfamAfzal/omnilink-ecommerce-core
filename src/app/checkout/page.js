'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Smartphone, CreditCard, Banknote, Truck, CheckCircle2, Package, AlertCircle } from 'lucide-react';
import { resolveImageUrl, handleImageError } from '@/lib/imageUtils';

const BANKS = [
  { id: 'jazzcash',  label: 'JazzCash',  logo: '/assets/logos/jazzcash.png' },
  { id: 'easypaisa', label: 'EasyPaisa', logo: '/assets/logos/easypaisa.png' },
  { id: 'mcb',       label: 'MCB',       logo: '/assets/logos/mcb.png' },
  { id: 'bop',       label: 'BOP',       logo: '/assets/logos/bop.png' },
  { id: 'hbl',       label: 'HBL',       logo: '/assets/logos/hbl.png' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError]         = useState(null);
  const [success, setSuccess]     = useState(false);
  const [orderId, setOrderId]     = useState(null);

  // Shipping / address
  const [addressMode, setAddressMode] = useState(null); // 'saved' | 'new'
  const [address, setAddress] = useState({ fullName: '', phone: '', street: '', city: '', province: '', country: '' });
  const [geoLoading, setGeoLoading] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState(''); // 'cod' | 'online'
  const [selectedBank, setSelectedBank]   = useState('');

  // Financials
  const [taxRate, setTaxRate]       = useState(0.08);
  const [shippingFee, setShippingFee] = useState(250); // PKR base

  useEffect(() => {
    fetch('/api/cart')
      .then(res => {
        if (res.status === 401) { router.push('/login'); throw new Error('Unauthorized'); }
        if (!res.ok) throw new Error('Failed to load cart');
        return res.json();
      })
      .then(data => { setCart(data.items || []); setLoading(false); })
      .catch(err => { if (err.message !== 'Unauthorized') { setError(err.message); setLoading(false); } });
  }, [router]);

  const handleGeolocate = () => {
    setGeoLoading(true);
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      setGeoLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use OpenStreetMap Nominatim for free reverse-geocoding (no API key needed)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'OMS-OMNILINK/2.0' } }
          );
          if (!res.ok) throw new Error('Geocoding request failed');
          const geo = await res.json();
          const addr = geo.address || {};
          setAddress(a => ({
            ...a,
            street: [addr.road, addr.house_number].filter(Boolean).join(' ') || a.street,
            city: addr.city || addr.town || addr.village || addr.county || '',
            province: addr.state || addr.state_district || '',
            country: addr.country || '',
          }));
          setShippingFee(300);
          setTaxRate(0.17);
        } catch (err) {
          console.warn('Reverse geocoding failed, using coordinates:', err);
          // Fallback: just note the coordinates
          setAddress(a => ({ ...a, street: `Near ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setGeoLoading(false);
        }
      },
      (err) => {
        const msg = err.code === 1
          ? 'Location access was denied. Please enter your address manually.'
          : 'Unable to detect your location. Please enter your address manually.';
        alert(msg);
        setGeoLoading(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!address.fullName || !address.phone) { alert('Please enter your full name and phone number.'); return; }
    if (paymentMethod === 'online' && !selectedBank) { alert('Please select a payment method.'); return; }

    setProcessing(true);
    setError(null);
    try {
      const res = await fetch('/api/orders/place', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Order failed');
      setOrderId(data.orderId || Math.floor(Math.random() * 900000 + 100000));
      setSuccess(true);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const merchandiseTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const taxAmount   = merchandiseTotal * taxRate;
  const finalTotal  = merchandiseTotal + shippingFee + taxAmount;

  if (loading) return (
    <div style={centerStyle}>
      <div style={spinnerLg}></div>
      <p style={{ marginTop: '16px', fontSize: '12px', fontWeight: '700', color: '#475569', letterSpacing: '1px' }}>LOADING YOUR CART...</p>
    </div>
  );

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={successCard}>
        <div style={successIcon}><CheckCircle2 color="white" size={40} strokeWidth={2.5} /></div>
        <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: '0 0 8px' }}>Order Placed!</h1>
        <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 24px', lineHeight: '1.6' }}>
          Your order has been confirmed. You'll receive a tracking update shortly.
        </p>
        {orderId && <div style={orderBadge}>Order #{orderId}</div>}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/profile" style={btnPrimary}>Track My Order</Link>
          <Link href="/" style={btnSecondary}>Continue Shopping</Link>
        </div>
      </div>
    </div>
  );

  const canSubmit = addressMode && paymentMethod && !processing;

  return (
    <div style={{ minHeight: '100vh', padding: '36px 24px' }}>
      <div style={{ maxWidth: '1180px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/" style={{ fontSize: '13px', fontWeight: '600', color: '#06B6D4', textDecoration: 'none' }}>← Back</Link>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#0F172A', marginTop: '8px', letterSpacing: '-0.5px' }}>Checkout</h1>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>Review your order and complete payment</p>
        </div>

        {error && (
          <div style={errorBox}>
            <AlertCircle size={16} strokeWidth={2} />
            <div>
              <strong style={{ display: 'block', fontSize: '13px' }}>Something went wrong</strong>
              <span style={{ fontSize: '12px', opacity: 0.85 }}>{error}</span>
            </div>
          </div>
        )}

        <div style={pageGrid}>

          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* DELIVERY DETAILS */}
            <section style={card}>
              <h2 style={sectionTitle}><Truck size={18} color="#06B6D4" strokeWidth={2} /> Delivery Details</h2>

              {!addressMode ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => setAddressMode('saved')} style={choiceBtn}>
                    <Package size={20} color="#06B6D4" strokeWidth={2} />
                    <strong style={{ display: 'block', fontSize: '13px', marginTop: '8px', color: '#0F172A' }}>My Saved Address</strong>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Use your profile address</span>
                  </button>
                  <button onClick={() => setAddressMode('new')} style={choiceBtn}>
                    <MapPin size={20} color="#06B6D4" strokeWidth={2} />
                    <strong style={{ display: 'block', fontSize: '13px', marginTop: '8px', color: '#0F172A' }}>Enter New Address</strong>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>Type manually or use GPS</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {addressMode === 'saved' ? 'Using Saved Address' : 'New Delivery Address'}
                    </span>
                    <button onClick={() => setAddressMode(null)} style={linkBtn}>Change</button>
                  </div>

                  {/* Name + Phone (always shown) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={fieldLabel}>Full Name *</label>
                      <input type="text" value={address.fullName} onChange={e => setAddress(a => ({ ...a, fullName: e.target.value }))} placeholder="Muhammad Ali" style={inputField} />
                    </div>
                    <div>
                      <label style={fieldLabel}>Phone Number *</label>
                      <input type="tel" value={address.phone} onChange={e => setAddress(a => ({ ...a, phone: e.target.value }))} placeholder="+92 3xx xxxxxxx" style={inputField} />
                    </div>
                  </div>

                  {addressMode === 'new' && (
                    <>
                      <button onClick={handleGeolocate} disabled={geoLoading} style={geoBtn}>
                        <MapPin size={15} strokeWidth={2} />
                        {geoLoading ? 'Detecting Location...' : 'Auto-Detect via GPS'}
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={fieldLabel}>Street / House No.</label>
                          <input type="text" value={address.street} onChange={e => setAddress(a => ({ ...a, street: e.target.value }))} placeholder="House 12, Block B, Gulberg" style={inputField} />
                        </div>
                        <div>
                          <label style={fieldLabel}>City</label>
                          <input type="text" value={address.city} onChange={e => setAddress(a => ({ ...a, city: e.target.value }))} placeholder="Lahore" style={inputField} />
                        </div>
                        <div>
                          <label style={fieldLabel}>Province</label>
                          <input type="text" value={address.province} onChange={e => setAddress(a => ({ ...a, province: e.target.value }))} placeholder="Punjab" style={inputField} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={fieldLabel}>Country</label>
                          <input type="text" value={address.country} onChange={e => setAddress(a => ({ ...a, country: e.target.value }))} placeholder="Pakistan" style={inputField} />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>

            {/* PAYMENT METHOD */}
            <section style={card}>
              <h2 style={sectionTitle}><CreditCard size={18} color="#06B6D4" strokeWidth={2} /> Choose Payment Method</h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: paymentMethod === 'online' ? '20px' : '0' }}>
                <button onClick={() => setPaymentMethod('cod')} style={{
                  ...paymentCard,
                  borderWidth: '2px', borderStyle: 'solid',
                  borderColor: paymentMethod === 'cod' ? '#06B6D4' : '#B0C4DE',
                  backgroundColor: paymentMethod === 'cod' ? '#EBF8FF' : '#FFFFFF',
                }}>
                  <Banknote size={22} color={paymentMethod === 'cod' ? '#06B6D4' : '#94A3B8'} strokeWidth={1.5} />
                  <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>Cash on Delivery</strong>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>Pay when your order arrives</p>
                </button>

                <button onClick={() => setPaymentMethod('online')} style={{
                  ...paymentCard,
                  borderWidth: '2px', borderStyle: 'solid',
                  borderColor: paymentMethod === 'online' ? '#06B6D4' : '#B0C4DE',
                  backgroundColor: paymentMethod === 'online' ? '#EBF8FF' : '#FFFFFF',
                }}>
                  <Smartphone size={22} color={paymentMethod === 'online' ? '#06B6D4' : '#94A3B8'} strokeWidth={1.5} />
                  <strong style={{ display: 'block', fontSize: '13px', fontWeight: '800', color: '#0F172A', marginTop: '10px' }}>Online Bank / Wallet</strong>
                  <p style={{ fontSize: '11px', color: '#64748B', margin: '4px 0 0' }}>JazzCash, EasyPaisa & more</p>
                </button>
              </div>

              {/* Bank Logo Grid */}
              {paymentMethod === 'online' && (
                <div style={bankPanel}>
                  <label style={fieldLabel}>Select Your Bank or Wallet</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginTop: '10px' }}>
                    {BANKS.map(bank => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.id)}
                        style={{
                          padding: '10px 6px',
                          borderRadius: '12px',
                          borderWidth: '2px', borderStyle: 'solid',
                          borderColor: selectedBank === bank.id ? '#06B6D4' : '#B0C4DE',
                          backgroundColor: selectedBank === bank.id ? '#E0F7FF' : '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <img src={bank.logo} alt={bank.label} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px' }} onError={e => { e.target.style.display = 'none'; }} />
                        <span style={{ fontSize: '10px', fontWeight: '800', color: selectedBank === bank.id ? '#0369A1' : '#334155' }}>{bank.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* ── RIGHT COLUMN: Order Summary ──────────────── */}
          <div style={{ position: 'sticky', top: '90px', height: 'fit-content' }}>
            <div style={{ ...card, padding: '28px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: '900', color: '#0F172A', margin: '0 0 20px' }}>Order Summary</h3>

              {/* Cart Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '220px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
                {cart.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Your cart is empty</p>
                ) : cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', paddingBottom: '14px', borderBottom: '1px solid #EBF2F7' }}>
                    <div style={{ width: '52px', height: '52px', backgroundColor: '#F4F8FA', borderRadius: '10px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', padding: '6px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={resolveImageUrl(item.image_url)} alt="item" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={handleImageError} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>{item.sku || 'Item'}</div>
                      <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>Qty: {item.quantity}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>
                      PKR {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown Table */}
              <div style={priceTable}>
                <div style={priceRow}>
                  <span>Subtotal</span>
                  <span>PKR {merchandiseTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
                <div style={priceRow}>
                  <span>Delivery Fee</span>
                  <span>PKR {shippingFee.toLocaleString()}</span>
                </div>
                <div style={priceRow}>
                  <span>Sales Tax ({(taxRate * 100).toFixed(0)}%)</span>
                  <span>PKR {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
                <div style={{ height: '1px', backgroundColor: '#B0C4DE', margin: '4px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>Order Total</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#0369A1' }}>PKR {finalTotal.toLocaleString(undefined, { minimumFractionDigits: 0 })}</span>
                </div>
              </div>

              {!canSubmit && (
                <p style={{ fontSize: '11px', color: '#94A3B8', textAlign: 'center', margin: '0 0 12px', fontWeight: '600' }}>
                  {!addressMode ? 'Add delivery details to continue' : !paymentMethod ? 'Select a payment method to continue' : ''}
                </p>
              )}

              <button onClick={handlePlaceOrder} disabled={!canSubmit} style={canSubmit ? btnPlace : btnPlaceDisabled}>
                {processing
                  ? <span style={spinnerSm}></span>
                  : <CheckCircle2 size={18} strokeWidth={2.5} />
                }
                {processing ? 'Placing Order...' : 'Place Order'}
              </button>

              <Link href="/" style={{ display: 'block', textAlign: 'center', fontSize: '12px', color: '#94A3B8', marginTop: '12px', textDecoration: 'none' }}>
                Cancel and go back
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Styles ──────────────────────────────────────── */
const pageGrid = {
  display: 'grid',
  gridTemplateColumns: '1.4fr 1fr',
  gap: '32px',
  alignItems: 'start',
};

const card = {
  backgroundColor: '#FFFFFF',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '20px',
  padding: '28px',
  boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
};

const sectionTitle = {
  fontSize: '16px', fontWeight: '900', color: '#0F172A',
  marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
};

const choiceBtn = {
  padding: '20px 16px', textAlign: 'center',
  borderWidth: '2px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '14px', backgroundColor: '#F8FAFC',
  cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
  transition: 'all 0.2s',
};

const fieldLabel = {
  display: 'block', fontSize: '10px', fontWeight: '800',
  color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px',
};

const inputField = {
  width: '100%', padding: '11px 14px',
  backgroundColor: '#F4F8FA',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '10px', fontSize: '13px', color: '#1E293B', boxSizing: 'border-box',
  outline: 'none',
};

const linkBtn = {
  fontSize: '12px', color: '#94A3B8', background: 'none',
  border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0,
};

const geoBtn = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  padding: '11px', backgroundColor: '#D9E6F0',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  color: '#0369A1', borderRadius: '10px', fontSize: '13px', fontWeight: '700', cursor: 'pointer',
};

const paymentCard = {
  padding: '20px 16px', textAlign: 'center', borderRadius: '14px', cursor: 'pointer',
  display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 0.15s',
};

const bankPanel = {
  backgroundColor: 'rgba(208,225,253,0.35)',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '14px', padding: '20px',
};

const priceTable = {
  backgroundColor: '#F4F8FA',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '14px', padding: '18px',
  display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px',
};
const priceRow = {
  display: 'flex', justifyContent: 'space-between',
  fontSize: '13px', fontWeight: '600', color: '#475569',
};

const btnPlace = {
  width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
  background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)',
  color: '#FFFFFF', fontWeight: '800', fontSize: '14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  boxShadow: '0 4px 15px rgba(6,182,212,0.28)', marginBottom: '8px',
};
const btnPlaceDisabled = {
  ...btnPlace, background: '#E2E8F0', color: '#94A3B8',
  cursor: 'not-allowed', boxShadow: 'none',
};
const btnPrimary  = { padding: '12px 24px', backgroundColor: '#0F172A', color: '#FFFFFF', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none' };
const btnSecondary = { padding: '12px 24px', backgroundColor: '#EBF2F7', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', color: '#0F172A', borderRadius: '10px', fontWeight: '700', fontSize: '13px', textDecoration: 'none' };

const successCard = {
  maxWidth: '440px', width: '100%', backgroundColor: '#FFFFFF',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  borderRadius: '24px', padding: '40px', textAlign: 'center',
  boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
};
const successIcon = {
  width: '72px', height: '72px', background: 'linear-gradient(135deg, #34D399, #059669)',
  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 24px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
};
const orderBadge = {
  display: 'inline-block', backgroundColor: '#EBF2F7',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE',
  color: '#0369A1', padding: '8px 24px', borderRadius: '20px',
  fontWeight: '800', fontSize: '14px', marginBottom: '28px',
};

const errorBox = {
  display: 'flex', alignItems: 'flex-start', gap: '10px',
  backgroundColor: '#FEF2F2',
  borderWidth: '1px', borderStyle: 'solid', borderColor: '#FECACA',
  color: '#DC2626', padding: '16px 20px', borderRadius: '14px', marginBottom: '28px',
};

const centerStyle = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinnerLg   = { width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 0.9s linear infinite' };
const spinnerSm   = { width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.8s linear infinite' };
