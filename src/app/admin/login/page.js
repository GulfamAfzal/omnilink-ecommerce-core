'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
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
        if (data.user.userType === 'Admin') {
          localStorage.setItem('user', JSON.stringify(data.user));
          router.push('/admin/orders');
        } else {
          setError("Access Denied: Insufficient clearance level.");
        }
      } else {
        setError(data.error || "Authentication failed.");
      }
    } catch (err) {
      setError("Server connection lost.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <div style={accentBar}></div>
        
        <div style={contentPadding}>
          <div style={headerArea}>
            <div style={logoWrapper}>
                <span style={{ fontSize: '32px' }}>🛡️</span>
            </div>
            <h2 style={titleStyle}>System Administration</h2>
            <p style={subtitleStyle}>Restricted Area: Authorized personnel only.</p>
          </div>

          <form onSubmit={handleLogin} style={formStyle}>
            <div style={group}>
              <label style={labelS}>Admin Email</label>
              <input 
                type="email" 
                placeholder="gulfamadmin@gmail.com" 
                style={inputS} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>

            <div style={group}>
              <label style={labelS}>Admin Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                style={inputS} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>

            <button type="submit" disabled={loading} style={loading ? disabledBtn : submitBtn}>
              {loading ? 'VERIFYING CREDENTIALS...' : 'AUTHORIZE ACCESS'}
            </button>
          </form>

          {error && <div style={errorBox}>⚠️ {error}</div>}
          
          <div style={footerArea}>
            <p style={footerText}>Return to <a href="/login" style={linkAction}>Client Portal</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- HIGH SECURITY CRIMSON DESIGN SYSTEM ---
const pageWrapper = { 
  minHeight: '100vh', 
  backgroundColor: '#0f172a', // Deep navy background for admin
  backgroundImage: 'radial-gradient(#be123c22 1px, transparent 1px)', 
  backgroundSize: '24px 24px',
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  padding: '40px 20px', 
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle = { 
  backgroundColor: '#1e293b', // Darker card
  borderRadius: '16px', 
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', 
  width: '100%', 
  maxWidth: '450px', 
  overflow: 'hidden', 
  border: '1px solid #334155' 
};

const accentBar = { 
  height: '6px', 
  background: 'linear-gradient(90deg, #be123c 0%, #f43f5e 100%)', // Crimson accent
  width: '100%' 
};

const contentPadding = { padding: '50px 40px' };

const headerArea = { textAlign: 'center', marginBottom: '35px' };
const logoWrapper = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px' };
const titleStyle = { fontSize: '24px', color: '#f8fafc', margin: '0', fontWeight: '800' };
const subtitleStyle = { color: '#94a3b8', fontSize: '14px', marginTop: '10px' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '22px' };
const group = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelS = { fontSize: '11px', fontWeight: '700', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.8px' };

const inputS = { 
  padding: '14px 16px', 
  borderRadius: '8px', 
  border: '1px solid #475569', 
  fontSize: '15px', 
  outline: 'none', 
  backgroundColor: '#0f172a',
  color: 'white',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box'
};

const submitBtn = { 
  marginTop: '10px', 
  padding: '16px', 
  backgroundColor: '#be123c', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontWeight: '700', 
  fontSize: '15px',
  transition: 'background-color 0.2s'
};

const disabledBtn = { ...submitBtn, backgroundColor: '#475569', cursor: 'not-allowed' };
const errorBox = { 
  textAlign: 'center', 
  marginTop: '20px', 
  color: '#fca5a5', 
  fontSize: '13px', 
  fontWeight: '600', 
  backgroundColor: 'rgba(153, 27, 27, 0.2)', 
  border: '1px solid #991b1b',
  padding: '12px', 
  borderRadius: '8px' 
};

const footerArea = { textAlign: 'center', marginTop: '35px' };
const footerText = { fontSize: '14px', color: '#64748b' };
const linkAction = { color: '#f43f5e', fontWeight: '700', textDecoration: 'none' };
