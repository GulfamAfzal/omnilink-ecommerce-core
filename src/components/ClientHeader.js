'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import CartDrawer from './CartDrawer';

export default function ClientHeader() {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
      else setUser(null);
    };
    const syncCart = () => {
      // Sync count from server if logged in
      fetch('/api/cart')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.items) {
            setCartCount(data.items.reduce((sum, item) => sum + (item.quantity || 1), 0));
          }
        })
        .catch(() => {});
    };
    checkUser();
    syncCart();
    window.addEventListener('storage', checkUser);
    window.addEventListener('cartUpdated', syncCart);
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('cartUpdated', syncCart);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const regionLabel = (regionId) => {
    const map = { '1': 'South Asia', '2': 'North America', '3': 'Europe' };
    return map[regionId] || 'Global Hub';
  };

  return (
    <>
      <header style={headerStyle}>
        <div style={navContainer}>
          <Link href="/" style={logoLinkStyle}>
            <img src="/logo.png" alt="Logo" style={logoImageStyle} />
            <div style={logoTextStyle}><span style={{ color: '#6366f1' }}>OMS</span> OMNILINK</div>
          </Link>

          <nav style={navLinks}>
            <Link href="/" style={linkItem}>Marketplace</Link>
            {user?.userType === 'Admin' && (
              <Link href="/admin/orders" style={opsConsole}>Operations Console</Link>
            )}
          </nav>

          <div style={sessionArea}>
            {/* Cart Icon — opens slide-out drawer */}
            <div
              id="cart-icon-btn"
              style={cartWrapper}
              onClick={() => setDrawerOpen(true)}
              title="View Cart"
            >
              <span style={cartIcon}>🛒</span>
              {cartCount > 0 && (
                <span style={cartBadge}>{cartCount}</span>
              )}
            </div>

            {user ? (
              <div style={userControl}>
                <div style={hubBadge}>
                  <span style={onlineDot} />
                  {regionLabel(user.regionId)}
                </div>
                <Link href="/profile" style={{ ...userName, textDecoration: 'none' }}>{user.firstName}</Link>
                <button onClick={handleLogout} style={logoutBtn}>Sign Out</button>
              </div>
            ) : (
              <div style={authButtons}>
                <Link href="/admin/login" style={{ ...linkItem, color: '#be123c', marginRight: '10px' }}>Admin Login</Link>
                <Link href="/login" style={linkItem}>Login</Link>
                <Link href="/register" style={registerBtn}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

// --- STYLES ---
const headerStyle = {
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
  padding: '14px 0',
  position: 'sticky',
  top: 0,
  zIndex: 1000,
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
};
const navContainer = { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 32px' };
const logoLinkStyle = { display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' };
const logoImageStyle = { height: '34px', width: 'auto', filter: 'drop-shadow(0px 2px 4px rgba(99,102,241,0.3))' };
const logoTextStyle = { fontSize: '20px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.5px' };
const navLinks = { display: 'flex', gap: '32px', marginLeft: '40px', flex: 1 };
const linkItem = { color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: '600', transition: 'color 0.2s ease' };
const opsConsole = { ...linkItem, color: '#4f46e5', backgroundColor: '#e0e7ff', padding: '8px 16px', borderRadius: '8px', fontWeight: '700' };
const sessionArea = { display: 'flex', alignItems: 'center', gap: '24px' };

const cartWrapper = {
  position: 'relative', cursor: 'pointer', fontSize: '22px',
  transition: 'transform 0.2s ease',
  padding: '6px',
  borderRadius: '10px',
};
const cartBadge = {
  position: 'absolute', top: '-4px', right: '-8px',
  backgroundColor: '#ec4899', color: 'white',
  fontSize: '11px', padding: '2px 6px', borderRadius: '12px',
  fontWeight: 'bold', boxShadow: '0 2px 4px rgba(236, 72, 153, 0.3)',
  minWidth: '18px', textAlign: 'center',
};
const cartIcon = { opacity: 0.85 };

const userControl = { display: 'flex', alignItems: 'center', gap: '16px' };
const userName = { fontSize: '14px', fontWeight: '700', color: '#1e293b' };
const hubBadge = { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' };
const onlineDot = { height: '8px', width: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' };
const logoutBtn = { background: 'white', border: '1px solid #cbd5e1', color: '#475569', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' };
const authButtons = { display: 'flex', gap: '16px', alignItems: 'center' };
const registerBtn = { background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '700', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)' };
