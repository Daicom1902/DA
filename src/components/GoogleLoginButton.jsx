import { useEffect, useRef, useCallback } from 'react'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function waitForGoogle(timeout = 5000) {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) { resolve(); return }
    const start = Date.now()
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) { clearInterval(timer); resolve() }
      else if (Date.now() - start > timeout) { clearInterval(timer); reject(new Error('Google script timeout')) }
    }, 100)
  })
}

/**
 * Renders a Google Sign-In button using Google Identity Services.
 * Requires the GSI script loaded in index.html and VITE_GOOGLE_CLIENT_ID set.
 */
export default function GoogleLoginButton({ onSuccess, onError, text = 'signin_with' }) {
  const btnRef = useRef(null)

  const handleCredential = useCallback(async (response) => {
    try {
      await onSuccess(response.credential)
    } catch (err) {
      onError(err.message || 'Đăng nhập Google thất bại')
    }
  }, [onSuccess, onError])

  useEffect(() => {
    if (!CLIENT_ID || CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') return

    waitForGoogle()
      .then(() => {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: handleCredential,
        })
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: 'outline',
            size: 'large',
            text,
            width: btnRef.current.offsetWidth || 380,
            logo_alignment: 'center',
          })
        }
      })
      .catch(() => onError('Không thể tải Google Sign-In. Vui lòng thử lại.'))
  }, [handleCredential, text, onError])

  if (!CLIENT_ID || CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
    return (
      <button
        type="button"
        disabled
        className="w-full flex items-center justify-center gap-3 py-3 bg-dark-700 border border-dark-600 rounded-xl text-gray-500 cursor-not-allowed text-sm"
      >
        <GoogleIcon />
        Đăng nhập với Google (chưa cấu hình)
      </button>
    )
  }

  return <div ref={btnRef} className="w-full flex justify-center min-h-[44px]" />
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
