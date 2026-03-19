"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getBrandSettings, updateBrandSettings, updateBrandFontStyles, updateBrandInfo } from '@/app/actions/brand-settings'
import { debounce } from '@/lib/utils'
import { updateProposalModuleContent, getProposalModules, createProposalModule } from '@/app/actions/proposal-builder'

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
    proposalId?: string
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
    { id: 'h1', title: 'Heading 1', font: 'Satoshi bold', weight: '700', spacing: '0.0', height: '1.2', size: '32', color: '#111111', casing: 'none' },
    { id: 'h2', title: 'Heading 2', font: 'Satoshi bold', weight: '600', spacing: '0.0', height: '1.3', size: '24', color: '#222222', casing: 'none' },
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

export function BrandDesignProvider({ children, brandId, proposalId, initialModules }: { children: React.ReactNode, brandId: string, proposalId?: string, initialModules?: any[] }) {
    const [fontStyles, setFontStyles] = useState<FontStyle[]>(DEFAULT_FONT_STYLES)
    const [settings, setSettings] = useState<BrandSettingsState>(DEFAULT_SETTINGS)
    const [brandInfo, setBrandInfo] = useState<BrandInfoState>(DEFAULT_BRAND_INFO)
    const [isLoading, setIsLoading] = useState(true)

    // Use Ref for settingsModuleId to avoid stale closures in debounced functions
    const settingsModuleIdRef = useRef<string | null>(null)
    const [, setSettingsModuleIdState] = useState<string | null>(null)

    const updateModuleId = (id: string | null) => {
        settingsModuleIdRef.current = id
        setSettingsModuleIdState(id)
    }

    // Initialize from initialModules if present
    useEffect(() => {
        if (initialModules && initialModules.length > 0) {
            const sModule = initialModules.find((m: any) => m.type === 'settings')
            if (sModule) {
                updateModuleId(sModule.id)
                if (sModule.content_json) {
                    if (sModule.content_json.settings) {
                        setSettings(prev => ({ ...prev, ...sModule.content_json.settings }))
                    }
                    if (sModule.content_json.fontStyles) {
                        setFontStyles(sModule.content_json.fontStyles)
                    }
                }
            }
        }
    }, [initialModules])

    // Load settings from DB
    useEffect(() => {
        if (!brandId) return

        let mounted = true
        async function load() {
            try {
                // 1. Load Brand Settings as baseline
                const { settings: dbSettings, brand } = await getBrandSettings(brandId)

                if (!mounted) return

                let currentSettings = { ...DEFAULT_SETTINGS }
                let currentFonts = [...DEFAULT_FONT_STYLES]

                if (dbSettings) {
                    currentSettings = {
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
                    }

                    if (dbSettings.font_styles && Array.isArray(dbSettings.font_styles)) {
                        currentFonts = dbSettings.font_styles
                    }
                }

                // 2. If proposalId is provided, look for a 'settings' module override (if not already found in initialModules)
                if (proposalId && !settingsModuleIdRef.current) {
                    const modules = await getProposalModules(proposalId)
                    const sModule = modules.find((m: any) => m.type === 'settings')
                    if (sModule) {
                        updateModuleId(sModule.id)
                        if (sModule.content_json) {
                            if (sModule.content_json.settings) {
                                currentSettings = { ...currentSettings, ...sModule.content_json.settings }
                            }
                            if (sModule.content_json.fontStyles) {
                                currentFonts = sModule.content_json.fontStyles
                            }
                        }
                    }
                } else if (settingsModuleIdRef.current && initialModules) {
                    // We already set this from initialModules, just merge with brand baseline if needed
                    // Actually, if we have local settings, they should take precedence.
                    // The useEffect above already handled it.
                }

                setSettings(prev => ({ ...currentSettings, ...prev })) // Merge with anything set in initialModules
                setFontStyles(prev => prev.length > DEFAULT_FONT_STYLES.length ? prev : currentFonts)

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
    }, [brandId, proposalId, initialModules])

    // Persistent Updates Helpers
    const saveSetting = useCallback(debounce(async (
        bId: string,
        pId: string | undefined,
        moduleId: string | null,
        field: string,
        value: any,
        currentSettings: BrandSettingsState,
        currentFonts: FontStyle[]
    ) => {
        if (pId) {
            // PROPOSAL SCOPE: Only write to local settings module
            const updatedSettings = { ...currentSettings, [field]: value }
            const content = { settings: updatedSettings, fontStyles: currentFonts }

            if (moduleId) {
                await updateProposalModuleContent(moduleId, content)
            } else {
                const res = await createProposalModule(pId, 'settings', -1)
                if (res.success && res.module) {
                    updateModuleId(res.module.id)
                    await updateProposalModuleContent(res.module.id, content)
                }
            }
        } else {
            await updateBrandSettings(bId, field, value)
        }
    }, 500), [])

    const saveFonts = useCallback(debounce(async (
        bId: string,
        pId: string | undefined,
        moduleId: string | null,
        styles: FontStyle[],
        currentSettings: BrandSettingsState
    ) => {
        if (pId) {
            if (moduleId) {
                await updateProposalModuleContent(moduleId, { settings: currentSettings, fontStyles: styles })
            } else {
                const res = await createProposalModule(pId, 'settings', -1)
                if (res.success && res.module) {
                    updateModuleId(res.module.id)
                    await updateProposalModuleContent(res.module.id, { settings: currentSettings, fontStyles: styles })
                }
            }
        } else {
            await updateBrandFontStyles(bId, styles)
        }
    }, 1000), [])


    // --- Actions ---

    const updateFontStyle = (id: string, field: string, value: any) => {
        setFontStyles(prev => {
            const next = prev.map(style =>
                style.id === id ? { ...style, [field]: value } : style
            )
            saveFonts(brandId, proposalId, settingsModuleIdRef.current, next, settings)
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
            saveFonts(brandId, proposalId, settingsModuleIdRef.current, next, settings)
            return next
        })
    }

    const updateSetting = (field: string, value: any) => {
        setSettings(prev => {
            const next = { ...prev, [field]: value }
            saveSetting(brandId, proposalId, settingsModuleIdRef.current, field, value, next, fontStyles)
            return next
        })
    }

    const updateBrandInfoField = (field: string, value: any) => {
        setBrandInfo(prev => ({ ...prev, [field]: value }))
        updateBrandInfo(brandId, field, value)
    }

    // Palette Actions
    const addToPalette = () => {
        const newColor = '#000000'
        setSettings(prev => {
            const nextPalette = [...prev.color_palette, newColor]
            const next = { ...prev, color_palette: nextPalette }
            saveSetting(brandId, proposalId, settingsModuleIdRef.current, 'color_palette', nextPalette, next, fontStyles)
            return next
        })
    }

    const removeFromPalette = (index: number) => {
        setSettings(prev => {
            const nextPalette = prev.color_palette.filter((_, i) => i !== index)
            const next = { ...prev, color_palette: nextPalette }
            saveSetting(brandId, proposalId, settingsModuleIdRef.current, 'color_palette', nextPalette, next, fontStyles)
            return next
        })
    }

    const updatePaletteColor = (index: number, color: string) => {
        setSettings(prev => {
            const nextPalette = [...prev.color_palette]
            nextPalette[index] = color
            const next = { ...prev, color_palette: nextPalette }
            saveSetting(brandId, proposalId, settingsModuleIdRef.current, 'color_palette', nextPalette, next, fontStyles)
            return next
        })
    }

    const getStyleById = (id: string) => fontStyles.find(s => s.id === id)

    return (
        <BrandDesignContext.Provider value={{
            brandId,
            proposalId,
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
