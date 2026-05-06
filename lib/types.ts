export type ServiceStatus = "operational" | "unavailable" | "partial" | "maintenance" | "unstable"
export type ServiceType = "website" | "education" | "portal" | "email" | "chat" | "vpn" | "graduation" | "support" | "cloud"

export interface Service {
  id: string
  name: string
  url: string
  status: ServiceStatus
  responseTime: number
  type: ServiceType
  history?: ServiceStatus[]
  lastCheck?: string
  lastError?: string | null
  hasErrorLast10Minutes?: boolean
}

export interface ServiceApiResponse {
  success: boolean
  data: Service[]
  count: number
  timestamp: string
}

export interface StatusApiResponse {
  success: boolean
  data: {
    overallStatus: ServiceStatus
    statusCounts: {
      operational: number
      unavailable: number
      maintenance: number
      unstable: number
    }
    totalServices: number
    lastUpdate: string
  }
}

export const STATUS_CONFIG: Record<ServiceStatus, { label: string; color: string; bgColor: string }> = {
  operational: {
    label: "Operacional",
    color: "text-green-400",
    bgColor: "bg-green-500/10",
  },
  partial: {
    label: "Parcialmente Indisponível",
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
  },
  unavailable: {
    label: "Indisponível",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
  },
  maintenance: {
    label: "Manutenção",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
  },
  unstable: {
    label: "Instável",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
  },
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  website: "Website",
  education: "Educação",
  portal: "Portal",
  email: "E-mail",
  chat: "Chat",
  vpn: "VPN",
  graduation: "Pós-Graduação",
  support: "Suporte",
  cloud: "Cloud",
}

// Intervalo de atualização: 60 segundos (1 minuto) - sincronizado com n8n
export const UPDATE_INTERVAL = 60 // seconds

// Intervalo de rotação automática: 10 segundos por página
export const AUTO_ROTATION_INTERVAL = 10 // seconds

// Serviços por página no grid
export const SERVICES_PER_PAGE = 9
