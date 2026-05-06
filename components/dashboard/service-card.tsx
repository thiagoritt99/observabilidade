"use client"

import type React from "react"
import { useState } from "react"
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
  AlertOctagon,
  XCircle,
  Wrench,
  GripVertical,
  Headphones,
  Cloud,
} from "lucide-react"
import { type Service, STATUS_CONFIG, type ServiceType, type ServiceStatus } from "@/lib/types"

const SERVICE_ICONS: Record<ServiceType, React.ComponentType<{ className?: string }>> = {
  education: GraduationCap,
  portal: User,
  website: Building,
  email: Mail,
  chat: MessageCircle,
  vpn: Shield,
  graduation: GraduationCap,
  support: Headphones,
  cloud: Cloud,
}

const STATUS_ICONS: Record<ServiceStatus, React.ComponentType<{ className?: string }>> = {
  operational: CheckCircle,
  partial: AlertOctagon,
  unstable: AlertTriangle,
  unavailable: XCircle,
  maintenance: Wrench,
}

interface ServiceCardProps {
  service: Service
  onReorder: (draggedId: string, targetId: string) => void
}

export function ServiceCard({ service, onReorder }: ServiceCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)

  const config = STATUS_CONFIG[service.status]
  const Icon = SERVICE_ICONS[service.type] || Globe
  const StatusIcon = STATUS_ICONS[service.status] || CheckCircle

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("serviceId", service.id)
    e.dataTransfer.effectAllowed = "move"
    setTimeout(() => setIsDragging(true), 0)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    setIsOver(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (!isDragging) setIsOver(true)
  }

  const handleDragLeave = () => {
    setIsOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)
    const draggedId = e.dataTransfer.getData("serviceId")
    if (draggedId && draggedId !== service.id) {
      onReorder(draggedId, service.id)
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`glass rounded-lg p-4 transition-all duration-200 relative group flex flex-col h-full ${
        isDragging ? "opacity-10 scale-95" : "opacity-100"
      } ${isOver ? "border-2 border-blue-500/50 bg-blue-500/10 scale-[1.02] z-30" : "border-transparent"} ${
        service.status === "unavailable" ? "border-red-500/50 bg-red-500/5 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : ""
      }`}
    >
      {/* Handle visual para indicar que é arrastável */}
      <div className="absolute right-2 top-2 p-2 text-muted-foreground/30 group-hover:text-white transition-colors cursor-grab active:cursor-grabbing z-20">
        <GripVertical className="w-5 h-5" />
      </div>

      <a
        href={service.url}
        target="_blank"
        rel="noopener noreferrer"
        className="cursor-pointer flex flex-col h-full"
        onClick={(e) => {
          if (isDragging) e.preventDefault()
        }}
      >
        {/* Header com ícone */}
        <div className="flex items-start justify-between mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-[#5a1a1a] flex items-center justify-center">
              <Icon className="w-6 h-6 text-[#d4b896]" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground pr-8">{service.responseTime}ms</span>
        </div>

        {/* Nome e URL */}
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{service.name}</h3>
        <p className="text-xs text-muted-foreground mb-3 truncate">{service.url}</p>

        {/* Status Badge */}
        <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 mt-auto ${config.bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          <div
            className={`ml-auto w-2 h-2 rounded-full ${
              service.status === "operational"
                ? "bg-green-500 animate-pulse"
                : service.status === "partial"
                  ? "bg-orange-500 animate-pulse"
                  : service.status === "unstable"
                    ? "bg-yellow-500 animate-pulse"
                    : service.status === "unavailable"
                      ? "bg-red-500 animate-pulse"
                      : "bg-blue-500 animate-pulse"
            }`}
          />
        </div>

        {/* Indicador de Log dos Últimos 10 Minutos */}
        <div className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
          service.hasErrorLast10Minutes 
            ? "bg-red-500/10 border border-red-500/20" 
            : "bg-green-500/10 border border-green-500/20"
        }`}>
          <div className={`w-2 h-2 rounded-full ${
            service.hasErrorLast10Minutes ? "bg-red-500" : "bg-green-500"
          }`} />
          <span className={service.hasErrorLast10Minutes ? "text-red-400" : "text-green-400"}>
            Log últimos 10 min: {service.hasErrorLast10Minutes ? "Erro detectado" : "OK"}
          </span>
        </div>

        {/* Mini histórico com barrinhas */}
        {service.history && service.history.length > 0 && (
          <div className="flex gap-[2px] mt-3">
            {service.history.slice(-20).map((status, i) => (
                <div
                  key={i}
                  className={`h-2 flex-1 rounded-sm ${
                    status === "operational"
                      ? "bg-green-500"
                      : status === "partial"
                        ? "bg-orange-500"
                        : status === "unstable"
                          ? "bg-yellow-500"
                          : status === "unavailable"
                            ? "bg-red-500"
                            : "bg-blue-500"
                  }`}
                  title={STATUS_CONFIG[status].label}
                />
            ))}
          </div>
        )}
      </a>
    </div>
  )
}
