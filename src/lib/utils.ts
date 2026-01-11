import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const cleanText = (text: any): string => {
    if (typeof text !== 'string') return String(text);
    return text.toLowerCase().trim().replace(/\s+/g, ' ');
};
