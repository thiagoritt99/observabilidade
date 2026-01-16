"use client"

import { useState, useEffect, useCallback } from "react"
import { Header } from "./header"
import { OverallStatusCard } from "./overall-status-card"
import { ServicesGrid } from "./services-grid"
import type { Service, ServiceStatus } from "./types"

const generateHistory = (errorPositions: number[] = []): ServiceStatus[] => {
  const history: ServiceStatus[] = Array(20).fill("operational")
  errorPositions.forEach((pos) => {
    if (pos < 20) history[pos] = "unavailable"
  })
  return history
}

const INITIAL_SERVICES: Service[] = [
  {
    id: "1",
    name: "Portal Principal",
    url: "https://fmp.edu.br",
    status: "operational",
    responseTime: 145,
    type: "website",
    history: generateHistory(),
  },
  {
    id: "2",
    name: "Moodle FMP",
    url: "https://moodle.fmp.edu.br",
    status: "operational",
    responseTime: 230,
    type: "education",
    history: generateHistory([12, 13]),
  },
  {
    id: "3",
    name: "ESA Moodle",
    url: "https://esa.moodle.fmp.edu.br/",
    status: "operational",
    responseTime: 189,
    type: "education",
    history: generateHistory(),
  },
  {
    id: "4",
    name: "Pergamum FMP",
    url: "https://biblioteca.fmp.edu.br",
    status: "operational",
    responseTime: 312,
    type: "education",
    history: generateHistory(),
  },
  {
    id: "5",
    name: "Portal do Aluno",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML//Web/App/Edu/PortalEducacional/",
    status: "operational",
    responseTime: 167,
    type: "portal",
    history: generateHistory(),
  },
  {
    id: "6",
    name: "Meu RH - TOTVS RM",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/home",
    status: "operational",
    responseTime: 98,
    type: "portal",
    history: generateHistory(),
  },
  {
    id: "7",
    name: "Portal do Professor",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/edu/PortaldoProfessor/#/login",
    status: "operational",
    responseTime: 256,
    type: "portal",
    history: generateHistory(),
  },
  {
    id: "8",
    name: "WorkNow Chat",
    url: "https://fmp.worknow.chat",
    status: "operational",
    responseTime: 120,
    type: "chat",
    history: generateHistory(),
  },
  {
    id: "9",
    name: "Pós-Graduação",
    url: "http://pos.fmp.edu.br",
    status: "operational",
    responseTime: 180,
    type: "graduation",
    history: generateHistory(),
  },
]

const UPDATE_INTERVAL = 30 // seconds

export function StatusDashboard() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  const calculateOverallStatus = useCallback((): ServiceStatus => {
    const statuses = services.map((s) => s.status)

    if (statuses.some((s) => s === "unavailable")) return "unavailable"
    if (statuses.some((s) => s === "maintenance")) return "maintenance"
    if (statuses.some((s) => s === "unstable")) return "unstable"
    return "operational"
  }, [services])

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, UPDATE_INTERVAL * 1000)

    return () => clearInterval(interval)
  }, [])

  const overallStatus = calculateOverallStatus()

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#401616]/10 via-background to-background pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full p-4 gap-4">
        <Header suffix="Sites" lastUpdate={lastUpdate} updateInterval={UPDATE_INTERVAL} />

        <OverallStatusCard overallStatus={overallStatus} />

        <ServicesGrid services={services} />

        <footer className="text-center text-xs text-muted-foreground py-1">
          FMP - Fundação Escola Superior do Ministério Público © {new Date().getFullYear()} | Desenvolvido por TI
        </footer>
      </div>
    </div>
  )
}
