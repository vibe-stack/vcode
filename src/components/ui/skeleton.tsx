import * as React from "react"
import { cn } from "@/utils/tailwind"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent/80 backdrop-blur-md animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
