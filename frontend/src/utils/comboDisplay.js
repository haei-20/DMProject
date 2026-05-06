/** Ảnh sản phẩm trong combo (URL đầy đủ, /path, hoặc file uploads) */
export function resolveComboProductImage(image) {
  if (!image || typeof image !== 'string') return '/images/placeholder.png';
  const trimmed = image.trim();
  if (!trimmed) return '/images/placeholder.png';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/uploads/${trimmed.split('/').pop()}`;
}
