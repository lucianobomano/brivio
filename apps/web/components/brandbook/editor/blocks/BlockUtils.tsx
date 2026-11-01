import React, { useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useBrandDesign } from "../BrandDesignContext"

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
        maxWidth: '100%',
        resize: 'none' as const,
        overflow: fixedHeight ? 'auto' : 'hidden',
        height: fixedHeight || undefined,
        minHeight: fixedHeight || undefined,
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
    align: alignProp,
    hug = false,
    responsiveDevice
}: {
    children: React.ReactNode,
    width?: string | number,
    height?: string | number,
    onWidthChange: (width: string) => void,
    onHeightChange?: (height: string) => void,
    isFocused: boolean,
    isReadOnly?: boolean,
    className?: string,
    /** Where the box sits in its column (not the text alignment inside it) */
    align?: 'left' | 'center' | 'right'
    /** Box as wide as its content (up to the column) instead of the full column width */
    hug?: boolean
    responsiveDevice?: 'desktop' | 'widescreen' | 'mobile'
}) => {
    const align = alignProp ?? 'center' // Default to center for safety (resize math)
    const { setIsResizingGlobal } = useBrandDesign();
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = React.useState<'left' | 'right' | 'top' | 'bottom' | null>(null);

    // Clamp block width when responsive device changes
    useEffect(() => {
        if (!containerRef.current || !responsiveDevice) return;
        const maxWidthMap: Record<string, number> = {
            desktop: 1070,
            widescreen: 1452,
            mobile: 400
        };
        const cap = maxWidthMap[responsiveDevice];
        if (!cap) return;
        // Use the stored width prop (e.g. "1200px") or fallback to rendered offsetWidth
        const storedWidth = width ? parseFloat(String(width)) : containerRef.current.offsetWidth;
        if (storedWidth > cap) {
            const clamped = `${cap}px`;
            containerRef.current.style.width = clamped;
            onWidthChange(clamped);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [responsiveDevice]);

    // Horizontal resize handler
    const handlePointerDownHorizontal = (e: React.PointerEvent, side: 'left' | 'right') => {
        if (isReadOnly) return;
        e.preventDefault();
        e.stopPropagation();

        const handleElement = e.currentTarget as HTMLElement;
        try {
            handleElement.setPointerCapture(e.pointerId);
        } catch {}

        setIsResizing(side);
        setIsResizingGlobal(true);

        const startX = e.clientX;
        const startWidth = containerRef.current?.offsetWidth || 0;
        const parentElement = containerRef.current?.parentElement;
        const maxWidth = parentElement?.offsetWidth || 1200;

        if (containerRef.current) {
            containerRef.current.style.transition = 'none';
        }

        const prevUserSelect = document.body.style.userSelect;
        const prevCursor = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ew-resize';

        let rafId: number | null = null;
        let latestWidth = startWidth;

        const handlePointerMove = (mmE: PointerEvent) => {
            const delta = mmE.clientX - startX;
            // For centered elements, we need double delta because it grows on both sides
            const multiplier = align === 'center' ? 2 : 1;
            let newWidth = side === 'right' ? startWidth + delta * multiplier : startWidth - delta * multiplier;

            // Constraints
            newWidth = Math.max(80, Math.min(newWidth, maxWidth));
            latestWidth = newWidth;

            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    if (containerRef.current) {
                        containerRef.current.style.width = `${latestWidth}px`;
                    }
                });
            }
        };

        const handlePointerUp = (upE: PointerEvent) => {
            try {
                handleElement.releasePointerCapture(upE.pointerId);
            } catch {}

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            document.body.style.userSelect = prevUserSelect;
            document.body.style.cursor = prevCursor;

            setIsResizing(null);
            setIsResizingGlobal(false);

            if (containerRef.current) {
                containerRef.current.style.transition = '';
                const finalWidth = `${latestWidth}px`;
                containerRef.current.style.width = finalWidth;
                onWidthChange(finalWidth);
            }

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    // Vertical resize handler
    const handlePointerDownVertical = (e: React.PointerEvent, side: 'top' | 'bottom') => {
        if (isReadOnly || !onHeightChange) return;
        e.preventDefault();
        e.stopPropagation();

        const handleElement = e.currentTarget as HTMLElement;
        try {
            handleElement.setPointerCapture(e.pointerId);
        } catch {}

        setIsResizing(side);
        setIsResizingGlobal(true);

        const startY = e.clientY;
        const startHeight = containerRef.current?.offsetHeight || 0;

        if (containerRef.current) {
            containerRef.current.style.transition = 'none';
        }

        const innerTextarea = containerRef.current?.querySelector('textarea') as HTMLTextAreaElement | null;
        if (innerTextarea) {
            innerTextarea.style.transition = 'none';
        }

        const prevUserSelect = document.body.style.userSelect;
        const prevCursor = document.body.style.cursor;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'ns-resize';

        let rafId: number | null = null;
        let latestHeight = startHeight;

        const handlePointerMove = (mmE: PointerEvent) => {
            const delta = mmE.clientY - startY;
            let newHeight = side === 'bottom' ? startHeight + delta : startHeight - delta;

            // Constraints - minimum 24px, maximum 1600px
            newHeight = Math.max(24, Math.min(newHeight, 1600));
            latestHeight = newHeight;

            if (rafId === null) {
                rafId = requestAnimationFrame(() => {
                    rafId = null;
                    if (containerRef.current) {
                        containerRef.current.style.height = `${latestHeight}px`;
                        containerRef.current.style.minHeight = `${latestHeight}px`;
                    }
                    if (innerTextarea) {
                        innerTextarea.style.height = `${latestHeight}px`;
                        innerTextarea.style.minHeight = `${latestHeight}px`;
                    }
                });
            }
        };

        const handlePointerUp = (upE: PointerEvent) => {
            try {
                handleElement.releasePointerCapture(upE.pointerId);
            } catch {}

            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }

            document.body.style.userSelect = prevUserSelect;
            document.body.style.cursor = prevCursor;

            setIsResizing(null);
            setIsResizingGlobal(false);

            if (containerRef.current) {
                containerRef.current.style.transition = '';
                const finalHeight = `${latestHeight}px`;
                containerRef.current.style.height = finalHeight;
                containerRef.current.style.minHeight = finalHeight;
                if (innerTextarea) {
                    innerTextarea.style.transition = '';
                    innerTextarea.style.height = finalHeight;
                    innerTextarea.style.minHeight = finalHeight;
                }
                onHeightChange(finalHeight);
            }

            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
    };

    return (
        <div
            ref={containerRef}
            style={{
                width: width || (hug ? 'fit-content' : '100%'),
                maxWidth: '100%',
                minHeight: height || 'auto',
                position: 'relative',
                // A box narrower than the column sits where the column alignment says
                marginLeft: alignProp === 'center' || alignProp === 'right' ? 'auto' : undefined,
                marginRight: alignProp === 'center' ? 'auto' : undefined,
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

/** Scrolls the page holding this element (the editor canvas or the window) back to the top */
export const scrollPageToTop = (from: HTMLElement | null) => {
    let el = from?.parentElement || null
    while (el) {
        const style = getComputedStyle(el)
        if (/(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight) {
            el.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }
        el = el.parentElement
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

/** Fonts that come with the system / the app: never fetched */
const LOCAL_FONTS = new Set(['inter', 'arial', 'helvetica', 'georgia', 'times new roman', 'sans-serif', 'serif', 'monospace', 'system-ui', 'ui-sans-serif', 'ui-monospace', 'minion variable concept', 'satoshi', 'brandon grotesque'])

/** Loads the Google font a text uses (set in its toolbar or by a library component), once per page */
export const useGoogleFont = (fontFamily?: string) => {
    useEffect(() => {
        const name = fontFamily?.split(',')[0].replace(/["']/g, '').trim()
        if (!name || LOCAL_FONTS.has(name.toLowerCase())) return
        const id = `font-${name}`
        if (document.getElementById(id)) return
        const family = name.replace(/ /g, '+')
        const link = document.createElement('link')
        link.id = id
        link.rel = 'stylesheet'
        link.href = `https://fonts.googleapis.com/css2?family=${family}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap`
        // Fonts without those weights / italics: ask for the font alone
        link.onerror = () => { link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap` }
        document.head.appendChild(link)
    }, [fontFamily])
}
