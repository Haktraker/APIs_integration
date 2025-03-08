"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Shield, AlertCircle, ChevronLeft, ChevronRight, Globe, Database, Network, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  const SidebarItem = ({
    icon: Icon,
    label,
    href,
  }: {
    icon: React.FC<{ className?: string }>
    label: string
    href: string
  }) => {
    const isActive = pathname === href
    
    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} className="block w-full">
              <Button 
                variant={isActive ? "secondary" : "ghost"} 
                className={cn(
                  "w-full justify-start", 
                  isCollapsed && "justify-center",
                  isActive && "bg-secondary"
                )}
              >
                <Icon className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">{label}</span>}
              </Button>
            </Link>
          </TooltipTrigger>
          {isCollapsed && <TooltipContent side="right">{label}</TooltipContent>}
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div
      className={cn(
        "relative h-[calc(100vh-4rem)] border transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className={cn("mb-2 px-2 text-lg font-semibold tracking-tight", isCollapsed && "sr-only")}>
            Navigation
          </h2>
          <div className="space-y-1">
            <SidebarItem icon={Search} label="Home" href="/" />
            <SidebarItem icon={Layers} label="Dark & Deep Web" href="/darkweb" />
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

