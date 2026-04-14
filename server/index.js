import express   from 'express'
import cors      from 'cors'
import dotenv    from 'dotenv'

dotenv.config()

import pool          from './db.js'
import authRouter    from './routes/auth.js'
import productsRouter from './routes/products.js'
import brandsRouter  from './routes/brands.js'
import concentrationsRouter from './routes/concentrations.js'
import ordersRouter  from './routes/orders.js'
import contactRouter from './routes/contact.js'
import promoRouter   from './routes/promo.js'
import adminRouter   from './routes/admin.js'
import postsRouter   from './routes/posts.js'
import chatRouter    from './routes/chat.js'
import cartRouter    from './routes/cart.js'

const app  = express()
const PORT = process.env.PORT || 5000

// ── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ],
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter)
app.use('/api/products', productsRouter)
app.use('/api/brands',          brandsRouter)
app.use('/api/concentrations',  concentrationsRouter)
app.use('/api/orders',   ordersRouter)
app.use('/api/contact',  contactRouter)
app.use('/api/promo',    promoRouter)
app.use('/api/admin',    adminRouter)
app.use('/api/posts',    postsRouter)
app.use('/api/chat',     chatRouter)
app.use('/api/cart',     cartRouter)

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }))

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.method} ${req.path} không tồn tại` }))

// Global error handler
app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ message: err.message || 'Lỗi server' })
})

// ── Start server ──────────────────────────────────────────────────────────
async function startServer() {
  // Kiểm tra kết nối DB trước khi bind port
  try {
    const conn = await pool.getConnection()
    await conn.ping()
    conn.release()
    console.log(`✅  Database "${process.env.DB_NAME || 'datn_perfume'}" kết nối thành công`)
  } catch (err) {
    console.error('❌  Không thể kết nối database:', err.message)
    console.error('    Kiểm tra MySQL đang chạy và thông tin .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)')
    process.exit(1)
  }

  const server = app.listen(PORT, () => {
    console.log(`✅  API server chạy tại http://localhost:${PORT}`)
    console.log(`    Health: http://localhost:${PORT}/api/health`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌  Port ${PORT} đang bị chiếm. Chạy lệnh sau để giải phóng:`)
      console.error(`    npx kill-port ${PORT}   hoặc   npm run server:kill`)
    } else {
      console.error('❌  Lỗi server:', err.message)
    }
    process.exit(1)
  })
}

startServer()
