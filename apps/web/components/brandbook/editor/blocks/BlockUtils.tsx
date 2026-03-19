import React from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

// Reuse existing simple blocks
interface AutoResizeTextareaProps {
    value: string
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    placeholder?: string
    className?: string
    style?: React.CSSProperties
    readOnly?: boolean
    onFocus?: () => void
    onBlur?: () => void
    fixedHeight?: string | number
}

export const AutoResizeTextarea = ({ value, onChange, placeholder, className, style, readOnly, onFocus, onBlur, fixedHeight }: AutoResizeTextareaProps) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (textareaRef.current && !fixedHeight) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        }
    }, [value, style, fixedHeight])

    // If fixedHeight is provided, use it; otherwise auto-resize
    const computedStyle = {
        ...style,
        resize: 'none' as const,
        overflow: fixedHeight ? 'auto' : 'hidden',
        height: fixedHeight || undefined,
    }

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            readOnly={readOnly}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className={cn(className, "scrollbar-hide")}
            style={computedStyle}
            rows={1}
        />
    )
}

export const ResizableWrapper = ({
    children,
    width,
    height,
    onWidthChange,
    onHeightChange,
    isFocused,
    isReadOnly,
    className,
    align = 'center' // Default to center for safety
}: {
    children: React.ReactNode,
    width?: string | number,
    height?: string | number,
    onWidthChange: (width: string) => void,
    onHeightChange?: (height: string) => void,
    isFocused: boolean,
    isReadOnly?: boolean,
    className?: string,
    align?: 'left' | 'center' | 'right'
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = React.useState<'left' | 'right' | 'top' | 'bottom' | null>(null);

    // Horizontal resize handler
    const handlePointerDownHorizontal = (e: React.PointerEvent, side: 'left' | 'right') => {
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(side);

        const startX = e.pageX;
        const startWidth = containerRef.current?.offsetWidth || 0;
        const parentElement = containerRef.current?.parentElement;
        const maxWidth = parentElement?.offsetWidth || 1200;

        const handlePointerMove = (mmE: PointerEvent) => {
            const delta = mmE.pageX - startX;
            // For centered elements, we need double delta because it grows on both sides
            const multiplier = align === 'center' ? 2 : 1;
            let newWidth = side === 'right' ? startWidth + delta * multiplier : startWidth - delta * multiplier;

            // Constraints
            newWidth = Math.max(200, Math.min(newWidth, maxWidth));

            if (containerRef.current) {
                containerRef.current.style.width = `${newWidth}px`;
                containerRef.current.style.transition = 'none';
            }
        };

        const handlePointerUp = () => {
            setIsResizing(null);
            if (containerRef.current) {
                const finalWidth = containerRef.current.style.width;
                containerRef.current.style.transition = '';
                if (finalWidth) onWidthChange(finalWidth);
            }
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    // Vertical resize handler
    const handlePointerDownVertical = (e: React.PointerEvent, side: 'top' | 'bottom') => {
        if (isReadOnly || !onHeightChange) return;
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(side);

        const startY = e.pageY;
        const startHeight = containerRef.current?.offsetHeight || 0;

        const handlePointerMove = (mmE: PointerEvent) => {
            const delta = mmE.pageY - startY;
            let newHeight = side === 'bottom' ? startHeight + delta : startHeight - delta;

            // Constraints - minimum 40px, maximum 1200px
            newHeight = Math.max(40, Math.min(newHeight, 1200));

            if (containerRef.current) {
                containerRef.current.style.minHeight = `${newHeight}px`;
                containerRef.current.style.transition = 'none';
            }
        };

        const handlePointerUp = () => {
            setIsResizing(null);
            if (containerRef.current) {
                const finalHeight = containerRef.current.style.minHeight;
                containerRef.current.style.transition = '';
                if (finalHeight && onHeightChange) onHeightChange(finalHeight);
            }
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: width || '100%',
                minHeight: height || 'auto',
                position: 'relative'
            }}
            className={cn(
                "transition-[width,min-height] duration-200 ease-out max-w-full",
                isResizing && "transition-none",
                className
            )}
        >
            {children}
            {isFocused && !isReadOnly && (
                <>
                    {/* Right Handle */}
                    <div
                        onPointerDown={(e) => handlePointerDownHorizontal(e, 'right')}
                        className={cn(
                            "absolute top-0 right-[-10px] w-[20px] h-full cursor-ew-resize z-[110] flex items-center justify-center group/handle"
                        )}
                    >
                        <div className={cn(
                            "w-[6px] h-32 max-h-[80%] rounded-full transition-all bg-[#ff0054]",
                            isResizing === 'right' ? "scale-x-125 shadow-lg" : "scale-x-100 opacity-0 group-hover/handle:opacity-100"
                        )} />
                    </div>
                    {/* Left Handle */}
                    <div
                        onPointerDown={(e) => handlePointerDownHorizontal(e, 'left')}
                        className={cn(
                            "absolute top-0 left-[-10px] w-[20px] h-full cursor-ew-resize z-[110] flex items-center justify-center group/handle"
                        )}
                    >
                        <div className={cn(
                            "w-[6px] h-32 max-h-[80%] rounded-full transition-all bg-[#ff0054]",
                            isResizing === 'left' ? "scale-x-125 shadow-lg" : "scale-x-100 opacity-0 group-hover/handle:opacity-100"
                        )} />
                    </div>
                    {/* Bottom Handle */}
                    {onHeightChange && (
                        <div
                            onPointerDown={(e) => handlePointerDownVertical(e, 'bottom')}
                            className={cn(
                                "absolute bottom-[-10px] left-0 h-[20px] w-full cursor-ns-resize z-[110] flex items-center justify-center group/handle"
                            )}
                        >
                            <div className={cn(
                                "w-32 max-w-[80%] h-[6px] rounded-full transition-all bg-[#ff0054]",
                                isResizing === 'bottom' ? "scale-y-125 shadow-lg" : "scale-y-100 opacity-0 group-hover/handle:opacity-100"
                            )} />
                        </div>
                    )}
                    {/* Top Handle */}
                    {onHeightChange && (
                        <div
                            onPointerDown={(e) => handlePointerDownVertical(e, 'top')}
                            className={cn(
                                "absolute top-[-10px] left-0 h-[20px] w-full cursor-ns-resize z-[110] flex items-center justify-center group/handle"
                            )}
                        >
                            <div className={cn(
                                "w-32 max-w-[80%] h-[6px] rounded-full transition-all bg-[#ff0054]",
                                isResizing === 'top' ? "scale-y-125 shadow-lg" : "scale-y-100 opacity-0 group-hover/handle:opacity-100"
                            )} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// Helper to detect current text transform state
export const detectTransform = (text: string) => {
    if (!text) return null
    if (text === text.toUpperCase() && text !== text.toLowerCase()) return 'uppercase'
    if (text === text.toLowerCase() && text !== text.toUpperCase()) return 'lowercase'
    // Sentence case: First char upper, rest lower (ignoring symbols)
    if (text.length > 0 && text[0] === text[0].toUpperCase() && text.slice(1) === text.slice(1).toLowerCase()) return 'sentence'
    // Capitalize: Simple check if all words start with upper (simplified) - matching the transform regex logic is safer
    // The transform logic: text.replace(/\b\w/g, (c: string) => c.toUpperCase())
    const capitalized = text.replace(/\b\w/g, (c: string) => c.toUpperCase())
    if (text === capitalized && text !== text.toUpperCase()) return 'capitalize'
    return null
}


interface TextBlockStyle {
    fontStyle?: string
    textDecoration?: string
    display?: string
    listStyleType?: string
    listStylePosition?: string
    marginLeft?: string
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    color?: string
    minHeight?: string
    borderTop?: string
    borderRight?: string
    borderBottom?: string
    borderLeft?: string
    fontSize?: string
    fontWeight?: string | number
    lineHeight?: string
    backgroundColor?: string
    width?: string | number
    height?: string | number
}

export const detectBackgroundColor = (style: TextBlockStyle | undefined) => style?.backgroundColor || ''

export const detectFormats = (style: TextBlockStyle | undefined) => {
    const formats: string[] = []
    if (style?.fontStyle === 'italic') formats.push('italic')
    if (style?.textDecoration?.includes('underline')) formats.push('underline')
    if (style?.textDecoration?.includes('line-through')) formats.push('strikethrough')
    return formats
}

export const detectListFormat = (style: TextBlockStyle | undefined) => {
    if (style?.display === 'list-item') {
        return style.listStyleType === 'decimal' ? 'decimal' : 'disc'
    }
    return null
}

export const detectAlign = (style: TextBlockStyle | undefined) => {
    return style?.textAlign || 'left'
}

export const detectColor = (style: TextBlockStyle | undefined) => style?.color || '#ffffff'

export const detectHeight = (style: TextBlockStyle | undefined) => {
    // Map minHeight to options (1, 3, 5, 8, 100)
    const h = style?.minHeight
    if (!h || h === 'auto') return 1
    const px = parseInt(h)
    if (px >= 400) return 100
    if (px >= 160) return 8
    if (px >= 80) return 5
    if (px >= 40) return 3
    return 1
}

export const detectOutline = (style: TextBlockStyle | undefined) => {
    return {
        top: !!style?.borderTop,
        right: !!style?.borderRight,
        bottom: !!style?.borderBottom,
        left: !!style?.borderLeft
    }
}

export const detectFontSize = (style: TextBlockStyle | undefined) => style?.fontSize || '16px'

export const detectWeight = (style: TextBlockStyle | undefined, fallback: string = '400') => {
    const rawW = style?.fontWeight
    if (!rawW) return fallback
    return String(rawW)
}

export const detectLineHeight = (style: TextBlockStyle | undefined, fallback: string = '1.1') => {
    return style?.lineHeight || fallback
}
