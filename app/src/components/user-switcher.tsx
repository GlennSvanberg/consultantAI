"use client"

import * as React from "react"
import { Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const MOCK_USERS = [
  { id: "alice", name: "Alice (Admin)" },
  { id: "bob", name: "Bob (Manager)" },
  { id: "charlie", name: "Charlie (Viewer)" },
]

export function UserSwitcher() {
  const [activeUser, setActiveUser] = React.useState(MOCK_USERS[0])

  React.useEffect(() => {
    const saved = localStorage.getItem("consultant-simulated-user")
    if (saved) {
      try {
        setActiveUser(JSON.parse(saved))
      } catch (e) {}
    }
  }, [])

  const handleSelectUser = (user: typeof MOCK_USERS[0]) => {
    setActiveUser(user)
    localStorage.setItem("consultant-simulated-user", JSON.stringify(user))
    window.dispatchEvent(new Event("user-switched"))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Users className="h-4 w-4" />
          <span>{activeUser.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Simulate User</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {MOCK_USERS.map((user) => (
          <DropdownMenuItem
            key={user.id}
            onClick={() => handleSelectUser(user)}
            className={activeUser.id === user.id ? "bg-accent" : ""}
          >
            {user.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
