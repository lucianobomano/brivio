import fs from 'fs'
import path from 'path'

const scriptsDir = path.join(process.cwd(), 'scripts')
const outputPath = path.join(process.cwd(), 'lib', 'brandbook-templates.ts')

const visaoGeralPath = path.join(scriptsDir, 'merimbamba_visao_geral.json')
const dnaPath = path.join(scriptsDir, 'merimbamba_dna_da_marca.json')
const historiaPath = path.join(scriptsDir, 'merimbamba_historia_da_marca.json')

const visaoGeralContent = fs.readFileSync(visaoGeralPath, 'utf-8')
const dnaContent = fs.readFileSync(dnaPath, 'utf-8')
const historiaContent = fs.readFileSync(historiaPath, 'utf-8')

const tsContent = `// Automatically generated from Merimbamba brandbook page layouts
export const GUIDE_INTRO_TEMPLATE = ${visaoGeralContent.trim()}

export const DNA_TEMPLATE = ${dnaContent.trim()}

export const HISTORY_TEMPLATE = ${historiaContent.trim()}
`

fs.writeFileSync(outputPath, tsContent, 'utf-8')
console.log("Successfully generated all templates in brandbook-templates.ts!")
