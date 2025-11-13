import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()
  const location = useLocation()

  // กำลังโหลด auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-gray-500">
        Loading...
      </div>
    )
  }

  // ถ้ายังไม่ได้ login ให้ redirect ไปหน้า login พร้อมเก็บ path ที่ต้องการเข้าถึง
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // ถ้า login แล้ว ให้แสดง children (หน้า home, profile, etc.)
  return children
}

