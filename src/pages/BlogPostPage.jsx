import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2, Calendar, Eye, MessageCircle, Send, User } from 'lucide-react'
import { postsAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function BlogPostPage() {
  const { slug }     = useParams()
  const { user }     = useAuth()

  const [post, setPost]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [commentForm, setCommentForm] = useState({ content: '', guest_name: '', guest_email: '' })
  const [submitting, setSubmitting]   = useState(false)
  const [commentError, setCommentError]   = useState('')
  const [commentSuccess, setCommentSuccess] = useState(false)

  const load = () => {
    setLoading(true)
    postsAPI.getBySlug(slug)
      .then(res => setPost(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [slug])

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentForm.content.trim()) return
    setSubmitting(true)
    setCommentError('')
    setCommentSuccess(false)
    try {
      await postsAPI.addComment(post.id, {
        content:     commentForm.content.trim(),
        guest_name:  user ? undefined : commentForm.guest_name,
        guest_email: user ? undefined : commentForm.guest_email,
      })
      setCommentSuccess(true)
      setCommentForm({ content: '', guest_name: '', guest_email: '' })
      // Reload to show new comment
      load()
    } catch (err) {
      setCommentError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={36} className="animate-spin text-primary-500" />
    </div>
  )

  if (error || !post) return (
    <div className="min-h-screen flex items-center justify-center text-center px-4">
      <div>
        <p className="text-red-400 mb-4">{error || 'Không tìm thấy bài viết'}</p>
        <Link to="/blog" className="text-primary-400 hover:underline">← Quay lại trang Blog</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Cover */}
      {post.cover_image && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6">
          <Link to="/blog" className="hover:text-primary-400 transition">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-white">{post.title}</span>
        </nav>

        {/* Title & meta */}
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8">
          <span className="flex items-center gap-1.5">
            <User size={14} /> {post.author_name || 'Admin'}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(post.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </span>
          <span className="flex items-center gap-1.5"><Eye size={14} /> {post.views} lượt xem</span>
          <span className="flex items-center gap-1.5"><MessageCircle size={14} /> {post.comments?.length || 0} bình luận</span>
        </div>

        {/* Content */}
        <div
          className="prose prose-invert prose-lg max-w-none mb-12 text-gray-300 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br/>') }}
        />

        {/* Comments Section */}
        <div className="border-t border-dark-700 pt-10">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageCircle size={20} className="text-primary-400" />
            Bình luận ({post.comments?.length || 0})
          </h2>

          {/* Comment list */}
          {post.comments?.length > 0 ? (
            <div className="space-y-4 mb-8">
              {post.comments.map(c => (
                <div key={c.id} className="bg-dark-900 border border-dark-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-400 font-bold text-sm">
                      {(c.user_name || c.guest_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{c.user_name || c.guest_name || 'Khách'}</p>
                      <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm mb-8">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          )}

          {/* Comment form */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-6">
            <h3 className="font-semibold mb-4">Để lại bình luận</h3>

            {commentSuccess && (
              <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm px-4 py-3 rounded-lg mb-4">
                Bình luận của bạn đã được đăng!
              </div>
            )}
            {commentError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
                {commentError}
              </div>
            )}

            <form onSubmit={handleCommentSubmit} className="space-y-4">
              {!user && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Tên của bạn *</label>
                    <input
                      type="text"
                      required
                      value={commentForm.guest_name}
                      onChange={e => setCommentForm(f => ({ ...f, guest_name: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                      placeholder="Nhập tên..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Email (tùy chọn)</label>
                    <input
                      type="email"
                      value={commentForm.guest_email}
                      onChange={e => setCommentForm(f => ({ ...f, guest_email: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500"
                      placeholder="email@..."
                    />
                  </div>
                </div>
              )}
              {user && (
                <p className="text-sm text-gray-400">Đang bình luận với tên: <span className="text-primary-300 font-medium">{user.full_name}</span></p>
              )}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Nội dung *</label>
                <textarea
                  rows={4}
                  required
                  value={commentForm.content}
                  onChange={e => setCommentForm(f => ({ ...f, content: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-dark-800 border border-dark-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 resize-none"
                  placeholder="Chia sẻ suy nghĩ của bạn..."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Gửi bình luận
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
