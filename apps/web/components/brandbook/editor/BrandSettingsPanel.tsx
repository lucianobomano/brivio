import React, { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Lock, ChevronRight, Plus, Trash2 } from "lucide-react"
import { useBrandDesign, FontStyle } from "./BrandDesignContext"
import { UploadAssetPopup } from "./UploadAssetPopup"

// Sidebar Items
const SIDEBAR_ITEMS = [
    { id: 'settings', label: 'Settings' },
    { id: 'colors', label: 'Colors' },
    { id: 'fonts', label: 'Fonts' },
    { id: 'url', label: 'URL & Domain' },
    { id: 'team', label: 'Manage editor team' },
    { id: 'viewers', label: 'Manage viewers' },
    { id: 'billing', label: 'Upgrade & Billing' },
    { id: 'delete', label: 'Delete' },
]

export interface BrandSettingsPanelProps {
    isOpen: boolean
    onClose: () => void
    brandId: string
}

type ThemeMode = 'light' | 'dark'

type ThemeStyles = {
    bg: string
    text: string
    textSec: string
    border: string
    borderSec: string
    inputBorder: string
    accent?: string
}

export const BrandSettingsPanel = ({ isOpen, onClose, brandId }: BrandSettingsPanelProps) => {
    const [activeTab, setActiveTab] = useState('settings')
    const [theme, setTheme] = useState<ThemeMode>('dark')
    const [scope, setScope] = useState<'global' | 'bam'>('global')

    const t = theme === 'dark' ? {
        bg: "bg-[#15161B]",
        text: "text-white",
        textSec: "text-[#888]",
        border: "border-[#333]",
        borderSec: "border-[#222]",
        inputBorder: "border-[#ff0054]",
        accent: "border-[#ff0054]",
    } : {
        bg: "bg-white",
        text: "text-gray-900",
        textSec: "text-gray-500",
        border: "border-gray-200",
        borderSec: "border-gray-100",
        inputBorder: "border-[#ff0054]",
        accent: "border-[#ff0054]",
    }

    return (
        <>
            <div
                className={cn(
                    "fixed inset-0 bg-black/50 z-[2999] transition-opacity duration-300",
                    isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                onClick={onClose}
            />

            <div
                className={cn(
                    `fixed top-0 right-0 h-full w-1/2 z-[3000] shadow-2xl transition-transform duration-300 ease-in-out flex rounded-l-[24px] overflow-hidden text-[14px]`,
                    t.bg, t.text,
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* LEFT SIDEBAR (Navigation) */}
                <div className={cn("w-[240px] shrink-0 border-r flex flex-col p-8 pt-10", t.borderSec)}>

                    {/* Top Toggles */}
                    <div className="flex flex-col gap-8 mb-12">
                        {/* Light/Dark */}
                        <div className="flex items-center justify-between">
                            <span className={cn("text-sm font-medium", t.textSec)}>Light</span>
                            <div className="bg-[#333] p-1 rounded-full flex items-center relative w-12 h-6 cursor-pointer" onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}>
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-[#999] transition-all",
                                    theme === 'dark' ? "left-7 bg-white" : "left-1"
                                )} />
                            </div>
                            <span className={cn("text-sm font-medium", t.text)}>Dark</span>
                        </div>

                        {/* Global/BAM */}
                        <div className="flex items-center justify-between">
                            <span className={cn("text-sm font-medium", t.textSec)}>Global</span>
                            <div className="bg-[#333] p-1 rounded-full flex items-center relative w-12 h-6 cursor-pointer" onClick={() => setScope(prev => prev === 'global' ? 'bam' : 'global')}>
                                <div className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-[#999] transition-all",
                                    scope === 'bam' ? "left-7 bg-white" : "left-1"
                                )} />
                            </div>
                            <span className={cn("text-sm font-medium", t.textSec)}>BAM</span>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex flex-col gap-6">
                        {SIDEBAR_ITEMS.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "text-left text-[15px] font-medium transition-colors",
                                    activeTab === item.id ? t.text : `${t.textSec} hover:opacity-80`
                                )}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* RIGHT CONTENT AREA */}
                <div className={cn("flex-1 overflow-y-auto", t.bg, t.text)}>
                    <div className="p-12">
                        <ContentRenderer tab={activeTab} theme={theme} t={t} brandId={brandId} />
                    </div>
                </div>
            </div>
        </>
    )
}

const ContentRenderer = ({ tab, theme, t, brandId }: { tab: string, theme: ThemeMode, t: ThemeStyles, brandId: string }) => {
    const commonProps = { theme, t, brandId }
    switch (tab) {
        case 'settings': return <SettingsView {...commonProps} />
        case 'colors': return <ColorsView {...commonProps} />
        case 'fonts': return <FontsView {...commonProps} />
        case 'url': return <UrlDomainView {...commonProps} />
        case 'team': return <ManageTeamView {...commonProps} />
        case 'viewers': return <ViewersView {...commonProps} />
        case 'billing': return <UpgradeBillingView {...commonProps} />
        case 'delete': return <DeleteView {...commonProps} />
        default: return <div className={t.textSec}>Coming soon</div>
    }
}

// --- Views ---

const SettingsView = ({ t, brandId }: { t: ThemeStyles, brandId: string }) => {
    const { settings, brandInfo, updateSetting, updateBrandInfoField } = useBrandDesign()
    const [uploadPopup, setUploadPopup] = useState<{ open: boolean, type: 'logo' | 'favicon' }>({ open: false, type: 'logo' })

    const handleUploadComplete = (url: string) => {
        if (uploadPopup.type === 'logo') updateBrandInfoField('logo_url', url)
        else updateBrandInfoField('favicon_url', url)
    }

    return (
        <div className="flex gap-16 max-w-5xl">
            <div className="flex flex-col gap-12 w-[180px] shrink-0">
                {/* Logo */}
                <div className="flex flex-col items-center text-center gap-4">
                    <span className={cn("font-medium self-start", t.text)}>Logo</span>
                    <div className="w-[80px] h-[80px] rounded-full p-[2px] bg-gradient-to-b from-[#FF0054] to-[#00F0FF]">
                        <div className={cn("w-full h-full rounded-full border-4 relative flex items-center justify-center overflow-hidden", t.bg, t.bg === "bg-white" ? "border-white" : "border-[#15161B]")}>
                            {brandInfo.logo_url ? (
                                <img src={brandInfo.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-tr from-[#FF0054] to-[#00F0FF] opacity-20" />
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setUploadPopup({ open: true, type: 'logo' })}
                        className={cn("w-full py-2 border rounded transition-colors text-sm", t.border, t.textSec, "hover:opacity-80")}
                    >
                        Browse
                    </button>
                </div>

                {/* Favicon */}
                <div className="flex flex-col items-center text-center gap-4">
                    <span className={cn("font-medium self-start", t.text)}>Favicon</span>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-tr from-[#FF0054] to-[#00F0FF]">
                        {brandInfo.favicon_url && <img src={brandInfo.favicon_url} alt="Favicon" className="w-full h-full object-cover" />}
                    </div>
                    <button
                        onClick={() => setUploadPopup({ open: true, type: 'favicon' })}
                        className={cn("w-full py-2 border rounded transition-colors text-sm", t.border, t.textSec, "hover:opacity-80")}
                    >
                        Browse
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-10">
                <div className="grid grid-cols-2 gap-8">
                    <InputGroup
                        label="Brand name"
                        value={brandInfo.name}
                        onChange={(v) => updateBrandInfoField('name', v)}
                        t={t}
                    />
                    <InputGroup label="Meta title" t={t} />
                </div>
                <div className="grid grid-cols-2 gap-8"><InputGroup label="Page title" t={t} /></div>
                <div className="w-full">
                    <InputGroup
                        label="Meta description"
                        value={brandInfo.description}
                        onChange={(v) => updateBrandInfoField('description', v)}
                        t={t}
                    />
                </div>
                <div className="w-full"><InputGroup defaultValue="Arkhus360 online brand book" isLink t={t} /></div>

                <div className="grid grid-cols-2 gap-8">
                    <SelectGroup
                        label="Visibility"
                        value={settings.visibility}
                        onChange={(v) => updateSetting('visibility', v)}
                        options={['Visible', 'Password Protected', 'Hidden']}
                        t={t}
                    />
                    <SelectGroup label="Assets storage" defaultValue="Brivio°" options={['Brivio°', 'External']} t={t} />
                </div>
            </div>

            <UploadAssetPopup
                isOpen={uploadPopup.open}
                onClose={() => setUploadPopup({ ...uploadPopup, open: false })}
                onUploadComplete={handleUploadComplete}
                type={uploadPopup.type}
                brandId={brandId}
            />
        </div>
    )
}

const ColorsView = ({ t }: { t: ThemeStyles }) => {
    const { settings, updateSetting, addToPalette, removeFromPalette, updatePaletteColor } = useBrandDesign()

    return (
        <div className="flex flex-col gap-10 max-w-5xl">
            <div className="flex flex-col gap-4">
                <span className={cn("text-[15px]", t.textSec)}>Brand color palette</span>
                <div className="flex items-center gap-4 flex-wrap">
                    {settings.color_palette.map((color, i) => (
                        <div key={i} className="group relative">
                            <ColorPickerCircle color={color} onChange={(c) => updatePaletteColor(i, c)} />
                            <button
                                onClick={() => removeFromPalette(i)}
                                className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3 h-3 text-white" />
                            </button>
                        </div>
                    ))}
                    <button
                        onClick={addToPalette}
                        className={cn("w-12 h-12 rounded-full border flex items-center justify-center transition-colors hover:opacity-80", t.border, t.textSec)}
                    >
                        <Plus className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-x-12 gap-y-10">
                <div className="flex flex-col gap-10">
                    <ColorInput
                        label="Menu background"
                        value={settings.menu_background}
                        onChange={(c) => updateSetting('menu_background', c)}
                        t={t}
                    />
                    <ColorInput
                        label="Attachment background"
                        value={settings.attachment_bg}
                        onChange={(c) => updateSetting('attachment_bg', c)}
                        t={t}
                    />
                    <ColorInput
                        label="Text card icon"
                        value={settings.text_card_icon}
                        onChange={(c) => updateSetting('text_card_icon', c)}
                        t={t}
                    />
                </div>
                <div className="flex flex-col gap-10">
                    <ColorInput
                        label="Main project background"
                        value={settings.main_project_bg}
                        onChange={(c) => updateSetting('main_project_bg', c)}
                        t={t}
                    />
                    <ColorInput
                        label="Highlights"
                        value={settings.highlights_bg}
                        onChange={(c) => updateSetting('highlights_bg', c)}
                        t={t}
                    />
                    <ColorInput
                        label="Text card tabs"
                        value={settings.text_card_tabs}
                        onChange={(c) => updateSetting('text_card_tabs', c)}
                        t={t}
                    />
                </div>
                <div className="flex flex-col gap-10">
                    <ColorInput
                        label="Play audio"
                        value={settings.play_audio_bg}
                        onChange={(c) => updateSetting('play_audio_bg', c)}
                        t={t}
                    />
                    <ColorInput
                        label="Highlights text"
                        value={settings.highlights_text}
                        onChange={(c) => updateSetting('highlights_text', c)}
                        t={t}
                    />
                    <ColorInput
                        label="Attachment icon"
                        value={settings.attachment_icon}
                        onChange={(c) => updateSetting('attachment_icon', c)}
                        t={t}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
                <span className={cn("text-[15px]", t.textSec)}>Text colors</span>
                <div className="text-[15px] underline cursor-pointer text-[#0C56FF]">Visit font settings</div>
            </div>
        </div>
    )
}

const FontsView = ({ t }: { t: ThemeStyles }) => {
    const { fontStyles, updateFontStyle, addFontStyle } = useBrandDesign()
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const toggleRow = (id: string) => {
        setExpandedId(prev => prev === id ? null : id)
    }

    return (
        <div className="flex flex-col gap-6 max-w-6xl w-full">
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-6 px-2 mb-2">
                {['Title', 'Font', 'Weight', 'Spacing', 'Height', 'Size', 'Color'].map(h => (
                    <span key={h} className={cn("text-[14px]", t.textSec)}>{h}</span>
                ))}
            </div>
            <div className="flex flex-col gap-8">
                {fontStyles.map(row => (
                    <FontRow
                        key={row.id}
                        {...row}
                        t={t}
                        isExpanded={expandedId === row.id}
                        onToggle={() => toggleRow(row.id)}
                        onUpdate={(field, val) => updateFontStyle(row.id, field, val)}
                    />
                ))}
            </div>
            <button
                className={cn("flex items-center gap-3 mt-4 hover:opacity-80 transition-opacity self-start", t.text)}
                onClick={addFontStyle}
            >
                <div className={cn("w-8 h-8 rounded-full border flex items-center justify-center text-sm", t.border, t.textSec)}>+</div>
                <span className="text-[15px]">Add new style</span>
            </button>
        </div>
    )
}

// ... Reused View Components for URL, Team, etc from previous version ...

const UrlDomainView = ({ t }: { t: ThemeStyles }) => (
    <div className="flex flex-col gap-10 max-w-4xl">
        <div className="flex flex-col gap-6">
            <span className={cn("text-[15px]", t.textSec)}>Public URL</span>
            <div className="flex items-end gap-4">
                <span className={cn("text-[15px] pb-2", t.text)}>https://my.brivio.com/</span>
                <input type="text" placeholder="brand-name" className={cn("flex-1 bg-transparent border-b py-2 outline-none font-light", t.inputBorder, t.text, "placeholder-opacity-50")} />
                <button className={cn("border px-6 py-2 rounded transition-colors text-sm hover:opacity-80", t.border, t.textSec)}>Copy</button>
            </div>
        </div>
        <div className="flex flex-col gap-6">
            <span className={cn("text-[15px]", t.textSec)}>Custom domain</span>
            <div className={cn("flex items-center gap-2 text-[15px]", t.textSec)}>
                <Lock className="w-4 h-4" />
                <span>Brand subscription plan needed. <a href="#" className="text-[#0C56FF]">Upgrade Now.</a></span>
            </div>
            <button className={cn("border px-8 py-3 rounded transition-colors text-sm self-start hover:opacity-80", t.border, t.textSec)}>Upgrade</button>
        </div>
    </div>
)

const ManageTeamView = ({ t }: { t: ThemeStyles }) => (
    <div className="flex flex-col gap-10 max-w-4xl">
        <span className={cn("text-[15px]", t.textSec)}>Manage Team (Coming Soon)</span>
    </div>
)

const ViewersView = ({ t }: { t: ThemeStyles }) => (
    <div className="flex flex-col gap-10 max-w-4xl">
        <span className={cn("text-[15px]", t.textSec)}>Viewer accounts (Coming Soon)</span>
    </div>
)

const UpgradeBillingView = ({ theme, t }: { theme: ThemeMode, t: ThemeStyles }) => (
    <div className="flex flex-col gap-10 max-w-4xl">
        <span className={cn("text-[15px]", t.textSec)}>Brand New Plan</span>
        <button className={cn("px-8 py-3 border rounded transition-colors hover:opacity-80 text-[15px]", t.border, t.textSec)}>
            Upgrade
        </button>
    </div>
)

const DeleteView = ({ t }: { t: ThemeStyles }) => (
    <div className="flex flex-col gap-8 max-w-xl">
        <span className={cn("text-[15px]", t.text)}>Do you want to delete this brand?</span>
        <p className={cn("text-[15px] leading-relaxed", t.textSec)}>
            This action is permanent and cannot be undone.
        </p>
        <button className="bg-[#D93025] hover:bg-[#B92015] text-white px-8 py-2 rounded transition-colors self-start text-[15px] font-medium border-none">
            Delete
        </button>
    </div>
)


// --- Helper Components ---

const GOOGLE_FONTS = [
    "Inter", "Montserrat", "Poppins", "Roboto", "Open Sans", "Lato", "Urbanist", "Outfit",
    "Plus Jakarta Sans", "Satoshi", "Brandon Grotesque", "Figtree", "Manrope", "Syne",
    "Space Grotesk", "Public Sans", "Playfair Display", "Lora", "Merriweather",
    "Libre Baskerville", "PT Serif", "Crimson Text", "Josefin Sans", "Josefin Slab",
    "Arvo", "Oswald", "Rubik", "Raleway", "Nunito", "Archivo Black", "Staatliches",
    "Bebas Neue", "Righteous", "Ultra", "Fira Code", "Source Code Pro", "Space Mono",
    "Quicksand", "Kanit", "Heebo", "Work Sans", "Dosis", "Ubuntu", "Source Sans Pro"
]
const FONT_WEIGHTS = ["100", "200", "300", "400", "500", "600", "700", "800", "900"]
const LINE_HEIGHTS = ["1.0", "1.1", "1.2", "1.3", "1.4", "1.5", "1.6", "1.7", "1.8", "1.9", "2.0", "2.5", "3.0"]

interface FontRowProps extends FontStyle {
    t: ThemeStyles
    isExpanded: boolean
    onToggle: () => void
    onUpdate: (field: string, value: string) => void
}

const FontRow = ({ title, font, weight, spacing, height, size, color, casing, t, isExpanded, onToggle, onUpdate }: FontRowProps) => (
    <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-6 items-end">
            <div className={cn("flex items-center gap-3 border-b pb-2 cursor-pointer", t.accent || "border-blue-500")} onClick={onToggle}>
                <ChevronRight className={cn("w-4 h-4 text-[#0C56FF] transition-transform", isExpanded ? "rotate-90" : "rotate-0")} />
                <span className={cn("text-[15px]", t.textSec)}>{title}</span>
            </div>
            <FontSelect value={font} options={GOOGLE_FONTS} onChange={(v) => onUpdate('font', v)} t={t} />
            <FontSelect value={weight} options={FONT_WEIGHTS} onChange={(v) => onUpdate('weight', v)} t={t} />
            <FontInput value={spacing} onChange={(v) => onUpdate('spacing', v)} t={t} />
            <FontSelect value={height} options={LINE_HEIGHTS} onChange={(v) => onUpdate('height', v)} t={t} />
            <FontInput value={size} onChange={(v) => onUpdate('size', v)} t={t} />
            <div className="pb-2 flex justify-start">
                <ColorPickerCircle color={color} onChange={(c) => onUpdate('color', c)} className={cn("w-6 h-6 border", t.border)} />
            </div>
        </div>

        {isExpanded && (
            <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_1fr_0.5fr_0.5fr] gap-6">
                <div className="flex justify-end items-center">
                    <span className={cn("text-[13px]", t.textSec)}>Text case</span>
                </div>
                <div className="col-span-6 flex items-center gap-3">
                    {/* Text Case Logic reused */}
                    <TextCaseBtn label="None" active={!casing || casing === 'none'} onClick={() => onUpdate('casing', 'none')} t={t} icon={<div className="w-2 h-[1px] bg-current" />} />
                    <TextCaseBtn label="Uppercase" text="AA" active={casing === 'uppercase'} onClick={() => onUpdate('casing', 'uppercase')} t={t} />
                    <TextCaseBtn label="Lowercase" text="aa" active={casing === 'lowercase'} onClick={() => onUpdate('casing', 'lowercase')} t={t} />
                    <TextCaseBtn label="Capitalize" text="Aa" active={casing === 'capitalize'} onClick={() => onUpdate('casing', 'capitalize')} t={t} />
                </div>
            </div>
        )}
    </div>
)

const TextCaseBtn = ({ label, text, icon, t, active, onClick }: { label: string, text?: string, icon?: React.ReactNode, t: ThemeStyles, active?: boolean, onClick?: () => void }) => (
    <div className="group relative">
        <button
            className={cn(
                "w-8 h-6 flex items-center justify-center border rounded text-[10px] font-medium transition-colors",
                active
                    ? "border-[#FF0054] text-[#FF0054]"
                    : `${t.border} ${t.textSec} hover:text-white hover:border-[#888]`
            )}
            onClick={onClick}
        >
            {text || icon}
        </button>
    </div>
)

const ColorPickerCircle = ({ color, onChange, className }: { color: string, onChange: (c: string) => void, className?: string }) => {
    const inputRef = useRef<HTMLInputElement>(null)
    return (
        <div
            className={cn("w-12 h-12 rounded-full cursor-pointer relative overflow-hidden flex items-center justify-center shrink-0 shadow-sm", className)}
            style={{ backgroundColor: color }}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="color"
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                value={color}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}

const ColorInput = ({ label, value, onChange, t }: { label: string, value: string, onChange: (c: string) => void, t: ThemeStyles }) => {
    return (
        <div className="flex flex-col gap-2 w-full">
            <label className={cn("text-[15px]", t.textSec)}>{label}</label>
            <div className="flex items-end gap-4 relative">
                <input
                    type="text"
                    value={value || '#ffffff'}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn("w-full bg-transparent border-b py-2 outline-none font-light", t.accent || "border-blue-500", t.textSec)}
                />
                <ColorPickerCircle
                    color={value || '#ffffff'}
                    onChange={onChange}
                    className={cn("w-8 h-8 border", t.border)}
                />
            </div>
        </div>
    )
}

const InputGroup = ({ label, value, onChange, defaultValue, isLink, t }: { label?: string, value?: string, onChange?: (val: string) => void, defaultValue?: string, isLink?: boolean, t: ThemeStyles }) => (
    <div className="flex flex-col gap-2 w-full">
        {label && <label className={cn("text-[15px]", t.textSec)}>{label}</label>}
        <input
            type="text"
            defaultValue={defaultValue}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={cn(
                "w-full bg-transparent border-b py-2 outline-none transition-colors font-light",
                isLink
                    ? "border-[#ff0054] text-[#888]"
                    : `${t.inputBorder} ${t.text} focus:border-[#ff0054]`
            )}
        />
    </div>
)

const SelectGroup = ({ label, value, defaultValue, options, onChange, t }: { label: string, value?: string, defaultValue?: string, options: string[], onChange?: (val: string) => void, t: ThemeStyles }) => (
    <div className="flex flex-col gap-2 w-full">
        <label className={cn("text-[15px]", t.textSec)}>{label}</label>
        <div className="relative">
            <select
                value={value}
                defaultValue={defaultValue}
                onChange={(e) => onChange?.(e.target.value)}
                className={cn("w-full bg-transparent border-b py-2 outline-none appearance-none cursor-pointer", t.inputBorder, t.text, "focus:border-[#ff0054]")}
            >
                {options.map((opt: string) => <option key={opt} value={opt} className={cn(t.bg === "bg-white" ? "bg-white" : "bg-[#15161B]")}>{opt}</option>)}
            </select>
            <div className="absolute right-0 top-3 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#ff0054]" />
            </div>
        </div>
    </div>
)

const FontSelect = ({ value, options, onChange, t }: { value: string, options: string[], onChange: (val: string) => void, t: ThemeStyles }) => {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn("relative border-b pb-2 cursor-pointer", t.accent || "border-blue-500")}
            onClick={() => setIsOpen(!isOpen)}
        >
            <span className={cn("text-[15px] select-none", t.textSec)}>{value}</span>
            <div className="absolute right-0 top-2 pointer-events-none">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-[#0C56FF]" />
            </div>

            {isOpen && (
                <div className={cn("absolute top-full left-0 w-full min-w-[120px] max-h-[200px] overflow-y-auto z-50 rounded-md shadow-lg border mt-1", t.bg, t.border)}>
                    {options.map(opt => (
                        <div
                            key={opt}
                            className={cn("px-3 py-2 text-sm cursor-pointer hover:opacity-80", t.text, value === opt && "bg-black/5")}
                            onClick={(e) => {
                                e.stopPropagation()
                                onChange(opt)
                                setIsOpen(false)
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

const FontInput = ({ value, onChange, t }: { value: string, onChange: (val: string) => void, t: ThemeStyles }) => (
    <div className={cn("border-b pb-2", t.accent || "border-blue-500")}>
        <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn("w-full bg-transparent outline-none text-[15px]", t.textSec)}
        />
    </div>
)
