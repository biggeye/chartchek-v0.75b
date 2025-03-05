import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional height value. Can be a number (px) or string with unit.
   */
  height?: number | string
  /**
   * Optional width value. Can be a number (px) or string with unit.
   */
  width?: number | string
  /**
   * Set to true to make the skeleton rounded like a circle
   */
  circle?: boolean
  /**
   * Controls the border radius of the skeleton when not in circle mode
   */
  rounded?: "none" | "sm" | "md" | "lg" | "full"
  /**
   * Controls the animation of the skeleton
   */
  animation?: "pulse" | "shimmer" | "none"
}

/**
 * Skeleton component for representing loading states
 */
export function Skeleton({
  className,
  height,
  width,
  circle = false,
  rounded = "md",
  animation = "pulse",
  ...props
}: SkeletonProps) {
  // Convert height and width to string with px if they are numbers
  const heightValue = typeof height === "number" ? `${height}px` : height
  const widthValue = typeof width === "number" ? `${width}px` : width

  // Map rounded values to tailwind classes
  const roundedMap = {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
  }

  // Map animation values to tailwind classes
  const animationMap = {
    pulse: "animate-pulse",
    shimmer: "animate-shimmer",
    none: "",
  }

  return (
    <div
      className={cn(
        "bg-gray-200 dark:bg-gray-700",
        circle ? "rounded-full" : roundedMap[rounded],
        animationMap[animation],
        className
      )}
      style={{
        height: heightValue,
        width: widthValue,
      }}
      {...props}
    />
  )
}

/**
 * Skeleton text component for representing loading states of text elements
 */
export function SkeletonText({
  className,
  lines = 1,
  lastLineWidth = "100%",
  spacing = "md",
  ...props
}: {
  className?: string
  lines?: number
  lastLineWidth?: string | number
  spacing?: "sm" | "md" | "lg"
} & Omit<SkeletonProps, "circle">) {
  const spacingMap = {
    sm: "space-y-1",
    md: "space-y-2",
    lg: "space-y-4",
  }

  const lastWidth = typeof lastLineWidth === "number" ? `${lastLineWidth}%` : lastLineWidth

  return (
    <div className={cn(spacingMap[spacing], className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={props.height || 16}
          width={i === lines - 1 && lines > 1 ? lastWidth : "100%"}
          rounded="sm"
          {...props}
        />
      ))}
    </div>
  )
}

/**
 * Skeleton for a card with title and content
 */
export function SkeletonCard({
  className,
  headerHeight = 50,
  contentLines = 3,
  ...props
}: {
  className?: string
  headerHeight?: number
  contentLines?: number
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border rounded-md overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="p-4 border-b">
        <Skeleton height={headerHeight / 2} width="70%" />
      </div>
      <div className="p-4">
        <SkeletonText lines={contentLines} lastLineWidth={70} />
      </div>
    </div>
  )
}

/**
 * Shimmer animation styles for the skeleton
 * Add this to your globals.css
 */
// @keyframes shimmer {
//   0% {
//     background-position: -200% 0;
//   }
//   100% {
//     background-position: 200% 0;
//   }
// }
// 
// .animate-shimmer {
//   background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%);
//   background-size: 200% 100%;
//   animation: shimmer 1.5s infinite;
// }
