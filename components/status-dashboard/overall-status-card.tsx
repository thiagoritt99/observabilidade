"use client"

import { CheckCircle2, AlertTriangle, XCircle, Wrench } from "lucide-react"
import { type ServiceStatus, STATUS_CONFIG } from "./types"

interface OverallStatusCardProps {
  overallStatus: ServiceStatus
}

const OVERALL_MESSAGES: Record<ServiceStatus, string> = {
  operational: "Todos os sistemas Operacionais",
  unstable: "Instabilidade detectada",
  unavailable: "Indisponibilidade",
  maintenance: "Manutenção",
}

const STATUS_ICONS: Record<ServiceStatus, typeof CheckCircle2> = {
  operational: CheckCircle2,
  unstable: AlertTriangle,
  unavailable: XCircle,
  maintenance: Wrench,
}

export function OverallStatusCard({ overallStatus }: OverallStatusCardProps) {
  const config = STATUS_CONFIG[overallStatus]
  const Icon = STATUS_ICONS[overallStatus]
  const message = OVERALL_MESSAGES[overallStatus]

  return (
    <div className={`glass glow-accent rounded-xl p-2 ${config.glowClass}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${config.bgColor}`}>
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
        <div>
          <h2 className={`text-lg font-semibold ${config.color}`}>{message}</h2>
          <p className="text-xs text-muted-foreground">Status geral do serviço</p>
        </div>
      </div>
    </div>
  )
}
