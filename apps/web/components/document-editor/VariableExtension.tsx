import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import React from 'react'

/**
 * Custom Node to render {{Variable}} with real-time values
 */
const VariableComponent = (props: any) => {
    const { node, extension } = props
    const label = node.attrs.label

    // Get value from extension storage (updated by the Editor component)
    const value = extension.storage.values[label] || `{{${label}}}`

    return (
        <NodeViewWrapper className="inline-block mx-1">
            <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold border border-indigo-200 transition-all select-none">
                {value}
            </span>
        </NodeViewWrapper>
    )
}

export const VariableExtension = Node.create({
    name: 'variable',
    group: 'inline',
    inline: true,
    selectable: true,
    atom: true,

    addAttributes() {
        return {
            label: {
                default: 'Cliente',
            },
        }
    },

    addStorage() {
        return {
            values: {},
        }
    },

    parseHTML() {
        return [
            {
                tag: 'span[data-variable]',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['span', mergeAttributes(HTMLAttributes, { 'data-variable': '' }), 0]
    },

    addNodeView() {
        return ReactNodeViewRenderer(VariableComponent)
    },

    addInputRules() {
        return [
            {
                find: /\{\{([a-zA-Z0-9]+)\}\}/,
                handler: ({ state, range, match }) => {
                    const { tr } = state
                    const label = match[1]
                    tr.replaceWith(range.from, range.to, this.type.create({ label }))
                },
                // Added for TipTap 2.x compatibility
                undoable: true,
            },
        ]
    },
})
