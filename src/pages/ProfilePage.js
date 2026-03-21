import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, logout, apiCall } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailLoading, setEmailLoading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [statsRes, histRes] = await Promise.all([
      apiCall('/api/exchange/stats'),
      apiCall('/api/exchange/history')
    ]);
    if (statsRes.success) setStats(statsRes.stats);
    if (histRes.success) setHistory(histRes.exchanges);
    setLoading(false);
  };

  const handleLogout = () => { logout(); navigate('/'); toast.info('Signed out'); };

  const sendStatement = async () => {
    setEmailLoading(true);
    const rows = history.slice(0, 20).map(ex =>
      `<tr style="border-bottom:1px solid #1e293b">
        <td style="padding:10px 12px;color:#94a3b8;font-size:13px">${ex.fromAmount} ${ex.fromCurrency}</td>
        <td style="padding:10px 12px;color:#94a3b8;font-size:13px">→ ${ex.toAmount} ${ex.toCurrency}</td>
        <td style="padding:10px 12px;color:#94a3b8;font-size:13px">${ex.exchangeRate}</td>
        <td style="padding:10px 12px;color:#94a3b8;font-size:13px">${ex.purpose}</td>
        <td style="padding:10px 12px;color:#64748b;font-size:12px">${new Date(ex.createdAt).toLocaleDateString('en-IN')}</td>
      </tr>`
    ).join('');

    const html = `<div style="font-family:sans-serif;max-width:680px;margin:0 auto;background:#0a0f1e;color:#e2e8f0;border-radius:12px;overflow:hidden">
      <div style="background:#1e3a5f;padding:32px 40px;border-bottom:1px solid #1e293b">
        <p style="color:#38bdf8;font-size:11px;letter-spacing:3px;margin:0 0 8px">CURREX BANK</p>
        <h1 style="color:#e2e8f0;font-size:22px;margin:0 0 4px">Exchange Statement</h1>
        <p style="color:#64748b;font-size:12px;margin:0">${new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
      </div>
      <div style="padding:32px 40px">
        <p style="color:#94a3b8;margin:0 0 8px;font-size:13px">Account Holder: <strong style="color:#e2e8f0">${user?.name}</strong></p>
        <p style="color:#94a3b8;margin:0 0 24px;font-size:13px">Email: ${user?.email}</p>
        <div style="background:#1e3a5f;border-radius:8px;padding:20px;margin-bottom:28px;display:flex;gap:32px;flex-wrap:wrap">
          <div><p style="color:#64748b;font-size:11px;letter-spacing:2px;margin:0 0 6px">TOTAL EXCHANGES</p><p style="color:#38bdf8;font-size:28px;font-weight:700;margin:0">${stats?.totalTransactions || 0}</p></div>
          <div><p style="color:#64748b;font-size:11px;letter-spacing:2px;margin:0 0 6px">TOTAL INR RECEIVED</p><p style="color:#4ade80;font-size:28px;font-weight:700;margin:0">₹${(stats?.totalINR || 0).toLocaleString('en-IN')}</p></div>
        </div>
        <p style="color:#64748b;font-size:11px;letter-spacing:2px;margin:0 0 16px">RECENT EXCHANGES</p>
        <table style="width:100%;border-collapse:collapse;background:#1e3a5f;border-radius:8px;overflow:hidden">
          <thead><tr style="border-bottom:1px solid #2d4a6e">
            <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;color:#64748b">SENT</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;color:#64748b">RECEIVED</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;color:#64748b">RATE</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;color:#64748b">PURPOSE</th>
            <th style="padding:10px 12px;text-align:left;font-size:10px;letter-spacing:2px;color:#64748b">DATE</th>
          </tr></thead>
          <tbody>${rows || '<tr><td colspan="5" style="padding:20px;text-align:center;color:#64748b">No exchanges</td></tr>'}</tbody>
        </table>
      </div>
      <div style="padding:20px 40px;border-top:1px solid #1e293b;text-align:center">
        <p style="color:#334155;font-size:11px;margin:0">© 2024 CurrEx Bank · RBI Authorised · Confidential Statement</p>
      </div>
    </div>`;

    const data = await apiCall('/api/send-email', {
      method: 'POST',
      body: JSON.stringify({ to: user.email, subject: 'CurrEx Bank — Exchange Statement', html })
    });
    setEmailLoading(false);
    if (data.success) toast.success('Statement sent to ' + user.email);
    else toast.error('Email failed: ' + (data.error || 'SMTP unavailable on this network'));
  };

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'80vh'}}><div className="spinner" style={{width:36,height:36}} /></div>;

  return (
    <div className="profile-page fade-in">
      <div className="profile-inner">
        <h1 className="page-title">Profile</h1>
        <p className="page-sub">Account overview & settings</p>

        <div className="profile-layout">
          {/* Left */}
          <div className="profile-left">
            <div className="card profile-card">
              <div className="p-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <h2 className="p-name">{user?.name}</h2>
              <p className="p-email">{user?.email}</p>
              <span className="badge badge-info" style={{marginTop:12}}>Verified Customer</span>
            </div>
            <div className="card p-actions">
              <h3 className="p-actions-title">Actions</h3>
              <button className="btn-secondary p-action-btn" onClick={sendStatement} disabled={emailLoading}>
                {emailLoading ? <><span className="spinner" style={{width:14,height:14}} /> Sending...</> : '📧 Email Statement'}
              </button>
              <button className="btn-ghost p-action-btn" style={{color:'var(--red)',borderColor:'rgba(248,113,113,0.3)'}} onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </div>

          {/* Right */}
          <div className="profile-right">
            <div className="p-stats-grid">
              {[
                { label:'Total Exchanges', value: stats?.totalTransactions || 0, color:'var(--blue)' },
                { label:'INR Received', value: `₹${(stats?.totalINR || 0).toLocaleString('en-IN')}`, color:'var(--green)' },
                { label:'Currencies Used', value: stats?.uniqueCurrencies || 0, color:'var(--amber)' },
                { label:'Fees Paid', value: `₹${(stats?.totalFees || 0).toFixed(2)}`, color:'var(--text2)' },
              ].map((s, i) => (
                <div key={i} className="card p-stat">
                  <p className="p-stat-label">{s.label}</p>
                  <p className="p-stat-value" style={{color:s.color}}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Favourite currencies */}
            <div className="card">
              <h3 className="p-section-title">Most Used Currencies</h3>
              {history.length === 0 ? (
                <p style={{color:'var(--text3)',fontSize:13}}>No exchanges yet</p>
              ) : (
                (() => {
                  const freq = {};
                  history.forEach(e => { freq[e.fromCurrency] = (freq[e.fromCurrency] || 0) + 1; });
                  return Object.entries(freq).sort((a,b) => b[1]-a[1]).slice(0,5).map(([c, count]) => (
                    <div key={c} className="p-currency-row">
                      <span className="p-c-code">{c}</span>
                      <div className="p-c-bar-wrap">
                        <div className="p-c-bar" style={{width:`${Math.min(100,(count/history.length)*100*3)}%`}} />
                      </div>
                      <span className="p-c-count">{count} exchange{count > 1 ? 's' : ''}</span>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Security */}
            <div className="card">
              <h3 className="p-section-title">Security & Compliance</h3>
              {[
                { label:'Account Verified', status:'Active' },
                { label:'RBI Compliance', status:'Active' },
                { label:'Data Encryption', status:'Active' },
                { label:'Two-Factor Auth', status:'Available' },
              ].map((item, i) => (
                <div key={i} className="p-security-row">
                  <span className="p-sec-label">{item.label}</span>
                  <span className={`badge ${item.status === 'Active' ? 'badge-success' : 'badge-info'}`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
