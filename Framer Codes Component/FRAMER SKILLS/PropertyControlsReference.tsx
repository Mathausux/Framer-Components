import type { CSSProperties, ReactNode } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * Property Controls Reference
 *
 * Living cheat-sheet for Framer's Code Component property controls API.
 * Every field in the panel on the right demonstrates one `ControlType`;
 * dragging this component onto the canvas renders a card for each prop
 * showing its current value plus a plain-language description of what
 * that control type is for. Meant to be explored directly in Framer,
 * not read as source — open the "Property Controls" panel and change a
 * value to see the corresponding card update live.
 *
 * Covers the 21 ControlType values documented and stable as of this
 * writing (Boolean, Number, String, Enum, SegmentedEnum, Color, Image,
 * ResponsiveImage, File, Font, Padding, BorderRadius, Border, BoxShadow,
 * Transition, FusedNumber, Array, Object, ComponentInstance,
 * EventHandler, Link, Date). This is NOT guaranteed to be the full,
 * current list — Framer's API evolves, and this wasn't checked against
 * a live `framer` package or the official docs. Cross-check
 * framer.com/developers (or the `ControlType` type in node_modules
 * `framer/dist/types`) before treating it as exhaustive.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 900
 * @framerIntrinsicHeight 1400
 */
export default function PropertyControlsReference(
    props: PropertyControlsReferenceProps
) {
    const {
        showToggle = true,
        count = 4,
        label = "Property Controls Reference",
        variant = "cover",
        align = "left",
        tint = "#0F7D72",
        photo,
        icon,
        heading = { fontSize: 24, fontWeight: 600 },
        innerSpacing = "16px 16px 16px 16px",
        corner = "12px",
        outline = { borderWidth: 1, borderStyle: "solid", borderColor: "#0F7D72" },
        elevation = "0px 8px 24px rgba(15,125,114,0.18)",
        motionCurve = { type: "spring", stiffness: 200, damping: 20 },
        gap = 12,
        tags = ["framer", "code-component", "reference"],
        meta = { author: "AYVU", version: "1.0" },
        slot,
        onAction,
        destination = "https://www.framer.com/developers/",
        eventDate,
    } = props

    const items: ControlEntry[] = [
        {
            type: "Boolean",
            title: "showToggle",
            value: String(showToggle),
            description:
                "Renderiza um interruptor. Ideal para recursos que existem ou não — mostrar/ocultar algo, ligar um comportamento.",
        },
        {
            type: "Number",
            title: "count",
            value: String(count),
            description:
                "Campo numérico com slider e faixa min/max/step. Usado para quantidades, tamanhos e durações.",
        },
        {
            type: "String",
            title: "label",
            value: label,
            description:
                "Texto livre de uma linha (ou multilinha com displayTextArea). Usado para títulos, labels e textos alternativos.",
        },
        {
            type: "Enum",
            title: "variant",
            value: variant,
            description:
                'Escolha única entre valores fixos, exibida como dropdown. Os valores reais ("cover") são separados dos rótulos amigáveis ("Cobrir") via optionTitles.',
        },
        {
            type: "SegmentedEnum",
            title: "align",
            value: align,
            description:
                "Mesma ideia do Enum, mas sempre exibida como botões segmentados — ótimo para alinhamento e direção, com suporte a ícones.",
        },
        {
            type: "Color",
            title: "tint",
            value: (
                <span style={valueRow}>
                    <span style={{ ...swatch, background: tint }} />
                    {tint}
                </span>
            ),
            description:
                "Seletor de cor nativo, com suporte a Color Styles e variáveis do projeto Framer.",
        },
        {
            type: "ResponsiveImage",
            title: "photo",
            value: photo?.src ? (
                <img src={photo.src} alt={photo.alt ?? ""} style={thumb} />
            ) : (
                <span style={empty}>nenhuma imagem conectada</span>
            ),
            description:
                "Como Image, mas o Framer gera um srcSet automático com múltiplas resoluções — carrega mais rápido no site publicado.",
        },
        {
            type: "File",
            title: "icon",
            value: icon ? (
                <span style={valueRow}>{icon.split("/").pop()}</span>
            ) : (
                <span style={empty}>nenhum arquivo conectado</span>
            ),
            description:
                "Upload de qualquer arquivo (aqui restrito a SVG via allowedFileTypes). Usado para logos, ícones e outros assets.",
        },
        {
            type: "Font",
            title: "heading",
            value: (
                <span style={{ fontSize: heading.fontSize, fontWeight: heading.fontWeight }}>
                    Aa Bb Cc
                </span>
            ),
            description:
                "Seletor completo de tipografia — família, peso, tamanho e espaçamento — puxando as fontes já carregadas no projeto.",
        },
        {
            type: "Padding",
            title: "innerSpacing",
            value: innerSpacing,
            description:
                "Editor visual de espaçamento interno com os 4 lados vinculáveis por um cadeado, igual ao painel de estilo nativo.",
        },
        {
            type: "BorderRadius",
            title: "corner",
            value: corner,
            description:
                "Editor de raio de borda por canto, ou um único valor vinculado a todos os cantos.",
        },
        {
            type: "Border",
            title: "outline",
            value: `${outline.borderWidth}px ${outline.borderStyle} ${outline.borderColor}`,
            description:
                "Largura, estilo e cor de borda — pode variar por lado, igual ao painel Border nativo.",
        },
        {
            type: "BoxShadow",
            title: "elevation",
            value: elevation,
            description:
                "Uma ou mais sombras empilháveis, com cor, blur, spread, offset e opção inset.",
        },
        {
            type: "Transition",
            title: "motionCurve",
            value: `${motionCurve.type} · stiffness ${motionCurve.stiffness} · damping ${motionCurve.damping}`,
            description:
                "Curva de animação completa (spring, ease ou tween) com duração/rigidez e delay, no mesmo formato do Framer Motion.",
        },
        {
            type: "FusedNumber",
            title: "gap",
            value: String(gap),
            description:
                'Vários números relacionados (aqui, um único "gap") com toggle para vincular todos a um valor ou editar cada um por lado.',
        },
        {
            type: "Array",
            title: "tags",
            value: tags.length ? tags.join(", ") : "(vazio)",
            description:
                "Lista repetível de itens, cada um controlado pelo tipo definido em control — aqui, uma lista de textos.",
        },
        {
            type: "Object",
            title: "meta",
            value: `author: ${meta.author} · version: ${meta.version}`,
            description:
                "Agrupa vários controles relacionados em uma seção colapsável — bom para organizar um painel grande em blocos.",
        },
        {
            type: "ComponentInstance",
            title: "slot",
            value: slot ? (
                <span style={slotBox}>{slot}</span>
            ) : (
                <span style={empty}>nenhum frame conectado</span>
            ),
            description:
                "Slot para arrastar qualquer frame/componente do canvas para dentro deste componente. Chega no código como ReactNode.",
        },
        {
            type: "EventHandler",
            title: "onAction",
            value: typeof onAction === "function" ? "conectado" : "não conectado",
            description:
                "Expõe um evento que pode ser ligado a uma interação do Framer (ex.: ao clicar), sem escrever código.",
        },
        {
            type: "Link",
            title: "destination",
            value: destination,
            description:
                "Campo de URL com suporte nativo a páginas internas do projeto Framer, além de links externos.",
        },
        {
            type: "Date",
            title: "eventDate",
            value: eventDate ?? "(não definida)",
            description:
                "Seletor de data em calendário — útil para contadores regressivos ou conteúdo agendado.",
        },
    ]

    return (
        <div style={wrapper}>
            <header style={headerStyle}>
                <p style={eyebrow}>Framer · Property Controls</p>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{label}</h2>
                <p style={introText}>
                    Cada card abaixo corresponde a um prop deste componente, controlado por um{" "}
                    <code style={inlineCode}>ControlType</code> diferente. Ajuste os valores no
                    painel de propriedades para ver a atualização em tempo real.
                </p>
                <p style={disclaimer}>
                    Cobre os 21 ControlType documentados e estáveis até o momento desta versão.
                    Não é garantia de lista exaustiva/atualizada — a API do Framer evolui;
                    confira framer.com/developers antes de tratar como definitiva.
                </p>
            </header>

            <div style={{ ...grid, gap }}>
                {items.map((item) => (
                    <article key={item.title} style={card}>
                        <div style={cardHead}>
                            <span style={badge}>{item.type}</span>
                            <code style={propName}>{item.title}</code>
                        </div>
                        <div style={valueBlock}>{item.value}</div>
                        <p style={descText}>{item.description}</p>
                    </article>
                ))}
            </div>
        </div>
    )
}

interface ControlEntry {
    type: string
    title: string
    value: ReactNode
    description: string
}

interface ResponsiveImageValue {
    src: string
    alt?: string
}

interface HeadingFont {
    fontSize?: number
    fontWeight?: number
}

interface BorderValue {
    borderWidth: number
    borderStyle: string
    borderColor: string
}

interface TransitionValue {
    type: string
    stiffness: number
    damping: number
}

interface MetaValue {
    author: string
    version: string
}

interface PropertyControlsReferenceProps {
    showToggle: boolean
    count: number
    label: string
    variant: "cover" | "contain" | "fill"
    align: "left" | "center" | "right"
    tint: string
    photo?: ResponsiveImageValue
    icon?: string
    heading: HeadingFont
    innerSpacing: string
    corner: string
    outline: BorderValue
    elevation: string
    motionCurve: TransitionValue
    gap: number
    tags: string[]
    meta: MetaValue
    slot?: ReactNode
    onAction?: () => void
    destination: string
    eventDate?: string
}

const wrapper: CSSProperties = {
    width: "100%",
    height: "100%",
    overflow: "auto",
    padding: 32,
    background: "#F4F6F9",
    color: "#171B24",
    fontFamily:
        "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    boxSizing: "border-box",
}

const headerStyle: CSSProperties = {
    maxWidth: 640,
    marginBottom: 28,
}

const eyebrow: CSSProperties = {
    margin: "0 0 6px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 11,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "#0F7D72",
    fontWeight: 600,
}

const introText: CSSProperties = {
    margin: "8px 0 0",
    fontSize: 14,
    lineHeight: 1.6,
    color: "#4B5262",
}

const disclaimer: CSSProperties = {
    margin: "10px 0 0",
    fontSize: 11.5,
    lineHeight: 1.55,
    color: "#A9660A",
    background: "#FBEED9",
    padding: "8px 12px",
    borderRadius: 8,
    maxWidth: 560,
}

const inlineCode: CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    background: "#E2F3F0",
    color: "#0F7D72",
    padding: "1px 5px",
    borderRadius: 4,
}

const grid: CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
}

const card: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    background: "#FFFFFF",
    border: "1px solid #DDE2EA",
    borderRadius: 12,
    padding: "16px 18px",
    boxShadow: "0 1px 2px rgba(23,27,36,0.04), 0 8px 24px -12px rgba(23,27,36,0.12)",
}

const cardHead: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
}

const badge: CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    fontWeight: 600,
    color: "#0F7D72",
    background: "#E2F3F0",
    padding: "2px 8px",
    borderRadius: 100,
}

const propName: CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    fontWeight: 600,
    color: "#171B24",
}

const valueBlock: CSSProperties = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 13,
    color: "#4B5262",
    wordBreak: "break-word",
    minHeight: 20,
}

const valueRow: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
}

const swatch: CSSProperties = {
    width: 14,
    height: 14,
    borderRadius: 4,
    border: "1px solid rgba(0,0,0,0.15)",
    display: "inline-block",
}

const thumb: CSSProperties = {
    width: "100%",
    maxHeight: 80,
    objectFit: "cover",
    borderRadius: 6,
    display: "block",
}

const slotBox: CSSProperties = {
    display: "block",
    border: "1px dashed #C6CCD8",
    borderRadius: 8,
    padding: 8,
}

const empty: CSSProperties = {
    color: "#8790A1",
    fontStyle: "italic",
}

const descText: CSSProperties = {
    margin: 0,
    fontSize: 12.5,
    lineHeight: 1.55,
    color: "#8790A1",
}

addPropertyControls(PropertyControlsReference, {
    label: {
        type: ControlType.String,
        title: "Title",
        defaultValue: "Property Controls Reference",
        description: "Título exibido no topo do componente.",
    },
    showToggle: {
        type: ControlType.Boolean,
        title: "Boolean",
        defaultValue: true,
        description:
            "Renderiza um interruptor sim/não. Use para recursos que existem ou não — mostrar/ocultar algo, ligar um comportamento.",
    },
    count: {
        type: ControlType.Number,
        title: "Number",
        min: 0,
        max: 20,
        step: 1,
        defaultValue: 4,
        description:
            "Campo numérico com slider, faixa (min/max) e passo (step) configuráveis. Use para quantidades, tamanhos e durações.",
    },
    variant: {
        type: ControlType.Enum,
        title: "Enum",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
        description:
            'Escolha única entre valores fixos, exibida como dropdown. "options" traz os valores reais e "optionTitles" os rótulos amigáveis, na mesma ordem.',
    },
    align: {
        type: ControlType.SegmentedEnum,
        title: "SegmentedEnum",
        options: ["left", "center", "right"],
        optionIcons: ["align-left", "align-center", "align-right"],
        defaultValue: "left",
        description:
            "Como o Enum, mas sempre exibido como botões segmentados — ótimo para alinhamento e direção, com suporte a ícones em vez de texto.",
    },
    tint: {
        type: ControlType.Color,
        title: "Color",
        defaultValue: "#0F7D72",
        description:
            "Seletor de cor nativo do Framer, com suporte a Color Styles e variáveis do projeto.",
    },
    photo: {
        type: ControlType.ResponsiveImage,
        title: "ResponsiveImage",
        description:
            "Upload de imagem com srcSet gerado automaticamente pelo Framer — várias resoluções para carregar mais rápido no site publicado.",
    },
    icon: {
        type: ControlType.File,
        title: "File",
        allowedFileTypes: ["svg"],
        description:
            'Upload de qualquer arquivo, aqui restrito a SVG via "allowedFileTypes". Use para logos, ícones e outros assets.',
    },
    heading: {
        type: ControlType.Font,
        title: "Font",
        controls: "extended",
        defaultValue: { fontSize: 24, fontWeight: 600 },
        description:
            'Seletor completo de tipografia — família, peso, tamanho e espaçamento — puxando as fontes do projeto. "controls: extended" expõe mais subpropriedades.',
    },
    innerSpacing: {
        type: ControlType.Padding,
        title: "Padding",
        defaultValue: "16px 16px 16px 16px",
        description:
            "Editor visual de espaçamento interno com os 4 lados vinculáveis por um cadeado, igual ao painel de estilo nativo.",
    },
    corner: {
        type: ControlType.BorderRadius,
        title: "BorderRadius",
        defaultValue: "12px",
        description:
            "Editor de raio de borda por canto, ou um único valor vinculado a todos os cantos.",
    },
    outline: {
        type: ControlType.Border,
        title: "Border",
        defaultValue: { borderWidth: 1, borderStyle: "solid", borderColor: "#0F7D72" },
        description:
            "Largura, estilo (sólido/tracejado/pontilhado) e cor de borda — pode variar por lado, igual ao painel Border nativo.",
    },
    elevation: {
        type: ControlType.BoxShadow,
        title: "BoxShadow",
        defaultValue: "0px 8px 24px rgba(15,125,114,0.18)",
        description:
            "Uma ou mais sombras empilháveis, com cor, blur, spread, offset e opção inset (sombra interna).",
    },
    motionCurve: {
        type: ControlType.Transition,
        title: "Transition",
        defaultValue: { type: "spring", stiffness: 200, damping: 20 },
        description:
            "Curva de animação completa (spring, ease ou tween) com duração/rigidez e delay, no mesmo formato do Framer Motion.",
    },
    gap: {
        type: ControlType.FusedNumber,
        title: "FusedNumber",
        toggleKey: "gapLinked",
        toggleTitles: ["Linked", "Per side"],
        valueKeys: ["gap"],
        valueLabels: ["Gap"],
        defaultValue: 12,
        description:
            'Números relacionados com um toggle para "vincular todos" a um único valor ou editar cada um separadamente.',
    },
    tags: {
        type: ControlType.Array,
        title: "Array",
        control: { type: ControlType.String },
        defaultValue: ["framer", "code-component", "reference"],
        description:
            'Lista repetível de itens, cada um controlado pelo tipo definido em "control" — aqui, uma lista de textos. Pode conter qualquer outro ControlType, inclusive Object.',
    },
    meta: {
        type: ControlType.Object,
        title: "Object",
        controls: {
            author: { type: ControlType.String, defaultValue: "AYVU" },
            version: { type: ControlType.String, defaultValue: "1.0" },
        },
        description:
            "Agrupa vários controles relacionados em uma seção colapsável — bom para organizar um painel grande em blocos.",
    },
    slot: {
        type: ControlType.ComponentInstance,
        title: "ComponentInstance",
        description:
            "Slot para arrastar qualquer frame/componente do canvas para dentro deste componente. Chega no código como ReactNode. Conecte um frame para ver o slot preenchido.",
    },
    onAction: {
        type: ControlType.EventHandler,
        title: "EventHandler",
        description:
            "Expõe um evento que pode ser ligado a uma interação do Framer (ex.: ao clicar), sem escrever código.",
    },
    destination: {
        type: ControlType.Link,
        title: "Link",
        defaultValue: "https://www.framer.com/developers/",
        description:
            "Campo de URL com suporte nativo a páginas internas do projeto Framer, além de links externos.",
    },
    eventDate: {
        type: ControlType.Date,
        title: "Date",
        description:
            "Seletor de data em calendário — útil para contadores regressivos ou conteúdo agendado.",
    },
})
