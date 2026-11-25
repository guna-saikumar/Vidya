import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, ArrowRight, AlertCircle, GraduationCap } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [token, setToken] = useState('vidya-admin-secret');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please provide an admin security token');
      return;
    }
    const success = login(token);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid admin credentials');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>
            <GraduationCap size={32} color="#ffffff" />
          </div>
          <h1 className={styles.title}>Vidya Admin Portal</h1>
          <p className={styles.subtitle}>
            Authorized management workspace for AP SCERT books, alerts & students
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
              <KeyRound size={15} />
              <span>Admin Access Token</span>
            </label>
            <input
              type="password"
              className={styles.input}
              placeholder="Enter ADMIN_TOKEN (default: vidya-admin-secret)"
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                setError('');
              }}
              required
            />
            <span className={styles.hint}>
              Default local token: <code>vidya-admin-secret</code>
            </span>
          </div>

          <button type="submit" className={styles.submitBtn}>
            <span>Enter Admin Portal</span>
            <ArrowRight size={18} />
          </button>
        </form>

        <div className={styles.cardFooter}>
          <ShieldCheck size={16} color="var(--success)" />
          <span>Restricted to authorized teachers & administrators</span>
        </div>
      </div>
    </div>
  );
};
