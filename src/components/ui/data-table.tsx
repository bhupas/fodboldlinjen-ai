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
import { Search } from "lucide-react";

interface DataTableProps {
    children: React.ReactNode;
    className?: string;
}

export function DataTable({ children, className }: DataTableProps) {
    return (
        <Card className={cn("glass-card overflow-hidden", className)}>
            <Table>
                {children}
            </Table>
        </Card>
    );
}

interface DataTableHeaderProps {
    children: React.ReactNode;
    className?: string;
}

export function DataTableHeader({ children, className }: DataTableHeaderProps) {
    return (
        <TableHeader className={cn("bg-muted/50", className)}>
            <TableRow className="border-border hover:bg-transparent">
                {children}
            </TableRow>
        </TableHeader>
    );
}

export function DataTableHead({ children, className, ...props }: React.ComponentProps<typeof TableHead>) {
    return (
        <TableHead className={cn("text-muted-foreground font-semibold", className)} {...props}>
            {children}
        </TableHead>
    );
}

interface DataTableBodyProps {
    children: React.ReactNode;
    className?: string;
}

export function DataTableBody({ children, className }: DataTableBodyProps) {
    return (
        <TableBody className={className}>
            {children}
        </TableBody>
    );
}

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

export function DataTableCell({ children, className, ...props }: React.ComponentProps<typeof TableCell>) {
    return (
        <TableCell className={cn("text-foreground", className)} {...props}>
            {children}
        </TableCell>
    );
}

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
