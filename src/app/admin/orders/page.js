'use client';
import { useEffect, useState } from 'react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data || []);
        setLoading(false);
      });
  }, []);

  // Calculate quick stats for the UI
  const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
  const totalOrders = orders.length;

  return (
    <div style={containerStyle}>
      {/* Sidebar Simulation */}
      <aside style={sidebarStyle}>
        <div style={logoStyle}>OMS Admin</div>
        <nav style={navStyle}>
          <div style={navItemActiveStyle}>📦 Orders Log</div>
          <div style={navItemStyle}>📊 Analytics</div>
          <div style={navItemStyle}>👤 Users</div>
          <div style={navItemStyle}>⚙️ System Health</div>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Global Distributed Orders</h1>
            <p style={subtitleStyle}>Cross-Engine Aggregation: <span style={badgeStyle}>Azure SQL + MongoDB Atlas</span></p>
          </div>
          <button style={refreshButtonStyle} onClick={() => window.location.reload()}>Refresh Data</button>
        </header>

        {/* Stats Cards */}
        <section style={statsGridStyle}>
          <div style={cardStyle}>
            <span style={cardLabelStyle}>Total Transactions</span>
            <div style={cardValueStyle}>{totalOrders}</div>
          </div>
          <div style={cardStyle}>
            <span style={cardLabelStyle}>Total Revenue</span>
            <div style={cardValueStyle}>${totalRevenue.toLocaleString()}</div>
          </div>
          <div style={cardStyle}>
            <span style={cardLabelStyle}>System Status</span>
            <div style={{...cardValueStyle, color: '#38a169'}}>Active & Synced</div>
          </div>
        </section>

        {/* Modern Data Table */}
        <section style={tableWrapperStyle}>
          {loading ? (
            <div style={loaderStyle}>Synchronizing with Distributed Engines...</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>Order ID</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Aggregated Items (NoSQL)</th>
                  <th style={thStyle}>Amount (SQL)</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id} style={index % 2 === 0 ? trEvenStyle : trOddStyle}>
                    <td style={tdStyle}><strong>#{order.id}</strong></td>
                    <td style={tdStyle}>{order.customer}</td>
                    <td style={tdStyle}>
                      <div style={itemsList}>
                        {order.items && order.items.map((item, i) => (
                          <div key={i} style={itemLine}>
                            <img src={item.image_url} alt={item.product_name} style={itemThumb} />
                            <div>
                              <div style={itemTitle}>{item.product_name}</div>
                              <div style={itemMeta}>Qty: {item.quantity} | {item.product_variant_id.substring(0,8)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{...tdStyle, color: '#2c5282', fontWeight: 'bold'}}>${order.amount}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle}>{order.status}</span>
                    </td>
                    <td style={tdStyle}>{new Date(order.date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

// --- ATTRACTIVE STYLES ---

const containerStyle = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#f8fafc',
  fontFamily: '"Inter", "Segoe UI", sans-serif',
};

const sidebarStyle = {
  width: '260px',
  backgroundColor: '#0f172a',
  color: 'white',
  padding: '30px 20px',
};

const logoStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '40px',
  color: '#818cf8',
  letterSpacing: '1px'
};

const navStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const navItemStyle = { padding: '12px', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8' };
const navItemActiveStyle = { ...navItemStyle, backgroundColor: '#1e293b', color: 'white' };

const mainContentStyle = { flex: 1, padding: '40px' };

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px'
};

const titleStyle = { margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: '900' };
const subtitleStyle = { margin: '5px 0 0', color: '#64748b' };
const badgeStyle = { fontWeight: 'bold', color: '#4a5568' };

const refreshButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#0f172a',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600'
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: '20px',
  marginBottom: '40px'
};

const cardStyle = {
  backgroundColor: 'white',
  padding: '24px',
  borderRadius: '16px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
};

const cardLabelStyle = { color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };
const cardValueStyle = { fontSize: '28px', fontWeight: '900', marginTop: '10px', color: '#0f172a' };

const tableWrapperStyle = {
  backgroundColor: 'white',
  borderRadius: '16px',
  overflow: 'hidden',
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.02)',
};

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeaderRowStyle = { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '16px 20px', textAlign: 'left', color: '#475569', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' };
const tdStyle = { padding: '20px', fontSize: '14px', color: '#1e293b', borderBottom: '1px solid #f1f5f9' };
const trEvenStyle = { backgroundColor: '#ffffff' };
const trOddStyle = { backgroundColor: '#fcfcfc' };

const statusBadgeStyle = {
  backgroundColor: '#dcfce7',
  color: '#166534',
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: '700'
};

const loaderStyle = { padding: '60px', textAlign: 'center', color: '#64748b', fontWeight: '600' };

const itemsList = { display: 'flex', flexDirection: 'column', gap: '8px' };
const itemLine = { display: 'flex', alignItems: 'center', gap: '12px' };
const itemThumb = { width: '40px', height: '40px', objectFit: 'contain', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '4px' };
const itemTitle = { fontSize: '13px', fontWeight: '700', color: '#0f172a' };
const itemMeta = { fontSize: '11px', color: '#64748b' };