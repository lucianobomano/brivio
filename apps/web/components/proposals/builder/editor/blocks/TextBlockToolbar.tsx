"use client"

import React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"
// The text context bar is the brandbook editor's: same bar, same options in both editors
import { TextToolbar } from "@/components/brandbook/editor/TextToolbar"
import { EDITOR_COLLISION_PADDING } from "@/components/brandbook/editor/editorLayout"
import { detectBackgroundColor, detectWeight } from "@/components/brandbook/editor/blocks/BlockUtils"
import { detectAlign, detectColor, detectFontSize, detectFormats, detectHeight, detectListFormat, detectOutline, detectTransform } from "./BlockUtils"
import type { Block } from "../types"

// Only one text bar at a time (as in the brandbook): the text being edited, or with a panel open, owns it
const owner = { id: null as string | null, listeners: new Set<() => void>() }
const setOwner = (id: string | null) => { owner.id = id; owner.listeners.forEach(l => l()) }
const useOwner = () => React.useSyncExternalStore(
    (cb) => { owner.listeners.add(cb); return () => { owner.listeners.delete(cb) } },
    () => owner.id,
    () => null,
)

/**
 * Context bar of a text or heading block: floats above the block outside the canvas (so it keeps its size at any
 * zoom), shows on hover and stays while the text is edited or one of its panels is open.
 */
export function TextBlockToolbar({ block, onUpdate, onDelete, onMove, onDuplicate, onCopy, hovered, focused, globalStyle, isHeading }: {
    block: Block
    onUpdate: (id: string, content: any) => void
    onDelete?: (id: string) => void
    onDuplicate?: (id: string) => void
    onCopy?: (id: string) => void
    onMove?: (id: string, direction: "up" | "down") => void
    hovered: boolean
    focused: boolean
    globalStyle?: { font?: string, height?: string | number, weight?: string | number, size?: string | number, spacing?: string | number } | null
    isHeading?: boolean
}) {
    const [panelOpen, setPanelOpen] = React.useState(false)
    const current = useOwner()
    const claims = focused || panelOpen
    React.useEffect(() => {
        if (claims) setOwner(block.id)
        else if (owner.id === block.id) setOwner(null)
    }, [claims, block.id])
    React.useEffect(() => () => { if (owner.id === block.id) setOwner(null) }, [block.id])
    const visible = claims || (hovered && (current === null || current === block.id))

    const style = block.content?.style || {}
    const update = (patch: Record<string, unknown>) => onUpdate(block.id, { ...block.content, style: { ...block.content.style, ...patch } })
    const letterSpacing = (() => {
        const raw = style.letterSpacing
        if (typeof raw === "string" && raw.trim().endsWith("em")) return Math.round(parseFloat(raw) * 1000) / 10
        if (typeof raw === "string" && raw.trim().endsWith("px")) {
            const size = parseFloat(style.fontSize || String(globalStyle?.size || "16")) || 16
            return Math.round((parseFloat(raw) / size) * 1000) / 10
        }
        return globalStyle?.spacing ? Math.round(parseFloat(String(globalStyle.spacing)) * 1000) / 10 : 0
    })()

    return (
        <PopoverPrimitive.Root open={visible} modal={false}>
            <PopoverPrimitive.Anchor asChild>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0" />
            </PopoverPrimitive.Anchor>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    side="top"
                    align="center"
                    sideOffset={12}
                    collisionPadding={EDITOR_COLLISION_PADDING}
                    className="z-[2000] outline-none"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <TextToolbar
                            onDelete={onDelete ? () => onDelete(block.id) : undefined}
                            onDuplicate={onDuplicate ? () => onDuplicate(block.id) : undefined}
                            onCopy={onCopy ? () => onCopy(block.id) : undefined}
                            textStyle={style}
                            onTextStyleChange={update}
                            margin={style.margin}
                            onMarginChange={(m) => update({ margin: m })}
                            activeTransform={detectTransform(block.content.text || "")}
                            onTransform={(t) => {
                                const text = block.content.text || ""
                                let next = text
                                if (t === "uppercase") next = text.toUpperCase()
                                if (t === "lowercase") next = text.toLowerCase()
                                if (t === "sentence") next = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
                                if (t === "capitalize") next = text.replace(/\b\w/g, (c: string) => c.toUpperCase())
                                onUpdate(block.id, { ...block.content, text: next })
                            }}
                            currentFont={style.fontFamily || globalStyle?.font || "Inter"}
                            onFontChange={(font) => update({ fontFamily: font })}
                            currentLineHeight={String(style.lineHeight || globalStyle?.height || (isHeading ? "1.1" : "1.5"))}
                            onLineHeightChange={(h) => update({ lineHeight: h })}
                            currentLetterSpacing={letterSpacing}
                            onLetterSpacingChange={(percent) => update({ letterSpacing: `${percent / 100}em` })}
                            currentFontSize={detectFontSize(style)}
                            onFontSizeChange={(size) => update({ fontSize: size })}
                            activeFormats={detectFormats(style)}
                            onFormat={(fmt) => {
                                const s = { ...style }
                                if (fmt === "italic") s.fontStyle = s.fontStyle === "italic" ? "normal" : "italic"
                                if (fmt === "underline") {
                                    const dec = s.textDecoration || ""
                                    s.textDecoration = dec.includes("underline") ? dec.replace("underline", "").trim() : `${dec} underline`.trim()
                                }
                                if (fmt === "strikethrough") {
                                    const dec = s.textDecoration || ""
                                    s.textDecoration = dec.includes("line-through") ? dec.replace("line-through", "").trim() : `${dec} line-through`.trim()
                                }
                                if (fmt === "bold") s.fontWeight = s.fontWeight === "bold" || Number(s.fontWeight) >= 700 ? "normal" : "bold"
                                onUpdate(block.id, { ...block.content, style: s })
                            }}
                            currentWeight={detectWeight(style, String(globalStyle?.weight || (isHeading ? "700" : "400")))}
                            onWeightChange={(w) => update({ fontWeight: w })}
                            activeListFormat={detectListFormat(style)}
                            onListFormat={(listFmt) => {
                                const s = { ...style }
                                if (listFmt) {
                                    if (s.display === "list-item" && s.listStyleType === listFmt) {
                                        delete s.display; delete s.listStyleType; delete s.listStylePosition; delete s.marginLeft
                                    } else {
                                        s.display = "list-item"; s.listStyleType = listFmt; s.listStylePosition = "inside"; s.marginLeft = "1em"
                                    }
                                }
                                onUpdate(block.id, { ...block.content, style: s })
                            }}
                            activeAlign={detectAlign(style)}
                            onAlign={(a) => update({ textAlign: a })}
                            color={detectColor(style)}
                            onColorChange={(c) => update({ color: c })}
                            backgroundColor={detectBackgroundColor(style)}
                            onBackgroundColorChange={(c) => update({ backgroundColor: c })}
                            width={style.width}
                            onWidthChange={(w) => update({ width: w })}
                            heightValue={style.height}
                            onHeightChangePx={(h) => update({ height: h })}
                            heightSettings={detectHeight(style)}
                            onHeightSettingsChange={(step) => {
                                let val: string | undefined = undefined
                                if (step === 3) val = "40px"
                                if (step === 5) val = "80px"
                                if (step === 8) val = "160px"
                                if (step === 100) val = "400px"
                                update({ minHeight: val, height: undefined })
                            }}
                            onOrderChange={(dir) => {
                                if (onMove) onMove(block.id, dir)
                                else update({ zIndex: (parseInt(style.zIndex || "0") || 0) + (dir === "up" ? 1 : -1) })
                            }}
                            outline={detectOutline(style)}
                            onOutlineChange={(side) => {
                                const s = { ...style }
                                const key = side === "top" ? "borderTop" : side === "right" ? "borderRight" : side === "bottom" ? "borderBottom" : "borderLeft"
                                if (s[key]) delete s[key]; else s[key] = "2px solid currentColor"
                                onUpdate(block.id, { ...block.content, style: s })
                            }}
                            onSettingsOpenChange={setPanelOpen}
                        />
                    </div>
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    )
}
