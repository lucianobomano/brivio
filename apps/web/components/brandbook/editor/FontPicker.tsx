import React, { useState, useEffect } from "react"
import { ChevronDown, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

const GOOGLE_FONTS = [
    "Minion Variable Concept",
    "Inter",
    "Montserrat",
    "Poppins",
    "Roboto",
    "Open Sans",
    "Lato",
    "Urbanist",
    "Outfit",
    "Plus Jakarta Sans",
    "Satoshi",
    "Brandon Grotesque",
    "Figtree",
    "Manrope",
    "Syne",
    "Space Grotesk",
    "Public Sans",
    "Playfair Display",
    "Lora",
    "Merriweather",
    "Libre Baskerville",
    "PT Serif",
    "Crimson Text",
    "Josefin Sans",
    "Josefin Slab",
    "Arvo",
    "Oswald",
    "Rubik",
    "Raleway",
    "Nunito",
    "Archivo Black",
    "Staatliches",
    "Bebas Neue",
    "Righteous",
    "Ultra",
    "Fira Code",
    "Source Code Pro",
    "Space Mono",
    "Quicksand",
    "Kanit",
    "Heebo",
    "Work Sans",
    "Dosis",
    "Ubuntu",
    "Source Sans Pro"
]

interface FontPickerProps {
    currentFont?: string
    onFontChange: (font: string) => void
    children: React.ReactNode
}

export const FontPicker = ({ currentFont = 'Inter', onFontChange, children }: FontPickerProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedFont, setSelectedFont] = useState(currentFont)

    // Load font when selected
    useEffect(() => {
        if (selectedFont && selectedFont !== "Minion Variable Concept") {
            const linkId = `font-${selectedFont}`
            if (!document.getElementById(linkId)) {
                const link = document.createElement('link')
                link.id = linkId
                link.rel = 'stylesheet'
                link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.replace(/ /g, '+')}:wght@100;200;300;400;500;700;800;900&display=swap`
                document.head.appendChild(link)
            }
        }
    }, [selectedFont])

    const handleSelect = (font: string) => {
        setSelectedFont(font)
        onFontChange(font)
        setIsOpen(false)
    }

    return (
        <Popover>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side="bottom"
                align="center"
                className="p-0 border-none w-[280px] bg-transparent shadow-xl z-[60]"
                sideOffset={10}
            >
                <div className="flex flex-col border border-[#333] rounded-lg bg-[#15161B]">
                    {/* Header */}
                    <div className="bg-[#FF0054] px-4 py-3 flex items-center justify-between rounded-t-lg">
                        <span className="text-white font-medium text-sm">Escolher font</span>
                        <Circle className="w-3 h-3 text-[#15161B] fill-[#15161B]" />
                    </div>

                    {/* Body */}
                    <div className="bg-[#15161B] p-4 rounded-b-lg">
                        <div className="relative">
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="w-full h-10 px-3 bg-[#15161B] border border-[#333] rounded-sm flex items-center justify-between text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
                            >
                                <span style={{ fontFamily: selectedFont }}>{selectedFont}</span>
                                <ChevronDown className="w-4 h-4 ml-2" />
                            </button>

                            {/* Custom Dropdown List */}
                            {isOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 max-h-[200px] overflow-y-auto bg-[#1A1B21] border border-[#333] rounded-sm z-[70] shadow-md">
                                    {GOOGLE_FONTS.map((font) => (
                                        <button
                                            key={font}
                                            onClick={() => handleSelect(font)}
                                            className="w-full text-left px-3 py-2 text-gray-300 hover:bg-[#2A2B35] hover:text-white transition-colors"
                                            style={{ fontFamily: font }}
                                        >
                                            {font}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
