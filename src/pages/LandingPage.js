import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const FLAGS = { INR:'🇮🇳', USD:'🇺🇸', EUR:'🇪🇺', GBP:'🇬🇧', JPY:'🇯🇵', AED:'🇦🇪', SGD:'🇸🇬', AUD:'🇦🇺', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳', SAR:'🇸🇦', MYR:'🇲🇾', THB:'🇹🇭', HKD:'🇭🇰', KWD:'🇰🇼' };

export default function LandingPage() {
  const [from, setFrom] = useState('USD');
  const [amount, setAmount] = useState('1000');
  const [result, setResult] = useState(null);
  const [rates, setRates] = useState({});

  useEffect(() => {
    fetch('/api/rates').then(r => r.json()).then(d => { if (d.success) setRates(d.rates); });
  }, []);

  useEffect(() => {
    if (!rates[from]) return;
    const inr = parseFloat(amount || 0) / rates[from];
    setResult(inr.toFixed(2));
  }, [from, amount, rates]);

  const features = [
    { icon:'💱', title:'16+ Currencies', desc:'USD, EUR, GBP, AED, SGD, JPY and more — all converted to INR instantly.' },
    { icon:'📊', title:'Live Rates', desc:'Real-time exchange rates updated continuously from global markets.' },
    { icon:'🔒', title:'RBI Authorised', desc:'Fully compliant with RBI guidelines for foreign currency exchange.' },
    { icon:'📧', title:'Instant Receipt', desc:'Get a detailed exchange receipt in your email immediately.' },
  ];

  const popularCurrencies = ['USD', 'EUR', 'GBP', 'AED', 'SGD', 'AUD'];

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-content fade-up">
          <div className="hero-tag">🇮🇳 India's Trusted Currency Exchange</div>
          <h1 className="hero-title">Exchange Foreign Currency<br /><span className="hero-highlight">to Indian Rupees</span></h1>
          <p className="hero-desc">Convert USD, EUR, GBP, AED and 12 more currencies to INR at the best rates. Fast, secure, RBI authorised.</p>

          {/* Quick converter */}
          <div className="hero-converter card">
            <p className="label">Quick Rate Check</p>
            <div className="converter-row">
              <div className="converter-input-wrap">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} min="1" />
                <select value={from} onChange={e => setFrom(e.target.value)}>
                  {Object.keys(rates).filter(c => c !== 'INR').map(c => (
                    <option key={c} value={c}>{FLAGS[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="converter-arrow">→</div>
              <div className="converter-result">
                <span className="result-flag">🇮🇳</span>
                <span className="result-amount">₹{result ? parseFloat(result).toLocaleString('en-IN') : '—'}</span>
                <span className="result-label">INR</span>
              </div>
            </div>
            {rates[from] && <p className="converter-rate">1 {from} = ₹{(1/rates[from]).toFixed(4)}</p>}
            <Link to="/register" className="btn-primary converter-btn">Start Exchanging →</Link>
          </div>
        </div>

        {/* Popular currencies ticker */}
        <div className="currency-ticker">
          {popularCurrencies.map(c => rates[c] && (
            <div key={c} className="ticker-item">
              <span className="ticker-flag">{FLAGS[c]}</span>
              <span className="ticker-code">{c}/INR</span>
              <span className="ticker-rate">₹{(1/rates[c]).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-wrap">
          <p className="section-eye">Why Choose CurrEx</p>
          <h2 className="section-title">Simple. Fast. Transparent.</h2>
          <div className="features-grid">
            {features.map((f, i) => (
              <div key={i} className="feature-card card fade-up" style={{ animationDelay:`${i*0.1}s` }}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="how-section">
        <div className="section-wrap">
          <p className="section-eye">How It Works</p>
          <h2 className="section-title">Exchange in 3 Simple Steps</h2>
          <div className="steps-grid">
            {[
              { num:'01', title:'Create Account', desc:'Register with your email and PAN number in under 2 minutes.' },
              { num:'02', title:'Enter Amount', desc:'Choose your currency, enter the amount you want to exchange.' },
              { num:'03', title:'Get INR', desc:'Confirm the exchange and receive an instant email receipt.' },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.num}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to Exchange?</h2>
          <p className="cta-desc">Join thousands of customers who trust CurrEx Bank for their foreign currency needs.</p>
          <div className="cta-btns">
            <Link to="/register" className="btn-primary" style={{fontSize:14,padding:'13px 36px'}}>Open Free Account</Link>
            <Link to="/rates" className="btn-secondary" style={{fontSize:14,padding:'13px 36px'}}>View Live Rates</Link>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-brand"><span style={{color:'var(--blue)'}}>◆</span> CurrEx Bank</span>
          <p className="footer-copy">© 2024 CurrEx Bank · RBI Authorised Money Changer · All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
