import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import pool from '../db.js'

const router = Router()

// ── Khởi tạo Claude client ──────────────────────────────────────────────
function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return null
  return new Anthropic({ apiKey: key })
}

// ── Lấy sản phẩm từ DB làm context cho AI ──────────────────────────────
async function getProductContext() {
  const [rows] = await pool.query(`
    SELECT p.id, p.name, p.price, p.old_price, p.description, p.gender,
           p.image, p.rating, p.review_count, p.badge,
           b.name AS brand,
           c.name AS category,
           co.name AS concentration,
           (SELECT GROUP_CONCAT(fn.note SEPARATOR ', ')
            FROM fragrance_notes fn WHERE fn.product_id = p.id AND fn.layer = 'top') AS top_notes,
           (SELECT GROUP_CONCAT(fn.note SEPARATOR ', ')
            FROM fragrance_notes fn WHERE fn.product_id = p.id AND fn.layer = 'heart') AS heart_notes,
           (SELECT GROUP_CONCAT(fn.note SEPARATOR ', ')
            FROM fragrance_notes fn WHERE fn.product_id = p.id AND fn.layer = 'base') AS base_notes,
           (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1) AS min_variant_price,
           (SELECT MAX(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = 1) AS max_variant_price
    FROM products p
    LEFT JOIN brands         b  ON b.id  = p.brand_id
    LEFT JOIN categories     c  ON c.id  = p.category_id
    LEFT JOIN concentrations co ON co.id = p.concentration_id
    WHERE p.is_active = 1
    ORDER BY p.is_featured DESC, p.rating DESC
    LIMIT 100
  `)
  return rows
}

// ── Format sản phẩm thành text cho system prompt ────────────────────────
function formatProductsForPrompt(products) {
  return products.map(p => {
    const priceInfo = p.min_variant_price && p.max_variant_price && p.min_variant_price !== p.max_variant_price
      ? `${Number(p.min_variant_price).toLocaleString('vi-VN')}đ – ${Number(p.max_variant_price).toLocaleString('vi-VN')}đ`
      : `${Number(p.price).toLocaleString('vi-VN')}đ`
    
    let info = `[ID:${p.id}] ${p.name}`
    if (p.brand) info += ` | Thương hiệu: ${p.brand}`
    info += ` | Giá: ${priceInfo}`
    if (p.gender) info += ` | Giới tính: ${p.gender}`
    if (p.concentration) info += ` | Nồng độ: ${p.concentration}`
    if (p.category) info += ` | Loại: ${p.category}`
    if (p.rating) info += ` | Đánh giá: ${p.rating}/5 (${p.review_count} reviews)`
    if (p.top_notes) info += ` | Hương đầu: ${p.top_notes}`
    if (p.heart_notes) info += ` | Hương giữa: ${p.heart_notes}`
    if (p.base_notes) info += ` | Hương cuối: ${p.base_notes}`
    if (p.description) info += ` | Mô tả: ${p.description.substring(0, 150)}`
    return info
  }).join('\n')
}

// ── System prompt ────────────────────────────────────────────────────────
function buildSystemPrompt(productsText) {
  return `Bạn là chuyên gia tư vấn nước hoa AI tại cửa hàng LUMIÈRE — một thương hiệu nước hoa cao cấp.

═══════════════════════════════════════════════════════════════════════════
🎯 QUY TẮC VÀNG: CỬA HÀNG LUÔN HỎI → HIỂU RÕ → RỒI GỢI Ý
═══════════════════════════════════════════════════════════════════════════

⚡ QUYẾT ĐỊNH FLOW:
IF (yêu cầu RÕNG ràng + đủ context) {
  → Confirm lại + Gợi ý products
} ELSE IF (yêu cầu MỜ HỒ / HỌC THÊM / VỀ đều có thể) {
  → HỎI THÊM để làm rõ (TỪ 2-3 CÂU HỎI LIÊN QUAN)
  → Chỉ sau khi rõ ý mới gợi ý
} ELSE IF (chỉ mention "giá" mà không có context khác) {
  → ĐỪNG gợi ý loạn, mà hỏi: "Ngoài giá, bạn quan tâm gì nữa?"
  → Hỏi về: giới tính, scent, occasion/mục đích sử dụng

═══════════════════════════════════════════════════════════════════════════
NGUYÊN TẮC PHÂN TÍCH VÀ TRẢ LỜI
═══════════════════════════════════════════════════════════════════════════

🎯 PHÂN TÍCH INTENT CHÍNH XÁCH:
- Đọc kỹ câu hỏi để hiểu đúng TRỌNG TÂM (người dùng muốn gì)
- Ví dụ 1: "Nước hoa cho bạn gái" → Intent: Tìm sản phẩm NỮ, mục đích: QUẶN HỌ (romantic)
- Ví dụ 2: "Nước hoa không quá đắt" → Intent: Giá rẻ, nhưng cần CHẤT LƯỢNG
- Ví dụ 3: "Nước hoa tươi mát cho mùa hè" → Intent: Mùa hè + Scent Fresh/Aquatic
- Ví dụ 4: "Giá" (chỉ có vậy) → Intent: KHÔNG RÕ, phải hỏi thêm

💡 CẨN THẬN GẪY MẪM & GIẢ ĐỊNH:
- KHÔNG tự thêm yêu cầu không có trong câu hỏi (VD: "nước hoa nam" ≠ "nước hoa cho người yêu")
- KHÔNG giả định người dùng muốn "cao cấp" nếu không nói
- KHÔNG bỏ qua từ khóa nhỏ (VD: "không quá đắt", "nhẹ nhàng")
- KHÔNG gợi ý sản phẩm khi CHƯA HIỂU RÕ nhu cầu (dù có tìm được products)

📍 CẨU TRẢ LỜI TẬP TRUNG VÀO TRỌNG TÂM:
- Chỉ gợi ý KHOẢNG 2-4 sản phẩm PHẦN PHƠI NHẤT với câu hỏi
- Lý giải TẠI SAO mỗi sản phẩm phù hợp (dựa vào scent, gender, price, occasion)
- Không lãng phí thời gian cho sản phẩm không liên quan

DANH SÁCH SẢN PHẨM CỬA HÀNG:
${productsText}

═══════════════════════════════════════════════════════════════════════════
CÁC TÌNH HUỐNG PHỔ BIẾN & CÁCH XỬ LÝ
═══════════════════════════════════════════════════════════════════════════

1️⃣ TƯ VẤN CHUNG HOẶC YÊU CẦU MỜ HỒ (CẦN HỎI THÊM)
   Q: "Nước hoa gì cho mọi lúc?"
   Q: "Chat lung tung, mình muốn nước hoa mà không biết"
   → TRƯỚC TIÊN: Hỏi thêm để làm rõ
   → Questions: "Bạn là nam hay nữ?", "Thích hương gì?", "Để làm gì?"
   → CHỈ SAU ĐÓ gợi ý 2-3 sản phẩm đa năng

1.5️⃣ BUDGET/GIÁ LÀ TRỌNG TÂM (HỎI THÊM hoặc GỢI Ý)
   Q: "Giá"
   Q: "Giá rẻ"
   Q: "Dưới 500k"
   → PHÂN TÍCH: User quan tâm GIÁ
   → Hỏi thêm: "Ngoài giá, bạn là nam hay nữ? Thích hương gì?"
   → NHƯNG nếu user nôn nả, cứ gợi ý sản phẩm GIẺ NHẤT trong khoảng giá đó
   → KHÔNG gợi ý sản phẩm nổi bật/đắt tiền nếu user hỏi giá rẻ!

2️⃣ TÌM SCENT CỤ THỂ (Đủ rõ → GỢI Ý NGAY)
   Q: "Tôi muốn hương hoa nhẹ nhàng, không nồng"
   → PHÂN TÍCH: Scent = Floral, Strength = Light/Fresh
   → Gợi ý: Sản phẩm Floral với description "tươi mát", "nhẹ"
   → KHÔNG gợi ý những sản phẩm "nồng nàn", "mạnh"

3️⃣ BUDGET HẠCH CHẼ (Đủ rõ intent → GỢI Ý)
   Q: "Nước hoa giá dưới 1 triệu nhưng chất lượng tốt"
   → PHÂN TÍCH: Price < 1M, Quality = High rating (4.0+)
   → Gợi ý: Sản phẩm trong khoảng giá + rating cao
   → LỸ GIẢI: "Mặc dù giá rẻ nhưng có rating 4.5/5"

4️⃣ MỤC ĐÍCH SỬ DỤNG (Đủ rõ → GỢI Ý)
   Q: "Nước hoa cho bữa hẹn hò"
   → PHÂN TÍCH: Occasion = Date/Romantic, scent = Seductive/Sweet
   → Gợi ý: Sản phẩm quyến rũ, gợi cảm, warm tones
   → KHÔNG: Nước hoa công sở, citrus nhẹ nhàng

5️⃣ SO SÁNH GIỮA NHIỀU SẢN PHẨM
   Q: "Giữa A và B, cái nào tốt hơn?"
   → PHÂN TÍCH: Tại sao người dùng so sánh? Tiêu chí gì? Budget?
   → TRẢ LỜI: So sánh rõ ràng về: Scent, Price, Quality, Best for...
   → Giới thiệu cái phù hợp hơn DỰA VÀO CÂU HỎI

═══════════════════════════════════════════════════════════════════════════
FORMAT & PHONG CÁCH
═══════════════════════════════════════════════════════════════════════════

✏️ CẤU TRÚC TRƯỜI LỜI KHOẢNG 2 LOẠI:

[LOẠI A] - KHI HỎI THÊM:
1. Xác nhận bạn đã nghe
2. Hỏi 2-3 câu để làm rõ (liên quan đến scent, gender, occasion, purpose)
3. "Rồi mình sẽ tư vấn cho bạn những sản phẩm tuyệt vời nhất! 💫"

[LOẠI B] - KHI GỢI Ý:
1. Confirm lại hiểu rõ yêu cầu của khách NGẮN GỌN
2. 2-4 gợi ý sản phẩm với tên và nét nổi bật
3. Lý giải TẠI SAO phù hợp (dựa vào scent, gender, price, occasion)
4. Hỏi khách có thắc mắc thêm không?

🎨 PHONG CÁCH VIẾT:
- Ngôn ngữ: Tiếng Việt, thân thiện, chuyên nghiệp
- Độ dài: Ngắn gọn, không lặp lại (tránh chat dài)
- Tone: Tư vấn yêu thương, không áp đặt
- Emoji: Dùng phù hợp để tăng tính kết nối ✨💐🌸

⚠️ NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM:
- KHÔNG tự bịa sản phẩm hoặc thông tin không có
- KHÔNG trả lời ngoài chủ đề nước hoa
- KHÔNG gợi ý sản phẩm "tương tự" nếu cửa hàng không có
- KHÔNG bỏ qua yêu cầu cụ thể của khách (VD: "không nồng" → phải tìm sản phẩm "nhẹ")
- KHÔNG gợi ý quá 4 sản phẩm (khách sẽ bối rối)
- 🔴 KHÔNG gợi ý khi intent MỜ HỒ/LUNG TUNG (phải hỏi trước!)
- 🔴 KHÔNG chỉ nhìn vào giá rồi gợi ý product tùy tiện
- 🔴 KHÔNG bỏ qua message KHÔNG RÕ để gợi ý products bất kể`
}

// ── Fallback: tìm sản phẩm theo keyword khi không có AI ─────────────────
const KEYWORD_MAP = {
  // DB values: male, female, unisex
  gender: {
    'nam': 'male',   'men': 'male',     'man': 'male',   'gentleman': 'male',  'anh': 'male',    'cho nam': 'male', 'de nam': 'male', 'dành nam': 'male',
    'nữ': 'female',  'women': 'female', 'woman': 'female', 'chị': 'female',   'cô': 'female', 'em gái': 'female',  'cho nữ': 'female', 'de nữ': 'female', 'dành nữ': 'female',
    'unisex': 'unisex', 'phi giới tính': 'unisex', 'cả nam và nữ': 'unisex', 'cả hai': 'unisex', 'nam nữ': 'unisex',
  },
  occasion: {
    'đi làm': 'công sở',    'công sở': 'công sở',    'văn phòng': 'công sở',    'office': 'công sở', 'công việc': 'công sở', 'làm việc': 'công sở', 'professional': 'công sở',
    'hẹn hò': 'hẹn hò',     'date': 'hẹn hò',        'lãng mạn': 'hẹn hò',     'romantic': 'hẹn hò', 'yêu': 'hẹn hò', 'tình yêu': 'hẹn hò', 'người yêu': 'hẹn hò',
    'dự tiệc': 'tiệc',      'party': 'tiệc',         'event': 'tiệc', 'tiệc tùng': 'tiệc', 'sự kiện': 'tiệc',
    'thường ngày': 'casual', 'hàng ngày': 'casual',   'daily': 'casual', 'ngày thường': 'casual', 'hàng đêm': 'casual',
    'đi chơi': 'casual',    'di choi': 'casual',     'chill': 'casual',  'đi cà phê': 'casual',    'cafe': 'casual',
    'đi dạo': 'casual',     'du lịch': 'casual',     'di lich': 'casual', 'đi biển': 'mùa hè',      'bar': 'tiệc',
    'club': 'tiệc',
    'quà': 'quà tặng',      'tặng': 'quà tặng',      'gift': 'quà tặng', 'quà tặng': 'quà tặng', 'quà sinh nhật': 'quà tặng', 'quà 8/3': 'quà tặng',
    'mùa hè': 'mùa hè',     'hè': 'mùa hè',          'summer': 'mùa hè',       'nóng': 'mùa hè', 'mùa nóng': 'mùa hè', 'jun': 'mùa hè', 'tháng 6': 'mùa hè',
    'mùa đông': 'mùa đông', 'đông': 'mùa đông',      'winter': 'mùa đông',     'lạnh': 'mùa đông', 'mùa lạnh': 'mùa đông', 'tháng 12': 'mùa đông',
    'thể thao': 'sport',    'gym': 'sport',          'tập luyện': 'sport',     'chạy bộ': 'sport',
  },
  scent: {
    'hoa': 'Floral',     'floral': 'Floral',      'hồng': 'Floral',      'nhài': 'Floral', 'cam chà': 'Floral', 'hoa nhài': 'Floral', 'hoa hồng': 'Floral', 'hương hoa': 'Floral',
    'gỗ': 'Woody',       'woody': 'Woody',        'trầm': 'Woody',       'đàn hương': 'Woody', 'gỗ musk': 'Woody', 'hương gỗ': 'Woody',
    'citrus': 'Citrus',   'cam': 'Citrus',         'chanh': 'Citrus',     'bưởi': 'Citrus',     'tươi mát': 'Citrus', 'hương cam': 'Citrus', 'vị citrus': 'Citrus',
    'ngọt': 'Sweet',      'sweet': 'Sweet',        'vanilla': 'Sweet',    'vani': 'Sweet', 'caramel': 'Sweet', 'mứt': 'Sweet', 'hương ngọt': 'Sweet',
    'cay': 'Spicy',       'spicy': 'Spicy',        'ấm': 'Oriental',     'phương đông': 'Oriental', 'oriental': 'Oriental', 'ấm áp': 'Oriental', 'nồng nàn': 'Oriental',
    'biển': 'Aquatic',    'aquatic': 'Aquatic',    'fresh': 'Fresh',      'tươi': 'Fresh', 'nhẹ nhàng': 'Fresh', 'hương tươi': 'Fresh', 'mát mẻ': 'Fresh', 'nước biển': 'Aquatic',
    'musk': 'Musk',       'powder': 'Powder',      'fruity': 'Fruity',    'quả': 'Fruity', 'cacao': 'Cocoa', 'socola': 'Cocoa',
  },
  priceRange: {
    'rẻ': [0, 500000],          'giá rẻ': [0, 500000],       'bình dân': [0, 500000], 'dưới 500k': [0, 500000],
    'tầm trung': [500000, 1500000], 'vừa': [500000, 1500000], 'từ 500k': [500000, 1500000],
    'cao cấp': [1500000, 99999999], 'sang': [1500000, 99999999], 'đắt': [1500000, 99999999], 'premium': [1500000, 99999999], 'trên 1.5 triệu': [1500000, 99999999],
  },
  // Loại truy vấn đặc biệt
  specialQuery: {
    'bán chạy': 'best_sellers',     'best seller': 'best_sellers',    'phổ biến': 'best_sellers',
    'được yêu thích': 'best_sellers', 'hot': 'best_sellers',          'trending': 'best_sellers', 'nhiều người mua': 'best_sellers',
    'nổi bật': 'featured',          'đặc sắc': 'featured',           'tiêu biểu': 'featured',       'featured': 'featured',
    'mới nhất': 'newest',           'mới': 'newest',                  'mới về': 'newest',             'new': 'newest',
    'hàng mới': 'newest',           'sản phẩm mới': 'newest', 'vừa ra': 'newest',
    'giảm giá': 'on_sale',          'khuyến mãi': 'on_sale',         'khuyến mại': 'on_sale',        'sale': 'on_sale',
    'ưu đãi': 'on_sale',            'đang giảm': 'on_sale',          'promotion': 'on_sale', 'giảm giá sốc': 'on_sale',
    'đánh giá cao': 'top_rated',    'rating cao': 'top_rated',       'tốt nhất': 'top_rated',       'top': 'top_rated', 'sao cao': 'top_rated',
  },
}

// Gender DB value → display name
const GENDER_LABELS = { 'male': 'Nam', 'female': 'Nữ', 'unisex': 'Unisex' }

// ── Occasion → scent/description keywords mapping ─────────────────────
const OCCASION_SEARCH = {
  'công sở':   ['thanh lịch', 'nhẹ nhàng', 'tinh tế', 'tươi mát', 'citrus', 'clean'],
  'hẹn hò':    ['quyến rũ', 'gợi cảm', 'ngọt', 'ấm', 'vanilla', 'musk', 'sexy'],
  'tiệc':      ['mạnh mẽ', 'nổi bật', 'sang trọng', 'oud', 'intense', 'night'],
  'casual':    ['tươi mát', 'nhẹ nhàng', 'thoải mái', 'fresh', 'light', 'citrus', 'easy', 'daily'],
  'quà tặng':  ['phổ biến', 'best seller', 'nổi bật'],
  'mùa hè':    ['tươi mát', 'nhẹ nhàng', 'citrus', 'aquatic', 'fresh', 'biển'],
  'mùa đông':  ['ấm áp', 'nồng nàn', 'gỗ', 'oud', 'vanilla', 'spicy', 'woody'],
}

// Special query reply headers
const SPECIAL_QUERY_HEADERS = {
  'best_sellers':  'Đây là những sản phẩm **bán chạy nhất** tại LUMIÈRE 🔥\n\n',
  'featured':      'Những sản phẩm **nổi bật** được nhiều khách hàng yêu thích ✨\n\n',
  'newest':        'Những sản phẩm **mới nhất** vừa cập nhật tại cửa hàng 🆕\n\n',
  'on_sale':       'Các sản phẩm đang có **giảm giá / khuyến mãi** hấp dẫn 🏷️\n\n',
  'top_rated':     'Những sản phẩm được **đánh giá cao nhất** bởi khách hàng ⭐\n\n',
}

const SESSION_STORE = new Map()
const SESSION_TTL_MS = 1000 * 60 * 45
const SESSION_MAX_MESSAGES = 8

function isValidSessionId(sessionId) {
  return typeof sessionId === 'string' && /^[a-zA-Z0-9_-]{8,128}$/.test(sessionId)
}

function cleanupSessionStore() {
  const now = Date.now()
  for (const [id, session] of SESSION_STORE.entries()) {
    if (!session?.updatedAt || now - session.updatedAt > SESSION_TTL_MS) {
      SESSION_STORE.delete(id)
    }
  }
}

function getSessionContext(sessionId) {
  if (!isValidSessionId(sessionId)) return null
  const session = SESSION_STORE.get(sessionId)
  if (!session) return null

  if (Date.now() - session.updatedAt > SESSION_TTL_MS) {
    SESSION_STORE.delete(sessionId)
    return null
  }

  return session.context || null
}

function mergeIntentWithSession(intent, context) {
  if (!context) return intent

  return {
    ...intent,
    gender: intent.gender || context.gender || null,
    occasion: intent.occasion || context.occasion || null,
    scents: intent.scents.length > 0 ? intent.scents : (context.scents || []),
    priceRange: intent.priceRange || context.priceRange || null,
  }
}

function updateSessionContext(sessionId, currentIntent, userMessage) {
  if (!isValidSessionId(sessionId)) return

  const existing = SESSION_STORE.get(sessionId) || {
    updatedAt: Date.now(),
    context: {
      gender: null,
      occasion: null,
      scents: [],
      priceRange: null,
      recentMessages: [],
    },
  }

  if (currentIntent.gender) existing.context.gender = currentIntent.gender
  if (currentIntent.occasion) existing.context.occasion = currentIntent.occasion
  if (currentIntent.priceRange) existing.context.priceRange = currentIntent.priceRange
  if (currentIntent.scents.length > 0) {
    const mergedScents = [...currentIntent.scents, ...(existing.context.scents || [])]
    existing.context.scents = [...new Set(mergedScents)].slice(0, 4)
  }

  if (typeof userMessage === 'string' && userMessage.trim()) {
    existing.context.recentMessages = [
      ...(existing.context.recentMessages || []),
      userMessage.trim(),
    ].slice(-SESSION_MAX_MESSAGES)
  }

  existing.updatedAt = Date.now()
  SESSION_STORE.set(sessionId, existing)
}

function buildSessionContextPrompt(context) {
  if (!context) return ''

  const lines = []
  if (context.gender) lines.push(`- Giới tính ưu tiên: ${context.gender}`)
  if (context.occasion) lines.push(`- Mục đích sử dụng gần nhất: ${context.occasion}`)
  if (context.scents?.length) lines.push(`- Nhóm hương đã nhắc: ${context.scents.join(', ')}`)
  if (context.priceRange?.length === 2) {
    lines.push(`- Khoảng giá gần nhất: ${context.priceRange[0]}-${context.priceRange[1]} VND`)
  }

  if (lines.length === 0) return ''

  return `

═══════════════════════════════════════════════════════════════════════════
NGỮ CẢNH HỘI THOẠI GẦN ĐÂY (ƯU TIÊN DÙNG KHI USER NÓI NGẮN)
═══════════════════════════════════════════════════════════════════════════
${lines.join('\n')}

Nếu người dùng nhắn ngắn kiểu "gợi ý thêm", "loại nào tốt hơn", "còn mùi khác không"
thì tiếp tục dựa trên ngữ cảnh trên và chỉ hỏi lại khi thiếu thông tin thật sự quan trọng.`
}

function parseBudgetAmount(rawAmount, rawUnit = '') {
  if (!rawAmount) return null
  const numeric = Number(rawAmount.replace(',', '.'))
  if (!Number.isFinite(numeric) || numeric <= 0) return null

  const unit = (rawUnit || '').toLowerCase()
  if (unit.includes('k') || unit.includes('ngh') || unit.includes('ngan')) return Math.round(numeric * 1000)
  if (unit.includes('tr') || unit.includes('tri')) return Math.round(numeric * 1000000)
  if (unit === 'm') return Math.round(numeric * 1000000)

  if (numeric >= 1000 && numeric <= 200000000) return Math.round(numeric)
  return Math.round(numeric * 1000)
}

function clampPriceRange(range) {
  const min = Math.max(0, Math.min(range[0], range[1]))
  const max = Math.max(min, Math.min(range[1], 99999999))
  return [min, max]
}

function parseBudgetRangeFromMessage(lower) {
  const text = lower.replace(/\s+/g, ' ').trim()

  const betweenMatch = text.match(/(?:từ|tu)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan|tr|triệu|trieu|m)?\s*(?:đến|den|tới|toi|-|~)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan|tr|triệu|trieu|m)?/i)
  if (betweenMatch) {
    const from = parseBudgetAmount(betweenMatch[1], betweenMatch[2])
    const to = parseBudgetAmount(betweenMatch[3], betweenMatch[4])
    if (from && to) return clampPriceRange([from, to])
  }

  const underMatch = text.match(/(?:dưới|duoi|tối đa|toi da|max|không quá|khong qua)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan|tr|triệu|trieu|m)?/i)
  if (underMatch) {
    const max = parseBudgetAmount(underMatch[1], underMatch[2])
    if (max) return clampPriceRange([0, max])
  }

  const overMatch = text.match(/(?:trên|tren|hơn|hon|ít nhất|it nhat|min|từ|tu)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan|tr|triệu|trieu|m)?/i)
  if (overMatch) {
    const min = parseBudgetAmount(overMatch[1], overMatch[2])
    if (min) return clampPriceRange([min, 99999999])
  }

  const aroundMatch = text.match(/(?:khoảng|tam|tầm|about|around)?\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngan|tr|triệu|trieu|m)\b/i)
  if (aroundMatch) {
    const center = parseBudgetAmount(aroundMatch[1], aroundMatch[2])
    if (center) {
      const delta = Math.max(150000, Math.round(center * 0.25))
      return clampPriceRange([center - delta, center + delta])
    }
  }

  return null
}

function isBudgetToken(term) {
  return /^(\d+(?:[.,]\d+)?)(k|tr|m|triệu|trieu|nghìn|ngan)?$/.test(term) ||
         ['gia', 'giá', 'budget', 're', 'rẻ', 'price', 'duoi', 'dưới', 'tren', 'trên'].includes(term)
}

function parseUserIntent(msg) {
  const lower = msg.toLowerCase()
  const intent = { gender: null, occasion: null, scents: [], priceRange: null, searchTerms: [], specialQuery: null }

  // Check special queries first (longer phrases first to avoid conflicts)
  const sortedSpecialQueries = Object.entries(KEYWORD_MAP.specialQuery).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, val] of sortedSpecialQueries) {
    if (lower.includes(kw)) { intent.specialQuery = val; break }
  }

  // Gender matching
  const sortedGenders = Object.entries(KEYWORD_MAP.gender).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, val] of sortedGenders) {
    if (lower.includes(kw)) { intent.gender = val; break }
  }

  // Occasion matching
  const sortedOccasions = Object.entries(KEYWORD_MAP.occasion).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, val] of sortedOccasions) {
    if (lower.includes(kw)) { intent.occasion = val; break }
  }

  // Scent matching: IMPROVED - only remove exact compound phrases, not aggressive
  let scentText = lower
    .replace(/nước hoa\s+/g, '')
    .replace(/nuoc hoa\s+/g, '')
    .replace(/tư vấn\s+/g, '')
    .replace(/tu van\s+/g, '')
    .replace(/gợi ý\s+/g, '')
    .replace(/goi y\s+/g, '')
    .replace(/sản phẩm\s+/g, '')
    .replace(/san pham\s+/g, '')
    .trim()
  
  // Match scent keywords (longest first to avoid partial matches)
  // Collect ALL matching scents, not just the first one
  const sortedScents = Object.entries(KEYWORD_MAP.scent).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, val] of sortedScents) {
    if (scentText.includes(kw) && !intent.scents.includes(val)) {
      intent.scents.push(val)
    }
  }

  // Price range matching
  const sortedPrices = Object.entries(KEYWORD_MAP.priceRange).sort((a, b) => b[0].length - a[0].length)
  for (const [kw, val] of sortedPrices) {
    if (lower.includes(kw)) { intent.priceRange = val; break }
  }

  if (!intent.priceRange) {
    intent.priceRange = parseBudgetRangeFromMessage(lower)
  }

  // Search terms = remaining meaningful words (minimum 2 chars)
  const cleanedMsg = lower
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\b\d+(?:[.,]\d+)?\s*(k|tr|m|triệu|trieu|nghìn|ngan)?\b/g, ' ')
    .replace(/nước hoa|nuoc hoa|tư vấn|tu van|gợi ý|goi y|sản phẩm|san pham/g, '')
    .trim()
  if (cleanedMsg.length > 1) {
    const words = cleanedMsg.split(/\s+/).filter(w => w.length >= 2 && !isBudgetToken(w))
    intent.searchTerms = words
  }

  return intent
}

// ── Detect if message is VAGUE/UNCLEAR ──────────────────────────────────
function isMessageVague(message, intent) {
  const lower = message.toLowerCase().trim()
  const wordCount = lower.split(/\s+/).length
  
  // Very short message (1-2 words)
  if (wordCount <= 2) {
    // Exception: If it's a clear keyword (brand name, specific scent, etc.)
    const hasClearKeyword = intent.gender || intent.occasion || intent.scents.length > 0 || intent.specialQuery
    if (!hasClearKeyword && intent.searchTerms.length === 0) return true
    // Only price mentioned
    if (intent.priceRange && !intent.gender && !intent.occasion && !intent.scents.length && intent.searchTerms.length === 0) return true
  }
  
  // Message with only price context
  const hasPriceOnly = intent.priceRange && 
                       !intent.gender && 
                       !intent.occasion && 
                       !intent.scents.length && 
                       intent.searchTerms.filter(t => t !== 'giá' && t !== 'gia' && t !== 'price').length === 0
  if (hasPriceOnly) return true
  
  // Message has no specific intent at all (just random words)
  const hasNoClearContext = !intent.gender && 
                            !intent.occasion && 
                            !intent.scents.length && 
                            !intent.priceRange &&
                            !intent.specialQuery &&
                            intent.searchTerms.length === 0
  if (hasNoClearContext) return true
  
  return false
}

// ── Build enhanced system prompt for vague messages ──────────────────────
function buildVagueMessagePrompt(basePrompt) {
  return basePrompt + `

═══════════════════════════════════════════════════════════════════════════
⚡ DETECTED: MESSAGE CHƯA RÕ RÀNG / MỜ HỒ
═══════════════════════════════════════════════════════════════════════════

🚨 VUI LÒNG HỎI THÊM TRƯỚC KHI GỢI Ý:

KHÔNG gợi ý products ngay, thay vào đó HỎI:
1. "Bạn là nam hay nữ ạ?" (Nếu chưa biết giới tính)
2. "Nước hoa để dùng khi nào? (đi làm, hẹn hò, hàng ngày, ...)" (Nếu chưa biết mục đích)
3. "Bạn thích hương gì? (hoa, gỗ, citrus, ngọt, ...)" (Nếu chưa biết scent)
4. "Budget là bao nhiêu ạ?" (Nếu chỉ nhắc giá mà không có context khác)

Chỉ sau khi có đủ 2-3 thông tin rõ ràng, mới gợi ý products!

EXAMPLE:
- User: "Giá"
- AI: "Xin lỗi em, để tư vấn cho bạn, mình cần hiểu thêm một chút ạ 🤔 
  Bạn là nam hay nữ? Và nước hoa để dùng khi nào ạ? Ví dụ: đi làm, hẹn hò, hay dùng hàng ngày?"
`
}

async function fallbackSearch(message, mergedIntent = null) {
  const intent = mergedIntent || parseUserIntent(message)

  // ── Xây dựng SQL tuỳ theo loại truy vấn ──
  let sql = `
    SELECT p.id, p.name, p.slug, p.price, p.old_price, p.image, p.badge,
           p.rating, p.review_count, p.description, p.gender, p.is_featured, p.created_at,
           b.name AS brand,
           c.name AS category,
           co.name AS concentration,
           (SELECT GROUP_CONCAT(fn.note SEPARATOR ', ')
            FROM fragrance_notes fn WHERE fn.product_id = p.id) AS all_notes
    FROM products p
    LEFT JOIN brands         b  ON b.id  = p.brand_id
    LEFT JOIN categories     c  ON c.id  = p.category_id
    LEFT JOIN concentrations co ON co.id = p.concentration_id
    WHERE p.is_active = 1
  `
  const params = []

  if (intent.gender) {
    sql += ' AND p.gender = ?'
    params.push(intent.gender)
  }

  if (intent.priceRange) {
    sql += ' AND p.price BETWEEN ? AND ?'
    params.push(intent.priceRange[0], intent.priceRange[1])
  }

  // Special query filters
  if (intent.specialQuery === 'on_sale') {
    sql += ' AND p.old_price IS NOT NULL AND p.old_price > p.price'
  }
  if (intent.specialQuery === 'featured') {
    sql += ' AND p.is_featured = 1'
  }

  // Special query ordering
  switch (intent.specialQuery) {
    case 'best_sellers':
    case 'top_rated':
      sql += ' ORDER BY p.rating DESC, p.review_count DESC LIMIT 50'
      break
    case 'newest':
      sql += ' ORDER BY p.created_at DESC LIMIT 50'
      break
    case 'on_sale':
      sql += ' ORDER BY (p.old_price - p.price) DESC LIMIT 50'
      break
    case 'featured':
      sql += ' ORDER BY p.rating DESC LIMIT 50'
      break
    default:
      // ▬▬▬ SMART ORDERING: Nếu chỉ có price, sort theo giá ▬▬▬
      const hasOnlyPrice = intent.priceRange && 
                          !intent.gender && 
                          !intent.occasion && 
                          !intent.scents.length && 
                          intent.searchTerms.length === 0
      
      if (hasOnlyPrice) {
        // User chỉ quan tâm giá → sắp xếp rẻ nhất trước (ASC)
        sql += ' ORDER BY p.price ASC, p.rating DESC LIMIT 50'
      } else {
        // Có thêm context khác → sắp xếp theo quality first
        sql += ' ORDER BY p.is_featured DESC, p.rating DESC LIMIT 50'
      }
  }

  const [rows] = await pool.query(sql, params)
  
  // If no results found, return helpful message
  if (rows.length === 0) {
    return {
      reply: 'Xin lỗi, hiện tại mình chưa tìm thấy sản phẩm phù hợp. Bạn thử mô tả thêm nhu cầu của bạn nhé! Ví dụ: "tư vấn nước hoa nữ hương hoa" hoặc "nước hoa nam giá dưới 500k" 🙏',
      suggestedProducts: []
    }
  }

  // Score & rank products with FULL KEYWORD_MAP UTILIZATION
  // ▬▬▬ SPECIAL CASE: If only price is mentioned, keep it simple ▬▬▬
  const isPriceOnlyQuery = intent.priceRange && 
                           !intent.gender && 
                           !intent.occasion && 
                           !intent.scents.length && 
                           intent.searchTerms.length === 0
  
  let scored = rows.map(p => {
    let score = 0
    const text = `${p.name} ${p.brand || ''} ${p.description || ''} ${p.all_notes || ''} ${p.concentration || ''}`.toLowerCase()
    const brandLower = (p.brand || '').toLowerCase()
    const genderLower = (p.gender || '').toLowerCase()

    // For price-only queries, just use rating as tiebreaker (not featured boost)
    if (isPriceOnlyQuery) {
      score = p.rating ? p.rating * 10 : 40  // Simple: rating is only factor
      return { ...p, score }
    }

    // ▬▬▬ NORMAL SCORING (when there's more context than just price) ▬▬▬
    
    // ▬▬▬ PRIORITY 1: BRAND EXACT MATCH (HIGHEST) ▬▬▬
    let hasBrandMatch = false
    for (const term of intent.searchTerms) {
      const termLower = term.toLowerCase()
      if (brandLower === termLower) {
        score += 50  // Exact brand match = SUPER HIGH
        hasBrandMatch = true
      } else if (brandLower.includes(termLower) && termLower.length >= 3) {
        score += 30  // Partial brand match = VERY HIGH
        hasBrandMatch = true
      }
    }

    // ▬▬▬ PRIORITY 2: SCENT MATCH (HIGH) ▬▬▬
    // Scent is very important - use all matched scents
    for (const s of intent.scents) {
      if (text.includes(s.toLowerCase())) score += 15  // Increased from 5 to 15
    }

    // ▬▬▬ PRIORITY 3: GENDER MATCH ▬▬▬
    if (intent.gender && genderLower === intent.gender) {
      score += 12  // Gender match is important
    }

    // ▬▬▬ PRIORITY 4: OCCASION KEYWORDS ▬▬▬
    if (intent.occasion && OCCASION_SEARCH[intent.occasion]) {
      for (const kw of OCCASION_SEARCH[intent.occasion]) {
        if (text.includes(kw.toLowerCase())) score += 5  // Increased from 3 to 5
      }
    }

    // ▬▬▬ PRIORITY 5: PRODUCT NAME / DESCRIPTION MATCH ▬▬▬
    // Only apply if no brand match (avoid double-scoring brand)
    if (!hasBrandMatch) {
      for (const term of intent.searchTerms) {
        const words = term.split(/\s+/).filter(w => w.length > 2)
        for (const w of words) {
          // Exact match in product name
          if (p.name.toLowerCase().includes(w)) score += 4
          // Match in other fields
          else if (text.includes(w)) score += 2
        }
      }
    }

    // ▬▬▬ PRIORITY 6: BOOST FEATURED & RATINGS (LOWEST) ▬▬▬
    // Only boost if actually have some match or no searchTerms
    if (intent.searchTerms.length === 0 || hasBrandMatch || score > 0) {
      if (p.is_featured) score += 2
      if (p.rating >= 4.5) score += 2
      if (p.rating >= 4.0) score += 1
      if (p.badge) score += 1
    }

    return { ...p, score }
  })

  // For special queries, keep original DB ordering; for others, sort by score
  // BUT if no keywords matched at all, still sort by score to get best products
  const totalScore = scored.reduce((sum, p) => sum + p.score, 0)
  
  if (!intent.specialQuery || totalScore > 0) {
    scored.sort((a, b) => b.score - a.score)
  }
  
  // ▬▬▬ INTELLIGENT SEARCH: PRODUCT vs BRAND INTENT ▬▬▬
  let filtered = scored
  let searchedBrandName = null
  let isBrandOnlySearch = false
  let isExactProductSearch = false
  let isProductSearchIntent = false
  let searchedProductName = null

  if (intent.searchTerms.length > 0 && !intent.scents.length && !intent.occasion && !intent.gender && !intent.priceRange && !intent.specialQuery) {
    const searchTermsJoined = intent.searchTerms.join(' ').toLowerCase()
    const hasMultipleTerms = intent.searchTerms.length > 1 || searchTermsJoined.split(/\s+/).length > 1

    // ▬ CASE 1: Multiple search terms (e.g., "chanel pour monsieur") ▬
    // Priority: Try to find EXACT PRODUCT that matches all terms
    if (hasMultipleTerms) {
      // Check for product that matches any of the search terms
      const productMatches = scored.filter(p => {
        const productNameLower = p.name.toLowerCase()
        return intent.searchTerms.some(term => 
          term.length >= 2 && productNameLower.includes(term.toLowerCase())
        )
      })

      // Also check if brand is mentioned in search
      const brandMatches = scored.filter(p =>
        intent.searchTerms.some(term =>
          p.brand && p.brand.toLowerCase().includes(term.toLowerCase()) && term.length >= 3
        )
      )

      // If we have BOTH brand mention and product name mention → Show exact product only
      if (productMatches.length > 0 && brandMatches.length > 0) {
        const exactMatch = productMatches.find(m => 
          brandMatches.some(b => b.id === m.id)
        ) || productMatches[0]
        
        if (exactMatch) {
          isExactProductSearch = true
          isProductSearchIntent = true
          searchedProductName = exactMatch.name
          filtered = scored.filter(p => p.id === exactMatch.id)
        }
      }
      // If only products match → Show that product
      else if (productMatches.length > 0 && productMatches.some(p => p.score >= 4)) {
        const exactMatch = productMatches.find(p => p.score >= 4) || productMatches[0]
        isExactProductSearch = true
        isProductSearchIntent = true
        searchedProductName = exactMatch.name
        filtered = scored.filter(p => p.id === exactMatch.id)
      }
      // If only brands match → Show all products of that brand
      else if (brandMatches.length > 0) {
        const topBrand = brandMatches[0]
        searchedBrandName = topBrand.brand
        isBrandOnlySearch = true
        filtered = scored.filter(p => p.brand && p.brand.toLowerCase() === searchedBrandName.toLowerCase())
      }
    }
    // ▬ CASE 2: Single search term (e.g., "chanel" or "pour monsieur") ▬
    else {
      const singleTerm = intent.searchTerms[0]?.toLowerCase() || ''

      // First check if it matches a BRAND (single term often = brand name)
      const brandMatch = scored.find(p => 
        p.brand && p.brand.toLowerCase() === singleTerm && p.score >= 30
      )

      if (brandMatch) {
        // Single term = brand name → Show all products of this brand
        searchedBrandName = brandMatch.brand
        isBrandOnlySearch = true
        filtered = scored.filter(p => p.brand && p.brand.toLowerCase() === searchedBrandName.toLowerCase())
      } else {
        // Otherwise try to match product
        const productMatches = scored.filter(p => {
          const productNameLower = p.name.toLowerCase()
          return singleTerm.length >= 2 && productNameLower.includes(singleTerm)
        })

        if (productMatches.length > 0 && productMatches.some(p => p.score >= 4)) {
          const exactMatch = productMatches.find(p => p.score >= 4) || productMatches[0]
          isExactProductSearch = true
          isProductSearchIntent = true
          searchedProductName = exactMatch.name
          filtered = scored.filter(p => p.id === exactMatch.id)
        }
      }
    }
  }

  const top = filtered.slice(0, 4)

  // Build friendly reply
  let reply = ''
  let suggestedProducts = top

  // Use special query header if applicable
  if (intent.specialQuery && SPECIAL_QUERY_HEADERS[intent.specialQuery]) {
    let header = SPECIAL_QUERY_HEADERS[intent.specialQuery]
    if (intent.gender) header = header.replace('\n\n', ` dành cho **${GENDER_LABELS[intent.gender] || intent.gender}** 🎯\n\n`)
    reply = header
  } else {
    const labels = []

    // Handle exact product match
    if (isExactProductSearch && searchedProductName) {
      reply = `Đây là sản phẩm bạn tìm kiếm ✨\n\n`
    }
    // Handle product search but NOT FOUND
    else if (isProductSearchIntent && !isExactProductSearch && !isBrandOnlySearch) {
      // Get similar products by partial name match or top-rated
      const searchTerm = intent.searchTerms[0]?.toLowerCase() || ''
      const similarProducts = scored.filter(p => 
        searchTerm && p.name.toLowerCase().includes(searchTerm)
      ).slice(0, 4)
      
      const alternatives = similarProducts.length > 0 ? similarProducts : scored.slice(0, 4)
      suggestedProducts = alternatives
      
      reply = `Xin lỗi, hiện tại cửa hàng LUMIÈRE chưa có sản phẩm chính xác có tên **"${intent.searchTerms[0]}"** 😔\n\n`
      
      if (similarProducts.length > 0) {
        reply += `Tuy nhiên, mình tìm thấy những sản phẩm có tên tương tự ✨\n\n`
      } else {
        reply += `Tuy nhiên, mình gợi ý cho bạn những sản phẩm được yêu thích nhất tại cửa hàng ✨\n\n`
      }
      
      // Show the alternatives
      alternatives.forEach((p, i) => {
        reply += `${i + 1}. **${p.name}**`
        if (p.brand) reply += ` — ${p.brand}`
        reply += ` — ${Number(p.price).toLocaleString('vi-VN')}đ`
        if (p.old_price && p.old_price > p.price) reply += ` ~~${Number(p.old_price).toLocaleString('vi-VN')}đ~~`
        if (p.rating) reply += ` ⭐ ${p.rating}/5`
        if (p.badge === 'NEW') reply += ' 🆕'
        if (p.badge === 'SALE') reply += ' 🏷️'
        reply += '\n'
      })
      
      reply += '\nBạn thích sản phẩm nào không? Hoặc mình có thể tư vấn thêm 💐'
      return { reply, suggestedProducts }
    }
    // Handle brand-only search with NO results
    else if (isBrandOnlySearch && top.length === 0) {
      // Get alternative suggestions (top-rated or featured products)
      const alternatives = scored.filter(p => !p.brand || p.brand.toLowerCase() !== searchedBrandName.toLowerCase()).slice(0, 4)
      suggestedProducts = alternatives
      
      reply = `Xin lỗi, hiện tại cửa hàng LUMIÈRE chưa có sản phẩm của thương hiệu **${searchedBrandName}** 😔\n\n`
      reply += `Tuy nhiên, mình gợi ý cho bạn những sản phẩm tương tự từ các thương hiệu khác có cùng phong cách và chất lượng cao ✨\n\n`
      
      // Show the alternatives
      alternatives.forEach((p, i) => {
        reply += `${i + 1}. **${p.name}**`
        if (p.brand) reply += ` — ${p.brand}`
        reply += ` — ${Number(p.price).toLocaleString('vi-VN')}đ`
        if (p.old_price && p.old_price > p.price) reply += ` ~~${Number(p.old_price).toLocaleString('vi-VN')}đ~~`
        if (p.rating) reply += ` ⭐ ${p.rating}/5`
        if (p.badge === 'NEW') reply += ' 🆕'
        if (p.badge === 'SALE') reply += ' 🏷️'
        reply += '\n'
      })
      
      reply += '\nBạn thích sản phẩm nào không? Mình có thể tư vấn thêm cho bạn 💐'
      return { reply, suggestedProducts }
    }

    // Handle brand-only search WITH results
    else if (isBrandOnlySearch && searchedBrandName) {
      labels.push(`thương hiệu: **${searchedBrandName}**`)
      reply = `Dựa trên yêu cầu của bạn (${labels.join(', ')}), mình gợi ý những sản phẩm sau ✨\n\n`
    } else if (top.length === 0) {
      // No results for any search
      reply = 'Xin lỗi, hiện tại mình chưa tìm thấy sản phẩm phù hợp. Bạn thử mô tả thêm nhu cầu của bạn nhé! Ví dụ: "tư vấn nước hoa nữ hương hoa" hoặc "nước hoa nam giá dưới 500k" 🙏'
      return { reply, suggestedProducts: [] }
    } else {
      // Regular search with results
      if (intent.gender) labels.push(`giới tính: **${GENDER_LABELS[intent.gender] || intent.gender}**`)
      if (intent.occasion) labels.push(`phù hợp **${intent.occasion}**`)
      if (intent.scents.length) labels.push(`mùi hương: **${intent.scents.join(', ')}**`)
      if (intent.priceRange) {
        const minPrice = Number(intent.priceRange[0]).toLocaleString('vi-VN')
        const maxPrice = Number(intent.priceRange[1]).toLocaleString('vi-VN')
        labels.push(`tầm giá: **${minPrice}đ – ${maxPrice}đ**`)
      }

      if (labels.length > 0) {
        reply = `Dựa trên yêu cầu của bạn (${labels.join(', ')}), mình gợi ý những sản phẩm sau ✨\n\n`
      } else {
        // Even without specific keywords, show the top-rated products
        reply = 'Đây là những sản phẩm nổi bật và được yêu thích nhất tại cửa hàng LUMIÈRE 💐\n\n'
      }
    }
  }

  top.forEach((p, i) => {
    reply += `${i + 1}. **${p.name}**`
    if (p.brand) reply += ` — ${p.brand}`
    reply += ` — ${Number(p.price).toLocaleString('vi-VN')}đ`
    if (p.old_price && p.old_price > p.price) reply += ` ~~${Number(p.old_price).toLocaleString('vi-VN')}đ~~`
    if (p.rating) reply += ` ⭐ ${p.rating}/5`
    if (p.badge === 'NEW') reply += ' 🆕'
    if (p.badge === 'SALE') reply += ' 🏷️'
    reply += '\n'
  })

  reply += '\nBạn muốn tìm hiểu thêm về sản phẩm nào không? 💐'

  return {
    reply,
    suggestedProducts: suggestedProducts.map(p => ({
      id: p.id, name: p.name, slug: p.slug, price: p.price,
      old_price: p.old_price, image: p.image, badge: p.badge,
      rating: p.rating, brand: p.brand
    }))
  }
}

// ── POST /api/chat ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, history = [], sessionId } = req.body
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Tin nhắn không được để trống' })
    }

    if (Math.random() < 0.08) {
      cleanupSessionStore()
    }

    const currentIntent = parseUserIntent(message)
    const sessionContext = getSessionContext(sessionId)
    const mergedIntent = mergeIntentWithSession(currentIntent, sessionContext)

    // ── Thử dùng Claude AI trước ──
    const client = getClient()
    if (client) {
      try {
        const products = await getProductContext()
        const productsText = formatProductsForPrompt(products)
        let systemPrompt = buildSystemPrompt(productsText) + buildSessionContextPrompt(sessionContext)
        
        // Check if message is vague and enhance prompt if needed
        if (isMessageVague(message, mergedIntent)) {
          systemPrompt = buildVagueMessagePrompt(systemPrompt)
        }

        const messages = []
        for (const msg of history.slice(-10)) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          })
        }
        messages.push({ role: 'user', content: message.trim() })

        const response = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          messages
        })

        const reply = response.content[0]?.text || ''

        const productIdMatches = reply.match(/\[PRODUCT:(\d+)\]/g) || []
        const suggestedIds = productIdMatches.map(m => Number(m.match(/\d+/)[0]))

        let suggestedProducts = []
        if (suggestedIds.length > 0) {
          const placeholders = suggestedIds.map(() => '?').join(',')
          const [rows] = await pool.query(`
            SELECT p.id, p.name, p.slug, p.price, p.old_price, p.image, p.badge, p.rating,
                   b.name AS brand
            FROM products p
            LEFT JOIN brands b ON b.id = p.brand_id
            WHERE p.id IN (${placeholders}) AND p.is_active = 1
          `, suggestedIds)
          suggestedProducts = rows
        }

        const cleanReply = reply.replace(/\[PRODUCT:\d+\]/g, '').replace(/\n{3,}/g, '\n\n').trim()

        updateSessionContext(sessionId, currentIntent, message)

        return res.json({ reply: cleanReply, suggestedProducts })
      } catch (aiErr) {
        console.error('Claude API error, falling back to keyword search:', aiErr.message)
        // Fall through to keyword-based search
      }
    }

    // ── Fallback: tìm sản phẩm theo keyword ──
    const result = await fallbackSearch(message, mergedIntent)
    updateSessionContext(sessionId, currentIntent, message)
    res.json(result)

  } catch (err) {
    console.error('Chat API error:', err)
    res.status(500).json({
      reply: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau nhé! 🙏'
    })
  }
})

export default router
