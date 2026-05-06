"use client"

import Image from "next/image"
import { Clock, RefreshCw, Play, Pause, Activity } from "lucide-react"

interface HeaderProps {
  lastUpdate: Date
  updateInterval: number
  isAutoRotating: boolean
  onToggleAutoRotation: () => void
  onForceCheck?: () => void
  isChecking?: boolean
}

export function Header({ 
  lastUpdate, 
  updateInterval, 
  isAutoRotating, 
  onToggleAutoRotation,
  onForceCheck,
  isChecking 
}: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-2">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="px-3 py-2 rounded-lg bg-[#1a1a1a] flex items-center justify-center shadow-lg border border-white/10">
            <Image 
              src="/images/logo.png" 
              alt="FMP Logo" 
              width={80} 
              height={32}
              className="object-contain h-8 w-auto"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-[#191818] animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans">
            Monitoramento <span className="text-[#d4b896]">FMP</span>
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Atualizacao automatica a cada {updateInterval}s
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onForceCheck && (
          <button
            onClick={onForceCheck}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border transition-all bg-[#5a1a1a]/20 border-[#5a1a1a]/30 text-[#d4b896] hover:bg-[#5a1a1a]/40 disabled:opacity-50"
            title="Forcar verificacao manual"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium hidden sm:inline">
              {isChecking ? 'Verificando...' : 'Verificar Agora'}
            </span>
          </button>
        )}

        <button
          onClick={onToggleAutoRotation}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
            isAutoRotating 
              ? "bg-green-500/10 border-green-500/20 text-green-400" 
              : "bg-white/5 border-white/10 text-muted-foreground"
          }`}
          title={isAutoRotating ? "Pausar rotacao automatica" : "Iniciar rotacao automatica"}
        >
          {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="text-sm font-medium hidden sm:inline">
            {isAutoRotating ? "Rotacao Ativa" : "Rotacao Pausada"}
          </span>
        </button>

        <div className="glass px-4 py-2 rounded-lg border border-white/10">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
            Ultima Verificacao
          </p>
          <p className="text-sm font-mono font-bold text-foreground flex items-center gap-2">
            <Activity className="w-3 h-3 text-green-400" />
            {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </header>
  )
}
