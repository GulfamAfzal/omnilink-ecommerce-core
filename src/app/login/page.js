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
        
        {/* --- LEFT SIDE: The Auth Form (50%) --- */}
        <div style={formSideStyle}>
          <div style={formContainer}>
            
            <div style={headerArea}>
              <div style={logoWrapper}>
                  <img src="/logo.png" alt="Logo" style={logoImage} />
                  <h1 style={logoTextStyle}>
                      <span style={{color: '#6366f1'}}>OMS</span> OMNILINK
                  </h1>
              </div>
            </div>

            <form onSubmit={handleLogin} style={formStyle}>
              <div style={group}>
                <label style={labelS}>Corporate Email</label>
                <input 
                  type="email" 
                  placeholder="johnsmith@company.com" 
                  style={inputS} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>

              <div style={group}>
                <label style={labelS}>Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••••" 
                  style={inputS} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <div style={{ textAlign: 'right', marginTop: '4px' }}>
                  <a href="#" style={forgotLink}>Forgot password?</a>
                </div>
              </div>

              <button type="submit" disabled={loading} style={loading ? disabledBtn : submitBtn}>
                {loading ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>

            {error && <div style={errorBox}>⚠️ {error}</div>}
            
            <div style={divider}>
              <span style={dividerText}>or</span>
            </div>

            <div style={footerArea}>
              <p style={footerText}>Are you new? <a href="/register" style={linkAction}>Create an Account</a></p>
            </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Graphic/Content (50%) --- */}
        <div style={graphicSideStyle}>
          <div style={graphicContent}>
             <div style={illustrationBox}>
                {/* Minimal CSS Illustration placeholder matching the system colors */}
                <div style={circleDecor}></div>
                <div style={squareDecor}></div>
             </div>
             <h2 style={graphicTitle}>Operations Mastery Hub</h2>
             <p style={graphicSub}>Unleash Your Global Success with OMS Omnilink's Enterprise Management Platform</p>
             <div style={dotsContainer}>
                <span style={dotActive}></span>
                <span style={dot}></span>
                <span style={dot}></span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// --- SHARED UI DESIGN SYSTEM ---
const pageWrapper = { 
  minHeight: '100vh', 
  backgroundColor: 'transparent', // The global body gradient handles the main background
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  padding: '40px 20px', 
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle = { 
  backgroundColor: '#D9E6F0', // Refined light pastel-sky blue
  border: '1px solid #B0C4DE', // Cerulean blue border
  borderRadius: '24px', 
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)', 
  width: '100%', 
  maxWidth: '1100px', 
  display: 'flex',
  flexDirection: 'row',
  overflow: 'hidden', 
  minHeight: '600px'
};

// FORM SIDE (LEFT)
const formSideStyle = {
  width: '50%',
  padding: '60px 40px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  backgroundColor: '#D9E6F0'
};

const formContainer = {
  width: '100%',
  maxWidth: '380px'
};

const headerArea = { textAlign: 'center', marginBottom: '40px' };
const logoWrapper = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const logoImage = { height: '28px', width: 'auto' };
const logoTextStyle = { fontSize: '22px', letterSpacing: '0.5px', color: '#0F172A', margin: '0', fontWeight: '800' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const group = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelS = { fontSize: '13px', fontWeight: '700', color: '#0F172A' };

const inputS = { 
  padding: '12px 16px', 
  borderRadius: '8px', 
  border: '1px solid #B0C4DE', 
  fontSize: '14px', 
  outline: 'none', 
  backgroundColor: '#EBF2F7',
  color: '#0F172A',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box'
};

const forgotLink = { fontSize: '12px', color: '#2563EB', textDecoration: 'none', fontWeight: '600' };

const submitBtn = { 
  marginTop: '10px', 
  padding: '14px', 
  background: 'linear-gradient(to right, #2563EB, #1D4ED8)', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontWeight: '700', 
  fontSize: '15px',
  transition: 'background-color 0.2s, opacity 0.2s',
  width: '100%'
};

const disabledBtn = { ...submitBtn, background: '#94A3B8', cursor: 'not-allowed' };

const divider = { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px 0', position: 'relative' };
const dividerText = { backgroundColor: '#D9E6F0', padding: '0 15px', color: '#64748B', fontSize: '13px', zIndex: 1 };

const errorBox = { 
  textAlign: 'center', marginTop: '20px', color: '#be123c', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff1f2', padding: '12px', borderRadius: '8px', border: '1px solid #fecdd3'
};

const footerArea = { textAlign: 'center', marginTop: '10px' };
const footerText = { fontSize: '13px', color: '#334155' };
const linkAction = { color: '#2563EB', fontWeight: '700', textDecoration: 'none' };

// GRAPHIC SIDE (RIGHT)
const graphicSideStyle = {
  width: '50%',
  backgroundColor: '#D0E1FD', // Architectural light steel blue
  padding: '60px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center',
  borderLeft: '1px solid #B0C4DE'
};

const graphicContent = {
  maxWidth: '400px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const illustrationBox = {
  width: '250px',
  height: '250px',
  backgroundColor: 'rgba(255,255,255,0.5)',
  borderRadius: '50%',
  marginBottom: '40px',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
};

const circleDecor = { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #2563EB', position: 'absolute', top: '20px', left: '20px', opacity: 0.5 };
const squareDecor = { width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#1D4ED8', position: 'absolute', bottom: '30px', right: '40px', opacity: 0.5 };

const graphicTitle = { fontSize: '28px', fontWeight: '800', color: '#0F172A', margin: '0 0 16px 0' };
const graphicSub = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 30px 0' };

const dotsContainer = { display: 'flex', gap: '8px' };
const dotActive = { width: '24px', height: '8px', borderRadius: '4px', backgroundColor: '#2563EB' };
const dot = { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#B0C4DE' };