"use client"

import React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Trash2,
    X,
    Download,
    Layers,
    Plus,
    ArrowLeft,
    LayoutTemplate,
    ZoomIn,
    ZoomOut,
    Maximize,
    Palette,
    Coins,
    ImageIcon,
    Settings2
} from "lucide-react"
import { DocumentRenderer } from "./DocumentRenderer"
import { createDocument, updateDocument, getDocumentTemplates, deleteDocumentTemplate } from "@/app/actions/financial-documents"
import { getUserData } from "@/app/actions/settings"
import { getSettingsData } from "@/app/actions/get-settings"
import { getProjectById } from "@/app/actions/projects"
import { toast } from "sonner"
import { useCurrency } from "@/components/CurrencyUtils"
import { format } from "date-fns"
import { type BlockData, type DocumentSettings } from "./DocumentBlocks"
import { uploadProjectMedia } from "@/app/actions/projects"
import { Loader2 } from "lucide-react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Block {
    id: string
    type: string
    data: BlockData
}

interface Template {
    id: string
    name: string
    type?: string
    created_at?: string
    content: {
        blocks: Block[]
        settings?: DocumentSettings
    }
}

interface DocumentBuilderProps {
    projectId: string
    type: 'invoice' | 'receipt' | 'billing'
    initialData?: {
        id?: string
        identifier?: string
        status?: string
        issued_at?: string
        due_date?: string
        client_name?: string
        items?: Array<{
            description: string
            details?: string
            quantity: number
            price: number
        }>
        content?: {
            blocks: Block[]
            settings?: DocumentSettings
        }
    }
    onClose: () => void
    onSave?: () => void
}

const DEFAULT_BLOCKS: Block[] = [
    { id: '1', type: 'header', data: {} },
    { id: '2', type: 'spacer', data: {} },
    { id: '3', type: 'items', data: { items: [{ description: 'Serviço de Design', quantity: 1, price: 0 }] } },
    { id: '4', type: 'totals', data: { tax_rate: 0 } },
    { id: '5', type: 'payment', data: { show_pix: true } }
]

const DEFAULT_SETTINGS: DocumentSettings = {
    primaryColor: '#2A4DD8',
    secondaryColor: '#70ff30',
    currency: 'AOA'
}

export function DocumentBuilder({ projectId, type, initialData, onClose, onSave }: DocumentBuilderProps) {
    const { currencyCode } = useCurrency()
    const [blocks, setBlocks] = React.useState<Block[]>(initialData?.content?.blocks || DEFAULT_BLOCKS)
    const [isSaving, setIsSaving] = React.useState(false)
    const [templates, setTemplates] = React.useState<Template[]>([])
    const [activeTab, setActiveTab] = React.useState<'design' | 'templates'>('design')
    const [identifier, setIdentifier] = React.useState(initialData?.identifier || `${type.toUpperCase()[0]}AT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
    const [zoom, setZoom] = React.useState(0.8)
    const [userRole, setUserRole] = React.useState<string | null>(null)
    const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
    const logoInputRef = React.useRef<HTMLInputElement>(null)
    const documentRef = React.useRef<HTMLDivElement>(null)
    const [settings, setSettings] = React.useState<DocumentSettings>(
        initialData?.content?.settings || DEFAULT_SETTINGS
    )

    React.useEffect(() => {
        const fetchEssentialData = async () => {
            const [uData, sData, pData] = await Promise.all([
                getUserData(),
                getSettingsData(),
                getProjectById(projectId)
            ])

            if (uData) {
                // @ts-expect-error - property exists in db
                setUserRole(uData.role_global)
            }

            // Pre-fill / Sync blocks
            const headerBlock = blocks.find(b => b.type === 'header')
            if (headerBlock) {
                const workspaceName = sData?.workspace?.name || uData?.name || ''
                const userName = uData?.name || ''
                const userEmail = uData?.email || ''

                // Client name logic: Existing invoice name > Brand Name > Empty
                const clientName = initialData?.client_name || pData?.brand?.name || ''
                const projectIdentifier = pData?.identifier || initialData?.identifier || ''

                const currentToInfo = headerBlock.data.to_info
                const isPlaceholder = !currentToInfo || currentToInfo === "Nome do Cliente" || currentToInfo === "Maria Eduarda"

                // Only update if it's a new document OR if it's currently a placeholder
                if (!initialData || isPlaceholder) {
                    handleUpdateBlock(headerBlock.id, {
                        ...headerBlock.data,
                        from_info: headerBlock.data.from_info || `${workspaceName}\n${userName}\n${userEmail}`,
                        to_info: clientName,
                        to_address: headerBlock.data.to_address || (projectIdentifier ? `Referência: ${projectIdentifier}` : ''),
                        to_label: "PARA:",
                        from_label: "DE:",
                        doc_num: initialData?.identifier || identifier,
                        doc_date: initialData?.issued_at
                            ? format(new Date(initialData.issued_at), "dd/MM/yyyy")
                            : format(new Date(), "dd/MM/yyyy")
                    })
                }
            }

            // Items sync logic
            const itemsBlock = blocks.find(b => b.type === 'items')
            if (itemsBlock && initialData?.items && initialData.items.length > 0) {
                // Determine if the current internal items are empty or just placeholders
                const currentItems = itemsBlock.data.items || []
                const isItemPlaceholder = currentItems.length === 1 && (!currentItems[0].description || currentItems[0].description === "Serviço de Design" || currentItems[0].description === "Novo Serviço")

                if (isItemPlaceholder) {
                    handleUpdateBlock(itemsBlock.id, {
                        ...itemsBlock.data,
                        items: initialData.items.map((item) => ({
                            description: item.description,
                            details: item.details || "",
                            quantity: item.quantity,
                            price: item.price
                        }))
                    })
                }
            }

            // Sync settings for NEW documents
            if (!initialData) {
                if (pData?.currency) {
                    setSettings(prev => ({ ...prev, currency: pData.currency }))
                }
                if (pData?.identifier) {
                    setIdentifier(`${type.toUpperCase()[0]}AT-${pData.identifier}-${Math.floor(100 + Math.random() * 899)}`)
                }
            }
        }
        fetchEssentialData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectId, initialData, type])

    // Memoized Split Green template definition
    const getSplitGreenTemplate = React.useCallback((): Template => ({
        id: 'split_green_default',
        name: 'Split Green',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "LOGOTIPO\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi, Luanda - Angola",
                        to_info: initialData?.client_name || 'Bisnoteka'
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Nome do serviço', details: '', quantity: 1, price: 320000 }
                        ],
                        subtotal_display: '320.000,00',
                        tax_display: '14%',
                        total_display: '364.800,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        terms: "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão."
                    }
                }
            ],
            settings: {
                theme: 'split-green',
                primaryColor: '#2D3748',
                secondaryColor: '#84CC16',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Modern Pink template definition
    const getModernPinkTemplate = React.useCallback((): Template => ({
        id: 'modern_pink_default',
        name: 'Modern Pink',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        to_info: initialData?.client_name || 'Bisnoteka'
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Nome do serviço', details: '', quantity: 2, price: 320000 }
                        ],
                        subtotal_display: '640.000,00',
                        tax_display: '14%',
                        total_display: '729.600,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1"
                    }
                }
            ],
            settings: {
                theme: 'modern-pink',
                primaryColor: '#FF007A',
                secondaryColor: '#FFFFFF',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Vertical Green template definition
    const getVerticalGreenTemplate = React.useCallback((): Template => ({
        id: 'vertical_green_default',
        name: 'Vertical Green',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "LOGOTIPO\nFrancisca Paula\nRua 12, Bairro Alto, Luanda",
                        to_info: initialData?.client_name || 'Bisnoteka'
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'SERVIÇO DESIGN', details: '', quantity: 1, price: 750000 }
                        ],
                        subtotal_display: '750.000,00',
                        tax_display: '14%',
                        total_display: '855.000,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1"
                    }
                }
            ],
            settings: {
                theme: 'vertical-green',
                primaryColor: '#16423C',
                secondaryColor: '#84CC16',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Green Highlight template definition
    const getGreenHighlightTemplate = React.useCallback((): Template => ({
        id: 'green_highlight_default',
        name: 'Green Highlight',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "Arkhus Design\nRua 14, Bairro Alto, Luanda",
                        to_info: initialData?.client_name || 'Bisnoteka'
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Branding Project', details: '', quantity: 1, price: 1200000 }
                        ],
                        subtotal_display: '1.200.000,00',
                        tax_display: '14%',
                        total_display: '1.368.000,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1"
                    }
                }
            ],
            settings: {
                theme: 'green-highlight',
                primaryColor: '#16423C',
                secondaryColor: '#84CC16',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Modern Orange template definition
    const getModernOrangeTemplate = React.useCallback((): Template => ({
        id: 'modern_orange_default',
        name: 'Modern Orange',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "Arkhus Design\n+244 921 547 214\ninfo@arkhus.design",
                        to_info: initialData?.client_name || 'Bisnoteka'
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Social Media Design', details: '', quantity: 5, price: 50000 }
                        ],
                        subtotal_display: '250.000,00',
                        tax_display: '14%',
                        total_display: '285.000,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1"
                    }
                }
            ],
            settings: {
                theme: 'modern-orange',
                primaryColor: '#F97316',
                secondaryColor: '#FFFFFF',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Split Blue template definition (Strictly following the image)
    const getSplitBlueTemplate = React.useCallback((): Template => ({
        id: 'split_blue_default',
        name: 'Split Blue',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "Francisca Paula\n+244 925 987 362\nfranciscapaula@gmail.com\nRua 12, Bairro Alto, Luanda"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 2, price: 320000 }
                        ],
                        subtotal_display: '2.560.000,00',
                        tax_display: '14%',
                        total_display: '2.918.400,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        terms: "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão."
                    }
                }
            ],
            settings: {
                theme: 'split-blue',
                primaryColor: '#1D437A',
                secondaryColor: '#FFFFFF',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier])

    // Memoized Simple Red template definition (Strictly following the image)
    const getSimpleRedTemplate = React.useCallback((): Template => ({
        id: 'simple_red_default',
        name: 'Simple Red',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'Maria Eduarda',
                        to_address: 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "LOGOTIPOEMPRESA\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi, Luanda - Angola",
                        company_website: "www.nomedaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 3, price: 421997 },
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 3, price: 421997 },
                            { description: 'Nome do serviço', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 3, price: 421997 }
                        ],
                        subtotal_display: '3.425.982,00',
                        tax_display: '14%',
                        total_display: '3.905.619,48'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        footer_email: "info@nomedaempresa.com",
                        terms: "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão."
                    }
                }
            ],
            settings: {
                theme: 'simple-red',
                primaryColor: '#A13B3B', // Deep Red
                secondaryColor: '#FFFFFF',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Mono Chrome template definition (Strictly following the image)
    const getMonoChromeTemplate = React.useCallback((): Template => ({
        id: 'mono_chrome_default',
        name: 'Mono Chrome',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'Arkhus',
                        to_address: 'Rua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        from_info: "LOGOTIPOEMPRESA\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi, Luanda - Angola",
                        company_website: "www.nomedaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'Nome do serviço', details: '', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: '', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: '', quantity: 2, price: 320000 },
                            { description: 'Nome do serviço', details: '', quantity: 2, price: 320000 }
                        ],
                        subtotal_display: '2.560.000,00',
                        tax_display: '14%',
                        total_display: '2.918.400,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        footer_message: "Obrigado pela sua preferência",
                        terms: "Documento serve como comprovativo de prestação de serviços."
                    }
                }
            ],
            settings: {
                theme: 'mono-chrome',
                primaryColor: '#212529',
                secondaryColor: '#E5E7EB',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Elegant Dark template definition (Strictly following the image)
    const getElegantDarkTemplate = React.useCallback((): Template => ({
        id: 'elegant_dark_default',
        name: 'Elegant Dark',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'Sra. MARIA EDUARDA',
                        to_address: 'Gestora de contas e Planejadora na Kriativus',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        doc_account: "0145 4125 2145 1",
                        from_info: "LOGOTIPOEMPRESA\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola",
                        company_website: "www.nomedaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'SERVIÇO DIGITAL', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 4, price: 640000 }
                        ],
                        subtotal_display: '2.560.000,00',
                        tax_display: '14%',
                        total_display: '2.918.400,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        terms: "Documento serve como comprovativo de prestação de serviços.",
                        footer_message: "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão"
                    }
                }
            ],
            settings: {
                theme: 'elegant-dark',
                primaryColor: '#EB6B41', // Coral/Orange
                secondaryColor: '#1B2533',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Minimal Premium template definition (Strictly following the image)
    const getMinimalPremiumTemplate = React.useCallback((): Template => ({
        id: 'minimal_premium_default',
        name: 'Minimal Premium',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'Sra. MARIA EDUARDA',
                        to_address: 'Gestora de contas e\nPlanejadora na Kriativus',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        doc_account: "01} 4567 8901 2",
                        from_info: "LOGOTIPOEMPRESA\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola",
                        company_website: "www.nomedaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'SERVIÇO DESIGN', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 4, price: 640000 }
                        ],
                        subtotal_display: '2.560.000,00',
                        tax_display: '14%',
                        total_display: '2.918.400,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        terms: "Documento serve como comprovativo de prestação de serviços.",
                        footer_message: "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão",
                        footer_email: "info@nomedaempresa.com"
                    }
                }
            ],
            settings: {
                theme: 'minimal-premium',
                primaryColor: '#FACC15', // Vibrant Yellow
                secondaryColor: '#333333',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Premium Dark template definition (Strictly following the image)
    const getPremiumDarkTemplate = React.useCallback((): Template => ({
        id: 'premium_dark_default',
        name: 'Premium Dark',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'Sra. MARIA EDUARDA',
                        to_address: 'Gestora de contas e\nPlanejadora na Kriativus',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        doc_account: "0123 4567 8901 2",
                        from_info: "LOGOTIPOEMPRESA\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola",
                        company_website: "www.nomedaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'SERVIÇO DESIGN', details: 'Desenvolvimento de interface e experiência do usuário (UI/UX).', quantity: 1, price: 640000 }
                        ],
                        subtotal_display: '640.000,00',
                        tax_display: '14%',
                        total_display: '729.600,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Arkhus LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        terms: "Documento serve como comprovativo de prestação de serviços.",
                        footer_message: "A expressão Lorem ipsum em design gráfico e editoração é um texto padrão"
                    }
                }
            ],
            settings: {
                theme: 'modern-dark',
                primaryColor: '#FACC15', // Vibrant Yellow
                secondaryColor: '#1A1A1A',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Arkhus template definition (Classic Blueprint)
    const getArkhusTemplate = React.useCallback((): Template => ({
        id: 'arkhus_default',
        name: 'Arkhus Design',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'Nome do Cliente',
                        to_address: 'Morada do Cliente',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        doc_account: "123 456",
                        from_info: "Sua Empresa LDA\nRua 14, bairro alto,\nDistrito Urbano de Kinaxixi,\nLuanda - Angola",
                        company_website: "www.suaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'SERVIÇO DESIGN', details: 'A expressão Lorem ipsum em design gráfico e editoração é um texto padrão', quantity: 1, price: 750000 }
                        ],
                        subtotal_display: '750.000,00',
                        tax_display: '0%',
                        total_display: '750.000,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Sua Empresa LDA",
                        bank_account: "0145 4125 2145 1",
                        bank_iban: "AO06 0145 4125 2145 1475 5123 1",
                        terms: "Documento de fidelidade total."
                    }
                }
            ],
            settings: {
                theme: 'arkhus',
                primaryColor: '#2A4DD8',
                secondaryColor: '#70ff30',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    // Memoized Modern Sidebar template definition
    const getModernSidebarTemplate = React.useCallback((): Template => ({
        id: 'modern_sidebar_default',
        name: 'Modern Sidebar',
        type: type,
        content: {
            blocks: [
                {
                    id: 'h1', type: 'header', data: {
                        to_info: initialData?.client_name || 'NOME DO CLIENTE',
                        to_address: 'Endereço do cliente...',
                        doc_num: identifier,
                        doc_date: format(new Date(), "dd/MM/yyyy"),
                        doc_account: "0000 0000 0000 0000",
                        from_info: "Sua Empresa LDA\nRua Exemplo, 123, Luanda",
                        company_website: "www.suaempresa.com"
                    }
                },
                {
                    id: 'i1', type: 'items', data: {
                        items: [
                            { description: 'SERVIÇO DIGITAL', details: 'Desenvolvimento e design de interface conforme especificações.', quantity: 1, price: 1250000 }
                        ],
                        subtotal_display: '1.250.000,00',
                        tax_display: '0,00',
                        total_display: '1.250.000,00'
                    }
                },
                {
                    id: 'p1', type: 'payment', data: {
                        bank_holder: "Sua Empresa LDA",
                        bank_account: "0123 4567 8901 2",
                        bank_iban: "AO06 0123 4567 8901 2345 6789 1",
                        terms: "Este documento serve como comprovativo de prestação de serviços. O pagamento deve ser efectuado no prazo de 15 dias úteis."
                    }
                }
            ],
            settings: {
                theme: 'sidebar',
                primaryColor: '#EE6D2D',
                secondaryColor: '#EE6D2D',
                sidebarColor: '#FFDECB',
                currency: 'AOA'
            }
        },
        created_at: new Date().toISOString()
    }), [type, identifier, initialData])

    React.useEffect(() => {
        const fetchTemplates = async () => {
            const data = await getDocumentTemplates(type)
            setTemplates(data)
        }
        fetchTemplates()
    }, [type])

    // Compute active templates list for display
    const activeTemplates = React.useMemo(() => {
        return [
            getSplitGreenTemplate(),
            getModernPinkTemplate(),
            getVerticalGreenTemplate(),
            getGreenHighlightTemplate(),
            getModernOrangeTemplate(),
            getSplitBlueTemplate(),
            getSimpleRedTemplate(),
            getMonoChromeTemplate(),
            getElegantDarkTemplate(),
            getMinimalPremiumTemplate(),
            getPremiumDarkTemplate(),
            getArkhusTemplate(),
            getModernSidebarTemplate(),
            ...templates
        ]
    }, [templates, getArkhusTemplate, getModernSidebarTemplate, getPremiumDarkTemplate, getMinimalPremiumTemplate, getElegantDarkTemplate, getMonoChromeTemplate, getSimpleRedTemplate, getSplitBlueTemplate, getModernOrangeTemplate, getGreenHighlightTemplate, getVerticalGreenTemplate, getModernPinkTemplate, getSplitGreenTemplate])

    // Extract block data for dependency tracking
    const itemsBlockData = blocks.find(b => b.type === 'items')?.data?.items
    const taxDisplay = blocks.find(b => b.type === 'payment')?.data?.tax_display || blocks.find(b => b.type === 'items')?.data?.tax_display
    const discountDisplay = blocks.find(b => b.type === 'payment')?.data?.discount_display

    // Auto-calculate totals from items, taxes and discounts
    React.useEffect(() => {
        const itemsBlock = blocks.find(b => b.type === 'items')
        const paymentBlock = blocks.find(b => b.type === 'payment')

        if (!itemsBlock?.data?.items) return

        const items = itemsBlock.data.items as Array<{ quantity: number; price: number }>
        const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.price), 0)

        // Get tax and discount percentages checking multiple possible blocks for theme compatibility
        const taxStr = paymentBlock?.data?.tax_display || itemsBlock.data.tax_display || '0%'
        const discountStr = paymentBlock?.data?.discount_display || '0%'
        const taxRate = parseFloat(taxStr.replace('%', '')) || 0
        const discountRate = parseFloat(discountStr.replace('%', '')) || 0

        // Calculate: subtotal + tax - discount
        const taxAmount = subtotal * (taxRate / 100)
        const discountAmount = subtotal * (discountRate / 100)
        const total = subtotal + taxAmount - discountAmount

        // Format the values
        const formatValue = (val: number) => {
            return `${settings.currency || 'AOA'} ${val.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }

        const subStr = formatValue(subtotal)
        const totalStr = formatValue(total)

        // Update blocks with calculated values to ensure consistency across ANY theme
        setBlocks(prev => prev.map(b => {
            if (b.type === 'header') {
                return { ...b, data: { ...b.data, total_display: totalStr } }
            }
            if (b.type === 'items') {
                return { ...b, data: { ...b.data, subtotal_display: subStr, total_display: totalStr } }
            }
            if (b.type === 'payment') {
                return { ...b, data: { ...b.data, subtotal_display: subStr, total_display: totalStr } }
            }
            return b
        }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemsBlockData, taxDisplay, discountDisplay, settings.currency])

    const handleUpdateBlock = (id: string, data: BlockData) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, data } : b))
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // Calculate total from blocks (Syncing with the auto-calculate logic)
            const itemsBlock = blocks.find(b => b.type === 'items')
            const paymentBlock = blocks.find(b => b.type === 'payment')
            const items = itemsBlock?.data?.items || []
            const subtotal = items.reduce((acc: number, item: { quantity: number; price: number }) => acc + (item.quantity * item.price), 0)

            const taxStr = paymentBlock?.data?.tax_display || '0%'
            const discountStr = paymentBlock?.data?.discount_display || '0%'
            const taxRate = parseFloat(taxStr.replace('%', '')) || 0
            const discountRate = parseFloat(discountStr.replace('%', '')) || 0

            const taxAmount = subtotal * (taxRate / 100)
            const discountAmount = subtotal * (discountRate / 100)
            const amount = subtotal + taxAmount - discountAmount

            const documentData = {
                project_id: projectId,
                identifier,
                amount,
                currency: settings.currency || currencyCode || 'EUR',
                content: { blocks, settings },
                status: initialData?.status || (type === 'invoice' ? 'draft' : 'paid'),
                // Specific fields for tables
                client_name: blocks.find(b => b.type === 'header')?.data?.to_info?.split('\n')[0] || '',
                client_email: '',
                payment_method: type === 'receipt' ? 'transfer' : undefined,
                items: type === 'invoice' ? items : undefined
            }

            let result
            if (initialData?.id) {
                result = await updateDocument(initialData.id, type, documentData)
            } else {
                result = await createDocument(type, documentData)
            }

            if (result.success) {
                toast.success(`${type === 'invoice' ? 'Fatura' : type === 'receipt' ? 'Recibo' : 'Cobrança'} salva com sucesso`)
                onSave?.()
                onClose()
            } else {
                toast.error(result.error || "Erro ao salvar")
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro inesperado")
        } finally {
            setIsSaving(false)
        }
    }

    const applyTemplate = (template: Template) => {
        // Find current data to preserve
        const currentHeader = blocks.find(b => b.type === 'header')?.data || {}
        const currentItems = blocks.find(b => b.type === 'items')?.data || {}
        const currentPayment = blocks.find(b => b.type === 'payment')?.data || {}

        const newBlocks = template.content.blocks.map(b => {
            if (b.type === 'header') {
                return {
                    ...b,
                    data: {
                        ...b.data,
                        to_info: currentHeader.to_info || b.data.to_info,
                        to_address: currentHeader.to_address || b.data.to_address,
                        from_info: currentHeader.from_info || b.data.from_info,
                        doc_num: currentHeader.doc_num || identifier,
                        doc_date: currentHeader.doc_date || (initialData?.issued_at ? format(new Date(initialData.issued_at), "dd/MM/yyyy") : format(new Date(), "dd/MM/yyyy")),
                        doc_account: currentHeader.doc_account || b.data.doc_account,
                        company_website: currentHeader.company_website || b.data.company_website,
                        total_display: currentHeader.total_display || b.data.total_display
                    }
                }
            }
            if (b.type === 'items') {
                return {
                    ...b,
                    data: {
                        ...b.data,
                        items: currentItems.items && currentItems.items.length > 0 ? currentItems.items : b.data.items,
                        subtotal_display: currentItems.subtotal_display || b.data.subtotal_display,
                        tax_display: currentItems.tax_display || b.data.tax_display,
                        total_display: currentItems.total_display || b.data.total_display
                    }
                }
            }
            if (b.type === 'payment') {
                return {
                    ...b,
                    data: {
                        ...b.data,
                        bank_holder: currentPayment.bank_holder || b.data.bank_holder,
                        bank_account: currentPayment.bank_account || b.data.bank_account,
                        bank_iban: currentPayment.bank_iban || b.data.bank_iban,
                        terms: currentPayment.terms || b.data.terms,
                        signature_name: currentPayment.signature_name || b.data.signature_name,
                        signature_role: currentPayment.signature_role || b.data.signature_role,
                        footer_message: currentPayment.footer_message || b.data.footer_message
                    }
                }
            }
            return b
        })

        // Force theme update by being explicit
        const templateSettings = (template.content.settings || {}) as DocumentSettings
        setSettings(prev => ({
            ...prev,
            ...templateSettings,
            theme: templateSettings.theme || 'arkhus',
            logoUrl: prev.logoUrl || templateSettings.logoUrl,
            currency: prev.currency || templateSettings.currency || 'AOA'
        }))

        setBlocks(newBlocks)
        toast.success(`Template "${template.name}" aplicado!`)
    }

    const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (confirm("Tem certeza que deseja excluir este template permanentemente?")) {
            const result = await deleteDocumentTemplate(templateId)
            if (result.success) {
                toast.success("Template excluído com sucesso")
                setTemplates(prev => prev.filter(t => t.id !== templateId))
            } else {
                toast.error("Erro ao excluir template")
            }
        }
    }

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.3), 2))
    }

    const handleWheel = (e: React.WheelEvent) => {
        if (e.shiftKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.05 : 0.05
            handleZoom(delta)
        }
    }

    const handleLogoClick = () => {
        logoInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploadingLogo(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const result = await uploadProjectMedia(file)
            if (result.success && result.url) {
                setSettings(prev => ({ ...prev, logoUrl: result.url }))
                toast.success("Logotipo enviado com sucesso")
            } else {
                toast.error(result.error || "Erro ao enviar logotipo")
            }
        } catch (error) {
            console.error("Logo upload error:", error)
            toast.error("Erro inesperado ao enviar logotipo")
        } finally {
            setIsUploadingLogo(false)
        }
    }

    const handleExportPDF = async () => {
        if (!documentRef.current) return

        const toastId = toast.loading("Preparando documento de alta fidelidade...")

        try {
            const originalElement = documentRef.current

            // 1. Create a deep clone
            const clone = originalElement.cloneNode(true) as HTMLElement

            // 2. Setup a temporary container with the same theme context
            const container = document.createElement('div')
            container.className = "dark" // Maintain theme variables
            container.style.position = 'absolute'
            container.style.left = '-9999px'
            container.style.top = '0'
            container.style.width = '1150px'
            container.style.backgroundColor = settings.primaryColor || '#2A4DD8'
            document.body.appendChild(container)
            container.appendChild(clone)

            // 3. Clean up UI elements
            const elementsToRemove = clone.querySelectorAll('button, .group-hover\\:opacity-100, .transition-opacity, .absolute.top-4.right-4')
            elementsToRemove.forEach(el => el.remove())

            // 4. Enhanced conversion of inputs to static text (preserving colors and size)
            const inputs = clone.querySelectorAll('input')
            inputs.forEach((input, i) => {
                const originalInput = originalElement.querySelectorAll('input')[i]
                if (originalInput) {
                    const span = document.createElement('span')
                    span.textContent = originalInput.value
                    const styles = window.getComputedStyle(originalInput)

                    // Explicitly copy essential visual styles
                    span.style.color = styles.color
                    span.style.fontSize = styles.fontSize
                    span.style.fontWeight = styles.fontWeight
                    span.style.fontFamily = styles.fontFamily
                    span.style.lineHeight = styles.lineHeight
                    span.style.textAlign = styles.textAlign
                    span.style.padding = styles.padding
                    span.style.display = 'inline-block'
                    span.style.width = '100%'
                    span.style.backgroundColor = 'transparent'

                    input.parentNode?.replaceChild(span, input)
                }
            })

            const textareas = clone.querySelectorAll('textarea')
            textareas.forEach((textarea, i) => {
                const originalTextarea = originalElement.querySelectorAll('textarea')[i]
                if (originalTextarea) {
                    const pre = document.createElement('pre')
                    pre.textContent = originalTextarea.value
                    const styles = window.getComputedStyle(originalTextarea)

                    pre.style.color = styles.color
                    pre.style.fontSize = styles.fontSize
                    pre.style.fontWeight = styles.fontWeight
                    pre.style.fontFamily = styles.fontFamily
                    pre.style.lineHeight = styles.lineHeight
                    pre.style.whiteSpace = 'pre-wrap'
                    pre.style.padding = styles.padding
                    pre.style.backgroundColor = 'transparent'
                    pre.style.width = '100%'
                    pre.style.overflow = 'visible'

                    textarea.parentNode?.replaceChild(pre, textarea)
                }
            })

            // 5. Normalise for capture
            clone.style.transform = 'none'
            clone.style.margin = '0'
            clone.style.boxShadow = 'none'
            clone.style.width = '1150px'
            clone.style.height = 'auto'

            toast.loading("Capturando PDF (Processamento Pesado)...", { id: toastId })

            // 6. Capture the full height
            const canvas = await html2canvas(clone, {
                scale: 2,
                useCORS: true,
                allowTaint: false,
                backgroundColor: settings.primaryColor || '#2A4DD8',
                logging: false,
                width: 1150,
                // Force full height capture
                height: clone.scrollHeight || clone.offsetHeight
            })

            document.body.removeChild(container)

            // 7. Generate PDF with dynamic height
            toast.loading("Otimizando PDF...", { id: toastId })

            const imgData = canvas.toDataURL('image/png', 1.0)

            // Calculate dimensions
            const canvasWidth = canvas.width / 2
            const canvasHeight = canvas.height / 2

            // Standard A4 width is 210mm. We calculate proportional height.
            const pdfWidth = 210
            const pdfHeight = (canvasHeight * pdfWidth) / canvasWidth

            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: [pdfWidth, pdfHeight] // Dynamic size based on content height
            })

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
            pdf.save(`${identifier}.pdf`)

            toast.success("PDF gerado com altura real e fidelidade total", { id: toastId })
        } catch (error) {
            console.error("PDF Export Error:", error)
            toast.error("Erro crítico na geração do PDF", { id: toastId })
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-[#0A0A0B] flex flex-col font-inter overflow-hidden dark text-white">
            {/* Header */}
            <div className="h-16 border-b border-[#1F1F23] flex items-center justify-between px-6 bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="h-4 w-[1px] bg-gray-800" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-[#EF0050] uppercase tracking-widest">
                                {type === 'invoice' ? 'Fatura' : type === 'receipt' ? 'Recibo' : 'Cobrança'} Builder
                            </span>
                            <span className="text-[10px] text-gray-600 font-bold px-2 py-0.5 border border-gray-800 rounded-full">BETA</span>
                        </div>
                        <input
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="text-white text-sm font-bold bg-transparent border-none outline-none focus:ring-0 p-0"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white text-xs font-bold gap-2"
                        onClick={handleExportPDF}
                    >
                        <Download className="w-4 h-4" />
                        Exportar PDF
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[#EF0050] hover:bg-[#EF0050]/90 text-white text-xs font-black uppercase tracking-widest px-6 rounded-full shadow-lg shadow-[#EF0050]/20"
                    >
                        {isSaving ? 'Salvando...' : 'Salvar Documento'}
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Templates & Blocks */}
                <div className="w-[320px] border-r border-[#1F1F23] bg-[#0C0C0E] flex flex-col">
                    <div className="p-4 border-b border-[#1F1F23] flex gap-2">
                        <button
                            onClick={() => setActiveTab('design')}
                            className={cn(
                                "flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'design' ? "bg-[#EF0050] text-white" : "bg-white/5 text-gray-500 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Layers className="w-3 h-3" />
                                Blocos
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={cn(
                                "flex-1 h-9 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                activeTab === 'templates' ? "bg-[#EF0050] text-white" : "bg-white/5 text-gray-500 hover:bg-white/10"
                            )}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <LayoutTemplate className="w-3 h-3" />
                                Templates
                            </div>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {activeTab === 'design' ? (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-4">Estrutura do Documento</h3>
                                    <div className="space-y-2">
                                        {blocks.map((block, idx) => (
                                            <div key={block.id} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#EF0050]/30 transition-all cursor-move">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-md bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-xs font-bold text-white uppercase tracking-tight">{block.type}</span>
                                                </div>
                                                <button className="text-gray-600 hover:text-[#EF0050] opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <Button variant="ghost" className="w-full mt-4 border border-dashed border-gray-800 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:border-[#EF0050]/50 hover:text-[#EF0050]">
                                        <Plus className="w-4 h-4" />
                                        Novo Bloco
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {activeTemplates.length === 0 ? (
                                    <div className="text-center py-12">
                                        <LayoutTemplate className="w-8 h-8 text-gray-800 mx-auto mb-3" />
                                        <p className="text-xs text-gray-500">Nenhum template encontrado.</p>
                                    </div>
                                ) : (
                                    activeTemplates.map(template => {
                                        return (
                                            <div
                                                key={template.id}
                                                onClick={() => applyTemplate(template)}
                                                className="group relative h-[418px] rounded-xl bg-white/5 border border-white/5 hover:border-[#EF0050] transition-all cursor-pointer overflow-hidden p-0"
                                            >
                                                <div
                                                    className="absolute inset-0 bg-cover bg-top"
                                                    style={{
                                                        backgroundImage: `url('${template.id === 'modern_sidebar_default' || template.content.settings?.theme === 'sidebar'
                                                            ? '/assets/templates/template02.png'
                                                            : template.id === 'premium_dark_default' || template.content.settings?.theme === 'modern-dark'
                                                                ? '/assets/templates/template03.png'
                                                                : template.id === 'minimal_premium_default' || template.content.settings?.theme === 'minimal-premium'
                                                                    ? '/assets/templates/template04.png'
                                                                    : template.id === 'elegant_dark_default' || template.content.settings?.theme === 'elegant-dark'
                                                                        ? '/assets/templates/template05.png'
                                                                        : template.id === 'mono_chrome_default' || template.content.settings?.theme === 'mono-chrome'
                                                                            ? '/assets/templates/template06.png'
                                                                            : template.id === 'simple_red_default' || template.content.settings?.theme === 'simple-red'
                                                                                ? '/assets/templates/template07.png'
                                                                                : template.id === 'split_blue_default' || template.content.settings?.theme === 'split-blue'
                                                                                    ? '/assets/templates/template08.png'
                                                                                    : template.id === 'modern_orange_default' || template.content.settings?.theme === 'modern-orange'
                                                                                        ? '/assets/templates/template09.png'
                                                                                        : template.id === 'green_highlight_default' || template.content.settings?.theme === 'green-highlight'
                                                                                            ? '/assets/templates/template10.png'
                                                                                            : template.id === 'vertical_green_default' || template.content.settings?.theme === 'vertical-green'
                                                                                                ? '/assets/templates/template11.png'
                                                                                                : template.id === 'modern_pink_default' || template.content.settings?.theme === 'modern-pink'
                                                                                                    ? '/assets/templates/template12.png'
                                                                                                    : template.id === 'split_green_default' || template.content.settings?.theme === 'split-green'
                                                                                                        ? '/assets/templates/template13.png'
                                                                                                        : '/assets/templates/default-invoice-template.png'
                                                            }')`
                                                    }}
                                                />

                                                <div className="absolute inset-0 bg-[#EF0050]/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-white text-[10px] font-black uppercase tracking-widest">Usar Template</span>
                                                </div>

                                                {userRole === 'admin' && (
                                                    <button
                                                        onClick={(e) => handleDeleteTemplate(template.id, e)}
                                                        className="absolute top-4 right-4 z-[40] p-2.5 bg-black/50 hover:bg-red-600 text-white rounded-xl backdrop-blur-xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100 shadow-2xl"
                                                        title="Excluir Template"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}

                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-widest block bg-black/80 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10 shadow-2xl">{template.name}</span>
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content - Canvas */}
                <div
                    className="flex-1 bg-[#121214] overflow-auto p-16 custom-scrollbar flex flex-col items-center"
                    onWheel={handleWheel}
                >
                    {/* A4 Page Container */}
                    <div
                        ref={documentRef}
                        className="w-[1150px] min-h-[1806px] flex flex-col relative mb-20 origin-top transition-transform duration-200"
                        style={{
                            transform: `scale(${zoom})`,
                            backgroundColor: settings.theme === 'sidebar' ? '#FFFFFF' :
                                settings.theme === 'modern-dark' ? '#1A1A1A' :
                                    settings.theme === 'minimal-premium' ? '#F3F4F6' :
                                        settings.theme === 'elegant-dark' ? '#111827' :
                                            settings.theme === 'mono-chrome' ? '#E5E7EB' :
                                                settings.theme === 'simple-red' ? '#F9FBFF' :
                                                    settings.theme === 'split-blue' ? '#FFFFFF' :
                                                        settings.theme === 'modern-orange' ? '#FFFFFF' :
                                                            settings.theme === 'green-highlight' ? '#FFFFFF' :
                                                                settings.theme === 'vertical-green' ? '#FFFFFF' :
                                                                    settings.theme === 'modern-pink' ? '#1E2129' :
                                                                        settings.theme === 'split-green' ? '#FFFFFF' :
                                                                            (settings.primaryColor || '#2A4DD8')
                        }}
                    >

                        <div className="flex-1 pt-[35px] px-[35px] flex flex-col relative z-10" style={{
                            '--primary-color': settings.primaryColor,
                            '--secondary-color': settings.secondaryColor
                        } as React.CSSProperties}>
                            <DocumentRenderer
                                blocks={blocks}
                                onUpdateBlock={handleUpdateBlock}
                                settings={settings}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Settings */}
                <div className="w-[320px] border-l border-[#1F1F23] bg-[#0C0C0E] flex flex-col">
                    <div className="p-4 border-b border-[#1F1F23] flex items-center justify-between">
                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Configurações Gerais</h3>
                        <Settings2 className="w-4 h-4 text-gray-500" />
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* Colors */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Palette className="w-3 h-3" />
                                Identidade Visual
                            </h4>
                            <div className="grid grid-cols-1 gap-6">
                                {/* Primary Color */}
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Cor Principal</p>
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center p-1 relative overflow-hidden ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                                            <input
                                                type="color"
                                                value={settings.primaryColor}
                                                onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                            />
                                            <div
                                                className="w-full h-full rounded-lg shadow-inner"
                                                style={{ backgroundColor: settings.primaryColor }}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white font-mono font-black uppercase tracking-widest">{settings.primaryColor}</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Capa e Rodapé</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Secondary Color */}
                                <div className="space-y-3">
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Cor de Destaque</p>
                                    <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
                                        <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center p-1 relative overflow-hidden ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                                            <input
                                                type="color"
                                                value={settings.secondaryColor}
                                                onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                                                className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                            />
                                            <div
                                                className="w-full h-full rounded-lg shadow-inner"
                                                style={{ backgroundColor: settings.secondaryColor }}
                                            />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-white font-mono font-black uppercase tracking-widest">{settings.secondaryColor}</span>
                                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Tags e Detalhes</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sidebar Color - Only for sidebar theme */}
                            {settings.theme === 'sidebar' && (
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                        <Palette className="w-3 h-3" />
                                        Fundo Lateral
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition-colors group">
                                            <div className="w-10 h-10 rounded-xl bg-gray-900 border border-white/10 flex items-center justify-center p-1 relative overflow-hidden ring-2 ring-transparent group-hover:ring-white/10 transition-all">
                                                <input
                                                    type="color"
                                                    value={settings.sidebarColor || '#FFDECB'}
                                                    onChange={(e) => setSettings({ ...settings, sidebarColor: e.target.value })}
                                                    className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
                                                />
                                                <div
                                                    className="w-full h-full rounded-lg shadow-inner"
                                                    style={{ backgroundColor: settings.sidebarColor || '#FFDECB' }}
                                                />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white font-mono font-black uppercase tracking-widest">{settings.sidebarColor || '#FFDECB'}</span>
                                                <span className="text-[8px] text-gray-500 font-bold uppercase tracking-tight">Fundo da Barra Lateral</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logo */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon className="w-3 h-3" />
                                Logotipo
                            </h4>
                            <input
                                type="file"
                                ref={logoInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                            <div
                                onClick={handleLogoClick}
                                className={cn(
                                    "p-4 border-2 border-dashed rounded-xl bg-white/5 flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer group relative overflow-hidden",
                                    settings.logoUrl ? "border-white/10" : "border-white/5 hover:border-white/10"
                                )}
                            >
                                {isUploadingLogo ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <Loader2 className="w-6 h-6 text-[#EF0050] animate-spin" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Enviando...</span>
                                    </div>
                                ) : settings.logoUrl ? (
                                    <div className="relative group/logo w-full flex items-center justify-center py-4">
                                        <Image
                                            src={settings.logoUrl}
                                            width={200}
                                            height={64}
                                            className="max-h-16 object-contain w-auto h-auto"
                                            alt="Logo"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <span className="text-[9px] font-black text-white uppercase tracking-widest">Alterar Logo</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-400 transition-colors" />
                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Adicionar Logo</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Currency */}
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                <Coins className="w-3 h-3" />
                                Moeda e Localidade
                            </h4>
                            <Select
                                value={settings.currency}
                                onValueChange={(value) => setSettings({ ...settings, currency: value })}
                            >
                                <SelectTrigger className="w-full bg-white/5 border-white/5 h-12 rounded-xl text-xs font-bold focus:ring-0 focus:ring-offset-0">
                                    <SelectValue placeholder="Selecione a moeda" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#141416] border-white/10 text-white">
                                    <SelectItem value="AOA">Kwanza (AOA)</SelectItem>
                                    <SelectItem value="EUR">Euro (EUR)</SelectItem>
                                    <SelectItem value="USD">Dólar (USD)</SelectItem>
                                    <SelectItem value="BRL">Real (BRL)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="p-6 border-t border-[#1F1F23]">
                        <p className="text-[9px] text-gray-600 leading-relaxed text-center italic">
                            Todas as alterações são aplicadas instantaneamente ao seu documento.
                        </p>
                    </div>
                </div>

                {/* Floating Zoom Controls */}
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl z-50">
                    <button
                        onClick={() => handleZoom(-0.1)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                    <span className="text-[10px] font-black text-white w-12 text-center uppercase tracking-widest">
                        {Math.round(zoom * 100)}%
                    </span>
                    <div className="h-4 w-[1px] bg-white/10 mx-1" />
                    <button
                        onClick={() => handleZoom(0.1)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setZoom(0.8)}
                        className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
                        title="Reset Zoom"
                    >
                        <Maximize className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
