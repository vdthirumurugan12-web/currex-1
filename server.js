const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB failed:', err.message); process.exit(1); });

// ─── Exchange Rates (INR base — updated periodically) ─────────────────────────
const RATES = {
  INR:  1,
  USD:  0.01198,
  EUR:  0.01104,
  GBP:  0.00945,
  JPY:  1.8120,
  AED:  0.04399,
  SGD:  0.01612,
  AUD:  0.01851,
  CAD:  0.01651,
  CHF:  0.01073,
  CNY:  0.08674,
  SAR:  0.04494,
  MYR:  0.05585,
  THB:  0.41800,
  HKD:  0.09350,
  KWD:  0.00368,
};

const CURRENCY_NAMES = {
  INR: 'Indian Rupee',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  AED: 'UAE Dirham',
  SGD: 'Singapore Dollar',
  AUD: 'Australian Dollar',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  CNY: 'Chinese Yuan',
  SAR: 'Saudi Riyal',
  MYR: 'Malaysian Ringgit',
  THB: 'Thai Baht',
  HKD: 'Hong Kong Dollar',
  KWD: 'Kuwaiti Dinar',
};

// ─── Models ───────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  phone:     { type: String, default: '' },
  panNumber: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
const User = mongoose.model('User', UserSchema);

const ExchangeSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromCurrency:  { type: String, required: true },
  toCurrency:    { type: String, required: true },
  fromAmount:    { type: Number, required: true },
  toAmount:      { type: Number, required: true },
  exchangeRate:  { type: Number, required: true },
  fee:           { type: Number, default: 0 },
  totalAmount:   { type: Number, required: true },
  purpose:       { type: String, default: 'Personal' },
  status:        { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  referenceNo:   { type: String, unique: true },
  createdAt:     { type: Date, default: Date.now }
});
ExchangeSchema.pre('save', function () {
  if (this.isNew) {
    this.referenceNo = 'CX' + Date.now() + Math.floor(Math.random() * 9000 + 1000);
  }
});
ExchangeSchema.index({ userId: 1, createdAt: -1 });
const Exchange = mongoose.model('Exchange', ExchangeSchema);

// ─── SMTP ─────────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000,
});
transporter.verify(err => {
  if (err) console.warn('⚠️  SMTP unavailable — email features disabled');
  else console.log('✅ SMTP ready');
});

const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
  } catch (e) {
    console.warn('Email send failed (non-critical):', e.message);
  }
};

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter     = rateLimit({ windowMs: 15*60*1000, max: 100, validate: { xForwardedForHeader: false } });
const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20,  validate: { xForwardedForHeader: false } });
app.use('/api/', limiter);

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token' });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, error: 'Invalid token' }); }
};

// ─── Auth Routes ──────────────────────────────────────────────────────────────
app.post('/api/auth/register', authLimiter, [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { name, email, password, phone, panNumber } = req.body;
    if (await User.findOne({ email }))
      return res.status(409).json({ success: false, error: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, panNumber });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    sendMail(email, 'Welcome to CurrEx Bank', welcomeHTML(name));
    res.status(201).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Rates Route ──────────────────────────────────────────────────────────────
app.get('/api/rates', (req, res) => {
  res.json({ success: true, rates: RATES, names: CURRENCY_NAMES, base: 'INR', updatedAt: new Date() });
});

app.get('/api/rates/convert', (req, res) => {
  const { from, to, amount } = req.query;
  if (!from || !to || !amount) return res.status(400).json({ success: false, error: 'Missing params' });
  if (!RATES[from] || !RATES[to]) return res.status(400).json({ success: false, error: 'Invalid currency' });
  const amountInINR = parseFloat(amount) / RATES[from];
  const converted   = amountInINR * RATES[to];
  const rate        = RATES[to] / RATES[from];
  const fee         = converted * 0.005; // 0.5% fee
  res.json({ success: true, from, to, amount: parseFloat(amount), converted: +converted.toFixed(4), rate: +rate.toFixed(6), fee: +fee.toFixed(4), total: +(converted + fee).toFixed(4) });
});

// ─── Exchange Routes ──────────────────────────────────────────────────────────
app.post('/api/exchange', auth, [
  body('fromCurrency').notEmpty(),
  body('toCurrency').notEmpty(),
  body('fromAmount').isFloat({ min: 1 }),
  body('purpose').optional(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { fromCurrency, toCurrency, fromAmount, purpose } = req.body;
    if (!RATES[fromCurrency] || !RATES[toCurrency])
      return res.status(400).json({ success: false, error: 'Invalid currency' });
    const amountInINR = parseFloat(fromAmount) / RATES[fromCurrency];
    const toAmount    = amountInINR * RATES[toCurrency];
    const rate        = RATES[toCurrency] / RATES[fromCurrency];
    const fee         = toAmount * 0.005;
    const totalAmount = toAmount + fee;
    const exchange = await Exchange.create({
      userId: req.user.id, fromCurrency, toCurrency,
      fromAmount: parseFloat(fromAmount), toAmount: +toAmount.toFixed(4),
      exchangeRate: +rate.toFixed(6), fee: +fee.toFixed(4),
      totalAmount: +totalAmount.toFixed(4),
      purpose: purpose || 'Personal', status: 'completed'
    });
    const user = await User.findById(req.user.id);
    sendMail(user.email, `CurrEx — Exchange Confirmation #${exchange.referenceNo}`,
      exchangeConfirmHTML(user.name, exchange));
    res.status(201).json({ success: true, exchange });
  } catch (err) {
    console.error('Exchange error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/exchange/history', auth, async (req, res) => {
  try {
    const exchanges = await Exchange.find({ userId: req.user.id })
      .sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, exchanges });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/exchange/stats', auth, async (req, res) => {
  try {
    const exchanges = await Exchange.find({ userId: req.user.id, status: 'completed' });
    const totalTransactions = exchanges.length;
    const totalINR = exchanges
      .filter(e => e.toCurrency === 'INR')
      .reduce((s, e) => s + e.toAmount, 0);
    const totalFees = exchanges.reduce((s, e) => s + e.fee, 0);
    const currencies = [...new Set(exchanges.map(e => e.fromCurrency))];
    res.json({ success: true, stats: { totalTransactions, totalINR: +totalINR.toFixed(2), totalFees: +totalFees.toFixed(2), uniqueCurrencies: currencies.length } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Email Route ──────────────────────────────────────────────────────────────
app.post('/api/send-email', auth, [
  body('to').isEmail(),
  body('subject').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { to, subject, html } = req.body;
    await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, html });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1, timestamp: new Date() });
});

// ─── Email Templates ──────────────────────────────────────────────────────────
function welcomeHTML(name) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0f1e;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#1e3a5f,#0a0f1e);padding:40px;text-align:center">
    <h1 style="color:#38bdf8;margin:0;font-size:26px;letter-spacing:2px">CURREX BANK</h1>
    <p style="color:#64748b;margin:8px 0 0;font-size:12px;letter-spacing:3px">FOREIGN CURRENCY EXCHANGE</p>
  </div>
  <div style="padding:40px">
    <h2 style="color:#e2e8f0;font-size:20px;margin:0 0 16px">Welcome, ${name}!</h2>
    <p style="color:#94a3b8;line-height:1.8">Your CurrEx account is ready. Exchange foreign currencies to INR and 15+ other currencies at competitive rates.</p>
    <div style="background:#1e3a5f;border-radius:8px;padding:20px;margin:24px 0">
      <p style="color:#38bdf8;margin:0 0 12px;font-size:11px;letter-spacing:2px">WHAT YOU CAN DO</p>
      <p style="color:#94a3b8;margin:4px 0;font-size:14px">✦ Convert USD, EUR, GBP → INR instantly</p>
      <p style="color:#94a3b8;margin:4px 0;font-size:14px">✦ Live exchange rates with minimal fees</p>
      <p style="color:#94a3b8;margin:4px 0;font-size:14px">✦ Full transaction history & receipts</p>
    </div>
  </div>
  <div style="padding:20px;border-top:1px solid #1e293b;text-align:center">
    <p style="color:#334155;font-size:11px;margin:0">© 2024 CurrEx Bank · RBI Authorised Dealer</p>
  </div></div>`;
}

function exchangeConfirmHTML(name, ex) {
  return `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#0a0f1e;color:#e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:#1e3a5f;padding:32px;text-align:center;border-bottom:1px solid #1e293b">
    <p style="color:#38bdf8;font-size:11px;letter-spacing:3px;margin:0">CURREX BANK</p>
    <h1 style="color:#e2e8f0;font-size:22px;margin:12px 0 4px">Exchange Confirmed</h1>
    <p style="color:#64748b;font-size:12px;margin:0">Ref: ${ex.referenceNo}</p>
  </div>
  <div style="padding:40px">
    <p style="color:#94a3b8;margin:0 0 24px">Dear ${name}, your currency exchange has been processed successfully.</p>
    <div style="background:#1e3a5f;border-radius:8px;padding:24px;margin-bottom:20px">
      <div style="display:flex;justify-content:space-between;margin-bottom:16px">
        <div><p style="color:#64748b;font-size:11px;margin:0 0 4px">YOU SENT</p><p style="color:#f87171;font-size:24px;margin:0;font-weight:bold">${ex.fromAmount} ${ex.fromCurrency}</p></div>
        <div style="color:#38bdf8;font-size:24px;align-self:center">→</div>
        <div style="text-align:right"><p style="color:#64748b;font-size:11px;margin:0 0 4px">YOU RECEIVED</p><p style="color:#4ade80;font-size:24px;margin:0;font-weight:bold">${ex.toAmount} ${ex.toCurrency}</p></div>
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr style="border-bottom:1px solid #1e293b"><td style="padding:10px 0;color:#64748b;font-size:13px">Exchange Rate</td><td style="padding:10px 0;color:#e2e8f0;font-size:13px;text-align:right">1 ${ex.fromCurrency} = ${ex.exchangeRate} ${ex.toCurrency}</td></tr>
      <tr style="border-bottom:1px solid #1e293b"><td style="padding:10px 0;color:#64748b;font-size:13px">Service Fee (0.5%)</td><td style="padding:10px 0;color:#e2e8f0;font-size:13px;text-align:right">${ex.fee} ${ex.toCurrency}</td></tr>
      <tr style="border-bottom:1px solid #1e293b"><td style="padding:10px 0;color:#64748b;font-size:13px">Purpose</td><td style="padding:10px 0;color:#e2e8f0;font-size:13px;text-align:right">${ex.purpose}</td></tr>
      <tr><td style="padding:10px 0;color:#64748b;font-size:13px">Date</td><td style="padding:10px 0;color:#e2e8f0;font-size:13px;text-align:right">${new Date(ex.createdAt).toLocaleString('en-IN')}</td></tr>
    </table>
  </div>
  <div style="padding:20px;border-top:1px solid #1e293b;text-align:center">
    <p style="color:#334155;font-size:11px;margin:0">© 2024 CurrEx Bank · This is an automated receipt</p>
  </div></div>`;
}

// ─── Static ───────────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'build')));
app.use('/api/*', (req, res) => res.status(404).json({ success: false, error: 'API not found' }));
app.get('*', (req, res) => {
  const idx = path.join(__dirname, 'build', 'index.html');
  if (fs.existsSync(idx)) res.sendFile(idx);
  else res.json({ status: '✅ CurrEx backend running', frontend: 'Start with: npm start (port 3000)' });
});
app.use((err, req, res, next) => res.status(500).json({ success: false, error: 'Server error' }));

const PORT = process.env.PORT || 5003;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server:   http://localhost:${PORT}`);
  console.log(`💱 Rates:    http://localhost:${PORT}/api/rates`);
  console.log(`🌐 Frontend: http://localhost:3000`);
});
server.on('error', err => { if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} in use`); process.exit(1); });
process.on('SIGINT', () => server.close(async () => { await mongoose.connection.close(); process.exit(0); }));
module.exports = app;
