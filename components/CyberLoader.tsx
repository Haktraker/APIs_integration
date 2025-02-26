// components/CyberLoader.tsx
export function CyberLoader() {
    return (
      <div className="relative h-32 w-32">
        <div className="absolute inset-0 border-4 border-cyber-purple animate-pulse rounded-full" />
        <div className="absolute inset-4 border-t-4 border-neon-cyan rounded-full animate-spin" />
        <div className="absolute inset-8 bg-cyber-gradient animate-ping rounded-full" />
      </div>
    )
  }
  