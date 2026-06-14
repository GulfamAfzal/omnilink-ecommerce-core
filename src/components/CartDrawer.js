'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { resolveImageUrl, handleImageError } from '@/lib/imageUtils';

export default function CartDrawer({ isOpen, onClose }) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/cart')
        .then(res => {
          if (res.status === 401) { setCartItems([]); setLoading(false); return null; }
          return res.json();
        })
        .then(data => {
          if (data) setCartItems(data.items || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  const handleRemove = async (variantId) => {
    await fetch('/api/cart', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variant_id: variantId })
    });
    setCartItems(prev => prev.filter(i => i.variant_id !== variantId));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const subtotal = cartItems.reduce((sum, i) => sum + (i.price || 0) * (i.quantity || 1), 0);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          ...backdropStyle,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'all' : 'none',
        }}
      />

      {/* Drawer Panel */}
      <div style={{
        ...drawerStyle,
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}>
        {/* Header */}
        <div style={drawerHeader}>
          <div>
            <div style={drawerTitle}>Shopping Cart</div>
            <div style={drawerSub}>{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</div>
          </div>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>

        {/* Content */}
        <div style={drawerBody}>
          {loading ? (
            <div style={centerMsg}>
              <div style={miniSpinner} />
              <span style={{ marginTop: '12px', color: '#64748b', fontSize: '13px' }}>Loading cart...</span>
            </div>
          ) : cartItems.length === 0 ? (
            <div style={emptyState}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛒</div>
              <div style={emptyTitle}>Cart is empty</div>
              <div style={emptySub}>Add items from the marketplace to get started.</div>
              <button onClick={onClose} style={browseCatalogBtn}>Browse Catalog</button>
            </div>
          ) : (
            <div style={itemsList}>
              {cartItems.map((item, idx) => (
                <div key={idx} style={cartItemRow}>
                  <div style={itemImageBox}>
                    <img
                      src={resolveImageUrl(item.image_url)}
                      alt={item.sku}
                      style={itemImg}
                      onError={handleImageError}
                    />
                  </div>
                  <div style={itemDetails}>
                    <div style={itemSku}>{item.sku || 'Product'}</div>
                    <div style={itemVariant}>Variant: {item.variant_id?.substring(0, 10)}...</div>
                    <div style={itemPriceRow}>
                      <span style={itemQty}>× {item.quantity}</span>
                      <span style={itemPrice}>
                        {(item.price * item.quantity).toLocaleString(undefined, {
                          style: 'currency',
                          currency: item.currency || 'USD'
                        })}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(item.variant_id)}
                    style={removeBtn}
                    title="Remove item"
                  >
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div style={drawerFooter}>
            <div style={subtotalRow}>
              <span style={subtotalLabel}>Subtotal</span>
              <span style={subtotalAmount}>
                {subtotal.toLocaleString(undefined, { style: 'currency', currency: cartItems[0]?.currency || 'USD' })}
              </span>
            </div>
            <div style={taxNote}>Taxes & shipping calculated at checkout</div>
            <Link
              href="/checkout"
              onClick={onClose}
              style={checkoutBtn}
            >
              Proceed to Checkout →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

const backdropStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.5)',
  backdropFilter: 'blur(4px)',
  zIndex: 1100,
  transition: 'opacity 0.3s ease',
};

const drawerStyle = {
  position: 'fixed', top: 0, right: 0, bottom: 0,
  width: '420px',
  backgroundColor: 'white',
  zIndex: 1200,
  display: 'flex', flexDirection: 'column',
  boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.2)',
  transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  fontFamily: 'system-ui, -apple-system, sans-serif',
};

const drawerHeader = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  padding: '28px 24px 20px',
  borderBottom: '1px solid #f1f5f9',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
};

const drawerTitle = { fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' };
const drawerSub = { fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: '600' };
const closeBtn = {
  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white',
  width: '32px', height: '32px', borderRadius: '8px',
  cursor: 'pointer', fontSize: '14px', fontWeight: '700',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.2s',
};

const drawerBody = { flex: 1, overflowY: 'auto', padding: '16px' };

const centerMsg = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' };
const miniSpinner = { width: '28px', height: '28px', border: '3px solid #f1f5f9', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' };

const emptyState = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px', textAlign: 'center' };
const emptyTitle = { fontSize: '18px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' };
const emptySub = { fontSize: '14px', color: '#64748b', lineHeight: '1.5', marginBottom: '24px' };
const browseCatalogBtn = { padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' };

const itemsList = { display: 'flex', flexDirection: 'column', gap: '12px' };
const cartItemRow = { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#f8fafc', borderRadius: '16px', padding: '14px', border: '1px solid #f1f5f9' };
const itemImageBox = { width: '60px', height: '60px', backgroundColor: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid #e2e8f0' };
const itemImg = { width: '44px', height: '44px', objectFit: 'contain' };
const itemDetails = { flex: 1, minWidth: 0 };
const itemSku = { fontSize: '14px', fontWeight: '700', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const itemVariant = { fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' };
const itemPriceRow = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' };
const itemQty = { fontSize: '12px', color: '#64748b', fontWeight: '600', backgroundColor: '#e2e8f0', padding: '2px 8px', borderRadius: '6px' };
const itemPrice = { fontSize: '14px', fontWeight: '800', color: '#0f172a' };
const removeBtn = { background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '4px', borderRadius: '8px', transition: 'background 0.2s', flexShrink: 0 };

const drawerFooter = {
  padding: '20px 24px',
  borderTop: '2px solid #f1f5f9',
  background: 'white',
};
const subtotalRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' };
const subtotalLabel = { fontSize: '14px', color: '#64748b', fontWeight: '600' };
const subtotalAmount = { fontSize: '22px', fontWeight: '900', color: '#0f172a' };
const taxNote = { fontSize: '11px', color: '#94a3b8', marginBottom: '16px' };
const checkoutBtn = {
  display: 'block', width: '100%', padding: '16px', textAlign: 'center',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  color: 'white', borderRadius: '14px', fontWeight: '800', fontSize: '15px',
  textDecoration: 'none', boxShadow: '0 8px 20px -5px rgba(15,23,42,0.3)',
  transition: 'transform 0.2s, box-shadow 0.2s',
};
