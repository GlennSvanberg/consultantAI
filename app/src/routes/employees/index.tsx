import { createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'

export const Route = createFileRoute('/employees/')({
  component: EmployeesPage,
})

function EmployeesPage() {
  const [activeUser, setActiveUser] = React.useState({ id: "alice", name: "Alice (Admin)" })

  React.useEffect(() => {
    const handleUserSwitch = () => {
      const saved = localStorage.getItem("consultant-simulated-user")
      if (saved) {
        try { setActiveUser(JSON.parse(saved)) } catch (e) {}
      }
    }
    handleUserSwitch()
    window.addEventListener("user-switched", handleUserSwitch)
    return () => window.removeEventListener("user-switched", handleUserSwitch)
  }, [])

  const employees = useQuery(api.employees.list, { userId: activeUser.id })
  const skills = useQuery(api.skills.list)

  const [editingEmployee, setEditingEmployee] = React.useState<any | null>(null)
  const [editingSkill, setEditingSkill] = React.useState<any | null>(null)
  
  const [isCreatingEmployee, setIsCreatingEmployee] = React.useState(false)
  const [isCreatingSkill, setIsCreatingSkill] = React.useState(false)

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-12">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground mt-1">Manage your team of AI agents.</p>
          </div>
          <Button onClick={() => setIsCreatingEmployee(true)}>Add Agent</Button>
        </div>

        {!employees ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/50" />)}
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 bg-background rounded-lg border border-dashed">
            <h3 className="text-lg font-medium mb-2">No agents found</h3>
            <p className="text-muted-foreground mb-4">Create your first agent to get started.</p>
            <Button onClick={() => setIsCreatingEmployee(true)}>Add Agent</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
              <Card key={emp._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setEditingEmployee(emp)}>
                <CardHeader>
                  <CardTitle>{emp.name}</CardTitle>
                  <CardDescription>{emp.specialty}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-muted-foreground">Skills:</span>
                    <span>{emp.skillIds?.length || 0} assigned</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Skills Library</h2>
            <p className="text-muted-foreground mt-1">Define procedural skills that agents can use.</p>
          </div>
          <Button onClick={() => setIsCreatingSkill(true)} variant="outline">Add Skill</Button>
        </div>

        {!skills ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => <Card key={i} className="h-32 animate-pulse bg-muted/50" />)}
          </div>
        ) : skills.length === 0 ? (
           <div className="text-center py-12 bg-background rounded-lg border border-dashed">
             <p className="text-muted-foreground mb-4">No skills defined yet.</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skills.map((skill) => (
              <Card key={skill._id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setEditingSkill(skill)}>
                <CardHeader>
                  <CardTitle className="text-lg">{skill.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{skill.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>

      <EmployeeDialog 
        employee={editingEmployee || (isCreatingEmployee ? {} : null)} 
        onClose={() => { setEditingEmployee(null); setIsCreatingEmployee(false) }} 
        skills={skills || []}
        activeUser={activeUser}
      />

      <SkillDialog 
        skill={editingSkill || (isCreatingSkill ? {} : null)} 
        onClose={() => { setEditingSkill(null); setIsCreatingSkill(false) }} 
      />
    </div>
  )
}

function EmployeeDialog({ employee, onClose, skills, activeUser }: { employee: any, onClose: () => void, skills: any[], activeUser: any }) {
  const isNew = employee && !employee._id
  const [name, setName] = React.useState("")
  const [specialty, setSpecialty] = React.useState("")
  const [instructions, setInstructions] = React.useState("")
  const [skillIds, setSkillIds] = React.useState<Id<"skills">[]>([])

  const create = useMutation(api.employees.create)
  const update = useMutation(api.employees.update)

  React.useEffect(() => {
    if (employee) {
      setName(employee.name || "")
      setSpecialty(employee.specialty || "")
      setInstructions(employee.instructions || "")
      setSkillIds(employee.skillIds || [])
    }
  }, [employee])

  const handleSave = () => {
    if (!employee) return
    if (isNew) {
      create({ name, specialty, instructions, skillIds, userId: activeUser.id })
    } else {
      update({ employeeId: employee._id, name, specialty, instructions, skillIds })
    }
    onClose()
  }

  const toggleSkill = (id: Id<"skills">) => {
    setSkillIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  return (
    <Dialog open={!!employee} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isNew ? "Create Agent" : "Edit Agent"}</DialogTitle>
          <DialogDescription>
            Configure the agent's identity and capabilities.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Triage Agent" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g. Routing" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>System Instructions</Label>
              <Textarea 
                value={instructions} 
                onChange={e => setInstructions(e.target.value)} 
                rows={6} 
                placeholder="You are an AI agent that..."
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Skills</Label>
              <div className="grid grid-cols-1 gap-2 border rounded-md p-4">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills available.</p>
                ) : (
                  skills.map(skill => (
                    <label key={skill._id} className="flex items-center space-x-2 cursor-pointer p-1">
                      <input 
                        type="checkbox" 
                        checked={skillIds.includes(skill._id)} 
                        onChange={() => toggleSkill(skill._id)} 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">{skill.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SkillDialog({ skill, onClose }: { skill: any, onClose: () => void }) {
  const isNew = skill && !skill._id
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [instructions, setInstructions] = React.useState("")
  const [toolsStr, setToolsStr] = React.useState("")

  const create = useMutation(api.skills.create)
  const update = useMutation(api.skills.update)

  React.useEffect(() => {
    if (skill) {
      setName(skill.name || "")
      setDescription(skill.description || "")
      setInstructions(skill.instructions || "")
      setToolsStr(skill.toolsRequired ? skill.toolsRequired.join(", ") : "")
    }
  }, [skill])

  const handleSave = () => {
    if (!skill) return
    const toolsRequired = toolsStr.split(",").map(s => s.trim()).filter(Boolean)
    if (isNew) {
      create({ name, description, instructions, toolsRequired })
    } else {
      update({ skillId: skill._id, name, description, instructions, toolsRequired })
    }
    onClose()
  }

  return (
    <Dialog open={!!skill} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isNew ? "Create Skill" : "Edit Skill"}</DialogTitle>
          <DialogDescription>
            Define a procedure that agents can learn and execute.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0 pr-4">
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Deep Research" />
            </div>
            <div className="space-y-2">
              <Label>Description (Short)</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this skill do?" />
            </div>
            <div className="space-y-2">
              <Label>Instructions (SKILL.md format)</Label>
              <Textarea 
                value={instructions} 
                onChange={e => setInstructions(e.target.value)} 
                className="resize-none"
                rows={10} 
                placeholder="# Skill Instructions\n\n1. Do this...\n2. Do that..."
              />
            </div>
            <div className="space-y-2">
              <Label>Tools Required (comma separated)</Label>
              <Input value={toolsStr} onChange={e => setToolsStr(e.target.value)} placeholder="e.g. google-search, code-interpreter" />
            </div>
          </div>
        </ScrollArea>
        
        <div className="flex justify-end pt-4 border-t mt-auto">
          <Button variant="outline" onClick={onClose} className="mr-2">Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
