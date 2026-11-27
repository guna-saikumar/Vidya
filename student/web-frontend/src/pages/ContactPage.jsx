import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
  Tag,
  HelpCircle,
  School,
  Headphones,
  FileQuestion,
  GraduationCap,
} from 'lucide-react';
import styles from './ContactPage.css';
import { submitComplaint, trackComplaint } from '../services/supportService';

const STATUS_LABELS = {
  open: 'In Review',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  escalated: 'Escalated',
};

const CATEGORIES = [
  { value: 'technical_issue', label: 'Technical issue' },
  { value: 'textbook_access', label: 'Textbook / soft copy' },
  { value: 'recorded_classes', label: 'Recorded classes' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'login_account', label: 'Login / account' },
  { value: 'content_issue', label: 'Wrong content' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'other', label: 'Other' },
];

export const ContactPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();

  const [activeTab, setActiveTab] = useState('form');

  // Form state
  const [fullName, setFullName] = useState('');
  const [classGrade, setClassGrade] = useState('10');
  const [section, setSection] = useState('A');
  const [rollNumber, setRollNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('technical_issue');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [ticketRef, setTicketRef] = useState(null);

  // Tickets history
  const readTickets = () => {
    try {
      const raw = localStorage.getItem('@vidya_student_tickets');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };
  const [tickets, setTickets] = useState(() => readTickets());

  useEffect(() => {
    if (profile) {
      setFullName(
        profile.firstName && profile.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : profile.fullName || profile.name || user?.name || ''
      );
      setClassGrade(profile.grade || '10');
      setSection(profile.section || 'A');
      setRollNumber(profile.rollNumber || '42');
      setPhone(profile.parentPhone || '+91 98765 43210');
    }
    if (user?.email) {
      setEmail(user.email);
    }
  }, [profile, user]);

  // Refresh status from the Contact Us API whenever the ticket list is opened.
  useEffect(() => {
    if (activeTab !== 'requests') return;
    let mounted = true;
    const saved = readTickets();

    Promise.all(
      saved
        .filter((t) => t.email && t.id?.startsWith('VIDYA-'))
        .map(async (ticket) => {
          try {
            const remote = await trackComplaint(ticket.id, ticket.email);
            return { id: ticket.id, status: remote.status };
          } catch {
            return null;
          }
        })
    ).then((results) => {
      if (!mounted) return;
      const byId = new Map(results.filter(Boolean).map((r) => [r.id, r.status]));
      if (byId.size === 0) return;
      const updated = saved.map((t) =>
        byId.has(t.id) ? { ...t, status: byId.get(t.id) } : t
      );
      setTickets(updated);
      try {
        localStorage.setItem('@vidya_student_tickets', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save tickets:', err);
      }
    });
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    const payload = {
      full_name: fullName,
      class_grade: Number(classGrade),
      section,
      roll_number: rollNumber,
      email,
      phone,
      category,
      subject,
      message,
    };

    try {
      const saved = await submitComplaint(payload);
      const newRef = saved.ticket_ref;
      const newTicket = {
        id: newRef,
        category,
        subject,
        message,
        email,
        createdAt: saved.created_at || new Date().toISOString(),
        status: saved.status || 'open',
      };
      const updated = [newTicket, ...readTickets().filter((t) => t.id !== newRef)];
      setTickets(updated);
      try {
        localStorage.setItem('@vidya_student_tickets', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save tickets:', err);
      }
      setTicketRef(newRef);
      setSubject('');
      setMessage('');
    } catch (err) {
      setSubmitError(
        err?.response?.data?.error ||
          'Unable to reach the support desk. Please try again in a moment.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* ================= HERO BANNER (Matches Dashboard) ================= */}
      <section className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <div className={styles.welcomePillRow}>
            <div className={styles.welcomePill}>
              <Headphones size={15} />
              <span>Student Helpdesk</span>
            </div>
            <div className={styles.welcomePillNeutral}>
              <School size={14} />
              <span>{profile?.schoolName || 'AP State Board High School'}</span>
            </div>
            <div className={styles.welcomePillNeutral}>
              <span>Support Desk Online</span>
            </div>
          </div>

          <h1 className={styles.welcomeTitle}>
            Academic Support & <span className={styles.welcomeTitlePrimary}>Helpdesk</span>
          </h1>

          <p className={styles.welcomeSubtitle}>
            Have an issue with textbook materials, syllabus questions, account access, or homework resources?
            Submit a request and our academic counselors will follow up promptly.
          </p>

          <div className={styles.filterPillsRow}>
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`${styles.filterPill} ${activeTab === 'form' ? styles.filterPillActive : ''}`}
            >
              <FileQuestion size={14} />
              <span>Raise Support Ticket</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('office')}
              className={`${styles.filterPill} ${activeTab === 'office' ? styles.filterPillActive : ''}`}
            >
              <Phone size={14} />
              <span>Helpline & Office Contacts</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`${styles.filterPill} ${activeTab === 'history' ? styles.filterPillActive : ''}`}
            >
              <span>My Requests</span>
              {tickets.length > 0 && (
                <span className={styles.countBadge}>{tickets.length}</span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Success Notification */}
      {ticketRef && (
        <div className={styles.successBanner}>
          <div className={styles.successLeft}>
            <CheckCircle2 size={22} color="#059669" style={{ flexShrink: 0 }} />
            <div>
              <h4 className={styles.successTitle}>Ticket Submitted Successfully!</h4>
              <p className={styles.successText}>
                Your ticket reference is <strong>#{ticketRef}</strong>. The school academic support team will review and respond.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setTicketRef(null)}
            className={styles.dismissBtn}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ================= TAB 1: FORM ================= */}
      {activeTab === 'form' && (
        <div className={styles.formCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Submit an Academic Request</h2>
              <p className={styles.sectionSubtitle}>
                Provide details of your query below. Responses are usually sent within 24 hours.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.formContent}>
            {/* Student metadata auto-fill banner */}
            <div className={styles.studentInfoStrip}>
              <div className={styles.stripItem}>
                <span className={styles.stripLabel}>Student Name</span>
                <span className={styles.stripValue}>{fullName || 'Student'}</span>
              </div>
              <div className={styles.stripItem}>
                <span className={styles.stripLabel}>Enrolled Class</span>
                <span className={styles.stripValue}>Class {classGrade} • Sec {section}</span>
              </div>
              <div className={styles.stripItem}>
                <span className={styles.stripLabel}>Roll Number</span>
                <span className={styles.stripValue}>#{rollNumber || '42'}</span>
              </div>
              <div className={styles.stripItem}>
                <span className={styles.stripLabel}>Parent Mobile</span>
                <span className={styles.stripValue}>{phone || 'Not linked'}</span>
              </div>
            </div>

            {/* Category Selector */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Issue Category</label>
              <div className={styles.categoriesBar}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`${styles.categoryBtn} ${category === cat.value ? styles.categoryBtnActive : ''}`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Subject / Topic Summary</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Unable to open Chapter 4 PDF notes in Physical Science"
                className={styles.formInput}
              />
            </div>

            {/* Detailed Message */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Detailed Description</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your issue with as much detail as possible (e.g., textbook name, page number, error message)..."
                className={styles.formTextarea}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={styles.primaryBtn}
              style={{ alignSelf: 'flex-start' }}
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
            </button>
            {submitError && (
              <p style={{ color: '#b42318', fontSize: 13, margin: '8px 0 0' }} role="alert">
                {submitError}
              </p>
            )}
          </form>
        </div>
      )}

      {/* ================= TAB 2: OFFICE INFO ================= */}
      {activeTab === 'office' && (
        <div className={styles.officeGrid}>
          <div className={styles.officeCard}>
            <div className={styles.officeIconCircle}>
              <Phone size={24} />
            </div>
            <h3 className={styles.officeCardTitle}>Student Toll-Free Helpline</h3>
            <p className={styles.officeCardDesc}>
              Direct telephonic helpline for academic questions and SCERT digital textbook issues.
            </p>
            <div className={styles.contactValueBox}>
              <span className={styles.contactValue}>1800-425-0033</span>
              <span className={styles.contactSub}>Mon–Sat: 9:00 AM – 5:30 PM</span>
            </div>
          </div>

          <div className={styles.officeCard}>
            <div className={styles.officeIconCircle}>
              <Mail size={24} />
            </div>
            <h3 className={styles.officeCardTitle}>Official Support Email</h3>
            <p className={styles.officeCardDesc}>
              Send queries regarding syllabus revisions, exam timetables, or portal credentials.
            </p>
            <div className={styles.contactValueBox}>
              <span className={styles.contactValue}>support@vidyalearning.in</span>
              <span className={styles.contactSub}>Response within 24 hours</span>
            </div>
          </div>

          <div className={styles.officeCard}>
            <div className={styles.officeIconCircle}>
              <MapPin size={24} />
            </div>
            <h3 className={styles.officeCardTitle}>State Education Department</h3>
            <p className={styles.officeCardDesc}>
              State Council of Educational Research & Training (SCERT), Amaravati, Andhra Pradesh.
            </p>
            <div className={styles.contactValueBox}>
              <span className={styles.contactValue}>SCERT Complex, Vijayawada</span>
              <span className={styles.contactSub}>Pincode: 520002, Andhra Pradesh</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: HISTORY ================= */}
      {activeTab === 'history' && (
        <div className={styles.sectionBlock}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <h2 className={styles.sectionTitle}>Previous Support Requests</h2>
              <p className={styles.sectionSubtitle}>
                Track the status of tickets submitted through this portal
              </p>
            </div>
          </div>

          {tickets.length > 0 ? (
            <div className={styles.ticketList}>
              {tickets.map((t) => (
                <div key={t.id} className={styles.ticketCard}>
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketMetaGroup}>
                      <span className={styles.ticketId}>#{t.id}</span>
                      <span className={styles.ticketCategory}>
                        {CATEGORIES.find((c) => c.value === t.category)?.label || t.category}
                      </span>
                    </div>
                    <span className={styles.ticketStatusBadge}>
                      {STATUS_LABELS[t.status] || 'In Review'}
                    </span>
                  </div>

                  <h3 className={styles.ticketSubject}>{t.subject}</h3>
                  <p className={styles.ticketMessage}>{t.message}</p>

                  <div className={styles.ticketFooter}>
                    <Clock size={13} />
                    <span>Submitted on {new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyCard}>
              <div className={styles.emptyIconBox}>
                <HelpCircle size={32} />
              </div>
              <h3 className={styles.emptyTitle}>No past tickets found</h3>
              <p className={styles.emptySubtitle}>
                You haven't submitted any support requests yet. If you have an issue, tap "Raise Support Ticket".
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className={styles.primaryBtn}
                style={{ marginTop: 12 }}
              >
                Raise a Request
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
