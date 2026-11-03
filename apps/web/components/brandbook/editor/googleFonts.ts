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
            'Lexend Exa', 'Lexend Giga', 'Montserrat Alternates', 'Signika Negative', 'Baloo 2', 'Catamaran', 'Mada', 'Sen', 'Ubuntu Condensed', 'Yantramanav', 'Zen Maru Gothic', 'Hind Siliguri', 'Hind Madurai', 'Noto Sans KR', 'Nanum Gothic', 'Kantumruy Pro',
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
            'Abhaya Libre', 'Alike', 'Amethysta', 'Average', 'Cambo', 'Coustard', 'Crete Round', 'Della Respira', 'Fanwood Text', 'Goudy Bookletter 1911', 'Junge', 'Linden Hill', 'Marcellus SC', 'Mate', 'Montaga', 'Rosarivo', 'Sumana', 'Taviraj', 'Tienne', 'Trocchi', 'Luxurious Roman',
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
            'Barrio', 'Bungee Spice', 'Codystar', 'Ewert', 'Fascinate', 'Federant', 'Fredericka the Great', 'Gravitas One', 'Modak', 'Nosifer', 'Rampart One', 'Shojumaru', 'Stardos Stencil', 'Train One', 'Yatra One', 'Rubik Moonrocks', 'Rubik Bubbles', 'Rubik Puddles', 'Rubik Dirt', 'Rubik Vinyl', 'Rubik Beastly', 'Rubik Iso', 'Rubik Microbe', 'Honk', 'Nabla', 'Tourney', 'Kalnia', 'Knewave', 'Leckerli One', 'Lily Script One', 'Grechen Fuemen', 'Kings',
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
            'Shadows Into Light Two', 'Schoolbell', 'Sue Ellen Francisco', 'Swanky and Moo Moo', 'Waiting for the Sunrise', 'Walter Turncoat', 'Crafty Girls', 'Delius', 'Delius Swash Caps', 'Gaegu', 'Gamja Flower', 'Give You Glory', 'Hi Melody', 'Just Me Again Down Here', 'Kite One', 'Loved by the King', 'Mali', 'Neucha', 'Nanum Pen Script', 'Nanum Brush Script', 'Patrick Hand SC', 'Pangolin', 'Rancho', 'Short Stack', 'Sriracha', 'The Girl Next Door', 'Annie Use Your Telescope', 'Bad Script', 'Caveat Brush', 'Chilanka', 'Dekko', 'Delicious Handrawn', 'Edu NSW ACT Foundation', 'Edu SA Beginner', 'Edu TAS Beginner', 'Edu VIC WA NT Beginner', 'Fuzzy Bubbles', 'Grape Nuts', 'Itim', 'Long Cang', 'Liu Jian Mao Cao', 'Ma Shan Zheng', 'Zhi Mang Xing', 'Oregano', 'Over the Rainbow', 'Sedgwick Ave', 'Sedgwick Ave Display', 'Shantell Sans', 'Unkempt', 'Yomogi', 'Klee One', 'Comic Neue', 'Mynerve', 'Gluten', 'Nerko One', 'Hachi Maru Pop', 'Calligraffitti', 'Love Ya Like A Sister', 'Dawning of a New Day', 'Kalam', 'Redressed', 'Seaweed Script', 'Grand Hotel', 'Playball', 'Condiment', 'Dynalight', 'Fondamento', 'Eagle Lake', 'Vibur', 'Romanesco', 'Ruge Boogie', 'Bonbon', 'Butterfly Kids', 'Bilbo',
        ],
    },
    {
        // Calligraphic scripts that look like a handwritten signature
        label: 'Assinatura',
        fonts: [
            'Monsieur La Doulaise', 'Mr De Haviland', 'Mrs Sheppards', 'Miss Fajardose', 'Mr Bedfort', 'Bilbo Swash Caps', 'Qwigley', 'Rochester', 'Ruthie', 'Meddon', 'Euphoria Script', 'Lovers Quarrel', 'League Script', 'Engagement', 'Sail', 'Niconne', 'Norican', 'Clicker Script', 'Felipa', 'Montez', 'Kristi', 'Allison', 'Ballet', 'Beau Rivage', 'Bonheur Royale', 'Comforter', 'Comforter Brush', 'Ephesis', 'Estonia', 'Explora', 'Fleur De Leah', 'Gwendolyn', 'Hurricane', 'Inspiration', 'Island Moments', 'Kolker Brush', 'Love Light', 'Lavishly Yours', 'Luxurious Script', 'Moon Dance', 'Ole', 'Passions Conflict', 'Puppies Play', 'Qwitcher Grypen', 'Send Flowers', 'Splash', 'Square Peg', 'Tapestry', 'The Nautigal', 'Twinkle Star', 'Updock', 'Vujahday Script', 'Water Brush', 'WindSong', 'Grey Qo', 'Babylonica', 'Carattere', 'Caramel', 'Dr Sugiyama', 'Meow Script', 'My Soul', 'Oooh Baby', 'Praise', 'Princess Sofia', 'Stalemate', 'Mea Culpa', 'Charm', 'MonteCarlo', 'Birthstone Bounce', 'Fuggles', 'Fasthand', 'Ingrid Darling', 'Jim Nightshade', 'Petemoss', 'Sassy Frass', 'Smooch', 'Sofia', 'Style Script', 'Waterfall', 'Shalimar', 'Moo Lah Lah', 'Quintessential', 'Yesteryear', 'Srisakdi', 'Tillana', 'Kavivanar', 'Herr Von Muellerhoff', 'Mrs Saint Delafield', 'Alex Brush', 'Great Vibes', 'Pinyon Script', 'Allura', 'Arizonia', 'Cherish', 'Corinthia', 'Imperial Script', 'Ms Madi', 'Whisper', 'Italianno', 'Rouge Script', 'Petit Formal Script', 'Parisienne', 'Sacramento', 'Tangerine',
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
].map((g, _i, all) => {
    // A font listed in «Assinatura» shows there only; elsewhere the first group that lists it keeps it
    const signature = new Set(all.find(x => x.label === 'Assinatura')?.fonts || [])
    return { ...g, fonts: Array.from(new Set(g.label === 'Assinatura' ? g.fonts : g.fonts.filter(f => !signature.has(f)))) }
}).map((g, i, all) => ({ ...g, fonts: g.fonts.filter(f => !all.slice(0, i).some(prev => prev.fonts.includes(f))) }))

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
