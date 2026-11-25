import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  BellRing,
  LifeBuoy,
  TrendingUp,
  UploadCloud,
  Send,
  UserCheck,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Loader2,
  GraduationCap,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminService
      .getOverviewStats()
      .then((data) => setStats(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 size={36} className={styles.spinner} />
        <span>Loading Admin Analytics...</span>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Intro Banner */}
      <div className={styles.welcomeBanner}>
        <div className={styles.welcomeContent}>
          <div className={styles.eyebrowBadge}>
            <GraduationCap size={14} />
            <span>AP STATE BOARD &bull; SCERT 2026–27</span>
          </div>
          <h2 className={styles.welcomeHeading}>
            Academic Administration Dashboard
          </h2>
          <p className={styles.welcomeSubtext}>
            Overview of uploaded textbooks, student enrollments, syllabus progression, and broadcast notices.
          </p>
        </div>

        <div className={styles.bannerActions}>
          <Link to="/books" className={styles.bannerPrimaryBtn}>
            <UploadCloud size={16} />
            <span>Upload Book</span>
          </Link>
          <Link to="/alerts" className={styles.bannerSecondaryBtn}>
            <Send size={16} />
            <span>Send Alert</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Metrics Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: 'var(--pale-peach)' }}>
            <Users size={22} color="var(--primary)" />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Total Students</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{stats?.totalStudents || 0}</span>
              <span className={styles.metricSubbadge}>
                {stats?.onboardedStudents || 0} Onboarded
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: '#e7f3ed' }}>
            <BookOpen size={22} color="var(--success)" />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Study Materials</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{stats?.totalStudyMaterials || 0}</span>
              <span className={styles.metricSubbadge} style={{ color: 'var(--success)', background: '#e7f3ed' }}>
                PDF Books
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: '#fdf8ec' }}>
            <BellRing size={22} color="var(--accent-gold)" />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Active Broadcasts</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>Push Alerts</span>
              <span className={styles.metricSubbadge} style={{ color: 'var(--accent-gold)', background: '#fdf8ec' }}>
                SCERT
              </span>
            </div>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricIconWrap} style={{ background: '#ffdad6' }}>
            <LifeBuoy size={22} color="var(--error)" />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricLabel}>Open Tickets</span>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>{stats?.openComplaints || 0}</span>
              <span className={styles.metricSubbadge} style={{ color: 'var(--error)', background: '#ffdad6' }}>
                Support
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Enrollment Breakdown & Shortcuts */}
      <div className={styles.twoColumnGrid}>
        {/* Grade Distribution */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Student Enrollment by Grade</h3>
              <p className={styles.panelSubtitle}>Distribution across classes 6 to 10</p>
            </div>
            <Link to="/students" className={styles.panelLink}>
              <span>View Roster</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className={styles.gradeBars}>
            {[6, 7, 8, 9, 10].map((gradeNum) => {
              const item = stats?.gradeDistribution?.find((g) => g.grade === gradeNum);
              const count = item ? item.count : 0;
              const total = stats?.totalStudents || 1;
              const percent = Math.round((count / total) * 100);

              return (
                <div key={gradeNum} className={styles.gradeBarRow}>
                  <div className={styles.gradeLabelWrap}>
                    <span className={styles.gradeTitle}>Class {gradeNum}</span>
                    <span className={styles.gradeCount}>{count} students</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Quick Portal Actions</h3>
              <p className={styles.panelSubtitle}>Frequently performed admin operations</p>
            </div>
          </div>

          <div className={styles.quickActionCards}>
            <Link to="/books" className={styles.actionItem}>
              <div className={styles.actionIcon} style={{ background: 'var(--pale-peach)' }}>
                <BookOpen size={20} color="var(--primary)" />
              </div>
              <div className={styles.actionMeta}>
                <span className={styles.actionTitle}>Upload Study Material</span>
                <span className={styles.actionDesc}>Upload syllabus chapters & notes</span>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>

            <Link to="/alerts" className={styles.actionItem}>
              <div className={styles.actionIcon} style={{ background: '#fdf8ec' }}>
                <Send size={20} color="var(--accent-gold)" />
              </div>
              <div className={styles.actionMeta}>
                <span className={styles.actionTitle}>Push Broadcast Alert</span>
                <span className={styles.actionDesc}>Send announcements to student devices</span>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>

            <Link to="/students" className={styles.actionItem}>
              <div className={styles.actionIcon} style={{ background: '#e7f3ed' }}>
                <Users size={20} color="var(--success)" />
              </div>
              <div className={styles.actionMeta}>
                <span className={styles.actionTitle}>Manage Students Roster</span>
                <span className={styles.actionDesc}>Review academic data & progress</span>
              </div>
              <ArrowRight size={16} color="var(--text-muted)" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Materials & Enrolled Students */}
      <div className={styles.twoColumnGrid}>
        {/* Recent Books */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Recently Uploaded Materials</h3>
              <p className={styles.panelSubtitle}>Latest additions to the student library</p>
            </div>
            <Link to="/books" className={styles.panelLink}>
              <span>All Books</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {stats?.recentMaterials?.length === 0 ? (
            <p className={styles.emptyNote}>No materials uploaded yet.</p>
          ) : (
            <div className={styles.recentList}>
              {stats?.recentMaterials?.map((item) => (
                <div key={item.id} className={styles.recentItem}>
                  <div className={styles.recentItemIcon}>
                    <BookOpen size={16} color="var(--primary)" />
                  </div>
                  <div className={styles.recentItemDetails}>
                    <span className={styles.recentItemTitle}>{item.title}</span>
                    <span className={styles.recentItemSub}>
                      Class {item.classId} &bull; {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Students */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Recent Student Accounts</h3>
              <p className={styles.panelSubtitle}>Recently enrolled students</p>
            </div>
            <Link to="/students" className={styles.panelLink}>
              <span>All Students</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {stats?.recentStudents?.length === 0 ? (
            <p className={styles.emptyNote}>No student accounts found.</p>
          ) : (
            <div className={styles.recentList}>
              {stats?.recentStudents?.map((s) => (
                <div key={s.id} className={styles.recentItem}>
                  <div className={styles.recentStudentAvatar}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.recentItemDetails}>
                    <span className={styles.recentItemTitle}>{s.name}</span>
                    <span className={styles.recentItemSub}>
                      {s.grade ? `Class ${s.grade}` : 'Enrolled'} &bull; {s.email}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
