"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

interface TradeExecutionFeedbackProps {
  isOpen: boolean
  onClose: () => void
  tradeSymbol: string
  isSimulated: boolean
}

export default function TradeExecutionFeedback({
  isOpen,
  onClose,
  tradeSymbol,
  isSimulated,
}: TradeExecutionFeedbackProps) {
  const [status, setStatus] = useState<"executing" | "success" | "error">("executing")

  useEffect(() => {
    if (isOpen) {
      setStatus("executing")

      // Simulate trade execution
      const timer = setTimeout(() => {
        // 90% chance of success
        setStatus(Math.random() > 0.1 ? "success" : "error")
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center">
            {status === "executing" && "Executing Trade"}
            {status === "success" && "Trade Executed Successfully"}
            {status === "error" && "Trade Execution Failed"}
          </AlertDialogTitle>
          <div className="flex justify-center my-6">
            {status === "executing" && (
              <div className="flex flex-col items-center">
                <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
                <AlertDialogDescription className="text-center">
                  Executing {isSimulated ? "simulated" : "live"} trade for {tradeSymbol}...
                </AlertDialogDescription>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                  <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                </div>
                <AlertDialogDescription className="text-center mt-4">
                  Your {isSimulated ? "simulated" : "live"} trade for {tradeSymbol} has been executed successfully.
                  {isSimulated && " No real funds were used."}
                </AlertDialogDescription>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center">
                <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/30">
                  <XCircle className="h-16 w-16 text-red-600 dark:text-red-400" />
                </div>
                <AlertDialogDescription className="text-center mt-4">
                  There was an error executing your {isSimulated ? "simulated" : "live"} trade for {tradeSymbol}. Please
                  try again later.
                </AlertDialogDescription>
              </div>
            )}
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {status === "executing" ? (
            <AlertDialogCancel disabled>Cancel</AlertDialogCancel>
          ) : (
            <AlertDialogAction onClick={onClose}>{status === "success" ? "Continue" : "Try Again"}</AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
