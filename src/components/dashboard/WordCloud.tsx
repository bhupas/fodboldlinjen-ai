"use client";

import { useEffect, useRef, useMemo } from 'react';

interface WordCloudProps {
    text: string;
    width?: number;
    height?: number;
    className?: string;
}

// Danish stop words to exclude
const STOP_WORDS = new Set([
    'i', 'og', 'at', 'er', 'på', 'med', 'for', 'det', 'som', 'en', 'af',
    'til', 'har', 'jeg', 'vi', 'de', 'den', 'der', 'kan', 'vil', 'skal',
    'være', 'blev', 'blive', 'været', 'var', 'min', 'mit', 'mine',
    'mere', 'når', 'hvor', 'hvordan', 'hvilken', 'hvis', 'have',
    'et', 'så', 'om', 'eller', 'men', 'ikke', 'sig', 'fra', 'ud',
    'op', 'ned', 'ind', 'hen', 'over', 'under', 'ved', 'efter', 'før',
    'sin', 'sit', 'sine', 'hans', 'hendes', 'deres', 'vores', 'man',
    'nu', 'da', 'også', 'kun', 'selv', 'noget', 'alle', 'andre',
    'mig', 'dig', 'ham', 'hende', 'os', 'dem', 'hvad', 'hvem',
    'a', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must',
    'of', 'in', 'to', 'for', 'with', 'on', 'at', 'by', 'from',
    'this', 'that', 'these', 'those', 'it', 'its'
]);

// Color palette for words
const COLORS = [
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#6366F1', // indigo
];

export function WordCloud({ text, width = 600, height = 300, className = '' }: WordCloudProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const wordFrequencies = useMemo(() => {
        if (!text) return [];

        // Tokenize and count words
        const words = text
            .toLowerCase()
            .replace(/[^\wæøåÆØÅ\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2 && !STOP_WORDS.has(word));

        const freq: Record<string, number> = {};
        words.forEach(word => {
            freq[word] = (freq[word] || 0) + 1;
        });

        // Sort by frequency and take top 50
        return Object.entries(freq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 50)
            .map(([word, count]) => ({ word, count }));
    }, [text]);

    useEffect(() => {
        if (!canvasRef.current || wordFrequencies.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        canvas.width = width * 2; // Higher res
        canvas.height = height * 2;
        ctx.scale(2, 2);

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate font sizes
        const maxCount = Math.max(...wordFrequencies.map(w => w.count));
        const minCount = Math.min(...wordFrequencies.map(w => w.count));
        const minFontSize = 12;
        const maxFontSize = 48;

        // Simple spiral placement algorithm
        const placedWords: { x: number; y: number; width: number; height: number }[] = [];

        const checkCollision = (x: number, y: number, w: number, h: number) => {
            for (const placed of placedWords) {
                if (!(x + w < placed.x || x > placed.x + placed.width ||
                    y + h < placed.y || y > placed.y + placed.height)) {
                    return true;
                }
            }
            return false;
        };

        wordFrequencies.forEach((item, index) => {
            const normalizedCount = maxCount === minCount ? 1 :
                (item.count - minCount) / (maxCount - minCount);
            const fontSize = minFontSize + normalizedCount * (maxFontSize - minFontSize);

            ctx.font = `${Math.round(fontSize)}px Inter, system-ui, sans-serif`;
            const metrics = ctx.measureText(item.word);
            const wordWidth = metrics.width;
            const wordHeight = fontSize;

            // Spiral placement
            let placed = false;
            let angle = 0;
            let radius = 0;
            const centerX = width / 2;
            const centerY = height / 2;

            while (!placed && radius < Math.max(width, height)) {
                const x = centerX + radius * Math.cos(angle) - wordWidth / 2;
                const y = centerY + radius * Math.sin(angle) + wordHeight / 4;

                // Check bounds
                if (x >= 5 && x + wordWidth <= width - 5 &&
                    y - wordHeight >= 5 && y <= height - 5) {
                    if (!checkCollision(x, y - wordHeight, wordWidth, wordHeight)) {
                        // Draw word
                        ctx.fillStyle = COLORS[index % COLORS.length];
                        ctx.fillText(item.word, x, y);

                        placedWords.push({
                            x,
                            y: y - wordHeight,
                            width: wordWidth,
                            height: wordHeight
                        });
                        placed = true;
                    }
                }

                angle += 0.5;
                radius += angle > Math.PI * 2 ? 5 : 0;
                if (angle > Math.PI * 2) angle = 0;
            }
        });

    }, [wordFrequencies, width, height]);

    if (wordFrequencies.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-muted/30 rounded-xl ${className}`}
                style={{ width, height }}>
                <p className="text-muted-foreground text-sm">No words to display</p>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={className}
            style={{ width, height }}
        />
    );
}

export default WordCloud;
