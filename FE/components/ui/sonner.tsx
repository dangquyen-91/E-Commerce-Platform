"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-5" />,
        info: <InfoIcon className="size-5" />,
        warning: <TriangleAlertIcon className="size-5" />,
        error: <OctagonXIcon className="size-5" />,
        loading: <Loader2Icon className="size-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "shadow-lg border-2",
          success:
            "!bg-emerald-50 !text-emerald-900 !border-emerald-500 dark:!bg-emerald-950 dark:!text-emerald-100 dark:!border-emerald-600 [&>svg]:!text-emerald-600 dark:[&>svg]:!text-emerald-400",
          error:
            "!bg-red-50 !text-red-900 !border-red-500 dark:!bg-red-950 dark:!text-red-100 dark:!border-red-600 [&>svg]:!text-red-600 dark:[&>svg]:!text-red-400",
          warning:
            "!bg-amber-50 !text-amber-900 !border-amber-500 dark:!bg-amber-950 dark:!text-amber-100 dark:!border-amber-600 [&>svg]:!text-amber-600 dark:[&>svg]:!text-amber-400",
          info: "!bg-blue-50 !text-blue-900 !border-blue-500 dark:!bg-blue-950 dark:!text-blue-100 dark:!border-blue-600 [&>svg]:!text-blue-600 dark:[&>svg]:!text-blue-400",
          description: "text-muted-foreground",
          actionButton:
            "bg-primary text-primary-foreground",
          cancelButton:
            "bg-muted text-muted-foreground",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
