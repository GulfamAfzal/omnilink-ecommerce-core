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
            <h2 style={titleStyle}>Create Account</h2>
            <p style={subtitleStyle}>Join the global network for synchronized management.</p>
          </div>

          <form onSubmit={handleRegister} style={formStyle}>
            <div style={{display:'flex', gap:'12px'}}>
                <div style={{...group, flex:1}}>
                    <label style={labelS}>Username</label>
                    <input placeholder="e.g. g_afzal31" style={inputS} onChange={e => handleChange('username', e.target.value)} required />
                </div>
                <div style={{...group, flex:1}}>
                    <label style={labelS}>Business Email</label>
                    <input type="email" placeholder="name@company.com" style={inputS} onChange={e => handleChange('email', e.target.value)} required />
                </div>
            </div>

            <div style={{display:'flex', gap:'12px'}}>
                <div style={{...group, flex:1}}>
                    <label style={labelS}>First Name</label>
                    <input placeholder="First Name" style={inputS} onChange={e => handleChange('firstName', e.target.value)} required />
                </div>
                <div style={{...group, flex:1}}>
                    <label style={labelS}>Last Name</label>
                    <input placeholder="Last Name" style={inputS} onChange={e => handleChange('lastName', e.target.value)} required />
                </div>
            </div>

            <div style={group}>
              <label style={labelS}>Account Password</label>
              <input type="password" placeholder="••••••••" style={inputS} onChange={e => handleChange('password', e.target.value)} required />
            </div>

            <div style={{display:'flex', gap:'12px'}}>
                <div style={{...group, flex:1}}>
                    <label style={labelS}>Designation</label>
                    <select style={selectS} value={formData.userType} onChange={e => handleChange('userType', e.target.value)}>
                        <option value="Customer">Client (Standard)</option>
                        <option value="Manager">Regional Manager</option>
                        <option value="Admin">System Administrator</option>
                    </select>
                </div>
                <div style={{...group, flex:1}}>
                    <label style={labelS}>Operating Hub</label>
                    <select style={selectS} value={formData.regionId} onChange={e => handleChange('regionId', e.target.value)}>
                        {/* Corrected IDs based on our Azure DML insertion */}
                        <option value="2">South Asia Hub</option>
                        <option value="1">North America Hub</option>
                        <option value="3">European Hub</option>
                    </select>
                </div>
            </div>

            <button type="submit" disabled={loading} style={loading ? disabledBtn : submitBtn}>
              {loading ? 'PROVISIONING...' : 'INITIALIZE IDENTITY'}
            </button>
          </form>

          {error && <div style={errorBox}>⚠️ {error}</div>}
          <div style={footerArea}>
            <p style={footerText}>Already have an account? <a href="/login" style={linkAction}>Sign In</a></p>
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
  display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle = { 
  backgroundColor: 'white', 
  borderRadius: '20px', 
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', 
  width: '100%', 
  maxWidth: '520px', 
  overflow: 'hidden', 
  border: '1px solid #e2e8f0' 
};

const accentBar = { 
  height: '6px', 
  background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)', 
  width: '100%' 
};

const contentPadding = { padding: '45px 40px' };

// LOGO & HEADER STYLES (Matched to Login)
const headerArea = { textAlign: 'center', marginBottom: '30px' };
const logoWrapper = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px' };
const logoImage = { height: '35px', width: 'auto' };
const logoTextStyle = { fontSize: '18px', letterSpacing: '1px', color: '#0f172a', margin: '0', fontWeight: '900' };

const titleStyle = { fontSize: '26px', color: '#0f172a', margin: '0', fontWeight: '800' };
const subtitleStyle = { color: '#64748b', fontSize: '14px', marginTop: '10px' };

const formStyle = { display: 'flex', flexDirection: 'column', gap: '18px' };
const group = { display: 'flex', flexDirection: 'column', gap: '8px' };
const labelS = { fontSize: '11px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.8px' };

const inputS = { 
  padding: '14px 16px', 
  borderRadius: '10px', 
  border: '1px solid #e2e8f0', 
  fontSize: '15px', 
  outline: 'none', 
  backgroundColor: '#fcfcfc', 
  width: '100%' 
};

const selectS = { 
  ...inputS, 
  cursor: 'pointer', 
  appearance: 'none', 
  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, 
  backgroundRepeat: 'no-repeat', 
  backgroundPosition: 'right 1rem center', 
  backgroundSize: '1em' 
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

const footerArea = { textAlign: 'center', marginTop: '30px' };
const footerText = { fontSize: '14px', color: '#64748b' };
const linkAction = { color: '#6366f1', fontWeight: '700', textDecoration: 'none' };