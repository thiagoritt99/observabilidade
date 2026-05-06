"use client"

import { CheckCircle, AlertTriangle, XCircle, Wrench, Clock } from "lucide-react"
import { STATUS_CONFIG, type ServiceStatus } from "@/lib/types"

interface OverallStatusCardProps {
  overallStatus: ServiceStatus
  totalServices: number
  operationalCount: number
  avgResponseTime: number
}

const STATUS_ICONS: Record<ServiceStatus, React.ComponentType<{ className?: string }>> = {
  operational: CheckCircle,
  partial: Clock,
  slow: AlertTriangle,
  unavailable: XCircle,
  maintenance: Wrench,
}

export function OverallStatusCard({ 
  overallStatus, 
  totalServices, 
  operationalCount,
  avgResponseTime 
}: OverallStatusCardProps) {
  const config = STATUS_CONFIG[overallStatus]
  const Icon = STATUS_ICONS[overallStatus]
  const operationalPercentage = totalServices > 0 
    ? Math.round((operationalCount / totalServices) * 100) 
    : 0

  return (
    <div className={`glass rounded-xl p-4 border transition-all duration-500 ${
      overallStatus === 'operational' ? 'border-green-500/20 bg-green-500/5' :
      overallStatus === 'unavailable' ? 'border-red-500/30 bg-red-500/10' :
      overallStatus === 'partial' ? 'border-orange-500/30 bg-orange-500/10' :
      overallStatus === 'slow' ? 'border-yellow-500/20 bg-yellow-500/5' :
      'border-blue-500/20 bg-blue-500/5'
    }`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            overallStatus === 'operational' ? 'bg-green-500/20 text-green-400' :
            overallStatus === 'unavailable' ? 'bg-red-500/20 text-red-400' :
            overallStatus === 'partial' ? 'bg-orange-500/20 text-orange-400' :
            overallStatus === 'slow' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground font-sans">
              Status Geral
            </h2>
            <p className={`text-lg font-bold tracking-tight ${config.color} font-sans`}>
              {config.label}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide font-sans">
              Sistemas Monitorados
            </p>
            <p className="text-base font-mono font-bold text-foreground">
              {operationalPercentage}% Ativos
            </p>
            <p className="text-[10px] text-muted-foreground">
              {operationalCount} de {totalServices} servicos
            </p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-right">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide font-sans">
              Tempo de Resposta Medio
            </p>
            <p className="text-base font-mono font-bold text-foreground">
              {avgResponseTime}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
