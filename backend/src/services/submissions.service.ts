import { pool } from '../config/db.js';
import type { SubmissionInput } from '../validators/submission.validator.js';
import { NotFoundError } from '../utils/errors.js';

export type SubmissionRow = {
  id: string;
  submission_id: string;
  full_name: string;
  email: string;
  phone: string;
  startup_industry: string;
  idea_title: string;
  idea_description: string;
  resources_required: string;
  status: string;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export type Submission = {
  id: string;
  submissionId: string;
  fullName: string;
  email: string;
  contact: string;
  industry: string;
  title: string;
  description: string;
  resources: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

function toSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    submissionId: row.submission_id,
    fullName: row.full_name,
    email: row.email,
    contact: row.phone,
    industry: row.startup_industry,
    title: row.idea_title,
    description: row.idea_description,
    resources: row.resources_required,
    status: row.status,
    adminNotes: row.admin_notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function nextSubmissionId(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query<{ count: number }>(
    `INSERT INTO submission_counters (year, count) VALUES ($1, 1)
     ON CONFLICT (year) DO UPDATE SET count = submission_counters.count + 1
     RETURNING count`,
    [year],
  );
  const count = result.rows[0].count;
  return `MC-${year}-${String(count).padStart(5, '0')}`;
}

export const submissionsService = {
  async create(input: SubmissionInput): Promise<Submission> {
    const submissionId = await nextSubmissionId();
    const result = await pool.query<SubmissionRow>(
      `INSERT INTO startup_submissions
        (submission_id, full_name, email, phone, startup_industry, idea_title, idea_description, resources_required)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        submissionId,
        input.fullName,
        input.email,
        input.contact,
        input.industry,
        input.title,
        input.description,
        input.resources,
      ],
    );
    return toSubmission(result.rows[0]);
  },

  async list(options: { search?: string; status?: string }): Promise<{ submissions: Submission[]; total: number }> {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (options.status) {
      params.push(options.status);
      conditions.push(`status = $${params.length}`);
    }
    if (options.search) {
      params.push(`%${options.search}%`);
      const idx = params.length;
      conditions.push(
        `(full_name ILIKE $${idx} OR email ILIKE $${idx} OR idea_title ILIKE $${idx} OR submission_id ILIKE $${idx})`,
      );
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [rows, count] = await Promise.all([
      pool.query<SubmissionRow>(
        `SELECT * FROM startup_submissions ${where} ORDER BY created_at DESC LIMIT 200`,
        params,
      ),
      pool.query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM startup_submissions ${where}`, params),
    ]);

    return { submissions: rows.rows.map(toSubmission), total: Number(count.rows[0].count) };
  },

  async getById(id: string): Promise<Submission> {
    const result = await pool.query<SubmissionRow>('SELECT * FROM startup_submissions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      throw new NotFoundError('Submission not found.');
    }
    return toSubmission(result.rows[0]);
  },

  async updateStatus(id: string, updates: { status?: string; adminNotes?: string }): Promise<Submission> {
    const result = await pool.query<SubmissionRow>(
      `UPDATE startup_submissions
       SET status = COALESCE($2, status),
           admin_notes = COALESCE($3, admin_notes)
       WHERE id = $1
       RETURNING *`,
      [id, updates.status ?? null, updates.adminNotes ?? null],
    );
    if (result.rows.length === 0) {
      throw new NotFoundError('Submission not found.');
    }
    return toSubmission(result.rows[0]);
  },
};
