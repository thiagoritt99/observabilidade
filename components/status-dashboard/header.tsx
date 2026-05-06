"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

interface HeaderProps {
  suffix?: string
  lastUpdate: Date
  updateInterval: number
}

export function Header({ suffix = "Site | Moodle", lastUpdate, updateInterval }: HeaderProps) {
  const [countdown, setCountdown] = useState(updateInterval)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : updateInterval))
    }, 1000)
    return () => clearInterval(timer)
  }, [updateInterval])

  useEffect(() => {
    setCountdown(updateInterval)
  }, [lastUpdate, updateInterval])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  return (
    <header className="bg-[#5a1a1a] border border-[#7a2a2a] rounded-xl px-4 py-6 flex items-center justify-between shadow-lg shadow-[#401616]/40">
      <div className="flex items-center gap-3">
        <Image src="/assets/logo-fmp.png" alt="FMP Logo" width={120} height={40} className="h-8 w-auto" />
        <div className="h-6 w-px bg-[#d4b896]/30" />
        <h1 className="text-lg font-semibold text-white">
          FMP Status - <span className="text-[#d4b896]">{suffix}</span>
        </h1>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex flex-col items-end">
          <span className="text-[#d4b896]/70 text-xs">Última atualização</span>
          <span className="font-mono text-[#d4b896]">{formatTime(lastUpdate)}</span>
        </div>
        <div className="h-8 w-px bg-[#d4b896]/30" />
        <div className="flex flex-col items-end">
          <span className="text-[#d4b896]/70 text-xs">Próxima atualização em</span>
          <span className="font-mono text-[#d4b896]">{countdown}s</span>
        </div>
      </div>
    </header>
  )
}
