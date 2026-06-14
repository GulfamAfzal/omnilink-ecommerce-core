'use client';
import { useState } from 'react';
import { Mail, Phone, Clock, MessageSquare, Hash, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', orderNo: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) { setError('Please fill in all required fields.'); return; }
    setError(null);
    setSubmitting(true);
    // Mock submission — replace with real API call when backend is ready
    await new Promise(r => setTimeout(r, 1200));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div style={{ minHeight: '100vh', padding: '48px 24px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span style={tagStyle}>Support</span>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#0F172A', margin: '14px 0 12px', letterSpacing: '-0.5px' }}>Contact Us</h1>
          <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.7', maxWidth: '480px', margin: '0 auto' }}>
            Have a question about your order or need assistance? Fill in the form below and our support team will respond within 24 hours.
          </p>
        </div>

        <div style={pageGrid}>

          {/* LEFT: Form */}
          <div style={card}>
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={successCircle}><CheckCircle2 color="white" size={32} strokeWidth={2.5} /></div>
                <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: '0 0 8px' }}>Message Sent!</h2>
                <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.65' }}>
                  Thanks for reaching out. Our support team will get back to you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <button onClick={() => { setForm({ name: '', email: '', orderNo: '', message: '' }); setSubmitted(false); }} style={btnReset}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '900', color: '#0F172A', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={18} color="#06B6D4" strokeWidth={2} /> Send a Message
                </h2>

                {error && (
                  <div style={errorBox}>
                    <AlertCircle size={15} strokeWidth={2} />
                    {error}
                  </div>
                )}

                <div style={fieldGrid}>
                  <div>
                    <label style={fieldLabel}><User size={11} strokeWidth={2.5} /> Full Name *</label>
                    <input type="text" value={form.name} onChange={update('name')} placeholder="Your name" style={inputStyle} required />
                  </div>
                  <div>
                    <label style={fieldLabel}><Mail size={11} strokeWidth={2.5} /> Email Address *</label>
                    <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" style={inputStyle} required />
                  </div>
                </div>

                <div>
                  <label style={fieldLabel}><Hash size={11} strokeWidth={2.5} /> Order Number (optional)</label>
                  <input type="text" value={form.orderNo} onChange={update('orderNo')} placeholder="e.g. 495821" style={inputStyle} />
                </div>

                <div>
                  <label style={fieldLabel}><MessageSquare size={11} strokeWidth={2.5} /> Message *</label>
                  <textarea
                    value={form.message}
                    onChange={update('message')}
                    placeholder="Describe your issue or question in detail..."
                    rows={5}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    required
                  />
                </div>

                <button type="submit" disabled={submitting} style={submitting ? btnDisabled : btnSubmit}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT: Info sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { icon: Mail,  color: '#2563EB', title: 'Email Support', lines: ['gulfamafzal84@gmail.com', 'reehabatool3536@gmail.com', 'All inquiries answered within 24 business hours.'] },
              { icon: Phone, color: '#10B981', title: 'Phone Support', lines: ['03454743847'] },
              { icon: Clock, color: '#F59E0B', title: 'Support Hours', lines: ['Monday through Friday (Mon-Fri)', '09:00 AM to 06:00 PM Pakistan Standard Time (PKT)'] },
            ].map(({ icon: Icon, color, title, lines }) => (
              <div key={title} style={infoCard}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{title}</div>
                  {lines.map(l => <div key={l} style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>{l}</div>)}
                </div>
              </div>
            ))}

            <div style={{ ...card, backgroundColor: '#D9E6F0', marginTop: '4px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>Common Order Issues</div>
              {['Track my shipment', 'Return or exchange an item', 'Update delivery address', 'Payment not processed'].map(item => (
                <div key={item} style={{ fontSize: '12px', color: '#334155', padding: '6px 0', borderBottom: '1px solid #B0C4DE', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#06B6D4', flexShrink: 0 }}></span>
                  {item}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ─── Styles ─── */
const pageGrid = { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '28px', alignItems: 'start' };
const card = { backgroundColor: '#FFFFFF', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', borderRadius: '20px', padding: '32px', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' };
const fieldGrid = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' };
const tagStyle = { display: 'inline-block', fontSize: '11px', fontWeight: '800', color: '#06B6D4', backgroundColor: 'rgba(6,182,212,0.1)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(6,182,212,0.2)', padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '1px' };
const fieldLabel = { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' };
const inputStyle = { width: '100%', padding: '12px 14px', backgroundColor: '#F4F8FA', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', borderRadius: '10px', fontSize: '13px', color: '#1E293B', boxSizing: 'border-box', outline: 'none' };
const btnSubmit  = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #06B6D4, #2563EB)', color: '#FFFFFF', borderRadius: '12px', border: 'none', fontWeight: '800', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(6,182,212,0.25)' };
const btnDisabled = { ...btnSubmit, background: '#E2E8F0', color: '#94A3B8', cursor: 'not-allowed', boxShadow: 'none' };
const btnReset = { marginTop: '24px', padding: '12px 24px', backgroundColor: '#EBF2F7', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', color: '#0F172A', borderRadius: '10px', fontWeight: '700', fontSize: '13px', cursor: 'pointer' };
const infoCard = { backgroundColor: '#FFFFFF', borderWidth: '1px', borderStyle: 'solid', borderColor: '#B0C4DE', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: '14px' };
const errorBox = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#FEF2F2', borderWidth: '1px', borderStyle: 'solid', borderColor: '#FECACA', color: '#DC2626', padding: '12px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600' };
const successCircle = { width: '64px', height: '64px', background: 'linear-gradient(135deg, #34D399, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)' };
