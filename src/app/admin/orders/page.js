'use client';
import { useEffect, useState } from 'react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(res => res.json())
      .then(data => {
        setOrders(data);
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
            <p style={subtitleStyle}>Real-time synchronization: <span style={badgeStyle}>Oracle ACID Core</span></p>
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
            <div style={{...cardValueStyle, color: '#38a169'}}>Active</div>
          </div>
        </section>

        {/* Modern Data Table */}
        <section style={tableWrapperStyle}>
          {loading ? (
            <div style={loaderStyle}>Synchronizing with Oracle Relational Nodes...</div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderRowStyle}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Transaction Amount</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order.id} style={index % 2 === 0 ? trEvenStyle : trOddStyle}>
                    <td style={tdStyle}><strong>#{order.id}</strong></td>
                    <td style={tdStyle}>{order.customer}</td>
                    <td style={{...tdStyle, color: '#2c5282', fontWeight: 'bold'}}>${order.amount}</td>
                    <td style={tdStyle}>
                      <span style={statusBadgeStyle}>{order.status}</span>
                    </td>
                    <td style={tdStyle}>{order.date}</td>
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
  backgroundColor: '#f7fafc',
  fontFamily: '"Inter", "Segoe UI", sans-serif',
};

const sidebarStyle = {
  width: '260px',
  backgroundColor: '#2d3748',
  color: 'white',
  padding: '30px 20px',
};

const logoStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  marginBottom: '40px',
  color: '#63b3ed',
  letterSpacing: '1px'
};

const navStyle = { display: 'flex', flexDirection: 'column', gap: '10px' };
const navItemStyle = { padding: '12px', borderRadius: '8px', cursor: 'pointer', color: '#a0aec0' };
const navItemActiveStyle = { ...navItemStyle, backgroundColor: '#4a5568', color: 'white' };

const mainContentStyle = { flex: 1, padding: '40px' };

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px'
};

const titleStyle = { margin: 0, fontSize: '28px', color: '#1a202c' };
const subtitleStyle = { margin: '5px 0 0', color: '#718096' };
const badgeStyle = { fontWeight: 'bold', color: '#4a5568' };

const refreshButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#3182ce',
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
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
};

const cardLabelStyle = { color: '#718096', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' };
const cardValueStyle = { fontSize: '24px', fontWeight: 'bold', marginTop: '10px', color: '#2d3748' };

const tableWrapperStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
};

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const tableHeaderRowStyle = { backgroundColor: '#edf2f7', borderBottom: '2px solid #e2e8f0' };
const thStyle = { padding: '15px', textAlign: 'left', color: '#4a5568', fontSize: '13px', fontWeight: '600' };
const tdStyle = { padding: '15px', fontSize: '14px', color: '#2d3748' };
const trEvenStyle = { backgroundColor: '#ffffff' };
const trOddStyle = { backgroundColor: '#fcfcfc' };

const statusBadgeStyle = {
  backgroundColor: '#c6f6d5',
  color: '#22543d',
  padding: '4px 10px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 'bold'
};

const loaderStyle = { padding: '40px', textAlign: 'center', color: '#718096', fontStyle: 'italic' };