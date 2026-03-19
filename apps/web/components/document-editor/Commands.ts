import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'

export interface CommandItem {
    title: string
    command: (props: { editor: any; range: any }) => void
    icon: string
}

export const Commands = Extension.create({
    name: 'commands',

    addOptions() {
        return {
            suggestion: {
                char: '/',
                command: ({ editor, range, props }: any) => {
                    props.command({ editor, range })
                },
            },
        }
    },

    addStorage() {
        return {
            items: [
                {
                    title: 'Título 1',
                    icon: 'h1',
                    command: ({ editor, range }: any) => {
                        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
                    },
                },
                {
                    title: 'Título 2',
                    icon: 'h2',
                    command: ({ editor, range }: any) => {
                        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
                    },
                },
                {
                    title: 'Imagem',
                    icon: 'image',
                    command: ({ editor, range }: any) => {
                        editor.chain().focus().deleteRange(range).setImage({ src: 'https://placehold.co/600x400?text=Placeholder' }).run()
                    },
                },
                {
                    title: 'Tabela de Preços',
                    icon: 'table',
                    command: ({ editor, range }: any) => {
                        editor.chain().focus()
                            .deleteRange(range)
                            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                            .run()
                    },
                },
                {
                    title: 'Bloco de Assinatura',
                    icon: 'pen',
                    command: ({ editor, range }: any) => {
                        editor.chain().focus()
                            .deleteRange(range)
                            .insertContent([
                                { type: 'horizontalRule' },
                                { type: 'paragraph', content: [{ type: 'text', text: 'Assinatura Digital' }] },
                                { type: 'paragraph', content: [{ type: 'text', text: '________________________' }] }
                            ])
                            .run()
                    },
                },
            ] as CommandItem[],
        }
    },

    onBeforeCreate() {
        this.options.suggestion.items = ({ query }: { query: string }) => {
            return this.storage.items.filter((item: CommandItem) =>
                item.title.toLowerCase().startsWith(query.toLowerCase())
            )
        }
    },

    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ]
    },
})
