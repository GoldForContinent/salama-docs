// XSS sanitize helper — escapes HTML special characters in user-submitted strings
// Use on ALL user-controlled data before inserting via innerHTML

export function esc(str) {
  if (str == null) return '';
  const s = String(str);
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return s.replace(/[&<>"']/g, ch => map[ch]);
}

// Sanitize an entire object's string fields in place (for formData before display)
export function sanitizeObj(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') obj[key] = esc(obj[key]);
  }
  return obj;
}
