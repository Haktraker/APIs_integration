import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"

interface ResultImageProps {
  hasResults: boolean
}

export function ResultImage({ hasResults }: ResultImageProps) {
  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 flex items-center justify-center">
        <Image
          src={
            hasResults
              ? "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/haked-uS4ZFQfi5Ku18fRXtWPHob4yrGCXr2.svg"
              : "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/passed-3iLIcrUJ6ZV119kVUqAkpYs4n66gNX.svg"
          }
          alt={hasResults ? "Hacked" : "No Results"}
          width={400}
          height={300}
          className="w-full h-auto"
        />
      </CardContent>
    </Card>
  )
}

