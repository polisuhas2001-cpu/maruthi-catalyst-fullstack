import { z } from 'zod';

// Generous but bounded limits — enough room for a genuine detailed pitch,
// small enough to block abuse (giant payloads, scraped text dumps, etc.).
export const submissionSchema = z.object({
  fullName: z.string().trim().min(2, 'Please share your full name.').max(120),
  email: z.string().trim().email('Please enter a valid email address.').max(200),
  contact: z.string().trim().min(6, 'Please share a reachable contact number.').max(30),
  industry: z.string().trim().min(2, 'Please choose an industry.').max(80),
  title: z.string().trim().min(3, 'Please give your idea a working title.').max(160),
  description: z.string().trim().min(20, 'Please add a bit more detail about the idea.').max(5000),
  resources: z.string().trim().min(2, 'Please tell us what resources you need.').max(2000),
  // Honeypot — must always arrive empty from a real browser.
  website: z.string().max(0, 'Submission rejected.').optional().default(''),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;

export function formatZodFieldErrors(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
}
