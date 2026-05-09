'use client';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from 'react';
import Link from 'next/link';

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0); // Add cart state

  useEffect(() => {
    const checkUser = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
      else setUser(null);
    };
    checkUser();
    window.addEventListener('storage', checkUser);
    return () => window.removeEventListener('storage', checkUser);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body style={bodyStyle}>
        <header style={headerStyle}>
          <div style={navContainer}>
            <Link href="/" style={logoLinkStyle}>
              <img src="/logo.png" alt="Logo" style={logoImageStyle} />
              <div style={logoTextStyle}><span style={{color: '#6366f1'}}>OMS</span> OMNILINK</div>
            </Link>

            <nav style={navLinks}>
              <Link href="/" style={linkItem}>Marketplace</Link>
              <Link href="/" style={linkItem}>Solutions</Link>
              {user?.userType === 'Admin' && <Link href="/admin/orders" style={opsConsole}>Operations Console</Link>}
            </nav>

            <div style={sessionArea}>
              {/* --- ADD TO CART ICON --- */}
              <div style={cartWrapper}>
                 <span style={cartIcon}>🛒</span>
                 <span style={cartBadge}>{cartCount}</span>
              </div>

              {user ? (
                <div style={userControl}>
                  <div style={hubBadge}>
                    <span style={onlineDot}></span>
                    {user.regionId === '1' ? 'South Asia' : 'Global Hub'}
                  </div>
                  <span style={userName}>{user.firstName}</span>
                  <button onClick={handleLogout} style={logoutBtn}>Sign Out</button>
                </div>
              ) : (
                <div style={authButtons}>
                  <Link href="/login" style={linkItem}>Login</Link>
                  <Link href="/register" style={registerBtn}>Get Started</Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <main style={mainContent}>{children}</main>

        <footer style={footerStyle}>
          <div style={footerContainer}>
            <div style={footerGrid}>
              <div style={footerCol}>
                <h4 style={footerHead}>OMS OMNILINK</h4>
                <p style={footerDesc}>Next-generation global order management.</p>
              </div>
              <div style={footerCol}>
                <h4 style={footerHead}>Platform</h4>
                <Link href="/" style={footerLink}>Infrastructure</Link>
                <Link href="/" style={footerLink}>Security</Link>
              </div>
            </div>
            <div style={bottomBar}>
              <p>© 2026 OMS OMNILINK Systems Inc.</p>
              <p>Status: <span style={{color: '#10b981'}}>Operational</span></p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}

// --- UPDATED STYLES ---
const bodyStyle = { margin: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#fdfdfd', color: '#1e293b' };
const headerStyle = { backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '10px 0', position: 'sticky', top: 0, zIndex: 1000 };
const navContainer = { maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' };
const logoLinkStyle = { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' };
const logoImageStyle = { height: '30px', width: 'auto' };
const logoTextStyle = { fontSize: '18px', fontWeight: '900', color: '#0f172a' };
const navLinks = { display: 'flex', gap: '25px', marginLeft: '30px', flex: 1 };
const linkItem = { color: '#475569', textDecoration: 'none', fontSize: '13px', fontWeight: '600' };
const opsConsole = { ...linkItem, color: '#6366f1', backgroundColor: '#f5f3ff', padding: '5px 10px', borderRadius: '6px' };
const sessionArea = { display: 'flex', alignItems: 'center', gap: '20px' };
const cartWrapper = { position: 'relative', cursor: 'pointer', fontSize: '20px' };
const cartBadge = { position: 'absolute', top: '-5px', right: '-8px', backgroundColor: '#6366f1', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold' };
const cartIcon = { opacity: 0.8 };
const userControl = { display: 'flex', alignItems: 'center', gap: '15px' };
const userName = { fontSize: '13px', fontWeight: '700', color: '#0f172a' };
const hubBadge = { backgroundColor: '#f1f5f9', padding: '4px 10px', borderRadius: '15px', fontSize: '10px', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' };
const onlineDot = { height: '6px', width: '6px', backgroundColor: '#10b981', borderRadius: '50%' };
const logoutBtn = { background: 'none', border: '1px solid #e2e8f0', color: '#64748b', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' };
const authButtons = { display: 'flex', gap: '15px', alignItems: 'center' };
const registerBtn = { backgroundColor: '#0f172a', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', fontWeight: '700' };
const mainContent = { flex: 1 };
const footerStyle = { backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '40px 0 20px 0' };
const footerContainer = { maxWidth: '1400px', margin: '0 auto', padding: '0 24px' };
const footerGrid = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px', marginBottom: '30px' };
const footerCol = { display: 'flex', flexDirection: 'column', gap: '10px' };
const footerHead = { fontSize: '13px', fontWeight: '800', color: '#0f172a', textTransform: 'uppercase' };
const footerDesc = { fontSize: '13px', color: '#64748b', maxWidth: '300px' };
const footerLink = { color: '#64748b', textDecoration: 'none', fontSize: '13px' };
const bottomBar = { borderTop: '1px solid #e2e8f0', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8' };