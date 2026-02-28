import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { 
  DndContext, 
  DragOverlay, 
  KeyboardSensor, 
  PointerSensor, 
  closestCorners, 
  useDroppable, 
  useSensor,
  useSensors
} from '@dnd-kit/core'
import { 
  SortableContext, 
  useSortable, 
  verticalListSortingStrategy 
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '../../../convex/_generated/api'
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent } from '@/components/ui/card'
import { TaskDialog } from '@/components/task-dialog'

export const Route = createFileRoute('/projects/$projectId')({
  component: KanbanBoard,
})

const COLUMNS = [
  { id: 'backlog', title: 'Backlog' },
  { id: 'refinement', title: 'Refinement' },
  { id: 'todo', title: 'Todo' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'need_help', title: 'Need Help' },
  { id: 'review', title: 'Review' },
  { id: 'done', title: 'Done' }
] as const

type TaskType = {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  status: typeof COLUMNS[number]['id'];
  projectId: Id<"projects">;
  assignedAgentId?: string;
  assignedUserId?: string;
}

function SortableTask({ task, onClick }: { task: TaskType; onClick: (task: TaskType) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task._id, data: { type: 'Task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none cursor-grab">
      <Card className="mb-2 hover:border-primary/50 transition-colors" onClick={() => onClick(task)}>
        <CardContent className="p-3">
          <p className="font-medium text-sm">{task.title}</p>
          <div className="flex gap-2 mt-2">
            {task.assignedUserId && (
              <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-1.5 py-0.5 rounded">
                U: {task.assignedUserId}
              </span>
            )}
            {task.assignedAgentId && (
              <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-1.5 py-0.5 rounded">
                A: {task.assignedAgentId}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function Column({ column, tasks, onTaskClick }: { column: typeof COLUMNS[number], tasks: Array<TaskType>, onTaskClick: (task: TaskType) => void }) {
  const { setNodeRef } = useDroppable({
    id: column.id,
    data: {
      type: 'Column',
      column,
    },
  })

  return (
    <div className="flex flex-col flex-shrink-0 w-72 bg-muted/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="font-semibold text-sm">{column.title}</h3>
        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      <SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex-1 min-h-[150px]">
          {tasks.map(task => (
            <SortableTask key={task._id} task={task} onClick={onTaskClick} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

function KanbanBoard() {
  const { projectId } = Route.useParams()
  const rawTasks = useQuery(api.tasks.list, { projectId: projectId as Id<"projects"> })
  const updateStatus = useMutation(api.tasks.updateStatus)

  // Local state for optimistic updates
  const [tasks, setTasks] = React.useState<Array<TaskType>>([])
  const [activeTask, setActiveTask] = React.useState<TaskType | null>(null)
  const [editingTask, setEditingTask] = React.useState<TaskType | null>(null)
  const [activeUser, setActiveUser] = React.useState({ id: "alice", name: "Alice (Admin)" })

  React.useEffect(() => {
    const saved = localStorage.getItem("consultant-simulated-user")
    if (saved) {
      try { setActiveUser(JSON.parse(saved)) } catch (e) {}
    }
    
    const handleUserSwitch = () => {
      const updated = localStorage.getItem("consultant-simulated-user")
      if (updated) {
        try { setActiveUser(JSON.parse(updated)) } catch (e) {}
      }
    }
    window.addEventListener("user-switched", handleUserSwitch)
    return () => window.removeEventListener("user-switched", handleUserSwitch)
  }, [])

  React.useEffect(() => {
    if (rawTasks) {
      setTasks(rawTasks as Array<TaskType>)
    }
  }, [rawTasks])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t._id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Basic logic to allow moving across columns ideally requires more complex Droppable areas.
    // For simplicity in this demo, we'll just handle it in DragEnd if droppable areas are set up, 
    // or we can just use the column container if it was set up as a droppable. 
    // Let's implement full columns as droppables.
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const activeId = active.id
    const overId = over.id

    if (activeId === overId) return

    const isActiveTask = active.data.current?.type === 'Task'
    const isOverColumn = over.data.current?.type === 'Column'
    const isOverTask = over.data.current?.type === 'Task'

    if (!isActiveTask) return

    const task = tasks.find(t => t._id === activeId)
    if (!task) return

    let newStatus = task.status

    if (isOverColumn) {
      newStatus = overId as TaskType['status']
    } else if (isOverTask) {
      const overTask = tasks.find(t => t._id === overId)
      if (overTask) {
        newStatus = overTask.status
      }
    }

    if (newStatus !== task.status) {
      // Optimistic update
      setTasks(prev => 
        prev.map(t => t._id === activeId ? { ...t, status: newStatus } : t)
      )
      
      // Update database
      void updateStatus({
        taskId: activeId as Id<"tasks">,
        status: newStatus
      })
    }
  }

  if (rawTasks === undefined) return <div className="p-8 text-center text-muted-foreground">Loading board...</div>

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      <div className="p-4 border-b bg-background">
        <h2 className="text-xl font-bold">Project Board</h2>
      </div>
      
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full items-start">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            {COLUMNS.map(col => (
              <Column 
                key={col.id} 
                column={col} 
                tasks={tasks.filter(t => t.status === col.id)} 
                onTaskClick={setEditingTask}
              />
            ))}
            
            <DragOverlay>
              {activeTask ? (
                <Card className="opacity-80 border-primary cursor-grabbing shadow-lg">
                  <CardContent className="p-3">
                    <p className="font-medium text-sm">{activeTask.title}</p>
                  </CardContent>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      
      <TaskDialog 
        task={editingTask} 
        onClose={() => setEditingTask(null)} 
        activeUser={activeUser}
      />
    </div>
  )
}
