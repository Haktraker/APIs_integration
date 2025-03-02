"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Shield, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const SidebarItem = ({
    icon: Icon,
    label,
  }: {
    icon: React.ElementType
    label: string
  }) => (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" className={cn("w-full justify-start", isCollapsed && "justify-center")}>
            <Icon className="h-4 w-4" />
            {!isCollapsed && <span className="ml-2">{label}</span>}
          </Button>
        </TooltipTrigger>
        {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div
      className={cn(
        "relative h-[calc(100vh-4rem)] border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="space-y-4 py-4">
        <div className="p-3">
          <div className="space-y-1">
            <SidebarItem icon={Search} label="Search" />
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 -right-4 bg-primary"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  )
}

