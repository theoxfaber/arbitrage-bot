import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, XCircle, Clock, AlertTriangle, Sparkles } from "lucide-react"

type TradeStatus = "completed" | "failed" | "pending" | "simulated" | "live"

interface TradeStatusBadgeProps {
  status: TradeStatus
  showIcon?: boolean
  showTooltip?: boolean
  className?: string
}

export default function TradeStatusBadge({
  status,
  showIcon = true,
  showTooltip = true,
  className = "",
}: TradeStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "completed":
        return {
          variant: "success" as const,
          label: "Completed",
          icon: CheckCircle2,
          tooltip: "Trade successfully executed and completed",
        }
      case "failed":
        return {
          variant: "destructive" as const,
          label: "Failed",
          icon: XCircle,
          tooltip: "Trade execution failed",
        }
      case "pending":
        return {
          variant: "outline" as const,
          label: "Pending",
          icon: Clock,
          tooltip: "Trade is pending execution",
        }
      case "simulated":
        return {
          variant: "secondary" as const,
          label: "Simulated",
          icon: Sparkles,
          tooltip: "This is a simulated trade (no real funds used)",
        }
      case "live":
        return {
          variant: "default" as const,
          label: "Live",
          icon: AlertTriangle,
          tooltip: "This is a live trade using real funds",
        }
      default:
        return {
          variant: "secondary" as const,
          label: status,
          icon: AlertTriangle,
          tooltip: "Unknown status",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  const badge = (
    <Badge
      variant={config.variant}
      className={`transition-all duration-200 ${showIcon ? "pl-1.5" : "px-2.5"} ${className}`}
    >
      {showIcon && <Icon className="h-3.5 w-3.5 mr-1" />}
      {config.label}
    </Badge>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{config.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
