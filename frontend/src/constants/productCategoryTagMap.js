/**
 * Danh mục → danh sách nhãn (keyword IN HOA, đồng bộ seed / tên SP).
 * Bổ sung nhóm & từ khóa để hầu hết SP đều gán được ít nhất một nhãn khi chọn đúng danh mục.
 */

export const CATEGORY_TAG_MAP = {
  Lighting: [
    'LIGHT',
    'LANTERN',
    'CANDLE',
    'T-LIGHT',
    'TEALIGHT',
    'LED',
    'LAMP',
    'STRING-LIGHT',
    'FAIRY',
    'GLOW',
    'WICK',
    'HOLDER',
  ],

  'Kitchen & Dining': [
    'PLATE',
    'BOWL',
    'CUP',
    'MUG',
    'SPOON',
    'GLASS',
    'FORK',
    'KNIFE',
    'TRAY',
    'COASTER',
    'JAR',
    'CANISTER',
    'KITCHEN',
    'DINING',
    'SERVE',
    'CUTLERY',
  ],

  'Home Decor': [
    'HEART',
    'DECORATION',
    'ORNAMENT',
    'FRAME',
    'SIGN',
    'WALL',
    'VASE',
    'SCULPTURE',
    'MIRROR',
    'HOOK',
    'HANGER',
    'CUSHION',
    'RUG',
  ],

  Christmas: [
    'CHRISTMAS',
    'SNOWFLAKE',
    'SANTA',
    'XMAS',
    'TREE',
    'BAUBLE',
    'REINDEER',
    'ELF',
    'NOEL',
    'WREATH',
    'STOCKING',
  ],

  'Storage & Bags': [
    'BAG',
    'BOX',
    'STORAGE',
    'TOTE',
    'PURSE',
    'POUCH',
    'BASKET',
    'BIN',
    'ORGANIZER',
    'CASE',
    'HOLDER',
  ],

  Stationery: [
    'CARD',
    'PAPER',
    'NOTEBOOK',
    'PEN',
    'PENCIL',
    'CLIP',
    'STICKER',
    'ENVELOPE',
    'CALENDAR',
    'DIARY',
    'JOURNAL',
    'WRAP',
  ],

  'Toys & Kids': [
    'TOY',
    'DOLL',
    'CHILDREN',
    'KID',
    'BABY',
    'PLUSH',
    'PUZZLE',
    'GAME',
    'BLOCK',
    'FIGURE',
    'PLAY',
  ],

  'Gift & Cards': [
    'GIFT',
    'WRAP',
    'RIBBON',
    'GIFTBOX',
    'PRESENT',
    'TAG',
    'BOW',
    'FAVOR',
  ],

  Romance: [
    'HEART',
    'LOVE',
    'ROSE',
    'VALENTINE',
    'WEDDING',
    'BRIDE',
    'RING',
    'COUPLE',
  ],

  Party: [
    'PARTY',
    'BIRTHDAY',
    'BALLOON',
    'BANNER',
    'CONFETTI',
    'STREAMER',
    'CELEBRATION',
    'HAT',
  ],

  Garden: [
    'GARDEN',
    'PLANT',
    'FLOWER',
    'OUTDOOR',
    'NATURE',
    'POT',
    'SEED',
    'HERB',
    'FAIRY-GARDEN',
  ],

  Animals: [
    'BIRD',
    'DOG',
    'CAT',
    'ANIMAL',
    'PET',
    'WILDLIFE',
    'BUTTERFLY',
    'FISH',
    'HORSE',
    'OWL',
  ],

  Vintage: [
    'VINTAGE',
    'RETRO',
    'ANTIQUE',
    'CLASSIC',
    'RUSTIC',
    'SHABBY',
  ],

  /** Mặc định khi không khớp danh mục khác — luôn có nhãn để chọn */
  General: [
    'GENERAL',
    'MISC',
    'OTHER',
    'MIXED',
    'BASIC',
    'EVERYDAY',
    'USEFUL',
    'HOME',
    'ACCESSORY',
    'ITEM',
    'MULTI',
    'SALE',
    'NEW',
    'SET',
  ],
};

/** Giá trị category trong DB cũ → khóa chuẩn trong CATEGORY_TAG_MAP */
export const CATEGORY_ALIASES = {
  Kitchen: 'Kitchen & Dining',
  Bags: 'Storage & Bags',
  Kids: 'Toys & Kids',
  'Gift & Cards': 'Gift & Cards',
};

/** Danh sách danh mục hiển thị trên form (một dòng / nhóm, đã chuẩn hóa) */
export const CATEGORY_FORM_OPTIONS = [
  'General',
  'Lighting',
  'Kitchen & Dining',
  'Home Decor',
  'Christmas',
  'Storage & Bags',
  'Stationery',
  'Toys & Kids',
  'Gift & Cards',
  'Romance',
  'Party',
  'Garden',
  'Animals',
  'Vintage',
];

/** Nhãn tiếng Việt cho storefront (theo khóa canonical) */
export const CATEGORY_DISPLAY_VI = {
  General: 'Tổng hợp',
  Lighting: 'Đèn & nến',
  'Kitchen & Dining': 'Nhà bếp & ăn uống',
  'Home Decor': 'Trang trí nhà cửa',
  Christmas: 'Giáng sinh',
  'Storage & Bags': 'Lưu trữ & túi xách',
  Stationery: 'Văn phòng phẩm',
  'Toys & Kids': 'Đồ chơi & trẻ em',
  'Gift & Cards': 'Quà & thiệp',
  Romance: 'Lãng mạn',
  Party: 'Tiệc tùng',
  Garden: 'Sân vườn',
  Animals: 'Động vật',
  Vintage: 'Cổ điển',
};

/**
 * Ảnh thẻ danh mục trên trang chủ (CategoryList).
 * Sửa URL tại đây hoặc dùng file trong `public` (vd. `/images/categories/den.jpg`).
 * Để `''` hoặc bỏ key → chỉ hiện gradient + icon.
 */
export const CATEGORY_HOME_CARD_IMAGES = {
  General:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&h=600&q=80',
  Lighting:
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&h=600&q=80',
  'Kitchen & Dining':
    'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&h=600&q=80',
  'Home Decor':
    'https://images.unsplash.com/photo-1583847268964-b28dc8f51efd?auto=format&fit=crop&w=600&h=600&q=80',
  Christmas:
    'https://images.unsplash.com/photo-1482517967863-b099787302cd?auto=format&fit=crop&w=600&h=600&q=80',
  'Storage & Bags':
    'https://images.unsplash.com/photo-1534126687488-8e82931e5107?auto=format&fit=crop&w=600&h=600&q=80',
  Stationery:
    'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=600&h=600&q=80',
  'Toys & Kids':
    'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=600&h=600&q=80',
  'Gift & Cards':
    'https://images.unsplash.com/photo-1513885535751-51b7248ff094?auto=format&fit=crop&w=600&h=600&q=80',
  Romance:
    'https://images.unsplash.com/photo-1518199266811-22181bd13d80?auto=format&fit=crop&w=600&h=600&q=80',
  Party:
    'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&h=600&q=80',
  Garden:
    'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&h=600&q=80',
  Animals:
    'https://images.unsplash.com/photo-1450778869700-a915e21e72a8?auto=format&fit=crop&w=600&h=600&q=80',
  Vintage:
    'https://images.unsplash.com/photo-1563291071313-d066c3a50262?auto=format&fit=crop&w=600&h=600&q=80',
};

/** Slug / đường dẫn cũ → canonical (tương thích menu & SEO cũ) */
export const CATEGORY_URL_SLUG_MAP = {
  accessories: 'General',
  decoration: 'Home Decor',
  kitchen: 'Kitchen & Dining',
  others: 'General',
  toys: 'Toys & Kids',
};

/**
 * Giá trị gửi API /products?category=… (regex không phân biệt hoa thường).
 * Chuẩn hóa slug cũ; giữ nguyên chuỗi lạ để vẫn lọc được theo từ khóa.
 */
export function resolveCategoryForQuery(raw) {
  if (raw == null || String(raw).trim() === '') return '';
  const t = decodeURIComponent(String(raw)).trim();
  const lower = t.toLowerCase();
  if (lower === 'deal hot') return 'Deal hot';
  const slug = lower.replace(/\s+/g, '-').replace(/&/g, 'and');
  if (CATEGORY_URL_SLUG_MAP[slug] != null) return CATEGORY_URL_SLUG_MAP[slug];
  if (CATEGORY_URL_SLUG_MAP[lower] != null) return CATEGORY_URL_SLUG_MAP[lower];
  if (CATEGORY_TAG_MAP[t]) return t;
  if (CATEGORY_ALIASES[t]) return CATEGORY_ALIASES[t];
  return t;
}

/** Nhãn hiển thị tiếng Việt; Deal hot & giá trị không map vẫn hiển thị hợp lý */
export function getCategoryLabelVI(value) {
  if (value == null || String(value).trim() === '') return 'Danh mục';
  const t = decodeURIComponent(String(value)).trim();
  const lower = t.toLowerCase();
  if (lower === 'deal hot') return 'Deal hot';
  const canonical = toCanonicalCategory(t);
  if (canonical !== 'General' || CATEGORY_TAG_MAP[t] || CATEGORY_ALIASES[t]) {
    return CATEGORY_DISPLAY_VI[canonical] || t;
  }
  if (t && t !== 'General') return t;
  return CATEGORY_DISPLAY_VI.General;
}

/** Tên danh mục hiển thị cho khách (tiếng Anh, khớp Product.category / canonical). */
export function getCategoryDisplayEn(value) {
  if (value == null || String(value).trim() === '') return 'Category';
  const t = decodeURIComponent(String(value)).trim();
  const lower = t.toLowerCase();
  if (lower === 'deal hot') return 'Deal hot';
  const canonical = toCanonicalCategory(t);
  if (canonical !== 'General' || CATEGORY_TAG_MAP[t] || CATEGORY_ALIASES[t]) {
    return canonical;
  }
  if (t && t !== 'General') return t;
  return 'General';
}

export function categoryPathEncoded(canonicalKey) {
  return `/category/${encodeURIComponent(canonicalKey)}`;
}

/** Option Form.Select admin: value = Product.category, label = tiếng Anh (hiển thị) */
export function getAdminCategorySelectOptions() {
  const base = CATEGORY_FORM_OPTIONS.map((value) => ({
    value,
    label: getCategoryDisplayEn(value),
  }));
  return [...base, { value: 'Deal hot', label: 'Deal hot' }];
}

export function toCanonicalCategory(dbCategory) {
  if (!dbCategory || typeof dbCategory !== 'string') return 'General';
  const t = dbCategory.trim();
  if (CATEGORY_TAG_MAP[t]) return t;
  if (CATEGORY_ALIASES[t]) return CATEGORY_ALIASES[t];
  return 'General';
}

export function tagsForCategory(categoryKey) {
  const key = toCanonicalCategory(categoryKey);
  return CATEGORY_TAG_MAP[key] || CATEGORY_TAG_MAP.General;
}
