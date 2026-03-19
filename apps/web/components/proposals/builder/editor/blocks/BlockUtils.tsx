import React from "react"
import { Textarea } from "@/components/ui/textarea"

// Reuse existing simple blocks
export const AutoResizeTextarea = ({ value, onChange, placeholder, className, style, readOnly, onFocus, onBlur }: any) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)

    React.useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
        }
    }, [value, style])

    return (
        <Textarea
            ref={textareaRef}
            value={value}
            readOnly={readOnly}
            onChange={onChange}
            onFocus={onFocus}
            onBlur={onBlur}
            placeholder={placeholder}
            className={className}
            style={{ ...style, resize: 'none', overflow: 'hidden' }}
            rows={1}
        />
    )
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


export const detectFormats = (style: any) => {
    const formats: string[] = []
    if (style?.fontWeight === 'bold') formats.push('bold')
    if (style?.fontStyle === 'italic') formats.push('italic')
    if (style?.textDecoration?.includes('underline')) formats.push('underline')
    if (style?.textDecoration?.includes('line-through')) formats.push('strikethrough')
    return formats
}

export const detectListFormat = (style: any) => {
    if (style?.display === 'list-item') {
        return style.listStyleType === 'decimal' ? 'decimal' : 'disc'
    }
    return null
}

export const detectAlign = (style: any) => {
    return style?.textAlign || 'left'
}

export const detectColor = (style: any) => style?.color || '#ffffff'

export const detectHeight = (style: any) => {
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

export const detectOutline = (style: any) => {
    return {
        top: !!style?.borderTop,
        right: !!style?.borderRight,
        bottom: !!style?.borderBottom,
        left: !!style?.borderLeft
    }
}

export const detectFontSize = (style: any) => style?.fontSize || '16px'
