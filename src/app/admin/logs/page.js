'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar, containerStyle, mainContentStyle } from '../orders/page';
import { FileText, AlertOctagon, AlertTriangle, CheckCircle, Inbox } from 'lucide-react';

const SEVERITY_CONFIG = {
  INFO:     { bg: '#eff6ff', color: '#1d4ed8', dot: '#3b82f6', label: 'INFO' },
  WARN:     { bg: '#fffbeb', color: '#92400e', dot: '#f59e0b', label: 'WARN' },
  CRITICAL: { bg: '#fef2f2', color: '#991b1b', dot: '#ef4444', label: 'CRITICAL' },
};

const STREAM_CONFIG = {
  'NoSQL_Inventory': { color: '#10b981', label: 'MongoDB Inventory' },
  'Auth_Session':    { color: '#6366f1', label: 'Auth Session' },
  'SYSTEM':          { color: '#f59e0b', label: 'System' },
};

export default function AdminLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ critical: 0, warn: 0, info: 0 });
  const [loading, setLoading] = useState(true);
  const [streamFilter, setStreamFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [expandedLog, setExpandedLog] = useState(null);

  const fetchLogs = (type = '') => {
    setLoading(true);
    fetch(`/api/admin/logs${type ? `?type=${type}` : ''}`)
      .then(res => res.json())
      .then(data => {
        setLogs(data.logs || []);
        setSummary(data.summary || { critical: 0, warn: 0, info: 0 });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user || user.userType !== 'Admin') { router.push('/admin/login'); return; }
    fetchLogs();
  }, [router]);

  const filtered = logs.filter(log => {
    const matchStream = streamFilter === 'all' || log.stream === streamFilter;
    const matchSev = severityFilter === 'all' || log.severity === severityFilter;
    return matchStream && matchSev;
  });

  return (
    <div style={containerStyle}>
      <AdminSidebar active="logs" />
      <main style={mainContentStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>System Audit Logs</h1>
            <p style={subtitleStyle}>Non-blocking dual-stream log aggregation — MongoDB Atlas log collections</p>
          </div>
          <button style={refreshBtn} onClick={() => fetchLogs()}>↻ Refresh</button>
        </header>

        {/* Summary Cards */}
        <div style={summaryGrid}>
          {[
            { label: 'Total Logs', value: logs.length, icon: <FileText size={24} color="#0284C7" />, color: '#0284C7', bg: '#E0F2FE' },
            { label: 'Critical', value: summary.critical, icon: <AlertOctagon size={24} color="#DC2626" />, color: '#DC2626', bg: '#FEF2F2' },
            { label: 'Warnings', value: summary.warn, icon: <AlertTriangle size={24} color="#B45309" />, color: '#B45309', bg: '#FEF3C7' },
            { label: 'Info', value: summary.info, icon: <CheckCircle size={24} color="#15803D" />, color: '#15803D', bg: '#DCFCE7' },
          ].map((s, i) => (
            <div key={i} style={{ ...summaryCard, backgroundColor: s.bg, borderColor: s.color + '40' }}>
              <div style={summaryIcon}>{s.icon}</div>
              <div>
                <div style={summaryLabel}>{s.label}</div>
                <div style={{ ...summaryValue, color: s.color }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* DB Stream Indicators */}
        <div style={dbStreamRow}>
          <div style={dbStream}>
            <div style={{ ...streamDot, backgroundColor: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)' }} />
            <span>MongoDB Inventory Logs</span>
            <span style={streamCount}>{logs.filter(l => l.stream === 'NoSQL_Inventory').length}</span>
          </div>
          <div style={dbStream}>
            <div style={{ ...streamDot, backgroundColor: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
            <span>Authentication Sessions</span>
            <span style={streamCount}>{logs.filter(l => l.stream === 'Auth_Session').length}</span>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={filterBar}>
          <select value={streamFilter} onChange={e => setStreamFilter(e.target.value)} style={filterSelect}>
            <option value="all">All Streams</option>
            <option value="NoSQL_Inventory">MongoDB Inventory</option>
            <option value="Auth_Session">Auth Sessions</option>
          </select>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={filterSelect}>
            <option value="all">All Severity</option>
            <option value="INFO">INFO</option>
            <option value="WARN">WARN</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <div style={filterCount}>{filtered.length} entries</div>
        </div>

        {/* Log Timeline */}
        <div style={logPanel}>
          {loading ? (
            <div style={loaderDiv}><div style={spinner} /><p style={{ color: '#64748b', marginTop: '12px', fontWeight: '600' }}>Reading log streams...</p></div>
          ) : filtered.length === 0 ? (
            <div style={loaderDiv}>
              <div style={{ marginBottom: '12px' }}><Inbox size={40} color="#94A3B8" /></div>
              <p style={{ fontWeight: '700', color: '#334155' }}>No log entries found</p>
              <p style={{ fontSize: '13px', color: '#64748B' }}>Logs appear here as operations are performed across the system.</p>
            </div>
          ) : (
            <div style={logList}>
              {filtered.map((log, idx) => {
                const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.INFO;
                const stream = STREAM_CONFIG[log.stream] || { color: '#94a3b8', label: log.stream };
                const isExpanded = expandedLog === log.id;
                return (
                  <div key={log.id || idx} style={{ ...logEntry, borderLeft: `3px solid ${sev.dot}` }} onClick={() => setExpandedLog(isExpanded ? null : log.id)}>
                    <div style={logEntryHeader}>
                      <div style={logLeft}>
                        <span style={{ ...sevBadge, backgroundColor: sev.bg, color: sev.color }}>{sev.label}</span>
                        <span style={{ ...streamBadge, color: stream.color, borderColor: stream.color + '40', backgroundColor: stream.color + '10' }}>{stream.label}</span>
                        <span style={logType}>{log.type}</span>
                      </div>
                      <div style={logRight}>
                        <span style={logTime}>{new Date(log.timestamp).toLocaleString()}</span>
                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div style={logMessage}>{log.message}</div>
                    {isExpanded && log.detail && (
                      <div style={logDetail}>
                        <pre style={detailPre}>{JSON.stringify(log.detail, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' };
const titleStyle = { margin: 0, fontSize: '28px', color: '#0f172a', fontWeight: '900', letterSpacing: '-0.5px' };
const subtitleStyle = { margin: '6px 0 0', color: '#64748b', fontSize: '14px' };
const refreshBtn = { padding: '10px 20px', backgroundColor: 'white', color: '#1e293b', border: '2px solid #e2e8f0', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px' };

const summaryGrid = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' };
const summaryCard = { backgroundColor: '#EBF2F7', padding: '20px', borderRadius: '16px', border: '1px solid #B0C4DE', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' };
const summaryIcon = { display: 'flex' };
const summaryLabel = { fontSize: '11px', fontWeight: '800', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.5px' };
const summaryValue = { fontSize: '26px', fontWeight: '900' };

const dbStreamRow = { display: 'flex', gap: '24px', marginBottom: '20px', padding: '16px 20px', backgroundColor: '#EBF2F7', borderRadius: '14px', border: '1px solid #B0C4DE' };
const dbStream = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '700', color: '#0F172A' };
const streamDot = { width: '10px', height: '10px', borderRadius: '50%', animation: 'pulse 2s ease-in-out infinite' };
const streamCount = { backgroundColor: '#D9E6F0', color: '#0F172A', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', marginLeft: '4px' };

const filterBar = { display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' };
const filterSelect = { padding: '10px 14px', borderRadius: '10px', border: '1px solid #B0C4DE', fontSize: '13px', backgroundColor: '#D9E6F0', color: '#0F172A', cursor: 'pointer' };
const filterCount = { marginLeft: 'auto', fontSize: '13px', color: '#334155', fontWeight: '700' };

const logPanel = { backgroundColor: '#EBF2F7', borderRadius: '20px', border: '1px solid #B0C4DE', overflow: 'hidden' };
const loaderDiv = { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px', color: '#64748B' };
const spinner = { width: '32px', height: '32px', border: '3px solid #D9E6F0', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' };
const logList = { display: 'flex', flexDirection: 'column' };
const logEntry = { padding: '14px 20px', borderBottom: '1px solid #B0C4DE', cursor: 'pointer', transition: 'background 0.15s' };
const logEntryHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' };
const logLeft = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' };
const logRight = { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 };
const sevBadge = { fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px' };
const streamBadge = { fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', border: '1px solid' };
const logType = { fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' };
const logTime = { fontSize: '11px', color: '#94a3b8', fontWeight: '600' };
const logMessage = { fontSize: '13px', color: '#0F172A', fontWeight: '500', lineHeight: '1.4' };
const logDetail = { marginTop: '12px', backgroundColor: '#D9E6F0', borderRadius: '10px', padding: '12px' };
const detailPre = { margin: 0, fontSize: '12px', color: '#334155', fontFamily: 'monospace', lineHeight: '1.5', overflow: 'auto' };
