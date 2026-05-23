import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import liff from '@line/liff'
import './index.css'
import App from './App.jsx'

const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''

async function bootstrap() {
  /**
   * ต้อง liff.init() ก่อน React render เพื่อให้ LIFF process
   * OAuth callback params (?code=xxx) ใน URL ก่อนที่ React Router
   * จะ navigate ไป /login และลบ params ทิ้ง
   */
  if (LIFF_ID) {
    try {
      await liff.init({ liffId: LIFF_ID })
    } catch (err) {
      console.warn('[LIFF] pre-render init failed:', err)
      // ถ้า init fail ก็ render ต่อ → AuthContext จะจัดการ error state
    }
  }

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
