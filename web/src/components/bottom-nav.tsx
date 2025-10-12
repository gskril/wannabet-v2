"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Plus, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { CreateBetDialog } from "./create-bet-dialog"

export function BottomNav() {
  const pathname = usePathname()
  const [createBetOpen, setCreateBetOpen] = useState(false)

  // In a real app, this would come from wallet connection
  const connectedAddress = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  const isProfile = pathname.startsWith("/profile")

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto flex h-16 items-center justify-around px-4">
          <Link
            href="/"
            className={cn(
              "flex flex-col items-center gap-1 transition-colors flex-1",
              pathname === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs font-medium">Feed</span>
          </Link>

          <button
            onClick={() => setCreateBetOpen(true)}
            className="flex flex-col items-center gap-1 transition-all hover:scale-105 -mt-2"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/50">
              <Plus className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-xs font-semibold text-primary">Create</span>
          </button>

          <Link
            href={`/profile/${connectedAddress}`}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors flex-1",
              isProfile ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <User className="h-6 w-6" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </nav>

      <CreateBetDialog open={createBetOpen} onOpenChange={setCreateBetOpen} />
    </>
  )
}
