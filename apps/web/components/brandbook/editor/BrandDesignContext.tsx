"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getBrandSettings, updateBrandSettings, updateBrandFontStyles, updateBrandInfo } from '@/app/actions/brand-settings'
import { debounce } from '@/lib/utils'

export interface FontStyle {
    id: string
    title: string
    font: string
    weight: string
    spacing: string
    height: string
    size: string
    color: string
    casing?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
}

export interface BrandSettingsState {
    visibility: string
    menu_background: string
    attachment_bg: string
    highlights_bg: string
    highlights_text: string
    text_card_icon: string
    text_card_tabs: string
    attachment_icon: string
    color_palette: string[]
    main_project_bg: string
    play_audio_bg: string
}

export interface BrandInfoState {
    name: string
    description: string
    logo_url: string
    favicon_url: string
}

interface BrandDesignContextType {
    brandId: string
    fontStyles: FontStyle[]
    settings: BrandSettingsState
    brandInfo: BrandInfoState
    updateFontStyle: (id: string, field: string, value: any) => void
    addFontStyle: () => void
    getStyleById: (id: string) => FontStyle | undefined
    updateSetting: (field: string, value: any) => void
    updateBrandInfoField: (field: string, value: any) => void
    addToPalette: () => void
    removeFromPalette: (index: number) => void
    updatePaletteColor: (index: number, color: string) => void
    isLoading: boolean
}

const DEFAULT_FONT_STYLES: FontStyle[] = [
    { id: 'menu', title: 'Menu', font: 'Rubik', weight: '400', spacing: '0.0', height: '1.3', size: '13', color: '#ffffff', casing: 'none' },
    { id: 'body', title: 'Body', font: 'Roboto', weight: '400', spacing: '0.0', height: '1.3', size: '16', color: '#333333', casing: 'none' },
    { id: 'h1', title: 'Heading 1', font: 'Satoshi', weight: '700', spacing: '0.0', height: '1.2', size: '32', color: '#111111', casing: 'none' },
    { id: 'h2', title: 'Heading 2', font: 'Satoshi', weight: '600', spacing: '0.0', height: '1.3', size: '24', color: '#222222', casing: 'none' },
]

const DEFAULT_SETTINGS: BrandSettingsState = {
    visibility: 'visible',
    menu_background: '#F4F4F4',
    attachment_bg: '#F6C944',
    highlights_bg: '#ffffff',
    highlights_text: '#0C56FF',
    text_card_icon: '#ffffff',
    text_card_tabs: '#0C56FF',
    attachment_icon: '#0C56FF',
    color_palette: ['#4F46E5', '#9333EA', '#EAB308', '#1E1B4B'],
    main_project_bg: '#ffffff',
    play_audio_bg: '#0C56FF'
}

const DEFAULT_BRAND_INFO: BrandInfoState = {
    name: '',
    description: '',
    logo_url: '',
    favicon_url: ''
}

const BrandDesignContext = createContext<BrandDesignContextType | undefined>(undefined)

export function BrandDesignProvider({ children, brandId }: { children: React.ReactNode, brandId: string }) {
    const [fontStyles, setFontStyles] = useState<FontStyle[]>(DEFAULT_FONT_STYLES)
    const [settings, setSettings] = useState<BrandSettingsState>(DEFAULT_SETTINGS)
    const [brandInfo, setBrandInfo] = useState<BrandInfoState>(DEFAULT_BRAND_INFO)
    const [isLoading, setIsLoading] = useState(true)

    // Load settings from DB
    useEffect(() => {
        if (!brandId) return

        let mounted = true
        async function load() {
            try {
                const { settings: dbSettings, brand } = await getBrandSettings(brandId)

                if (!mounted) return

                if (dbSettings) {
                    setSettings({
                        visibility: dbSettings.visibility || 'visible',
                        menu_background: dbSettings.menu_background || '#F4F4F4',
                        attachment_bg: dbSettings.attachment_bg || '#F6C944',
                        highlights_bg: dbSettings.highlights_bg || '#ffffff',
                        highlights_text: dbSettings.highlights_text || '#0C56FF',
                        text_card_icon: dbSettings.text_card_icon || '#ffffff',
                        text_card_tabs: dbSettings.text_card_tabs || '#0C56FF',
                        attachment_icon: dbSettings.attachment_icon || '#0C56FF',
                        color_palette: dbSettings.color_palette || [],
                        main_project_bg: dbSettings.main_project_bg || '#ffffff',
                        play_audio_bg: dbSettings.play_audio_bg || '#0C56FF'
                    })

                    if (dbSettings.font_styles && Object.keys(dbSettings.font_styles).length > 0) {
                        // If stored as object/array in JSONB, cast it
                        const storedFonts = Array.isArray(dbSettings.font_styles)
                            ? dbSettings.font_styles
                            : DEFAULT_FONT_STYLES
                        setFontStyles(storedFonts)
                    }
                }

                if (brand) {
                    setBrandInfo({
                        name: brand.name || '',
                        description: brand.description || '',
                        logo_url: brand.logo_url || '',
                        favicon_url: brand.favicon_url || ''
                    })
                }
            } catch (err) {
                console.error("Failed to load brand settings", err)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }

        load()
        return () => { mounted = false }
    }, [brandId])

    // Persistent Updates Helpers
    const saveSetting = useCallback(debounce((field: string, value: any) => {
        updateBrandSettings(brandId, field, value)
    }, 500), [brandId])

    const saveBrandInfo = useCallback(debounce((field: string, value: any) => {
        updateBrandInfo(brandId, field, value)
    }, 500), [brandId])

    const saveFonts = useCallback(debounce((styles: FontStyle[]) => {
        updateBrandFontStyles(brandId, styles)
    }, 1000), [brandId])


    // --- Actions ---

    const updateFontStyle = (id: string, field: string, value: any) => {
        setFontStyles(prev => {
            const next = prev.map(style =>
                style.id === id ? { ...style, [field]: value } : style
            )
            saveFonts(next)
            return next
        })
    }

    const addFontStyle = () => {
        const newStyle: FontStyle = {
            id: `style-${Date.now()}`,
            title: 'New Style',
            font: 'Rubik',
            weight: '400',
            spacing: '0.0',
            height: '1.3',
            size: '14',
            color: '#000000',
            casing: 'none'
        }
        setFontStyles(prev => {
            const next = [...prev, newStyle]
            saveFonts(next)
            return next
        })
    }

    const updateSetting = (field: string, value: any) => {
        setSettings(prev => ({ ...prev, [field]: value }))
        saveSetting(field, value)
    }

    const updateBrandInfoField = (field: string, value: any) => {
        setBrandInfo(prev => ({ ...prev, [field]: value }))
        saveBrandInfo(field, value)
    }

    // Palette Actions
    const addToPalette = () => {
        const newColor = '#000000'
        setSettings(prev => {
            const nextPalette = [...prev.color_palette, newColor]
            saveSetting('color_palette', nextPalette)
            return { ...prev, color_palette: nextPalette }
        })
    }

    const removeFromPalette = (index: number) => {
        setSettings(prev => {
            const nextPalette = prev.color_palette.filter((_, i) => i !== index)
            saveSetting('color_palette', nextPalette)
            return { ...prev, color_palette: nextPalette }
        })
    }

    const updatePaletteColor = (index: number, color: string) => {
        setSettings(prev => {
            const nextPalette = [...prev.color_palette]
            nextPalette[index] = color
            saveSetting('color_palette', nextPalette)
            return { ...prev, color_palette: nextPalette }
        })
    }

    const getStyleById = (id: string) => fontStyles.find(s => s.id === id)

    return (
        <BrandDesignContext.Provider value={{
            brandId,
            fontStyles,
            settings,
            brandInfo,
            updateFontStyle,
            addFontStyle,
            getStyleById,
            updateSetting,
            updateBrandInfoField,
            addToPalette,
            removeFromPalette,
            updatePaletteColor,
            isLoading
        }}>
            {children}
        </BrandDesignContext.Provider>
    )
}

export const useBrandDesign = () => {
    const context = useContext(BrandDesignContext)
    if (context === undefined) {
        throw new Error('useBrandDesign must be used within a BrandDesignProvider')
    }
    return context
}
