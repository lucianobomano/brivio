"use client"

import * as React from "react"
import { Filter, List, ChevronLeft, ChevronRight } from "lucide-react"
import { BrandCard } from "@/components/brands/BrandCard"
import { CreateBrandCard } from "@/components/brands/CreateBrandCard"
import { motion, AnimatePresence } from "framer-motion"

interface Brand {
    id: string
    name: string
    slug: string
    updated_at: string
    primary_color?: string | null
    brandbooks?: { id: string, status: string }[]
}

interface BrandsClientProps {
    brandsList: Brand[]
    user: any
}

export function BrandsClient({ brandsList, user }: BrandsClientProps) {
    const [searchTerm, setSearchTerm] = React.useState("")
    const [currentPage, setCurrentPage] = React.useState(1)
    const itemsPerPage = 3

    // Filter brands based on search term
    const filteredBrands = React.useMemo(() => {
        return brandsList.filter(brand =>
            brand.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [brandsList, searchTerm])

    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(filteredBrands.length / itemsPerPage))

    // Adjust page if search reduces the number of pages
    React.useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [totalPages, currentPage])

    // Get slice of brands for current page
    const displayedBrands = React.useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage
        return filteredBrands.slice(startIndex, startIndex + itemsPerPage)
    }, [filteredBrands, currentPage, itemsPerPage])

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
        }
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1)
        }
    }

    // Generate page numbers to display
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

    return (
        <div className="w-full">
            {/* Search & Filters */}
            <div className="py-8 flex justify-center px-[40px]">
                <div className="w-full max-w-[1600px]">
                    <div className="flex items-center justify-end gap-6">
                        <div className="relative w-full max-w-md">
                            <input
                                type="search"
                                placeholder="Pesquisar"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setCurrentPage(1)
                                }}
                                className="w-full bg-transparent border-b border-gray-700 px-4 py-2 text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500 transition-colors"
                            />
                        </div>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                            <Filter className="w-4 h-4" />
                            <span>Filtrar por</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                            <List className="w-4 h-4" />
                            <span>Lista</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards Grid - Single Row (max 4 cards total: 1 create brand + 3 brand cards) */}
            <div className="pb-8 flex justify-center px-[40px]">
                <div className="w-full max-w-[1600px]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[12px] max-w-[1532px] mx-auto justify-items-center sm:justify-items-start">
                        {/* Create New Card (Always Visible, static position) */}
                        <div className="flex justify-center sm:justify-start w-[374px]">
                            <CreateBrandCard
                                userName={user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0]}
                                brandsCount={brandsList.length}
                            />
                        </div>

                        {/* Brand Cards (Max 3 on current page, animating in place) */}
                        <div className="col-span-1 sm:col-span-1 lg:col-span-2 xl:col-span-3 w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPage}
                                    initial={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, scale: 0.97, filter: "blur(4px)" }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                    className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-[12px] w-full"
                                >
                                    {displayedBrands.map((brand) => (
                                        <div key={brand.id} className="flex justify-center sm:justify-start w-[374px]">
                                            <BrandCard brand={brand} />
                                        </div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex justify-center items-center gap-4 px-[40px]">
                    <div className="flex items-center gap-2 bg-white/5 dark:bg-[#16171C]/50 border border-white/10 px-4 py-2.5 rounded-full shadow-lg backdrop-blur-md">
                        {/* Prev Button */}
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Página anterior"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1.5 px-2">
                            {pageNumbers.map((pageNum) => {
                                const isSelected = pageNum === currentPage
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                                            isSelected
                                                ? "bg-[#FF0054] text-white shadow-md shadow-[#FF0054]/20 scale-105"
                                                : "text-gray-400 hover:text-white hover:bg-white/5"
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-gray-400 transition-all cursor-pointer disabled:cursor-not-allowed"
                            aria-label="Próxima página"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
