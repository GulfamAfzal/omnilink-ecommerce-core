'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STARS = [1, 2, 3, 4, 5];

export default function ProfilePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState(null);

  // Review form state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewProductId, setReviewProductId] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => {
        if (res.status === 401) { router.push('/login'); throw new Error('Unauthorized'); }
        return res.json();
      })
      .then(data => {
        if (data.profile) setProfile(data.profile);
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
    if (tab === 'orders' && orders.length === 0) fetchOrders();
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

  const statusColor = (s) => ({ 'Pending': '#f59e0b', 'Processing': '#6366f1', 'Completed': '#10b981', 'Cancelled': '#ef4444' }[s] || '#64748b');

  if (loading) return (
    <div style={centerStyle}>
      <div style={spinner} />
      <span style={{ color: '#64748b', fontSize: '14px', marginTop: '12px', fontWeight: '600' }}>Loading Identity...</span>
    </div>
  );

  if (error && !profile) return (
    <div style={centerStyle}><div style={errorBox}>⚠️ {error}</div></div>
  );

  return (
    <div style={pageWrapper}>
      <div style={pageLayout}>

        {/* Left: Profile Card (always visible) */}
        <aside style={profileSidebar}>
          <div style={avatarCircle}>
            {profile?.first_name?.[0]}{profile?.last_name?.[0]}
          </div>
          <div style={profileName}>{profile?.first_name} {profile?.last_name}</div>
          <div style={profileUsername}>@{profile?.username}</div>

          <div style={roleBadgeWrap}>
            <span style={roleBadge(profile?.user_type === 'Admin' ? '#be123c' : '#6366f1')}>
              {profile?.role_name || profile?.user_type}
            </span>
          </div>

          <div style={regionBadgeWrap}>
            <span style={onlineDot} />
            <span style={regionLabel}>{profile?.region_name || 'Global Hub'}</span>
          </div>

          <button onClick={() => router.push('/')} style={backToMarketBtn}>
            ← Marketplace
          </button>
        </aside>

        {/* Right: Tab Content */}
        <div style={mainContent}>
          {/* Tab Nav */}
          <div style={tabNav}>
            {[['profile', '👤 Profile'], ['orders', '📦 My Orders'], ['reviews', '⭐ Write Review']].map(([id, label]) => (
              <button key={id} onClick={() => handleTabChange(id)} style={activeTab === id ? activeTabBtn : tabBtn}>
                {label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={tabContent}>
              <div style={sectionTitle}>Identity Details</div>
              <p style={sectionSub}>Verified data from Azure SQL Identity Core</p>
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
                  <div key={label} style={infoGroup}>
                    <div style={infoLabel}>{label}</div>
                    <div style={infoValue}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div style={tabContent}>
              <div style={sectionTitle}>Order History</div>
              <p style={sectionSub}>Transactions from Azure SQL ORDERS table enriched with MongoDB catalog data</p>
              {ordersLoading ? (
                <div style={centerMsg}><div style={miniSpinner} /></div>
              ) : orders.length === 0 ? (
                <div style={emptyState}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                  <div style={{ fontWeight: '700', color: '#475569' }}>No orders yet</div>
                  <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>Your completed orders will appear here.</div>
                </div>
              ) : orders.map((order) => (
                <div key={order.orderId} style={orderCard}>
                  <div style={orderHeader}>
                    <div>
                      <span style={orderIdText}>Order #{order.orderId}</span>
                      <span style={orderDate}>{new Date(order.date).toLocaleDateString()}</span>
                    </div>
                    <span style={{ ...orderStatusBadge, backgroundColor: statusColor(order.status) + '20', color: statusColor(order.status) }}>
                      {order.status}
                    </span>
                  </div>
                  <div style={orderItems}>
                    {order.items.map((item, i) => (
                      <div key={i} style={orderItemRow}>
                        <span style={itemSku}>{item.sku}</span>
                        <span style={itemQty}>×{item.quantity}</span>
                        <span style={itemPrice}>${(item.unitPrice * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div style={orderFooter}>
                    <span style={orderRegion}>📍 {order.regionName}</span>
                    <span style={orderTotal}>{order.currency} {order.totalAmount?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Review Tab */}
          {activeTab === 'reviews' && (
            <div style={tabContent}>
              <div style={sectionTitle}>Write a Review</div>
              <p style={sectionSub}>Feedback stored in MongoDB Reviews collection with embedded user reference</p>

              {reviewSuccess && <div style={successAlert}>✓ Review submitted successfully!</div>}

              <form onSubmit={handleReviewSubmit} style={reviewForm}>
                <div style={formGroup}>
                  <label style={formLabel}>Product ID (from product page URL)</label>
                  <input
                    placeholder="e.g. 68438a5e3c2a5f001234abcd"
                    value={reviewProductId}
                    onChange={e => setReviewProductId(e.target.value)}
                    style={formInput}
                    required
                  />
                </div>

                <div style={formGroup}>
                  <label style={formLabel}>Rating</label>
                  <div style={starRow}>
                    {STARS.map(star => (
                      <span
                        key={star}
                        style={{ ...starIcon, color: (reviewHover || reviewRating) >= star ? '#f59e0b' : '#e2e8f0' }}
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHover(star)}
                        onMouseLeave={() => setReviewHover(0)}
                      >★</span>
                    ))}
                    <span style={ratingText}>{reviewRating ? `${reviewRating}/5 stars` : 'Select rating'}</span>
                  </div>
                </div>

                <div style={formGroup}>
                  <label style={formLabel}>Review Title</label>
                  <input placeholder="Summarize your experience" value={reviewTitle} onChange={e => setReviewTitle(e.target.value)} style={formInput} />
                </div>

                <div style={formGroup}>
                  <label style={formLabel}>Comment</label>
                  <textarea
                    placeholder="Share your experience with this product..."
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    style={formTextarea}
                    rows={4}
                  />
                </div>

                <button type="submit" style={reviewSubmitting ? disabledBtn : submitBtn} disabled={reviewSubmitting}>
                  {reviewSubmitting ? 'Submitting...' : 'Submit Review →'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- STYLES ---
const centerStyle = { minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const spinner = { width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const miniSpinner = { width: '28px', height: '28px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const centerMsg = { display: 'flex', justifyContent: 'center', padding: '40px' };

const pageWrapper = { minHeight: '90vh', backgroundColor: 'transparent', padding: '48px 24px', fontFamily: 'system-ui, -apple-system, sans-serif' };
const pageLayout = { maxWidth: '1200px', margin: '0 auto', display: 'flex', gap: '32px', alignItems: 'flex-start' };

const profileSidebar = { width: '280px', flexShrink: 0, backgroundColor: '#D9E6F0', borderRadius: '24px', padding: '36px 24px', border: '1px solid #B0C4DE', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'sticky', top: '100px' };
const avatarCircle = { width: '80px', height: '80px', background: 'linear-gradient(135deg, #2563EB, #1D4ED8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '800', color: 'white', marginBottom: '16px', boxShadow: '0 8px 20px rgba(37,99,235,0.3)' };
const profileName = { fontSize: '20px', fontWeight: '800', color: '#0F172A' };
const profileUsername = { fontSize: '13px', color: '#64748B', fontWeight: '600', marginTop: '4px', marginBottom: '16px' };
const roleBadgeWrap = { marginBottom: '12px' };
const roleBadge = (color) => ({ display: 'inline-block', backgroundColor: color + '15', color, padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', border: `1px solid ${color}30` });
const regionBadgeWrap = { display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' };
const onlineDot = { width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px rgba(16,185,129,0.6)', display: 'inline-block' };
const regionLabel = { fontSize: '12px', color: '#334155', fontWeight: '700' };
const backToMarketBtn = { width: '100%', padding: '12px', background: 'linear-gradient(135deg, #E2E8F0, #D0E1FD)', border: '1px solid #B0C4DE', borderRadius: '12px', color: '#334155', fontWeight: '700', fontSize: '13px', cursor: 'pointer' };

const mainContent = { flex: 1 };
const tabNav = { display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: '#D9E6F0', padding: '6px', borderRadius: '16px', border: '1px solid #B0C4DE' };
const tabBtn = { flex: 1, padding: '12px', background: 'none', border: 'none', borderRadius: '12px', color: '#64748B', fontWeight: '600', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' };
const activeTabBtn = { ...tabBtn, backgroundColor: '#0F172A', color: 'white', fontWeight: '700', boxShadow: '0 4px 10px rgba(15,23,42,0.2)' };

const tabContent = { backgroundColor: '#D9E6F0', borderRadius: '24px', border: '1px solid #B0C4DE', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const sectionTitle = { fontSize: '20px', fontWeight: '900', color: '#0F172A', marginBottom: '4px' };
const sectionSub = { fontSize: '13px', color: '#64748B', marginBottom: '28px' };

const infoGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' };
const infoGroup = { display: 'flex', flexDirection: 'column', gap: '4px' };
const infoLabel = { fontSize: '11px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.8px' };
const infoValue = { fontSize: '15px', fontWeight: '700', color: '#0F172A' };

const emptyState = { textAlign: 'center', padding: '40px' };
const orderCard = { backgroundColor: '#EBF2F7', borderRadius: '16px', border: '1px solid #B0C4DE', padding: '20px', marginBottom: '16px' };
const orderHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' };
const orderIdText = { fontSize: '15px', fontWeight: '800', color: '#0F172A', marginRight: '12px' };
const orderDate = { fontSize: '12px', color: '#64748B', fontWeight: '600' };
const orderStatusBadge = { fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px' };
const orderItems = { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' };
const orderItemRow = { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', backgroundColor: '#D9E6F0', borderRadius: '10px', border: '1px solid #B0C4DE' };
const itemSku = { flex: 1, fontSize: '13px', fontWeight: '700', color: '#0F172A' };
const itemQty = { fontSize: '12px', color: '#64748B', fontWeight: '600' };
const itemPrice = { fontSize: '13px', fontWeight: '800', color: '#0F172A' };
const orderFooter = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const orderRegion = { fontSize: '12px', color: '#334155', fontWeight: '600' };
const orderTotal = { fontSize: '18px', fontWeight: '900', color: '#2563EB' };

const reviewForm = { display: 'flex', flexDirection: 'column', gap: '20px' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '8px' };
const formLabel = { fontSize: '12px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' };
const formInput = { padding: '12px 16px', borderRadius: '12px', border: '1px solid #B0C4DE', fontSize: '14px', outline: 'none', backgroundColor: '#EBF2F7', color: '#0F172A' };
const formTextarea = { padding: '12px 16px', borderRadius: '12px', border: '1px solid #B0C4DE', fontSize: '14px', outline: 'none', backgroundColor: '#EBF2F7', color: '#0F172A', resize: 'vertical' };
const starRow = { display: 'flex', alignItems: 'center', gap: '4px' };
const starIcon = { fontSize: '36px', cursor: 'pointer', transition: 'color 0.15s, transform 0.15s', lineHeight: 1 };
const ratingText = { fontSize: '13px', color: '#64748B', fontWeight: '600', marginLeft: '8px' };
const submitBtn = { padding: '14px 28px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 15px rgba(37,99,235,0.3)' };
const disabledBtn = { ...submitBtn, background: '#94A3B8', cursor: 'not-allowed', boxShadow: 'none' };
const successAlert = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '14px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '14px' };

const errorBox = { color: '#be123c', fontSize: '14px', fontWeight: '600', backgroundColor: '#fff1f2', padding: '16px 24px', borderRadius: '10px' };
