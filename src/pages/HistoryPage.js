import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './HistoryPage.css';

const FLAGS = { INR:'🇮🇳', USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', AED:'🇦🇪', SGD:'🇸🇬', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳', SAR:'🇸🇦', MYR:'🇲🇾', THB:'🇹🇭', HKD:'🇭🇰', KWD:'🇰🇼' };
const fmtDate = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
const fmtTime = d => new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });

export default function HistoryPage() {
  const { apiCall, user } = useAuth();
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    const data = await apiCall('/api/exchange/history');
    if (data.success) setExchanges(data.exchanges);
    setLoading(false);
  };

  const currencies = ['all', ...new Set(exchanges.map(e => e.fromCurrency))];
  const filtered = filter === 'all' ? exchanges : exchanges.filter(e => e.fromCurrency === filter);

  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'80vh'}}><div className="spinner" style={{width:36,height:36}} /></div>;

  return (
    <div className="history-page fade-in">
      <div className="history-inner">
        <div className="history-header">
          <div>
            <h1 className="page-title">Exchange History</h1>
            <p className="page-sub">{exchanges.length} total transactions</p>
          </div>
          <Link to="/exchange" className="btn-primary" style={{fontSize:13,padding:'10px 24px',borderRadius:8}}>
            + New Exchange
          </Link>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          {currencies.map(c => (
            <button key={c} className={`filter-btn ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>
              {c !== 'all' && FLAGS[c]} {c === 'all' ? 'All' : c}
              <span className="filter-count">
                {c === 'all' ? exchanges.length : exchanges.filter(e => e.fromCurrency === c).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state card">
            <p style={{fontSize:48,marginBottom:16}}>💱</p>
            <h3>No exchanges yet</h3>
            <p>Start your first currency exchange</p>
            <Link to="/exchange" className="btn-primary" style={{marginTop:20,display:'inline-block',fontSize:13,padding:'10px 24px',borderRadius:8}}>Exchange Now</Link>
          </div>
        ) : (
          <div className="history-layout">
            {/* Table */}
            <div className="history-table card">
              <table>
                <thead>
                  <tr>
                    <th>Pair</th>
                    <th>Amount Sent</th>
                    <th>Amount Received</th>
                    <th>Rate</th>
                    <th>Purpose</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ex, i) => (
                    <tr key={ex._id} className={`history-row ${selected?._id === ex._id ? 'selected' : ''}`} onClick={() => setSelected(selected?._id === ex._id ? null : ex)} style={{animationDelay:`${i*0.03}s`}}>
                      <td>
                        <div className="pair-cell">
                          <span className="pair-flags">{FLAGS[ex.fromCurrency]}→{FLAGS[ex.toCurrency]}</span>
                          <span className="pair-code">{ex.fromCurrency}/{ex.toCurrency}</span>
                        </div>
                      </td>
                      <td><span className="amt-sent">{ex.fromAmount} {ex.fromCurrency}</span></td>
                      <td><span className="amt-recv">{ex.toAmount} {ex.toCurrency}</span></td>
                      <td><span className="rate-cell">{ex.exchangeRate}</span></td>
                      <td><span className="purpose-cell">{ex.purpose}</span></td>
                      <td>
                        <div className="date-cell">
                          <span>{fmtDate(ex.createdAt)}</span>
                          <span className="time-cell">{fmtTime(ex.createdAt)}</span>
                        </div>
                      </td>
                      <td><span className={`badge badge-${ex.status === 'completed' ? 'success' : ex.status === 'failed' ? 'danger' : 'warning'}`}>{ex.status}</span></td>
                      <td><button className="detail-btn">▼</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="detail-panel card fade-up">
                <div className="detail-header">
                  <h3 className="detail-title">Transaction Details</h3>
                  <button className="detail-close" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="detail-amounts">
                  <div className="da-from">
                    <p className="da-label">Sent</p>
                    <p className="da-value red">{selected.fromAmount} {selected.fromCurrency} {FLAGS[selected.fromCurrency]}</p>
                  </div>
                  <div className="da-arrow">→</div>
                  <div className="da-to">
                    <p className="da-label">Received</p>
                    <p className="da-value green">{selected.toAmount} {selected.toCurrency} {FLAGS[selected.toCurrency]}</p>
                  </div>
                </div>
                <div className="detail-rows">
                  {[
                    ['Reference No.', selected.referenceNo],
                    ['Exchange Rate', `1 ${selected.fromCurrency} = ${selected.exchangeRate} ${selected.toCurrency}`],
                    ['Service Fee', `${selected.fee} ${selected.toCurrency}`],
                    ['Total Amount', `${selected.totalAmount} ${selected.toCurrency}`],
                    ['Purpose', selected.purpose],
                    ['Date & Time', `${fmtDate(selected.createdAt)} ${fmtTime(selected.createdAt)}`],
                    ['Status', selected.status],
                  ].map(([label, value]) => (
                    <div key={label} className="detail-row">
                      <span className="dr-label">{label}</span>
                      <span className="dr-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
