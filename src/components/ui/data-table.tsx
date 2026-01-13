"use client";

import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./table";
import { Card } from "./card";
import { Button } from "./button";
import { Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
    key: string;
    direction: SortDirection;
}

export interface PaginationConfig {
    page: number;
    pageSize: number;
    totalItems: number;
}

// =============================================================================
// DATA TABLE WITH ADVANCED FEATURES
// =============================================================================

interface DataTableProps {
    children: React.ReactNode;
    className?: string;
    maxHeight?: string;
}

export function DataTable({ children, className, maxHeight = "600px" }: DataTableProps) {
    return (
        <Card className={cn("glass-card overflow-hidden", className)}>
            <div className="overflow-auto" style={{ maxHeight }} suppressHydrationWarning>
                <Table suppressHydrationWarning>
                    {children}
                </Table>
            </div>
        </Card>
    );
}

// =============================================================================
// STICKY HEADER
// =============================================================================

interface DataTableHeaderProps {
    children: React.ReactNode;
    className?: string;
    sticky?: boolean;
}

export function DataTableHeader({ children, className, sticky = true }: DataTableHeaderProps) {
    return (
        <TableHeader className={cn(
            "bg-muted/80 backdrop-blur-sm",
            sticky && "sticky top-0 z-10",
            className
        )}>
            <TableRow className="border-border hover:bg-transparent">
                {children}
            </TableRow>
        </TableHeader>
    );
}

// =============================================================================
// SORTABLE HEAD
// =============================================================================

interface DataTableHeadProps extends React.ComponentProps<typeof TableHead> {
    sortKey?: string;
    sortConfig?: SortConfig;
    onSort?: (key: string) => void;
    sortable?: boolean;
}

export function DataTableHead({
    children,
    className,
    sortKey,
    sortConfig,
    onSort,
    sortable = false,
    ...props
}: DataTableHeadProps) {
    const isSorted = sortConfig?.key === sortKey;
    const sortDirection = isSorted ? sortConfig?.direction : null;

    const handleClick = () => {
        if (sortable && sortKey && onSort) {
            onSort(sortKey);
        }
    };

    return (
        <TableHead
            className={cn(
                "text-muted-foreground font-semibold whitespace-nowrap",
                sortable && "cursor-pointer select-none hover:text-foreground hover:bg-muted/50 transition-colors",
                isSorted && "text-primary",
                className
            )}
            onClick={handleClick}
            {...props}
        >
            <div className="flex items-center gap-1">
                {children}
                {sortable && (
                    <span className="ml-1">
                        {sortDirection === 'asc' ? (
                            <ChevronUp size={14} className="text-primary" />
                        ) : sortDirection === 'desc' ? (
                            <ChevronDown size={14} className="text-primary" />
                        ) : (
                            <ChevronsUpDown size={14} className="opacity-30" />
                        )}
                    </span>
                )}
            </div>
        </TableHead>
    );
}

// =============================================================================
// BODY
// =============================================================================

interface DataTableBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
    return (
        <TableBody className={className} suppressHydrationWarning>
            {children}
        </TableBody>
    );
}

// =============================================================================
// ROW
// =============================================================================

interface DataTableRowProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export function DataTableRow({ children, onClick, className }: DataTableRowProps) {
    return (
        <TableRow
            className={cn(
                "border-border hover:bg-accent/50 transition-colors",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}
        >
            {children}
        </TableRow>
    );
}

// =============================================================================
// CELL
// =============================================================================

export function DataTableCell({ children, className, ...props }: React.ComponentProps<typeof TableCell>) {
    return (
        <TableCell className={cn("text-foreground", className)} {...props}>
            {children}
        </TableCell>
    );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

interface DataTableEmptyProps {
    colSpan: number;
    message?: string;
    icon?: React.ReactNode;
}

export function DataTableEmpty({ colSpan, message = "No data found.", icon }: DataTableEmptyProps) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-32 text-center text-muted-foreground">
                <div className="flex flex-col items-center justify-center">
                    {icon || <Search size={32} className="mb-2 opacity-50" />}
                    <p>{message}</p>
                </div>
            </TableCell>
        </TableRow>
    );
}

// =============================================================================
// LOADING STATE
// =============================================================================

interface DataTableLoadingProps {
    colSpan: number;
    message?: string;
}

export function DataTableLoading({ colSpan, message = "Loading..." }: DataTableLoadingProps) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="text-center py-12">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    {message}
                </div>
            </TableCell>
        </TableRow>
    );
}

// =============================================================================
// PAGINATION
// =============================================================================

interface DataTablePaginationProps {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export function DataTablePagination({
    currentPage,
    totalPages,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [25, 50, 100]
}: DataTablePaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border bg-muted/30">
            <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
                <span className="font-medium text-foreground">{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{totalItems}</span> results
            </div>

            <div className="flex items-center gap-2">
                {/* Page size selector */}
                {onPageSizeChange && (
                    <div className="flex items-center gap-2 mr-4">
                        <span className="text-sm text-muted-foreground">Rows:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="h-8 px-2 rounded-lg bg-muted border border-border text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Page navigation */}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                        title="First page"
                    >
                        <ChevronLeft size={14} />
                        <ChevronLeft size={14} className="-ml-2" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 w-8 p-0"
                        title="Previous page"
                    >
                        <ChevronLeft size={16} />
                    </Button>

                    <div className="flex items-center gap-1 px-2">
                        <span className="text-sm font-medium">{currentPage}</span>
                        <span className="text-sm text-muted-foreground">/</span>
                        <span className="text-sm text-muted-foreground">{totalPages || 1}</span>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="h-8 w-8 p-0"
                        title="Next page"
                    >
                        <ChevronRight size={16} />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage >= totalPages}
                        className="h-8 w-8 p-0"
                        title="Last page"
                    >
                        <ChevronRight size={14} />
                        <ChevronRight size={14} className="-ml-2" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// =============================================================================
// HOOKS
// =============================================================================

export function useSorting(defaultKey?: string, defaultDirection: SortDirection = null) {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: defaultKey || '',
        direction: defaultDirection
    });

    const handleSort = useCallback((key: string) => {
        setSortConfig(prev => {
            if (prev.key !== key) {
                return { key, direction: 'asc' };
            }
            if (prev.direction === 'asc') {
                return { key, direction: 'desc' };
            }
            if (prev.direction === 'desc') {
                return { key: '', direction: null };
            }
            return { key, direction: 'asc' };
        });
    }, []);

    const sortData = useCallback(<T extends Record<string, any>>(data: T[]): T[] => {
        if (!sortConfig.key || !sortConfig.direction) return data;

        return [...data].sort((a, b) => {
            const aVal = a[sortConfig.key];
            const bVal = b[sortConfig.key];

            // Handle null/undefined
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;

            // Numeric comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
            }

            // String comparison
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();

            if (sortConfig.direction === 'asc') {
                return aStr.localeCompare(bStr);
            }
            return bStr.localeCompare(aStr);
        });
    }, [sortConfig]);

    return { sortConfig, handleSort, sortData };
}

export function usePagination(totalItems: number, defaultPageSize: number = 50) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(defaultPageSize);

    const totalPages = Math.ceil(totalItems / pageSize);

    const handlePageChange = useCallback((newPage: number) => {
        setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
    }, [totalPages]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        setPageSize(newSize);
        setPage(1); // Reset to first page when changing page size
    }, []);

    const paginateData = useCallback(<T,>(data: T[]): T[] => {
        const start = (page - 1) * pageSize;
        return data.slice(start, start + pageSize);
    }, [page, pageSize]);

    // Reset page if it exceeds total pages
    useMemo(() => {
        if (page > totalPages && totalPages > 0) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    return {
        page,
        pageSize,
        totalPages,
        handlePageChange,
        handlePageSizeChange,
        paginateData
    };
}
