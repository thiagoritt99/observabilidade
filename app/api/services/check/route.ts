import { NextResponse } from 'next/server'
import type { ServiceStatus, ServiceType } from '@/lib/types'

interface ServiceToCheck {
  id: string
  name: string
  url: string
  type: ServiceType
}

// Lista de serviços para verificar
const SERVICES_TO_CHECK: ServiceToCheck[] = [
  { id: "1", name: "Portal Principal", url: "https://fmp.edu.br", type: "website" },
  { id: "2", name: "Moodle FMP", url: "https://moodle.fmp.edu.br", type: "education" },
  { id: "3", name: "ESA Moodle", url: "https://esa.moodle.fmp.edu.br/", type: "education" },
  { id: "4", name: "Pergamum FMP", url: "https://biblioteca.fmp.edu.br", type: "education" },
  { id: "5", name: "Portal do Aluno", url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML//Web/App/Edu/PortalEducacional/", type: "portal" },
  { id: "6", name: "Meu RH - TOTVS RM", url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/home", type: "portal" },
  { id: "7", name: "Portal do Professor", url: "https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/edu/PortaldoProfessor/#/login", type: "portal" },
  { id: "8", name: "Pós-Graduação", url: "http://pos.fmp.edu.br", type: "graduation" },
  { id: "9", name: "CRM Rubeus", url: "https://crmfmp.apprubeus.com.br/home", type: "portal" },
  { id: "10", name: "CallSys", url: "https://omni03.espectra.com.br/pages/login", type: "support" },
  { id: "11", name: "Portal TCloud", url: "https://totvs.fluigidentity.com/cloudpass/?forward=%2Flaunchpad%2FlaunchApp%2F41nyjec30g2cicc51556045186041%2Fzf0y84vo717g8hjx", type: "cloud" },
  { id: "12", name: "Central do Cliente TOTVS", url: "https://totvs.fluigidentity.com/ui/login-saml?forward=%2FSPInitPost%2FreceiveSSORequest%2Fzf0y84vo717g8hjx%2Fxlglk8zqmzw44blf1442945918727", type: "support" },
]

// Verificar se um serviço está online com múltiplas tentativas
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
  const maxRetries = 2 // Tentar até 3 vezes (1 original + 2 retries)
  let lastError: string | undefined
  let lastHttpStatus: number | undefined
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos de timeout

      // Tentar HEAD primeiro, se falhar tentar GET
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
        // Se HEAD falhar, tentar GET (alguns servidores bloqueiam HEAD)
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

      // Considerar sucesso se status for 2xx, 3xx, ou alguns 4xx específicos
      // 401/403 significa que o servidor está respondendo (apenas requer autenticação)
      const acceptableStatuses = [200, 201, 202, 204, 301, 302, 303, 307, 308, 401, 403]
      const isOk = acceptableStatuses.includes(response.status) || (response.status >= 200 && response.status < 400)
      
      if (isOk) {
        // Se resposta muito lenta (> 8s), considerar instável
        let status: ServiceStatus = 'operational'
        if (responseTime > 8000) {
          status = 'unstable'
        }

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

      // Se chegou aqui, status não é aceitável - tentar novamente
      lastError = `HTTP ${response.status}`
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error'
      
      // Se não for a última tentativa, esperar um pouco antes de tentar novamente
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000)) // Esperar 1 segundo
      }
    }
  }

  // Todas as tentativas falharam
  const responseTime = Date.now() - startTime
  
  return {
    id: service.id,
    name: service.name,
    url: service.url,
    type: service.type,
    status: 'unavailable',
    responseTime,
    error: lastError,
    httpStatus: lastHttpStatus,
  }
}

// POST - Forçar verificação de todos os serviços
export async function POST() {
  try {
    console.log('[Check API] Starting manual check at', new Date().toISOString())
    
    // Verificar todos os serviços em paralelo
    const results = await Promise.all(
      SERVICES_TO_CHECK.map((service) => checkService(service))
    )

    // Atualizar cada serviço na API principal
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

    // Calcular estatísticas
    const operational = results.filter((r) => r.status === 'operational').length
    const unavailable = results.filter((r) => r.status === 'unavailable').length
    const unstable = results.filter((r) => r.status === 'unstable').length

    console.log('[Check API] Check completed:', { operational, unavailable, unstable })

    return NextResponse.json({
      success: true,
      message: 'All services checked successfully',
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        operational,
        unavailable,
        unstable,
      },
      data: results.map((r) => ({
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

// GET - Informações sobre o endpoint
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/services/check',
    description: 'Force a manual check of all monitored services',
    method: 'POST',
    usage: {
      curl: 'curl -X POST https://your-domain.com/api/services/check',
      n8n: 'Use HTTP Request node with POST method to this endpoint',
    },
    interval: '60 seconds (1 minute) - configured for n8n integration',
    timestamp: new Date().toISOString(),
  })
}
