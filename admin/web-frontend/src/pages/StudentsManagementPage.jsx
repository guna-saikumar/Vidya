import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  BookOpen,
  Bookmark,
  TrendingUp,
  School,
  Clock,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './StudentsManagementPage.module.css';

export const StudentsManagementPage = () => {
  const [search, setSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [page, setPage] = useState(1);

  const [studentsData, setStudentsData] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Modals & Feedback
  const [feedback, setFeedback] = useState(null);
  const [inspectStudent, setInspectStudent] = useState(null); // detailed student obj
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [deletingStudentId, setDeletingStudentId] = useState(null);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const loadStudents = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search.trim()) params.search = search.trim();
    if (selectedGrade) params.grade = parseInt(selectedGrade, 10);
    if (selectedSection) params.section = selectedSection;

    adminService
      .getStudents(params)
      .then((data) => {
        setStudentsData(data || { items: [], total: 0, page: 1, pages: 1 });
      })
      .catch((err) => notify('error', err.message))
      .finally(() => setLoading(false));
  }, [page, search, selectedGrade, selectedSection, notify]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Open Details Modal
  const handleOpenDetails = async (id) => {
    setLoadingDetails(true);
    try {
      const data = await adminService.getStudentDetails(id);
      setInspectStudent(data);
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (student) => {
    setEditingStudent({
      id: student.id,
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      grade: student.grade || 8,
      section: student.section || 'A',
      schoolName: student.schoolName || '',
      rollNumber: student.rollNumber || '',
      medium: student.medium || 'English',
      district: student.district || '',
      villageCity: student.villageCity || '',
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      await adminService.updateStudent(editingStudent.id, {
        firstName: editingStudent.firstName.trim(),
        lastName: editingStudent.lastName.trim(),
        grade: parseInt(editingStudent.grade, 10),
        section: editingStudent.section.trim().toUpperCase(),
        schoolName: editingStudent.schoolName.trim(),
        rollNumber: editingStudent.rollNumber.trim(),
        medium: editingStudent.medium.trim(),
        district: editingStudent.district.trim(),
        villageCity: editingStudent.villageCity.trim(),
      });
      notify('success', 'Student record updated successfully.');
      setEditingStudent(null);
      loadStudents();
    } catch (err) {
      notify('error', err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudentId) return;
    try {
      await adminService.deleteStudent(deletingStudentId);
      notify('success', 'Student record and progress deleted.');
      setDeletingStudentId(null);
      loadStudents();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Toast Feedback */}
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

      {/* Intro Header */}
      <div className={styles.pageIntro}>
        <div>
          <h2 className={styles.pageHeading}>Enrolled Students Management</h2>
          <p className={styles.pageSubheading}>
            Manage enrolled students, academic grades, syllabus completion, and learning records
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className={styles.tableCard}>
        {/* Filter and Search Bar */}
        <div className={styles.filtersHeader}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by student name, roll number, email, school..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.selectFilters}>
            <select
              className={styles.filterSelect}
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Grades (6–10)</option>
              <option value="6">Class 6</option>
              <option value="7">Class 7</option>
              <option value="8">Class 8</option>
              <option value="9">Class 9</option>
              <option value="10">Class 10</option>
            </select>

            <select
              className={styles.filterSelect}
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <span>Loading student records...</span>
            </div>
          ) : studentsData.items.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={40} color="var(--text-muted)" />
              <p className={styles.emptyTitle}>No students found</p>
              <p className={styles.emptyText}>
                No student accounts matched your query or filter criteria.
              </p>
            </div>
          ) : (
            <table className={styles.studentsTable}>
              <thead>
                <tr>
                  <th>Student Info</th>
                  <th>Class & Section</th>
                  <th>School</th>
                  <th>Roll #</th>
                  <th>Onboarded</th>
                  <th>Chapters Done</th>
                  <th>Bookmarks</th>
                  <th className={styles.alignRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {studentsData.items.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <div className={styles.studentCell}>
                        <div className={styles.studentAvatar}>
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className={styles.studentName}>{student.name}</span>
                          <span className={styles.studentEmail}>{student.email}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={styles.gradeBadge}>
                        {student.grade ? `Class ${student.grade}` : 'Unassigned'}
                        {student.section ? ` - Sec ${student.section}` : ''}
                      </span>
                    </td>

                    <td>
                      <span className={styles.schoolText} title={student.schoolName}>
                        {student.schoolName || 'Not Set'}
                      </span>
                    </td>

                    <td>
                      <span className={styles.rollText}>{student.rollNumber || '—'}</span>
                    </td>

                    <td>
                      {student.isOnboarded ? (
                        <span className={styles.badgeOnboarded}>Complete</span>
                      ) : (
                        <span className={styles.badgePending}>Pending</span>
                      )}
                    </td>

                    <td>
                      <div className={styles.progressCell}>
                        <CheckCircle2 size={15} color="var(--success)" />
                        <span>{student.completedChaptersCount} chapters</span>
                      </div>
                    </td>

                    <td>
                      <div className={styles.bookmarkCell}>
                        <Bookmark size={15} color="var(--primary)" />
                        <span>{student.bookmarksCount} saved</span>
                      </div>
                    </td>

                    <td className={styles.alignRight}>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleOpenDetails(student.id)}
                          title="View Complete Academic Progress"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className={styles.editBtn}
                          onClick={() => handleOpenEdit(student)}
                          title="Edit Student Profile"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => setDeletingStudentId(student.id)}
                          title="Delete Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {studentsData.pages > 1 && (
          <div className={styles.paginationBar}>
            <span className={styles.pageIndicator}>
              Page {studentsData.page} of {studentsData.pages} ({studentsData.total} students)
            </span>
            <div className={styles.pageButtons}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className={styles.pageBtn}
              >
                Previous
              </button>
              <button
                disabled={page >= studentsData.pages}
                onClick={() => setPage((p) => p + 1)}
                className={styles.pageBtn}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Student Modal */}
      {inspectStudent && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modalCard} ${styles.modalCardWide}`}>
            <div className={styles.modalHeader}>
              <div className={styles.modalStudentIntro}>
                <div className={styles.modalAvatar}>
                  {inspectStudent.profile?.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className={styles.modalTitle}>
                    {inspectStudent.profile?.name || 'Student Profile'}
                  </h3>
                  <span className={styles.modalEmail}>{inspectStudent.user.email}</span>
                </div>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setInspectStudent(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Profile Details Grid */}
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Class Grade</span>
                  <span className={styles.detailValue}>
                    Class {inspectStudent.profile?.grade || '—'} (Section {inspectStudent.profile?.section || '—'})
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>School Name</span>
                  <span className={styles.detailValue}>
                    {inspectStudent.profile?.schoolName || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Roll Number</span>
                  <span className={styles.detailValue}>
                    {inspectStudent.profile?.rollNumber || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Medium</span>
                  <span className={styles.detailValue}>
                    {inspectStudent.profile?.medium || 'English'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Father / Guardian</span>
                  <span className={styles.detailValue}>
                    {inspectStudent.profile?.fatherName || '—'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>District & City</span>
                  <span className={styles.detailValue}>
                    {[inspectStudent.profile?.villageCity, inspectStudent.profile?.district]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </span>
                </div>
              </div>

              {/* Progress Tracker Section */}
              <div className={styles.sectionDivider}>
                <h4 className={styles.sectionTitle}>
                  <TrendingUp size={16} color="var(--primary)" />
                  <span>Syllabus Progress Activity ({inspectStudent.progress.length} chapters started)</span>
                </h4>

                {inspectStudent.progress.length === 0 ? (
                  <p className={styles.noProgressText}>No chapter progress recorded yet.</p>
                ) : (
                  <div className={styles.progressList}>
                    {inspectStudent.progress.map((item, idx) => (
                      <div key={idx} className={styles.progressRow}>
                        <div className={styles.progressRowLeft}>
                          <span className={styles.chapterId}>Chapter: {item.chapterId}</span>
                          <span className={styles.progressDate}>
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.progressRowRight}>
                          <div className={styles.progressPercentBar}>
                            <div
                              className={styles.progressPercentFill}
                              style={{ width: `${item.progressPercent}%` }}
                            />
                          </div>
                          <span className={styles.percentText}>{item.progressPercent}%</span>
                          {item.completed && (
                            <span className={styles.completedBadge}>Completed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setInspectStudent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Student Details</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setEditingStudent(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className={styles.editForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>First Name</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={editingStudent.firstName}
                    onChange={(e) =>
                      setEditingStudent((p) => ({ ...p, firstName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Last Name</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={editingStudent.lastName}
                    onChange={(e) =>
                      setEditingStudent((p) => ({ ...p, lastName: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Class Grade</label>
                  <select
                    className={styles.selectInput}
                    value={editingStudent.grade}
                    onChange={(e) =>
                      setEditingStudent((p) => ({ ...p, grade: e.target.value }))
                    }
                  >
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Section</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={editingStudent.section}
                    onChange={(e) =>
                      setEditingStudent((p) => ({
                        ...p,
                        section: e.target.value.toUpperCase(),
                      }))
                    }
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Roll Number</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={editingStudent.rollNumber}
                    onChange={(e) =>
                      setEditingStudent((p) => ({ ...p, rollNumber: e.target.value }))
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.fieldLabel}>Medium</label>
                  <select
                    className={styles.selectInput}
                    value={editingStudent.medium}
                    onChange={(e) =>
                      setEditingStudent((p) => ({ ...p, medium: e.target.value }))
                    }
                  >
                    <option value="English">English</option>
                    <option value="Telugu">Telugu</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>School Name</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={editingStudent.schoolName}
                  onChange={(e) =>
                    setEditingStudent((p) => ({ ...p, schoolName: e.target.value }))
                  }
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditingStudent(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {deletingStudentId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <h3 className={styles.modalTitle}>Delete Student Account</h3>
            <p className={styles.deleteWarningText}>
              Are you sure you want to remove this student? All their progress records,
              bookmarks, and portal data will be permanently wiped.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeletingStudentId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteConfirm}
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
