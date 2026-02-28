import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8 text-center space-y-6">
      <h1 className="text-5xl font-extrabold tracking-tight">
        Consultant AI
      </h1>
      <p className="text-xl text-muted-foreground max-w-2xl">
        A Kanban-first, agentic workflow platform. Move cards, agents work. 
        Focus on the outcomes, not the filesystems.
      </p>
      
      <div className="pt-8 flex flex-col sm:flex-row gap-4">
        <Link 
          to="/projects" 
          className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Get Started
        </Link>
      </div>
    </div>
  )
}
