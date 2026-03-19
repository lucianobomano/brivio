import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'

export interface CommandListProps {
    items: any[]
    command: (item: any) => void
}

export const CommandList = forwardRef((props: CommandListProps, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0)

    const selectItem = (index: number) => {
        const item = props.items[index]
        if (item) {
            props.command(item)
        }
    }

    useEffect(() => setSelectedIndex(0), [props.items])

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length)
                return true
            }

            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length)
                return true
            }

            if (event.key === 'Enter') {
                selectItem(selectedIndex)
                return true
            }

            return false
        },
    }))

    return (
        <div className="bg-white border rounded shadow-lg overflow-hidden flex flex-col p-1 min-w-[200px] z-50">
            {props.items.length ? (
                props.items.map((item, index) => (
                    <button
                        key={index}
                        className={`flex items-center gap-2 px-3 py-2 text-sm text-left rounded ${index === selectedIndex ? 'bg-slate-100 text-indigo-600' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                        onClick={() => selectItem(index)}
                    >
                        <div className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded border border-slate-200">
                            {item.icon === 'h1' && <span className="font-bold text-xs">H1</span>}
                            {item.icon === 'h2' && <span className="font-bold text-xs">H2</span>}
                            {item.icon === 'image' && <span className="text-xs">IMG</span>}
                            {item.icon === 'table' && <span className="text-xs">TBL</span>}
                            {item.icon === 'pen' && <span className="text-xs">SIG</span>}
                        </div>
                        {item.title}
                    </button>
                ))
            ) : (
                <div className="px-3 py-2 text-sm text-slate-400">Nenhum resultado</div>
            )}
        </div>
    )
})

CommandList.displayName = 'CommandList'
