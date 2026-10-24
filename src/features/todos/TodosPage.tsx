import { useState, useEffect } from 'react'
import { supabase } from '@/utils/supabase'

interface TodoItem {
  id: string | number
  name?: string
  title?: string
  [key: string]: unknown
}

export function TodosPage() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true)
        if (!supabase) throw new Error('Supabase is not configured.')
        const { data, error: fetchError } = await supabase.from('todos').select()

        if (fetchError) {
          setError(fetchError.message)
        } else if (data) {
          setTodos(data as TodoItem[])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, [])

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md space-y-4 my-8">
      <h1 className="text-xl font-bold text-gray-800">Supabase Todos Test</h1>
      
      {loading && <p className="text-gray-500">Loading todos from Supabase...</p>}
      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">
          <strong>Error querying Supabase:</strong> {error}
        </div>
      )}

      {!loading && !error && todos.length === 0 && (
        <p className="text-gray-500 italic">No todos found in Supabase &lsquo;todos&rsquo; table.</p>
      )}

      <ul className="divide-y divide-gray-200">
        {todos.map((todo) => (
          <li key={todo.id} className="py-2 text-gray-700">
            {todo.name || todo.title || JSON.stringify(todo)}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TodosPage
