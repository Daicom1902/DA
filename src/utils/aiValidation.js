/**
 * AI Validation Service using Claude
 * Validates and normalizes product data from Excel
 */

const API_ENDPOINT = '/api/admin/ai/validate-products'

/**
 * Validate and normalize products using Claude AI via backend
 * @param {Array} products - Products to validate
 * @returns {Promise<Object>} Validation result with normalized data
 */
export async function validateProductsWithAI(products) {
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
      },
      body: JSON.stringify({ products }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'AI validation failed')
    }

    return await response.json()
  } catch (error) {
    throw new Error(`AI validation error: ${error.message}`)
  }
}

/**
 * Client-side basic validation (fallback when AI is not available)
 * @param {Array} products - Products to validate
 * @returns {Object} Validation result
 */
export function basicValidateProducts(products) {
  const validated = products.map((product) => {
    const validated = { ...product }

    // Normalize gender
    if (validated.gender) {
      const gender = String(validated.gender).toLowerCase()
      if (gender.includes('nam')) validated.gender = 'male'
      else if (gender.includes('nữ')) validated.gender = 'female'
      else if (gender.includes('unisex')) validated.gender = 'unisex'
      else validated.gender = ''
    }

    // Ensure price is number
    if (validated.price) {
      validated.price = Number(validated.price)
    }
    if (validated.old_price) {
      validated.old_price = Number(validated.old_price)
    }

    // Ensure rating is between 0-5
    if (validated.rating) {
      let rating = Number(validated.rating)
      if (rating > 5) rating = 5
      if (rating < 0) rating = 0
      validated.rating = Math.round(rating * 10) / 10
    }

    // Normalize variant prices
    if (validated.variants && Array.isArray(validated.variants)) {
      validated.variants = validated.variants.map((v) => ({
        ...v,
        price: Number(v.price) || 0,
        old_price: v.old_price ? Number(v.old_price) : null,
        stock: Number(v.stock) || 0,
      }))
    }

    return validated
  })

  return {
    isValid: true,
    normalizedProducts: validated,
    message: 'Basic validation completed',
  }
}
