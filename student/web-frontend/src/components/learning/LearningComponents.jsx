import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Camera,
  CheckCircle2,
  Clock,
  Flame,
  Headphones,
  HelpCircle,
  Languages,
  Loader2,
  Send,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { learningService, speakText, stopSpeaking } from '../../services/learningService';
import styles from './Learning.module.css';

const EMPTY_OVERVIEW = {
  gamification: {
    streakDays: 0,
    xp: 0,
    level: 1,
    xpToNextLevel: 100,
    badges: [],
    weeklyGoal: { targetMinutes: 120, progressMinutes: 0, percent: 0 },
  },
  tasks: [],
  doubts: [],
  glossary: [],
};

const formatDue = (value) => {
  if (!value) return 'No due date';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const statusLabel = (status) =>
  ({
    open: 'Open',
    escalated: 'With teacher',
    answered: 'Answered',
    resolved: 'Resolved',
    pending: 'To do',
    submitted: 'Submitted',
    late: 'Late',
    graded: 'Graded',
  }[status] || status);

export const DoubtComposer = ({ context = {}, compact = false, onCreated }) => {
  const [question, setQuestion] = useState('');
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState(null);
  const [escalate, setEscalate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (question.trim().length < 8) {
      setMessage('Please describe your doubt in at least 8 characters.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const result = await learningService.askDoubt({
        question: question.trim(),
        details: details.trim(),
        photo,
        escalate,
        ...context,
      });
      setQuestion('');
      setDetails('');
      setPhoto(null);
      setEscalate(false);
      setMessage(
        escalate
          ? 'Sent to your teacher for escalation.'
          : 'Doubt posted. A teacher can review it from the learning desk.'
      );
      onCreated?.(result?.doubt);
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Could not post your doubt. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className={`${styles.card} ${compact ? styles.compactCard : ''}`} onSubmit={submit}>
      <div className={styles.cardHead}>
        <span className={`${styles.iconBox} ${styles.iconPeach}`}>
          <HelpCircle size={18} />
        </span>
        <div>
          <h3 className={styles.cardTitle}>Ask a doubt</h3>
          <p className={styles.cardSubtitle}>Attach a photo of the problem — a teacher can review it.</p>
        </div>
      </div>

      <textarea
        className={styles.input}
        rows={compact ? 2 : 3}
        placeholder="e.g. Why can't the denominator be zero?"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
      />
      {!compact && (
        <textarea
          className={styles.input}
          rows={2}
          placeholder="What have you tried so far? (optional)"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
        />
      )}

      <div className={styles.formRow}>
        <label className={styles.fileButton}>
          <Camera size={15} />
          <span>{photo ? photo.name : 'Add photo'}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setPhoto(event.target.files?.[0] || null)}
          />
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={escalate}
            onChange={(event) => setEscalate(event.target.checked)}
          />
          Escalate to teacher
        </label>
      </div>

      <button type="submit" className={styles.primaryButton} disabled={busy}>
        {busy ? <Loader2 size={15} className={styles.spin} /> : <Send size={15} />}
        {busy ? 'Posting…' : 'Post doubt'}
      </button>
      {message && <p className={styles.feedback}>{message}</p>}
    </form>
  );
};

const GamificationCard = ({ gamification, onRecordSession }) => {
  const week = gamification?.weeklyGoal || EMPTY_OVERVIEW.gamification.weeklyGoal;
  const badges = gamification?.badges || [];

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`${styles.iconBox} ${styles.iconAmber}`}>
          <Flame size={18} />
        </span>
        <div>
          <h3 className={styles.cardTitle}>Streak, XP & goals</h3>
          <p className={styles.cardSubtitle}>Small sessions add up to big progress.</p>
        </div>
      </div>

      <div className={styles.metricRow}>
        <div className={styles.metric}>
          <strong>{gamification?.streakDays ?? 0}</strong>
          <span>day streak</span>
        </div>
        <div className={styles.metric}>
          <strong>{gamification?.xp ?? 0}</strong>
          <span>XP</span>
        </div>
        <div className={styles.metric}>
          <strong>Level {gamification?.level ?? 1}</strong>
          <span>{(gamification?.xpToNextLevel ?? 100)} XP to next</span>
        </div>
      </div>

      <div className={styles.goalHeader}>
        <span>Weekly goal</span>
        <strong>
          {week.progressMinutes}/{week.targetMinutes} min
        </strong>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${Math.min(100, week.percent || 0)}%` }} />
      </div>

      <div className={styles.badgeRow}>
        {badges.length === 0 ? (
          <span className={styles.muted}>Complete a session to earn your first badge.</span>
        ) : (
          badges.slice(0, 4).map((badge) => (
            <span key={badge.code} className={styles.badge} title={badge.description}>
              <Award size={13} /> {badge.name}
            </span>
          ))
        )}
      </div>

      <button type="button" className={styles.secondaryButton} onClick={onRecordSession}>
        <Sparkles size={15} /> Log a 15-minute session
      </button>
    </div>
  );
};

const TaskInboxCard = ({ tasks, onSubmit }) => {
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  const submit = async (task) => {
    if (!(notes[task.id] || '').trim()) return;
    setBusyId(task.id);
    try {
      await onSubmit(task.id, notes[task.id].trim());
      setNotes((current) => ({ ...current, [task.id]: '' }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`${styles.iconBox} ${styles.iconLavender}`}>
          <BookOpen size={18} />
        </span>
        <div>
          <h3 className={styles.cardTitle}>Teacher task inbox</h3>
          <p className={styles.cardSubtitle}>Assignments with due dates from your teacher.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <p className={styles.muted}>No assignments yet. Your teacher's tasks will appear here.</p>
      ) : (
        <div className={styles.taskList}>
          {tasks.slice(0, 5).map((task) => {
            const done = ['submitted', 'late', 'graded'].includes(task.status);
            return (
              <div key={task.id} className={styles.taskItem}>
                <div className={styles.taskTop}>
                  <strong>{task.title}</strong>
                  <span className={`${styles.chip} ${done ? styles.chipDone : styles.chipDue}`}>
                    {statusLabel(task.status)}
                  </span>
                </div>
                <div className={styles.taskMeta}>
                  <span>{task.subjectName}</span>
                  <span>
                    <Clock size={12} /> Due {formatDue(task.dueAt)}
                  </span>
                </div>
                {task.description && <p className={styles.taskDescription}>{task.description}</p>}
                {!done && (
                  <div className={styles.taskSubmit}>
                    <input
                      className={styles.input}
                      placeholder="Add a short submission note"
                      value={notes[task.id] || ''}
                      onChange={(event) =>
                        setNotes((current) => ({ ...current, [task.id]: event.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.smallButton}
                      disabled={busyId === task.id || !(notes[task.id] || '').trim()}
                      onClick={() => submit(task)}
                    >
                      {busyId === task.id ? <Loader2 size={13} className={styles.spin} /> : <CheckCircle2 size={13} />}
                      Submit
                    </button>
                  </div>
                )}
                {task.feedback && <p className={styles.feedback}>Teacher: {task.feedback}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const GlossaryCard = ({ entries }) => {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (item) =>
        item.term.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q) ||
        item.hindi.includes(search.trim())
    );
  }, [entries, search]);

  return (
    <div className={styles.card}>
      <div className={styles.cardHead}>
        <span className={`${styles.iconBox} ${styles.iconGreen}`}>
          <Languages size={18} />
        </span>
        <div>
          <h3 className={styles.cardTitle}>Bilingual glossary</h3>
          <p className={styles.cardSubtitle}>English / हिंदी definitions with audio.</p>
        </div>
      </div>
      <input
        className={styles.input}
        placeholder="Search a term…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className={styles.glossaryList}>
        {filtered.slice(0, 4).map((item) => (
          <div key={item.term} className={styles.glossaryItem}>
            <div>
              <strong>{item.term}</strong>
              <p>{item.english}</p>
              <p className={styles.hindi}>{item.hindi}</p>
            </div>
            <button
              type="button"
              className={styles.audioButton}
              title={`Read ${item.term} aloud`}
              onClick={() => speakText(`${item.term}. ${item.english}`, 'en-IN')}
            >
              <Volume2 size={15} />
            </button>
          </div>
        ))}
        {filtered.length === 0 && <p className={styles.muted}>No matching terms yet.</p>}
      </div>
    </div>
  );
};

export const LearningHub = ({ context = {} }) => {
  const [overview, setOverview] = useState(EMPTY_OVERVIEW);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const refresh = async () => {
    try {
      const data = await learningService.getOverview();
      setOverview({ ...EMPTY_OVERVIEW, ...data });
    } catch {
      // Keep the empty state; the student can still create doubts and tasks.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    return () => stopSpeaking();
  }, []);

  const recordSession = async () => {
    try {
      const result = await learningService.recordSession(15, context.chapterId);
      if (result?.gamification) {
        setOverview((current) => ({ ...current, gamification: result.gamification }));
      } else {
        await refresh();
      }
      setMessage(result?.newBadges?.length ? `Badge unlocked: ${result.newBadges.join(', ')}` : 'Session logged. Keep it up!');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Could not log the session.');
    }
  };

  const submitTask = async (id, note) => {
    try {
      await learningService.submitTask(id, note);
      await refresh();
      setMessage('Assignment submitted.');
    } catch (error) {
      setMessage(error?.response?.data?.error || 'Could not submit the assignment.');
    }
  };

  return (
    <section className={styles.hub}>
      <div className={styles.hubHeader}>
        <div>
          <h2 className={styles.hubTitle}>Your learning space</h2>
          <p className={styles.hubSubtitle}>
            Streaks, teacher tasks, doubts and bilingual help — on web and mobile.
          </p>
        </div>
        {loading && <Loader2 size={18} className={styles.spin} />}
      </div>
      {message && <p className={styles.hubMessage}>{message}</p>}
      <div className={styles.hubGrid}>
        <GamificationCard gamification={overview.gamification} onRecordSession={recordSession} />
        <TaskInboxCard tasks={overview.tasks || []} onSubmit={submitTask} />
        <DoubtComposer
          context={context}
          onCreated={(doubt) =>
            setOverview((current) => ({ ...current, doubts: [doubt, ...(current.doubts || [])] }))
          }
        />
        <GlossaryCard entries={overview.glossary || []} />
      </div>
    </section>
  );
};

export const ReaderTools = ({ text, entries = [], context = {} }) => {
  const [language, setLanguage] = useState('en-IN');

  return (
    <div className={styles.readerTools}>
      <button
        type="button"
        className={styles.toolButton}
        onClick={() => speakText(text, language)}
        title="Read this section aloud"
      >
        <Headphones size={15} /> Listen
      </button>
      <button
        type="button"
        className={styles.toolButton}
        onClick={() => setLanguage((current) => (current === 'en-IN' ? 'hi-IN' : 'en-IN'))}
        title="Switch read-aloud voice"
      >
        <Languages size={15} /> {language === 'en-IN' ? 'English' : 'हिंदी'}
      </button>
      <div className={styles.readerDoubt}>
        <DoubtComposer context={context} compact />
      </div>
      <span className={styles.glossaryHint}>{entries.length} glossary terms available as tooltips</span>
    </div>
  );
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const GlossaryText = ({ text, entries = [], onSpeak }) => {
  const parts = useMemo(() => {
    if (!text || entries.length === 0) return [text];
    const terms = entries.map((entry) => entry.term).sort((a, b) => b.length - a.length);
    const pattern = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi');
    return text.split(pattern);
  }, [text, entries]);

  if (entries.length === 0) return <>{text}</>;

  return (
    <>
      {parts.map((part, index) => {
        const entry = entries.find((item) => item.term.toLowerCase() === part.toLowerCase());
        if (!entry) return <React.Fragment key={index}>{part}</React.Fragment>;
        return (
          <span
            key={index}
            className={styles.glossaryTerm}
            title={`${entry.term}\n${entry.english}\n${entry.hindi}`}
            onClick={() => onSpeak?.(`${entry.term}. ${entry.english}`)}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};
