import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { api, ApiError } from '@/lib/api';

type SubmissionStatus = 'NEW' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'ACCEPTED' | 'REJECTED' | 'CONTACTED';

type Submission = {
  id: string;
  submissionId: string;
  fullName: string;
  email: string;
  contact: string;
  industry: string;
  title: string;
  description: string;
  resources: string;
  status: SubmissionStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS: SubmissionStatus[] = ['NEW', 'UNDER_REVIEW', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'CONTACTED'];

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Submission | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<SubmissionStatus>('NEW');

  // Guard: confirm there's an active admin session before showing anything.
  useEffect(() => {
    api
      .get<{ email: string }>('/api/auth/me')
      .then((me) => setAdminEmail(me.email))
      .catch(() => navigate('/admin/login'))
      .finally(() => setCheckingAuth(false));
  }, [navigate]);

  const loadSubmissions = () => {
    setListLoading(true);
    setListError(null);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    api
      .get<{ submissions: Submission[]; total: number }>(`/api/admin/submissions?${params.toString()}`)
      .then((res) => {
        setSubmissions(res.submissions);
        setTotal(res.total);
      })
      .catch((err) => setListError(err instanceof ApiError ? err.message : 'Could not load submissions.'))
      .finally(() => setListLoading(false));
  };

  useEffect(() => {
    if (checkingAuth) return;
    loadSubmissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth, search, statusFilter]);

  const openDetail = (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    api
      .get<{ submission: Submission }>(`/api/admin/submissions/${id}`)
      .then((res) => {
        setDetail(res.submission);
        setStatusDraft(res.submission.status);
        setNotesDraft(res.submission.adminNotes || '');
      })
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  };

  const saveDetail = async () => {
    if (!selectedId) return;
    setSavingStatus(true);
    try {
      const res = await api.patch<{ submission: Submission }>(`/api/admin/submissions/${selectedId}`, {
        status: statusDraft,
        adminNotes: notesDraft,
      });
      setDetail(res.submission);
      setSubmissions((current) => current.map((s) => (s.id === res.submission.id ? res.submission : s)));
    } catch {
      // Keep it simple: surface via the same error banner pattern as the list.
      setListError('Could not save changes. Please try again.');
    } finally {
      setSavingStatus(false);
    }
  };

  const logout = async () => {
    await api.post('/api/auth/logout').catch(() => {});
    navigate('/admin/login');
  };

  const formattedDate = useMemo(
    () => (iso: string) =>
      new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }),
    [],
  );

  if (checkingAuth) {
    return (
      <div className="admin-shell">
        <div className="admin-container">Checking session…</div>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <div className="admin-container">
        <div className="admin-header">
          <div>
            <h1>Startup submissions</h1>
            <span>{adminEmail ? `Signed in as ${adminEmail}` : ''} · {total} total</span>
          </div>
          <button className="admin-button secondary" onClick={logout}>Log out</button>
        </div>

        <div className="admin-card">
          <div className="admin-toolbar">
            <input
              type="search"
              placeholder="Search by name, email, or title…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {listError && <div className="admin-error" role="alert">{listError}</div>}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Submission</th>
                  <th>Founder</th>
                  <th>Industry</th>
                  <th>Status</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {listLoading && (
                  <tr><td colSpan={5}>Loading…</td></tr>
                )}
                {!listLoading && submissions.length === 0 && (
                  <tr><td colSpan={5}>No submissions match yet.</td></tr>
                )}
                {!listLoading && submissions.map((submission) => (
                  <tr key={submission.id} onClick={() => openDetail(submission.id)}>
                    <td>{submission.submissionId}<br /><small>{submission.title}</small></td>
                    <td>{submission.fullName}<br /><small>{submission.email}</small></td>
                    <td>{submission.industry}</td>
                    <td><span className="admin-badge">{submission.status.replace('_', ' ')}</span></td>
                    <td>{formattedDate(submission.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedId && (
          <div className="admin-card" style={{ marginTop: 20 }}>
            {detailLoading && <div>Loading submission…</div>}
            {!detailLoading && detail && (
              <>
                <div className="admin-detail-grid">
                  <div>
                    <div className="admin-detail-label">Submission ID</div>
                    <div className="admin-detail-value">{detail.submissionId}</div>
                  </div>
                  <div>
                    <div className="admin-detail-label">Received</div>
                    <div className="admin-detail-value">{formattedDate(detail.createdAt)}</div>
                  </div>
                  <div>
                    <div className="admin-detail-label">Founder</div>
                    <div className="admin-detail-value">{detail.fullName}</div>
                  </div>
                  <div>
                    <div className="admin-detail-label">Industry</div>
                    <div className="admin-detail-value">{detail.industry}</div>
                  </div>
                  <div>
                    <div className="admin-detail-label">Email</div>
                    <div className="admin-detail-value">{detail.email}</div>
                  </div>
                  <div>
                    <div className="admin-detail-label">Phone</div>
                    <div className="admin-detail-value">{detail.contact}</div>
                  </div>
                  <div className="full">
                    <div className="admin-detail-label">Idea title</div>
                    <div className="admin-detail-value">{detail.title}</div>
                  </div>
                  <div className="full">
                    <div className="admin-detail-label">Description</div>
                    <div className="admin-detail-value">{detail.description}</div>
                  </div>
                  <div className="full">
                    <div className="admin-detail-label">Resources requested</div>
                    <div className="admin-detail-value">{detail.resources}</div>
                  </div>
                </div>

                <div className="admin-field">
                  <label htmlFor="status-select">Status</label>
                  <select
                    id="status-select"
                    value={statusDraft}
                    onChange={(event) => setStatusDraft(event.target.value as SubmissionStatus)}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-field">
                  <label htmlFor="notes-area">Internal notes</label>
                  <textarea
                    id="notes-area"
                    rows={4}
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                  />
                </div>
                <button className="admin-button" onClick={saveDetail} disabled={savingStatus}>
                  {savingStatus ? 'Saving…' : 'Save changes'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
