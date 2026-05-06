import { NextResponse } from 'next/server'
import type { ServiceStatus } from '@/lib/types'

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'http://localhost:3000'
    
    const servicesResponse = await fetch(`${baseUrl}/api/services`, {
      cache: 'no-store',
    })
    
    if (!servicesResponse.ok) {
      throw new Error('Failed to fetch services')
    }

    const { data: services } = await servicesResponse.json()

    const statuses = services.map((s: { status: ServiceStatus }) => s.status)
    
    let overallStatus: ServiceStatus = 'operational'
    if (statuses.some((s: ServiceStatus) => s === 'unavailable')) {
      overallStatus = 'unavailable'
    } else if (statuses.some((s: ServiceStatus) => s === 'maintenance')) {
      overallStatus = 'maintenance'
    } else if (statuses.some((s: ServiceStatus) => s === 'slow')) {
      overallStatus = 'slow'
    }

    const statusCounts = {
      operational: statuses.filter((s: ServiceStatus) => s === 'operational').length,
      unavailable: statuses.filter((s: ServiceStatus) => s === 'unavailable').length,
      maintenance: statuses.filter((s: ServiceStatus) => s === 'maintenance').length,
      slow: statuses.filter((s: ServiceStatus) => s === 'slow').length,
    }

    const servicesWithErrors = services.filter(
      (s: { hasErrorLast10Minutes: boolean }) => s.hasErrorLast10Minutes
    )

    const response = {
      success: true,
      status: overallStatus === 'operational' ? 'ok' : 'warning',
      data: {
        overallStatus,
        statusCounts,
        totalServices: services.length,
        lastUpdate: new Date().toISOString(),
        hasErrorsLast10Minutes: servicesWithErrors.length > 0,
        servicesWithErrorsCount: servicesWithErrors.length,
      },
      services: services.map((s: { 
        name: string
        url: string
        status: ServiceStatus
        lastCheck?: string
        lastError?: string | null
        hasErrorLast10Minutes: boolean
        responseTime: number
      }) => ({
        name: s.name,
        url: s.url,
        status: s.status,
        responseTime: s.responseTime,
        lastCheck: s.lastCheck || new Date().toISOString(),
        lastError: s.lastError || null,
        hasErrorLast10Minutes: s.hasErrorLast10Minutes,
      })),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error calculating overall status:', error)
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
