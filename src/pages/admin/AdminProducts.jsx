import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Search, Loader2, ImagePlus, Layers, Upload, CheckCircle2, AlertCircle, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsAPI, productImagesAPI, variantsAPI, brandsAPI, concentrationsAPI } from '../../utils/api'
import { formatVND } from '../../utils/currency'
import { parseExcelFile, groupProductsBySize, validateExcelData } from '../../utils/excelImport'
import { basicValidateProducts } from '../../utils/aiValidation'

// Validate image URL
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url)
    const validProtocols = ['http:', 'https:']
    if (!validProtocols.includes(urlObj.protocol)) return false
    
    // Check common image extensions or CDN patterns
    const pathLower = urlObj.pathname.toLowerCase()
    const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    return validExts.some(ext => pathLower.endsWith(ext)) || 
           urlObj.hostname.includes('cdn') || 
           urlObj.hostname.includes('cloudinary') ||
           urlObj.hostname.includes('imgur')
  } catch {
    return false
  }
}

const EMPTY_FORM = {
  name: '', brand: '', concentration: '', description: '', details: '', price: '', old_price: '', rating: '', image: '', badge: '', gender: ''
}

const EMPTY_VARIANT = { size_label: '', price: '', old_price: '', stock: '', sku: '' }

export default function AdminProducts() {
  const [products, setProducts]       = useState([])
  const [brands, setBrands]           = useState([])
  const [concentrations, setConcentrations] = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [modal, setModal]             = useState(false)
  const [editing, setEditing]         = useState(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [deletingId, setDeletingId]   = useState(null)
  const [error, setError]             = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  // Gallery state
  const [gallery, setGallery]               = useState([])
  const [galleryLoading, setGalleryLoading] = useState(false)
  const [newImgUrl, setNewImgUrl]           = useState('')
  const [newImgAlt, setNewImgAlt]           = useState('')
  const [addingImg, setAddingImg]           = useState(false)
  const [removingImgId, setRemovingImgId]   = useState(null)

  // Variants state
  const [variants, setVariants]               = useState([])
  const [variantsLoading, setVariantsLoading] = useState(false)
  const [newVariant, setNewVariant]           = useState(EMPTY_VARIANT)
  const [addingVariant, setAddingVariant]     = useState(false)
  const [editingVariant, setEditingVariant]   = useState(null)   // { id, size_label, price, ... }
  const [removingVariantId, setRemovingVariantId] = useState(null)

  // Pending state (create mode only — stored locally, submitted after product is created)
  const [pendingVariants, setPendingVariants] = useState([])
  const [pendingImages, setPendingImages]     = useState([])

  // Import from Excel state
  const [importModal, setImportModal]           = useState(false)
  const [importFile, setImportFile]             = useState(null)
  const [importLoading, setImportLoading]       = useState(false)
  const [importStep, setImportStep]             = useState('upload') // 'upload' | 'preview' | 'confirm'
  const [importedProducts, setImportedProducts] = useState([])
  const [importValidation, setImportValidation] = useState(null)
  const [importProgress, setImportProgress]     = useState(0)
  const [importError, setImportError]           = useState('')
  const [importingProductIds, setImportingProductIds] = useState(new Set())
  const [importSummary, setImportSummary]       = useState(null)

  const load = () => {
    setLoading(true)
    productsAPI.adminGetAll()
      .then(res => setProducts(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    brandsAPI.getAll().then(res => setBrands(res.data || [])).catch(console.error)
    concentrationsAPI.getAll().then(res => setConcentrations(res.data || [])).catch(console.error)
  }, [])

  const loadGallery = (productId) => {
    setGalleryLoading(true)
    productImagesAPI.getAll(productId)
      .then(res => setGallery(res.data || []))
      .catch(() => setGallery([]))
      .finally(() => setGalleryLoading(false))
  }

  const loadVariants = (productId) => {
    setVariantsLoading(true)
    variantsAPI.getAll(productId)
      .then(res => setVariants(res.data || []))
      .catch(() => setVariants([]))
      .finally(() => setVariantsLoading(false))
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setGallery([])
    setVariants([])
    setNewImgUrl('')
    setNewImgAlt('')
    setNewVariant(EMPTY_VARIANT)
    setEditingVariant(null)
    setPendingVariants([])
    setPendingImages([])
    setError('')
    setModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name:          p.name          || '',
      brand:         p.brand         || '',
      concentration: p.concentration || '',
      description:   p.description   || '',
      details:       p.details       || '',
      price:         p.price         || '',
      old_price:     p.old_price     || '',
      rating:        p.rating        || '',
      image:         p.image         || '',
      badge:         p.badge         || '',
      gender:        p.gender        || ''
    })
    setGallery([])
    setVariants([])
    setNewImgUrl('')
    setNewImgAlt('')
    setNewVariant(EMPTY_VARIANT)
    setEditingVariant(null)
    setError('')
    setModal(true)
    loadGallery(p.id)
    loadVariants(p.id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name) { setError('Tên sản phẩm là bắt buộc'); return }
    const effectiveVariants = editing ? variants : pendingVariants
    if (effectiveVariants.length === 0 && !form.price) { setError('Vui lòng nhập giá hoặc thêm dung tích'); return }
    setSaving(true)
    setError('')
    try {
      let submitForm = { ...form }
      if (effectiveVariants.length > 0) {
        const maxVariant = effectiveVariants.reduce((max, v) => Number(v.price) > Number(max.price) ? v : max, effectiveVariants[0])
        submitForm = { ...submitForm, price: maxVariant.price, old_price: maxVariant.old_price || '' }
      }
      if (editing) {
        await productsAPI.update(editing.id, submitForm)
      } else {
        const res = await productsAPI.create(submitForm)
        const newId = res.data.id
        await Promise.all(pendingVariants.map(v => variantsAPI.add(newId, v)))
        await Promise.all(pendingImages.map((img, i) => productImagesAPI.add(newId, { ...img, sort_order: i })))
      }
      setModal(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa sản phẩm này?')) return
    setDeletingId(id)
    try {
      await productsAPI.delete(id)
      load()
    } catch (err) {
      console.error('[Delete product error]', err)
      setError(`Lỗi xóa sản phẩm: ${err.message}`)
    } finally {
      setDeletingId(null)
    }
  }

  // ── Gallery handlers ──────────────────────────────────────────────────────

  const handleAddImage = async () => {
    if (!newImgUrl.trim()) return
    
    // Validate image URL
    if (!isValidImageUrl(newImgUrl.trim())) {
      setError('URL ảnh không hợp lệ. Vui lòng sử dụng URL hình ảnh hợp lệ (http/https, định dạng .jpg/.png/.gif/.webp)')
      return
    }

    if (!editing) {
      // Create mode: store locally
      setPendingImages(imgs => [...imgs, { url: newImgUrl.trim(), alt_text: newImgAlt.trim() || null }])
      setNewImgUrl('')
      setNewImgAlt('')
      return
    }
    setAddingImg(true)
    try {
      await productImagesAPI.add(editing.id, {
        url:        newImgUrl.trim(),
        alt_text:   newImgAlt.trim() || null,
        sort_order: gallery.length,
      })
      setNewImgUrl('')
      setNewImgAlt('')
      loadGallery(editing.id)
    } catch (err) {
      console.error('[Add image error]', err)
      setError(`Lỗi thêm ảnh: ${err.message}`)
    } finally {
      setAddingImg(false)
    }
  }

  const handleRemoveImage = async (imageId) => {
    if (!editing || !window.confirm('Xóa ảnh này khỏi gallery?')) return
    setRemovingImgId(imageId)
    try {
      await productImagesAPI.remove(editing.id, imageId)
      setGallery(g => g.filter(img => img.id !== imageId))
    } catch (err) {
      console.error('[Remove image error]', err)
      setError(`Lỗi xóa ảnh: ${err.message}`)
    } finally {
      setRemovingImgId(null)
    }
  }

  // ── Variant handlers ───────────────────────────────────────────────────────

  const handleAddVariant = async () => {
    if (!newVariant.size_label.trim() || !newVariant.price) return
    if (!editing) {
      // Create mode: store locally
      setPendingVariants(vs => [...vs, {
        size_label: newVariant.size_label.trim(),
        price:      Number(newVariant.price),
        old_price:  newVariant.old_price ? Number(newVariant.old_price) : null,
        stock:      Number(newVariant.stock) || 0,
        sku:        newVariant.sku.trim() || null,
      }])
      setNewVariant(EMPTY_VARIANT)
      return
    }
    setAddingVariant(true)
    try {
      await variantsAPI.add(editing.id, {
        size_label: newVariant.size_label.trim(),
        price:      Number(newVariant.price),
        old_price:  newVariant.old_price ? Number(newVariant.old_price) : null,
        stock:      Number(newVariant.stock) || 0,
        sku:        newVariant.sku.trim() || null,
      })
      setNewVariant(EMPTY_VARIANT)
      loadVariants(editing.id)
    } catch (err) {
      console.error('[Add variant error]', err)
      setError(`Lỗi thêm dung tích: ${err.message}`)
    } finally {
      setAddingVariant(false)
    }
  }

  const handleSaveVariant = async () => {
    if (!editingVariant || !editingVariant.size_label.trim() || !editingVariant.price) return
    try {
      await variantsAPI.update(editing.id, editingVariant.id, {
        size_label: editingVariant.size_label.trim(),
        price:      Number(editingVariant.price),
        old_price:  editingVariant.old_price ? Number(editingVariant.old_price) : null,
        stock:      Number(editingVariant.stock) || 0,
        sku:        editingVariant.sku?.trim() || null,
        is_active:  true,
      })
      setEditingVariant(null)
      loadVariants(editing.id)
    } catch (err) {
      console.error('[Save variant error]', err)
      setError(`Lỗi cập nhật dung tích: ${err.message}`)
    }
  }

  const handleRemoveVariant = async (variantId) => {
    if (!editing || !window.confirm('Xóa dung tích này?')) return
    setRemovingVariantId(variantId)
    try {
      await variantsAPI.remove(editing.id, variantId)
      setVariants(v => v.filter(x => x.id !== variantId))
    } catch (err) {
      console.error('[Remove variant error]', err)
      setError(`Lỗi xóa dung tích: ${err.message}`)
    } finally {
      setRemovingVariantId(null)
    }
  }

  // ── Import handlers ────────────────────────────────────────────────────────

  const openImportModal = () => {
    setImportModal(true)
    setImportStep('upload')
    setImportFile(null)
    setImportedProducts([])
    setImportValidation(null)
    setImportError('')
    setImportProgress(0)
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.match(/\.(xlsx?|csv)$/i)) {
      setImportError('Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setImportError('File quá lớn. Vui lòng chọn file dưới 5MB')
      return
    }

    setImportFile(file)
    setImportError('')

    // Auto-parse and show preview
    try {
      setImportLoading(true)
      const rawData = await parseExcelFile(file)
      const validation = validateExcelData(rawData)
      setImportValidation(validation)

      if (!validation.isValid && validation.errors.length > 0) {
        setImportError(validation.errors.slice(0, 5).join('\n'))
        setImportLoading(false)
        return
      }

      const grouped = groupProductsBySize(rawData)
      setImportedProducts(grouped)
      setImportStep('preview')
    } catch (err) {
      setImportError(`Lỗi đọc file: ${err.message}`)
    } finally {
      setImportLoading(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!importedProducts.length) return

    setImportLoading(true)
    setImportError('')
    setImportStep('confirm')
    setImportProgress(0)

    try {
      const response = await fetch('/api/admin/ai/analyze-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ products: importedProducts }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Import failed')
      }

      const result = await response.json()

      setImportProgress(100)
      setImportSummary(result.results)
      load()
    } catch (err) {
      console.error('❌ Import error:', err)
      setImportError(`Lỗi import: ${err.message}`)
      setImportStep('preview')
    } finally {
      setImportLoading(false)
    }
  }

  const handleAIAnalysis = async (file) => {
    const fileToAnalyze = file || importFile
    if (!fileToAnalyze) {
      setImportError('Vui lòng chọn file trước')
      return
    }
    // Redirect to preview flow
    handleFileSelect({ target: { files: [fileToAnalyze] } })
  }

  const downloadTemplate = () => {
    const headers = ['Tên sản phẩm', 'Thương hiệu', 'Nồng độ', 'Giá', 'Giá cũ', 'Dung tích', 'Số lượng', 'SKU', 'Rating', 'Badge', 'Giới tính', 'Ảnh', 'Mô tả', 'Chi tiết']
    const sample = [
      ['Nước hoa Dior Sauvage', 'Dior', 'EDP', '2500000', '3000000', '100ml', '50', 'DS-100', '4.8', 'NEW', 'male', 'https://example.com/dior.jpg', 'Mô tả...', 'Chi tiết...'],
      ['Nước hoa Dior Sauvage', 'Dior', 'EDP', '1800000', '2200000', '60ml', '30', 'DS-60', '', '', '', '', '', ''],
      ['Nước hoa Chanel N°5', 'Chanel', 'Parfum', '3500000', '4000000', '100ml', '20', 'CN5-100', '4.5', 'HOT', 'female', 'https://example.com/chanel.jpg', 'Mô tả...', 'Chi tiết...'],
    ]
    const csvContent = [headers, ...sample].map(r => r.join(',')).join('\n')
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'template_import_san_pham.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportCancel = () => {
    setImportModal(false)
    setImportStep('upload')
    setImportFile(null)
    setImportedProducts([])
    setImportValidation(null)
    setImportError('')
    setImportProgress(0)
    setImportSummary(null)
  }

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.brand?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Sản phẩm</h1>
          <p className="text-gray-400 text-sm mt-1">{products.length} sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openImportModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            title="Import from Excel"
          >
            <Upload size={18} /> Import Excel
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
          >
            <Plus size={18} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="w-full pl-9 pr-4 py-2.5 bg-dark-900 border border-dark-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
          placeholder="Tìm kiếm sản phẩm, thương hiệu..."
          value={search}
          onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
        />
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 size={32} className="animate-spin text-primary-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-800 bg-dark-800/40">
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Ảnh</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Tên sản phẩm</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thương hiệu</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Giá</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Rating</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Badge</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Phân loại</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 text-xs uppercase tracking-wide">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {paginated.map(p => (
                  <tr key={p.id} className="hover:bg-dark-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 object-cover rounded-lg bg-dark-700"
                        onError={e => (e.target.src = '')}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium max-w-[200px] truncate">{p.name}</td>
                    <td className="px-4 py-3 text-gray-400">{p.brand}</td>
                    <td className="px-4 py-3 text-primary-400 font-semibold">
                      {p.variant_count > 0
                        ? p.min_variant_price === p.max_variant_price
                          ? formatVND(p.max_variant_price)
                          : <>{formatVND(p.min_variant_price)} – {formatVND(p.max_variant_price)}</>
                        : formatVND(p.price)
                      }
                    </td>
                    <td className="px-4 py-3 text-yellow-400">★ {p.rating}</td>
                    <td className="px-4 py-3">
                      {p.badge ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-600/30 text-primary-300">
                          {p.badge}
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      {p.gender === 'male'   && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">Nam</span>}
                      {p.gender === 'female' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-pink-500/20 text-pink-400">Nữ</span>}
                      {p.gender === 'unisex' && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">Unisex</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50"
                          title="Xóa"
                        >
                          {deletingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                      Không tìm thấy sản phẩm nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} / {filtered.length} sản phẩm
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition ${
                  page === currentPage
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-800 border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-dark-800 border border-dark-700 text-gray-400 hover:text-white hover:bg-dark-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 sticky top-0 bg-dark-900 z-10">
              <h2 className="font-bold text-lg">
                {editing ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Main product form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Field label="Tên sản phẩm *" name="name" value={form.name} onChange={setForm} />
              <div>
                <label className="block text-sm text-gray-400 mb-1">Thương hiệu</label>
                <select
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Chọn thương hiệu --</option>
                  {brands.map(b => (
                    <option key={b.id} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nồng độ</label>
                <select
                  value={form.concentration}
                  onChange={e => setForm(f => ({ ...f, concentration: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Chọn nồng độ --</option>
                  {concentrations.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              {(editing ? variants : pendingVariants).length > 0 ? (
                <div className="text-sm text-gray-400 bg-dark-800/60 border border-dark-700 rounded-lg px-4 py-3">
                  💡 Giá sản phẩm được tự động lấy từ dung tích lớn nhất
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Giá (VND) *" name="price" type="number" value={form.price} onChange={setForm} />
                  <Field label="Giá cũ (VND)" name="old_price" type="number" value={form.old_price} onChange={setForm} />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Rating (0-5)" name="rating" type="number" step="0.1" value={form.rating} onChange={setForm} />
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Badge</label>
                  <select
                    value={form.badge}
                    onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-dark-900 border border-dark-800 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="">Không có</option>
                    <option value="NEW">NEW</option>
                    <option value="SALE">SALE</option>
                    <option value="HOT">HOT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Phân loại giới tính</label>
                <select
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                >
                  <option value="">-- Không phân loại --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>

              {/* Main hero image */}
              <div>
                <Field label="Ảnh chính (URL)" name="image" value={form.image} onChange={setForm} />
                {form.image ? (
                  <img
                    src={form.image}
                    alt="preview"
                    className="mt-2 w-24 h-24 object-cover rounded-lg border border-dark-600"
                  />
                ) : null}
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Mô tả sản phẩm..."
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Thông tin chi tiết</label>
                <textarea
                  rows={6}
                  value={form.details}
                  onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-y"
                  placeholder="Thông tin chi tiết sản phẩm, thành phần, hướng dẫn sử dụng..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="flex-1 px-4 py-2.5 border border-dark-600 rounded-lg text-sm hover:bg-dark-700 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                  {editing ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>

            {/* ── Gallery section ── */}
            <div className="px-6 pb-6 space-y-4 border-t border-dark-800 pt-5">
              <div className="flex items-center gap-2">
                <ImagePlus size={18} className="text-primary-400" />
                <h3 className="font-semibold text-base">Gallery ảnh</h3>
                <span className="ml-auto text-xs text-gray-500">
                  {editing ? gallery.length : pendingImages.length} ảnh
                  {!editing && pendingImages.length > 0 && <span className="ml-1 text-amber-400">(chờ lưu)</span>}
                </span>
              </div>

              {editing && galleryLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={24} className="animate-spin text-primary-500" />
                </div>
              ) : (editing ? gallery : pendingImages).length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {(editing ? gallery : pendingImages).map((img, idx) => (
                    <div key={editing ? img.id : idx} className="relative group rounded-xl overflow-hidden border border-dark-700 bg-dark-800">
                      <img
                        src={img.url}
                        alt={img.alt_text || ''}
                        className="w-full aspect-square object-cover"
                        onError={e => { e.target.style.opacity = '0.2' }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => editing
                            ? handleRemoveImage(img.id)
                            : setPendingImages(imgs => imgs.filter((_, i) => i !== idx))
                          }
                          disabled={removingImgId === img.id}
                          className="p-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
                          title="Xóa ảnh"
                        >
                          {removingImgId === img.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                      {img.alt_text ? (
                        <p className="text-[10px] text-gray-400 px-1 py-0.5 truncate bg-dark-900/80 absolute bottom-0 left-0 right-0">
                          {img.alt_text}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-6 text-center border border-dashed border-dark-700 rounded-xl">
                  Chưa có ảnh trong gallery
                </p>
              )}

              {/* Add image row */}
              <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Thêm ảnh vào gallery</p>
                <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                  <input
                    type="text"
                    placeholder="URL ảnh *"
                    value={newImgUrl}
                    onChange={e => setNewImgUrl(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
                    className="flex-1 min-w-0 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Alt text (tùy chọn)"
                    value={newImgAlt}
                    onChange={e => setNewImgAlt(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={!newImgUrl.trim() || addingImg}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {addingImg ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    Thêm
                  </button>
                </div>
                {newImgUrl.trim() ? (
                  <img src={newImgUrl} alt="preview" className="w-20 h-20 object-cover rounded-lg border border-dark-600" onError={e => (e.target.style.opacity = '0.3')} />
                ) : null}
              </div>
            </div>

            {/* ── Variants section (dung tích) ── */}
            <div className="px-6 pb-6 space-y-4 border-t border-dark-800 pt-5">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-primary-400" />
                <h3 className="font-semibold text-base">Dung tích</h3>
                <span className="ml-auto text-xs text-gray-500">
                  {editing ? variants.length : pendingVariants.length} dung tích
                  {!editing && pendingVariants.length > 0 && <span className="ml-1 text-amber-400">(chờ lưu)</span>}
                </span>
              </div>

              {editing && variantsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={24} className="animate-spin text-primary-500" />
                </div>
              ) : editing && variants.length > 0 ? (
                <div className="space-y-2">
                  {variants.map(v => editingVariant?.id === v.id ? (
                      <div key={v.id} className="bg-dark-800 border border-primary-500/40 rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            placeholder="Nhãn (vd: 30ml) *"
                            value={editingVariant.size_label}
                            onChange={e => setEditingVariant(ev => ({ ...ev, size_label: e.target.value }))}
                            className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                          />
                          <input
                            type="number" placeholder="Giá *"
                            value={editingVariant.price}
                            onChange={e => setEditingVariant(ev => ({ ...ev, price: e.target.value }))}
                            className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                          />
                          <input
                            type="number" placeholder="Giá cũ"
                            value={editingVariant.old_price || ''}
                            onChange={e => setEditingVariant(ev => ({ ...ev, old_price: e.target.value }))}
                            className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                          />
                          <input
                            type="number" placeholder="Tồn kho"
                            value={editingVariant.stock}
                            onChange={e => setEditingVariant(ev => ({ ...ev, stock: e.target.value }))}
                            className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-primary-500"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button type="button" onClick={() => setEditingVariant(null)}
                            className="px-3 py-1.5 border border-dark-600 rounded-lg text-xs hover:bg-dark-700 transition">
                            Hủy
                          </button>
                          <button type="button" onClick={handleSaveVariant}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs transition">
                            Lưu
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={v.id} className="flex items-center gap-3 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3">
                        <span className="font-semibold text-sm text-primary-300 w-16 shrink-0">{v.size_label}</span>
                        <span className="text-sm text-white flex-1">{formatVND(v.price)}</span>
                        {v.old_price ? <span className="text-xs text-gray-500 line-through">{formatVND(v.old_price)}</span> : null}
                        <span className="text-xs text-gray-400">Kho: {v.stock}</span>
                        <button type="button" onClick={() => setEditingVariant({ ...v })}
                          className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 transition">
                          <Pencil size={13} />
                        </button>
                        <button type="button" onClick={() => handleRemoveVariant(v.id)}
                          disabled={removingVariantId === v.id}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition disabled:opacity-50">
                          {removingVariantId === v.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>
              ) : !editing && pendingVariants.length > 0 ? (
                <div className="space-y-2">
                  {pendingVariants.map((v, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3">
                      <span className="font-semibold text-sm text-primary-300 w-16 shrink-0">{v.size_label}</span>
                      <span className="text-sm text-white flex-1">{formatVND(v.price)}</span>
                      {v.old_price ? <span className="text-xs text-gray-500 line-through">{formatVND(v.old_price)}</span> : null}
                      <span className="text-xs text-gray-400">Kho: {v.stock}</span>
                      <button type="button" onClick={() => setPendingVariants(vs => vs.filter((_, i) => i !== idx))}
                        className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/40 transition">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 py-4 text-center border border-dashed border-dark-700 rounded-xl">
                  Chưa có dung tích nào
                </p>
              )}

              {/* Add new variant */}
              <div className="bg-dark-800/60 border border-dark-700 rounded-xl p-4 space-y-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Thêm dung tích mới</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Nhãn * (vd: 30ml, 70ml, 100ml)"
                    value={newVariant.size_label}
                    onChange={e => setNewVariant(v => ({ ...v, size_label: e.target.value }))}
                    className="col-span-2 px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                  <input
                    type="number" placeholder="Giá (VND) *"
                    value={newVariant.price}
                    onChange={e => setNewVariant(v => ({ ...v, price: e.target.value }))}
                    className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                  <input
                    type="number" placeholder="Giá cũ (VND)"
                    value={newVariant.old_price}
                    onChange={e => setNewVariant(v => ({ ...v, old_price: e.target.value }))}
                    className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                  <input
                    type="number" placeholder="Tồn kho"
                    value={newVariant.stock}
                    onChange={e => setNewVariant(v => ({ ...v, stock: e.target.value }))}
                    className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                  <input
                    placeholder="SKU (tùy chọn)"
                    value={newVariant.sku}
                    onChange={e => setNewVariant(v => ({ ...v, sku: e.target.value }))}
                    className="px-3 py-2 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  disabled={!newVariant.size_label.trim() || !newVariant.price || addingVariant}
                  className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {addingVariant ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Thêm dung tích
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Import Modal */}
      {importModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-dark-900 border border-dark-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800 sticky top-0 bg-dark-900 z-10">
              <h2 className="font-bold text-lg">Import từ Excel</h2>
              <button onClick={handleImportCancel} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Modal content */}
            <div className="p-6 space-y-6">
              {/* Error message */}
              {importError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg whitespace-pre-wrap">
                  {importError}
                </div>
              )}

              {/* Step 1: Upload */}
              {importStep === 'upload' && (
                <div className="space-y-4">
                  <p className="text-gray-300">Chọn file Excel chứa dữ liệu sản phẩm của bạn</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={downloadTemplate}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-800 border border-dark-600 text-gray-300 rounded-lg hover:bg-dark-700 transition"
                    >
                      <Download size={14} /> Tải template mẫu (.csv)
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-dark-700 rounded-xl p-8 text-center hover:border-primary-500 transition cursor-pointer">
                    <label className="cursor-pointer">
                      <Upload size={32} className="mx-auto mb-3 text-gray-400" />
                      <p className="text-sm text-gray-300">Kéo thả file hoặc <span className="text-primary-400">bấm để chọn</span></p>
                      <p className="text-xs text-gray-500 mt-1">Hỗ trợ .xlsx, .xls, .csv</p>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={importLoading}
                      />
                    </label>
                  </div>
                  {importLoading && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      Đang đọc file...
                    </div>
                  )}
                  {importFile && !importLoading && (
                    <div className="bg-dark-800/60 border border-dark-700 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-green-400 shrink-0" />
                      <span className="text-sm text-white">{importFile.name}</span>
                    </div>
                  )}
                  <div className="bg-dark-800/60 border border-dark-700 rounded-lg p-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-300">Format Excel dự kiến:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Tên sản phẩm (bắt buộc)</li>
                      <li>• Thương hiệu, Nồng độ, Giá, Giá cũ</li>
                      <li>• Dung tích, SKU, Tồn kho (cho variant)</li>
                      <li>• Ảnh chính, Mô tả, Chi tiết, Rating, Badge, Giới tính</li>
                      <li className="text-amber-400">💡 Sản phẩm cùng tên sẽ được gộp dung tích</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Step 2: Preview */}
              {importStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Eye size={18} className="text-primary-400" />
                    <h3 className="font-semibold text-sm">Xem trước dữ liệu</h3>
                    <span className="ml-auto text-xs text-gray-400">
                      {importedProducts.length} sản phẩm
                    </span>
                  </div>

                  {importValidation?.warnings?.length > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 max-h-24 overflow-y-auto">
                      <p className="text-yellow-400 text-xs font-semibold mb-1">⚠️ Cảnh báo:</p>
                      <ul className="text-xs text-yellow-300 space-y-0.5">
                        {importValidation.warnings.slice(0, 5).map((w, i) => (
                          <li key={i}>• {w}</li>
                        ))}
                        {importValidation.warnings.length > 5 && <li>... và {importValidation.warnings.length - 5} cảnh báo khác</li>}
                      </ul>
                    </div>
                  )}

                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto border border-dark-700 rounded-xl">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-dark-800 z-10">
                        <tr className="border-b border-dark-700">
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">#</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Sản phẩm</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Thương hiệu</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Nồng độ</th>
                          <th className="px-3 py-2 text-left text-gray-400 font-medium">Dung tích</th>
                          <th className="px-3 py-2 text-right text-gray-400 font-medium">Giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-700">
                        {importedProducts.map((p, idx) => (
                          <tr key={idx} className="hover:bg-dark-700/30">
                            <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                            <td className="px-3 py-2 text-white font-medium max-w-[180px] truncate">{p.name}</td>
                            <td className="px-3 py-2 text-gray-300">{p.brand || '—'}</td>
                            <td className="px-3 py-2 text-gray-300">{p.concentration || '—'}</td>
                            <td className="px-3 py-2 text-primary-300">
                              {p.variants?.length > 0
                                ? p.variants.map(v => v.size_label).join(', ')
                                : '—'}
                            </td>
                            <td className="px-3 py-2 text-right text-primary-400 font-semibold">
                              {p.variants?.length > 0
                                ? formatVND(Math.max(...p.variants.map(v => v.price)))
                                : formatVND(p.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Step 2: Confirm/Processing */}
              {importStep === 'confirm' && (
                <div className="space-y-4">
                  {importLoading ? (
                    <div className="text-center py-8">
                      <div className="flex justify-center mb-4">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 border-2 border-dark-700 rounded-full"></div>
                          <div className="absolute inset-0 border-2 border-transparent border-t-primary-500 border-r-primary-500 rounded-full animate-spin"></div>
                        </div>
                      </div>
                      <p className="text-gray-300 mb-2">🤖 AI đang phân tích dữ liệu...</p>
                      <p className="text-xs text-gray-500">Vui lòng chờ trong giây lát</p>
                      <div className="mt-6 w-full bg-dark-700 rounded-full h-1 overflow-hidden">
                        <div
                          className="h-full bg-primary-500 transition-all duration-500"
                          style={{ width: `${importProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">{importProgress}%</p>
                    </div>
                  ) : importError ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold mb-1">Lỗi import:</p>
                        <p className="text-xs">{importError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                        <p className="text-green-400 font-semibold text-sm">✅ Import thành công!</p>
                        <p className="text-gray-300 text-sm mt-2">Dữ liệu sản phẩm đã được AI phân tích và thêm vào hệ thống</p>
                      </div>
                      <div className="bg-dark-800/60 border border-dark-700 rounded-lg p-4 grid grid-cols-3 gap-3">
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Tạo mới</p>
                          <p className="text-2xl font-bold text-green-400">
                            {importSummary?.created?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Lỗi</p>
                          <p className="text-2xl font-bold text-red-400">
                            {importSummary?.failed?.length || 0}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase">Trùng</p>
                          <p className="text-2xl font-bold text-yellow-400">
                            {importSummary?.duplicates?.length || 0}
                          </p>
                        </div>
                      </div>
                      {importSummary?.failed?.length > 0 && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <p className="text-red-400 text-xs font-semibold mb-2">Lỗi import:</p>
                          <ul className="text-xs text-red-300 space-y-1">
                            {importSummary.failed.slice(0, 5).map((err, i) => (
                              <li key={i}>• {err.name}: {err.reason}</li>
                            ))}
                            {importSummary.failed.length > 5 && <li>... và {importSummary.failed.length - 5} cái khác</li>}
                          </ul>
                        </div>
                      )}
                      {importSummary?.duplicates?.length > 0 && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 max-h-32 overflow-y-auto">
                          <p className="text-yellow-400 text-xs font-semibold mb-2">Sản phẩm trùng (bỏ qua):</p>
                          <ul className="text-xs text-yellow-300 space-y-1">
                            {importSummary.duplicates.slice(0, 5).map((dup, i) => (
                              <li key={i}>• {dup}</li>
                            ))}
                            {importSummary.duplicates.length > 5 && <li>... và {importSummary.duplicates.length - 5} cái khác</li>}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modal footer */}
              <div className="flex gap-3 pt-4 border-t border-dark-800">
                <button
                  type="button"
                  onClick={importStep === 'preview' ? () => { setImportStep('upload'); setImportFile(null); setImportedProducts([]); } : handleImportCancel}
                  disabled={importLoading}
                  className="flex-1 px-4 py-2.5 border border-dark-600 rounded-lg text-sm hover:bg-dark-700 transition disabled:opacity-50"
                >
                  {importStep === 'confirm' && !importLoading ? 'Đóng' : importStep === 'preview' ? 'Quay lại' : 'Hủy'}
                </button>
                {importStep === 'preview' && (
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importLoading || !importedProducts.length}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    Import {importedProducts.length} sản phẩm
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, name, type = 'text', step, value, onChange }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={e => onChange(f => ({ ...f, [name]: e.target.value }))}
        className="w-full px-3 py-2.5 bg-dark-900 border border-dark-600 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
      />
    </div>
  )
}
