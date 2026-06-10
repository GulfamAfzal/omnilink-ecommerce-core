'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const NAV_ITEMS = [
  { id: 'orders',    label: '📦 Orders Log',      href: '/admin/orders' },
  { id: 'analytics', label: '📊 Analytics',        href: '/admin/analytics' },
  { id: 'inventory', label: '🏭 Inventory',         href: '/admin/inventory' },
  { id: 'logs',      label: '🔍 Audit Logs',        href: '/admin/logs' },
  { id: 'data',      label: '⚙ Data Management',   href: '/admin/data' },
];

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.userType !== 'Admin') { router.push('/admin/login'); return; }

    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => { setOrders(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pending = orders.filter(o => o.status === 'Pending').length;

  const filtered = orders.filter(o => {
    const matchSearch = !searchQ || o.customer?.toLowerCase().includes(searchQ.toLowerCase()) || String(o.id).includes(searchQ);
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusStyle = (s) => {
    const map = { 'Pending': { bg: '#fef9c3', color: '#854d0e' }, 'Processing': { bg: '#ede9fe', color: '#6d28d9' }, 'Completed': { bg: '#dcfce7', color: '#15803d' }, 'Cancelled': { bg: '#fee2e2', color: '#dc2626' } };
    return map[s] || { bg: '#f1f5f9', color: '#475569' };
  };

  return (
    <div style={containerStyle}>
      <AdminSidebar active="orders" />
      <main style={mainContentStyle}>
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Orders Log</h1>
            <p style={subtitleStyle}>Cross-engine aggregation: <strong style={{ color: '#4f46e5' }}>Azure SQL</strong> + <strong style={{ color: '#10b981' }}>MongoDB Atlas</strong></p>
          </div>
          <button style={refreshBtn} onClick={() => window.location.reload()}>↻ Refresh</button>
        </header>

        {/* Stats */}
        <div style={statsGrid}>
          {[
            { label: 'Total Orders', value: orders.length, icon: '📦', color: '#6366f1' },
            { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: '💰', color: '#10b981' },
            { label: 'Pending', value: pending, icon: '⏳', color: '#f59e0b' },
            { label: 'System Status', value: 'Operational', icon: '✅', color: '#10b981' },
          ].map((s, i) => (
            <div key={i} style={statCard}>
              <div style={statIcon}>{s.icon}</div>
              <div>
                <div style={{ ...statLabel }}>{s.label}</div>
                <div style={{ ...statValue, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={filterBar}>
          <input
            placeholder="Search by customer or order ID..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            style={searchInput}
          />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={filterSelect}>
            {['All', 'Pending', 'Processing', 'Completed', 'Cancelled'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Table */}
        <div style={tableWrapper}>
          {loading ? (
            <div style={loaderStyle}>
              <div style={spinner} />
              <span style={{ marginTop: '12px', color: '#64748b', fontSize: '13px' }}>Synchronizing with distributed engines...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={loaderStyle}><div style={{ fontSize: '40px' }}>📭</div><p style={{ color: '#64748b', fontWeight: '600' }}>No orders found</p></div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRow}>
                  {['Order ID', 'Customer', 'Items (NoSQL Enriched)', 'Amount', 'Status', 'Date'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order, idx) => {
                  const sc = statusStyle(order.status);
                  return (
                    <tr key={order.id} style={idx % 2 === 0 ? trEven : trOdd}>
                      <td style={tdStyle}><span style={orderIdBadge}>#{order.id}</span></td>
                      <td style={tdStyle}><span style={customerName}>{order.customer}</span></td>
                      <td style={tdStyle}>
                        <div style={itemsCol}>
                          {order.items?.map((item, i) => (
                            <div key={i} style={itemRow}>
                              <img src={item.image_url || '/logo.png'} alt="" style={itemThumb} onError={e => e.target.src = '/logo.png'} />
                              <div>
                                <div style={itemTitle}>{item.product_name || 'Product'}</div>
                                <div style={itemMeta}>Qty: {item.quantity} | {String(item.product_variant_id).substring(0, 10)}…</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '800', color: '#1e293b' }}>${(order.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                      <td style={tdStyle}><span style={{ ...statusBadge, backgroundColor: sc.bg, color: sc.color }}>{order.status}</span></td>
                      <td style={{ ...tdStyle, color: '#64748b', fontSize: '13px' }}>{new Date(order.date).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

export function AdminSidebar({ active }) {
  const handleLogout = () => { localStorage.clear(); window.location.href = '/login'; };
  return (
    <aside style={sidebarStyle}>
      <div style={sidebarLogo}>
        <span style={{ color: '#818cf8' }}>OMS</span> Admin
      </div>
      <nav style={{ flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <Link key={item.id} href={item.href} style={active === item.id ? activeNavItem : navItem}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div style={sidebarFooter}>
        <div style={dbStatusRow}>
          <span style={dbDot('#10b981')} /> Azure SQL
        </div>
        <div style={dbStatusRow}>
          <span style={dbDot('#10b981')} /> MongoDB Atlas
        </div>
        <button onClick={handleLogout} style={logoutBtn}>Sign Out</button>
      </div>
    </aside>
  );
}

// --- SHARED ADMIN STYLES ---
export const containerStyle = { display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: '"Inter", system-ui, sans-serif' };
export const sidebarStyle = { width: '260px', backgroundColor: '#0f172a', color: 'white', padding: '28px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 };
export const sidebarLogo = { fontSize: '22px', fontWeight: '900', marginBottom: '36px', letterSpacing: '-0.5px', padding: '0 8px' };
export const navItem = { display: 'block', padding: '12px 14px', borderRadius: '10px', color: '#94a3b8', fontSize: '14px', fontWeight: '600', textDecoration: 'none', marginBottom: '4px', transition: 'all 0.2s' };
export const activeNavItem = { ...navItem, backgroundColor: '#1e293b', color: 'white' };
export const sidebarFooter = { borderTop: '1px solid #1e293b', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' };
export const dbStatusRow = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', fontWeight: '600' };
export const dbDot = (color) => ({ width: '8px', height: '8px', backgroundColor: color, borderRadius: '50%', display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${color}` });
export const logoutBtn = { width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid #1e293b', color: '#94a3b8', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', marginTop: '8px' };
export const mainContentStyle = { flex: 1, padding: '36px 40px', overflowY: 'auto' };

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' };
const titleStyle = { margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' };
const subtitleStyle = { margin: '6px 0 0', color: '#64748b', fontSize: '14px' };
const refreshBtn = { padding: '10px 20px', backgroundColor: 'white', color: '#1e293b', border: '2px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' };
const statCard = { backgroundColor: 'white', padding: '20px 24px', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' };
const statIcon = { fontSize: '28px', width: '48px', height: '48px', backgroundColor: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const statLabel = { fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' };
const statValue = { fontSize: '24px', fontWeight: '900', marginTop: '2px' };

const filterBar = { display: 'flex', gap: '12px', marginBottom: '20px' };
const searchInput = { flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: 'white' };
const filterSelect = { padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer' };

const tableWrapper = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' };
const loaderStyle = { padding: '60px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' };
const spinner = { width: '36px', height: '36px', border: '3px solid #f1f5f9', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeaderRow = { backgroundColor: '#0f172a' };
const thStyle = { padding: '14px 20px', textAlign: 'left', color: '#94a3b8', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '16px 20px', fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f8fafc', verticalAlign: 'top' };
const trEven = { backgroundColor: 'white' };
const trOdd = { backgroundColor: '#fafbfc' };
const orderIdBadge = { fontWeight: '800', color: '#6366f1', fontFamily: 'monospace', fontSize: '13px' };
const customerName = { fontWeight: '700' };
const itemsCol = { display: 'flex', flexDirection: 'column', gap: '8px' };
const itemRow = { display: 'flex', alignItems: 'center', gap: '10px' };
const itemThumb = { width: '36px', height: '36px', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '4px', border: '1px solid #f1f5f9' };
const itemTitle = { fontSize: '13px', fontWeight: '700', color: '#0f172a' };
const itemMeta = { fontSize: '11px', color: '#94a3b8', marginTop: '2px' };
const statusBadge = { fontSize: '11px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px' };