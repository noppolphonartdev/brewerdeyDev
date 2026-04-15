export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export const resolveMediaUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE_URL}${url}`;
};
