'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Package, Star, Edit2, CheckCircle2, AlertCircle, Truck, MapPin, Box, CheckCheck } from 'lucide-react';

// ─── Shipment Tracker Component ─────────────────────────────
const STEPS = [
  { key: 'confirmed',   label: 'Order Confirmed',         sub: 'Order logged and stock reserved',          icon: CheckCheck },
  { key: 'processing', label: 'Warehouse Processing',     sub: 'Regional warehouse preparing your items',   icon: Box },
  { key: 'dispatched', label: 'Dispatched via Courier',   sub: 'Tracking code generated, in transit',       icon: Truck },
  { key: 'delivery',   label: 'Out for Delivery',         sub: 'Arriving at your location today',           icon: MapPin },
];

const STATUS_MAP = {
  'Pending':    0,
  'Processing': 1,
  'Completed':  3,
  'Dispatched': 2,
  'Cancelled':  -1,
};

function ShipmentTracker({ orders }) {
  const [selectedOrder, setSelectedOrder] = useState(orders[0] || null);

  const activeStep = selectedOrder ? (STATUS_MAP[selectedOrder.status] ?? 0) : 0;
  const isCancelled = selectedOrder?.status === 'Cancelled';

  if (orders.length === 0) return (
    <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #B0C4DE' }}>
      <Package color="#CBD5E1" size={48} style={{ marginBottom: '16px' }} />
      <div style={{ fontWeight: '700', color: '#334155', fontSize: '14px' }}>No orders to track</div>
      <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '8px' }}>Place an order to see shipment progress here.</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Order selector */}
      {orders.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {orders.slice(0, 5).map(o => (
            <button
              key={o.orderId}
              onClick={() => setSelectedOrder(o)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                borderWidth: '1px', borderStyle: 'solid',
                borderColor: selectedOrder?.orderId === o.orderId ? '#06B6D4' : '#B0C4DE',
                backgroundColor: selectedOrder?.orderId === o.orderId ? '#EBF8FF' : '#FFFFFF',
                color: selectedOrder?.orderId === o.orderId ? '#0369A1' : '#334155',
              }}
            >Order #{o.orderId}</button>
          ))}
        </div>
      )}

      {/* Tracker Card */}
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '32px', border: '1px solid #B0C4DE', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' }}>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>Order #{selectedOrder?.orderId}</div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>{selectedOrder?.date ? new Date(selectedOrder.date).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</div>
          </div>
          <span style={{
            fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px',
            padding: '5px 14px', borderRadius: '20px',
            backgroundColor: isCancelled ? '#FEF2F2' : activeStep >= 3 ? '#ECFDF5' : '#EBF8FF',
            color: isCancelled ? '#DC2626' : activeStep >= 3 ? '#059669' : '#0369A1',
          }}>{selectedOrder?.status}</span>
        </div>

        {isCancelled ? (
          <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA', color: '#DC2626', fontWeight: '700', fontSize: '14px' }}>
            This order was cancelled
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            {/* Progress Line */}
            <div style={{ position: 'absolute', top: '24px', left: '24px', right: '24px', height: '3px', backgroundColor: '#EBF2F7', zIndex: 0 }}>
              <div style={{ height: '100%', backgroundColor: '#06B6D4', width: `${(activeStep / (STEPS.length - 1)) * 100}%`, transition: 'width 0.5s ease', borderRadius: '3px' }}></div>
            </div>

            {/* Steps */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative', zIndex: 1 }}>
              {STEPS.map(({ key, label, sub, icon: Icon }, idx) => {
                const done    = idx <= activeStep;
                const current = idx === activeStep;
                return (
                  <div key={key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      backgroundColor: done ? (current ? '#06B6D4' : '#D1FAE5') : '#EBF2F7',
                      borderWidth: '3px', borderStyle: 'solid',
                      borderColor: done ? (current ? '#06B6D4' : '#10B981') : '#B0C4DE',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: current ? '0 0 0 6px rgba(6,182,212,0.15)' : 'none',
                      transition: 'all 0.3s',
                    }}>
                      <Icon size={20} color={done ? (current ? '#FFFFFF' : '#059669') : '#94A3B8'} strokeWidth={2} />
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: '800', color: done ? '#0F172A' : '#94A3B8', marginTop: '10px', lineHeight: '1.3' }}>{label}</div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginTop: '4px', lineHeight: '1.4' }}>{sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState(null);

  // Profile Edit Form State
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', contact_number: '', currency: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/profile')
      .then(res => {
        if (res.status === 401) { router.push('/login'); throw new Error('Unauthorized'); }
        return res.json();
      })
      .then(data => {
        if (data.profile) {
          setProfile(data.profile);
          setFormData({
            first_name: data.profile.first_name || '',
            last_name: data.profile.last_name || '',
            contact_number: data.profile.contact_number || '',
            currency: data.profile.currency || 'USD'
          });
        }
        else setError(data.error || 'Failed to load profile');
        setLoading(false);
      })
      .catch(err => { if (err.message !== 'Unauthorized') { setError('Network error'); setLoading(false); } });
  }, [router]);

  const fetchOrders = () => {
    setOrdersLoading(true);
    fetch('/api/user/orders')
      .then(res => res.json())
      .then(data => { setOrders(data.orders || []); setOrdersLoading(false); })
      .catch(() => setOrdersLoading(false));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if ((tab === 'orders' || tab === 'reviews') && orders.length === 0) fetchOrders();
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      
      setProfile(prev => ({ ...prev, ...formData }));
      
      const localUser = JSON.parse(localStorage.getItem('user') || '{}');
      localUser.firstName = formData.first_name;
      localStorage.setItem('user', JSON.stringify(localUser));
      
      setSaveSuccess(true);
      setEditMode(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewRating || !reviewProductId) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: reviewProductId, rating: reviewRating, title: reviewTitle, comment: reviewComment })
      });
      if (res.ok) {
        setReviewSuccess(true);
        setReviewRating(0); setReviewTitle(''); setReviewComment('');
        setTimeout(() => setReviewSuccess(false), 3000);
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const statusColorObj = (s) => {
    switch(s) {
      case 'Pending': return { color: '#F59E0B', bg: '#FEF3C7', border: '#FDE68A' };
      case 'Processing': return { color: '#6366F1', bg: '#EEF2FF', border: '#E0E7FF' };
      case 'Completed': return { color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5' };
      case 'Cancelled': return { color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
      default: return { color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' };
    }
  };

  if (loading) return (
    <div style={centerStyle}>
      <div style={spinnerStyle}></div>
      <p style={{marginTop: '15px', fontSize: '12px', fontWeight: '600', color: '#475569', letterSpacing: '1px'}}>LOADING IDENTITY PROFILE...</p>
    </div>
  );

  return (
    <div style={pageWrapper}>
      
      {/* LEFT: Identity Panel */}
      <aside style={sidebarStyle}>
        <div style={avatarStyle}>
          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>{profile?.first_name} {profile?.last_name}</div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369A1', marginTop: '4px', marginBottom: '16px' }}>@{profile?.username}</div>

        <div style={{ marginBottom: '8px' }}>
          <span style={profile?.user_type === 'Admin' ? badgeAdmin : badgeUser}>
            {profile?.role_name || profile?.user_type}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={pulseDot}></span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{profile?.region_name || 'Global Hub'}</span>
        </div>

        <button onClick={() => router.push('/')} style={btnBack}>
          ← Marketplace
        </button>
      </aside>

      {/* RIGHT: Main Terminal Content */}
      <div style={mainContentStyle}>
        <div style={tabContainer}>
          {[
            { id: 'profile',  label: 'My Profile',     icon: User },
            { id: 'orders',   label: 'My Orders',      icon: Package },
            { id: 'shipment', label: 'Track Shipment', icon: Truck },
            { id: 'reviews',  label: 'Write Review',   icon: Star },
          ].map(({ id, label, icon: Icon }) => (
            <button 
              key={id} 
              onClick={() => handleTabChange(id)} 
              style={activeTab === id ? tabBtnActive : tabBtn}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {error && <div style={errorBox}><AlertCircle size={16}/> {error}</div>}
        {saveSuccess && <div style={successBox}><CheckCircle2 size={16}/> Profile updated successfully</div>}

        <div style={contentCard}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Security Profile Terminal</h2>
                  <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '4px' }}>Managed via Azure SQL Database</p>
                </div>
                {!editMode && (
                  <button onClick={() => setEditMode(true)} style={btnEdit}>
                    <Edit2 size={14} /> Edit Identity
                  </button>
                )}
              </div>

              {editMode ? (
                <form onSubmit={handleProfileUpdate} style={editForm}>
                  <div>
                    <label style={inputLabel}>First Name</label>
                    <input type="text" value={formData.first_name} onChange={e=>setFormData({...formData, first_name: e.target.value})} style={inputField} required />
                  </div>
                  <div>
                    <label style={inputLabel}>Last Name</label>
                    <input type="text" value={formData.last_name} onChange={e=>setFormData({...formData, last_name: e.target.value})} style={inputField} required />
                  </div>
                  <div>
                    <label style={inputLabel}>Contact Number</label>
                    <input type="tel" value={formData.contact_number} onChange={e=>setFormData({...formData, contact_number: e.target.value})} style={inputField} />
                  </div>
                  <div>
                    <label style={inputLabel}>Preferred Currency</label>
                    <select value={formData.currency} onChange={e=>setFormData({...formData, currency: e.target.value})} style={inputField}>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button type="submit" disabled={saveLoading} style={btnSave}>
                      {saveLoading ? 'Applying...' : 'Commit Changes to Azure SQL'}
                    </button>
                    <button type="button" onClick={() => setEditMode(false)} style={btnCancel}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div style={infoGrid}>
                  {[
                    ['Full Name', `${profile?.first_name || ''} ${profile?.last_name || ''}`],
                    ['Username', `@${profile?.username}`],
                    ['Email', profile?.email],
                    ['Contact', profile?.contact_number || 'N/A'],
                    ['User Type', profile?.user_type],
                    ['Permissions', profile?.permissions || 'Standard Access'],
                    ['Region', profile?.region_name || 'Global Hub'],
                    ['Currency', profile?.currency || 'USD'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={inputLabel}>{label}</div>
                      <div style={{ fontSize: '14px', fontWeight: '900', color: '#0F172A' }}>{value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SHIPMENT TRACKER TAB */}
          {activeTab === 'shipment' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Shipment Tracker</h2>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '4px' }}>Real-time delivery milestones for your orders</p>
              </div>
              <ShipmentTracker orders={orders.length > 0 ? orders : []} />
            </div>
          )}

          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Order History</h2>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '4px' }}>Cross-Engine Ledger View (Azure SQL + MongoDB)</p>
              </div>

              {ordersLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div style={spinnerStyle}></div></div>
              ) : orders.length === 0 ? (
                <div style={emptyState}>
                  <Package color="#CBD5E1" size={48} style={{ marginBottom: '16px' }} />
                  <div style={{ fontWeight: '700', color: '#334155', fontSize: '14px' }}>No orders yet</div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '8px' }}>Your completed transactions will appear here.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map((order) => {
                    const sc = statusColorObj(order.status);
                    return (
                      <div key={order.orderId} style={orderCard}>
                        <div style={orderHeader}>
                          <div>
                            <span style={{ fontWeight: '900', color: '#0F172A', marginRight: '12px', fontSize: '15px' }}>Order #{order.orderId}</span>
                            <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{new Date(order.date).toLocaleDateString()}</span>
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 12px', borderRadius: '20px', backgroundColor: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>
                            {order.status}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                          {order.items.map((item, i) => (
                            <div key={i} style={orderItemRow}>
                              <span style={{ flex: 1, fontSize: '12px', fontWeight: '700', color: '#1E293B' }}>{item.sku}</span>
                              <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748B', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #B0C4DE' }}>×{item.quantity}</span>
                              <span style={{ fontSize: '12px', fontWeight: '900', color: '#0F172A' }}>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ color: '#06B6D4' }}>📍</span> {order.regionName}</span>
                          <span style={{ fontSize: '18px', fontWeight: '900', color: '#0369A1' }}>{order.currency} {order.totalAmount?.toFixed(2)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* REVIEWS TAB */}
          {activeTab === 'reviews' && (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#0F172A', margin: 0 }}>Write a Review</h2>
                <p style={{ fontSize: '12px', fontWeight: '600', color: '#64748B', marginTop: '4px' }}>Feedback stored in MongoDB Atlas with embedded user reference</p>
              </div>

              {reviewSuccess && <div style={successBox}><CheckCircle2 size={16}/> Review submitted successfully!</div>}

              <form onSubmit={handleReviewSubmit} style={reviewForm}>
                <div>
                  <label style={inputLabel}>Purchased Product</label>
                  <select value={reviewProductId} onChange={e => setReviewProductId(e.target.value)} style={inputField} required>
                    <option value="" disabled>Select a product from your order history</option>
                    {orders.flatMap(o => o.items)
                      .filter((v, i, a) => a.findIndex(t => (t.productId === v.productId)) === i)
                      .map(item => (
                        <option key={item.productId} value={item.productId}>
                          {item.sku}
                        </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={inputLabel}>Rating</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star} type="button" 
                        onClick={() => setReviewRating(star)} 
                        onMouseEnter={() => setReviewHover(star)} 
                        onMouseLeave={() => setReviewHover(0)}
                        style={starBtn}
                      >
                        <Star size={28} fill={(reviewHover || reviewRating) >= star ? "#F59E0B" : "transparent"} color={(reviewHover || reviewRating) >= star ? "#F59E0B" : "#B0C4DE"} strokeWidth={1.5} />
                      </button>
                    ))}
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#94A3B8', marginLeft: '8px' }}>{reviewRating ? `${reviewRating}/5 stars` : 'Select rating'}</span>
                  </div>
                </div>

                <div>
                  <label style={inputLabel}>Review Title</label>
                  <input type="text" placeholder="Summarize your experience" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} style={inputField} />
                </div>

                <div>
                  <label style={inputLabel}>Comment</label>
                  <textarea placeholder="Share your experience..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={4} style={{...inputField, resize: 'vertical'}} />
                </div>

                <button type="submit" disabled={reviewSubmitting} style={reviewSubmitting ? btnReviewDisabled : btnReview}>
                  {reviewSubmitting ? 'Committing to NoSQL...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- DESIGN SYSTEM (PREMIUM) ---
const pageWrapper = { padding: '40px 24px', minHeight: '100vh', maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' };
if (typeof window !== 'undefined' && window.innerWidth < 768) {
  pageWrapper.flexDirection = 'column';
}

const sidebarStyle = { width: '280px', flexShrink: 0, backgroundColor: '#D9E6F0', borderRadius: '24px', padding: '32px', border: '1px solid #B0C4DE', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'sticky', top: '96px', boxSizing: 'border-box' };
const avatarStyle = { width: '80px', height: '80px', background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: '900', marginBottom: '16px', boxShadow: '0 10px 25px rgba(6, 182, 212, 0.3)' };
const badgeAdmin = { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA' };
const badgeUser = { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', backgroundColor: '#EBF2F7', color: '#0369A1', border: '1px solid #B0C4DE' };
const pulseDot = { width: '8px', height: '8px', backgroundColor: '#10B981', borderRadius: '50%', boxShadow: '0 0 8px rgba(16,185,129,0.6)', animation: 'pulse 2s infinite' };
const btnBack = { width: '100%', padding: '12px', backgroundColor: '#EBF2F7', border: '1px solid #B0C4DE', borderRadius: '12px', color: '#334155', fontWeight: '700', fontSize: '12px', cursor: 'pointer', transition: 'background-color 0.2s' };

const mainContentStyle = { flex: 1, width: '100%' };
const tabContainer = { display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px', backgroundColor: '#D9E6F0', padding: '6px', borderRadius: '16px', border: '1px solid #B0C4DE' };
const tabBtn = { flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '12px', color: '#64748B', backgroundColor: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' };
const tabBtnActive = { ...tabBtn, backgroundColor: '#0F172A', color: '#FFFFFF', boxShadow: '0 4px 15px rgba(15, 23, 42, 0.2)' };

const contentCard = { backgroundColor: '#D9E6F0', borderRadius: '24px', padding: '32px', border: '1px solid #B0C4DE' };

const btnEdit = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', backgroundColor: '#FFFFFF', border: '1px solid #B0C4DE', borderRadius: '8px', fontSize: '12px', fontWeight: '700', color: '#0369A1', cursor: 'pointer' };

const editForm = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: 'rgba(208, 225, 253, 0.4)', padding: '24px', borderRadius: '16px', border: '1px solid #B0C4DE' };
const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', backgroundColor: '#EBF2F7', padding: '24px', borderRadius: '16px', border: '1px solid #B0C4DE' };

const inputLabel = { display: 'block', fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' };
const inputField = { width: '100%', padding: '12px', backgroundColor: '#FFFFFF', border: '1px solid #B0C4DE', borderRadius: '12px', fontSize: '14px', fontWeight: '600', color: '#1E293B', boxSizing: 'border-box' };

const btnSave = { flex: 1, padding: '12px', backgroundColor: '#0F172A', color: 'white', borderRadius: '12px', fontWeight: '700', fontSize: '14px', border: 'none', cursor: 'pointer' };
const btnCancel = { padding: '12px 24px', backgroundColor: '#FFFFFF', color: '#334155', border: '1px solid #B0C4DE', borderRadius: '12px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' };

const emptyState = { textAlign: 'center', padding: '48px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #B0C4DE' };
const orderCard = { backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #B0C4DE' };
const orderHeader = { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #F1F5F9' };
const orderItemRow = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#F4F8FA', borderRadius: '12px', border: '1px solid #B0C4DE' };

const reviewForm = { display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '16px', border: '1px solid #B0C4DE' };
const starBtn = { background: 'none', border: 'none', cursor: 'pointer', padding: 0 };
const btnReview = { width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #06B6D4 0%, #2563EB 100%)', color: 'white', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(6, 182, 212, 0.3)' };
const btnReviewDisabled = { ...btnReview, background: '#94A3B8', color: 'white', boxShadow: 'none', cursor: 'not-allowed' };

const errorBox = { marginBottom: '24px', padding: '16px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', borderRadius: '16px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' };
const successBox = { marginBottom: '24px', padding: '16px', backgroundColor: '#ECFDF5', border: '1px solid #D1FAE5', color: '#059669', borderRadius: '16px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' };

const centerStyle = { height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinnerStyle = { width: '40px', height: '40px', border: '4px solid #F1F5F9', borderTop: '4px solid #06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite' };
