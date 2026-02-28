import { Link, createFileRoute } from '@tanstack/react-router'
import { useMutation, useQuery } from 'convex/react'
import * as React from 'react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/projects/')({
  component: ProjectsPage,
})

function ProjectsPage() {
  const [activeUser, setActiveUser] = React.useState({ id: "alice", name: "Alice (Admin)" })

  React.useEffect(() => {
    const handleUserSwitch = () => {
      const saved = localStorage.getItem("consultant-simulated-user")
      if (saved) {
        try {
          setActiveUser(JSON.parse(saved))
        } catch (e) {}
      }
    }
    handleUserSwitch()
    window.addEventListener("user-switched", handleUserSwitch)
    return () => window.removeEventListener("user-switched", handleUserSwitch)
  }, [])

  const projects = useQuery(api.projects.list, { userId: activeUser.id })
  const seedData = useMutation(api.seed.generate)

  const handleSeed = async () => {
    await seedData()
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Projects</h1>
          <p className="text-muted-foreground mt-1">Select a project to view its Kanban board.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}>Generate Seed Data</Button>
          <Button>New Project</Button>
        </div>
      </div>

      {!projects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="h-40 animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-background rounded-lg border border-dashed">
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">Get started by creating your first project, or load demo data.</p>
          <div className="flex justify-center gap-4">
            <Button onClick={handleSeed} variant="secondary">Load Demo Data</Button>
            <Button>Create Project</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project._id} to="/projects/$projectId" params={{ projectId: project._id }} className="block h-full">
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription>
                    Created {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Click to open Kanban board</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
