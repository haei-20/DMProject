import { DEFAULT_PRODUCT_IMAGE_URL } from '../constants/defaultProductImageUrl';

/** Ảnh sản phẩm trong combo (URL đầy đủ, /path, hoặc file uploads) */
export function resolveComboProductImage(image) {
  if (!image || typeof image !== 'string') return DEFAULT_PRODUCT_IMAGE_URL;
  const trimmed = image.trim();
  if (!trimmed) return DEFAULT_PRODUCT_IMAGE_URL;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/')) return trimmed;
  return `/uploads/${trimmed.split('/').pop()}`;
}
