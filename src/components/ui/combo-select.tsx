"use client"

import * as React from "react"
import { Check, Search, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder={selectedOption ? selectedOption.label : searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => setOpen(true)}
                    className={cn(
                        "w-full h-10 pl-10 pr-10 rounded-lg text-sm transition-colors",
                        "bg-background border border-border",
                        "text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                    )}
                />
                <ChevronDown className={cn(
                    "absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-transform",
                    open && "rotate-180"
                )} />
            </div>

            {/* Selected Value Display */}
            {selectedOption && !open && !searchTerm && (
                <div className="absolute left-10 top-1/2 -translate-y-1/2 text-foreground pointer-events-none text-sm">
                    {selectedOption.label}
                </div>
            )}

            {/* Dropdown List */}
            {open && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</div>
                    ) : (
                        filteredOptions.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "flex items-center px-3 py-2 text-sm cursor-pointer transition-colors",
                                    "hover:bg-accent",
                                    value === option.value ? "bg-accent text-foreground" : "text-foreground"
                                )}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4 text-primary",
                                        value === option.value ? "opacity-100" : "opacity-0"
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
