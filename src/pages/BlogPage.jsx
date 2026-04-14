import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MessageCircle, Eye, Calendar, ArrowRight } from 'lucide-react'
import { postsAPI } from '../utils/api'

export default function BlogPage() {
  const [posts, setPosts]     = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage]       = useState(1)
  const [total, setTotal]     = useState(0)
  const LIMIT = 9

  useEffect(() => {
    setLoading(true)
    postsAPI.getAll({ page, limit: LIMIT })
      .then(res => { setPosts(res.data); setTotal(res.pagination?.total || 0) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [page])

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-dark-900 to-dark-800 border-b border-dark-700">
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-serif font-bold text-white mb-3">Bài viết</h1>
          <p className="text-gray-400 max-w-lg mx-auto">Khám phá thế giới nước hoa — tips, review, câu chuyện đằng sau từng mùi hương.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={36} className="animate-spin text-primary-500" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500">Chưa có bài viết nào.</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group bg-dark-900 border border-dark-800 rounded-2xl overflow-hidden hover:border-primary-500/50 transition-all hover:-translate-y-1"
                >
                  {/* Cover image */}
                  <div className="aspect-video bg-dark-800 overflow-hidden">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl font-serif">
                        ✦
                      </div>
                    )}
                  </div>

                  <div className="p-5">
                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(post.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={11} /> {post.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle size={11} /> {post.comment_count || 0}
                      </span>
                    </div>

                    <h2 className="font-bold text-white group-hover:text-primary-300 transition-colors line-clamp-2 mb-2">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">{post.excerpt}</p>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 text-xs">{post.author_name || 'Admin'}</span>
                      <span className="text-primary-400 flex items-center gap-1 text-xs font-medium group-hover:gap-2 transition-all">
                        Đọc thêm <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {total > LIMIT && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: Math.ceil(total / LIMIT) }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      p === page
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-800 border border-dark-700 text-gray-400 hover:border-primary-500'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
