import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
import { Play, Square, Clock, Dumbbell, CheckCircle2, Circle } from 'lucide-react'

const DIAS_SEMANA = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
]

export default function StudentDashboard({ user }) {
  const [selectedDay, setSelectedDay] = useState('')
  const [workouts, setWorkouts] = useState({})
  const [currentWorkout, setCurrentWorkout] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [exerciseStatus, setExerciseStatus] = useState([])
  const [exerciseLoads, setExerciseLoads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Timer para cronômetro
  useEffect(() => {
    let interval = null
    if (activeSession && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [activeSession, startTime])

  // Carregar treinos do aluno
  useEffect(() => {
    loadWorkouts()
    checkActiveSession()
  }, [])

  const loadWorkouts = async () => {
    try {
      const response = await fetch('/api/workouts')
      if (response.ok) {
        const data = await response.json()
        setWorkouts(data)
      }
    } catch (error) {
      console.error('Erro ao carregar treinos:', error)
    }
  }

  const checkActiveSession = async () => {
    try {
      const response = await fetch('/api/workout-sessions/active')
      if (response.ok) {
        const session = await response.json()
        setActiveSession(session)
        setStartTime(new Date(session.inicio).getTime())
        
        // Carregar treino da sessão ativa
        const workoutResponse = await fetch(`/api/workouts`)
        if (workoutResponse.ok) {
          const workoutsData = await workoutResponse.json()
          // Encontrar o treino correspondente à sessão
          for (const [day, workout] of Object.entries(workoutsData)) {
            if (workout.id === session.workout_id) {
              setCurrentWorkout(workout)
              setSelectedDay(day)
              break
            }
          }
        }
        
        // Carregar status dos exercícios
        if (session.exercicios_status) {
          setExerciseStatus(session.exercicios_status.map(ex => ex.completed || false))
          setExerciseLoads(session.exercicios_status.map(ex => ex.carga || ''))
        }
      }
    } catch (error) {
      console.log('Nenhuma sessão ativa')
    }
  }

  const handleDaySelect = async (day) => {
    if (activeSession) {
      setError('Finalize o treino atual antes de selecionar outro dia')
      return
    }

    setSelectedDay(day)
    setCurrentWorkout(workouts[day] || null)
    setExerciseStatus([])
    setExerciseLoads([])
    setError('')
  }

  const startWorkout = async () => {
    if (!currentWorkout) {
      setError('Selecione um dia com treino disponível')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/workout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workout_id: currentWorkout.id
        }),
      })

      if (response.ok) {
        const session = await response.json()
        setActiveSession(session)
        setStartTime(Date.now())
        setElapsedTime(0)
        
        // Inicializar status dos exercícios
        const initialStatus = currentWorkout.exercicios.map(() => false)
        const initialLoads = currentWorkout.exercicios.map(() => '')
        setExerciseStatus(initialStatus)
        setExerciseLoads(initialLoads)
        
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao iniciar treino')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const finishWorkout = async () => {
    if (!activeSession) return

    setLoading(true)
    try {
      const exerciciosStatus = exerciseStatus.map((completed, index) => ({
        completed,
        carga: exerciseLoads[index] || ''
      }))

      const response = await fetch(`/api/workout-sessions/${activeSession.id}/finish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercicios_status: exerciciosStatus
        }),
      })

      if (response.ok) {
        const finishedSession = await response.json()
        setActiveSession(null)
        setStartTime(null)
        setElapsedTime(0)
        
        // Mostrar tempo total
        const totalMinutes = Math.floor(finishedSession.duracao_segundos / 60)
        const totalSeconds = finishedSession.duracao_segundos % 60
        alert(`Treino finalizado! Tempo total: ${totalMinutes}min ${totalSeconds}s`)
        
        setError('')
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao finalizar treino')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const updateExerciseStatus = async (index, completed) => {
    const newStatus = [...exerciseStatus]
    newStatus[index] = completed
    setExerciseStatus(newStatus)

    if (activeSession) {
      try {
        await fetch(`/api/workout-sessions/${activeSession.id}/update-exercise`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercise_index: index,
            completed,
            carga: exerciseLoads[index] || ''
          }),
        })
      } catch (error) {
        console.error('Erro ao atualizar exercício:', error)
      }
    }
  }

  const updateExerciseLoad = async (index, carga) => {
    const newLoads = [...exerciseLoads]
    newLoads[index] = carga
    setExerciseLoads(newLoads)

    if (activeSession) {
      try {
        await fetch(`/api/workout-sessions/${activeSession.id}/update-exercise`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            exercise_index: index,
            completed: exerciseStatus[index] || false,
            carga
          }),
        })
      } catch (error) {
        console.error('Erro ao atualizar carga:', error)
      }
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Seleção de dias da semana */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Selecione o dia para treinar
          </CardTitle>
          <CardDescription>
            Escolha o dia da semana para visualizar e executar seu treino
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
            {DIAS_SEMANA.map((dia) => (
              <Button
                key={dia.value}
                variant={selectedDay === dia.value ? 'default' : 'outline'}
                onClick={() => handleDaySelect(dia.value)}
                disabled={activeSession && selectedDay !== dia.value}
                className="h-auto p-3 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-medium">{dia.label}</span>
                {workouts[dia.value] && (
                  <Badge variant="secondary" className="text-xs">
                    {workouts[dia.value].exercicios.length} exercícios
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Controles de treino */}
      {selectedDay && currentWorkout && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Treino de {DIAS_SEMANA.find(d => d.value === selectedDay)?.label}</CardTitle>
                <CardDescription>
                  {currentWorkout.exercicios.length} exercícios programados
                </CardDescription>
              </div>
              {activeSession && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {!activeSession ? (
                <Button onClick={startWorkout} disabled={loading} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  {loading ? 'Iniciando...' : 'Iniciar Treino'}
                </Button>
              ) : (
                <Button onClick={finishWorkout} disabled={loading} variant="destructive" className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  {loading ? 'Finalizando...' : 'Finalizar Treino'}
                </Button>
              )}
            </div>

            {/* Lista de exercícios */}
            <div className="space-y-4">
              {currentWorkout.exercicios.map((exercicio, index) => (
                <Card key={index} className={`${exerciseStatus[index] ? 'bg-green-50 border-green-200' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center pt-1">
                        {exerciseStatus[index] ? (
                          <CheckCircle2 
                            className="h-5 w-5 text-green-600 cursor-pointer" 
                            onClick={() => updateExerciseStatus(index, false)}
                          />
                        ) : (
                          <Circle 
                            className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" 
                            onClick={() => updateExerciseStatus(index, true)}
                          />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium">{exercicio.nome}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Séries:</span> {exercicio.series}
                          </div>
                          <div>
                            <span className="font-medium">Descanso:</span> {exercicio.tempo_descanso}
                          </div>
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`carga-${index}`} className="font-medium">Carga:</Label>
                            <Input
                              id={`carga-${index}`}
                              value={exerciseLoads[index] || ''}
                              onChange={(e) => updateExerciseLoad(index, e.target.value)}
                              placeholder="Ex: 20kg"
                              className="h-8 w-20"
                              disabled={!activeSession}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mensagem quando não há treino */}
      {selectedDay && !currentWorkout && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">
              Nenhum treino programado para {DIAS_SEMANA.find(d => d.value === selectedDay)?.label}.
              Entre em contato com seu personal trainer.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instruções iniciais */}
      {!selectedDay && (
        <Card>
          <CardContent className="p-6 text-center">
            <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">Bem-vindo ao seu treino!</h3>
            <p className="text-gray-500">
              Selecione um dia da semana acima para visualizar e executar seu treino.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

