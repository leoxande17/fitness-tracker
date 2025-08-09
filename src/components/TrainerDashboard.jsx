import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Users, Plus, Edit, Trash2, Save, UserPlus, Copy, CheckCircle2 } from 'lucide-react'

const DIAS_SEMANA = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' }
]

export default function TrainerDashboard({ user }) {
  const [students, setStudents] = useState([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [activeTab, setActiveTab] = useState('students')
  const [copiedCode, setCopiedCode] = useState(false)

  // Carregar alunos do personal trainer
  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
      }
    } catch (error) {
      console.error('Erro ao carregar alunos:', error)
    }
  }

  const loadWorkout = async (studentId, day) => {
    try {
      const response = await fetch(`/api/workouts`)
      if (response.ok) {
        const workouts = await response.json()
        // Buscar treino específico do aluno para o dia
        // Como a API atual retorna treinos do usuário logado, precisamos ajustar
        // Por enquanto, vamos inicializar com exercícios vazios
        setExercises([])
      }
    } catch (error) {
      console.error('Erro ao carregar treino:', error)
      setExercises([])
    }
  }

  const handleStudentSelect = (studentId) => {
    setSelectedStudent(studentId)
    if (selectedDay) {
      loadWorkout(studentId, selectedDay)
    }
  }

  const handleDaySelect = (day) => {
    setSelectedDay(day)
    if (selectedStudent) {
      loadWorkout(selectedStudent, day)
    }
  }

  const addExercise = () => {
    setExercises([...exercises, {
      nome: '',
      series: '',
      tempo_descanso: ''
    }])
  }

  const updateExercise = (index, field, value) => {
    const newExercises = [...exercises]
    newExercises[index][field] = value
    setExercises(newExercises)
  }

  const removeExercise = (index) => {
    const newExercises = exercises.filter((_, i) => i !== index)
    setExercises(newExercises)
  }

  const saveWorkout = async () => {
    if (!selectedStudent || !selectedDay) {
      setError('Selecione um aluno e um dia da semana')
      return
    }

    if (exercises.length === 0) {
      setError('Adicione pelo menos um exercício')
      return
    }

    // Validar exercícios
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      if (!ex.nome || !ex.series || !ex.tempo_descanso) {
        setError(`Preencha todos os campos do exercício ${i + 1}`)
        return
      }
    }

    setLoading(true)
    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aluno_id: selectedStudent,
          dia_semana: selectedDay,
          exercicios: exercises
        }),
      })

      if (response.ok) {
        setSuccess('Treino salvo com sucesso!')
        setError('')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erro ao salvar treino')
      }
    } catch (error) {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  const copyCode = () => {
    navigator.clipboard.writeText(user.codigo_personal)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students">Meus Alunos</TabsTrigger>
          <TabsTrigger value="workouts">Criar Treinos</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          {/* Código do Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Seu Código de Personal Trainer
              </CardTitle>
              <CardDescription>
                Compartilhe este código com seus alunos para que eles possam se vincular a você
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Input 
                  value={user.codigo_personal} 
                  readOnly 
                  className="font-mono text-lg font-bold text-center"
                />
                <Button onClick={copyCode} variant="outline" size="icon">
                  {copiedCode ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              {copiedCode && (
                <p className="text-sm text-green-600 mt-2">Código copiado!</p>
              )}
            </CardContent>
          </Card>

          {/* Lista de Alunos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Alunos Cadastrados ({students.length})
              </CardTitle>
              <CardDescription>
                Lista de alunos vinculados ao seu código
              </CardDescription>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Nenhum aluno cadastrado</h3>
                  <p className="text-gray-500">
                    Compartilhe seu código com alunos para que eles possam se vincular a você
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {students.map((student) => (
                    <Card key={student.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{student.nome_completo}</h4>
                          <p className="text-sm text-gray-500">{student.email}</p>
                          <p className="text-sm text-gray-500">{student.telefone}</p>
                        </div>
                        <Badge variant="secondary">Ativo</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workouts" className="space-y-4">
          {/* Seleção de Aluno e Dia */}
          <Card>
            <CardHeader>
              <CardTitle>Criar/Editar Treino</CardTitle>
              <CardDescription>
                Selecione um aluno e dia da semana para criar ou editar o treino
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student-select">Aluno</Label>
                  <Select value={selectedStudent} onValueChange={handleStudentSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um aluno" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.nome_completo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="day-select">Dia da Semana</Label>
                  <Select value={selectedDay} onValueChange={handleDaySelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DIAS_SEMANA.map((dia) => (
                        <SelectItem key={dia.value} value={dia.value}>
                          {dia.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Exercícios */}
          {selectedStudent && selectedDay && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      Exercícios - {DIAS_SEMANA.find(d => d.value === selectedDay)?.label}
                    </CardTitle>
                    <CardDescription>
                      Aluno: {students.find(s => s.id === selectedStudent)?.nome_completo}
                    </CardDescription>
                  </div>
                  <Button onClick={addExercise} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Adicionar Exercício
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {exercises.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Nenhum exercício adicionado. Clique em "Adicionar Exercício" para começar.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {exercises.map((exercise, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <Label htmlFor={`nome-${index}`}>Nome do Exercício</Label>
                              <Input
                                id={`nome-${index}`}
                                value={exercise.nome}
                                onChange={(e) => updateExercise(index, 'nome', e.target.value)}
                                placeholder="Ex: Supino reto"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`series-${index}`}>Séries</Label>
                              <Input
                                id={`series-${index}`}
                                value={exercise.series}
                                onChange={(e) => updateExercise(index, 'series', e.target.value)}
                                placeholder="Ex: 3x12"
                              />
                            </div>
                            <div>
                              <Label htmlFor={`descanso-${index}`}>Tempo de Descanso</Label>
                              <Input
                                id={`descanso-${index}`}
                                value={exercise.tempo_descanso}
                                onChange={(e) => updateExercise(index, 'tempo_descanso', e.target.value)}
                                placeholder="Ex: 60s"
                              />
                            </div>
                          </div>
                          <Button
                            onClick={() => removeExercise(index)}
                            variant="outline"
                            size="icon"
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {exercises.length > 0 && (
                  <div className="flex justify-end pt-4">
                    <Button onClick={saveWorkout} disabled={loading} className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {loading ? 'Salvando...' : 'Salvar Treino'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Instruções */}
          {!selectedStudent || !selectedDay ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Edit className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">Criar Treino</h3>
                <p className="text-gray-500">
                  Selecione um aluno e um dia da semana para começar a criar o treino.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}

