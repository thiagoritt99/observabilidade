"use client"

import { useState, useRef, useEffect } from "react"
import type { Service } from "@/lib/types"
import { ServiceCard } from "./service-card"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { SERVICES_PER_PAGE } from "@/lib/types"

interface ServicesGridProps {
  services: Service[]
  onReorder: (draggedId: string, targetId: string) => void
  autoRotationInterval?: number | null
}

export function ServicesGrid({ services, onReorder, autoRotationInterval }: ServicesGridProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)

  const totalPages = Math.ceil(services.length / SERVICES_PER_PAGE)
  const startIndex = currentPage * SERVICES_PER_PAGE
  const visibleServices = services.slice(startIndex, startIndex + SERVICES_PER_PAGE)

  useEffect(() => {
    if (!isAutoRotating || !autoRotationInterval || totalPages <= 1) {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current)
      }
      return
    }

    autoRotateTimeoutRef.current = setTimeout(() => {
      setCurrentPage((prev) => {
        const nextPage = (prev + 1) % totalPages
        return nextPage
      })
    }, autoRotationInterval * 1000)

    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current)
      }
    }
  }, [isAutoRotating, autoRotationInterval, totalPages, currentPage])

  useEffect(() => {
    const handleGlobalDragStart = () => setIsDraggingGlobal(true)
    const handleGlobalDragEnd = () => {
      setIsDraggingGlobal(false)
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    }

    window.addEventListener("dragstart", handleGlobalDragStart)
    window.addEventListener("dragend", handleGlobalDragEnd)
    window.addEventListener("drop", handleGlobalDragEnd)

    return () => {
      window.removeEventListener("dragstart", handleGlobalDragStart)
      window.removeEventListener("dragend", handleGlobalDragEnd)
      window.removeEventListener("drop", handleGlobalDragEnd)
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current)
    }
  }, [currentPage, totalPages])

  const triggerPageChange = (direction: 'prev' | 'next') => {
    if (hoverTimeoutRef.current) return

    hoverTimeoutRef.current = setTimeout(() => {
      if (direction === 'prev' && currentPage > 0) {
        setCurrentPage(p => p - 1)
      } else if (direction === 'next' && currentPage < totalPages - 1) {
        setCurrentPage(p => p + 1)
      }
      hoverTimeoutRef.current = null
    }, 700)
  }

  const cancelPageChange = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  const toggleAutoRotation = () => {
    setIsAutoRotating(!isAutoRotating)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {isDraggingGlobal && (
        <>
          <div 
            className="fixed left-0 top-0 bottom-0 w-16 z-[100] bg-transparent"
            onDragOver={(e) => { e.preventDefault(); triggerPageChange('prev'); }}
            onDragLeave={cancelPageChange}
          />
          <div 
            className="fixed right-0 top-0 bottom-0 w-16 z-[100] bg-transparent"
            onDragOver={(e) => { e.preventDefault(); triggerPageChange('next'); }}
            onDragLeave={cancelPageChange}
          />
        </>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {visibleServices.map((service) => (
          <ServiceCard key={service.id} service={service} onReorder={onReorder} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentPage 
                    ? "bg-[#d4b896] w-6" 
                    : "bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <button
            onClick={toggleAutoRotation}
            className={`ml-4 p-2 rounded-lg border transition-all ${
              isAutoRotating 
                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                : "bg-white/5 border-white/10 text-muted-foreground"
            }`}
            title={isAutoRotating ? "Pausar rotacao" : "Iniciar rotacao"}
          >
            {isAutoRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  )
}
