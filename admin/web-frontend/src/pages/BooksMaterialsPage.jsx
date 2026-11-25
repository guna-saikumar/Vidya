import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Search,
  Filter,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  BookOpen,
  ArrowUpDown,
  Download,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './BooksMaterialsPage.module.css';

const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const BooksMaterialsPage = () => {
  const [classes, setClasses] = useState([]);
  const [uploadSubjects, setUploadSubjects] = useState([]);
  const [filterSubjects, setFilterSubjects] = useState([]);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    classId: '',
    subjectId: '',
    title: '',
    file: null,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Filter & Search State
  const [search, setSearch] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [page, setPage] = useState(1);

  // Materials List State
  const [materialsData, setMaterialsData] = useState({
    items: [],
    total: 0,
    page: 1,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Notifications & Modals
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message }
  const [editingMaterial, setEditingMaterial] = useState(null); // material object
  const [deletingId, setDeletingId] = useState(null);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  // Load Classes
  useEffect(() => {
    adminService
      .getClasses()
      .then((data) => setClasses(data || []))
      .catch((err) => notify('error', err.message));
  }, [notify]);

  // Load subjects for upload form
  useEffect(() => {
    if (!uploadForm.classId) {
      setUploadSubjects([]);
      setUploadForm((prev) => ({ ...prev, subjectId: '' }));
      return;
    }
    adminService
      .getSubjects(uploadForm.classId)
      .then((data) => setUploadSubjects(data || []))
      .catch((err) => notify('error', err.message));
  }, [uploadForm.classId, notify]);

  // Load subjects for filter
  useEffect(() => {
    if (!selectedClassFilter) {
      setFilterSubjects([]);
      setSelectedSubjectFilter('');
      return;
    }
    adminService
      .getSubjects(selectedClassFilter)
      .then((data) => setFilterSubjects(data || []))
      .catch((err) => notify('error', err.message));
  }, [selectedClassFilter, notify]);

  // Fetch materials list
  const loadMaterials = useCallback(() => {
    setLoading(true);
    const params = {
      page,
      limit: 10,
    };
    if (search.trim()) params.search = search.trim();
    if (selectedClassFilter) params.classId = selectedClassFilter;
    if (selectedSubjectFilter) params.subjectId = selectedSubjectFilter;

    adminService
      .getStudyMaterials(params)
      .then((data) => {
        setMaterialsData(data || { items: [], total: 0, page: 1, pages: 1 });
      })
      .catch((err) => notify('error', err.message))
      .finally(() => setLoading(false));
  }, [page, search, selectedClassFilter, selectedSubjectFilter, notify]);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  // Handle PDF Upload
  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      notify('error', 'Only PDF documents are permitted for study materials.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      notify('error', 'File size exceeds maximum permitted limit (50 MB).');
      return;
    }
    setUploadForm((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadForm.classId || !uploadForm.subjectId || !uploadForm.title.trim() || !uploadForm.file) {
      notify('error', 'Please fill in all upload fields and choose a PDF file.');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('class_id', uploadForm.classId);
      formData.append('subject_id', uploadForm.subjectId);
      formData.append('title', uploadForm.title.trim());
      formData.append('file', uploadForm.file);

      await adminService.uploadStudyMaterial(formData, (progress) => {
        setUploadProgress(progress);
      });

      notify('success', `"${uploadForm.title}" uploaded successfully!`);
      setUploadForm({ classId: '', subjectId: '', title: '', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadMaterials();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      await adminService.updateStudyMaterial(editingMaterial.id, {
        title: editingMaterial.title.trim(),
        subjectId: editingMaterial.subjectId,
      });
      notify('success', 'Book details updated successfully.');
      setEditingMaterial(null);
      loadMaterials();
    } catch (err) {
      notify('error', err.message);
    }
  };

  // Handle Delete
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      await adminService.deleteStudyMaterial(deletingId);
      notify('success', 'Study material removed from student portal.');
      setDeletingId(null);
      loadMaterials();
    } catch (err) {
      notify('error', err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Feedback Toast */}
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

      {/* Page Header Intro */}
      <div className={styles.pageIntro}>
        <div>
          <h2 className={styles.pageHeading}>Books & PDF Study Materials</h2>
          <p className={styles.pageSubheading}>
            Upload textbooks, syllabus notes, and chapter guides for classes 6 to 10
          </p>
        </div>
      </div>

      {/* Grid: Upload Box + Listing */}
      <div className={styles.gridContainer}>
        {/* Upload Card */}
        <div className={styles.uploadCard}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <UploadCloud size={20} color="var(--primary)" />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Upload New Material</h3>
              <p className={styles.cardSubtitle}>PDF up to 50MB with instant student access</p>
            </div>
          </div>

          <form onSubmit={handleUploadSubmit} className={styles.uploadForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Select Class *</label>
                <select
                  className={styles.selectInput}
                  value={uploadForm.classId}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, classId: e.target.value }))
                  }
                  required
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.title} (Grade {cls.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Select Subject *</label>
                <select
                  className={styles.selectInput}
                  value={uploadForm.subjectId}
                  onChange={(e) =>
                    setUploadForm((prev) => ({ ...prev, subjectId: e.target.value }))
                  }
                  disabled={!uploadForm.classId}
                  required
                >
                  <option value="">-- Choose Subject --</option>
                  {uploadSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Book / Chapter Title *</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="e.g. Mathematics - Chapter 1 Real Numbers Notes"
                value={uploadForm.title}
                onChange={(e) =>
                  setUploadForm((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>

            {/* Drag & Drop File Zone */}
            <div
              className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${
                uploadForm.file ? styles.dropZoneSelected : ''
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="application/pdf"
                className={styles.hiddenFileInput}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {uploadForm.file ? (
                <div className={styles.selectedFileInfo}>
                  <FileText size={36} color="var(--primary)" />
                  <div className={styles.fileDetails}>
                    <span className={styles.fileName}>{uploadForm.file.name}</span>
                    <span className={styles.fileMeta}>
                      {formatSize(uploadForm.file.size)} &bull; Ready to upload
                    </span>
                  </div>
                  <button
                    type="button"
                    className={styles.removeFileBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadForm((prev) => ({ ...prev, file: null }));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className={styles.dropZonePlaceholder}>
                  <UploadCloud size={32} color="var(--text-muted)" />
                  <p className={styles.dropText}>
                    <strong>Click to browse</strong> or drag & drop PDF here
                  </p>
                  <span className={styles.dropSubtext}>SCERT syllabus materials &bull; Max 50 MB</span>
                </div>
              )}
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
              <div className={styles.progressBarWrapper}>
                <div className={styles.progressInfo}>
                  <span>Uploading to secure store...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className={styles.progressBarTrack}>
                  <div
                    className={styles.progressBarFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className={styles.uploadSubmitBtn}
              disabled={uploading || !uploadForm.file}
            >
              {uploading ? (
                <>
                  <Loader2 size={18} className={styles.spinner} />
                  <span>Uploading Material...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Publish Study Material</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Materials List */}
        <div className={styles.listCard}>
          <div className={styles.listHeader}>
            <div>
              <h3 className={styles.cardTitle}>Published Library</h3>
              <p className={styles.cardSubtitle}>
                {materialsData.total} items active in student curriculum
              </p>
            </div>

            {/* Filter Toolbar */}
            <div className={styles.filtersBar}>
              <div className={styles.searchBox}>
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search materials..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className={styles.searchInput}
                />
              </div>

              <select
                className={styles.filterSelect}
                value={selectedClassFilter}
                onChange={(e) => {
                  setSelectedClassFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.title}
                  </option>
                ))}
              </select>

              {selectedClassFilter && (
                <select
                  className={styles.filterSelect}
                  value={selectedSubjectFilter}
                  onChange={(e) => {
                    setSelectedSubjectFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Subjects</option>
                  {filterSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table Container */}
          <div className={styles.tableWrapper}>
            {loading ? (
              <div className={styles.loadingState}>
                <Loader2 size={32} className={styles.spinner} />
                <span>Loading study materials...</span>
              </div>
            ) : materialsData.items.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen size={40} color="var(--text-muted)" />
                <p className={styles.emptyTitle}>No study materials found</p>
                <p className={styles.emptyText}>
                  Use the upload form to add textbook PDFs for your students.
                </p>
              </div>
            ) : (
              <table className={styles.materialsTable}>
                <thead>
                  <tr>
                    <th>Title & Document</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Size</th>
                    <th>Published</th>
                    <th className={styles.alignRight}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materialsData.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.materialNameCell}>
                          <div className={styles.pdfIcon}>
                            <FileText size={18} color="var(--primary)" />
                          </div>
                          <div>
                            <span className={styles.materialTitle}>{item.title}</span>
                            <span className={styles.originalFileName}>
                              {item.originalFilename}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.classBadge}>
                          {item.className || `Class ${item.classId}`}
                        </span>
                      </td>
                      <td>
                        <span className={styles.subjectText}>
                          {item.subjectName || item.subjectId}
                        </span>
                      </td>
                      <td>
                        <span className={styles.sizeText}>{formatSize(item.byteSize)}</span>
                      </td>
                      <td>
                        <span className={styles.dateText}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className={styles.alignRight}>
                        <div className={styles.actionButtons}>
                          <a
                            href={adminService.getMaterialViewUrl(item.id)}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.viewActionBtn}
                            title="View PDF Document"
                          >
                            <Eye size={16} />
                          </a>
                          <button
                            className={styles.editActionBtn}
                            onClick={() => setEditingMaterial(item)}
                            title="Edit Title"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className={styles.deleteActionBtn}
                            onClick={() => setDeletingId(item.id)}
                            title="Delete Material"
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
          {materialsData.pages > 1 && (
            <div className={styles.paginationBar}>
              <span className={styles.pageIndicator}>
                Page {materialsData.page} of {materialsData.pages} ({materialsData.total} total)
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
                  disabled={page >= materialsData.pages}
                  onClick={() => setPage((p) => p + 1)}
                  className={styles.pageBtn}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingMaterial && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Study Material</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setEditingMaterial(null)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Material Title</label>
                <input
                  type="text"
                  className={styles.textInput}
                  value={editingMaterial.title}
                  onChange={(e) =>
                    setEditingMaterial((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setEditingMaterial(null)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Delete Study Material</h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setDeletingId(null)}
              >
                <X size={20} />
              </button>
            </div>
            <p className={styles.deleteWarningText}>
              Are you sure you want to delete this study material? Students will no longer
              be able to view or download this document.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={handleDeleteConfirm}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
