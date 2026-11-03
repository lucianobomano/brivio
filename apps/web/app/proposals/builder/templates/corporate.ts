/**
 * «Corporativo»: a 15-page A4 proposal in navy and lime (cover, contents, executive summary, about, team, history,
 * services, pricing, budget, description, timeline, portfolio, terms, thank-you page). Every photo is a grey
 * placeholder to replace; every text is editable. Built only with the blocks the proposal editor draws
 * (sections, columns, subcolumns, texts, images), sized to fit the A4 sheet.
 */

const NAVY = "#0E2B47"
const GREEN = "#8BC34A"
const INK = "#1F2937"
const GREY = "#6B7280"
const LIGHT = "#F1F2F4"
const WHITE = "#FFFFFF"
const FONT = "Inter"
const A4 = { format: "a4", orientation: "portrait" }

type Settings = Record<string, unknown>
type Block = { id: string, type: string, content: Record<string, unknown> }
type Column = { id: string, blocks: Block[], settings: Settings }

export function corporateModules(proposalId: string) {
    let n = 0
    const id = (p: string) => `corp-${p}-${++n}`
    const pad = (top = 0, right = 0, bottom = 0, left = 0) => ({ isLocked: false, top, right, bottom, left })
    const photo = (w: number, h: number, label = "Fotografia") =>
        `https://placehold.co/${w}x${h}/d9d9d9/8a8a8a/png?text=${encodeURIComponent(label)}`

    // --- blocks
    const H = (text: string, style: Settings = {}): Block => ({ id: id("h"), type: "headline", content: { text, style: { fontFamily: FONT, fontWeight: "800", color: NAVY, fontSize: "24px", lineHeight: "1.15", ...style } } })
    const T = (text: string, style: Settings = {}): Block => ({ id: id("t"), type: "text", content: { text, style: { fontFamily: FONT, fontSize: "10px", lineHeight: "1.6", color: GREY, ...style } } })
    /** Small section heading with the lime underline */
    const SUB = (text: string, style: Settings = {}) => H(text, { fontSize: "12px", color: INK, borderBottom: `2px solid ${GREEN}`, paddingBottom: "6px", ...style })
    /** A coloured strip (rules, bars of the charts and of the timeline) */
    const BAR = (color: string, height: number, style: Settings = {}) => T(" ", { backgroundColor: color, height: `${height}px`, minHeight: `${height}px`, fontSize: "1px", lineHeight: "1", padding: "0", ...style })
    /** Navy square with a number (the icons of the design) */
    const ICON = (text: string, bg = NAVY) => T(text, { backgroundColor: bg, color: WHITE, width: "34px", height: "34px", textAlign: "center", lineHeight: "34px", fontSize: "11px", fontWeight: "700", padding: "0" })
    const IMG = (w: number, h: number, label?: string): Block => ({ id: id("i"), type: "image", content: { url: photo(w, h, label), style: { aspectRatio: `${w}/${h}`, radius: 1 } } })

    // --- layout
    const col = (blocks: Block[], settings: Settings = {}): Column => ({ id: id("c"), blocks, settings: { padding: pad(), alignHorizontal: "left", alignVertical: "top", blockGap: 0, ...settings } })
    const sec = (columns: Column[], settings: Settings = {}): Block => ({
        id: id("s"),
        type: "layout",
        content: { columns, settings: { columns: columns.length, sectionPadding: pad(0, 48, 0, 48), columnGap: 24, alignHorizontal: "left", alignVertical: "top", ...settings } },
    })
    /** Columns inside a column (no section around them) */
    const row = (columns: Column[], settings: Settings = {}): Block => ({ id: id("r"), type: "layout", content: { columns, settings: { columns: columns.length, columnGap: 16, alignHorizontal: "left", alignVertical: "top", ...settings } } })
    const title = (text: string, intro?: string) => sec([col([H(text, { fontSize: "26px" }), ...(intro ? [T(intro, { maxWidth: "460px" })] : [])])], { sectionPadding: pad(56, 48, 8, 48) })

    let order = 0
    const page = (name: string, type: string, blocks: Block[]) => ({
        proposal_id: proposalId,
        order: order++,
        title: `${String(order).padStart(2, "0")}. ${name}`,
        type,
        content_json: { page: A4, style: { backgroundColor: WHITE }, blocks },
    })

    const lorem = "Descreva aqui, em poucas frases, o contexto deste ponto da proposta: o que o cliente precisa de saber e porque é importante para o projeto."
    const loremShort = "Texto curto de apoio, para substituir pelo conteúdo do projeto."

    const pages = [
        // 1. Cover
        page("Capa", "intro", [
            sec([col([BAR(GREEN, 5)])], { sectionPadding: pad(48, 48, 0, 48) }),
            sec([
                col([T(".Por {{Nome_Cliente}}", { fontWeight: "700", color: INK, fontSize: "11px" })]),
                col([T("2026", { fontWeight: "700", color: INK, fontSize: "11px", textAlign: "right" })]),
            ]),
            sec([col([IMG(698, 470, "Fotografia de capa"), T("“Um projeto sem plano é apenas um desejo.”", { backgroundColor: GREEN, color: WHITE, fontStyle: "italic", fontWeight: "600", fontSize: "12px", padding: "10px 16px", width: "62%" })])]),
            sec([col([
                H("PROJETO", { color: GREEN, fontSize: "34px" }),
                H("PROPOSTA", { color: WHITE, fontSize: "56px", lineHeight: "1" }),
                T("DE IDEIAS A IMPACTO REAL", { color: WHITE, fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em" }),
            ], { backgroundColor: NAVY, padding: pad(32, 32, 20, 32), columnWidth: "78%" })]),
            sec([col([
                T("MARCA", { fontWeight: "800", color: NAVY, fontSize: "11px" }),
                T("VÁLIDA ATÉ", { fontWeight: "800", color: NAVY, fontSize: "11px" }),
                T("EMITIDA EM", { fontWeight: "800", color: NAVY, fontSize: "11px" }),
                T("{{Nome_Cliente}}", { fontSize: "10px" }),
                T("{{Data}}", { fontSize: "10px" }),
                T("{{Data}}", { fontSize: "10px" }),
            ], { backgroundColor: LIGHT, padding: pad(20, 24, 8, 24), subColumns: 3, blockGap: 0 })], { sectionPadding: pad(40, 48, 0, 48) }),
        ]),

        // 2. Contents
        page("Índice", "text", [
            title("Índice", "O que encontra nesta proposta, página a página."),
            ...([
                ["03", "Sumário executivo"], ["04", "Sobre nós"], ["06", "A equipa"], ["07", "História da empresa"],
                ["08", "Serviços"], ["11", "Descrição do projeto"], ["12", "Cronograma do projeto"], ["14", "Termos e condições"],
            ] as const).map(([num, name]) => sec([
                col([H(num, { fontSize: "24px" })]),
                col([T("Resumo breve do que esta secção da proposta apresenta.", { fontSize: "9px" })]),
                col([T(name, { fontWeight: "700", color: INK, fontSize: "11px", borderBottom: `2px solid ${GREEN}`, paddingBottom: "6px" })]),
            ], { columnWidths: [1, 4, 4], sectionPadding: pad(22, 48, 0, 48), alignVertical: "middle" })),
        ]),

        // 3. Executive summary
        page("Sumário executivo", "text", [
            title("Sumário executivo"),
            sec([
                col([SUB("Visão geral do projeto"), T(lorem), T(lorem)]),
                col([IMG(330, 300)]),
            ]),
            sec([
                col([
                    H("Objetivos-chave", { color: WHITE, fontSize: "14px" }),
                    T("✓ Objetivo principal do projeto\n✓ Segundo objetivo mensurável\n✓ Terceiro objetivo, com prazo\n✓ Quarto objetivo, com responsável", { color: WHITE, fontSize: "10px", lineHeight: "2" }),
                ], { backgroundColor: GREEN, padding: pad(32, 28, 32, 28) }),
                col([
                    SUB("Resultados esperados"),
                    T("✓ Resultado concreto para o negócio\n✓ Melhoria que o cliente vai notar\n✓ Indicador que vamos medir\n✓ Entrega final e o seu impacto\n✓ Ganho de tempo ou de custo\n✓ Próximo passo depois do projeto", { color: INK, fontSize: "10px", lineHeight: "2" }),
                ]),
            ], { sectionPadding: pad(40, 48, 0, 48) }),
        ]),

        // 4. About us
        page("Sobre nós", "text", [
            title("Sobre nós"),
            sec([
                col([IMG(330, 360)]),
                col([SUB("Visão e missão"), T(lorem), T(lorem), T("Uma frase forte que resume a forma como trabalhamos e o que nos distingue.", { color: INK, fontWeight: "700", fontSize: "11px" })]),
            ]),
            sec([col([
                H("Os nossos valores", { color: WHITE, fontSize: "16px" }),
                row([
                    col([T("01  Rigor", { color: GREEN, fontWeight: "700", fontSize: "11px" }), T(loremShort, { color: WHITE }), T("03  Proximidade", { color: GREEN, fontWeight: "700", fontSize: "11px" }), T(loremShort, { color: WHITE })]),
                    col([T("02  Criatividade", { color: GREEN, fontWeight: "700", fontSize: "11px" }), T(loremShort, { color: WHITE }), T("04  Compromisso", { color: GREEN, fontWeight: "700", fontSize: "11px" }), T(loremShort, { color: WHITE })]),
                ], { columnGap: 32 }),
            ], { backgroundColor: NAVY, padding: pad(36, 32, 28, 32) })], { sectionPadding: pad(48, 48, 0, 48) }),
        ]),

        // 5. Who we are / what we do
        page("Quem somos", "text", [
            title("Quem somos"),
            sec([
                col([
                    row([col([ICON("01")]), col([T(lorem)])], { columnWidths: [1, 6], columnGap: 12 }),
                    row([col([ICON("02")]), col([T(lorem)])], { columnWidths: [1, 6], columnGap: 12 }),
                    T("A nossa equipa transforma objetivos em projetos claros, com prazos e responsáveis definidos.", { color: INK, fontWeight: "700", fontSize: "11px" }),
                ]),
                col([IMG(330, 320)]),
            ]),
            sec([col([H("O que fazemos", { fontSize: "20px" })])], { sectionPadding: pad(40, 48, 0, 48) }),
            sec([
                col([IMG(330, 300)]),
                col([T(lorem), T("•  Estratégia e planeamento\n•  Design e desenvolvimento\n•  Implementação e acompanhamento\n•  Medição de resultados", { color: INK, fontSize: "10px", lineHeight: "2" })]),
            ]),
        ]),

        // 6. Team
        page("A equipa", "text", [
            title("A nossa equipa"),
            ...([["Nome Apelido", "Direção do projeto"], ["Nome Apelido", "Direção criativa"], ["Nome Apelido", "Gestão de cliente"]] as const).map(([name, role]) => sec([
                col([IMG(200, 210, "Foto")]),
                col([H(name, { fontSize: "15px" }), T(role, { color: GREEN, fontWeight: "700", fontSize: "10px" }), BAR(GREEN, 2), T(lorem)]),
            ], { columnWidths: [1, 3], sectionPadding: pad(36, 48, 0, 48) })),
        ]),

        // 7. History
        page("História", "text", [
            title("História da empresa", "Os marcos que nos trouxeram até aqui, e os próximos que queremos alcançar consigo."),
            ...[["2022", "2023", "2024"], ["2025", "2026", "2027"]].map(years => sec(years.map(y => col([
                H(y, { fontSize: "18px" }),
                BAR(NAVY, 3),
                T("Marco importante", { color: INK, fontWeight: "700", fontSize: "10px" }),
                T(loremShort),
            ])), { sectionPadding: pad(48, 48, 0, 48) })),
            sec([col([IMG(698, 220, "Fotografia")])], { sectionPadding: pad(48, 48, 0, 48) }),
            sec([col([T("Grandes projetos começam com propostas claras: bem planeadas, bem feitas e bem acompanhadas.", { color: INK, fontWeight: "700", fontSize: "13px", lineHeight: "1.5" })], { backgroundColor: LIGHT, padding: pad(24, 24, 8, 24) })], { sectionPadding: pad(36, 48, 0, 48) }),
        ]),

        // 8. Services
        page("Serviços", "text", [
            title("Os nossos serviços"),
            sec([col([IMG(337, 300)]), col([IMG(337, 300)])], { columnGap: 24 }),
            ...[[["01", "Design gráfico"], ["02", "Web design"]], [["03", "Marketing digital"], ["04", "SEO e conteúdos"]]].map(pair => sec(pair.map(([num, name]) => col([
                ICON(num),
                H(name, { fontSize: "13px", paddingTop: "8px" }),
                T(lorem),
            ])), { sectionPadding: pad(44, 48, 0, 48) })),
        ]),

        // 9. Pricing
        page("Preços", "pricing", [
            sec([col([
                H("Os nossos preços", { color: WHITE, fontSize: "26px" }),
                T("Três formas de trabalharmos juntos. Escolha a que melhor serve o projeto.", { color: WHITE }),
            ], { backgroundColor: NAVY, padding: pad(56, 32, 24, 32) })], { sectionPadding: pad(0, 48, 0, 48) }),
            sec([
                col([IMG(250, 720, "Fotografia")]),
                col([
                    ...([["Essencial", "1 500 €"], ["Profissional", "3 200 €"], ["Completo", "5 400 €"]] as const).flatMap(([name, price]) => [
                        row([
                            col([T(name, { backgroundColor: GREEN, color: WHITE, fontWeight: "700", fontSize: "11px", padding: "4px 10px", width: "fit-content" })]),
                            col([H(price, { fontSize: "18px", textAlign: "right" })]),
                        ], { columnGap: 8, alignVertical: "middle" }),
                        T("•  Primeiro ponto incluído\n•  Segundo ponto incluído\n•  Terceiro ponto incluído\n•  Quarto ponto incluído", { color: INK, fontSize: "10px", lineHeight: "2", paddingTop: "6px" }),
                        BAR(LIGHT, 2, { marginBottom: "18px" }),
                    ]),
                ]),
            ], { columnWidths: [2, 3], sectionPadding: pad(32, 48, 0, 48) }),
        ]),

        // 10. Budget
        page("Orçamento", "pricing", [
            title("Visão do orçamento"),
            sec([
                col([
                    col_box("Orçamento investido", "6 095,63 €"),
                    col_box("Retorno previsto", "7 092,53 €"),
                ].flat()),
                col([row([col([
                    H("95%", { fontSize: "26px", textAlign: "center" }),
                    T("Orçamento rentável", { fontSize: "9px", textAlign: "center" }),
                ], { columnWidth: "150px", columnHeight: "150px", radius: 999, borderWidth: 14, borderColor: GREEN, borderStyle: "solid", alignHorizontal: "center", alignVertical: "middle" })], { alignHorizontal: "center" })]),
            ], { alignVertical: "middle" }),
            // Bar chart
            sec([170, 260, 200, 320, 240, 290].map((h, i) => col([], { columnHeight: `${h}px`, backgroundColor: i % 2 ? GREEN : NAVY })), { columnGap: 18, alignVertical: "bottom", sectionPadding: pad(56, 72, 0, 72) }),
            sec(["2022", "2023", "2024", "2025", "2026", "2027"].map(y => col([T(y, { textAlign: "center", fontWeight: "700", color: INK, fontSize: "10px" })])), { columnGap: 18, sectionPadding: pad(6, 72, 0, 72) }),
            sec([
                col([T("■  Investimento inicial", { color: NAVY, fontWeight: "700", fontSize: "10px" }), T(loremShort)]),
                col([T("■  Retorno estimado", { color: GREEN, fontWeight: "700", fontSize: "10px" }), T(loremShort)]),
            ], { sectionPadding: pad(24, 48, 0, 48) }),
        ]),

        // 11. Project description
        page("Descrição do projeto", "text", [
            title("Descrição do projeto"),
            sec([col([IMG(300, 380)]), col([T(lorem), T(lorem), T(lorem), T(lorem)])]),
            sec([
                col([SUB("Visão geral"), T("•  Âmbito do trabalho\n•  Público e contexto\n•  Entregáveis principais\n•  Critérios de sucesso", { color: INK, fontSize: "10px", lineHeight: "2" })], { backgroundColor: LIGHT, padding: pad(28, 24, 20, 24) }),
                col([
                    SUB("Objetivos do projeto"),
                    ...["Primeiro objetivo", "Segundo objetivo", "Terceiro objetivo"].map((o, i) => row([col([ICON(`0${i + 1}`)]), col([T(o, { color: INK, fontWeight: "700", fontSize: "10px" }), T(loremShort, { fontSize: "9px" })])], { columnWidths: [1, 4], columnGap: 10 })),
                ], { backgroundColor: LIGHT, padding: pad(28, 24, 20, 24) }),
            ], { sectionPadding: pad(40, 48, 0, 48) }),
        ]),

        // 12. Timeline
        page("Cronograma", "timeline", [
            title("Cronograma do projeto"),
            sec([0, 1].map(c => col([1, 2, 3].map(r => row([col([ICON(`0${c * 3 + r}`, r === 2 ? GREEN : NAVY)]), col([T(["Descoberta", "Conceito", "Desenvolvimento", "Revisão", "Entrega", "Acompanhamento"][c * 3 + r - 1], { color: INK, fontWeight: "700", fontSize: "11px" }), T(loremShort, { fontSize: "9px" })])], { columnWidths: [1, 5], columnGap: 12 })).flat(), { blockGap: 14 }))),
            sec([col([IMG(698, 180, "Fotografia")])], { sectionPadding: pad(32, 48, 0, 48) }),
            // Gantt
            sec([
                col([T("Descrição", { color: WHITE, fontWeight: "700", fontSize: "10px" })]),
                ...["Sem. 1", "Sem. 2", "Sem. 3", "Sem. 4", "Sem. 5", "Sem. 6"].map(w => col([T(w, { color: GREEN, fontWeight: "700", fontSize: "10px" })])),
            ], { columnWidths: [2, 1, 1, 1, 1, 1, 1], columnGap: 8, backgroundColor: NAVY, sectionPadding: pad(14, 24, 0, 24), sectionMargin: { isLocked: false, top: 32, right: 48, bottom: 0, left: 48 } }),
            ...([["Descoberta", 0, 380], ["Conceito", 70, 290], ["Desenvolvimento", 140, 140], ["Revisão", 280, 70], ["Entrega", 350, 0]] as const).map(([name, start, end], i) => sec([
                col([T(name, { color: INK, fontSize: "10px", fontWeight: "600" })]),
                col([BAR(i % 2 ? GREEN : NAVY, 8)], { padding: pad(4, end, 0, start) }),
            ], { columnWidths: [2, 6], columnGap: 8, backgroundColor: i % 2 ? LIGHT : WHITE, sectionPadding: pad(16, 24, 4, 24), sectionMargin: { isLocked: false, top: 0, right: 48, bottom: 0, left: 48 }, alignVertical: "middle" })),
        ]),

        // 13. Portfolio
        page("Portfólio", "text", [
            title("Projetos realizados"),
            ...["Design de apresentação", "Manual de marca", "Design editorial"].map(name => sec([
                col([IMG(250, 215, "Projeto")]),
                col([H(name, { fontSize: "14px" }), T(lorem), BAR(GREEN, 2)]),
            ], { columnWidths: [2, 3], sectionPadding: pad(36, 48, 0, 48) })),
        ]),

        // 14. Terms
        page("Termos e condições", "text", [
            title("Termos e condições"),
            ...["Âmbito do trabalho", "Condições de pagamento", "Prazos e entregas", "Revisões e alterações", "Propriedade e direitos"].map(name => sec([col([
                SUB(name),
                T(`${lorem} ${loremShort} ${lorem}`),
            ])], { sectionPadding: pad(30, 48, 0, 48) })),
        ]),

        // 15. Thank you (back cover)
        page("Obrigado", "signature", [
            sec([col([BAR(GREEN, 5)])], { sectionPadding: pad(48, 48, 0, 48) }),
            sec([
                col([T("2026", { fontWeight: "700", color: INK, fontSize: "11px" })]),
                col([T(".Por {{Nome_Cliente}}", { fontWeight: "700", color: INK, fontSize: "11px", textAlign: "right" })]),
            ]),
            sec([col([IMG(698, 500, "Fotografia")])]),
            sec([col([
                H("Obrigado", { color: WHITE, fontSize: "52px" }),
                T("DE IDEIAS A IMPACTO REAL", { color: WHITE, fontSize: "11px", fontWeight: "600", letterSpacing: "0.08em" }),
            ], { backgroundColor: NAVY, padding: pad(32, 32, 20, 32), columnWidth: "78%" })]),
            sec([col([
                T("MORADA", { fontWeight: "800", color: NAVY, fontSize: "11px" }),
                T("CONTACTO", { fontWeight: "800", color: NAVY, fontSize: "11px" }),
                T("MARCA", { fontWeight: "800", color: NAVY, fontSize: "11px" }),
                T("Rua, número, cidade", { fontSize: "10px" }),
                T("+351 000 000 000", { fontSize: "10px" }),
                T("{{Nome_Cliente}}", { fontSize: "10px" }),
            ], { backgroundColor: LIGHT, padding: pad(20, 24, 8, 24), subColumns: 3, blockGap: 0 })], { sectionPadding: pad(40, 48, 0, 48) }),
        ]),
    ]

    /** A grey figure box (label + value) of the budget page */
    function col_box(label: string, value: string): Block[] {
        return [row([col([
            T(label, { fontSize: "10px" }),
            H(value, { fontSize: "20px" }),
        ], { backgroundColor: LIGHT, padding: pad(16, 18, 4, 18) })])]
    }

    return [
        {
            proposal_id: proposalId,
            order: -1,
            title: "Settings",
            type: "settings",
            content_json: {
                settings: {
                    visibility: "visible",
                    menu_background: LIGHT,
                    attachment_bg: GREEN,
                    highlights_bg: NAVY,
                    highlights_text: WHITE,
                    text_card_icon: NAVY,
                    text_card_tabs: NAVY,
                    attachment_icon: WHITE,
                    color_palette: [NAVY, GREEN, INK, LIGHT],
                    main_project_bg: WHITE,
                    play_audio_bg: NAVY,
                },
            },
        },
        ...pages,
    ]
}
