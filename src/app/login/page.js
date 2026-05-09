'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.userType === 'Admin') {
          router.push('/admin/orders');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || "Authentication failed. Please verify credentials.");
      }
    } catch (err) {
      setError("Unable to connect to the authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <div style={accentBar}></div>
        
        <div style={contentPadding}>
          {/* --- BRANDING AREA WITH LOGO --- */}
          <div style={headerArea}>
            <div style={logoWrapper}>
                <img 
                    src="/logo.png" 
                    alt="OMS OMNILINK" 
                    style={logoImage} 
                />
                <h1 style={logoTextStyle}>
                    <span style={{color: '#6366f1'}}>OMS</span> OMNILINK
                </h1>
            </div>
            <h2 style={titleStyle}>Client Login</h2>
            <p style={subtitleStyle}>Access your global synchronized operations center.</p>
          </div>

          <form onSubmit={handleLogin} style={formStyle}>
            <div style={group}>
              <label style={labelS}>Corporate Email</label>
              <input 
                type="email" 
                placeholder="name@company.com" 
                style={inputS} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div style={group}>
              <label style={labelS}>Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                style={inputS} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" disabled={loading} style={loading ? disabledBtn : submitBtn}>
              {loading ? 'AUTHENTICATING...' : 'SIGN IN'}
            </button>
          </form>

          {error && <div style={errorBox}>⚠️ {error}</div>}
          
          <div style={footerArea}>
            <p style={footerText}>Need access to the network? <a href="/register" style={linkAction}>Create account</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SHARED UI DESIGN SYSTEM ---
const pageWrapper = { 
  minHeight: '90vh', 
  background: '#e0e7ff', 
  backgroundImage: 'radial-gradient(#6366f122 1px, transparent 1px)', 
  backgroundSize: '24px 24px',
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  padding: '40px 20px', 
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle = { 
  backgroundColor: 'white', 
  borderRadius: '20px', 
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
  width: '100%', 
  maxWidth: '450px', 
  overflow: 'hidden', 
  border: '1px solid #e2e8f0' 
};

const accentBar = { 
  height: '6px', 
  background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)', 
  width: '100%' 
};

const contentPadding = { padding: '50px 40px' };

// LOGO & HEADER STYLES
const headerArea = { textAlign: 'center', marginBottom: '35px' };
const logoWrapper = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px' };
const logoImage = { height: '35px', width: 'auto' };
const logoTextStyle = { fontSize: '18px', letterSpacing: '1px', color: '#0f172a', margin: '0', fontWeight: '900' };

const titleStyle = { fontSize: '26px', color: '#0f172a', margin: '0', fontWeight: '800' };
const subtitleStyle = { color: '#64748b', fontSize: '14px', marginTop: '10px' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '22px' };
const group = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelS = { fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' };

const inputS = { 
  padding: '14px 16px', 
  borderRadius: '10px', 
  border: '1px solid #e2e8f0', 
  fontSize: '15px', 
  outline: 'none', 
  backgroundColor: '#fcfcfc',
  transition: 'border-color 0.2s'
};

const submitBtn = { 
  marginTop: '10px', 
  padding: '16px', 
  backgroundColor: '#0f172a', 
  color: 'white', 
  border: 'none', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontWeight: '700', 
  fontSize: '15px' 
};

const disabledBtn = { ...submitBtn, backgroundColor: '#94a3b8', cursor: 'not-allowed' };
const errorBox = { 
  textAlign: 'center', 
  marginTop: '20px', 
  color: '#be123c', 
  fontSize: '13px', 
  fontWeight: '600', 
  backgroundColor: '#fff1f2', 
  padding: '12px', 
  borderRadius: '10px' 
};

const footerArea = { textAlign: 'center', marginTop: '35px' };
const footerText = { fontSize: '14px', color: '#64748b' };
const linkAction = { color: '#6366f1', fontWeight: '700', textDecoration: 'none' };