import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './RatesPage.css';

const FLAGS = { INR:'🇮🇳', USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', AED:'🇦🇪', SGD:'🇸🇬', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳', SAR:'🇸🇦', MYR:'🇲🇾', THB:'🇹🇭', HKD:'🇭🇰', KWD:'🇰🇼' };

export default function RatesPage() {
  const { user } = useAuth();
  const [rates, setRates] = useState({});
  const [names, setNames] = useState({});
  const [base, setBase] = useState('INR');
  const [search, setSearch] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => {
      if (d.success) { setRates(d.rates); setNames(d.names); setUpdatedAt(d.updatedAt); }
      setLoading(false);
    });
  }, []);

  const getRate = (currency) => {
    if (!rates[base] || !rates[currency]) return 0;
    return rates[currency] / rates[base];
  };

  const currencies = Object.keys(rates).filter(c =>
    c !== base &&
    (c.toLowerCase().includes(search.toLowerCase()) ||
     (names[c] || '').toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'80vh'}}><div className="spinner" style={{width:36,height:36}} /></div>;

  return (
    <div className="rates-page fade-in">
      <div className="rates-inner">
        <div className="rates-header">
          <div>
            <h1 className="page-title">Live Exchange Rates</h1>
            <p className="page-sub">Updated: {updatedAt ? new Date(updatedAt).toLocaleTimeString('en-IN') : '—'}</p>
          </div>
          {user && (
            <Link to="/exchange" className="btn-primary" style={{fontSize:13,padding:'10px 24px',borderRadius:8}}>
              Exchange Now →
            </Link>
          )}
        </div>

        {/* Base currency selector */}
        <div className="rates-controls card">
          <div className="controls-left">
            <label className="label" style={{marginBottom:0}}>Base Currency</label>
            <div className="base-selector">
              {Object.keys(rates).map(c => (
                <button
                  key={c}
                  className={`base-btn ${base === c ? 'active' : ''}`}
                  onClick={() => setBase(c)}
                >
                  {FLAGS[c]} {c}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            placeholder="Search currency..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{maxWidth:200}}
          />
        </div>

        {/* Rates grid */}
        <div className="rates-grid">
          {currencies.map((c, i) => {
            const rate = getRate(c);
            return (
              <div key={c} className="rate-card card" style={{animationDelay:`${i*0.03}s`}}>
                <div className="rc-top">
                  <span className="rc-flag">{FLAGS[c]}</span>
                  <div>
                    <p className="rc-code">{c}</p>
                    <p className="rc-name">{names[c]}</p>
                  </div>
                </div>
                <div className="rc-rate">
                  <p className="rc-value">{rate < 0.01 ? rate.toFixed(6) : rate < 1 ? rate.toFixed(4) : rate.toFixed(2)}</p>
                  <p className="rc-label">1 {base} =</p>
                </div>
                {user && (
                  <Link to={`/exchange`} className="rc-exchange-btn">
                    Exchange →
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        {currencies.length === 0 && (
          <div className="empty-state card">
            <h3>No currencies found</h3>
            <p>Try a different search term</p>
          </div>
        )}

        {/* Rate note */}
        <div className="rates-note card">
          <p>💡 <strong>Note:</strong> Rates shown are indicative. A 0.5% service fee applies on all exchanges. Rates are for reference only and subject to change. CurrEx Bank is an RBI authorised money changer.</p>
        </div>
      </div>
    </div>
  );
}
