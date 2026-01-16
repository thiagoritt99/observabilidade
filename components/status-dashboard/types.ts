export type ServiceStatus = "operational" | "unstable" | "unavailable" | "maintenance"

export type ServiceType = "education" | "portal" | "website" | "email" | "chat" | "vpn" | "graduation"

export interface Service {
  id: string
  name: string
  url: string
  status: ServiceStatus
  responseTime: number
  history?: ServiceStatus[] // mudou history para 90 entradas e adicionou uptime
  uptime?: number
  type?: ServiceType // Campo opcional para tipo de serviço
}

export interface StatusConfig {
  label: string
  color: string
  bgColor: string
  glowClass: string
}

export const STATUS_CONFIG: Record<ServiceStatus, StatusConfig> = {
  operational: {
    label: "Operacional",
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    glowClass: "glow-green",
  },
  unstable: {
    label: "Instável",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    glowClass: "glow-yellow",
  },
  unavailable: {
    label: "Indisponível",
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    glowClass: "glow-red",
  },
  maintenance: {
    label: "Manutenção",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    glowClass: "glow-blue",
  },
}
