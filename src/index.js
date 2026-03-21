import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App';
import './styles/globals.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <App />
    <ToastContainer position="top-right" autoClose={4000} theme="dark"
      toastStyle={{ background: '#0f172a', border: '1px solid #1e293b', color: '#e2e8f0', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
  </BrowserRouter>
);
