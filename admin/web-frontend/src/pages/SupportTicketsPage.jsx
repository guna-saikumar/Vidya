import React, { useState, useEffect, useCallback } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  User,
  MessageSquare,
  Loader2,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import styles from './SupportTicketsPage.module.css';

export const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [updating, setUpdating] = useState(false);

  const notify = useCallback((type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  }, []);

  const loadTickets = useCallback(() => {
    setLoading(true);
    adminService
      .getComplaints()
      .then((data) => setTickets(data || []))
      .catch((err) => notify('error', err.message))
      .finally(() => setLoading(false));
  }, [notify]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleUpdateStatus = async (ticketRef, newStatus) => {
    try {
      setUpdating(true);
      await adminService.updateComplaintStatus(ticketRef, newStatus);
      notify('success', `Ticket ${ticketRef} status updated to ${newStatus}.`);
      if (selectedTicket) {
        setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
      }
      loadTickets();
    } catch (err) {
      notify('error', err.message);
    } finally {
      setUpdating(false);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesSearch =
      t.ticket_ref?.toLowerCase().includes(search.toLowerCase()) ||
      t.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.message?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'resolved':
        return styles.badgeResolved;
      case 'in_progress':
        return styles.badgeProgress;
      default:
        return styles.badgeOpen;
    }
  };

  return (
    <div className={styles.pageContainer}>
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
          <h2 className={styles.pageHeading}>Student Support Desk</h2>
          <p className={styles.pageSubheading}>
            Manage student grievances, textbook download problems, and technical inquiries
          </p>
        </div>
      </div>

      <div className={styles.tableCard}>
        {/* Filters Header */}
        <div className={styles.filtersHeader}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by ticket ref, student name, query..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.statusFilters}>
            {['all', 'open', 'in_progress', 'resolved'].map((st) => (
              <button
                key={st}
                className={`${styles.statusFilterBtn} ${
                  filterStatus === st ? styles.statusFilterActive : ''
                }`}
                onClick={() => setFilterStatus(st)}
              >
                {st === 'all'
                  ? 'All Tickets'
                  : st === 'in_progress'
                  ? 'In Progress'
                  : st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <div className={styles.tableWrapper}>
          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <span>Loading tickets...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className={styles.emptyState}>
              <LifeBuoy size={40} color="var(--text-muted)" />
              <p className={styles.emptyTitle}>No support tickets found</p>
              <p className={styles.emptyText}>
                There are currently no tickets matching this filter.
              </p>
            </div>
          ) : (
            <table className={styles.ticketsTable}>
              <thead>
                <tr>
                  <th>Ticket Ref</th>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Category</th>
                  <th>Subject & Summary</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className={styles.alignRight}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={styles.ticketRef}>{item.ticket_ref}</span>
                    </td>
                    <td>
                      <span className={styles.studentName}>{item.full_name}</span>
                    </td>
                    <td>
                      <span className={styles.gradeBadge}>Class {item.class_grade}</span>
                    </td>
                    <td>
                      <span className={styles.categoryBadge}>
                        {item.category?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div className={styles.subjectCell}>
                        <span className={styles.subjectText}>{item.subject}</span>
                        <span className={styles.messageSnippet}>{item.message}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(
                          item.status
                        )}`}
                      >
                        {item.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dateText}>
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className={styles.alignRight}>
                      <button
                        className={styles.viewBtn}
                        onClick={() => setSelectedTicket(item)}
                      >
                        View & Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ticket Details & Resolution Modal */}
      {selectedTicket && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <div>
                <span className={styles.ticketPill}>{selectedTicket.ticket_ref}</span>
                <h3 className={styles.modalTitle}>{selectedTicket.subject}</h3>
              </div>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setSelectedTicket(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.studentMetaBox}>
                <div>
                  <span className={styles.metaLabel}>Student Name</span>
                  <span className={styles.metaVal}>{selectedTicket.full_name}</span>
                </div>
                <div>
                  <span className={styles.metaLabel}>Academic Grade</span>
                  <span className={styles.metaVal}>Class {selectedTicket.class_grade}</span>
                </div>
                <div>
                  <span className={styles.metaLabel}>Category</span>
                  <span className={styles.metaVal}>{selectedTicket.category?.replace(/_/g, ' ')}</span>
                </div>
              </div>

              <div className={styles.messageBox}>
                <span className={styles.metaLabel}>Full Inquiry / Message</span>
                <p className={styles.fullMessage}>{selectedTicket.message}</p>
              </div>

              <div className={styles.statusUpdateRow}>
                <span className={styles.metaLabel}>Update Ticket Status:</span>
                <div className={styles.statusOptions}>
                  {['open', 'in_progress', 'resolved'].map((st) => (
                    <button
                      key={st}
                      disabled={updating}
                      className={`${styles.statusOptionBtn} ${
                        selectedTicket.status === st ? styles.statusOptionActive : ''
                      }`}
                      onClick={() => handleUpdateStatus(selectedTicket.ticket_ref, st)}
                    >
                      {st === 'in_progress' ? 'In Progress' : st.charAt(0).toUpperCase() + st.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedTicket(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
