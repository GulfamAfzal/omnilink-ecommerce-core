'use client';
import { useState, use } from 'react';

export default function CheckoutPage({ params }) {
  // Unwrap the dynamic route ID (e.g., PROD_MBP14_M3_001)
  const resolvedParams = use(params);
  const variant_id = resolvedParams.id;

  // Local state for the simulation
  const [userId, setUserId] = useState('1');
  const [regionId, setRegionId] = useState('1');
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    setStatus({ type: 'info', message: 'Processing distributed transaction...' });

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variant_id,
          quantity: parseInt(quantity),
          user_id: parseInt(userId),
          region_id: parseInt(regionId),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ 
          type: 'success', 
          message: `Success! Order #${data.order_id} placed. Oracle Inventory updated.` 
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: data.details || data.error || 'Transaction Failed' 
        });
      }
    } catch (err) {
      setStatus({ type: 'error', message: 'Network error or Server is down' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Secure Checkout</h1>
      <p style={{ color: '#666' }}>System: <strong>Hybrid OMS (Oracle + MongoDB)</strong></p>
      
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h3 style={{ marginTop: '0' }}>Product ID: <span style={{ color: '#0070f3' }}>{variant_id}</span></h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Simulation User ID:</label>
          <input 
            type="number" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Quantity:</label>
          <input 
            type="number" 
            value={quantity} 
            onChange={(e) => setQuantity(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
        </div>

        <button 
          onClick={handlePurchase}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Executing ACID Transaction...' : 'CONFIRM PURCHASE'}
        </button>
      </div>

      {status && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid',
          backgroundColor: status.type === 'success' ? '#e6fffa' : '#fff5f5',
          borderColor: status.type === 'success' ? '#38a169' : '#e53e3e',
          color: status.type === 'success' ? '#2f855a' : '#c53030'
        }}>
          <strong>System Message:</strong> {status.message}
        </div>
      )}
    </div>
  );
}