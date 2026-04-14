import * as XLSX from 'xlsx'

/**
 * Parse Excel or CSV file and extract product data
 * Supports both XLSX and CSV formats
 * @param {File} file - Excel/CSV file to parse
 * @returns {Promise<Array>} Array of product objects
 */
export async function parseExcelFile(file) {
  const fileName = file.name.toLowerCase()
  
  // Use appropriate parser based on file type
  if (fileName.match(/\.csv$/i)) {
    return parseCSVFile(file)
  } else {
    return parseExcelXlsxFile(file)
  }
}

/**
 * Parse XLSX/XLS file
 */
function parseExcelXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = e.target.result
        // Use ArrayBuffer to support modern browsers reliably
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet)

        if (!rows || rows.length === 0) {
          reject(new Error('File Excel không có dữ liệu hoặc sheet trống'))
          return
        }

        console.log('📋 Excel headers:', Object.keys(rows[0] || {}))
        processRows(rows, resolve, reject)
      } catch (error) {
        reject(new Error(`Lỗi khi đọc file Excel: ${error.message}`))
      }
    }

    reader.onerror = () => reject(new Error('Không thể đọc file'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Parse CSV file
 */
function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const csvData = e.target.result
        const workbook = XLSX.read(csvData, { type: 'string' })
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        const rows = XLSX.utils.sheet_to_json(sheet)

        if (!rows || rows.length === 0) {
          reject(new Error('File CSV không có dữ liệu hoặc sheet trống'))
          return
        }

        console.log('📋 CSV headers:', Object.keys(rows[0] || {}))
        processRows(rows, resolve, reject)
      } catch (error) {
        reject(new Error(`Lỗi khi đọc file CSV: ${error.message}`))
      }
    }

    reader.onerror = () => reject(new Error('Không thể đọc file CSV'))
    reader.readAsText(file)
  })
}

/**
 * Process and normalize rows
 */
function processRows(rows, resolve, reject) {
  try {
    const normalizedRows = rows.map((row, idx) => {
      const normalized = {}
      
      Object.keys(row).forEach((key) => {
        const lowerKey = key.toLowerCase().trim()
        const value = row[key]
        
        // Skip empty values
        if (value === null || value === undefined || value === '') return
        
        // Map column names to field names
        if (lowerKey.includes('tên') || lowerKey.includes('name') || lowerKey.includes('product') || lowerKey.includes('sản phẩm')) {
          normalized.name = String(value).trim()
        } else if (lowerKey.includes('thương') || lowerKey.includes('brand') || lowerKey.includes('nhãn hiệu') || lowerKey.includes('hãng')) {
          normalized.brand = String(value).trim()
        } else if (lowerKey.includes('nồng') || lowerKey.includes('concentration') || lowerKey.includes('loại nước hoa')) {
          normalized.concentration = String(value).trim()
        } else if (lowerKey.includes('giá cũ') || lowerKey.includes('old price') || lowerKey.includes('price cũ') || lowerKey.includes('giá gốc')) {
          normalized.old_price = convertToNumber(value)
        } else if (lowerKey.includes('giá') || lowerKey.includes('price') || lowerKey.includes('giá bán') || lowerKey.includes('đơn giá')) {
          normalized.price = convertToNumber(value)
        } else if (lowerKey.includes('rating') || lowerKey.includes('đánh giá') || lowerKey.includes('sao')) {
          normalized.rating = convertToNumber(value)
        } else if (lowerKey.includes('badge')) {
          normalized.badge = String(value).trim()
        } else if (lowerKey.includes('giới tính') || lowerKey.includes('gender') || lowerKey.includes('nam nữ')) {
          normalized.gender = String(value).trim()
        } else if (lowerKey.includes('ảnh') || lowerKey.includes('image') || lowerKey.includes('url ảnh') || lowerKey.includes('hình ảnh')) {
          normalized.image = String(value).trim()
        } else if (lowerKey.includes('mô tả') || lowerKey.includes('description') || lowerKey.includes('miêu tả')) {
          normalized.description = String(value).trim()
        } else if (lowerKey.includes('chi tiết') || lowerKey.includes('details') || lowerKey.includes('thông tin')) {
          normalized.details = String(value).trim()
        } else if (lowerKey.includes('dung tích') || lowerKey.includes('size') || lowerKey.includes('size_label') || lowerKey.includes('ml') || lowerKey.includes('thể tích')) {
          normalized.size_label = String(value).trim()
        } else if (lowerKey.includes('sku') || lowerKey.includes('mã hàng')) {
          normalized.sku = String(value).trim()
        } else if (lowerKey.includes('tồn') || lowerKey.includes('stock') || lowerKey.includes('kho') || lowerKey.includes('số lượng')) {
          normalized.stock = convertToNumber(value)
        }
      })
      
      if (idx === 0) console.log('✅ First normalized row:', normalized)
      return normalized
    })

    resolve(normalizedRows)
  } catch (error) {
    reject(error)
  }
}

/**
 * Convert value to number with validation
 */
function convertToNumber(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return isNaN(value) ? null : value

  // Accept common number formats from Excel (Vietnamese separators, etc.)
  // Examples: "1.000.000", "1,000,000", "1.234.567,89", "1,234,567.89"
  let str = String(value).trim()
  str = str.replace(/\s+/g, '')
  str = str.replace(/[^0-9.,-]/g, '') // keep digits/separators only

  const hasDot = str.includes('.')
  const hasComma = str.includes(',')

  if (hasDot && hasComma) {
    const lastDot = str.lastIndexOf('.')
    const lastComma = str.lastIndexOf(',')
    if (lastComma > lastDot) {
      // 1.234.567,89 => dots thousand, comma decimal
      str = str.replace(/\./g, '').replace(',', '.')
    } else {
      // 1,234,567.89 => commas thousand, dot decimal
      str = str.replace(/,/g, '')
    }
  } else if (hasDot) {
    // If multiple dots => assume dot is thousand separator
    const dotCount = (str.match(/\./g) || []).length
    if (dotCount > 1) str = str.replace(/\./g, '')
  } else if (hasComma) {
    // If multiple commas => assume comma is thousand separator
    const commaCount = (str.match(/,/g) || []).length
    if (commaCount > 1) str = str.replace(/,/g, '')
    else str = str.replace(',', '.')
  }

  const num = Number(str)
  return isNaN(num) ? null : num
}

/**
 * Group products by main product (handle multi-size products)
 * with proper deduplication and validation
 * @param {Array} rawData - Raw data from Excel
 * @returns {Array} Grouped products with variants
 */
export function groupProductsBySize(rawData) {
  const productsMap = new Map()

  rawData.forEach((row) => {
    if (!row.name) return

    const key = row.name.toLowerCase().trim()
    if (!productsMap.has(key)) {
      productsMap.set(key, {
        name: row.name,
        brand: row.brand || '',
        concentration: row.concentration || '',
        description: row.description || '',
        details: row.details || '',
        rating: row.rating || 0,
        image: row.image || '',
        badge: row.badge || '',
        gender: row.gender || '',
        variants: [],
      })
    }

    const product = productsMap.get(key)

    // Add variant if size_label is provided
    if (row.size_label && String(row.size_label).trim() !== '') {
      // Only add if price is valid and positive
      if (row.price && Number(row.price) > 0) {
        product.variants.push({
          size_label: String(row.size_label).trim(),
          price: Number(row.price),
          old_price: row.old_price && Number(row.old_price) > 0 ? Number(row.old_price) : null,
          stock: row.stock && Number(row.stock) >= 0 ? Number(row.stock) : 0,
          sku: row.sku && String(row.sku).trim() !== '' ? String(row.sku).trim() : null,
        })
      }
    } else if (row.price && Number(row.price) > 0) {
      // Single size product
      product.variants.push({
        size_label: 'Standard',
        price: Number(row.price),
        old_price: row.old_price && Number(row.old_price) > 0 ? Number(row.old_price) : null,
        stock: row.stock && Number(row.stock) >= 0 ? Number(row.stock) : 0,
        sku: row.sku && String(row.sku).trim() !== '' ? String(row.sku).trim() : null,
      })
    }
  })

  return Array.from(productsMap.values()).map(product => ({
    ...product,
    // ✅ NEW: Deduplicate variants by size_label - keep first occurrence
    variants: deduplicateVariants(product.variants),
    // ✅ NEW: Normalize brand/concentration names to avoid case/space issues
    brand: normalizeString(product.brand),
    concentration: normalizeString(product.concentration),
  }))
}

/**
 * Remove duplicate variants with same size_label
 * @param {Array} variants - Array of variants
 * @returns {Array} Deduplicated variants
 */
function deduplicateVariants(variants) {
  const sizeMap = new Map()
  variants.forEach(v => {
    const sizeKey = v.size_label.toLowerCase().trim()
    if (!sizeMap.has(sizeKey)) {
      sizeMap.set(sizeKey, v)
    }
  })
  return Array.from(sizeMap.values())
}

/**
 * Normalize string (trim spaces, lowercase for comparison, preserve original case)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeString(str) {
  if (!str) return ''
  return String(str).trim().replace(/\s+/g, ' ')
}

/**
 * Validate Excel data structure
 * @param {Array} data - Parsed data from Excel
 * @returns {Object} Validation result with errors and warnings
 */
export function validateExcelData(data) {
  const result = {
    isValid: true,
    errors: [],
    warnings: [],
    totalRows: data.length,
  }

  if (!data || data.length === 0) {
    result.errors.push('File Excel không có dữ liệu')
    result.isValid = false
    return result
  }

  data.forEach((row, index) => {
    const rowNum = index + 2 // +2 because Excel is 1-indexed and has header row

    // Require product name
    if (!row.name || String(row.name).trim() === '') {
      result.errors.push(`Hàng ${rowNum}: Tên sản phẩm là bắt buộc`)
      result.isValid = false
      return
    }

    // Require at least price or size_label
    if (!row.price && !row.size_label) {
      result.warnings.push(
        `Hàng ${rowNum}: Nên có giá hoặc dung tích`
      )
    }

    // Validate that sizes with prices make sense
    if (row.size_label && !row.price) {
      result.warnings.push(
        `Hàng ${rowNum}: Dung tích "${row.size_label}" không có giá`
      )
    }

    // ✅ NEW: Type validation for price - must be positive number
    if (row.price !== undefined && row.price !== null) {
      if (isNaN(Number(row.price))) {
        result.errors.push(`Hàng ${rowNum}: Giá phải là số, được: "${row.price}"`)
        result.isValid = false
      } else if (Number(row.price) < 0) {
        result.errors.push(`Hàng ${rowNum}: Giá phải > 0, được: ${row.price}`)
        result.isValid = false
      } else if (Number(row.price) === 0) {
        result.warnings.push(`Hàng ${rowNum}: Giá = 0 (miễn phí?)`)
      }
    }

    // ✅ NEW: Type validation for old_price
    if (row.old_price !== undefined && row.old_price !== null) {
      if (isNaN(Number(row.old_price))) {
        result.warnings.push(`Hàng ${rowNum}: Giá cũ không hợp lệ: "${row.old_price}"`)
      } else if (Number(row.old_price) < 0) {
        result.errors.push(`Hàng ${rowNum}: Giá cũ phải > 0, được: ${row.old_price}`)
        result.isValid = false
      } else if (row.price && Number(row.old_price) < Number(row.price)) {
        result.warnings.push(`Hàng ${rowNum}: Giá cũ < giá bán (kiểm tra lại)`)
      }
    }

    // ✅ NEW: Type validation for stock - must be non-negative
    if (row.stock !== undefined && row.stock !== null) {
      if (isNaN(Number(row.stock))) {
        result.warnings.push(`Hàng ${rowNum}: Tồn kho không hợp lệ: "${row.stock}"`)
      } else if (Number(row.stock) < 0) {
        result.errors.push(`Hàng ${rowNum}: Tồn kho phải ≥ 0, được: ${row.stock}`)
        result.isValid = false
      }
    }

    // Type validation for rating
    if (row.rating !== undefined && row.rating !== null) {
      if (isNaN(Number(row.rating))) {
        result.warnings.push(`Hàng ${rowNum}: Rating không hợp lệ: "${row.rating}"`)
      } else if (Number(row.rating) > 5 || Number(row.rating) < 0) {
        result.warnings.push(`Hàng ${rowNum}: Rating phải từ 0-5, được: "${row.rating}"`)
      }
    }

    // Validate gender values
    if (row.gender && String(row.gender).trim() !== '') {
      const validGenders = ['male', 'female', 'unisex', 'nam', 'nữ', 'nam nữ', 'chung']
      const genderLower = String(row.gender).toLowerCase().trim()
      if (!validGenders.some(g => genderLower.includes(g))) {
        result.warnings.push(`Hàng ${rowNum}: Giới tính chưa rõ: "${row.gender}"`)
      }
    }

    // ✅ NEW: Validate badge values
    if (row.badge && String(row.badge).trim() !== '') {
      const validBadges = ['new', 'sale', 'hot']
      const badgeLower = String(row.badge).toLowerCase().trim()
      if (!validBadges.includes(badgeLower)) {
        result.warnings.push(`Hàng ${rowNum}: Badge không hợp lệ: "${row.badge}". Dùng: NEW, SALE, HOT`)
      }
    }

    // ✅ NEW: Validate image URL format if provided
    if (row.image && String(row.image).trim() !== '') {
      if (!isValidImageUrlFormat(row.image)) {
        result.warnings.push(`Hàng ${rowNum}: URL ảnh có thể không hợp lệ: "${row.image.substring(0, 50)}..."`)
      }
    }

    // ✅ NEW: Warn about empty size_label
    if (row.size_label !== undefined && row.size_label !== null && String(row.size_label).trim() === '') {
      result.warnings.push(`Hàng ${rowNum}: Dung tích rỗng → sẽ lưu as 'Standard'`)
    }
  })

  return result
}

/**
 * Simple validation for image URL format
 * (doesn't check if URL is actually accessible)
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
function isValidImageUrlFormat(url) {
  if (!url || typeof url !== 'string') return false
  try {
    new URL(url)
    const urlLower = url.toLowerCase()
    const hasImageExtension = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].some(ext => urlLower.includes(ext))
    const isCDN = urlLower.includes('cdn') || urlLower.includes('cloudinary') || urlLower.includes('imgur') || urlLower.includes('unsplash')
    return hasImageExtension || isCDN
  } catch {
    return false
  }
}
