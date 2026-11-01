"use client"

import React, { useRef, useState } from "react"
import { ArrowDown, ArrowUp, Plus, Upload, X } from "lucide-react"
import { PanelActions, type BlockActions } from "./BlockContextBar"
import { ColorRow, Field, Hint, Range, Segmented, Title, Toggle, usePanelDrag } from "./panelControls"
import { useLogoUpload } from "./LogoShowcasePanel"
import { SOCIAL_MODES, socialId, type SocialMockupContent, type SocialMode, type resolveSocial } from "./socialMockup"

interface Props extends BlockActions {
    blockId: string
    content: SocialMockupContent
    resolved: ReturnType<typeof resolveSocial>
    onChange: (content: SocialMockupContent) => void
    onClose: () => void
}

type Tab = 'content' | 'profile' | 'look'
const Divider = () => <div className="h-px bg-[#333]" />

export const SocialMockupPanel = ({ blockId, content, resolved: s, onChange, onClose, ...actions }: Props) => {
    const drag = usePanelDrag()
    const upload = useLogoUpload(blockId)
    const [tab, setTab] = useState<Tab>('content')
    const fileRef = useRef<HTMLInputElement>(null)
    const target = useRef<{ kind: 'media' | 'highlight' | 'avatar', index?: number } | null>(null)

    const set = (patch: Partial<SocialMockupContent['settings']>) => onChange({ ...content, settings: { ...content.settings, ...patch } })
    const media = content.media
    const setMedia = (next: SocialMockupContent['media']) => onChange({ ...content, media: next })
    const story = s.mode === 'story' || s.mode === 'reel'

    const pick = (kind: 'media' | 'highlight' | 'avatar', index?: number) => { target.current = { kind, index }; fileRef.current?.click() }
    const onFile = async (file: File) => {
        const url = await upload(file)
        const t = target.current
        if (!url || !t) return
        if (t.kind === 'avatar') set({ avatarUrl: url })
        else if (t.kind === 'media') {
            if (t.index === undefined) setMedia([...media, { id: socialId(), url }])
            else setMedia(media.map((m, i) => i === t.index ? { ...m, url } : m))
        } else if (t.index !== undefined) {
            onChange({ ...content, highlights: content.highlights.map((h, i) => i === t.index ? { ...h, url } : h) })
        }
    }
    const move = (i: number, dir: -1 | 1) => {
        const j = i + dir
        if (j < 0 || j >= media.length) return
        const next = [...media];
        [next[i], next[j]] = [next[j], next[i]]
        setMedia(next)
    }

    return (
        <div
            className="w-[360px] max-h-[min(760px,calc(100vh-120px))] rounded-2xl overflow-hidden shadow-2xl flex flex-col bg-[#1F1F25] border border-white/5 text-[#97A1B3] text-sm animate-in fade-in zoom-in-95 duration-200"
            style={drag.style}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-[#FF0054] h-[50px] px-4 flex items-center justify-between cursor-move shrink-0 select-none" {...drag.header}>
                <span className="text-white font-medium text-lg">Rede social</span>
                <button type="button" className="w-5 h-5 rounded-full bg-black hover:bg-black/80 transition-colors shrink-0" onMouseDown={(e) => e.stopPropagation()} onClick={onClose}>
                    <span className="sr-only">Fechar</span>
                </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onFile(f) }} />

            <div className="px-4 pt-4 shrink-0">
                <Segmented value={tab} options={[{ id: 'content', label: 'Conteúdo' }, { id: 'profile', label: 'Perfil' }, { id: 'look', label: 'Aspeto' }]} onChange={setTab} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 custom-scrollbar">
                {tab === 'content' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Ecrã</Title>
                            <div className="grid grid-cols-5 gap-1">
                                {SOCIAL_MODES.map(m => (
                                    <button key={m.id} type="button" onClick={() => set({ mode: m.id as SocialMode })}
                                        className={`h-8 rounded text-[11px] font-semibold transition-colors ${s.mode === m.id ? 'bg-[#FF0054] text-white' : 'bg-[#16171C] hover:text-white'}`}>
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Title action={<span className="text-[10px] text-[#666]">{media.length} imagens</span>}>{story ? 'Stories' : 'Publicações'}</Title>
                            <div className="flex flex-col gap-1.5">
                                {media.map((m, i) => (
                                    <div key={m.id} className="flex items-center gap-2 bg-[#16171C] rounded-md p-1.5">
                                        <button type="button" title="Trocar a imagem" onClick={() => pick('media', i)} className="w-10 h-12 rounded overflow-hidden shrink-0 ring-1 ring-white/10 hover:ring-[#FF0054]">
                                            <img src={m.url} alt="" className="w-full h-full object-cover" />
                                        </button>
                                        {story
                                            ? <div className="flex-1 min-w-0"><Field value={m.caption || ''} placeholder="Texto no story (opcional)" onChange={(caption) => setMedia(media.map((x, j) => j === i ? { ...x, caption } : x))} /></div>
                                            : <span className="flex-1 text-[12px] truncate">Publicação {i + 1}</span>}
                                        <button type="button" title="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="text-[#666] hover:text-white disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                                        <button type="button" title="Descer" disabled={i === media.length - 1} onClick={() => move(i, 1)} className="text-[#666] hover:text-white disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                                        <button type="button" title="Remover" disabled={media.length <= 1} onClick={() => setMedia(media.filter((_, j) => j !== i))} className="text-[#666] hover:text-[#FF0054] disabled:opacity-20"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                            <button type="button" onClick={() => pick('media')}
                                className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                <Plus className="w-3.5 h-3.5" /> Adicionar imagem
                            </button>
                        </div>

                        {story && (
                            <>
                                <Divider />
                                <div className="flex flex-col gap-3">
                                    <Title>Reprodução</Title>
                                    <Toggle label="Avançar sozinho" checked={s.autoplay} onChange={(autoplay) => set({ autoplay })} />
                                    {s.autoplay && <Range label="Tempo de cada story" value={s.duration} min={2} max={15} unit=" s" onChange={(duration) => set({ duration })} />}
                                    <Toggle label="Setas de navegação" checked={s.showArrows} onChange={(showArrows) => set({ showArrows })} />
                                    <Toggle label="Recomeçar no fim (loop)" checked={s.loop} onChange={(loop) => set({ loop })} />
                                    <Hint>No editor, os stories param enquanto o rato está sobre o telemóvel.</Hint>
                                </div>
                            </>
                        )}

                        {(s.mode === 'post' || s.mode === 'reel') && (
                            <>
                                <Divider />
                                <div className="flex flex-col gap-2">
                                    <Title>Legenda e números</Title>
                                    {s.mode === 'post' && <Field value={s.caption} placeholder="Legenda" onChange={(caption) => set({ caption })} />}
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field value={s.likes} placeholder="Gostos" onChange={(likes) => set({ likes })} />
                                        <Field value={s.comments} placeholder="Comentários" onChange={(comments) => set({ comments })} />
                                    </div>
                                    {s.mode === 'reel' && <Field value={s.audio} placeholder="Áudio" onChange={(audio) => set({ audio })} />}
                                </div>
                            </>
                        )}
                    </>
                )}

                {tab === 'profile' && (
                    <>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => pick('avatar')} className="h-9 px-3 rounded-md bg-[#FF0054]/15 text-[#FF5C8D] hover:bg-[#FF0054]/25 text-[12px] font-medium flex items-center gap-1.5">
                                <Upload className="w-3.5 h-3.5" /> {s.avatarUrl ? 'Trocar avatar' : 'Carregar avatar'}
                            </button>
                            {s.avatarUrl && <button type="button" onClick={() => set({ avatarUrl: '' })} className="text-[11px] text-[#666] hover:text-white">Usar o símbolo</button>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Identidade</Title>
                            <Field value={s.handle} placeholder="Nome de utilizador" onChange={(handle) => set({ handle })} />
                            <Field value={s.name} placeholder="Nome" onChange={(name) => set({ name })} />
                            <Field value={s.category} placeholder="Categoria" onChange={(category) => set({ category })} />
                            <textarea value={s.bio} onChange={(e) => set({ bio: e.target.value })} rows={3} placeholder="Biografia"
                                className="w-full bg-[#1A1C23] border border-transparent focus:border-[#FF0054] rounded px-2 py-1.5 text-[13px] text-white outline-none resize-none" />
                            <Field value={s.link} placeholder="Link" onChange={(link) => set({ link })} />
                            <Toggle label="Conta verificada" checked={s.verified} onChange={(verified) => set({ verified })} />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Números</Title>
                            <div className="grid grid-cols-3 gap-2">
                                <Field value={s.posts} placeholder="Publicações" onChange={(posts) => set({ posts })} />
                                <Field value={s.followers} placeholder="Seguidores" onChange={(followers) => set({ followers })} />
                                <Field value={s.following} placeholder="A seguir" onChange={(following) => set({ following })} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Toggle label="Destaques" checked={s.showHighlights} onChange={(showHighlights) => set({ showHighlights })} />
                            {s.showHighlights && content.highlights.map((hl, i) => (
                                <div key={hl.id} className="flex items-center gap-2">
                                    <button type="button" title="Trocar a capa" onClick={() => pick('highlight', i)} className="w-9 h-9 rounded-full overflow-hidden shrink-0 ring-1 ring-white/10 hover:ring-[#FF0054]">
                                        <img src={hl.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                    <div className="flex-1"><Field value={hl.label} onChange={(label) => onChange({ ...content, highlights: content.highlights.map((x, j) => j === i ? { ...x, label } : x) })} /></div>
                                    <button type="button" title="Remover" onClick={() => onChange({ ...content, highlights: content.highlights.filter((_, j) => j !== i) })} className="text-[#666] hover:text-[#FF0054]"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ))}
                            {s.showHighlights && content.highlights.length < 5 && (
                                <button type="button" onClick={() => onChange({ ...content, highlights: [...content.highlights, { id: socialId(), label: 'Destaque', url: media[0]?.url || '' }] })}
                                    className="h-8 rounded border border-dashed border-[#333] text-[12px] hover:text-white hover:border-[#FF0054] flex items-center justify-center gap-1.5">
                                    <Plus className="w-3.5 h-3.5" /> Adicionar destaque
                                </button>
                            )}
                        </div>
                    </>
                )}

                {tab === 'look' && (
                    <>
                        <div className="flex flex-col gap-2">
                            <Title>Moldura</Title>
                            <Segmented value={s.frame} options={[{ id: 'phone', label: 'Telemóvel' }, { id: 'none', label: 'Só o ecrã' }]} onChange={(frame) => set({ frame })} />
                            {s.frame === 'phone' && <ColorRow label="Cor do telemóvel" value={s.frameColor} onChange={(frameColor) => set({ frameColor })} />}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Title>Tema da app</Title>
                            <Segmented value={s.theme} options={[{ id: 'light', label: 'Claro' }, { id: 'dark', label: 'Escuro' }]} onChange={(theme) => set({ theme })} />
                            <ColorRow label="Cor de destaque" value={s.accent} onChange={(accent) => set({ accent })} />
                        </div>
                        {s.mode !== 'grid' && <Range label="Largura" value={s.width} min={200} max={480} step={5} unit="px" onChange={(width) => set({ width })} />}
                        {(s.mode === 'profile' || s.mode === 'grid') && <Range label="Colunas da grelha" value={s.gridColumns} min={2} max={4} unit="" onChange={(gridColumns) => set({ gridColumns })} />}
                        {/* The grid always fills its column; only the phone / screen is placed */}
                        {s.mode !== 'grid' && (
                            <div className="flex flex-col gap-2">
                                <Title>Alinhamento</Title>
                                <Segmented value={s.alignment} options={[{ id: 'left', label: 'Esquerda' }, { id: 'center', label: 'Centro' }, { id: 'right', label: 'Direita' }]} onChange={(alignment) => set({ alignment })} />
                            </div>
                        )}
                    </>
                )}
            </div>

            <PanelActions {...actions} />
        </div>
    )
}
