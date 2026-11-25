import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
  const { login, loading } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateForm = () => {
    let isValid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError('Administrator email is required.');
      isValid = false;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters.');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!validateForm()) {
      setErrorMessage('Please enter your administrator email and password.');
      return;
    }

    const trimmedEmail = email.trim();
    setErrorMessage(null);
    setEmailError(null);
    setPasswordError(null);

    const res = await login(trimmedEmail, password);
    if (res.success) {
      navigate('/');
    } else {
      setErrorMessage(res.error || 'Incorrect email or password. Please try again.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <div className={styles.logoBox}>
            <img
              src="/assets/logo.png"
              alt="Vidya Learning"
              className={styles.logoImg}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h1 className={styles.brandTitle}>Vidya Admin</h1>
          <div className={styles.badgePill}>
            Admin Portal · AP SCERT
          </div>
        </div>

        {/* Form Card */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Sign In</h2>
          <p className={styles.cardSubtitle}>
            Enter your administrator credentials to access the academic management dashboard.
          </p>

          {/* Error Alert */}
          {errorMessage && (
            <div className={styles.alertError}>
              <AlertCircle size={16} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Admin Email */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Admin Email</label>
                {emailError && <span className={styles.fieldError}>{emailError}</span>}
              </div>
              <div className={`${styles.inputWrapper} ${emailError ? styles.inputWrapperError : ''}`}>
                <Mail className={styles.icon} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your admin email"
                  className={styles.input}
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>Password</label>
                {passwordError && <span className={styles.fieldError}>{passwordError}</span>}
              </div>
              <div className={`${styles.inputWrapper} ${passwordError ? styles.inputWrapperError : ''}`}>
                <Lock className={styles.icon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Enter your password"
                  className={styles.input}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              <span>{loading ? 'Signing in...' : 'Sign In to Admin Portal'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div className={styles.cardFooter}>
            <ShieldCheck size={14} color="var(--success)" />
            <span>Authorized access only &bull; AP SCERT 2026–27</span>
          </div>
        </div>
      </div>
    </div>
  );
};
