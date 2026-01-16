"use client"

import type React from "react"

import {
  GraduationCap,
  User,
  Globe,
  Mail,
  MessageCircle,
  Shield,
  Building,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Wrench,
} from "lucide-react"
import Image from "next/image"
import { type Service, STATUS_CONFIG } from "./types"

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  education: GraduationCap,
  portal: User,
  website: Building,
  email: Mail,
  chat: MessageCircle,
  vpn: Shield,
  graduation: GraduationCap,
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  operational: CheckCircle,
  unstable: AlertTriangle,
  unavailable: XCircle,
  maintenance: Wrench,
}

interface ServiceCardProps {
  service: Service
}

export function ServiceCard({ service }: ServiceCardProps) {
  const config = STATUS_CONFIG[service.status]
  const Icon = SERVICE_ICONS[service.type || "website"] || Globe
  const StatusIcon = STATUS_ICONS[service.status] || CheckCircle

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass rounded-lg p-4 transition-all duration-300 hover:scale-[1.02] hover:bg-white/10 cursor-pointer block"
    >
      {/* Header com ícone */}
      <div className="flex items-start justify-between mb-3">
        {/* Ícone com logo FMP */}
        <div className="relative">
          <div className="w-12 h-12 rounded-lg bg-[#5a1a1a] flex items-center justify-center">
            <Icon className="w-6 h-6 text-[#d4b896]" />
          </div>
          <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#401616] flex items-center justify-center">
            <Image src="/assets/favicon.png" alt="FMP" width={12} height={12} />
          </div>
        </div>

        <span className="text-xs text-muted-foreground">{service.responseTime}ms</span>
      </div>

      {/* Nome e URL */}
      <h3 className="font-semibold text-foreground mb-1">{service.name}</h3>
      <p className="text-xs text-muted-foreground mb-3 truncate">{service.url}</p>

      <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 ${config.bgColor}`}>
        <StatusIcon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
        {/* Bolinha de status animada */}
        <div
          className={`ml-auto w-2 h-2 rounded-full ${
            service.status === "operational"
              ? "bg-green-500 animate-pulse"
              : service.status === "unstable"
                ? "bg-yellow-500 animate-pulse"
                : service.status === "unavailable"
                  ? "bg-red-500 animate-pulse"
                  : "bg-indigo-500 animate-pulse"
          }`}
        />
      </div>

      {/* Mini histórico com barrinhas */}
      {service.history && service.history.length > 0 && (
        <div className="flex gap-[2px]">
          {service.history.slice(-20).map((status, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                status === "operational"
                  ? "bg-green-500"
                  : status === "unstable"
                    ? "bg-yellow-500"
                    : status === "unavailable"
                      ? "bg-red-500"
                      : "bg-indigo-500"
              }`}
              title={STATUS_CONFIG[status].label}
            />
          ))}
        </div>
      )}
    </a>
  )
}
