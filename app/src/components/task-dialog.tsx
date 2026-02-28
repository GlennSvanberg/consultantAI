import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { ScrollArea } from "./ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import type { Id } from "../../convex/_generated/dataModel"

interface TaskType {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  status: string;
  projectId: Id<"projects">;
  assignedAgentId?: string;
  assignedUserId?: string;
}

interface TaskDialogProps {
  task: TaskType | null;
  onClose: () => void;
  activeUser: { id: string; name: string };
}

export function TaskDialog({ task, onClose, activeUser }: TaskDialogProps) {
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [assignedUserId, setAssignedUserId] = React.useState("")
  const [assignedAgentId, setAssignedAgentId] = React.useState("")
  
  const [commentText, setCommentText] = React.useState("")

  const updateDetails = useMutation(api.tasks.updateDetails)
  const addComment = useMutation(api.comments.add)
  const comments = useQuery(api.comments.list, task ? { taskId: task._id } : "skip")
  const employees = useQuery(api.employees.list, { userId: activeUser.id })

  React.useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || "")
      setAssignedUserId(task.assignedUserId || "")
      setAssignedAgentId(task.assignedAgentId || "")
    }
  }, [task])

  const handleSave = () => {
    if (!task) return
    updateDetails({
      taskId: task._id,
      title,
      description,
      assignedUserId,
      assignedAgentId,
    })
    onClose()
  }

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!task || !commentText.trim()) return
    
    addComment({
      taskId: task._id,
      authorId: activeUser.id,
      authorName: activeUser.name,
      isAi: false,
      content: commentText.trim(),
    })
    setCommentText("")
  }

  return (
    <Dialog open={!!task} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignedUser">Assigned User</Label>
                <Input
                  id="assignedUser"
                  placeholder="e.g. alice"
                  value={assignedUserId}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedAgent">Assigned Agent</Label>
                <Select 
                  value={assignedAgentId || "none"} 
                  onValueChange={(val) => setAssignedAgentId(val === "none" ? "" : val)}
                >
                  <SelectTrigger id="assignedAgent">
                    <SelectValue placeholder="Select an agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees?.map((emp) => (
                      <SelectItem key={emp._id} value={emp.name}>{emp.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-lg">Comments</h3>
              
              <div className="space-y-4">
                {comments?.map((comment) => (
                  <div key={comment._id} className={`p-3 rounded-lg ${comment.isAi ? 'bg-primary/10' : 'bg-muted'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm">{comment.authorName}</span>
                      {comment.isAi && <span className="text-xs bg-primary text-primary-foreground px-1.5 rounded">AI</span>}
                    </div>
                    <div className="text-sm whitespace-pre-wrap max-h-32 overflow-y-auto overflow-x-hidden">
                      {comment.content}
                    </div>
                  </div>
                ))}
                {comments?.length === 0 && (
                  <p className="text-sm text-muted-foreground">No comments yet.</p>
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                />
                <Button type="submit" disabled={!commentText.trim()}>Post</Button>
              </form>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
