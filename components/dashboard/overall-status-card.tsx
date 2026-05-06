"use client"

import { CheckCircle, AlertTriangle, XCircle, Wrench, AlertOctagon } from "lucide-react"
import { STATUS_CONFIG, type ServiceStatus } from "@/lib/types"

interface OverallStatusCardProps {
  overallStatus: ServiceStatus
  totalServices: number
  operationalCount: number
  avgResponseTime: number
}

const STATUS_ICONS: Record<ServiceStatus, React.ComponentType<{ className?: string }>> = {
  operational: CheckCircle,
  partial: AlertOctagon,
  unstable: AlertTriangle,
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
    <div className={`glass rounded-2xl p-6 border-2 transition-all duration-500 ${
      overallStatus === 'operational' ? 'border-green-500/20 bg-green-500/5' :
      overallStatus === 'unavailable' ? 'border-red-500/30 bg-red-500/10' :
      overallStatus === 'partial' ? 'border-orange-500/30 bg-orange-500/10' :
      overallStatus === 'unstable' ? 'border-yellow-500/20 bg-yellow-500/5' :
      'border-blue-500/20 bg-blue-500/5'
    }`}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl ${
            overallStatus === 'operational' ? 'bg-green-500/20 text-green-400' :
            overallStatus === 'unavailable' ? 'bg-red-500/20 text-red-400' :
            overallStatus === 'partial' ? 'bg-orange-500/20 text-orange-400' :
            overallStatus === 'unstable' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            <Icon className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Status Geral do Sistema
            </h2>
            <p className={`text-3xl font-black tracking-tight ${config.color}`}>
              {config.label.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Sistemas Monitorados
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {operationalPercentage}% Ativos
            </p>
            <p className="text-xs text-muted-foreground">
              {operationalCount} de {totalServices} serviços
            </p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div className="text-right">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
              Tempo de Resposta Médio
            </p>
            <p className="text-2xl font-mono font-bold text-foreground">
              {avgResponseTime}ms
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
