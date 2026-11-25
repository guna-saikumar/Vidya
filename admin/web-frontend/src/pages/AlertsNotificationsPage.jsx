import React, { useState, useEffect, useCallback } from 'react';
import {
  BellRing,
  Send,
  Users,
  GraduationCap,
  Megaphone,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Calendar,
  Award,
  Info,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './AlertsNotificationsPage.module.css';

export const AlertsNotificationsPage = () => {
  // Form State
  const [form, setForm] = useState({
    title: '',
    message: '',
    detailedBody: '',
    type: 'announcement',
    target: 'all', // 'all' | 'grade' | 'student'
    targetValue: '8', // class 8 default
    actionRoute: 'Learn',
    actionLabel: 'Open Curriculum',
  });
  const [sending, setSending] = useState(false);

  // List State
  const [broadcasts, setBroadcasts] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [availableClasses, setAvailableClasses] = useState([]);

  // Notification feedback
  const [feedback, setFeedback] = useState(null);
  const [deleteTargetTitle, setDeleteTargetTitle] = useState(null);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  useEffect(() => {
    adminService
      .getClasses()
      .then((data) => {
        if (data && data.length > 0) {
          setAvailableClasses(data);
        }
      })
      .catch((err) => console.warn('Could not load classes for alert targeting:', err));
  }, []);

  const loadBroadcasts = useCallback(() => {
    setLoadingList(true);
    adminService
      .getBroadcastNotifications()
      .then((data) => setBroadcasts(data || []))
      .catch((err) => notify('error', err.message))
      .finally(() => setLoadingList(false));
  }, [notify]);

  useEffect(() => {
    loadBroadcasts();
  }, [loadBroadcasts]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      notify('error', 'Please provide a title and alert message.');
      return;
    }

    try {
      setSending(true);
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        detailedBody: form.detailedBody.trim() || form.message.trim(),
        type: form.type,
        target: form.target,
        targetValue: form.target === 'all' ? undefined : form.targetValue.trim(),
        icon:
          form.type === 'achievement'
            ? 'emoji-events'
            : form.type === 'alert'
            ? 'warning'
            : 'campaign',
        actionRoute: form.actionRoute.trim() || undefined,
        actionLabel: form.actionLabel.trim() || undefined,
      };

      const result = await adminService.broadcastNotification(payload);
      notify(
        'success',
        `Broadcast sent! Delivered to ${result.deliveredCount} student accounts.`
      );
      setForm({
        title: '',
        message: '',
        detailedBody: '',
        type: 'announcement',
        target: 'all',
        targetValue: '8',
        actionRoute: 'Learn',
        actionLabel: 'Open Curriculum',
      });
      loadBroadcasts();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetTitle) return;
    try {
      await adminService.deleteNotification(deleteTargetTitle);
      notify('success', `Alert "${deleteTargetTitle}" recalled from student inboxes.`);
      setDeleteTargetTitle(null);
      loadBroadcasts();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'alert':
        return styles.badgeAlert;
      case 'achievement':
        return styles.badgeAchievement;
      case 'event':
        return styles.badgeEvent;
      default:
        return styles.badgeAnnouncement;
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Toast */}
      {feedback && (
        <div
          className={`${styles.feedbackToast} ${
            feedback.type === 'error' ? styles.toastError : styles.toastSuccess
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className={styles.pageIntro}>
        <div>
          <h2 className={styles.pageHeading}>Broadcast Alerts & Announcements</h2>
          <p className={styles.pageSubheading}>
            Push instant notices, exam circulars, and study alerts directly to student portal & app
          </p>
        </div>
      </div>

      <div className={styles.gridContainer}>
        {/* Compose Broadcast Form */}
        <div className={styles.composeCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Megaphone size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Send Instant Broadcast</h3>
              <p className={styles.cardSubtitle}>
                Appears in mobile & web notification bell
              </p>
            </div>
          </div>

          <form onSubmit={handleSend} className={styles.composeForm}>
            {/* Target Audience Selector */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Target Audience *</label>
              <div className={styles.targetOptions}>
                <label
                  className={`${styles.targetOption} ${
                    form.target === 'all' ? styles.targetOptionActive : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value="all"
                    checked={form.target === 'all'}
                    onChange={() => setForm((p) => ({ ...p, target: 'all' }))}
                  />
                  <Users size={16} />
                  <span>All Students</span>
                </label>

                <label
                  className={`${styles.targetOption} ${
                    form.target === 'grade' ? styles.targetOptionActive : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    value="grade"
                    checked={form.target === 'grade'}
                    onChange={() => setForm((p) => ({ ...p, target: 'grade' }))}
                  />
                  <GraduationCap size={16} />
                  <span>Specific Class</span>
                </label>
              </div>
            </div>

            {/* If grade target is selected */}
            {form.target === 'grade' && (
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Select Grade Class</label>
                <select
                  className={styles.selectInput}
                  value={form.targetValue}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, targetValue: e.target.value }))
                  }
                >
                  {availableClasses.length > 0 ? (
                    availableClasses.map((cls) => (
                      <option key={cls.id} value={String(cls.grade)}>
                        {cls.title} Students (Class {cls.grade})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="6">Class 6 Students</option>
                      <option value="7">Class 7 Students</option>
                      <option value="8">Class 8 Students</option>
                      <option value="9">Class 9 Students</option>
                      <option value="10">Class 10 Students</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Alert Type */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Notification Category *</label>
              <div className={styles.typeSelector}>
                {[
                  { id: 'announcement', label: 'Announcement', icon: Megaphone },
                  { id: 'alert', label: 'Important Alert', icon: AlertCircle },
                  { id: 'event', label: 'Schedule / Event', icon: Calendar },
                  { id: 'achievement', label: 'Achievement', icon: Award },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      className={`${styles.typeBtn} ${
                        form.type === t.id ? styles.typeBtnActive : ''
                      }`}
                      onClick={() => setForm((p) => ({ ...p, type: t.id }))}
                    >
                      <Icon size={15} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification Title */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Notice Title *</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. Science Quarterly Syllabus Revision Notes Published"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>

            {/* Summary Message */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Short Message (Summary) *</label>
              <textarea
                className={styles.textAreaInput}
                rows={2}
                placeholder="Brief text displayed on push notifications and dashboard header cards..."
                value={form.message}
                onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                required
              />
            </div>

            {/* Detailed Body */}
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Full Body (Optional detail)</label>
              <textarea
                className={styles.textAreaInput}
                rows={3}
                placeholder="Detailed instructions or circular notes when the student taps the notification..."
                value={form.detailedBody}
                onChange={(e) =>
                  setForm((p) => ({ ...p, detailedBody: e.target.value }))
                }
              />
            </div>

            {/* Action route button */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Link Screen</label>
                <select
                  className={styles.selectInput}
                  value={form.actionRoute}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, actionRoute: e.target.value }))
                  }
                >
                  <option value="Learn">Curriculum (Learn)</option>
                  <option value="StudyMaterials">PDF Study Materials</option>
                  <option value="Bookmarks">Saved Bookmarks</option>
                  <option value="Profile">Student Profile</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Button Label</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="e.g. Read Now"
                  value={form.actionLabel}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, actionLabel: e.target.value }))
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.sendSubmitBtn}
              disabled={sending}
            >
              {sending ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  <span>Broadcasting Notice...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Send Notification Now</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* History / Sent Broadcasts */}
        <div className={styles.historyCard}>
          <div className={styles.historyHeader}>
            <div className={styles.cardIcon}>
              <BellRing size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Broadcast History</h3>
              <p className={styles.cardSubtitle}>
                {broadcasts.length} sent communications & circulars
              </p>
            </div>
          </div>

          <div className={styles.historyListWrapper}>
            {loadingList ? (
              <div className={styles.loadingState}>
                <Loader2 size={32} className={styles.spinner} />
                <span>Loading sent alerts...</span>
              </div>
            ) : broadcasts.length === 0 ? (
              <div className={styles.emptyState}>
                <BellRing size={40} color="var(--text-muted)" />
                <p className={styles.emptyTitle}>No broadcasts sent yet</p>
                <p className={styles.emptyText}>
                  Use the compose form on the left to broadcast your first announcement.
                </p>
              </div>
            ) : (
              <div className={styles.broadcastItems}>
                {broadcasts.map((item, idx) => (
                  <div key={idx} className={styles.broadcastItem}>
                    <div className={styles.itemHeader}>
                      <div className={styles.itemTitleGroup}>
                        <span
                          className={`${styles.typeBadge} ${getTypeBadgeClass(
                            item.type
                          )}`}
                        >
                          {item.type.toUpperCase()}
                        </span>
                        <h4 className={styles.itemTitle}>{item.title}</h4>
                      </div>

                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteTargetTitle(item.title)}
                        title="Recall / Delete Notification"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className={styles.itemMessage}>{item.message}</p>

                    <div className={styles.itemMetaRow}>
                      <div className={styles.metaStat}>
                        <Users size={14} color="var(--text-muted)" />
                        <span>{item.recipientCount} Recipient Students</span>
                      </div>

                      <div className={styles.metaStat}>
                        <Eye size={14} color="var(--success)" />
                        <span>{item.readCount} Read</span>
                      </div>

                      <div className={styles.metaStat}>
                        <Clock size={14} color="var(--text-muted)" />
                        <span>{new Date(item.sentAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetTitle && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Recall Notification</h3>
            <p className={styles.deleteWarningText}>
              Are you sure you want to recall &bull; <strong>{deleteTargetTitle}</strong>?
              This will remove the notification from all student inboxes.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeleteTargetTitle(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteConfirm}
              >
                Recall Notification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
