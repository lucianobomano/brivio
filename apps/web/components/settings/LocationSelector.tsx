"use client"

import * as React from "react"
import { Search, ChevronDown, MapPin, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { countries, getStatesByCountry, type Country, type State } from "@/lib/locations"

interface LocationSelectorProps {
    selectedCountry: string
    selectedState: string
    onCountryChange: (country: string, countryCode: string) => void
    onStateChange: (state: string, stateCode: string) => void
}

export function LocationSelector({
    selectedCountry,
    selectedState,
    onCountryChange,
    onStateChange
}: LocationSelectorProps) {
    const [countryOpen, setCountryOpen] = React.useState(false)
    const [stateOpen, setStateOpen] = React.useState(false)
    const [countrySearch, setCountrySearch] = React.useState("")
    const [stateSearch, setStateSearch] = React.useState("")

    const selectedCountryData = countries.find(c => c.name === selectedCountry)
    const states = selectedCountryData ? getStatesByCountry(selectedCountryData.code) : []

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase())
    )

    const filteredStates = states.filter(s =>
        s.name.toLowerCase().includes(stateSearch.toLowerCase())
    )

    const handleCountrySelect = (country: Country) => {
        onCountryChange(country.name, country.code)
        setCountryOpen(false)
        setCountrySearch("")
        // Reset state when country changes
        onStateChange("", "")
    }

    const handleStateSelect = (state: State) => {
        onStateChange(state.name, state.code)
        setStateOpen(false)
        setStateSearch("")
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            {/* Country Dropdown */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">País</label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                    <PopoverTrigger asChild>
                        <button
                            className={cn(
                                "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left",
                                "bg-bg-0 border-bg-3 hover:border-bg-2 focus:border-accent-indigo",
                                !selectedCountry && "text-text-tertiary"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-text-tertiary" />
                                <span className={cn(selectedCountry ? "text-text-primary" : "text-text-tertiary")}>
                                    {selectedCountry || "Selecione um país"}
                                </span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 transition-transform text-text-tertiary", countryOpen && "rotate-180")} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 bg-bg-1 border-bg-3 shadow-2xl" align="start">
                        <div className="p-2 border-b border-bg-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <Input
                                    placeholder="Pesquisar país..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="pl-9 bg-bg-0 border-bg-3 focus:border-accent-indigo h-9"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto p-1">
                            {filteredCountries.length === 0 ? (
                                <div className="px-3 py-6 text-center text-text-tertiary text-sm">
                                    Nenhum país encontrado
                                </div>
                            ) : (
                                filteredCountries.map((country) => (
                                    <button
                                        key={country.code}
                                        onClick={() => handleCountrySelect(country)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                            "hover:bg-bg-2 text-text-primary",
                                            selectedCountry === country.name && "bg-accent-indigo/10 text-accent-indigo"
                                        )}
                                    >
                                        <span>{country.name}</span>
                                        {selectedCountry === country.name && <Check className="w-4 h-4" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* State Dropdown */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Província / Estado</label>
                <Popover open={stateOpen} onOpenChange={setStateOpen}>
                    <PopoverTrigger asChild>
                        <button
                            disabled={!selectedCountry || states.length === 0}
                            className={cn(
                                "w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all text-left",
                                "bg-bg-0 border-bg-3 hover:border-bg-2 focus:border-accent-indigo",
                                (!selectedCountry || states.length === 0) && "opacity-50 cursor-not-allowed",
                                !selectedState && "text-text-tertiary"
                            )}
                        >
                            <span className={cn(selectedState ? "text-text-primary" : "text-text-tertiary")}>
                                {selectedState || (states.length === 0 ? "Nenhuma província" : "Selecione")}
                            </span>
                            <ChevronDown className={cn("w-4 h-4 transition-transform text-text-tertiary", stateOpen && "rotate-180")} />
                        </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[280px] p-0 bg-bg-1 border-bg-3 shadow-2xl" align="start">
                        <div className="p-2 border-b border-bg-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                                <Input
                                    placeholder="Pesquisar estado..."
                                    value={stateSearch}
                                    onChange={(e) => setStateSearch(e.target.value)}
                                    className="pl-9 bg-bg-0 border-bg-3 focus:border-accent-indigo h-9"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="max-h-[280px] overflow-y-auto p-1">
                            {filteredStates.length === 0 ? (
                                <div className="px-3 py-6 text-center text-text-tertiary text-sm">
                                    Nenhum estado encontrado
                                </div>
                            ) : (
                                filteredStates.map((state) => (
                                    <button
                                        key={state.code}
                                        onClick={() => handleStateSelect(state)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all",
                                            "hover:bg-bg-2 text-text-primary",
                                            selectedState === state.name && "bg-accent-indigo/10 text-accent-indigo"
                                        )}
                                    >
                                        <span>{state.name}</span>
                                        {selectedState === state.name && <Check className="w-4 h-4" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )
}
