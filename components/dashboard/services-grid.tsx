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

  // Rotação automática
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
      {/* Zonas de detecção invisíveis para drag */}
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
        <div className="flex items-center justify-center gap-6 mt-8 mb-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-20 transition-all"
            title="Página anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <span className="text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10">
            Página {currentPage + 1} de {totalPages}
          </span>

          <button
            onClick={toggleAutoRotation}
            className={`p-2 rounded-lg transition-all ${
              isAutoRotating 
                ? "glass hover:bg-white/10" 
                : "glass hover:bg-white/10 opacity-50"
            }`}
            title={isAutoRotating ? "Pausar rotação automática" : "Iniciar rotação automática"}
          >
            {isAutoRotating ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-20 transition-all"
            title="Próxima página"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
