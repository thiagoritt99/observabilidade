import { NextRequest, NextResponse } from 'next/server'
import type { ServiceStatus } from '@/lib/types'
import { RESPONSE_TIME_THRESHOLDS } from '@/lib/types'

// Validacao de API Key para seguranca
const N8N_API_KEY = process.env.N8N_API_KEY || 'your-n8n-api-key'

// Armazenamento em memoria para historico de webhooks recebidos
const webhookHistory: Array<{
  timestamp: Date
  serviceId: string
  serviceName?: string
  status: ServiceStatus
  responseTime?: number
}> = []

export async function POST(request: NextRequest) {
  try {
    // Validar API Key
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== N8N_API_KEY) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Unauthorized - Invalid API Key' 
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, status, time, serviceName, responseTime, errorType } = body
    
    if (!id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: id' 
        },
        { status: 400 }
      )
    }

    // Logica de status corrigida
    // 1. Se o n8n envia status explicito, usar (com normalizacao)
    // 2. Se envia apenas responseTime, determinar automaticamente
    // 3. Se envia errorType, usar para determinar se e indisponivel
    
    let normalizedStatus: ServiceStatus
    const actualResponseTime = time || responseTime || 0
    
    if (status) {
      // Normalizar status enviado pelo n8n
      if (status === 'online' || status === 'up' || status === 'ok') {
        // Verificar se mesmo online, esta lento
        if (actualResponseTime > RESPONSE_TIME_THRESHOLDS.SLOW) {
          normalizedStatus = 'slow'
        } else {
          normalizedStatus = 'operational'
        }
      } else if (status === 'offline' || status === 'down' || status === 'error') {
        normalizedStatus = 'unavailable'
      } else if (status === 'slow' || status === 'degraded' || status === 'unstable') {
        normalizedStatus = 'slow'
      } else if (status === 'maintenance') {
        normalizedStatus = 'maintenance'
      } else {
        // Status ja no formato correto
        const validStatuses: ServiceStatus[] = ['operational', 'unavailable', 'partial', 'maintenance', 'slow']
        normalizedStatus = validStatuses.includes(status as ServiceStatus) ? status as ServiceStatus : 'operational'
      }
    } else if (errorType) {
      // Se tem erro, verificar se e critico
      const criticalErrors = ['timeout', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'abort']
      if (criticalErrors.some(err => errorType.toLowerCase().includes(err.toLowerCase()))) {
        normalizedStatus = 'unavailable'
      } else {
        normalizedStatus = 'operational'
      }
    } else if (actualResponseTime > 0) {
      // Determinar por tempo de resposta
      normalizedStatus = actualResponseTime > RESPONSE_TIME_THRESHOLDS.SLOW ? 'slow' : 'operational'
    } else {
      normalizedStatus = 'operational'
    }

    console.log(`[n8n Webhook] Received status update:`, {
      id,
      originalStatus: status,
      normalizedStatus,
      responseTime: actualResponseTime,
      serviceName,
      timestamp: new Date().toISOString(),
    })

    // Registrar no historico de webhooks
    webhookHistory.push({
      timestamp: new Date(),
      serviceId: id,
      serviceName,
      status: normalizedStatus,
      responseTime: actualResponseTime,
    })

    if (webhookHistory.length > 1000) {
      webhookHistory.splice(0, webhookHistory.length - 1000)
    }

    // Atualizar o servico na API principal
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    const updateResponse = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: normalizedStatus,
        responseTime: actualResponseTime,
      }),
    })

    if (!updateResponse.ok) {
      console.error('[n8n Webhook] Failed to update service status')
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Status update received and processed',
        data: {
          id,
          status: normalizedStatus,
          responseTime: actualResponseTime,
          serviceName,
          processedAt: new Date().toISOString(),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[n8n Webhook] Error processing request:', error)
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

// GET para teste/verificacao do webhook
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  
  // Para GET, permitir acesso sem API key para verificar se endpoint esta ativo
  const isAuthenticated = apiKey === N8N_API_KEY
  
  return NextResponse.json({
    endpoint: '/api/webhook/n8n',
    status: 'active',
    authenticated: isAuthenticated,
    statusLogic: {
      operational: 'Site responde normalmente (responseTime < 5000ms)',
      slow: 'Site responde mas com lentidao (responseTime >= 5000ms)',
      unavailable: 'Site indisponivel (timeout, DNS error, connection refused, etc)',
    },
    acceptedStatuses: {
      input: ['online', 'up', 'ok', 'offline', 'down', 'error', 'slow', 'degraded', 'unstable', 'maintenance'],
      normalized: ['operational', 'slow', 'unavailable', 'maintenance', 'partial'],
    },
    usage: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'YOUR_N8N_API_KEY'
      },
      body: {
        id: 'string (required) - Service ID',
        status: 'string (optional) - online/offline/slow/etc',
        time: 'number (optional) - Response time in ms',
        responseTime: 'number (optional) - Alternative to time',
        serviceName: 'string (optional) - Service name for logging',
        errorType: 'string (optional) - Error type if failed',
      },
    },
    recentWebhooks: isAuthenticated ? webhookHistory.slice(-10) : 'Authenticate to see recent webhooks',
    timestamp: new Date().toISOString(),
  })
}
