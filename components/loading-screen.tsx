"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface LoadingScreenProps {
  open: boolean
  onClose?: () => void
}

export function LoadingScreen({ open, onClose }: LoadingScreenProps) {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose?.()
      }, 8000) // 8 seconds

      return () => clearTimeout(timer)
    }
  }, [open, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gradient-to-br from-background to-background/80 border-muted">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <div className="flex flex-col items-center justify-center space-y-8 p-6">
          {/* Animated Icons Circle */}
          <div className="relative w-48 h-48">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "absolute w-8 h-8 rounded-full bg-primary/10",
                  "animate-pulse transition-all duration-1000",
                )}
                style={{
                  left: `${Math.cos((i * Math.PI * 2) / 12) * 80 + 80}px`,
                  top: `${Math.sin((i * Math.PI * 2) / 12) * 80 + 80}px`,
                  animationDelay: `${i * 100}ms`,
                }}
              />
            ))}
          </div>

          {/* Search Status */}
          <div className="space-y-3 text-sm">
            <h3 className="font-medium text-muted-foreground">Searching in:</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Host Information</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">DNS Records</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-muted-foreground">Vulnerabilities</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

