"use client"

import { useState, useRef, useEffect } from "react"
import type { Service } from "./types"
import { ServiceCard } from "./service-card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ServicesGridProps {
  services: Service[]
  onReorder: (draggedId: string, targetId: string) => void
}

const SERVICES_PER_PAGE = 9

export function ServicesGrid({ services, onReorder }: ServicesGridProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isDraggingGlobal, setIsDraggingGlobal] = useState(false)

  const totalPages = Math.ceil(services.length / SERVICES_PER_PAGE)
  const startIndex = currentPage * SERVICES_PER_PAGE
  const visibleServices = services.slice(startIndex, startIndex + SERVICES_PER_PAGE)

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
    }, 600) // Reduzi para 0.6s para ser mais rápido
  }

  const cancelPageChange = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* Zonas de detecção TÉCNICAS (Invisíveis mas funcionais) */}
      {isDraggingGlobal && (
        <>
          <div 
            className="fixed left-0 top-0 bottom-0 w-[100px] z-[9999] bg-white/[0.01]"
            onDragOver={(e) => { e.preventDefault(); triggerPageChange('prev'); }}
            onDragLeave={cancelPageChange}
          />
          <div 
            className="fixed right-0 top-0 bottom-0 w-[100px] z-[9999] bg-white/[0.01]"
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
          <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-20">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <span className="text-sm font-bold bg-white/5 px-4 py-2 rounded-full border border-white/10">
            Página {currentPage + 1} de {totalPages}
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage === totalPages - 1} className="p-2 rounded-lg glass hover:bg-white/10 disabled:opacity-20">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  )
}
