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

// Lista de serviços atualizada conforme solicitado
// Removido: WorkNow Chat
// Adicionados: CallSys, Portal TCloud, Central do Cliente TOTVS
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
    name: "Pós-Graduação",
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
  // Novos serviços adicionados
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

export function StatusDashboard() {
  const [services, setServices] = useState<Service[]>(INITIAL_SERVICES)
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const [alertModal, setAlertModal] = useState<{ serviceId: string; serviceName: string } | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const previousStatusRef = useRef<Record<string, ServiceStatus>>({})

  // Inicializar status anterior
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
    const unstableCount = services.filter((s) => s.status === "unstable").length
    const totalServices = services.length

    // Se mais de 50% dos servicos estao indisponiveis, sistema indisponivel
    if (unavailableCount > totalServices * 0.5) return "unavailable"
    
    // Se apenas alguns servicos estao indisponiveis (1 a 50%), parcialmente indisponivel
    if (unavailableCount > 0) return "partial"
    
    // Se algum esta em manutencao
    if (maintenanceCount > 0) return "maintenance"
    
    // Se algum esta instavel
    if (unstableCount > 0) return "unstable"
    
    return "operational"
  }, [services])

  const calculateAvgResponseTime = useCallback((): number => {
    if (services.length === 0) return 0
    const total = services.reduce((sum, s) => sum + s.responseTime, 0)
    return Math.round(total / services.length)
  }, [services])

  // Função para tocar som de alerta
  const playAlertSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 1000
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (error) {
      console.error("Erro ao tocar som de alerta:", error)
    }
  }, [])

  // Função para forçar verificação manual
  const handleForceCheck = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/services/check', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setServices(data.data)
        }
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erro ao forçar verificação:', error)
    } finally {
      setIsChecking(false)
    }
  }

  // Buscar serviços da API periodicamente
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services')
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            setServices(data.data)
            setLastUpdate(new Date())
          }
        }
      } catch (error) {
        console.error('Erro ao buscar serviços:', error)
      }
    }

    // Buscar imediatamente
    fetchServices()

    // Configurar intervalo de 60 segundos (1 minuto)
    const interval = setInterval(fetchServices, UPDATE_INTERVAL * 1000)

    return () => clearInterval(interval)
  }, [])

  // Monitorar mudanças de status e disparar alertas
  useEffect(() => {
    services.forEach((service) => {
      const previousStatus = previousStatusRef.current[service.id]
      
      if (previousStatus !== "unavailable" && service.status === "unavailable") {
        playAlertSound()
        setAlertModal({ serviceId: service.id, serviceName: service.name })
        
        const timer = setTimeout(() => {
          setAlertModal(null)
        }, 5000)
        
        return () => clearTimeout(timer)
      }
    })

    const newStatus: Record<string, ServiceStatus> = {}
    services.forEach((service) => {
      newStatus[service.id] = service.status
    })
    previousStatusRef.current = newStatus
  }, [services, playAlertSound])

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

  // Serviços na ordem definida pelo usuário (drag and drop)
  // A ordenação automática foi removida para permitir controle total do usuário

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
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="fixed inset-0 bg-[#191818]/80 pointer-events-none" />
      
      {/* Gradiente adicional */}
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

        {/* Modal de Alerta */}
        {alertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] border border-red-500/50 rounded-lg p-6 max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-red-500 animate-pulse" />
                </div>
                <h2 className="text-lg font-bold text-red-500">Serviço Offline</h2>
              </div>
              <p className="text-foreground mb-4">
                O serviço <strong>{alertModal.serviceName}</strong> está indisponível.
              </p>
              <p className="text-xs text-muted-foreground">
                Este alerta será fechado automaticamente em 5 segundos.
              </p>
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-muted-foreground py-4 mt-auto">
          FMP - Fundação Escola Superior do Ministério Público &copy; {new Date().getFullYear()} | Desenvolvido por TI
        </footer>
      </div>
    </div>
  )
}
