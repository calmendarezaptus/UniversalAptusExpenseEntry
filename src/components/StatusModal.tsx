import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusModalType = 'error' | 'warning' | 'success' | 'info'

interface StatusModalProps {
  isOpen: boolean
  onClose?: () => void
  type: StatusModalType
  title: string
  message: string
}

export function StatusModal({ isOpen, onClose, type, title, message }: StatusModalProps) {
  const isClosable = !!onClose

  const icons = {
    error: <XCircle className="w-12 h-12 text-theme-text mb-4" />,
    warning: <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />,
    success: <CheckCircle className="w-12 h-12 text-emerald-500 mb-4" />,
    info: <Info className="w-12 h-12 text-blue-500 mb-4" />
  }

  const styles = {
    error: "bg-[#FFF0F0] border-theme-from/30",
    warning: "bg-amber-50 border-amber-200",
    success: "bg-emerald-50 border-emerald-200",
    info: "bg-blue-50 border-blue-200"
  }

  const titleColors = {
    error: "text-theme-text",
    warning: "text-amber-700",
    success: "text-emerald-700",
    info: "text-blue-700"
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && isClosable) onClose() }}>
      <DialogContent 
        className={cn(
          "sm:max-w-md flex flex-col items-center justify-center p-8", 
          styles[type], 
          !isClosable && "[&>button]:hidden"
        )}
      >
        <DialogHeader className="flex flex-col items-center w-full">
          {icons[type]}
          <DialogTitle className={cn("text-2xl font-bold mb-3 text-center tracking-tight", titleColors[type])}>
            {title}
          </DialogTitle>
          <DialogDescription className="text-[15px] font-medium text-slate-700 text-center leading-relaxed">
            {message}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
