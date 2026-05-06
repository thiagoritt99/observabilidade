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
  XCircle,
  Wrench,
  GripVertical,
  Headphones,
  Cloud,
  Clock,
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
  partial: Clock,
  slow: AlertTriangle,
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
      } ${
        service.status === "slow" ? "border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]" : ""
      }`}
    >
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
        <div className="flex items-start justify-between mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-[#5a1a1a] flex items-center justify-center">
              <Icon className="w-6 h-6 text-[#d4b896]" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground pr-8 font-mono">{service.responseTime}ms</span>
        </div>

        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 font-sans">{service.name}</h3>
        <p className="text-xs text-muted-foreground mb-3 truncate">{service.url}</p>

        <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 mt-auto ${config.bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color} font-sans`}>{config.label}</span>
        </div>

        {service.history && service.history.length > 0 && (
          <div className="flex items-center gap-0.5">
            {service.history.map((status, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full ${
                  status === "operational"
                    ? "bg-green-500"
                    : status === "slow"
                    ? "bg-yellow-500"
                    : status === "unavailable"
                    ? "bg-red-500"
                    : status === "maintenance"
                    ? "bg-blue-500"
                    : "bg-orange-500"
                }`}
                title={`Verificacao ${index + 1}: ${status}`}
              />
            ))}
          </div>
        )}
      </a>
    </div>
  )
}
