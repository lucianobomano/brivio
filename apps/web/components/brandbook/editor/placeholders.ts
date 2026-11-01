/**
 * Placeholder images of the templates. Ready-made sections, columns and blocks (and the built-in brandbook
 * templates) show one of three Brivio placeholders instead of sample photos, each template using a single
 * one so the library looks even; the user replaces them with the brand's own images. Covers keep their
 * artwork, and logos, symbols and the Brivio gradient are never replaced.
 */

export const PLACEHOLDERS = [
    '/brandbook/presets/placeholders/placeholder-green.webp',
    '/brandbook/presets/placeholders/placeholder-pink.webp',
    '/brandbook/presets/placeholders/placeholder-gradient.webp',
]

/** Sample photos and mockups that become placeholders (not logos, symbols, the gradient or uploads) */
const SAMPLE_IMAGE = /^\/brandbook\/(presets\/covers\/|templates\/brivio\/(?!logo))/

const isCoverSection = (node: Record<string, unknown>) => {
    const settings = (node.content as { settings?: { isCover?: boolean } } | undefined)?.settings
    return node.type === 'layout' && !!settings?.isCover
}

/** A copy of `data` with every sample image replaced by `image` (cover sections are left as they are) */
export const withPlaceholder = <T>(data: T, image: string): T => {
    const walk = (value: unknown): unknown => {
        if (typeof value === 'string') return SAMPLE_IMAGE.test(value) ? image : value
        if (Array.isArray(value)) return value.map(walk)
        if (value && typeof value === 'object') {
            if (isCoverSection(value as Record<string, unknown>)) return value
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, walk(v)]))
        }
        return value
    }
    return walk(data) as T
}

/** Whether a template shows sample images (outside its cover sections) */
export const hasSampleImage = (data: unknown) => JSON.stringify(withPlaceholder(data, '@@sample@@')).includes('@@sample@@')

/** The placeholder of the n-th template (they take turns) */
export const placeholderAt = (n: number) => PLACEHOLDERS[((n % PLACEHOLDERS.length) + PLACEHOLDERS.length) % PLACEHOLDERS.length]
