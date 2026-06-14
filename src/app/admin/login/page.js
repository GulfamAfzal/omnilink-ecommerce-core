'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Shield, ArrowRight, Server, Database, Globe } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/auth/login', {
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
          setError("Access denied. This portal is restricted to system administrators only.");
        }
      } else {
        setError(data.error || "Authentication failed. Please check your credentials.");
      }
    } catch {
      setError("Unable to reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageWrap}>

      {/* ── RIGHT PANEL: Info / Branding (60%) ── */}
      <div style={rightPanel}>
        <div style={rightInner}>
          {/* Logo */}
          <div style={brandRow}>
            <div style={brandIconWrap}>
              <Shield size={22} color="#06B6D4" strokeWidth={2} />
            </div>
            <span style={brandName}>OMS <span style={{ color: '#06B6D4' }}>OMNILINK</span></span>
          </div>

          <h1 style={rightTitle}>Enterprise Operations<br />Command Center</h1>

          {/* Quick spec bullets */}
          <div style={specList}>
            {[
              { dot: '#06B6D4', text: 'Azure SQL — Financial core, orders & tax ledgers' },
              { dot: '#10B981', text: 'MongoDB Atlas — Product catalog, 12 collections' },
              { dot: '#F59E0B', text: '3 Global hubs: South Asia · North America · Europe' },
              { dot: '#8B5CF6', text: 'Role-based access: Admin vs Manager boundaries' },
              { dot: '#06B6D4', text: 'Full CRUD: Orders, Inventory, Users, Analytics' },
            ].map(({ dot, text }) => (
              <div key={text} style={specItem}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: dot, flexShrink: 0, marginTop: '2px' }}></span>
                <span style={specText}>{text}</span>
              </div>
            ))}
          </div>

          {/* Infrastructure Nodes */}
          <div style={infraGrid}>
            <div style={infraCard}>
              <Database size={18} color="#06B6D4" strokeWidth={1.5} />
              <div>
                <div style={infraLabel}>Azure SQL</div>
                <div style={infraSub}>OMS_Financial_Core</div>
              </div>
              <span style={infoBadge}>Live</span>
            </div>
            <div style={infraCard}>
              <Server size={18} color="#10B981" strokeWidth={1.5} />
              <div>
                <div style={infraLabel}>MongoDB Atlas</div>
                <div style={infraSub}>OMS_Product_Catalog</div>
              </div>
              <span style={{ ...infoBadge, color: '#10B981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── LEFT PANEL: Login Form (40%) ── */}
      <div style={leftPanel}>
        <div style={formCard}>
          <div style={formHeader}>
            <div style={lockIcon}>
              <Shield size={20} color="#06B6D4" strokeWidth={2} />
            </div>
            <h2 style={formTitle}>Secure Admin Portal</h2>
            <p style={formSub}>Restricted — authorized personnel only</p>
          </div>

          <form onSubmit={handleLogin} style={formBody}>

            {/* Email */}
            <div style={fieldGroup}>
              <label style={fieldLabel}>Administrator Email</label>
              <div style={inputWrap}>
                <Mail size={15} color="#4B5563" style={inputIcon} strokeWidth={2} />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@omnilink.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputField}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div style={fieldGroup}>
              <label style={fieldLabel}>Password</label>
              <div style={inputWrap}>
                <Lock size={15} color="#4B5563" style={inputIcon} strokeWidth={2} />
                <input
                  id="admin-password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={{ ...inputField, paddingRight: '2.5rem' }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={eyeBtn}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass
                    ? <EyeOff size={15} color="#6B7280" strokeWidth={2} />
                    : <Eye    size={15} color="#6B7280" strokeWidth={2} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={errorBox} role="alert">
                <Shield size={14} color="#EF4444" strokeWidth={2} />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="admin-login-btn"
              type="submit"
              disabled={loading}
              style={loading ? { ...submitBtn, opacity: 0.6, cursor: 'not-allowed' } : submitBtn}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  Verifying Credentials…
                </>
              ) : (
                <>
                  Authorize Access
                  <ArrowRight size={15} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div style={backLink}>
            <a href="/login" style={{ color: '#6B7280', fontSize: '0.8125rem', textDecoration: 'none' }}>
              Return to Client Portal
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────── */
const pageWrap = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#EBF2F7',
  fontFamily: 'var(--font-sans, Inter, system-ui, sans-serif)',
};

/* Right panel — 60% */
const rightPanel = {
  flex: '0 0 60%',
  backgroundColor: '#EBF2F7',
  backgroundImage:
    'radial-gradient(circle at 25% 30%, rgba(37,99,235,0.06) 0%, transparent 50%),' +
    'radial-gradient(circle at 75% 70%, rgba(37,99,235,0.04) 0%, transparent 50%)',
  borderRight: '1px solid #B0C4DE',
  display: 'flex',
  alignItems: 'center',
  padding: '4rem 3rem',
};
const rightInner  = { maxWidth: '620px' };
const brandRow    = { display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '2.5rem' };
const brandIconWrap = {
  width: '36px', height: '36px',
  backgroundColor: 'rgba(37,99,235,0.1)',
  border: '1px solid rgba(37,99,235,0.2)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
const brandName   = { fontSize: '1.125rem', fontWeight: '800', color: '#0F172A' };
const rightTitle  = {
  fontSize: '1.75rem',
  fontWeight: '800',
  color: '#0F172A',
  lineHeight: '1.25',
  marginBottom: '1rem',
};
const rightSub    = { fontSize: '0.875rem', color: '#334155', lineHeight: '1.7', marginBottom: '2rem', maxWidth: '480px' };

const infraGrid   = { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '2rem' };
const infraCard   = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  backgroundColor: '#D9E6F0',
  border: '1px solid #B0C4DE',
  borderRadius: '10px',
  padding: '0.75rem 1rem',
};
const infraLabel  = { fontSize: '0.8125rem', fontWeight: '700', color: '#0F172A' };
const infraSub    = { fontSize: '0.75rem', color: '#64748B', marginTop: '1px' };
const infoBadge   = {
  marginLeft: 'auto', flexShrink: 0,
  fontSize: '0.7rem', fontWeight: '800',
  color: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)',
  border: '1px solid rgba(37,99,235,0.2)',
  padding: '0.15rem 0.5rem', borderRadius: '10px',
};

const paramBox    = {
  backgroundColor: '#D9E6F0',
  border: '1px solid #B0C4DE',
  borderRadius: '12px',
  padding: '1.25rem',
};
const paramTitle  = { fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.875rem' };
const paramRow    = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #B0C4DE' };
const paramKey    = { fontSize: '0.8125rem', fontWeight: '700', color: '#0F172A' };
const paramVal    = { fontSize: '0.75rem', color: '#334155' };

/* Left panel — 40% */
const leftPanel   = {
  flex: '0 0 40%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '3rem 2.5rem',
  backgroundColor: '#D0E1FD',
};
const formCard    = {
  width: '100%',
  maxWidth: '420px',
  backgroundColor: '#EBF2F7',
  border: '1px solid #B0C4DE',
  borderRadius: '20px',
  padding: '2.75rem',
  boxShadow: '0 12px 40px rgba(0,0,0,0.06)',
};

/* Spec bullet list */
const specList = { display: 'flex', flexDirection: 'column', gap: '10px', margin: '1.5rem 0 2rem' };
const specItem = { display: 'flex', alignItems: 'flex-start', gap: '10px' };
const specText = { fontSize: '0.875rem', color: '#334155', lineHeight: '1.5' };
const formHeader  = { textAlign: 'center', marginBottom: '2rem' };
const lockIcon    = {
  width: '48px', height: '48px',
  backgroundColor: 'rgba(37,99,235,0.1)',
  border: '1px solid rgba(37,99,235,0.2)',
  borderRadius: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  margin: '0 auto 1rem',
};
const formTitle   = { fontSize: '1.25rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.25rem' };
const formSub     = { fontSize: '0.8125rem', color: '#64748B' };

const formBody    = { display: 'flex', flexDirection: 'column', gap: '1.25rem' };
const fieldGroup  = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const fieldLabel  = { fontSize: '0.75rem', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' };

const inputWrap   = { position: 'relative', display: 'flex', alignItems: 'center' };
const inputIcon   = { position: 'absolute', left: '0.75rem', pointerEvents: 'none' };
const inputField  = {
  width: '100%',
  padding: '0.625rem 0.875rem 0.625rem 2.25rem',
  backgroundColor: '#D9E6F0',
  border: '1px solid #B0C4DE',
  borderRadius: '6px',
  color: '#0F172A',
  fontSize: '0.875rem',
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const eyeBtn = {
  position: 'absolute', right: '0.75rem',
  background: 'none', border: 'none',
  cursor: 'pointer', display: 'flex', alignItems: 'center',
  padding: '0',
};
const errorBox = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.5rem',
  padding: '0.75rem',
  backgroundColor: '#fff1f2',
  border: '1px solid #fecdd3',
  borderRadius: '6px',
  color: '#be123c',
  fontSize: '0.8125rem',
  fontWeight: '600',
  lineHeight: '1.5',
};
const submitBtn   = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1rem',
  background: 'linear-gradient(to right, #2563EB, #1D4ED8)',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontWeight: '700',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'opacity 0.2s',
  marginTop: '0.25rem',
};
const backLink    = { textAlign: 'center', marginTop: '1.5rem' };
