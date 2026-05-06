import { NextResponse } from 'next/server'
import type { ServiceStatus, ServiceType } from '@/lib/types'
import { RESPONSE_TIME_THRESHOLDS } from '@/lib/types'

interface ServiceToCheck {
  id: string
  name: string
  url: string
  type: ServiceType
}

// Lista de servicos para verificar
const SERVICES_TO_CHECK: ServiceToCheck[] = [
  { id: "1", name: "Portal Principal", url: "https://fmp.edu.br", type: "website" },
  { id: "2", name: "Moodle FMP", url: "https://moodle.fmp.edu.br", type: "education" },
  { id: "3", name: "ESA Moodle", url: "https://esa.moodle.fmp.edu.br/", type: "education" },
  { id: "4", name: "Pergamum FMP", url: "https://biblioteca.fmp.edu.br", type: "education" },
  { id: "5", name: "Portal do Aluno", url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML//Web/App/Edu/PortalEducacional/", type: "portal" },
  { id: "6", name: "Meu RH - TOTVS RM", url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/home", type: "portal" },
  { id: "7", name: "Portal do Professor", url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/edu/PortaldoProfessor/#/login", type: "portal" },
  { id: "8", name: "Pos-Graduacao", url: "http://pos.fmp.edu.br", type: "graduation" },
  { id: "9", name: "CRM Rubeus", url: "https://crmfmp.apprubeus.com.br/home", type: "portal" },
  { id: "10", name: "CallSys", url: "https://omni03.espectra.com.br/pages/login", type: "support" },
  { id: "11", name: "Portal TCloud", url: "https://totvs.fluigidentity.com/cloudpass/?forward=%2Flaunchpad%2FlaunchApp%2F41nyjec30g2cicc51556045186041%2Fzf0y84vo717g8hjx", type: "cloud" },
  { id: "12", name: "Central do Cliente TOTVS", url: "https://totvs.fluigidentity.com/ui/login-saml?forward=%2FSPInitPost%2FreceiveSSORequest%2Fzf0y84vo717g8hjx%2Fxlglk8zqmzw44blf1442945918727", type: "support" },
]

// Funcao para determinar status baseado no tempo de resposta e tipo de erro
function determineStatus(responseTime: number, hasError: boolean, errorMessage?: string): ServiceStatus {
  // Erros criticos que indicam site indisponivel
  if (hasError && errorMessage) {
    const criticalErrors = [
      'timeout', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 
      'ECONNRESET', 'abort', 'EHOSTUNREACH', 'ENETUNREACH',
      'certificate', 'SSL', 'TLS'
    ]
    
    // Verifica se o erro e critico (site realmente indisponivel)
    if (criticalErrors.some(err => errorMessage.toLowerCase().includes(err.toLowerCase()))) {
      return 'unavailable'
    }
    
    // Outros erros HTTP nao criticos (401, 403, etc) - site esta respondendo
    // apenas requer autenticacao ou acesso negado
    return 'operational'
  }
  
  // Site respondeu - verificar tempo de resposta
  if (responseTime > RESPONSE_TIME_THRESHOLDS.SLOW) {
    return 'slow'
  }
  
  return 'operational'
}

// Verificar se um servico esta online com multiplas tentativas
async function checkService(service: ServiceToCheck): Promise<{
  id: string
  name: string
  url: string
  type: ServiceType
  status: ServiceStatus
  responseTime: number
  error?: string
  httpStatus?: number
}> {
  const startTime = Date.now()
  const maxRetries = 2
  let lastError: string | undefined
  let lastHttpStatus: number | undefined
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), RESPONSE_TIME_THRESHOLDS.TIMEOUT)

      let response: Response
      try {
        response = await fetch(service.url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'FMP-Monitor/1.0',
            'Accept': '*/*',
          },
        })
      } catch {
        response = await fetch(service.url, {
          method: 'GET',
          signal: controller.signal,
          redirect: 'follow',
          headers: {
            'User-Agent': 'FMP-Monitor/1.0',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        })
      }

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime
      lastHttpStatus = response.status

      // Status aceitaveis - site esta respondendo
      // 401/403 significa que o servidor esta respondendo (apenas requer autenticacao)
      const acceptableStatuses = [200, 201, 202, 204, 301, 302, 303, 307, 308, 401, 403]
      const isOk = acceptableStatuses.includes(response.status) || (response.status >= 200 && response.status < 400)
      
      if (isOk) {
        const status = determineStatus(responseTime, false)
        return {
          id: service.id,
          name: service.name,
          url: service.url,
          type: service.type,
          status,
          responseTime,
          httpStatus: response.status,
        }
      }

      // Status HTTP de erro (5xx) - pode ser problema temporario
      if (response.status >= 500) {
        lastError = `HTTP ${response.status} - Server Error`
      } else {
        // Outros status (4xx exceto 401/403) - site esta respondendo
        const responseTime = Date.now() - startTime
        return {
          id: service.id,
          name: service.name,
          url: service.url,
          type: service.type,
          status: determineStatus(responseTime, false),
          responseTime,
          httpStatus: response.status,
        }
      }
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  // Todas as tentativas falharam
  const responseTime = Date.now() - startTime
  const status = determineStatus(responseTime, true, lastError)
  
  return {
    id: service.id,
    name: service.name,
    url: service.url,
    type: service.type,
    status,
    responseTime,
    error: lastError,
    httpStatus: lastHttpStatus,
  }
}

// POST - Forcar verificacao de todos os servicos
export async function POST() {
  try {
    console.log('[Check API] Starting manual check at', new Date().toISOString())
    
    const results = await Promise.all(
      SERVICES_TO_CHECK.map((service) => checkService(service))
    )

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    await Promise.all(
      results.map((result) =>
        fetch(`${baseUrl}/api/services`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: result.id,
            status: result.status,
            responseTime: result.responseTime,
          }),
        })
      )
    )

    const operational = results.filter((r) => r.status === 'operational').length
    const unavailable = results.filter((r) => r.status === 'unavailable').length
    const slow = results.filter((r) => r.status === 'slow').length

    console.log('[Check API] Check completed:', { operational, unavailable, slow })

    // Ordenar resultados: indisponiveis primeiro, depois lentos, depois operacionais
    const sortedResults = results.sort((a, b) => {
      if (a.status === 'unavailable' && b.status !== 'unavailable') return -1
      if (a.status !== 'unavailable' && b.status === 'unavailable') return 1
      if (a.status === 'slow' && b.status !== 'slow' && b.status !== 'unavailable') return -1
      if (a.status !== 'slow' && a.status !== 'unavailable' && b.status === 'slow') return 1
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json({
      success: true,
      message: 'All services checked successfully',
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        operational,
        unavailable,
        slow,
      },
      data: sortedResults.map((r) => ({
        ...r,
        hasErrorLast10Minutes: r.status === 'unavailable',
        lastCheck: new Date().toISOString(),
      })),
    })
  } catch (error) {
    console.error('[Check API] Error during check:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check services',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET - Informacoes sobre o endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/services/check',
    description: 'Force a manual check of all monitored services',
    method: 'POST',
    statusLogic: {
      operational: 'Site responde normalmente dentro do tempo esperado',
      slow: `Site responde mas com tempo acima de ${RESPONSE_TIME_THRESHOLDS.SLOW}ms`,
      unavailable: 'Site nao responde (timeout, DNS error, connection refused, etc)',
    },
    usage: {
      curl: 'curl -X POST https://your-domain.com/api/services/check',
      n8n: 'Use HTTP Request node with POST method to this endpoint',
    },
    interval: '60 seconds (1 minute) - configured for n8n integration',
    timestamp: new Date().toISOString(),
  })
}
