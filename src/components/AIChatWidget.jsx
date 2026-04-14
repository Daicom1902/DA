import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AIChatWidget.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const REQUEST_TIMEOUT_MS = 18000
const REQUEST_RETRY_COUNT = 1

const SUGGESTIONS = [
  '💐 Tư vấn nước hoa nữ',
  '🌿 Nước hoa mùa hè',
  '🎩 Nước hoa nam cao cấp',
  '💝 Quà tặng người yêu',
  '💼 Nước hoa đi làm',
  '✨ Nước hoa bán chạy',
]

// Simple markdown renderer (bold + strikethrough)
function renderMarkdown(text) {
  if (!text) return text
  const parts = []
  let key = 0
  // Match **bold** and ~~strikethrough~~
  const regex = /\*\*(.+?)\*\*|~~(.+?)~~/g
  let match, lastIndex = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    if (match[1]) parts.push(<strong key={key++}>{match[1]}</strong>)
    if (match[2]) parts.push(<del key={key++} style={{opacity:0.5, fontSize:'0.9em'}}>{match[2]}</del>)
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }
  return parts.length > 0 ? parts : text
}

// Icons as inline SVG
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z"/>
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.13-3.36L23 10M1 14l5.36 4.36A9 9 0 0020.49 15" />
  </svg>
)

const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 6 15 12 9 18"/>
  </svg>
)

// Product Carousel with arrow buttons
function ProductCarousel({ products, onProductClick, formatPrice }) {
  const scrollRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = () => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    // Delay check to allow layout to complete
    const timer = setTimeout(checkScroll, 100)
    el.addEventListener('scroll', checkScroll, { passive: true })
    // Watch for size changes
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      clearTimeout(timer)
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [products])

  const scroll = (dir) => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir * 160, behavior: 'smooth' })
  }

  return (
    <div className="ai-chat-carousel">
      <button
        className={`ai-chat-carousel-btn left${!canScrollLeft ? ' hidden' : ''}`}
        onClick={() => scroll(-1)}
        type="button"
        disabled={!canScrollLeft}
      >
        <ChevronLeftIcon />
      </button>
      <div className="ai-chat-products" ref={scrollRef}>
        {products.map((p) => (
          <a
            key={p.id}
            className="ai-chat-product-card"
            onClick={(e) => { e.preventDefault(); onProductClick(p.id) }}
            href={`/product/${p.id}`}
          >
            {p.image && (
              <img className="ai-chat-product-img" src={p.image} alt={p.name} loading="lazy" />
            )}
            <div className="ai-chat-product-info">
              {p.brand && <p className="brand">{p.brand}</p>}
              <p className="name">{p.name}</p>
              <p className="price">{formatPrice(p.price)}</p>
            </div>
          </a>
        ))}
      </div>
      <button
        className={`ai-chat-carousel-btn right${!canScrollRight ? ' hidden' : ''}`}
        onClick={() => scroll(1)}
        type="button"
        disabled={!canScrollRight}
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

export default function AIChatWidget() {
  const buildNewSessionId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
    return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  const [isOpen, setIsOpen] = useState(false)
  const [sessionId, setSessionId] = useState(() => buildNewSessionId())
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [networkError, setNetworkError] = useState('')
  const [lastFailedMessage, setLastFailedMessage] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 350)
  }, [isOpen])

  const requestChat = async (payload, retries = REQUEST_RETRY_COUNT) => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      return await res.json()
    } catch (error) {
      if (retries > 0) {
        return requestChat(payload, retries - 1)
      }
      throw error
    } finally {
      clearTimeout(timeout)
    }
  }

  const sendMessage = async (text) => {
    const userMsg = text.trim()
    if (!userMsg || loading) return

    const newMessages = [...messages, { role: 'user', content: userMsg }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setNetworkError('')
    setLastFailedMessage('')

    try {
      const data = await requestChat({
        sessionId,
        message: userMsg,
        history: newMessages.slice(-10),
      })

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply,
        products: data.suggestedProducts || []
      }])
    } catch {
      setLastFailedMessage(userMsg)
      setNetworkError('Kết nối đang không ổn định. Bạn có thể thử gửi lại ngay.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Xin lỗi, có lỗi kết nối. Vui lòng thử lại sau nhé! 🙏',
        products: []
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  const formatPrice = (price) => {
    return Number(price).toLocaleString('vi-VN') + 'đ'
  }

  const resetChat = () => {
    const newSessionId = buildNewSessionId()
    setSessionId(newSessionId)
    setMessages([])
    setInput('')
    setNetworkError('')
    setLastFailedMessage('')
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        id="ai-chat-toggle"
        className={`ai-chat-toggle${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat với AI tư vấn"
      >
        {isOpen ? <CloseIcon /> : <SparkleIcon />}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="ai-chat-panel" id="ai-chat-panel">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-chat-header-info">
              <div className="ai-chat-avatar">
                <SparkleIcon />
              </div>
              <div className="ai-chat-header-text">
                <h4>LUMIÈRE AI</h4>
                <p>Chuyên gia tư vấn nước hoa ✨</p>
              </div>
            </div>
            <div className="ai-chat-header-actions">
              <button
                className="ai-chat-action-btn"
                onClick={resetChat}
                type="button"
                title="Làm mới hội thoại"
              >
                <RefreshIcon />
              </button>
              <button className="ai-chat-close" onClick={() => setIsOpen(false)} type="button">
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="ai-chat-messages">
            {messages.length === 0 && (
              <div className="ai-chat-welcome">
                <div className="ai-chat-welcome-icon">
                  <SparkleIcon />
                </div>
                <h3>Xin chào! 👋</h3>
                <p>Tôi là trợ lý AI của LUMIÈRE. Hãy cho tôi biết bạn đang tìm kiếm loại nước hoa nào nhé!</p>

                <div className="ai-chat-suggestions">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      className="ai-chat-suggestion-btn"
                      onClick={() => sendMessage(s.replace(/^[^\p{L}\p{N}]+/u, '').trim())}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`ai-chat-msg ${msg.role}`}>
                <div className="ai-chat-msg-bubble">
                  <div style={{ whiteSpace: 'pre-wrap' }}>{typeof msg.content === 'string' ? msg.content.split('\n').map((line, li) => <span key={li}>{renderMarkdown(line)}{li < msg.content.split('\n').length - 1 && <br/>}</span>) : msg.content}</div>

                  {/* Product Carousel */}
                  {msg.products && msg.products.length > 0 && (
                    <ProductCarousel
                      products={msg.products}
                      onProductClick={(id) => { navigate(`/product/${id}`); setIsOpen(false) }}
                      formatPrice={formatPrice}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="ai-chat-typing">
                <div className="ai-chat-typing-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form className="ai-chat-input-area" onSubmit={handleSubmit}>
            {networkError && (
              <div className="ai-chat-network-error" role="status">
                <span>{networkError}</span>
                {lastFailedMessage && !loading && (
                  <button
                    type="button"
                    className="ai-chat-retry-btn"
                    onClick={() => sendMessage(lastFailedMessage)}
                  >
                    Gửi lại
                  </button>
                )}
              </div>
            )}
            <input
              ref={inputRef}
              className="ai-chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về nước hoa..."
              disabled={loading}
            />
            <button
              className="ai-chat-send"
              type="submit"
              disabled={!input.trim() || loading}
              title="Gửi"
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
