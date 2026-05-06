"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Header } from "./header"
import { OverallStatusCard } from "./overall-status-card"
import { ServicesGrid } from "./services-grid"
import type { Service, ServiceStatus } from "@/lib/types"
import { UPDATE_INTERVAL, AUTO_ROTATION_INTERVAL } from "@/lib/types"

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
    hasErrorLast10Minutes: false,
  },
  {
    id: "2",
    name: "Moodle FMP",
    url: "https://moodle.fmp.edu.br",
    status: "operational",
    responseTime: 230,
    type: "education",
    history: generateHistory([12, 13]),
    hasErrorLast10Minutes: false,
  },
  {
    id: "3",
    name: "ESA Moodle",
    url: "https://esa.moodle.fmp.edu.br/",
    status: "operational",
    responseTime: 189,
    type: "education",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "4",
    name: "Pergamum FMP",
    url: "https://biblioteca.fmp.edu.br",
    status: "operational",
    responseTime: 312,
    type: "education",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "5",
    name: "Portal do Aluno",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML//Web/App/Edu/PortalEducacional/",
    status: "operational",
    responseTime: 167,
    type: "portal",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "6",
    name: "Meu RH - TOTVS RM",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/home",
    status: "operational",
    responseTime: 98,
    type: "portal",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "7",
    name: "Portal do Professor",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/edu/PortaldoProfessor/#/login",
    status: "operational",
    responseTime: 256,
    type: "portal",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "8",
    name: "Pos-Graduacao",
    url: "http://pos.fmp.edu.br",
    status: "operational",
    responseTime: 180,
    type: "graduation",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "9",
    name: "CRM Rubeus",
    url: "https://crmfmp.apprubeus.com.br/home",
    status: "operational",
    responseTime: 115,
    type: "portal",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "10",
    name: "CallSys",
    url: "https://omni03.espectra.com.br/pages/login",
    status: "operational",
    responseTime: 142,
    type: "support",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "11",
    name: "Portal TCloud",
    url: "https://totvs.fluigidentity.com/cloudpass/?forward=%2Flaunchpad%2FlaunchApp%2F41nyjec30g2cicc51556045186041%2Fzf0y84vo717g8hjx",
    status: "operational",
    responseTime: 198,
    type: "cloud",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
  {
    id: "12",
    name: "Central do Cliente TOTVS",
    url: "https://totvs.fluigidentity.com/ui/login-saml?forward=%2FSPInitPost%2FreceiveSSORequest%2Fzf0y84vo717g8hjx%2Fxlglk8zqmzw44blf1442945918727",
    status: "operational",
    responseTime: 210,
    type: "support",
    history: generateHistory(),
    hasErrorLast10Minutes: false,
  },
]

// Funcao para ordenar servicos: indisponiveis primeiro, depois lentos, depois operacionais
function sortServices(services: Service[]): Service[] {
  return [...services].sort((a, b) => {
    // Sites indisponiveis primeiro
    if (a.status === 'unavailable' && b.status !== 'unavailable') return -1
    if (a.status !== 'unavailable' && b.status === 'unavailable') return 1
    // Sites lentos em segundo
    if (a.status === 'slow' && b.status !== 'slow' && b.status !== 'unavailable') return -1
    if (a.status !== 'slow' && a.status !== 'unavailable' && b.status === 'slow') return 1
    // Depois ordena por nome
    return a.name.localeCompare(b.name)
  })
}

export function StatusDashboard() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const previousStatusRef = useRef<Record<string, ServiceStatus>>({})

  useEffect(() => {
    const initialStatus: Record<string, ServiceStatus> = {}
    INITIAL_SERVICES.forEach((service) => {
      initialStatus[service.id] = service.status
    })
    previousStatusRef.current = initialStatus
  }, [])

  const calculateOverallStatus = useCallback((): ServiceStatus => {
    const unavailableCount = services.filter((s) => s.status === "unavailable").length
    const maintenanceCount = services.filter((s) => s.status === "maintenance").length
    const slowCount = services.filter((s) => s.status === "slow").length
    const totalServices = services.length

    if (unavailableCount > totalServices * 0.5) return "unavailable"
    if (unavailableCount > 0) return "partial"
    if (maintenanceCount > 0) return "maintenance"
    if (slowCount > 0) return "slow"
    
    return "operational"
  }, [services])

  const calculateAvgResponseTime = useCallback((): number => {
    if (services.length === 0) return 0
    const total = services.reduce((sum, s) => sum + s.responseTime, 0)
    return Math.round(total / services.length)
  }, [services])

  const handleForceCheck = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/services/check', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setServices(sortServices(data.data))
        }
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erro ao forcar verificacao:', error)
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setServices(sortServices(data.data))
            setLastUpdate(new Date())
          }
        }
      } catch (error) {
        console.error('Erro ao buscar servicos:', error)
      }
    }

    fetchServices()
    const interval = setInterval(fetchServices, UPDATE_INTERVAL * 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    services.forEach((service) => {
      const previousStatus = previousStatusRef.current[service.id]
      
      if (previousStatus !== "unavailable" && service.status === "unavailable") {
        // Site ficou indisponivel - nao mostra popup, apenas atualiza a lista
        console.log(`[Dashboard] Servico ${service.name} ficou indisponivel`)
      }
    })

    const newStatus: Record<string, ServiceStatus> = {}
    services.forEach((service) => {
      newStatus[service.id] = service.status
    })
    previousStatusRef.current = newStatus
  }, [services])

  const handleReorder = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return

    setServices((prev) => {
      const newServices = [...prev]
      const draggedIndex = newServices.findIndex((s) => s.id === draggedId)
      const targetIndex = newServices.findIndex((s) => s.id === targetId)
      
      if (draggedIndex === -1 || targetIndex === -1) return prev

      const [draggedItem] = newServices.splice(draggedIndex, 1)
      newServices.splice(targetIndex, 0, draggedItem)
      
      return newServices
    })
  }

  const overallStatus = calculateOverallStatus()
  const operationalCount = services.filter(s => s.status === "operational").length

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{
        backgroundImage: 'url(/images/background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="fixed inset-0 bg-[#191818]/80 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#401616]/20 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col flex-1 p-4 gap-4 max-w-7xl mx-auto w-full">
        <Header 
          lastUpdate={lastUpdate} 
          updateInterval={UPDATE_INTERVAL}
          isAutoRotating={isAutoRotating}
          onToggleAutoRotation={() => setIsAutoRotating(!isAutoRotating)}
          onForceCheck={handleForceCheck}
          isChecking={isChecking}
        />

        <OverallStatusCard 
          overallStatus={overallStatus}
          totalServices={services.length}
          operationalCount={operationalCount}
          avgResponseTime={calculateAvgResponseTime()}
        />

        <ServicesGrid 
          services={services} 
          onReorder={handleReorder}
          autoRotationInterval={isAutoRotating ? AUTO_ROTATION_INTERVAL : null}
        />

        <footer className="text-center text-xs text-muted-foreground py-4 mt-auto font-sans">
          FMP - Fundacao Escola Superior do Ministerio Publico &copy; {new Date().getFullYear()} | Desenvolvido por TI
        </footer>
      </div>
    </div>
  )
}
