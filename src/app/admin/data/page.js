'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, containerStyle, mainContentStyle } from '../orders/page';

const TABS = [
  { id: 'users',    label: '👤 User Regions',  badge: 'FIX TAX' },
  { id: 'products', label: '📦 Add Product',    badge: 'MongoDB' },
  { id: 'variants', label: '🔧 Add Variant',    badge: 'MongoDB' },
  { id: 'inventory',label: '📊 Add Inventory',  badge: 'MongoDB' },
];

const REGIONS = [
  { id: 1, name: 'North America', currency: 'USD', taxRate: '8%'  },
  { id: 2, name: 'South Asia',    currency: 'PKR', taxRate: '10%' },
  { id: 3, name: 'Europe',        currency: 'GBP', taxRate: '20%' },
  { id: 4, name: 'East Asia',     currency: 'JPY', taxRate: '10%' },
  { id: 5, name: 'Middle East',   currency: 'AED', taxRate: '5%'  },
];

export default function AdminDataPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.userType !== 'Admin') { router.push('/admin/login'); }
  }, [router]);

  return (
    <div style={containerStyle}>
      <AdminSidebar active="data" />
      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Data Management Center</h1>
            <p style={subtitleStyle}>Add & manage Products, Variants, Inventory, and fix user region assignments for correct tax calculation</p>
          </div>
          <div style={alertBanner}>
            ⚠ If tax shows 0 or errors, assign a region to your user in the <strong>User Regions</strong> tab
          </div>
        </header>

        {/* Tab Bar */}
        <div style={tabBar}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={activeTab === tab.id ? activeTabBtn : tabBtn}>
              {tab.label}
              <span style={{ ...tabBadge, backgroundColor: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : '#e0e7ff', color: activeTab === tab.id ? 'white' : '#4f46e5' }}>{tab.badge}</span>
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeTab === 'users'     && <UsersTab />}
        {activeTab === 'products'  && <ProductsTab />}
        {activeTab === 'variants'  && <VariantsTab />}
        {activeTab === 'inventory' && <InventoryTab />}
      </main>
    </div>
  );
}

// ============================================================
//  TAB: FIX USER REGIONS (the tax problem)
// ============================================================
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/admin/users').then(r => r.json()).then(d => { setUsers(d.users || []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const assignRegion = async (userId, regionId) => {
    setUpdating(userId);
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, regionId })
    });
    const data = await res.json();
    if (res.ok) { showToast(data.message); fetchUsers(); }
    else { showToast(data.error, 'error'); }
    setUpdating(null);
  };

  return (
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div style={sectionCard}>
        <div style={sectionHead}>
          <div>
            <div style={sectionTitle}>User Region Assignment</div>
            <div style={sectionSub}>Users with <span style={{ color: '#dc2626', fontWeight: '800' }}>No Region</span> will get 0 tax or order errors. Assign a region to fix this.</div>
          </div>
          <button onClick={fetchUsers} style={refreshBtn}>↻ Refresh</button>
        </div>

        {/* Region Reference */}
        <div style={regionRefBox}>
          {REGIONS.map(r => (
            <div key={r.id} style={regionRefCard}>
              <div style={regionRefId}>R{r.id}</div>
              <div style={regionRefName}>{r.name}</div>
              <div style={regionRefDetail}>{r.currency} · Tax {r.taxRate}</div>
            </div>
          ))}
        </div>

        {loading ? <Loader /> : (
          <table style={tableStyle}>
            <thead>
              <tr style={tableHead}>
                {['ID', 'Username', 'Email', 'Type', 'Current Region', 'Tax Rate', 'Assign Region'].map(h => <th key={h} style={thStyle}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => (
                <tr key={u.user_id} style={idx % 2 === 0 ? trEven : trOdd}>
                  <td style={tdStyle}><span style={idTag}>#{u.user_id}</span></td>
                  <td style={tdStyle}><span style={userName}>{u.username}</span></td>
                  <td style={{ ...tdStyle, fontSize: '12px', color: '#64748b' }}>{u.email}</td>
                  <td style={tdStyle}><span style={typeBadge(u.user_type)}>{u.user_type}</span></td>
                  <td style={tdStyle}>
                    {u.region_id
                      ? <span style={okRegion}>✓ {u.region_name} (R{u.region_id})</span>
                      : <span style={noRegion}>⚠ NOT SET</span>}
                  </td>
                  <td style={tdStyle}>
                    {u.tax_rate
                      ? <span style={taxTag}>{(u.tax_rate * 100).toFixed(0)}%</span>
                      : <span style={noTaxTag}>—</span>}
                  </td>
                  <td style={tdStyle}>
                    <div style={regionBtnRow}>
                      {REGIONS.map(r => (
                        <button
                          key={r.id}
                          onClick={() => assignRegion(u.user_id, r.id)}
                          disabled={updating === u.user_id}
                          style={{
                            ...regionAssignBtn,
                            backgroundColor: u.region_id === r.id ? '#0f172a' : '#f1f5f9',
                            color: u.region_id === r.id ? 'white' : '#475569',
                          }}
                        >
                          {updating === u.user_id ? '…' : `R${r.id}`}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  TAB: ADD PRODUCT
// ============================================================
function ProductsTab() {
  const [form, setForm] = useState({ name: '', brand: '', category: 'Electronics', description: '', media: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 5000); };

  const fetchProducts = () => {
    fetch('/api/admin/products').then(r => r.json()).then(d => { setProducts(d.products || []); setLoadingList(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`✓ ${data.message} — Product ID: ${data.productId}`);
      setForm({ name: '', brand: '', category: 'Electronics', description: '', media: '' });
      fetchProducts();
    } else {
      showToast(data.error, 'error');
    }
    setSubmitting(false);
  };

  return (
    <div style={twoColGrid}>
      {toast && <Toast msg={toast.msg} type={toast.type} full />}

      {/* Form */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Add New Product</div>
        <div style={sectionSub}>Creates a product document in MongoDB <code style={code}>Products</code> collection</div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <FormField label="Product Name *" placeholder="e.g. iPhone 16 Pro Max" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} required />
          <FormField label="Brand *" placeholder="e.g. Apple" value={form.brand} onChange={v => setForm(f => ({ ...f, brand: v }))} required />

          <div style={formGroup}>
            <label style={formLabel}>Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={formInput}>
              {['Electronics', 'Smartphones', 'Laptops', 'Audio', 'Accessories', 'Peripherals', 'Tablets'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <FormField label="Description" placeholder="Product description..." value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} />
          <FormField label="Image URL (optional)" placeholder="https://images.unsplash.com/..." value={form.media} onChange={v => setForm(f => ({ ...f, media: v }))} />

          {form.media && <img src={form.media} alt="preview" style={imgPreview} onError={e => e.target.style.display='none'} />}

          <button type="submit" style={submitting ? disabledBtn : submitBtn} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Product →'}
          </button>
        </form>
      </div>

      {/* Existing Products */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Existing Products ({products.length})</div>
        <div style={sectionSub}>Click a product to copy its ID for use in the Variants tab</div>
        {loadingList ? <Loader /> : (
          <div style={listScroll}>
            {products.length === 0
              ? <div style={emptyMsg}>No products yet. Add one using the form.</div>
              : products.map(p => (
                <div key={p._id} style={listItem} onClick={() => { navigator.clipboard.writeText(p._id); }}>
                  <div style={listItemName}>{p.name}</div>
                  <div style={listItemSub}>{p.brand} · {p.category}</div>
                  <div style={listItemId} title="Click row to copy ID">ID: {p._id}</div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  TAB: ADD VARIANT
// ============================================================
function VariantsTab() {
  const [form, setForm] = useState({ productId: '', sku: '', price: '', currency: 'USD', color: '', size: '', storage: '', imageUrl: '', initialStock: '10', regionId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [products, setProducts] = useState([]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 6000); };

  useEffect(() => {
    fetch('/api/admin/products').then(r => r.json()).then(d => setProducts(d.products || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/admin/variants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, price: parseFloat(form.price), initialStock: parseInt(form.initialStock) })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`✓ ${data.message}`);
      setForm(f => ({ ...f, sku: '', price: '', color: '', size: '', storage: '', imageUrl: '', initialStock: '10' }));
    } else {
      showToast(data.error, 'error');
    }
    setSubmitting(false);
  };

  return (
    <div style={twoColGrid}>
      {toast && <Toast msg={toast.msg} type={toast.type} full />}

      <div style={sectionCard}>
        <div style={sectionTitle}>Add Product Variant</div>
        <div style={sectionSub}>Creates a document in <code style={code}>Product_Variants</code> + auto-generates <code style={code}>Inventory</code> records for all regions</div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroup}>
            <label style={formLabel}>Parent Product *</label>
            <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} style={formInput} required>
              <option value="">— Select a Product —</option>
              {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.brand})</option>)}
            </select>
            <div style={fieldHint}>If product not listed, create it first in the "Add Product" tab</div>
          </div>

          <FormField label="SKU *" placeholder="e.g. APPLE-IP16PM-256-BLK" value={form.sku} onChange={v => setForm(f => ({ ...f, sku: v }))} required hint="Must be globally unique. Uppercase recommended." />

          <div style={twoFieldRow}>
            <FormField label="Price *" placeholder="e.g. 1299.99" value={form.price} onChange={v => setForm(f => ({ ...f, price: v }))} type="number" required />
            <div style={formGroup}>
              <label style={formLabel}>Currency</label>
              <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} style={formInput}>
                {['USD', 'EUR', 'GBP', 'PKR', 'SAR'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div style={specSection}>
            <div style={specLabel}>Specifications (optional)</div>
            <div style={threeFieldRow}>
              <FormField label="Color" placeholder="e.g. Black Titanium" value={form.color} onChange={v => setForm(f => ({ ...f, color: v }))} />
              <FormField label="Storage" placeholder="e.g. 256GB" value={form.storage} onChange={v => setForm(f => ({ ...f, storage: v }))} />
              <FormField label="Size" placeholder="e.g. 6.9 inch" value={form.size} onChange={v => setForm(f => ({ ...f, size: v }))} />
            </div>
          </div>

          <FormField label="Variant Image URL" placeholder="https://..." value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />

          <div style={formGroup}>
            <label style={formLabel}>Initial Stock Quantity</label>
            <input type="number" min="0" value={form.initialStock} onChange={e => setForm(f => ({ ...f, initialStock: e.target.value }))} style={formInput} />
            <div style={fieldHint}>Inventory records will be auto-created for all 3 regions with this starting quantity</div>
          </div>

          <button type="submit" style={submitting ? disabledBtn : submitBtn} disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Variant + Inventory →'}
          </button>
        </form>
      </div>

      {/* Schema guide */}
      <div style={sectionCard}>
        <div style={sectionTitle}>How Data Flows</div>
        <div style={sectionSub}>Each variant you create auto-creates inventory records</div>
        <div style={flowDiagram}>
          <FlowStep icon="📦" title="Product" desc='e.g. "iPhone 16 Pro Max"' color="#6366f1" />
          <div style={flowArrow}>↓</div>
          <FlowStep icon="🔧" title="Product Variant" desc='e.g. SKU: APPLE-IP16PM-256-BLK, Price: $1,299' color="#3b82f6" />
          <div style={flowArrow}>↓ (auto-created for each region)</div>
          <FlowStep icon="🏭" title="Inventory Records" desc='Region 1: 10 units, Region 2: 10 units, Region 3: 10 units' color="#10b981" />
          <div style={flowArrow}>↓ (when customer adds to cart)</div>
          <FlowStep icon="🛒" title="Cart → Order" desc="Saga pipeline: inventory decremented, SQL ORDERS created" color="#f59e0b" />
        </div>

        <div style={tipBox}>
          <strong>💡 Tip:</strong> To add multiple colors/sizes of the same product, create the product once, then add a separate variant for each (BLACK, WHITE, 128GB, 256GB, etc.)
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAB: ADD INVENTORY (manual adjustment for existing variants)
// ============================================================
function InventoryTab() {
  const [form, setForm] = useState({ variantId: '', storeId: 'STORE-MAIN', regionId: '1', quantityChange: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [variants, setVariants] = useState([]);

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 5000); };

  useEffect(() => {
    fetch('/api/admin/variants').then(r => r.json()).then(d => setVariants(d.variants || []));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch('/api/merchant/inventory', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, regionId: parseInt(form.regionId), quantityChange: parseInt(form.quantityChange), operatorId: 1 })
    });
    const data = await res.json();
    if (res.ok) { showToast(`✓ Stock updated! New balance: ${data.newQuantity} units`); }
    else { showToast(data.error, 'error'); }
    setSubmitting(false);
  };

  return (
    <div style={twoColGrid}>
      {toast && <Toast msg={toast.msg} type={toast.type} full />}

      <div style={sectionCard}>
        <div style={sectionTitle}>Set Inventory Quantity</div>
        <div style={sectionSub}>Directly sets or adjusts stock for a specific variant + region combination</div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGroup}>
            <label style={formLabel}>Product Variant *</label>
            <select value={form.variantId} onChange={e => setForm(f => ({ ...f, variantId: e.target.value }))} style={formInput} required>
              <option value="">— Select a Variant —</option>
              {variants.map(v => <option key={v._id} value={v._id}>{v.sku} (${v.price} {v.currency})</option>)}
            </select>
          </div>

          <div style={formGroup}>
            <label style={formLabel}>Region</label>
            <select value={form.regionId} onChange={e => setForm(f => ({ ...f, regionId: e.target.value }))} style={formInput}>
              {REGIONS.map(r => <option key={r.id} value={r.id}>Region {r.id} — {r.name}</option>)}
            </select>
          </div>

          <FormField label="Store ID" placeholder="STORE-MAIN" value={form.storeId} onChange={v => setForm(f => ({ ...f, storeId: v }))} />

          <div style={formGroup}>
            <label style={formLabel}>Quantity to ADD</label>
            <input type="number" placeholder="e.g. 50" value={form.quantityChange} onChange={e => setForm(f => ({ ...f, quantityChange: e.target.value }))} style={formInput} required />
            <div style={fieldHint}>Enter a positive number to add stock. Use the Inventory Terminal to reduce stock.</div>
          </div>

          <FormField label="Reason" placeholder="e.g. Initial stock loading, Q2 shipment arrival" value={form.reason} onChange={v => setForm(f => ({ ...f, reason: v }))} />

          <button type="submit" style={submitting ? disabledBtn : submitBtn} disabled={submitting}>
            {submitting ? 'Updating...' : 'Add Stock →'}
          </button>
        </form>
      </div>

      <div style={sectionCard}>
        <div style={sectionTitle}>Quick Data Guide</div>
        <div style={sectionSub}>Recommended data entry order</div>
        <div style={stepList}>
          {[
            ['1', 'Fix User Regions', 'Go to User Regions tab → assign region to every user. This fixes the tax calculation error.', '#ef4444'],
            ['2', 'Add Products', 'Add product entries (name, brand, category). Each product is a parent for variants.', '#6366f1'],
            ['3', 'Add Variants', 'For each product add variants with SKU, price, color/storage/size. Inventory auto-created.', '#3b82f6'],
            ['4', 'Check Inventory', 'Use this tab to add more stock if needed, or use the Inventory Terminal.', '#10b981'],
            ['5', 'Test Order', 'Go to the marketplace, add items to cart, and place an order. Tax will now calculate.', '#f59e0b'],
          ].map(([num, title, desc, color]) => (
            <div key={num} style={stepItem}>
              <div style={{ ...stepNum, backgroundColor: color }}>{num}</div>
              <div>
                <div style={stepTitle}>{title}</div>
                <div style={stepDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SHARED COMPONENTS
// ============================================================
function FormField({ label, placeholder, value, onChange, type = 'text', required, hint }) {
  return (
    <div style={formGroup}>
      <label style={formLabel}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} style={formInput} required={required} step={type === 'number' ? 'any' : undefined} min={type === 'number' ? '0' : undefined} />
      {hint && <div style={fieldHint}>{hint}</div>}
    </div>
  );
}

function FlowStep({ icon, title, desc, color }) {
  return (
    <div style={{ ...flowStep, borderColor: color + '40', backgroundColor: color + '08' }}>
      <span style={{ fontSize: '20px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '13px', fontWeight: '800', color }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{desc}</div>
      </div>
    </div>
  );
}

function Loader() {
  return <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><div style={spinnerStyle} /></div>;
}

function Toast({ msg, type, full }) {
  return (
    <div style={{
      ...toastStyle,
      position: full ? 'relative' : 'fixed',
      backgroundColor: type === 'error' ? '#fef2f2' : '#f0fdf4',
      borderColor: type === 'error' ? '#fecaca' : '#bbf7d0',
      color: type === 'error' ? '#dc2626' : '#15803d',
      marginBottom: full ? '16px' : 0,
    }}>
      {type === 'error' ? '⚠ ' : '✓ '}{msg}
    </div>
  );
}

// ============================================================
//  STYLES
// ============================================================
const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' };
const titleStyle = { margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' };
const subtitleStyle = { margin: '6px 0 0', color: '#64748b', fontSize: '14px', maxWidth: '600px' };
const alertBanner = { backgroundColor: '#fef9c3', border: '1px solid #fde047', color: '#854d0e', padding: '12px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: '600', maxWidth: '380px', lineHeight: '1.5' };

const tabBar = { display: 'flex', gap: '8px', marginBottom: '24px', backgroundColor: 'white', padding: '6px', borderRadius: '16px', border: '1px solid #e2e8f0', overflowX: 'auto' };
const tabBtn = { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 20px', background: 'none', border: 'none', borderRadius: '12px', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' };
const activeTabBtn = { ...tabBtn, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', fontWeight: '700', boxShadow: '0 4px 12px rgba(15,23,42,0.2)' };
const tabBadge = { fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '10px', letterSpacing: '0.3px' };

const sectionCard = { backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' };
const sectionHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' };
const sectionTitle = { fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' };
const sectionSub = { fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: '1.5' };

const regionRefBox = { display: 'flex', gap: '12px', marginBottom: '20px' };
const regionRefCard = { flex: 1, backgroundColor: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', textAlign: 'center' };
const regionRefId = { fontSize: '22px', fontWeight: '900', color: '#0f172a' };
const regionRefName = { fontSize: '12px', fontWeight: '700', color: '#475569', marginTop: '4px' };
const regionRefDetail = { fontSize: '11px', color: '#94a3b8', marginTop: '4px' };

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHead = { backgroundColor: '#0f172a' };
const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', whiteSpace: 'nowrap' };
const tdStyle = { padding: '14px 16px', fontSize: '13px', color: '#1e293b', borderBottom: '1px solid #f8fafc', verticalAlign: 'middle' };
const trEven = { backgroundColor: 'white' };
const trOdd = { backgroundColor: '#fafbfc' };
const idTag = { fontFamily: 'monospace', fontWeight: '800', color: '#6366f1' };
const userName = { fontWeight: '700', color: '#0f172a' };
const typeBadge = (t) => ({ fontSize: '11px', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', backgroundColor: t === 'Admin' ? '#fef2f2' : t === 'Manager' ? '#ede9fe' : '#f0fdf4', color: t === 'Admin' ? '#dc2626' : t === 'Manager' ? '#7c3aed' : '#15803d' });
const okRegion = { color: '#15803d', fontWeight: '700', fontSize: '12px' };
const noRegion = { color: '#dc2626', fontWeight: '800', fontSize: '12px', animation: 'pulse 1.5s ease-in-out infinite' };
const taxTag = { backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '3px 8px', borderRadius: '8px', fontWeight: '800', fontSize: '12px' };
const noTaxTag = { color: '#dc2626', fontWeight: '800', fontSize: '16px' };
const regionBtnRow = { display: 'flex', gap: '6px' };
const regionAssignBtn = { padding: '6px 10px', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s' };
const refreshBtn = { padding: '8px 16px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: '#475569' };

const twoColGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'flex-start' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '16px' };
const formGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const formLabel = { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' };
const formInput = { padding: '11px 14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', backgroundColor: '#f8fafc' };
const fieldHint = { fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' };
const submitBtn = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #4f46e5 0%, #0f172a 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 6px 15px rgba(79,70,229,0.3)', marginTop: '8px' };
const disabledBtn = { ...submitBtn, background: '#cbd5e1', cursor: 'not-allowed', boxShadow: 'none' };
const imgPreview = { width: '100%', maxHeight: '120px', objectFit: 'contain', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '8px' };

const listScroll = { maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' };
const listItem = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0', cursor: 'pointer', transition: 'all 0.15s' };
const listItemName = { fontWeight: '800', color: '#0f172a', fontSize: '14px' };
const listItemSub = { fontSize: '12px', color: '#64748b', marginTop: '2px' };
const listItemId = { fontFamily: 'monospace', fontSize: '10px', color: '#94a3b8', marginTop: '4px' };
const emptyMsg = { textAlign: 'center', color: '#94a3b8', padding: '32px', fontWeight: '600', fontSize: '14px' };

const specSection = { backgroundColor: '#f8fafc', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0' };
const specLabel = { fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' };
const twoFieldRow = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' };
const threeFieldRow = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' };

const flowDiagram = { display: 'flex', flexDirection: 'column', gap: '4px', margin: '0 0 20px' };
const flowStep = { display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: '1px solid' };
const flowArrow = { textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontWeight: '700', padding: '4px 0' };
const tipBox = { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '14px', fontSize: '13px', color: '#15803d', lineHeight: '1.5' };

const stepList = { display: 'flex', flexDirection: 'column', gap: '14px' };
const stepItem = { display: 'flex', gap: '14px', alignItems: 'flex-start' };
const stepNum = { width: '28px', height: '28px', borderRadius: '50%', color: 'white', fontWeight: '900', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const stepTitle = { fontSize: '14px', fontWeight: '800', color: '#0f172a' };
const stepDesc = { fontSize: '12px', color: '#64748b', marginTop: '3px', lineHeight: '1.5' };

const spinnerStyle = { width: '32px', height: '32px', border: '3px solid #f1f5f9', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const toastStyle = { padding: '14px 20px', borderRadius: '12px', border: '1px solid', fontSize: '14px', fontWeight: '700', lineHeight: '1.5' };
const code = { fontFamily: 'monospace', fontSize: '11px', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', color: '#475569' };
