import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import './AuthPages.css';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const data = await login(form.email, form.password);
      setLoading(false);
      if (data && data.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
      else setError((data && data.error) || 'Login failed');
    } catch (err) { setLoading(false); setError(err.message); }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card card fade-up">
        <div className="auth-top">
          <div className="auth-logo">◆</div>
          <h1 className="auth-title">Sign In</h1>
          <p className="auth-sub">Access your CurrEx account</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="••••••••" required />
          </div>
          {error && <div className="auth-err">{error}</div>}
          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>
        <p className="auth-switch">No account? <Link to="/register">Create one →</Link></p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', panNumber:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const data = await register(form.name, form.email, form.password, form.phone, form.panNumber);
      setLoading(false);
      if (data && data.success) { toast.success('Account created! Welcome to CurrEx Bank.'); navigate('/dashboard'); }
      else setError((data && data.error) || 'Registration failed');
    } catch (err) { setLoading(false); setError(err.message); }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow" />
      <div className="auth-card card fade-up">
        <div className="auth-top">
          <div className="auth-logo">◆</div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-sub">Start exchanging currencies today</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={e => setForm({...form, name:e.target.value})} placeholder="Vedagiri Kumar" required />
          </div>
          <div className="form-group">
            <label className="label">Email Address</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@email.com" required />
          </div>
          <div className="form-group">
            <label className="label">Mobile Number</label>
            <input type="tel" value={form.phone} onChange={e => setForm({...form, phone:e.target.value})} placeholder="+91 98765 43210" />
          </div>
          <div className="form-group">
            <label className="label">PAN Number (optional)</label>
            <input type="text" value={form.panNumber} onChange={e => setForm({...form, panNumber:e.target.value.toUpperCase()})} placeholder="ABCDE1234F" maxLength={10} />
          </div>
          <div className="form-group">
            <label className="label">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Min. 6 characters" required />
          </div>
          {error && <div className="auth-err">{error}</div>}
          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in →</Link></p>
      </div>
    </div>
  );
}

export default LoginPage;
