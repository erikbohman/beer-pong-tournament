import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { LoginPage } from '@/pages/LoginPage'
import { TournamentsPage } from '@/pages/admin/TournamentsPage'
import { NewTournamentPage } from '@/pages/admin/NewTournamentPage'
import { EditTournamentPage } from '@/pages/admin/EditTournamentPage'
import { ThemesPage } from '@/pages/admin/ThemesPage'
import { RulesPage } from '@/pages/admin/RulesPage'
import { TournamentPage } from '@/pages/public/TournamentPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tournament/:id" element={<TournamentPage />} />

          {/* Protected admin routes */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="tournaments" replace />} />
              <Route path="tournaments" element={<TournamentsPage />} />
              <Route path="tournaments/new" element={<NewTournamentPage />} />
              <Route path="tournaments/:id/edit" element={<EditTournamentPage />} />
              <Route path="themes" element={<ThemesPage />} />
              <Route path="rules" element={<RulesPage />} />
            </Route>
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/admin/tournaments" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
