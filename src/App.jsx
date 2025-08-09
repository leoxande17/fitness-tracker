import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import StudentDashboard from './components/StudentDashboard.jsx'
import TrainerDashboard from './components/TrainerDashboard.jsx'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [currentView, setCurrentView] = useState('login') // 'login' ou 'register'
  const [loading, setLoading] = useState(true)

  // Verificar se o usuário já está logado
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.log('Usuário não autenticado')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleRegister = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' })
      setUser(null)
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    return currentView === 'login' ? (
      <Login 
        onLogin={handleLogin} 
        onSwitchToRegister={() => setCurrentView('register')} 
      />
    ) : (
      <Register 
        onRegister={handleRegister} 
        onSwitchToLogin={() => setCurrentView('login')} 
      />
    )
  }

  // Interface principal após login
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Fitness Tracker</h1>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">
                Olá, {user.nome_completo}
                {user.tipo_usuario === 'personal_trainer' && user.codigo_personal && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Código: {user.codigo_personal}
                  </span>
                )}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {user.tipo_usuario === 'aluno' ? (
            <StudentDashboard user={user} />
          ) : (
            <TrainerDashboard user={user} />
          )}
        </div>
      </main>
    </div>
  )
}

export default App
