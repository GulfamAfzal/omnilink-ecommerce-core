'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, containerStyle, mainContentStyle } from '../orders/page';
import { DollarSign, Package, ShoppingCart, Globe } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.userType !== 'Admin') { router.push('/admin/login'); return; }

    fetch('/api/admin/analytics')
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [router]);

  const statusStyle = (s) => {
    const map = { 'Pending': { bg: '#fef9c3', color: '#854d0e' }, 'Processing': { bg: '#ede9fe', color: '#6d28d9' }, 'Completed': { bg: '#dcfce7', color: '#15803d' }, 'Cancelled': { bg: '#fee2e2', color: '#dc2626' } };
    return map[s] || { bg: '#f1f5f9', color: '#475569' };
  };

  return (
    <div style={containerStyle}>
      <AdminSidebar active="analytics" />
      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Analytics Dashboard</h1>
            <p style={subtitleStyle}>In-memory data composition: <strong style={{ color: '#4f46e5' }}>Azure SQL</strong> stitched with <strong style={{ color: '#10b981' }}>MongoDB Atlas</strong> catalog data</p>
          </div>
          <button style={refreshBtn} onClick={() => window.location.reload()}>↻ Refresh</button>
        </header>

        {loading ? (
          <div style={loaderState}>
            <div style={spinner} />
            <p style={{ color: '#64748b', marginTop: '12px', fontWeight: '600' }}>Executing in-memory composition pipeline...</p>
          </div>
        ) : !data ? (
          <div style={loaderState}><p style={{ color: '#ef4444', fontWeight: '700' }}>Failed to load analytics</p></div>
        ) : (
          <>
            {/* Top Metrics */}
            <div style={metricsGrid}>
              {[
                { label: 'Total Revenue', value: `$${(data.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <DollarSign size={28} color="#15803D" />, color: '#15803D', bg: '#DCFCE7' },
                { label: 'Total Orders', value: data.totalOrders || 0, icon: <Package size={28} color="#0284C7" />, color: '#0284C7', bg: '#E0F2FE' },
                { label: 'Items Sold', value: data.totalItems || 0, icon: <ShoppingCart size={28} color="#B45309" />, color: '#B45309', bg: '#FEF3C7' },
                { label: 'Active Regions', value: data.revenueByRegion?.length || 0, icon: <Globe size={28} color="#0369A1" />, color: '#0369A1', bg: '#E0F2FE' },
              ].map((m, i) => (
                <div key={i} style={{ ...metricCard, backgroundColor: m.bg, borderColor: m.color + '30' }}>
                  <div style={metricIcon}>{m.icon}</div>
                  <div style={metricLabel}>{m.label}</div>
                  <div style={{ ...metricValue, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>

            {/* Revenue by Region */}
            {data.revenueByRegion?.length > 0 && (
              <div style={regionCard}>
                <div style={cardTitle}>Revenue by Region</div>
                <div style={regionGrid}>
                  {data.revenueByRegion.map((r, i) => {
                    const maxRev = Math.max(...data.revenueByRegion.map(x => x.revenue));
                    const pct = maxRev > 0 ? (r.revenue / maxRev) * 100 : 0;
                    return (
                      <div key={i} style={regionRow}>
                        <div style={regionName}>{r.region}</div>
                        <div style={regionBarWrap}>
                          <div style={{ ...regionBar, width: `${pct}%` }} />
                        </div>
                        <div style={regionRevenue}>${r.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div style={regionOrders}>{r.orders} orders</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Orders Table with Stitched Catalog Data */}
            <div style={tableSection}>
              <div style={cardTitle}>Enriched Order Matrix <span style={noBadge}>NoSQL Stitched</span></div>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHead}>
                    {['Order ID', 'Customer', 'Date', 'SKU (MongoDB)', 'Qty', 'Unit Price', 'Line Total', 'Status', 'Region'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.orders || []).flatMap(order =>
                    order.items.length > 0
                      ? order.items.map((item, i) => (
                          <tr key={`${order.orderId}-${i}`} style={trStyle}>
                            <td style={tdStyle}><span style={idBadge}>#{order.orderId}</span></td>
                            <td style={tdStyle}>{order.customer}</td>
                            <td style={{ ...tdStyle, color: '#94a3b8', fontSize: '12px' }}>{new Date(order.date).toLocaleDateString()}</td>
                            <td style={tdStyle}><span style={skuBadge}>{item.sku}</span></td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{item.quantity}</td>
                            <td style={tdStyle}>${item.unitPrice?.toFixed(2)}</td>
                            <td style={{ ...tdStyle, fontWeight: '800', color: '#10b981' }}>${item.lineTotal?.toFixed(2)}</td>
                            <td style={tdStyle}><span style={{ ...statusPill, ...statusStyle(order.status) }}>{order.status}</span></td>
                            <td style={{ ...tdStyle, color: '#64748b', fontSize: '12px' }}>{order.regionName}</td>
                          </tr>
                        ))
                      : [<tr key={order.orderId} style={trStyle}>
                          <td style={tdStyle}><span style={idBadge}>#{order.orderId}</span></td>
                          <td style={tdStyle}>{order.customer}</td>
                          <td colSpan={7} style={{ ...tdStyle, color: '#94a3b8' }}>No items</td>
                        </tr>]
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' };
const titleStyle = { margin: 0, fontSize: '28px', color: '#0F172A', fontWeight: '900', letterSpacing: '-0.5px' };
const subtitleStyle = { margin: '6px 0 0', color: '#64748B', fontSize: '14px' };
const refreshBtn = { padding: '10px 20px', backgroundColor: '#D9E6F0', color: '#0F172A', border: '1px solid #B0C4DE', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' };

const loaderState = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' };
const spinner = { width: '36px', height: '36px', border: '3px solid #f1f5f9', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };

const metricsGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' };
const metricCard = { padding: '24px', borderRadius: '20px', border: '1px solid', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };
const metricIcon = { marginBottom: '12px', display: 'flex', justifyContent: 'center' };
const metricLabel = { fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' };
const metricValue = { fontSize: '28px', fontWeight: '900' };

const regionCard = { backgroundColor: '#EBF2F7', borderRadius: '20px', border: '1px solid #B0C4DE', padding: '28px', marginBottom: '28px' };
const cardTitle = { fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' };
const regionGrid = { display: 'flex', flexDirection: 'column', gap: '16px' };
const regionRow = { display: 'grid', gridTemplateColumns: '160px 1fr 120px 80px', alignItems: 'center', gap: '16px' };
const regionName = { fontSize: '13px', fontWeight: '700', color: '#0F172A' };
const regionBarWrap = { height: '8px', backgroundColor: '#D9E6F0', borderRadius: '4px', overflow: 'hidden' };
const regionBar = { height: '100%', background: 'linear-gradient(90deg, #2563EB, #0284C7)', borderRadius: '4px', transition: 'width 0.5s ease' };
const regionRevenue = { fontSize: '13px', fontWeight: '800', color: '#0F172A', textAlign: 'right' };
const regionOrders = { fontSize: '11px', color: '#64748B', fontWeight: '600', textAlign: 'right' };

const tableSection = { backgroundColor: '#EBF2F7', borderRadius: '20px', border: '1px solid #B0C4DE', padding: '28px', overflow: 'auto' };
const noBadge = { fontSize: '10px', fontWeight: '800', color: '#15803D', backgroundColor: '#DCFCE7', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', minWidth: '900px' };
const tableHead = { backgroundColor: '#D9E6F0', borderBottom: '2px solid #B0C4DE' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '14px 16px', fontSize: '13px', color: '#0F172A', borderBottom: '1px solid #B0C4DE' };
const trStyle = { transition: 'background 0.15s' };
const idBadge = { fontWeight: '800', color: '#2563EB', fontSize: '12px' };
const skuBadge = { backgroundColor: '#D9E6F0', color: '#0F172A', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '11px', fontFamily: 'monospace', border: '1px solid #B0C4DE' };
const statusPill = { fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px' };
