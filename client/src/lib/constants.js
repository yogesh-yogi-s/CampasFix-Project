export const COMPLAINT_CATEGORIES = [
  'Classroom',
  'Laboratory',
  'Hostel',
  'Wi-Fi',
  'Infrastructure',
  'Transportation',
  'Cleanliness',
  'General Facilities & Utilities',
  'Other'
];

export const COMPLAINT_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export const normalizeComplaintCategory = (value) => {
  if (!value) return 'Other';
  const trimmed = String(value).trim();
  const normalized = COMPLAINT_CATEGORIES.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return normalized || 'Other';
};

export const normalizeComplaintPriority = (value) => {
  if (!value) return 'Low';
  const trimmed = String(value).trim();
  const normalized = COMPLAINT_PRIORITIES.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  return normalized || 'Low';
};

/** Base URL for uploaded files (no trailing slash). */
export const getUploadsBaseUrl = () =>
  (process.env.NEXT_PUBLIC_UPLOADS_URL || 'http://localhost:5000').replace(/\/$/, '');

/** Resolve a stored attachment path or absolute URL to a full download link. */
export const resolveAttachmentUrl = (url) => {
  if (!url) return '#';
  if (/^https?:\/\//i.test(url)) return url;
  return `${getUploadsBaseUrl()}${url.startsWith('/') ? url : `/${url}`}`;
};
