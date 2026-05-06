"use client"

import type React from "react"
import { useState } from "react"
import { GraduationCap, User, Globe, Mail, MessageCircle, Shield, Building, CheckCircle, AlertTriangle, XCircle, Wrench, GripVertical } from "lucide-react"
import Image from "next/image"
import { type Service, STATUS_CONFIG } from "./types"

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  education: GraduationCap, portal: User, website: Building, email: Mail, chat: MessageCircle, vpn: Shield, graduation: GraduationCap,
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  operational: CheckCircle, unstable: AlertTriangle, unavailable: XCircle, maintenance: Wrench,
}

interface ServiceCardProps {
  service: Service
  onReorder: (draggedId: string, targetId: string) => void
}

export function ServiceCard({ service, onReorder }: ServiceCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isOver, setIsOver] = useState(false)
  const config = STATUS_CONFIG[service.status]
  const Icon = SERVICE_ICONS[service.type || "website"] || Globe
  const StatusIcon = STATUS_ICONS[service.status] || CheckCircle

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData("serviceId", service.id); setTimeout(() => setIsDragging(true), 0); }}
      onDragEnd={() => { setIsDragging(false); setIsOver(false); }}
      onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsOver(false); const draggedId = e.dataTransfer.getData("serviceId"); if (draggedId && draggedId !== service.id) onReorder(draggedId, service.id); }}
      className={`glass rounded-lg p-4 transition-all duration-200 relative group flex flex-col h-full ${isDragging ? "opacity-10 scale-95" : "opacity-100"} ${isOver ? "border-2 border-blue-500/50 bg-blue-500/10 scale-[1.02] z-30" : "border-transparent"}`}
    >
      <div className="absolute right-2 top-2 p-2 text-muted-foreground/30 group-hover:text-white transition-colors cursor-grab active:cursor-grabbing z-20">
        <GripVertical className="w-5 h-5" />
      </div>
      <a href={service.url} target="_blank" rel="noopener noreferrer" className="cursor-pointer flex flex-col h-full" onClick={(e) => { if (isDragging) e.preventDefault(); }}>
        <div className="flex items-start justify-between mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-lg bg-[#5a1a1a] flex items-center justify-center"><Icon className="w-6 h-6 text-[#d4b896]" /></div>
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#401616] flex items-center justify-center">
              <Image src="/assets/favicon.png" alt="FMP" width={12} height={12} />
            </div>
          </div>
          <span className="text-xs text-muted-foreground pr-8">{service.responseTime}ms</span>
        </div>
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{service.name}</h3>
        <p className="text-xs text-muted-foreground mb-3 truncate">{service.url}</p>
        <div className={`flex items-center gap-2 p-2 rounded-lg mb-3 mt-auto ${config.bgColor}`}>
          <StatusIcon className={`w-4 h-4 ${config.color}`} />
          <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          <div className={`ml-auto w-2 h-2 rounded-full ${service.status === "operational" ? "bg-green-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
        </div>
      </a>
    </div>
  )
}
