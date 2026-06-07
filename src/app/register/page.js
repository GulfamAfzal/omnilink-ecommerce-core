'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    contact: '',
    userType: 'Customer',
    regionId: '2' // Default to South Asia Hub for Namal environment
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // This path remains the same. 
      // The logic inside /api/auth/register will now point to Azure SQL.
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Account Initialized. Proceeding to Login.");
        router.push('/login');
      } else {
        setError(data.error || "Provisioning failed.");
      }
    } catch (err) {
      setError("Network connection to the synchronization server failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

            <form onSubmit={handleRegister} style={formStyle}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...group, flex: 1 }}>
                  <label style={labelS}>Username</label>
                  <input placeholder="j_smith007" style={inputS} onChange={e => handleChange('username', e.target.value)} required />
                </div>
                <div style={{ ...group, flex: 1 }}>
                  <label style={labelS}>Email</label>
                  <input type="email" placeholder="name@company.com" style={inputS} onChange={e => handleChange('email', e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ ...group, flex: 1 }}>
                  <label style={labelS}>First Name</label>
                  <input placeholder="First Name" style={inputS} onChange={e => handleChange('firstName', e.target.value)} required />
                </div>
                <div style={{ ...group, flex: 1 }}>
                  <label style={labelS}>Last Name</label>
                  <input placeholder="Last Name" style={inputS} onChange={e => handleChange('lastName', e.target.value)} required />
                </div>
              </div>

              <div style={group}>
                <label style={labelS}>Password</label>
                <input type="password" placeholder="••••••••••" style={inputS} onChange={e => handleChange('password', e.target.value)} required />
              </div>

              <button type="submit" disabled={loading} style={loading ? disabledBtn : submitBtn}>
                {loading ? 'Provisioning...' : 'Sign up'}
              </button>
            </form>

            {error && <div style={errorBox}>⚠️ {error}</div>}
            
            <div style={divider}>
              <span style={dividerText}>or</span>
            </div>

            <div style={footerArea}>
              <p style={footerText}>Already have an account? <a href="/login" style={linkAction}>Sign in</a></p>
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
                <span style={dot}></span>
                <span style={dotActive}></span>
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
  backgroundColor: '#f1f5f9', // Soft outer background
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'center', 
  padding: '40px 20px', 
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle = { 
  backgroundColor: 'white', 
  borderRadius: '24px', 
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', 
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
  backgroundColor: 'white'
};

const formContainer = {
  width: '100%',
  maxWidth: '420px' // Slightly wider for double inputs
};

const headerArea = { textAlign: 'center', marginBottom: '40px' };
const logoWrapper = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' };
const logoImage = { height: '28px', width: 'auto' };
const logoTextStyle = { fontSize: '22px', letterSpacing: '0.5px', color: '#0f172a', margin: '0', fontWeight: '800' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '20px' };
const group = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelS = { fontSize: '13px', fontWeight: '600', color: '#64748b' };

const inputS = { 
  padding: '12px 16px', 
  borderRadius: '8px', 
  border: '1px solid #e2e8f0', 
  fontSize: '14px', 
  outline: 'none', 
  backgroundColor: '#ffffff',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box'
};

const submitBtn = { 
  marginTop: '10px', 
  padding: '14px', 
  backgroundColor: '#1e293b', 
  color: 'white', 
  border: 'none', 
  borderRadius: '8px', 
  cursor: 'pointer', 
  fontWeight: '600', 
  fontSize: '15px',
  transition: 'background-color 0.2s',
  width: '100%'
};

const disabledBtn = { ...submitBtn, backgroundColor: '#94a3b8', cursor: 'not-allowed' };

const divider = { display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '30px 0', position: 'relative' };
const dividerText = { backgroundColor: 'white', padding: '0 15px', color: '#94a3b8', fontSize: '13px', zIndex: 1 };

const errorBox = { 
  textAlign: 'center', marginTop: '20px', color: '#be123c', fontSize: '13px', fontWeight: '600', backgroundColor: '#fff1f2', padding: '12px', borderRadius: '8px' 
};

const footerArea = { textAlign: 'center', marginTop: '10px' };
const footerText = { fontSize: '13px', color: '#64748b' };
const linkAction = { color: '#10b981', fontWeight: '600', textDecoration: 'none' };

// GRAPHIC SIDE (RIGHT)
const graphicSideStyle = {
  width: '50%',
  backgroundColor: '#e0e7ff', // Soft indigo matching system colors
  padding: '60px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  textAlign: 'center'
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

const circleDecor = { width: '80px', height: '80px', borderRadius: '50%', border: '4px solid #6366f1', position: 'absolute', top: '20px', left: '20px', opacity: 0.5 };
const squareDecor = { width: '60px', height: '60px', borderRadius: '12px', backgroundColor: '#10b981', position: 'absolute', bottom: '30px', right: '40px', opacity: 0.5 };

const graphicTitle = { fontSize: '28px', fontWeight: '800', color: '#1e293b', margin: '0 0 16px 0' };
const graphicSub = { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 30px 0' };

const dotsContainer = { display: 'flex', gap: '8px' };
const dotActive = { width: '24px', height: '8px', borderRadius: '4px', backgroundColor: '#6366f1' };
const dot = { width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#cbd5e1' };