import { useEffect, useRef, useState, type ReactNode } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Lock Cards
 *
 * Pins the section to the top of the viewport while the page scrolls
 * through it, and uses that scroll progress to slide the row of cards
 * horizontally from right to left. The vertical scroll effectively
 * "locks" the page in place while it drives lateral movement instead —
 * once the row has fully slid past, the page keeps scrolling normally.
 *
 * The arrows below the cards nudge the page's scroll position by one
 * card step (smoothly), rather than moving the cards directly, so
 * manual navigation and scroll-driven navigation stay in sync.
 *
 * Important: like other pinned/scrubbed sections, this component
 * creates its own scroll height (prop "Scroll Height", in vh) — place
 * it directly in a normal page flow, without constraining the frame's
 * height in Framer, for the lock effect to work.
 *
 * The eyebrow badge (icon + label, top-left of the sidebar) can be
 * designed as its own layer on the Canvas and connected via "Eyebrow
 * (Canvas)" — when connected it replaces the built-in icon/text eyebrow
 * entirely, so it's imported straight from the Canvas instead of being
 * built from text/image props.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 1216
 * @framerIntrinsicHeight 700
 */
export default function ScrollLockCards(props: ScrollLockCardsProps) {
    const {
        eyebrow,
        eyebrowText = "BEM VINDO A MEMP",
        eyebrowIcon,
        description = "Negócios de diferentes segmentos já contaram com a Memp para fortalecer comunicação, posicionamento e operação.",
        buttonText = "Entrar em contato",
        buttonLink,
        heading = "Soluções para empresas que precisam crescer com método.",
        cards = defaultCards,
        showNavigation = true,
        sidebarWidth = 314,
        cardWidth = 372,
        cardImageWidth = 298,
        cardHeight = 326,
        cardGap = 16,
        scrollHeight = 220,
        stickyTopOffset = 0,
        backgroundColor = "#FFFFFF",
        cardBackground = "#EEEEEE",
        textColor = "#000000",
        mutedTextColor = "rgba(0,0,0,0.56)",
        borderColor = "rgba(0,0,0,0.08)",
        buttonBackground = "#EEEEEE",
        buttonTextColor = "#000000",
    } = props

    const wrapperRef = useRef<HTMLDivElement>(null)
    const viewportRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)

    const [maxTranslate, setMaxTranslate] = useState(0)

    useEffect(() => {
        const measure = () => {
            const viewportWidth = viewportRef.current?.offsetWidth ?? 0
            const trackWidth = trackRef.current?.scrollWidth ?? 0
            setMaxTranslate(Math.max(0, trackWidth - viewportWidth))
        }

        measure()

        const observer = new ResizeObserver(measure)
        if (viewportRef.current) observer.observe(viewportRef.current)
        if (trackRef.current) observer.observe(trackRef.current)

        return () => observer.disconnect()
    }, [cards, cardWidth, cardImageWidth, cardGap])

    const { scrollYProgress } = useScroll({
        target: wrapperRef,
        offset: ["start start", "end end"],
    })

    const x = useTransform(scrollYProgress, [0, 1], [0, -maxTranslate])

    const goToCard = (direction: 1 | -1) => {
        const wrapperEl = wrapperRef.current
        if (!wrapperEl || maxTranslate <= 0) return

        const scrollableDistance = wrapperEl.offsetHeight - window.innerHeight
        if (scrollableDistance <= 0) return

        const step = cardWidth + cardGap
        const progressStep = step / maxTranslate
        const scrollStep = progressStep * scrollableDistance

        window.scrollBy({ top: scrollStep * direction, behavior: "smooth" })
    }

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                height: `${Math.max(120, scrollHeight)}vh`,
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: stickyTopOffset,
                    display: "flex",
                    justifyContent: "center",
                    width: "100%",
                    background: backgroundColor,
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 32,
                        width: "100%",
                        maxWidth: 1216,
                        paddingTop: 120,
                        paddingBottom: 64,
                        boxSizing: "border-box",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            alignSelf: "stretch",
                            flexShrink: 0,
                            width: sidebarWidth,
                            paddingRight: 32,
                            borderRight: `1px solid ${borderColor}`,
                            boxSizing: "border-box",
                        }}
                    >
                        {eyebrow ? (
                            eyebrow
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 16,
                                }}
                            >
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        flexShrink: 0,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        background: "rgba(0,0,0,0.08)",
                                        border: `1px solid ${borderColor}`,
                                    }}
                                >
                                    {eyebrowIcon?.src && (
                                        <img
                                            src={eyebrowIcon.src}
                                            alt={eyebrowIcon.alt ?? ""}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "contain",
                                                pointerEvents: "none",
                                            }}
                                            draggable={false}
                                        />
                                    )}
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 10,
                                        lineHeight: 1.4,
                                        letterSpacing: 1.6,
                                        textTransform: "uppercase",
                                        color: textColor,
                                        opacity: 0.72,
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {eyebrowText}
                                </p>
                            </div>
                        )}

                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 16,
                                width: "100%",
                            }}
                        >
                            <p
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    lineHeight: 1.4,
                                    color: mutedTextColor,
                                }}
                            >
                                {description}
                            </p>
                            <div
                                style={{
                                    width: "100%",
                                    height: 1,
                                    background: borderColor,
                                }}
                            />
                            <a
                                href={buttonLink?.href}
                                target={buttonLink?.href ? "_self" : undefined}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: 56,
                                    padding: "0 32px",
                                    background: buttonBackground,
                                    color: buttonTextColor,
                                    fontSize: 16,
                                    textDecoration: "none",
                                    boxSizing: "border-box",
                                }}
                            >
                                {buttonText}
                            </a>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: 32,
                            flex: "1 0 0",
                            minWidth: 0,
                            alignSelf: "stretch",
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontSize: 64,
                                lineHeight: 1.1,
                                color: textColor,
                            }}
                        >
                            {heading}
                        </p>

                        <div
                            ref={viewportRef}
                            style={{
                                width: "100%",
                                overflow: "hidden",
                            }}
                        >
                            <motion.div
                                ref={trackRef}
                                style={{
                                    display: "flex",
                                    gap: cardGap,
                                    x,
                                }}
                            >
                                {cards.map((card, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            flexShrink: 0,
                                            background: cardBackground,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "space-between",
                                                alignSelf: "stretch",
                                                flexShrink: 0,
                                                width: cardWidth,
                                                height: cardHeight,
                                                padding: 32,
                                                boxSizing: "border-box",
                                            }}
                                        >
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 32,
                                                    lineHeight: 1.2,
                                                    color: textColor,
                                                }}
                                            >
                                                {card.title}
                                            </p>
                                            <p
                                                style={{
                                                    margin: 0,
                                                    fontSize: 14,
                                                    lineHeight: 1.4,
                                                    color: mutedTextColor,
                                                }}
                                            >
                                                {card.description}
                                            </p>
                                        </div>
                                        <div
                                            style={{
                                                position: "relative",
                                                flexShrink: 0,
                                                width: cardImageWidth,
                                                height: cardHeight,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {card.image?.src && (
                                                <img
                                                    src={card.image.src}
                                                    alt={card.image.alt ?? ""}
                                                    style={{
                                                        position: "absolute",
                                                        inset: 0,
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        pointerEvents: "none",
                                                    }}
                                                    draggable={false}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        </div>

                        {showNavigation && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 16,
                                    alignItems: "center",
                                    justifyContent: "flex-end",
                                    width: "100%",
                                }}
                            >
                                <NavArrow
                                    direction="left"
                                    background={cardBackground}
                                    color={textColor}
                                    onClick={() => goToCard(-1)}
                                />
                                <NavArrow
                                    direction="right"
                                    background={cardBackground}
                                    color={textColor}
                                    onClick={() => goToCard(1)}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function NavArrow({
    direction,
    background,
    color,
    onClick,
}: {
    direction: "left" | "right"
    background: string
    color: string
    onClick: () => void
}) {
    return (
        <button
            aria-label={direction === "left" ? "Anterior" : "Próximo"}
            onClick={onClick}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 52,
                padding: 14,
                background,
                border: "none",
                cursor: "pointer",
                boxSizing: "border-box",
            }}
        >
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {direction === "left" ? (
                    <>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="11 6 5 12 11 18" />
                        <line x1="5" y1="12" x2="9" y2="12" />
                    </>
                ) : (
                    <>
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="13 6 19 12 13 18" />
                    </>
                )}
            </svg>
        </button>
    )
}

interface CardImage {
    src: string
    alt?: string
}

interface CardItem {
    title: string
    description: string
    image?: CardImage
}

interface ScrollLockCardsProps {
    eyebrow?: ReactNode
    eyebrowText: string
    eyebrowIcon?: CardImage
    description: string
    buttonText: string
    buttonLink?: { href?: string }
    heading: string
    cards: CardItem[]
    showNavigation: boolean
    sidebarWidth: number
    cardWidth: number
    cardImageWidth: number
    cardHeight: number
    cardGap: number
    scrollHeight: number
    stickyTopOffset: number
    backgroundColor: string
    cardBackground: string
    textColor: string
    mutedTextColor: string
    borderColor: string
    buttonBackground: string
    buttonTextColor: string
}

const defaultCards: CardItem[] = [
    {
        title: "Growth mkt",
        description:
            "Estruturamos ações de crescimento com foco em aquisição, posicionamento e conversão.",
    },
    {
        title: "Planejamento estratégico",
        description:
            "Definimos prioridades, metas, canais e direção para decisões mais consistentes.",
    },
    {
        title: "Auditoria comercial",
        description:
            "Analisamos processos, comunicação e operação comercial para identificar gargalos e oportunidades.",
    },
    {
        title: "Lançamento de produto",
        description:
            "Criamos a base estratégica e de comunicação para colocar novos produtos no mercado com mais força.",
    },
    {
        title: "Formação de equipe",
        description:
            "Apoiamos a construção de times mais alinhados, preparados e produtivos.",
    },
    {
        title: "Cobertura de eventos",
        description:
            "Transformamos eventos em conteúdo, presença de marca e material de relacionamento.",
    },
]

addPropertyControls(ScrollLockCards, {
    eyebrow: {
        type: ControlType.ComponentInstance,
        title: "Eyebrow (Canvas)",
        description:
            "Optional: connect a layer/component from the Canvas to use as the eyebrow badge instead of the built-in icon + text below. When connected, Eyebrow Text and Eyebrow Icon are ignored.",
    },
    eyebrowText: {
        type: ControlType.String,
        title: "Eyebrow Text",
        defaultValue: "BEM VINDO A MEMP",
        hidden: (props: ScrollLockCardsProps) => Boolean(props.eyebrow),
    },
    eyebrowIcon: {
        type: ControlType.ResponsiveImage,
        title: "Eyebrow Icon",
        hidden: (props: ScrollLockCardsProps) => Boolean(props.eyebrow),
    },
    description: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue:
            "Negócios de diferentes segmentos já contaram com a Memp para fortalecer comunicação, posicionamento e operação.",
    },
    buttonText: {
        type: ControlType.String,
        title: "Button Text",
        defaultValue: "Entrar em contato",
    },
    buttonLink: {
        type: ControlType.Link,
        title: "Button Link",
    },
    heading: {
        type: ControlType.String,
        title: "Heading",
        displayTextArea: true,
        defaultValue:
            "Soluções para empresas que precisam crescer com método.",
    },
    cards: {
        type: ControlType.Array,
        title: "Cards",
        control: {
            type: ControlType.Object,
            controls: {
                title: {
                    type: ControlType.String,
                    title: "Title",
                    defaultValue: "Card",
                },
                description: {
                    type: ControlType.String,
                    title: "Description",
                    displayTextArea: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
            },
        },
        defaultValue: defaultCards,
    },
    showNavigation: {
        type: ControlType.Boolean,
        title: "Navigation",
        defaultValue: true,
    },
    scrollHeight: {
        type: ControlType.Number,
        title: "Scroll Height",
        description:
            "Scroll distance (in vh) the section stays pinned while the cards slide from right to left. Increase for a slower, longer lock; decrease if the row finishes sliding too late.",
        min: 120,
        max: 500,
        step: 10,
        defaultValue: 220,
        unit: "vh",
    },
    stickyTopOffset: {
        type: ControlType.Number,
        title: "Top Offset",
        description: "Distance from the top where the section sticks (px).",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
    },
    sidebarWidth: {
        type: ControlType.Number,
        title: "Sidebar Width",
        min: 200,
        max: 500,
        step: 2,
        defaultValue: 314,
    },
    cardWidth: {
        type: ControlType.Number,
        title: "Card Text Width",
        min: 200,
        max: 600,
        step: 2,
        defaultValue: 372,
    },
    cardImageWidth: {
        type: ControlType.Number,
        title: "Card Image Width",
        min: 100,
        max: 600,
        step: 2,
        defaultValue: 298,
    },
    cardHeight: {
        type: ControlType.Number,
        title: "Card Height",
        min: 150,
        max: 600,
        step: 2,
        defaultValue: 326,
    },
    cardGap: {
        type: ControlType.Number,
        title: "Card Gap",
        min: 0,
        max: 64,
        step: 1,
        defaultValue: 16,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    cardBackground: {
        type: ControlType.Color,
        title: "Card Background",
        defaultValue: "#EEEEEE",
    },
    textColor: {
        type: ControlType.Color,
        title: "Text",
        defaultValue: "#000000",
    },
    mutedTextColor: {
        type: ControlType.Color,
        title: "Muted Text",
        defaultValue: "rgba(0,0,0,0.56)",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(0,0,0,0.08)",
    },
    buttonBackground: {
        type: ControlType.Color,
        title: "Button Background",
        defaultValue: "#EEEEEE",
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Button Text",
        defaultValue: "#000000",
    },
})
