"use client"

import { useState } from "react"
import type { Service } from "./types"
import { ServiceCard } from "./service-card"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ServicesGridProps {
  services: Service[]
}

const SERVICES_PER_PAGE = 9

export function ServicesGrid({ services }: ServicesGridProps) {
  const [currentPage, setCurrentPage] = useState(0)

  const totalPages = Math.ceil(services.length / SERVICES_PER_PAGE)
  const startIndex = currentPage * SERVICES_PER_PAGE
  const visibleServices = services.slice(startIndex, startIndex + SERVICES_PER_PAGE)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
        {visibleServices.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="p-1 rounded-lg glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="text-sm text-muted-foreground">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-1 rounded-lg glass hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  )
}
