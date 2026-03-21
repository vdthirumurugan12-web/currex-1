import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import './ExchangePage.css';

const FLAGS = { INR:'🇮🇳', USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', AED:'🇦🇪', SGD:'🇸🇬', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳', SAR:'🇸🇦', MYR:'🇲🇾', THB:'🇹🇭', HKD:'🇭🇰', KWD:'🇰🇼' };
const PURPOSES = ['Personal', 'Travel', 'Education', 'Medical', 'Business', 'Investment', 'Gift', 'Other'];

export default function ExchangePage() {
  const { apiCall } = useAuth();
  const [rates, setRates] = useState({});
  const [names, setNames] = useState({});
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('INR');
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('Personal');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => {
      if (d.success) { setRates(d.rates); setNames(d.names); }
    });
  }, []);

  useEffect(() => {
    if (!amount || !rates[from] || !rates[to]) { setPreview(null); return; }
    const amtInINR = parseFloat(amount) / rates[from];
    const converted = amtInINR * rates[to];
    const rate = rates[to] / rates[from];
    const fee = converted * 0.005;
    setPreview({ converted: +converted.toFixed(4), rate: +rate.toFixed(6), fee: +fee.toFixed(4), total: +(converted + fee).toFixed(4) });
  }, [amount, from, to, rates]);

  const handleSwap = () => { setFrom(to); setTo(from); };

  const handleExchange = async () => {
    if (!amount || parseFloat(amount) < 1) { toast.error('Enter a valid amount'); return; }
    if (from === to) { toast.error('Select different currencies'); return; }
    setLoading(true);
    const data = await apiCall('/api/exchange', {
      method: 'POST',
      body: JSON.stringify({ fromCurrency: from, toCurrency: to, fromAmount: parseFloat(amount), purpose })
    });
    setLoading(false);
    if (data.success) {
      setSuccess(data.exchange);
      setAmount('');
      toast.success('Exchange completed successfully!');
    } else {
      toast.error(data.error || 'Exchange failed');
    }
  };

  const currencies = Object.keys(rates);

  return (
    <div className="exchange-page fade-in">
      <div className="exchange-inner">
        <div className="exchange-header">
          <h1 className="page-title">Currency Exchange</h1>
          <p className="page-sub">Convert foreign currency at live rates</p>
        </div>

        {success ? (
          <div className="success-screen card">
            <div className="success-icon">✓</div>
            <h2 className="success-title">Exchange Successful!</h2>
            <div className="success-amounts">
              <div className="success-from">
                <span className="s-flag">{FLAGS[success.fromCurrency]}</span>
                <span className="s-amount">{success.fromAmount} {success.fromCurrency}</span>
              </div>
              <div className="success-arrow">→</div>
              <div className="success-to">
                <span className="s-flag">{FLAGS[success.toCurrency]}</span>
                <span className="s-amount s-green">{success.toAmount} {success.toCurrency}</span>
              </div>
            </div>
            <div className="success-details">
              <div className="s-row"><span>Reference No.</span><span className="s-mono">{success.referenceNo}</span></div>
              <div className="s-row"><span>Exchange Rate</span><span>1 {success.fromCurrency} = {success.exchangeRate} {success.toCurrency}</span></div>
              <div className="s-row"><span>Service Fee (0.5%)</span><span>{success.fee} {success.toCurrency}</span></div>
              <div className="s-row"><span>Purpose</span><span>{success.purpose}</span></div>
              <div className="s-row"><span>Status</span><span className="badge badge-success">Completed</span></div>
            </div>
            <p className="success-email">📧 A receipt has been sent to your email</p>
            <button className="btn-primary" style={{width:'100%',marginTop:20,fontSize:13,padding:'12px',borderRadius:8}} onClick={() => setSuccess(null)}>
              Make Another Exchange
            </button>
          </div>
        ) : (
          <div className="exchange-layout">
            {/* Exchange Form */}
            <div className="exchange-form card">
              <h3 className="form-title">Exchange Details</h3>

              {/* From */}
              <div className="form-group">
                <label className="label">You Send</label>
                <div className="currency-input">
                  <select value={from} onChange={e => setFrom(e.target.value)} className="currency-select">
                    {currencies.map(c => (
                      <option key={c} value={c}>{FLAGS[c]} {c} — {names[c]}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    className="amount-input"
                  />
                </div>
              </div>

              {/* Swap button */}
              <div className="swap-wrap">
                <button className="swap-btn" onClick={handleSwap} title="Swap currencies">⇅</button>
                {preview && <span className="rate-badge">1 {from} = {preview.rate} {to}</span>}
              </div>

              {/* To */}
              <div className="form-group">
                <label className="label">You Receive</label>
                <div className="currency-input">
                  <select value={to} onChange={e => setTo(e.target.value)} className="currency-select">
                    {currencies.map(c => (
                      <option key={c} value={c}>{FLAGS[c]} {c} — {names[c]}</option>
                    ))}
                  </select>
                  <div className="amount-display">
                    {preview ? (
                      <span className="amount-result">{preview.converted}</span>
                    ) : (
                      <span className="amount-placeholder">0.00</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div className="form-group">
                <label className="label">Purpose of Exchange</label>
                <select value={purpose} onChange={e => setPurpose(e.target.value)}>
                  {PURPOSES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* Fee breakdown */}
              {preview && (
                <div className="fee-box">
                  <div className="fee-row"><span>Exchange Amount</span><span>{preview.converted} {to}</span></div>
                  <div className="fee-row"><span>Service Fee (0.5%)</span><span>{preview.fee} {to}</span></div>
                  <div className="fee-divider" />
                  <div className="fee-row fee-total"><span>Total</span><span>{preview.total} {to}</span></div>
                </div>
              )}

              <button
                className="btn-primary exchange-btn"
                onClick={handleExchange}
                disabled={loading || !amount || !preview}
              >
                {loading ? <span className="spinner" /> : `Exchange ${from} → ${to}`}
              </button>
            </div>

            {/* Info sidebar */}
            <div className="exchange-sidebar">
              <div className="card sidebar-rates">
                <h3 className="section-lbl" style={{marginBottom:16}}>Today's Rates</h3>
                {Object.entries(rates).filter(([c]) => c !== 'INR').slice(0, 8).map(([c, r]) => (
                  <div key={c} className="sidebar-rate-row">
                    <span>{FLAGS[c]} {c}</span>
                    <span style={{color:'var(--green)',fontWeight:600}}>₹{(1/r).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="card sidebar-note">
                <p className="note-title">ℹ️ Exchange Info</p>
                <p className="note-text">• 0.5% service fee applies</p>
                <p className="note-text">• Rates updated in real-time</p>
                <p className="note-text">• Email receipt sent instantly</p>
                <p className="note-text">• RBI authorised exchange</p>
                <p className="note-text">• PAN required for amounts over ₹50,000</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
