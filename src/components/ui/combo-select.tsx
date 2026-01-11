"use client"

import * as React from "react"
import { Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface Option {
    label: string
    value: string
}

interface ComboSelectProps {
    options: Option[]
    value?: string
    onValueChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    className?: string
    emptyText?: string
}

export function ComboSelect({
    options,
    value,
    onValueChange,
    placeholder = "Select an option...",
    searchPlaceholder = "Search...",
    className,
    emptyText = "No results found."
}: ComboSelectProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")
    const containerRef = React.useRef<HTMLDivElement>(null)

    const selectedOption = options.find((option) => option.value === value)

    // Filter options based on search term
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleSelect = (optionValue: string) => {
        onValueChange(optionValue)
        setOpen(false)
        setSearchTerm("")
    }

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    type="text"
                    placeholder={selectedOption ? selectedOption.label : searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "pl-10 bg-white/5 border-white/10 text-white h-10",
                        selectedOption && !searchTerm && "text-white"
                    )}
                />
            </div>

            {/* Selected Value Display */}
            {selectedOption && !open && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-white pointer-events-none text-sm">
                    {selectedOption.label}
                </div>
            )}

            {/* Dropdown List */}
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-white/10 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-400">{emptyText}</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-white/10 transition-colors",
                                    value === option.value ? "bg-white/10 text-white" : "text-gray-300"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        value === option.value ? "opacity-100 text-blue-400" : "opacity-0"
                                    )}
                                />
                                {option.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
