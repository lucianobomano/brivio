/**
 * Fonts offered by the font pickers, by category. All come from Google Fonts (loaded on demand), except
 * the ones in "Outras", which the platform serves itself.
 */

export const FONT_GROUPS: { label: string, fonts: string[] }[] = [
    {
        label: 'Sem serifa',
        fonts: [
            'Inter', 'Inter Tight', 'Geist', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Raleway', 'Nunito', 'Nunito Sans',
            'Rubik', 'Work Sans', 'Urbanist', 'Outfit', 'Plus Jakarta Sans', 'Figtree', 'Manrope', 'Syne', 'Space Grotesk', 'Public Sans',
            'DM Sans', 'Sora', 'Lexend', 'Onest', 'Albert Sans', 'Be Vietnam Pro', 'Hanken Grotesk', 'Schibsted Grotesk',
            'Bricolage Grotesque', 'Instrument Sans', 'Red Hat Display', 'Red Hat Text', 'Mulish', 'Karla', 'Barlow', 'Barlow Condensed',
            'IBM Plex Sans', 'Noto Sans', 'Source Sans 3', 'Fira Sans', 'Archivo', 'Archivo Narrow', 'Josefin Sans', 'Kanit', 'Heebo',
            'Assistant', 'Cabin', 'Quicksand', 'Dosis', 'Ubuntu', 'Oxygen', 'Exo 2', 'Titillium Web', 'Jost', 'Epilogue',
            'Familjen Grotesk', 'Golos Text', 'Wix Madefor Display', 'Readex Pro', 'Chivo', 'Overpass', 'Atkinson Hyperlegible',
            'Gabarito', 'Rethink Sans', 'Funnel Display', 'Host Grotesk',
            'Abel', 'Alata', 'Alexandria', 'Alumni Sans', 'Anek Latin', 'Arimo', 'Asap', 'Asap Condensed',
            'Bai Jamjuree', 'Belleza', 'Blinker', 'Cairo', 'Cantarell', 'Commissioner', 'Didact Gothic', 'Encode Sans',
            'Encode Sans Expanded', 'Exo', 'Fira Sans Condensed', 'Gantari', 'Gothic A1', 'Hind', 'IBM Plex Sans Condensed', 'Inclusive Sans',
            'Istok Web', 'Kumbh Sans', 'Lexend Deca', 'Libre Franklin', 'M PLUS Rounded 1c', 'Maven Pro', 'Mukta', 'Noto Sans Display',
            'Oxanium', 'Pathway Extreme', 'PT Sans', 'PT Sans Narrow', 'Prompt', 'Questrial', 'Radio Canada', 'Reddit Sans',
            'Roboto Condensed', 'Roboto Flex', 'Saira', 'Saira Condensed', 'Sarabun', 'Signika', 'Sofia Sans', 'Sofia Sans Condensed',
            'Spline Sans', 'Tenor Sans', 'Tajawal', 'Varela Round', 'Wix Madefor Text', 'Ysabeau', 'Zen Kaku Gothic New', 'Afacad',
            'Mitr', 'Livvic', 'Murecho', 'Noto Sans JP',
        ],
    },
    {
        label: 'Serifa',
        fonts: [
            'Playfair Display', 'Lora', 'Merriweather', 'Libre Baskerville', 'PT Serif', 'Crimson Text', 'Crimson Pro', 'EB Garamond',
            'Cormorant Garamond', 'Cormorant', 'Libre Caslon Text', 'DM Serif Display', 'DM Serif Text', 'Instrument Serif', 'Fraunces',
            'Newsreader', 'Source Serif 4', 'Noto Serif', 'Spectral', 'Bitter', 'Arvo', 'Josefin Slab', 'Roboto Slab', 'Zilla Slab',
            'Alegreya', 'Cardo', 'Gilda Display', 'Bodoni Moda', 'Young Serif', 'Gloock', 'Petrona', 'Literata', 'Abril Fatface',
            'Prata', 'Marcellus', 'Cinzel', 'Italiana', 'Rozha One', 'Yeseva One', 'Playfair',
            'Aleo', 'Amiri', 'Antic Didone', 'Besley', 'Brygada 1918', 'Castoro', 'Cormorant Infant', 'Cormorant SC',
            'Domine', 'Eczar', 'Faustina', 'Frank Ruhl Libre', 'Gelasio', 'Gentium Book Plus', 'IBM Plex Serif', 'Ibarra Real Nova',
            'Kreon', 'Libre Bodoni', 'Lustria', 'Manuale', 'Martel', 'Noticia Text', 'Old Standard TT', 'Ovo',
            'Playfair Display SC', 'Podkova', 'Quattrocento', 'Rokkitt', 'Rufina', 'Sorts Mill Goudy', 'Trirong', 'Tinos',
            'Unna', 'Vollkorn', 'Vidaloka', 'Yrsa', 'Radley', 'Lusitana', 'Neuton', 'Bellefair',
            'Forum', 'Noto Serif Display', 'STIX Two Text', 'Hedvig Letters Serif', 'Corben',
        ],
    },
    {
        label: 'Display',
        fonts: [
            'Archivo Black', 'Staatliches', 'Bebas Neue', 'Anton', 'Unbounded', 'Righteous', 'Ultra', 'Oswald', 'Big Shoulders Display',
            'Bowlby One', 'Dela Gothic One', 'Krona One', 'Michroma', 'Monoton', 'Orbitron', 'Rubik Mono One', 'Russo One', 'Shrikhand',
            'Syncopate', 'Tilt Warp', 'Bungee', 'Chakra Petch', 'Audiowide', 'Alfa Slab One', 'Black Ops One', 'Lilita One',
            'Passion One', 'Fjalla One', 'Teko', 'Antonio', 'League Spartan', 'Climate Crisis', 'Darker Grotesque', 'Poiret One',
            'Bangers', 'Bevan', 'Boogaloo', 'Bungee Shade', 'Bungee Inline', 'Calistoga', 'Chango', 'Comfortaa',
            'Concert One', 'Days One', 'DynaPuff', 'Fredoka', 'Fugaz One', 'Graduate', 'Gruppo', 'Holtwood One SC',
            'Jockey One', 'Limelight', 'Londrina Solid', 'Luckiest Guy', 'Megrim', 'Notable', 'Patua One', 'Paytone One',
            'Philosopher', 'Press Start 2P', 'Quantico', 'Racing Sans One', 'Rubik Glitch', 'Sansita', 'Secular One', 'Sigmar One',
            'Silkscreen', 'Special Elite', 'Squada One', 'Titan One', 'Vast Shadow', 'VT323', 'Wallpoet', 'Zen Dots',
            'Bagel Fat One', 'Changa One', 'Big Shoulders Text', 'Tektur', 'Erica One',
        ],
    },
    {
        label: 'Manuscrita',
        fonts: [
            'Caveat', 'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Kalam', 'Shadows Into Light', 'Permanent Marker',
            'Indie Flower', 'Sacramento', 'Allura', 'Homemade Apple', 'Yellowtail', 'Parisienne', 'Amatic SC', 'Gochi Hand',
            'Nothing You Could Do', 'Reenie Beanie', 'Mrs Saint Delafield', 'Pinyon Script',
            'Lobster', 'Lobster Two', 'Kaushan Script', 'Courgette', 'Cookie', 'Damion', 'Marck Script', 'Merienda',
            'Patrick Hand', 'Architects Daughter', 'Covered By Your Grace', 'Rock Salt', 'Handlee', 'Just Another Hand', 'La Belle Aurore', 'Mr Dafoe',
            'Herr Von Muellerhoff', 'Alex Brush', 'Tangerine', 'Italianno', 'Cedarville Cursive', 'Zeyada', 'Gloria Hallelujah', 'Coming Soon',
            'Mansalva', 'Playpen Sans', 'Whisper', 'Ms Madi', 'Birthstone', 'Corinthia', 'Imperial Script', 'Petit Formal Script',
            'Rouge Script', 'Arizonia', 'Cherish',
        ],
    },
    {
        label: 'Monoespaçada',
        fonts: [
            'Space Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'IBM Plex Mono', 'DM Mono', 'Roboto Mono', 'Inconsolata',
            'Geist Mono', 'Martian Mono', 'Red Hat Mono', 'Azeret Mono', 'Courier Prime', 'Major Mono Display',
            'Anonymous Pro', 'Cousine', 'Cutive Mono', 'Fragment Mono', 'Kode Mono', 'Noto Sans Mono', 'Overpass Mono', 'PT Mono',
            'Share Tech Mono', 'Spline Sans Mono', 'Ubuntu Mono', 'Victor Mono', 'Xanh Mono', 'Sometype Mono', 'Chivo Mono', 'Reddit Mono',
            'Sono', 'Syne Mono',
        ],
    },
    {
        label: 'Outras',
        fonts: ['Minion Variable Concept', 'Satoshi', 'Brandon Grotesque'],
    },
].map(g => ({ ...g, fonts: Array.from(new Set(g.fonts)) }))

/** Every font, once */
export const GOOGLE_FONTS: string[] = Array.from(new Set(FONT_GROUPS.flatMap(g => g.fonts)))

/** Fonts the platform serves itself (no Google Fonts request) */
export const SELF_HOSTED_FONTS = new Set(['Minion Variable Concept', 'Satoshi', 'Brandon Grotesque'])

/**
 * Loads just the letters of a font's own name (Google Fonts "text=" request, a few KB), so a long list
 * can show every font in its own face without downloading them all.
 */
export const loadFontPreview = (font: string) => {
    if (typeof document === 'undefined' || SELF_HOSTED_FONTS.has(font)) return
    const id = `font-preview-${font}`
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}&text=${encodeURIComponent(font)}&display=swap`
    document.head.appendChild(link)
}
