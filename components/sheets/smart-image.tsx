import React from 'react';
import { Check, X, Minus } from 'lucide-react';

export interface SmartImageItem {
    id: string;
    x: number;
    y: number;
    type: 'circle' | 'correct' | 'incorrect' | 'neutral' | 'cross' | 'text';
    color?: string; // for circle/cross, default green
    lineWidth?: number;
    r?: number;
    text?: string;
    fontSize?: number | string;
}

interface SmartImageProps {
    src: string;
    width: number;
    height: number;
    items: SmartImageItem[];
    alignment?: 'center' | 'left' | 'right';
    children?: React.ReactNode;
}

export function SmartImage({ src, width, height, items, alignment = 'center', children }: SmartImageProps) {
    const layoutClass = {
        center: 'justify-center items-center',
        left: 'justify-start items-start',
        right: 'justify-end items-start',
    }[alignment];

    return (
        <div className={`relative w-full h-full flex ${layoutClass} bg-slate-100 overflow-hidden`}>
            <div className="relative" style={{ aspectRatio: `${width}/${height}`, height: '100%', maxHeight: '100%' }}>
                {/* 1. The Cropped Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="OMR Crop" className="w-full h-full object-contain" />

                {/* 2. The Interactive Overlay */}
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                >
                    {items.map((item) => {
                        if (item.type === 'circle') {
                            return (
                                <circle
                                    key={item.id}
                                    cx={item.x}
                                    cy={item.y}
                                    r={item.r || 14} // bubble radius 14 default
                                    fill={item.color || "rgba(0, 255, 0, 0.4)"}
                                    stroke={item.color ? item.color.replace('0.4', '1') : "green"}
                                    strokeWidth={item.lineWidth || "3"}
                                />
                            );
                        }

                        if (item.type === 'cross') {
                            const size = item.r || 14;
                            return (
                                <g key={item.id} stroke={item.color || "red"} strokeWidth={item.lineWidth || "3"}>
                                    <line x1={item.x - size} y1={item.y - size} x2={item.x + size} y2={item.y + size} />
                                    <line x1={item.x + size} y1={item.y - size} x2={item.x - size} y2={item.y + size} />
                                </g>
                            );
                        }

                        if (item.type === 'text' && item.text) {
                            return (
                                <text
                                    key={item.id}
                                    x={item.x}
                                    y={item.y}
                                    fill={item.color || "blue"}
                                    fontSize={item.fontSize || "1.5rem"} // approximate h4
                                    fontWeight="bold"
                                    dominantBaseline="middle"
                                >
                                    {item.text}
                                </text>
                            );
                        }

                        // For icons, we render them inside a foreignObject or just use SVG paths.
                        // Using foreignObject to use Lucide icons easily.
                        // Centering the icon: x, y is the center. Icon size ~24px.
                        // x - 12, y - 12
                        return (
                            <foreignObject
                                key={item.id}
                                x={item.x - 12}
                                y={item.y - 12}
                                width="24"
                                height="24"
                            >
                                <div className="flex items-center justify-center w-full h-full drop-shadow-md">
                                    {item.type === 'correct' && (
                                        <div className="bg-white/80 rounded-full p-0.5">
                                            <Check
                                                className={`w-10 h-10 ${item.color ? '' : 'text-green-600'}`}
                                                style={item.color ? { color: item.color } : undefined}
                                                strokeWidth={4}
                                            />
                                        </div>
                                    )}
                                    {item.type === 'incorrect' && (
                                        <div className="bg-white/80 rounded-full p-0.5">
                                            <X className="w-5 h-5 text-red-600" strokeWidth={4} />
                                        </div>
                                    )}
                                    {item.type === 'neutral' && (
                                        <div className="w-5 h-5 rounded-full bg-blue-500/50 border-2 border-blue-600 shadow-sm" />
                                    )}
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>

                {/* 3. Children (e.g. Score Display) positioned relative to the image */}
                {children}
            </div>
        </div>
    );
}
