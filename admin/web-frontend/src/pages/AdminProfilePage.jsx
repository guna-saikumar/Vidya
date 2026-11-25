import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Mail,
  School,
  Lock,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  Sparkles,
  BookOpen,
  BellRing,
  Users,
  LifeBuoy,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import styles from './AdminProfilePage.module.css';

export const AdminProfilePage = () => {
  const { adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState(adminUser?.name || 'Academic Administrator');
  const [isEditingName, setIsEditingName] = useState(false);
  const [savedBanner, setSavedBanner] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsEditingName(false);
    setSavedBanner('Administrator profile updated successfully.');
    setTimeout(() => setSavedBanner(''), 3500);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // Success simulation
    setPasswordSuccess('Password updated successfully. Your new password is now active.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(''), 4000);
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.profileContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Administrator Profile</h2>
          <p className={styles.pageSubtitle}>
            Official administrative credentials, security credentials, and portal authority scope
          </p>
        </div>
      </div>

      {savedBanner && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} />
          <span>{savedBanner}</span>
        </div>
      )}

      {/* Hero Banner Card */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.largeAvatar}>
            {fullName ? fullName[0].toUpperCase() : 'A'}
          </div>
          <div className={styles.heroMeta}>
            <div className={styles.heroTitleRow}>
              <h3 className={styles.heroName}>{fullName}</h3>
              <span className={styles.roleTag}>
                <ShieldCheck size={14} />
                {adminUser?.role || 'ADMIN'}
              </span>
            </div>
            <span className={styles.heroEmail}>
              <Mail size={14} />
              {adminUser?.email || 'admin@vidya.test'}
            </span>
            <span className={styles.heroDepartment}>
              <School size={14} />
              AP SCERT &bull; Department of School Education, Andhra Pradesh
            </span>
          </div>
        </div>

        <div className={styles.heroRight}>
          <div className={styles.sessionPill}>
            <span className={styles.sessionPulse} />
            <span>Authorized Active Session</span>
          </div>
          <button onClick={handleSignOut} className={styles.heroSignOutBtn}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Profile Details & Password Grid */}
      <div className={styles.gridSection}>
        {/* Personal & Authority Information */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <User size={20} color="var(--primary)" />
            </div>
            <div>
              <h4 className={styles.cardTitle}>Identity & Authority Details</h4>
              <p className={styles.cardSubtitle}>
                Verified academic administrator information
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className={styles.formGroup}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Display Name</label>
              {isEditingName ? (
                <div className={styles.inputActionRow}>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={styles.textInput}
                    required
                  />
                  <button type="submit" className={styles.actionBtnPrimary}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(false)}
                    className={styles.actionBtnSecondary}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className={styles.displayRow}>
                  <span className={styles.fieldValueText}>{fullName}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className={styles.editLinkBtn}
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Official Email</label>
              <span className={styles.fieldValueText}>
                {adminUser?.email || 'admin@vidya.test'}
              </span>
              <span className={styles.fieldHelper}>Verified state education credential</span>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Board & Jurisdiction</label>
              <span className={styles.fieldValueText}>
                AP SCERT (Classes 6 to 10 Curriculum)
              </span>
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Academic Year Scope</label>
              <span className={styles.fieldValueText}>2026–2027 Session</span>
            </div>
          </form>
        </div>

        {/* Security & Password */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIconBox}>
              <KeyRound size={20} color="var(--primary)" />
            </div>
            <div>
              <h4 className={styles.cardTitle}>Security & Credentials</h4>
              <p className={styles.cardSubtitle}>
                Update portal access password and review encryption
              </p>
            </div>
          </div>

          {passwordError && (
            <div className={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className={styles.successBanner}>
              <CheckCircle2 size={16} />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className={styles.formGroup}>
            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={styles.textInput}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className={styles.textInput}
              />
            </div>

            <div className={styles.formField}>
              <label className={styles.fieldLabel}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className={styles.textInput}
              />
            </div>

            <button type="submit" className={styles.updatePasswordBtn}>
              <Lock size={15} />
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* System Privileges Section */}
      <div className={styles.privilegesCard}>
        <div className={styles.cardHeader}>
          <div className={styles.cardIconBox}>
            <Sparkles size={20} color="var(--primary)" />
          </div>
          <div>
            <h4 className={styles.cardTitle}>Authorized Portal Privileges</h4>
            <p className={styles.cardSubtitle}>
              Active permissions granted to your administrator role
            </p>
          </div>
        </div>

        <div className={styles.privilegesGrid}>
          <div className={styles.privilegeItem}>
            <div className={styles.privilegeIconWrap}>
              <BookOpen size={18} />
            </div>
            <div className={styles.privilegeText}>
              <span className={styles.privilegeTitle}>Study Materials & Textbooks</span>
              <span className={styles.privilegeDesc}>
                Full upload, edit, and deletion rights for state PDF textbooks and class notes.
              </span>
            </div>
          </div>

          <div className={styles.privilegeItem}>
            <div className={styles.privilegeIconWrap}>
              <BellRing size={18} />
            </div>
            <div className={styles.privilegeText}>
              <span className={styles.privilegeTitle}>Broadcast Push Alerts</span>
              <span className={styles.privilegeDesc}>
                Authority to dispatch urgent academic notifications across all enrolled classes.
              </span>
            </div>
          </div>

          <div className={styles.privilegeItem}>
            <div className={styles.privilegeIconWrap}>
              <Users size={18} />
            </div>
            <div className={styles.privilegeText}>
              <span className={styles.privilegeTitle}>Student Directory & Moderation</span>
              <span className={styles.privilegeDesc}>
                Access to enrolled student rosters, progress tracking, and profile administration.
              </span>
            </div>
          </div>

          <div className={styles.privilegeItem}>
            <div className={styles.privilegeIconWrap}>
              <LifeBuoy size={18} />
            </div>
            <div className={styles.privilegeText}>
              <span className={styles.privilegeTitle}>Support Complaints Desk</span>
              <span className={styles.privilegeDesc}>
                Manage student inquiries, investigate technical issues, and mark tickets resolved.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
