'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, containerStyle, mainContentStyle } from '../orders/page';
import { AlertTriangle, CheckCircle, Package, Inbox } from 'lucide-react';

export default function AdminInventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [regionFilter, setRegionFilter] = useState('');
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  // Form state
  const [form, setForm] = useState({
    variantId: '', storeId: 'STORE-MAIN', regionId: '1',
    quantityChange: '', reason: '', operatorId: '206'
  });

  const fetchInventory = (region = '') => {
    setLoading(true);
    const url = `/api/merchant/inventory${region ? `?region_id=${region}` : ''}`;
    fetch(url)
      .then(res => res.json())
      .then(data => { setInventory(data.inventory || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.userType !== 'Admin') { router.push('/admin/login'); return; }
    fetchInventory();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const res = await fetch('/api/merchant/inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId: form.variantId,
          storeId: form.storeId,
          regionId: form.regionId,
          quantityChange: parseInt(form.quantityChange),
          reason: form.reason,
          operatorId: form.operatorId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Stock updated! New balance: ${data.newQuantity}`);
        setForm(f => ({ ...f, variantId: '', quantityChange: '', reason: '' }));
        fetchInventory(regionFilter);
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (e) {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const lowStockCount = inventory.filter(i => i.lowStock).length;

  return (
    <div style={containerStyle}>
      <AdminSidebar active="inventory" />
      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Inventory Control Terminal</h1>
            <p style={subtitleStyle}>Sharded stock management via MongoDB Atlas — shard key: <code style={{ color: '#10b981', fontFamily: 'monospace' }}>region_id</code></p>
          </div>
          {lowStockCount > 0 && (
            <div style={lowStockAlert}>
              <AlertTriangle size={14} style={{ marginRight: '6px' }} />
              {lowStockCount} item{lowStockCount > 1 ? 's' : ''} low on stock
            </div>
          )}
        </header>

        <div style={pageGrid}>
          {/* Inventory Table */}
          <div style={tableSection}>
            <div style={sectionHeader}>
              <div style={sectionTitle}>Stock Registry</div>
              <div style={filterRow}>
                <select
                  value={regionFilter}
                  onChange={e => { setRegionFilter(e.target.value); fetchInventory(e.target.value); }}
                  style={filterSelect}
                >
                  <option value="">All Regions</option>
                  {[1, 2, 3].map(r => <option key={r} value={r}>Region {r}</option>)}
                </select>
                <button onClick={() => fetchInventory(regionFilter)} style={refreshBtn}>↻</button>
              </div>
            </div>

            {loading ? (
              <div style={loaderDiv}><div style={spinner} /></div>
            ) : inventory.length === 0 ? (
              <div style={emptyDiv}>
                <div style={{ marginBottom: '12px' }}><Package size={40} color="#94A3B8" /></div>
                <p style={{ fontWeight: '700', color: '#334155' }}>No inventory records found</p>
                <p style={{ fontSize: '13px', color: '#94a3b8' }}>Use the form to add stock entries for a variant.</p>
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHead}>
                    {['SKU / Variant', 'Store', 'Region', 'Quantity', 'Status', 'Updated'].map(h => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item, idx) => (
                    <tr key={idx} style={idx % 2 === 0 ? trEven : trOdd}>
                      <td style={tdStyle}>
                        <div style={skuText}>{item.sku}</div>
                        <div style={variantId}>{String(item.variant_id).substring(0, 16)}…</div>
                      </td>
                      <td style={tdStyle}>{item.store_id || 'default'}</td>
                      <td style={tdStyle}>
                        <span style={regionBadge}>R{item.region_id}</span>
                      </td>
                      <td style={{ ...tdStyle, fontWeight: '900', fontSize: '18px', color: item.lowStock ? '#dc2626' : '#0f172a' }}>
                        {item.quantity ?? 0}
                      </td>
                      <td style={tdStyle}>
                        {item.lowStock
                          ? <span style={lowBadge}><AlertTriangle size={12} style={{ marginRight: '4px' }} /> Low Stock</span>
                          : <span style={okBadge}><CheckCircle size={12} style={{ marginRight: '4px' }} /> In Stock</span>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#94a3b8' }}>
                        {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Adjustment Form */}
          <div style={formPanel}>
            <div style={sectionTitle}>Stock Adjustment</div>
            <p style={formSub}>Updates routed directly to shard node via <code style={{ color: '#10b981', fontSize: '11px' }}>region_id</code> key</p>

            {success && <div style={successAlert}><CheckCircle size={14} style={{ marginRight: '6px' }} /> {success}</div>}
            {error && <div style={errorAlert}><AlertTriangle size={14} style={{ marginRight: '6px' }} /> {error}</div>}

            <form onSubmit={handleSubmit} style={formStyle}>
              {[
                { label: 'Variant ID', key: 'variantId', placeholder: 'e.g. PROD_MBP14_M3_001', required: true },
                { label: 'Store ID', key: 'storeId', placeholder: 'e.g. STORE-MAIN' },
                { label: 'Operator ID', key: 'operatorId', placeholder: 'User ID' },
              ].map(({ label, key, placeholder, required }) => (
                <div key={key} style={formGroup}>
                  <label style={formLabel}>{label}</label>
                  <input
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={formInput}
                    required={required}
                  />
                </div>
              ))}

              <div style={formGroup}>
                <label style={formLabel}>Region</label>
                <select value={form.regionId} onChange={e => setForm(f => ({ ...f, regionId: e.target.value }))} style={formInput}>
                  <option value="1">Region 1 — South Asia</option>
                  <option value="2">Region 2 — North America</option>
                  <option value="3">Region 3 — Europe</option>
                </select>
              </div>

              <div style={formGroup}>
                <label style={formLabel}>Quantity Change</label>
                <div style={deltaRow}>
                  <button type="button" onClick={() => setForm(f => ({ ...f, quantityChange: '-' + Math.abs(parseInt(f.quantityChange || 0)) }))} style={deltaBtn('red')}>− Reduce</button>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={form.quantityChange}
                    onChange={e => setForm(f => ({ ...f, quantityChange: e.target.value }))}
                    style={{ ...formInput, textAlign: 'center', flex: 1 }}
                    required
                  />
                  <button type="button" onClick={() => setForm(f => ({ ...f, quantityChange: Math.abs(parseInt(f.quantityChange || 0)).toString() }))} style={deltaBtn('green')}>+ Add</button>
                </div>
                <p style={deltaHint}>Negative = reduce stock. Positive = restock.</p>
              </div>

              <div style={formGroup}>
                <label style={formLabel}>Reason / Notes</label>
                <textarea
                  placeholder="e.g. Q2 restock shipment from warehouse..."
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  style={{ ...formInput, resize: 'vertical' }}
                  rows={3}
                />
              </div>

              <button type="submit" style={submitting ? disabledBtn : submitBtn} disabled={submitting}>
                {submitting ? 'Routing to Shard...' : 'Apply Adjustment →'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' };
const titleStyle = { margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' };
const subtitleStyle = { margin: '6px 0 0', color: '#64748b', fontSize: '14px' };
const lowStockAlert = { backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309', padding: '12px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center' };

const pageGrid = { display: 'grid', gridTemplateColumns: '1fr 360px', gap: '28px', alignItems: 'flex-start' };

const tableSection = { backgroundColor: '#EBF2F7', borderRadius: '20px', border: '1px solid #B0C4DE', overflow: 'hidden' };
const sectionHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #B0C4DE' };
const sectionTitle = { fontSize: '16px', fontWeight: '800', color: '#0F172A' };
const filterRow = { display: 'flex', gap: '8px' };
const filterSelect = { padding: '8px 12px', borderRadius: '10px', border: '1px solid #B0C4DE', fontSize: '13px', backgroundColor: '#D9E6F0', cursor: 'pointer', color: '#0F172A' };
const refreshBtn = { padding: '8px 12px', backgroundColor: '#D9E6F0', border: '1px solid #B0C4DE', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '15px', color: '#0F172A' };
const loaderDiv = { display: 'flex', justifyContent: 'center', padding: '40px' };
const emptyDiv = { textAlign: 'center', padding: '48px', color: '#64748B' };
const spinner = { width: '32px', height: '32px', border: '3px solid #D9E6F0', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHead = { backgroundColor: '#D9E6F0', borderBottom: '2px solid #B0C4DE' };
const thStyle = { padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' };
const tdStyle = { padding: '14px 20px', fontSize: '13px', color: '#0F172A', borderBottom: '1px solid #B0C4DE' };
const trEven = { backgroundColor: '#EBF2F7' };
const trOdd = { backgroundColor: '#D9E6F0' };
const skuText = { fontWeight: '800', color: '#0F172A', fontSize: '13px' };
const variantId = { fontFamily: 'monospace', fontSize: '11px', color: '#64748B', marginTop: '2px' };
const regionBadge = { backgroundColor: '#E0F2FE', color: '#0284C7', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '11px', border: '1px solid #B0C4DE' };
const lowBadge = { backgroundColor: '#FEF2F2', color: '#DC2626', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '11px', display: 'inline-flex', alignItems: 'center' };
const okBadge = { backgroundColor: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: '20px', fontWeight: '700', fontSize: '11px', display: 'inline-flex', alignItems: 'center' };

const formPanel = { backgroundColor: '#EBF2F7', borderRadius: '20px', border: '1px solid #B0C4DE', padding: '28px' };
const formSub = { fontSize: '12px', color: '#94a3b8', marginBottom: '24px' };
const successAlert = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', marginBottom: '16px' };
const errorAlert = { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px', borderRadius: '10px', fontWeight: '700', fontSize: '13px', marginBottom: '16px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const formLabel = { fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' };
const formInput = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #B0C4DE', fontSize: '14px', outline: 'none', backgroundColor: '#D9E6F0', color: '#0F172A' };
const deltaRow = { display: 'flex', gap: '8px', alignItems: 'center' };
const deltaBtn = (color) => ({ padding: '10px 12px', borderRadius: '10px', border: 'none', backgroundColor: color === 'red' ? '#fef2f2' : '#f0fdf4', color: color === 'red' ? '#dc2626' : '#16a34a', fontWeight: '800', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' });
const deltaHint = { fontSize: '11px', color: '#94a3b8', margin: 0 };
const submitBtn = { width: '100%', padding: '14px', background: 'linear-gradient(to right, #2563EB, #1D4ED8)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 15px rgba(37,99,235,0.25)' };
const disabledBtn = { ...submitBtn, background: '#94A3B8', cursor: 'not-allowed', boxShadow: 'none' };
