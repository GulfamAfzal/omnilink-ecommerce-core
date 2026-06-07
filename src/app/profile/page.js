'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile');
        const data = await res.json();
        
        if (res.ok) {
          setProfile(data.profile);
        } else {
          setError(data.error || 'Failed to load profile');
          if (res.status === 401) {
             // Redirect to login if unauthorized
             router.push('/login');
          }
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [router]);

  if (loading) {
    return <div style={centerStyle}><div style={spinner}></div> Loading Identity...</div>;
  }

  if (error && !profile) {
    return <div style={centerStyle}><div style={errorBox}>⚠️ {error}</div></div>;
  }

  return (
    <div style={pageWrapper}>
      <div style={cardStyle}>
        <div style={accentBar}></div>
        
        <div style={contentPadding}>
          <div style={headerArea}>
            <h1 style={titleStyle}>User Profile</h1>
            <p style={subtitleStyle}>Verified Identity & Permissions from Azure SQL Core</p>
          </div>

          <div style={profileGrid}>
            <div style={profileGroup}>
              <span style={labelS}>Full Name</span>
              <div style={valueS}>{profile.first_name} {profile.last_name}</div>
            </div>
            
            <div style={profileGroup}>
              <span style={labelS}>Username</span>
              <div style={valueS}>@{profile.username}</div>
            </div>
            
            <div style={profileGroup}>
              <span style={labelS}>Email Address</span>
              <div style={valueS}>{profile.email}</div>
            </div>
            
            <div style={profileGroup}>
              <span style={labelS}>Contact Number</span>
              <div style={valueS}>{profile.contact_number || 'N/A'}</div>
            </div>

            <div style={profileGroup}>
              <span style={labelS}>Security Role</span>
              <div style={valueBadgeS(profile.user_type === 'Admin' ? '#be123c' : '#6366f1')}>
                {profile.role_name || profile.user_type}
              </div>
            </div>

            <div style={profileGroup}>
              <span style={labelS}>System Permissions</span>
              <div style={valueS}>{profile.permissions || 'Standard Access'}</div>
            </div>

            <div style={profileGroup}>
              <span style={labelS}>Operating Hub (Region)</span>
              <div style={valueBadgeS('#10b981')}>
                {profile.region_name || 'Global Hub'}
              </div>
            </div>

            <div style={profileGroup}>
              <span style={labelS}>Regional Currency</span>
              <div style={valueS}>{profile.currency || 'USD'}</div>
            </div>
          </div>
          
          <button onClick={() => router.push('/')} style={submitBtn}>
            RETURN TO MARKETPLACE
          </button>
        </div>
      </div>
    </div>
  );
}

// --- SHARED UI DESIGN SYSTEM ---
const centerStyle = { minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', color: '#64748b', fontSize: '18px', fontWeight: 'bold', gap: '15px' };
const spinner = { width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };

const pageWrapper = { 
  minHeight: '90vh', 
  background: '#f8fafc', 
  display: 'flex', 
  justifyContent: 'center', 
  alignItems: 'flex-start', 
  padding: '60px 20px', 
  fontFamily: 'system-ui, -apple-system, sans-serif'
};

const cardStyle = { 
  backgroundColor: 'white', 
  borderRadius: '20px', 
  boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.1)', 
  width: '100%', 
  maxWidth: '600px', 
  overflow: 'hidden', 
  border: '1px solid #e2e8f0' 
};

const accentBar = { 
  height: '6px', 
  background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)', 
  width: '100%' 
};

const contentPadding = { padding: '40px' };

const headerArea = { marginBottom: '35px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' };
const titleStyle = { fontSize: '28px', color: '#0f172a', margin: '0', fontWeight: '800' };
const subtitleStyle = { color: '#64748b', fontSize: '14px', marginTop: '8px' };

const profileGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' };
const profileGroup = { display: 'flex', flexDirection: 'column', gap: '6px' };
const labelS = { fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.8px' };
const valueS = { fontSize: '16px', fontWeight: '600', color: '#0f172a' };
const valueBadgeS = (color) => ({ display: 'inline-block', backgroundColor: color + '15', color: color, padding: '4px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', width: 'fit-content' });

const submitBtn = { 
  width: '100%',
  padding: '16px', 
  backgroundColor: '#f1f5f9', 
  color: '#0f172a', 
  border: 'none', 
  borderRadius: '12px', 
  cursor: 'pointer', 
  fontWeight: '700', 
  fontSize: '14px',
  transition: 'background-color 0.2s'
};

const errorBox = { 
  color: '#be123c', 
  fontSize: '14px', 
  fontWeight: '600', 
  backgroundColor: '#fff1f2', 
  padding: '16px 24px', 
  borderRadius: '10px' 
};
