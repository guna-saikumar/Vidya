import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  HelpCircle,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './LearningDeskPage.module.css';

const DOUBT_STATUSES = ['open', 'escalated', 'answered', 'resolved'];

const toLocalDateTime = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const LearningDeskPage = () => {
  const [overview, setOverview] = useState(null);
  const [doubts, setDoubts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [answers, setAnswers] = useState({});
  const [form, setForm] = useState({
    title: '',
    description: '',
    classId: '',
    subjectId: '',
    dueAt: '',
  });
  const [creating, setCreating] = useState(false);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    window.setTimeout(() => setFeedback(null), 4500);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, doubtRows, assignmentRows, classRows] = await Promise.all([
        adminService.getLearningOverview(),
        adminService.getDoubts(statusFilter || undefined),
        adminService.getAssignments(),
        adminService.getClasses(),
      ]);
      setOverview(stats);
      setDoubts(Array.isArray(doubtRows) ? doubtRows : []);
      setAssignments(Array.isArray(assignmentRows) ? assignmentRows : []);
      setClasses(Array.isArray(classRows) ? classRows : []);
    } catch (error) {
      notify('error', error?.response?.data?.error || 'Could not load the learning desk.');
    } finally {
      setLoading(false);
    }
  }, [notify, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!form.classId) {
      setSubjects([]);
      return;
    }
    adminService
      .getSubjects(form.classId)
      .then((rows) => setSubjects(Array.isArray(rows) ? rows : []))
      .catch(() => setSubjects([]));
  }, [form.classId]);

  const answerDoubt = async (doubt) => {
    try {
      await adminService.updateDoubt(
        doubt.id,
        'answered',
        answers[doubt.id] || 'Answered in class. Ask again if it is still unclear.'
      );
      notify('success', 'Answer saved. The student can see it in their doubt list.');
      await load();
    } catch (error) {
      notify('error', error?.response?.data?.error || 'Could not save the answer.');
    }
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.classId || !form.dueAt) {
      notify('error', 'Add a title, class and due date.');
      return;
    }
    setCreating(true);
    try {
      await adminService.createAssignment({
        title: form.title.trim(),
        description: form.description.trim(),
        classId: form.classId,
        subjectId: form.subjectId,
        dueAt: new Date(form.dueAt).toISOString(),
        status: 'published',
      });
      setForm({ title: '', description: '', classId: form.classId, subjectId: '', dueAt: '' });
      notify('success', 'Assignment published to the student task inbox.');
      await load();
    } catch (error) {
      notify('error', error?.response?.data?.error || 'Could not publish the assignment.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageIntro}>
        <div>
          <h1 className={styles.pageHeading}>Learning Desk</h1>
          <p className={styles.pageSubheading}>
            Answer escalated doubts and publish class assignments with due dates.
          </p>
        </div>
        <button type="button" className={styles.refreshBtn} onClick={load} disabled={loading}>
          {loading ? <Loader2 size={15} className={styles.spin} /> : <BookOpenCheck size={15} />}
          Refresh
        </button>
      </div>

      {feedback && (
        <div className={`${styles.feedbackToast} ${feedback.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          {feedback.message}
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <HelpCircle size={19} />
          <div>
            <strong>{overview?.doubts?.escalated ?? '—'}</strong>
            <span>Escalated doubts</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <MessageSquare size={19} />
          <div>
            <strong>{overview?.doubts?.total ?? '—'}</strong>
            <span>Total doubts</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <ClipboardList size={19} />
          <div>
            <strong>{overview?.assignments?.published ?? '—'}</strong>
            <span>Published assignments</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <CheckCircle2 size={19} />
          <div>
            <strong>{overview?.submissions?.submitted ?? '—'}</strong>
            <span>Submissions</span>
          </div>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2>Student doubts</h2>
          <div className={styles.statusFilters}>
            <button
              type="button"
              className={!statusFilter ? styles.filterActive : styles.filterBtn}
              onClick={() => setStatusFilter('')}
            >
              All
            </button>
            {DOUBT_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={statusFilter === status ? styles.filterActive : styles.filterBtn}
                onClick={() => setStatusFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {doubts.length === 0 ? (
          <p className={styles.empty}>No doubts in this view yet.</p>
        ) : (
          <div className={styles.doubtList}>
            {doubts.map((doubt) => (
              <article key={doubt.id} className={styles.doubtCard}>
                <div className={styles.doubtTop}>
                  <div>
                    <span className={`${styles.statusBadge} ${styles[`status_${doubt.status}`]}`}>
                      {doubt.status}
                    </span>
                    <strong>{doubt.question}</strong>
                    <p className={styles.doubtMeta}>
                      {doubt.studentName || 'Student'} · {doubt.subjectName || 'General'} ·{' '}
                      {new Date(doubt.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {doubt.photoUrl && (
                    <a
                      href={`${doubt.photoUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.photoLink}
                    >
                      View photo <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                {doubt.details && <p className={styles.doubtDetails}>{doubt.details}</p>}
                {doubt.teacherNote && (
                  <p className={styles.teacherNote}>Teacher: {doubt.teacherNote}</p>
                )}
                <div className={styles.answerRow}>
                  <input
                    className={styles.input}
                    placeholder="Write an answer or note…"
                    value={answers[doubt.id] || ''}
                    onChange={(event) =>
                      setAnswers((current) => ({ ...current, [doubt.id]: event.target.value }))
                    }
                  />
                  <button type="button" className={styles.primaryBtn} onClick={() => answerDoubt(doubt)}>
                    <Send size={13} /> Answer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className={styles.twoColumns}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Create assignment</h2>
            <span className={styles.panelHint}>Appears in each student's task inbox</span>
          </div>
          <form className={styles.form} onSubmit={createAssignment}>
            <label>
              Title
              <input
                className={styles.input}
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="e.g. Rational numbers practice set"
              />
            </label>
            <label>
              Class
              <select
                className={styles.input}
                value={form.classId}
                onChange={(event) => setForm({ ...form, classId: event.target.value, subjectId: '' })}
              >
                <option value="">Choose a class</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select
                className={styles.input}
                value={form.subjectId}
                onChange={(event) => setForm({ ...form, subjectId: event.target.value })}
              >
                <option value="">General / all subjects</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Due date
              <input
                type="datetime-local"
                className={styles.input}
                value={form.dueAt}
                onChange={(event) => setForm({ ...form, dueAt: event.target.value })}
              />
            </label>
            <label>
              Instructions
              <textarea
                className={styles.input}
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="What should students submit?"
              />
            </label>
            <button type="submit" className={styles.primaryBtn} disabled={creating}>
              {creating ? <Loader2 size={14} className={styles.spin} /> : <BookOpenCheck size={14} />}
              Publish assignment
            </button>
          </form>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Published assignments</h2>
            <span className={styles.panelHint}>{assignments.length} total</span>
          </div>
          {assignments.length === 0 ? (
            <p className={styles.empty}>No assignments published yet.</p>
          ) : (
            <div className={styles.assignmentList}>
              {assignments.map((item) => (
                <div key={item.id} className={styles.assignmentItem}>
                  <div className={styles.assignmentTop}>
                    <strong>{item.title}</strong>
                    <span className={styles.statusBadge}>{item.status}</span>
                  </div>
                  <p className={styles.doubtMeta}>
                    {item.className || item.classId} · {item.subjectName || 'General'} · Due{' '}
                    {new Date(item.dueAt).toLocaleString()}
                  </p>
                  <span className={styles.submissionCount}>
                    {item.submissionCount || 0} submission(s)
                  </span>
                  {item.description && <p className={styles.doubtDetails}>{item.description}</p>}
                  <span className={styles.dueHint}>Due value: {toLocalDateTime(item.dueAt)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
