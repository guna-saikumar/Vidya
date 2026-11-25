import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Layers,
  ArrowRight,
  CheckCircle2,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './CurriculumClassesPage.module.css';

export const CurriculumClassesPage = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  useEffect(() => {
    adminService
      .getClasses()
      .then((data) => {
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClassId(data[0].id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    setLoadingSubjects(true);
    adminService
      .getSubjects(selectedClassId)
      .then((data) => setSubjects(data || []))
      .catch((err) => console.error(err))
      .finally(() => setLoadingSubjects(false));
  }, [selectedClassId]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageIntro}>
        <div>
          <h2 className={styles.pageHeading}>Curriculum & Class Syllabi</h2>
          <p className={styles.pageSubheading}>
            AP SCERT State Board Academic Standard 2026–27 classes and subject streams
          </p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Loader2 size={32} className={styles.spinner} />
          <span>Loading classes...</span>
        </div>
      ) : (
        <>
          {/* Class Selector Tabs */}
          <div className={styles.classTabs}>
            {classes.map((cls) => (
              <button
                key={cls.id}
                className={`${styles.classTab} ${
                  selectedClassId === cls.id ? styles.classTabActive : ''
                }`}
                onClick={() => setSelectedClassId(cls.id)}
              >
                <GraduationCap size={18} />
                <span>{cls.title}</span>
                <span className={styles.gradePill}>Grade {cls.grade}</span>
              </button>
            ))}
          </div>

          {/* Class Overview Banner */}
          {selectedClass && (
            <div className={styles.classBanner}>
              <div className={styles.classBannerLeft}>
                <div className={styles.bannerIcon}>
                  <BookOpen size={24} color="var(--primary)" />
                </div>
                <div>
                  <h3 className={styles.bannerTitle}>
                    {selectedClass.title} Curriculum Structure
                  </h3>
                  <p className={styles.bannerSubtitle}>
                    {subjects.length} Subjects configured for students in Grade {selectedClass.grade}
                  </p>
                </div>
              </div>

              <Link
                to={`/books`}
                className={styles.uploadClassBtn}
              >
                <UploadCloud size={16} />
                <span>Upload Material for {selectedClass.title}</span>
              </Link>
            </div>
          )}

          {/* Subjects Grid */}
          <div className={styles.subjectsSection}>
            <h3 className={styles.sectionHeading}>Configured Subjects</h3>

            {loadingSubjects ? (
              <div className={styles.loadingContainer}>
                <Loader2 size={24} className={styles.spinner} />
                <span>Loading subjects...</span>
              </div>
            ) : subjects.length === 0 ? (
              <p className={styles.emptyText}>No subjects found for this class.</p>
            ) : (
              <div className={styles.subjectsGrid}>
                {subjects.map((sub) => (
                  <div key={sub.id} className={styles.subjectCard}>
                    <div className={styles.subjectTop}>
                      <div className={styles.subjectIconWrap}>
                        <Layers size={20} color="var(--primary)" />
                      </div>
                      <span className={styles.subjectCategoryBadge}>
                        {sub.category || 'Core'}
                      </span>
                    </div>

                    <h4 className={styles.subjectTitle}>{sub.name}</h4>
                    <p className={styles.subjectDesc}>
                      {sub.description || 'SCERT Textbook & Notes'}
                    </p>

                    <div className={styles.subjectFooter}>
                      <span className={styles.chapterCount}>
                        {sub.chaptersCount || 0} Chapters
                      </span>
                      <Link
                        to={`/books`}
                        className={styles.materialLink}
                        title="View & Upload Study Materials"
                      >
                        <span>Materials</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
