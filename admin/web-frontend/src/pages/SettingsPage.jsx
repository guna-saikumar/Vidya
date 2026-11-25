import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  BookOpen,
  Bell,
  LogOut,
  CheckCircle2,
  Lock,
  Globe,
  School,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');

  const handleSavePreferences = () => {
    setSavedMessage('Portal preferences updated successfully.');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageIntro}>
        <div>
          <h2 className={styles.pageHeading}>Portal Settings & Profile</h2>
          <p className={styles.pageSubheading}>
            Manage administrator credentials, portal preferences, and academic session settings
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className={styles.savedBanner}>
          <CheckCircle2 size={16} />
          <span>{savedMessage}</span>
        </div>
      )}

      <div className={styles.settingsGrid}>
        {/* Administrator Profile Card */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <User size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Administrator Profile</h3>
              <p className={styles.cardSubtitle}>
                Account details authorized for academic management
              </p>
            </div>
          </div>

          <div className={styles.profileDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Full Name</span>
              <span className={styles.detailValue}>
                {adminUser?.name || 'Academic Administrator'}
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Email Address</span>
              <span className={styles.detailValue}>
                {adminUser?.email || 'admin@vidya.test'}
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Role & Scope</span>
              <span className={styles.roleBadge}>
                {adminUser?.role || 'ADMIN'} &bull; Academic Desk
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Authority Board</span>
              <span className={styles.detailValue}>
                AP SCERT (Government of Andhra Pradesh)
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Academic Year</span>
              <span className={styles.detailValue}>2026–2027</span>
            </div>
          </div>

          <div className={styles.profileFooter}>
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut size={16} />
              <span>Sign Out of Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Academic Portal Preferences Card */}
        <div className={styles.settingsCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <School size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Curriculum & Publishing Preferences</h3>
              <p className={styles.cardSubtitle}>
                Configure curriculum distribution and publication options
              </p>
            </div>
          </div>

          <div className={styles.preferencesList}>
            <div className={styles.preferenceItem}>
              <div className={styles.prefText}>
                <span className={styles.prefTitle}>Broadcast Push Alerts</span>
                <span className={styles.prefSub}>
                  Send urgent announcements directly to enrolled students
                </span>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className={styles.toggleCheckbox}
              />
            </div>

            <div className={styles.preferenceItem}>
              <div className={styles.prefText}>
                <span className={styles.prefTitle}>Automatic Textbook Indexing</span>
                <span className={styles.prefSub}>
                  Auto-link uploaded PDF chapters with corresponding class subjects
                </span>
              </div>
              <input
                type="checkbox"
                checked={autoSyncEnabled}
                onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                className={styles.toggleCheckbox}
              />
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Class Coverage</span>
              <span className={styles.detailValue}>Classes 6, 7, 8, 9, 10</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Instruction Medium</span>
              <span className={styles.detailValue}>Telugu & English Medium</span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Security Status</span>
              <span className={styles.secureBadge}>
                <ShieldCheck size={14} />
                <span>Encrypted Session Active</span>
              </span>
            </div>
          </div>

          <button onClick={handleSavePreferences} className={styles.savePrefsBtn}>
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
};
