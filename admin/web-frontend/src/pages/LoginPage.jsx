import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { login, loading } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const fillDemoCredentials = () => {
    setEmail('admin@vidya.test');
    setPassword('AdminDemo1!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email address and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.error || 'Incorrect email or password. Please try again.');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoBox}>
            <img src="/assets/logo.png" alt="Vidya Logo" className={styles.logoImg} />
          </div>
          <h1 className={styles.title}>Vidya Admin Portal</h1>
          <p className={styles.subtitle}>
            Authorized management workspace for AP SCERT textbooks, alerts & student data
          </p>
        </div>

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Mail size={15} />
              <span>Admin Email Address</span>
            </label>
            <input
              type="email"
              className={styles.input}
              placeholder="e.g. admin@vidya.test"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              required
              autoFocus
            />
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.label}>
              <Lock size={15} />
              <span>Admin Password</span>
            </label>
            <input
              type="password"
              className={styles.input}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              required
            />
          </div>

          <button
            type="button"
            className={styles.demoBtn}
            onClick={fillDemoCredentials}
          >
            <Sparkles size={14} />
            <span>Fill Demo Admin Credentials (admin@vidya.test)</span>
          </button>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            <span>{loading ? 'Verifying Credentials...' : 'Sign In to Admin Portal'}</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.cardFooter}>
          <ShieldCheck size={16} color="var(--success)" />
          <span>Restricted to authorized teachers & academic administrators</span>
        </div>
      </div>
    </div>
  );
};
