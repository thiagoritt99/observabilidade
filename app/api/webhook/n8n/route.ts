import { NextRequest, NextResponse } from 'next/server'
import type { ServiceStatus } from '@/lib/types'

// Validação de API Key para segurança
const N8N_API_KEY = process.env.N8N_API_KEY || 'your-n8n-api-key'

// Armazenamento em memória para histórico de webhooks recebidos
// Em produção, isso será substituído pelo banco de dados MySQL
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

    // Parse do corpo da requisição
    const body = await request.json()
    
    // Validar campos obrigatórios
    const { id, status, time, serviceName } = body
    
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
    const validStatuses: ServiceStatus[] = ['operational', 'unavailable', 'partial', 'maintenance', 'unstable']
    
    // Converter status do n8n para formato interno
    let normalizedStatus: ServiceStatus = status
    if (status === 'online' || status === 'up') {
      normalizedStatus = 'operational'
    } else if (status === 'offline' || status === 'down') {
      normalizedStatus = 'unavailable'
    } else if (status === 'degraded' || status === 'slow') {
      normalizedStatus = 'unstable'
    }

    if (!validStatuses.includes(normalizedStatus)) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')} (or: online, offline, up, down, degraded, slow)` 
        },
        { status: 400 }
      )
    }

    // Log da atualização recebida
    console.log(`[n8n Webhook] Received status update:`, {
      id,
      status: normalizedStatus,
      time,
      serviceName,
      timestamp: new Date().toISOString(),
    })

    // Registrar no histórico de webhooks
    webhookHistory.push({
      timestamp: new Date(),
      serviceId: id,
      serviceName,
      status: normalizedStatus,
      responseTime: time,
    })

    // Manter apenas últimos 1000 webhooks
    if (webhookHistory.length > 1000) {
      webhookHistory.splice(0, webhookHistory.length - 1000)
    }

    // Atualizar o serviço na API principal
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'

    const updateResponse = await fetch(`${baseUrl}/api/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status: normalizedStatus,
        responseTime: time,
      }),
    })

    if (!updateResponse.ok) {
      console.error('[n8n Webhook] Failed to update service status')
    }

    // Resposta de sucesso
    return NextResponse.json(
      {
        success: true,
        message: 'Status update received and processed',
        data: {
          id,
          status: normalizedStatus,
          time,
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

// GET para teste/verificação do webhook
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key')
  
  // Para GET, permitimos acesso sem autenticação para verificar status
  const isAuthenticated = apiKey === N8N_API_KEY

  const response = {
    status: 'webhook-active',
    message: 'n8n webhook endpoint is active and ready to receive updates',
    endpoint: '/api/webhook/n8n',
    method: 'POST',
    authentication: {
      required: true,
      header: 'x-api-key',
      authenticated: isAuthenticated,
    },
    requiredFields: ['id', 'status'],
    optionalFields: ['time', 'serviceName'],
    validStatuses: ['operational', 'unavailable', 'partial', 'maintenance', 'unstable', 'online', 'offline', 'up', 'down', 'degraded', 'slow'],
    examplePayload: {
      id: '1',
      status: 'operational',
      time: 145,
      serviceName: 'Portal Principal',
    },
    timestamp: new Date().toISOString(),
  }

  // Se autenticado, mostrar histórico recente
  if (isAuthenticated) {
    return NextResponse.json({
      ...response,
      recentWebhooks: webhookHistory.slice(-10).reverse(),
      totalWebhooksReceived: webhookHistory.length,
    })
  }

  return NextResponse.json(response)
}
