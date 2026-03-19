import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PageSpinner } from '@/components/ui/Spinner'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}
