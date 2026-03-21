import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './DashboardPage.css';

const FLAGS = { INR:'🇮🇳', USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', AED:'🇦🇪', SGD:'🇸🇬', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳', SAR:'🇸🇦', MYR:'🇲🇾', THB:'🇹🇭', HKD:'🇭🇰', KWD:'🇰🇼' };
const fmt = (n, c='INR') => new Intl.NumberFormat('en-IN', { style:'currency', currency:c, maximumFractionDigits:2 }).format(n);
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });

export default function DashboardPage() {
  const { user, apiCall } = useAuth();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [statsRes, histRes, ratesRes] = await Promise.all([
      apiCall('/api/exchange/stats'),
      apiCall('/api/exchange/history'),
      fetch('/api/rates').then(r => r.json())
    ]);
    if (statsRes.success) setStats(statsRes.stats);
    if (histRes.success) setHistory(histRes.exchanges.slice(0, 5));
    if (ratesRes.success) setRates(ratesRes.rates);
    setLoading(false);
  };

  const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
  const popularRates = ['USD','EUR','GBP','AED','SGD'];

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'80vh'}}><div className="spinner" style={{width:36,height:36}} /></div>;

  return (
    <div className="dashboard fade-in">
      <div className="dash-inner">

        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="page-title">{greet()}, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="page-sub">Here's your exchange overview</p>
          </div>
          <Link to="/exchange" className="btn-primary" style={{fontSize:13,padding:'10px 24px',borderRadius:8}}>
            + New Exchange
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[
            { label:'Total Exchanges', value: stats?.totalTransactions || 0, sub:'completed', icon:'💱' },
            { label:'Total INR Received', value: stats?.totalINR ? `₹${stats.totalINR.toLocaleString('en-IN')}` : '₹0', sub:'all time', icon:'🇮🇳' },
            { label:'Currencies Used', value: stats?.uniqueCurrencies || 0, sub:'different currencies', icon:'🌍' },
            { label:'Fees Paid', value: stats?.totalFees ? `₹${stats.totalFees.toFixed(2)}` : '₹0', sub:'0.5% per exchange', icon:'📋' },
          ].map((s, i) => (
            <div key={i} className="stat-card card">
              <div className="stat-icon">{s.icon}</div>
              <p className="stat-label">{s.label}</p>
              <p className="stat-value">{s.value}</p>
              <p className="stat-sub">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="dash-grid">
          {/* Live rates */}
          <div className="card dash-rates">
            <div className="section-hdr">
              <h3 className="section-lbl">Live Rates to INR</h3>
              <Link to="/rates" className="section-link">See all →</Link>
            </div>
            <div className="rates-list">
              {popularRates.map(c => rates[c] && (
                <div key={c} className="rate-row">
                  <div className="rate-left">
                    <span className="rate-flag">{FLAGS[c]}</span>
                    <div>
                      <p className="rate-code">{c}</p>
                    </div>
                  </div>
                  <div className="rate-right">
                    <p className="rate-value">₹{(1/rates[c]).toFixed(4)}</p>
                    <p className="rate-sub">per 1 {c}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/exchange" className="btn-primary" style={{width:'100%',marginTop:16,fontSize:13,padding:'11px',borderRadius:8,textAlign:'center',display:'block'}}>
              Exchange Now →
            </Link>
          </div>

          {/* Recent exchanges */}
          <div className="card dash-recent">
            <div className="section-hdr">
              <h3 className="section-lbl">Recent Exchanges</h3>
              <Link to="/history" className="section-link">View all →</Link>
            </div>
            {history.length === 0 ? (
              <div className="empty-state">
                <p style={{fontSize:40,marginBottom:12}}>💱</p>
                <h3>No exchanges yet</h3>
                <p>Your exchanges will appear here</p>
              </div>
            ) : (
              <div className="recent-list">
                {history.map((ex, i) => (
                  <div key={ex._id} className="recent-row" style={{animationDelay:`${i*0.05}s`}}>
                    <div className="recent-flags">
                      <span>{FLAGS[ex.fromCurrency]}</span>
                      <span className="recent-arrow">→</span>
                      <span>{FLAGS[ex.toCurrency]}</span>
                    </div>
                    <div className="recent-info">
                      <p className="recent-pair">{ex.fromCurrency} → {ex.toCurrency}</p>
                      <p className="recent-date">{fmtDate(ex.createdAt)}</p>
                    </div>
                    <div className="recent-amounts">
                      <p className="recent-from">-{ex.fromAmount} {ex.fromCurrency}</p>
                      <p className="recent-to">+{ex.toAmount} {ex.toCurrency}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
