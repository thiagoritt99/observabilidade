import { NextResponse } from 'next/server'
import type { Service, ServiceStatus, ServiceType } from '@/lib/types'

// Serviços monitorados - Lista atualizada
// Removido: WorkNow Chat
// Adicionados: CallSys, Portal TCloud, Central do Cliente TOTVS
const SERVICES: Service[] = [
  {
    id: "1",
    name: "Portal Principal",
    url: "https://fmp.edu.br",
    status: "operational" as ServiceStatus,
    responseTime: 145,
    type: "website" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "2",
    name: "Moodle FMP",
    url: "https://moodle.fmp.edu.br",
    status: "operational" as ServiceStatus,
    responseTime: 230,
    type: "education" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "3",
    name: "ESA Moodle",
    url: "https://esa.moodle.fmp.edu.br/",
    status: "operational" as ServiceStatus,
    responseTime: 189,
    type: "education" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "4",
    name: "Pergamum FMP",
    url: "https://biblioteca.fmp.edu.br",
    status: "operational" as ServiceStatus,
    responseTime: 312,
    type: "education" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "5",
    name: "Portal do Aluno",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML//Web/App/Edu/PortalEducacional/",
    status: "operational" as ServiceStatus,
    responseTime: 167,
    type: "portal" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "6",
    name: "Meu RH - TOTVS RM",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/home",
    status: "operational" as ServiceStatus,
    responseTime: 98,
    type: "portal" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "7",
    name: "Portal do Professor",
    url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/edu/PortaldoProfessor/#/login",
    status: "operational" as ServiceStatus,
    responseTime: 256,
    type: "portal" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "8",
    name: "Pós-Graduação",
    url: "http://pos.fmp.edu.br",
    status: "operational" as ServiceStatus,
    responseTime: 180,
    type: "graduation" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "9",
    name: "CRM Rubeus",
    url: "https://crmfmp.apprubeus.com.br/home",
    status: "operational" as ServiceStatus,
    responseTime: 115,
    type: "portal" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  // Novos serviços adicionados
  {
    id: "10",
    name: "CallSys",
    url: "https://omni03.espectra.com.br/pages/login",
    status: "operational" as ServiceStatus,
    responseTime: 142,
    type: "support" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "11",
    name: "Portal TCloud",
    url: "https://totvs.fluigidentity.com/cloudpass/?forward=%2Flaunchpad%2FlaunchApp%2F41nyjec30g2cicc51556045186041%2Fzf0y84vo717g8hjx",
    status: "operational" as ServiceStatus,
    responseTime: 198,
    type: "cloud" as ServiceType,
    hasErrorLast10Minutes: false,
  },
  {
    id: "12",
    name: "Central do Cliente TOTVS",
    url: "https://totvs.fluigidentity.com/ui/login-saml?forward=%2FSPInitPost%2FreceiveSSORequest%2Fzf0y84vo717g8hjx%2Fxlglk8zqmzw44blf1442945918727",
    status: "operational" as ServiceStatus,
    responseTime: 210,
    type: "support" as ServiceType,
    hasErrorLast10Minutes: false,
  },
]

// Armazenamento em memória para histórico de verificações (últimos 10 minutos)
// Em produção, isso será substituído pelo banco de dados MySQL
const checkHistory: Map<string, { timestamp: Date; status: ServiceStatus }[]> = new Map()

// Função para verificar se houve erro nos últimos 10 minutos
function hasErrorInLast10Minutes(serviceId: string): boolean {
  const history = checkHistory.get(serviceId) || []
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  
  return history.some(
    (check) => check.timestamp >= tenMinutesAgo && check.status === 'unavailable'
  )
}

// Gerar histórico visual (últimas 20 verificações)
function generateHistory(serviceId: string): ServiceStatus[] {
  const history = checkHistory.get(serviceId) || []
  const last20 = history.slice(-20)
  
  if (last20.length === 0) {
    return Array(20).fill('operational')
  }
  
  const result: ServiceStatus[] = Array(20).fill('operational')
  last20.forEach((check, index) => {
    result[20 - last20.length + index] = check.status
  })
  
  return result
}

export async function GET() {
  try {
    // Adicionar informações dinâmicas aos serviços
    const servicesWithInfo = SERVICES.map((service) => ({
      ...service,
      hasErrorLast10Minutes: hasErrorInLast10Minutes(service.id),
      history: generateHistory(service.id),
      lastCheck: new Date().toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: servicesWithInfo,
      count: servicesWithInfo.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Endpoint para atualizar status de um serviço (usado pelo n8n)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, status, responseTime } = body

    if (!id || !status) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required fields: id and status' 
        },
        { status: 400 }
      )
    }

    // Validar status
    const validStatuses: ServiceStatus[] = ['operational', 'unavailable', 'maintenance', 'unstable']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Encontrar serviço
    const serviceIndex = SERVICES.findIndex((s) => s.id === id)
    if (serviceIndex === -1) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Service not found' 
        },
        { status: 404 }
      )
    }

    // Atualizar serviço
    SERVICES[serviceIndex].status = status
    if (responseTime !== undefined) {
      SERVICES[serviceIndex].responseTime = responseTime
    }

    // Registrar no histórico
    const history = checkHistory.get(id) || []
    history.push({ timestamp: new Date(), status })
    
    // Manter apenas últimas 100 verificações
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
    checkHistory.set(id, history)

    return NextResponse.json({
      success: true,
      message: 'Service status updated successfully',
      data: {
        ...SERVICES[serviceIndex],
        hasErrorLast10Minutes: hasErrorInLast10Minutes(id),
        lastCheck: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating service:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
