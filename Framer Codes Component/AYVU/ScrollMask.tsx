import { useEffect, useRef, useState } from "react"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Mask
 *
 * Container com scroll (vertical ou horizontal) que aplica um degradê de
 * máscara nas bordas, escondendo o conteúdo conforme ele sai da área
 * visível. A máscara em cada ponta some quando o scroll chega ao início ou
 * ao fim do conteúdo, revelando o conteúdo por completo.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 360
 * @framerIntrinsicHeight 420
 */
export default function ScrollMask(props: ScrollMaskProps) {
    const {
        items = [],
        direction = "vertical",
        maskSize = 60,
        gap = 16,
        padding = 16,
        showScrollbar = false,
        backgroundColor = "transparent",
    } = props

    const scrollRef = useRef<HTMLDivElement>(null)
    const [atStart, setAtStart] = useState(true)
    const [atEnd, setAtEnd] = useState(false)

    const isVertical = direction === "vertical"

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return

        const threshold = 2

        const updateEdges = () => {
            if (isVertical) {
                setAtStart(el.scrollTop <= threshold)
                setAtEnd(
                    el.scrollTop + el.clientHeight >=
                        el.scrollHeight - threshold
                )
            } else {
                setAtStart(el.scrollLeft <= threshold)
                setAtEnd(
                    el.scrollLeft + el.clientWidth >=
                        el.scrollWidth - threshold
                )
            }
        }

        updateEdges()
        el.addEventListener("scroll", updateEdges, { passive: true })

        const resizeObserver = new ResizeObserver(updateEdges)
        resizeObserver.observe(el)

        return () => {
            el.removeEventListener("scroll", updateEdges)
            resizeObserver.disconnect()
        }
    }, [isVertical, items.length])

    const startColor = atStart ? "black" : "transparent"
    const endColor = atEnd ? "black" : "transparent"

    const maskImage = isVertical
        ? `linear-gradient(to bottom, ${startColor} 0px, black ${maskSize}px, black calc(100% - ${maskSize}px), ${endColor} 100%)`
        : `linear-gradient(to right, ${startColor} 0px, black ${maskSize}px, black calc(100% - ${maskSize}px), ${endColor} 100%)`

    return (
        <div
            ref={scrollRef}
            className="framer-scroll-mask"
            style={{
                width: "100%",
                height: "100%",
                overflowX: isVertical ? "hidden" : "auto",
                overflowY: isVertical ? "auto" : "hidden",
                display: "flex",
                flexDirection: isVertical ? "column" : "row",
                gap,
                padding,
                boxSizing: "border-box",
                background: backgroundColor,
                WebkitMaskImage: maskImage,
                maskImage,
                scrollbarWidth: showScrollbar ? "auto" : "none",
            }}
        >
            {items.map((item, index) => (
                <div
                    key={index}
                    style={{ flex: isVertical ? "0 0 auto" : "0 0 auto" }}
                >
                    {item}
                </div>
            ))}
            {!showScrollbar && (
                <style>{`
                    .framer-scroll-mask::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>
            )}
        </div>
    )
}

interface ScrollMaskProps {
    items: React.ReactNode[]
    direction: "vertical" | "horizontal"
    maskSize: number
    gap: number
    padding: number
    showScrollbar: boolean
    backgroundColor: string
}

addPropertyControls(ScrollMask, {
    items: {
        type: ControlType.Array,
        title: "Itens",
        control: {
            type: ControlType.ComponentInstance,
        },
    },
    direction: {
        type: ControlType.Enum,
        title: "Direção",
        options: ["vertical", "horizontal"],
        optionTitles: ["Vertical", "Horizontal"],
        defaultValue: "vertical",
    },
    maskSize: {
        type: ControlType.Number,
        title: "Tamanho da máscara",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 60,
    },
    gap: {
        type: ControlType.Number,
        title: "Espaçamento",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
    },
    padding: {
        type: ControlType.Number,
        title: "Padding",
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 16,
    },
    showScrollbar: {
        type: ControlType.Boolean,
        title: "Scrollbar",
        defaultValue: false,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Fundo",
        defaultValue: "transparent",
    },
})
