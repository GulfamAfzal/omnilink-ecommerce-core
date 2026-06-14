'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, User, Globe, LogOut, Shield, ShoppingBag } from 'lucide-react';
import CartDrawer from './CartDrawer';

export default function ClientHeader() {
  const [user, setUser]           = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const checkUser = () => {
      const saved = localStorage.getItem('user');
      setUser(saved ? JSON.parse(saved) : null);
    };
    const syncCart = () => {
      fetch('/api/cart')
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data?.items) setCartCount(data.items.reduce((s, i) => s + (i.quantity || 1), 0));
        })
        .catch(() => {});
    };
    const onScroll = () => setScrolled(window.scrollY > 8);

    checkUser();
    syncCart();
    window.addEventListener('storage', checkUser);
    window.addEventListener('cartUpdated', syncCart);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('cartUpdated', syncCart);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const regionLabel = (id) => ({ '1': 'South Asia', '2': 'North America', '3': 'Europe' }[id] || 'Global Hub');

  const headerStyle = {
    backgroundColor: scrolled ? 'rgba(17, 24, 39, 0.97)' : '#1E293B', // Midnight charcoal accent
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid #334155',
    padding: '0.875rem 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: scrolled ? '0 4px 24px rgba(0,0,0,0.4)' : 'none',
  };

  return (
    <>
      <header style={headerStyle}>
        <div style={navContainer}>

          {/* Logo */}
          <Link href="/" style={logoLink}>
            <ShoppingBag size={24} color="#38BDF8" strokeWidth={2} />
            <span style={logoBrand}>
              <span style={{ color: '#38BDF8' }}>OMNILINK</span>
              {' '}Core
            </span>
          </Link>

          {/* Nav Links */}
          <nav style={navLinks}>
            <Link href="/about" style={navItem}>About</Link>
            <Link href="/contact" style={navItem}>Contact</Link>
            <Link href="/help" style={navItem}>Help</Link>
            {user?.userType === 'Admin' && (
              <Link href="/admin/orders" style={opsLink}>
                <Shield size={13} strokeWidth={2.5} />
                Operations Console
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div style={actionsArea}>
            {/* Cart Button */}
            <button
              id="cart-icon-btn"
              style={cartBtn}
              onClick={() => setDrawerOpen(true)}
              aria-label="View Cart"
            >
              <ShoppingCart size={18} strokeWidth={2} />
              {cartCount > 0 && (
                <span style={cartBadge}>{cartCount}</span>
              )}
            </button>

            {user ? (
              <div style={userRow}>
                <div style={regionPill}>
                  <Globe size={12} color="#38BDF8" strokeWidth={2} />
                  {regionLabel(user.regionId)}
                </div>
                <Link href="/profile" style={userBtn}>
                  <User size={13} strokeWidth={2} />
                  {user.firstName}
                </Link>
                <button onClick={handleLogout} style={logoutBtn} aria-label="Sign out">
                  <LogOut size={14} strokeWidth={2} />
                  Sign Out
                </button>
              </div>
            ) : (
              <div style={authRow}>
                <Link href="/admin/login" style={adminLink}>
                  <Shield size={13} strokeWidth={2} />
                  Admin
                </Link>
                <Link href="/login" style={loginLink}>Login</Link>
                <Link href="/register" style={registerBtn}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <CartDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const navContainer = {
  maxWidth: '1440px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  padding: '0 2rem',
  gap: '2rem',
};

const logoLink = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
  textDecoration: 'none',
  flexShrink: 0,
};
const logoIcon = {
  width: '30px', height: '30px',
  backgroundColor: 'rgba(56,189,248,0.1)',
  border: '1px solid rgba(56,189,248,0.2)',
  borderRadius: '8px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const logoBrand = {
  fontSize: '1rem',
  fontWeight: '800',
  color: '#F9FAFB',
  letterSpacing: '-0.3px',
};

const navLinks = {
  display: 'flex',
  gap: '0.25rem',
  flex: 1,
  marginLeft: '1rem',
};
const navItem = {
  color: '#9CA3AF',
  textDecoration: 'none',
  fontSize: '0.875rem',
  fontWeight: '600',
  padding: '0.375rem 0.75rem',
  borderRadius: '6px',
  transition: 'color 0.2s, background-color 0.2s',
};
const opsLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  color: '#38BDF8',
  backgroundColor: 'rgba(56,189,248,0.08)',
  border: '1px solid rgba(56,189,248,0.15)',
  textDecoration: 'none',
  fontSize: '0.8125rem',
  fontWeight: '700',
  padding: '0.375rem 0.75rem',
  borderRadius: '6px',
};

const actionsArea = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  marginLeft: 'auto',
};

const cartBtn = {
  position: 'relative',
  background: 'rgba(31,41,55,0.8)',
  border: '1px solid #1F2937',
  color: '#9CA3AF',
  padding: '0.5rem',
  borderRadius: '8px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'border-color 0.2s, color 0.2s',
};
const cartBadge = {
  position: 'absolute',
  top: '-6px', right: '-6px',
  backgroundColor: '#38BDF8',
  color: '#0F172A',
  fontSize: '0.65rem',
  fontWeight: '800',
  padding: '1px 5px',
  borderRadius: '10px',
  minWidth: '18px',
  textAlign: 'center',
};

const userRow  = { display: 'flex', alignItems: 'center', gap: '0.5rem' };
const authRow  = { display: 'flex', alignItems: 'center', gap: '0.5rem' };

const regionPill = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.75rem',
  fontWeight: '700',
  color: '#9CA3AF',
  backgroundColor: '#1F2937',
  border: '1px solid #374151',
  padding: '0.3rem 0.6rem',
  borderRadius: '20px',
};
const userBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.8125rem',
  fontWeight: '700',
  color: '#F9FAFB',
  textDecoration: 'none',
  backgroundColor: '#334155',
  border: '1px solid #475569',
  padding: '0.375rem 0.75rem',
  borderRadius: '6px',
  transition: 'border-color 0.2s',
};
const logoutBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.8125rem',
  fontWeight: '600',
  color: '#6B7280',
  backgroundColor: 'transparent',
  border: '1px solid #1F2937',
  padding: '0.375rem 0.625rem',
  borderRadius: '6px',
  cursor: 'pointer',
  transition: 'color 0.2s, border-color 0.2s',
};
const adminLink = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.3rem',
  fontSize: '0.8125rem',
  fontWeight: '700',
  color: '#EF4444',
  backgroundColor: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.2)',
  padding: '0.375rem 0.625rem',
  borderRadius: '6px',
  textDecoration: 'none',
};
const loginLink = {
  fontSize: '0.875rem',
  fontWeight: '600',
  color: '#9CA3AF',
  textDecoration: 'none',
  padding: '0.375rem 0.625rem',
  borderRadius: '6px',
  border: '1px solid #1F2937',
  transition: 'color 0.2s',
};
const registerBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '0.875rem',
  fontWeight: '700',
  color: '#fff',
  background: 'linear-gradient(to right, #2563EB, #1D4ED8)',
  padding: '0.5rem 1rem',
  borderRadius: '6px',
  textDecoration: 'none',
  transition: 'opacity 0.2s',
};
