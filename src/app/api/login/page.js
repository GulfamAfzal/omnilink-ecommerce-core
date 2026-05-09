'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    if (res.ok) {
      // Simulation of session storage
      localStorage.setItem('user', JSON.stringify(data.user));
      alert(`Welcome back, ${data.user.firstName}!`);
      router.push('/'); // Send to home or catalog
    } else {
      alert(data.error);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={formCardStyle}>
        <h2 style={{ color: '#2d3748' }}>System Login</h2>
        <p style={{ color: '#718096', fontSize: '14px' }}>Verify Identity against <strong>Relational Ledger</strong></p>
        <form onSubmit={handleLogin} style={formStyle}>
          <input 
            type="email" 
            placeholder="Oracle Registered Email" 
            style={inputStyle} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            style={inputStyle} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" style={btnStyle}>AUTHENTICATE</button>
        </form>
        <p style={{ marginTop: '20px', fontSize: '14px' }}>
          New User? <a href="/register" style={{ color: '#3182ce' }}>Register Identity</a>
        </p>
      </div>
    </div>
  );
}

const containerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f7fafc' };
const formCardStyle = { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '400px', textAlign: 'center' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' };
const inputStyle = { padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' };
const btnStyle = { padding: '14px', backgroundColor: '#2d3748', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' };