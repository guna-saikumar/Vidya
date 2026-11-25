import React, { useState } from 'react';
import {
  Settings,
  KeyRound,
  Server,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
  const { adminToken, login } = useAdminAuth();
  const [tokenInput, setTokenInput] = useState(adminToken);
  const [saved, setSaved] = useState(false);

  const handleSaveToken = (e) => {
    e.preventDefault();
    login(tokenInput.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleResetDefault = () => {
    setTokenInput('vidya-admin-secret');
    login('vidya-admin-secret');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageIntro}>
        <div>
          <h2 className={styles.pageHeading}>Admin Settings & Connectivity</h2>
          <p className={styles.pageSubheading}>
            Configure administrator authentication, backend endpoints, and access tokens
          </p>
        </div>
      </div>

      <div className={styles.settingsGrid}>
        {/* Token Management Card */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <KeyRound size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Admin Access Secret (x-admin-token)</h3>
              <p className={styles.cardSubtitle}>
                Used to authorize upload, broadcast, and student management API requests
              </p>
            </div>
          </div>

          {saved && (
            <div className={styles.savedBanner}>
              <CheckCircle2 size={16} />
              <span>Admin security token updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSaveToken} className={styles.tokenForm}>
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Active Admin Secret</label>
              <input
                type="text"
                className={styles.textInput}
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter admin token..."
                required
              />
              <span className={styles.fieldHint}>
                Corresponds to <code>ADMIN_TOKEN</code> in backend <code>.env</code>.
              </span>
            </div>

            <div className={styles.buttonRow}>
              <button type="submit" className={styles.saveBtn}>
                <Save size={16} />
                <span>Save Token</span>
              </button>
              <button
                type="button"
                className={styles.resetBtn}
                onClick={handleResetDefault}
              >
                <RotateCcw size={15} />
                <span>Reset to Default</span>
              </button>
            </div>
          </form>
        </div>

        {/* System & Architecture Info */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Server size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Platform Environment</h3>
              <p className={styles.cardSubtitle}>
                Service specifications and connectivity
              </p>
            </div>
          </div>

          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>NestJS Backend API</span>
              <span className={styles.infoVal}>http://localhost:4000</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Admin Portal Port</span>
              <span className={styles.infoVal}>http://localhost:5175</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Student Web Frontend</span>
              <span className={styles.infoVal}>http://localhost:5174</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>PostgreSQL Database</span>
              <span className={styles.infoVal}>Native Postgres :5432 (vidya)</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>API Documentation</span>
              <a
                href="http://localhost:4000/docs"
                target="_blank"
                rel="noreferrer"
                className={styles.docsLink}
              >
                <span>Open Swagger / OpenAPI Docs</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
