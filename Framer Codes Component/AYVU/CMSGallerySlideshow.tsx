import { useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion, type PanInfo } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * CMS Gallery Slideshow
 *
 * Duas formas de conectar ao CMS:
 * 1. Canvas (recomendado): conecte, no seletor "Elemento CMS", um Collection
 *    List/Grid já vinculado à sua Collection (com um campo Gallery). O
 *    elemento conectado é renderizado internamente (invisível) e o
 *    componente lê as imagens que ele produz, acompanhando atualizações via
 *    MutationObserver. Framer não permite que componentes de código leiam
 *    dados do CMS diretamente — por isso a leitura acontece no DOM já
 *    renderizado, não em uma API de dados.
 * 2. Manual: arraste este componente para dentro de um Collection List e
 *    vincule o campo Gallery diretamente na prop "Galeria".
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 */
export default function CMSGallerySlideshow(props: CMSGallerySlideshowProps) {
    const {
        dataSource = "canvas",
        collectionSource,
        previewIndex = 0,
        images: manualImages = [],
        autoplay = true,
        interval = 4,
        pauseOnHover = true,
        loop = true,
        transitionStyle = "fade",
        showArrows = true,
        showDots = true,
        showCounter = false,
        objectFit = "cover",
        borderRadius = 0,
        arrowColor = "#FFFFFF",
        dotColor = "rgba(255,255,255,0.5)",
        dotActiveColor = "#FFFFFF",
    } = props

    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    const [index, setIndex] = useState(0)
    const [direction, setDirection] = useState(1)
    const [isHovering, setIsHovering] = useState(false)
    const [canvasImages, setCanvasImages] = useState<GalleryImage[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const collectionWrapperRef = useRef<HTMLDivElement>(null)

    // Modo "canvas": o elemento conectado via ControlType.ComponentInstance
    // (ex.: um Collection List já vinculado à Collection) é renderizado
    // dentro de collectionWrapperRef, invisível. Depois de montado, lemos as
    // <img>/background-image produzidas por ele e observamos mutações para
    // acompanhar trocas de dados do CMS.
    useLayoutEffect(() => {
        if (dataSource !== "canvas") {
            setCanvasImages([])
            return
        }

        const node = collectionWrapperRef.current
        if (!node) return

        const extractImages = () => {
            const seen = new Set<string>()
            const found: GalleryImage[] = []

            node.querySelectorAll("img").forEach((img) => {
                const src = img.currentSrc || img.src
                if (!src || seen.has(src)) return
                seen.add(src)
                found.push({ src, alt: img.alt })
            })

            node.querySelectorAll<HTMLElement>(
                "[style*='background-image']"
            ).forEach((el) => {
                const match = el.style.backgroundImage.match(
                    /url\(["']?(.*?)["']?\)/
                )
                const src = match?.[1]
                if (!src || seen.has(src)) return
                seen.add(src)
                found.push({ src, alt: el.getAttribute("aria-label") ?? "" })
            })

            setCanvasImages(found)
        }

        extractImages()

        const observer = new MutationObserver(extractImages)
        observer.observe(node, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "style"],
        })

        return () => observer.disconnect()
    }, [dataSource, collectionSource])

    const images = dataSource === "canvas" ? canvasImages : manualImages
    const total = images.length
    const hasMultiple = total > 1
    const maxIndex = Math.max(0, total - 1)

    // No Canvas do editor, o Collection List conectado pode demorar mais
    // para popular seus dados reais do CMS (ou usar dados de exemplo) do que
    // no Preview/site publicado. Enquanto isso, deixe escolher manualmente
    // qual slide visualizar através da prop "Slide de Pré-visualização".
    useLayoutEffect(() => {
        if (!isOnCanvas || total === 0) return
        const clamped = Math.max(0, Math.min(maxIndex, previewIndex ?? 0))
        setIndex(clamped)
    }, [isOnCanvas, previewIndex, maxIndex, total])

    const goTo = (nextIndex: number, dir: number) => {
        if (total === 0) return
        setDirection(dir)
        if (loop) {
            setIndex(((nextIndex % total) + total) % total)
        } else {
            setIndex(Math.min(Math.max(nextIndex, 0), total - 1))
        }
    }

    const goNext = () => goTo(index + 1, 1)
    const goPrev = () => goTo(index - 1, -1)

    useLayoutEffect(() => {
        if (!autoplay || !hasMultiple) return
        if (pauseOnHover && isHovering) return

        timerRef.current = setInterval(() => {
            setDirection(1)
            setIndex((current) => {
                const next = current + 1
                if (next >= total) {
                    return loop ? 0 : current
                }
                return next
            })
        }, Math.max(interval, 0.5) * 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [autoplay, interval, pauseOnHover, isHovering, hasMultiple, total, loop])

    const handleDragEnd = (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        const swipeThreshold = 50
        if (info.offset.x < -swipeThreshold) {
            goNext()
        } else if (info.offset.x > swipeThreshold) {
            goPrev()
        }
    }

    const variants = {
        fade: {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        },
        slide: {
            initial: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 1 }),
            animate: { x: "0%", opacity: 1 },
            exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 1 }),
        },
        zoom: {
            initial: { opacity: 0, scale: 1.08 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.96 },
        },
    } as const

    const activeVariant = variants[transitionStyle] ?? variants.fade
    const currentImage = images[index]

    return (
        <div
            style={{ ...containerStyle, borderRadius }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {dataSource === "canvas" && (
                <div ref={collectionWrapperRef} style={hiddenSourceStyle} aria-hidden="true">
                    {collectionSource}
                </div>
            )}

            {total === 0 ? (
                <div style={emptyStateStyle}>
                    {dataSource === "canvas"
                        ? collectionSource
                            ? "Nenhuma imagem encontrada dentro do elemento conectado. Confirme que ele está vinculado a uma Collection com campo Gallery."
                            : "Conecte, no painel de propriedades, um Collection List já vinculado à sua Collection do CMS através do seletor \"Elemento CMS\"."
                        : "Conecte este componente a uma Collection e selecione o campo de Galeria no painel de propriedades."}
                </div>
            ) : (
                <>
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={index}
                            custom={direction}
                            variants={activeVariant}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            drag={hasMultiple ? "x" : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.6}
                            onDragEnd={handleDragEnd}
                            style={slideStyle}
                        >
                            <img
                                src={currentImage?.src}
                                alt={currentImage?.alt ?? ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit,
                                    display: "block",
                                    pointerEvents: "none",
                                    userSelect: "none",
                                }}
                                draggable={false}
                            />
                        </motion.div>
                    </AnimatePresence>

                    {showArrows && hasMultiple && (
                        <>
                            <button
                                aria-label="Imagem anterior"
                                onClick={goPrev}
                                style={{ ...arrowStyle, left: 12, color: arrowColor }}
                            >
                                ‹
                            </button>
                            <button
                                aria-label="Próxima imagem"
                                onClick={goNext}
                                style={{ ...arrowStyle, right: 12, color: arrowColor }}
                            >
                                ›
                            </button>
                        </>
                    )}

                    {showCounter && hasMultiple && (
                        <div style={counterStyle}>
                            {index + 1} / {total}
                        </div>
                    )}

                    {showDots && hasMultiple && (
                        <div style={dotsContainerStyle}>
                            {images.map((_, dotIndex) => (
                                <button
                                    key={dotIndex}
                                    aria-label={`Ir para a imagem ${dotIndex + 1}`}
                                    onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                                    style={{
                                        ...dotStyle,
                                        background:
                                            dotIndex === index ? dotActiveColor : dotColor,
                                        transform:
                                            dotIndex === index ? "scale(1.2)" : "scale(1)",
                                    }}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

interface GalleryImage {
    src: string
    alt?: string
}

interface CMSGallerySlideshowProps {
    dataSource: "canvas" | "manual"
    collectionSource?: React.ReactNode
    previewIndex: number
    images: GalleryImage[]
    autoplay: boolean
    interval: number
    pauseOnHover: boolean
    loop: boolean
    transitionStyle: "fade" | "slide" | "zoom"
    showArrows: boolean
    showDots: boolean
    showCounter: boolean
    objectFit: "cover" | "contain" | "fill"
    borderRadius: number
    arrowColor: string
    dotColor: string
    dotActiveColor: string
}

const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#000000",
}

// O Collection List conectado é renderizado aqui, fora da vista, apenas
// para que possamos ler as imagens que ele produz no DOM.
const hiddenSourceStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    opacity: 0,
    pointerEvents: "none",
    zIndex: -1,
    overflow: "hidden",
}

const emptyStateStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#1A1A1A",
    color: "#8A8A8A",
    fontSize: 13,
    fontFamily: "inherit",
    textAlign: "center",
    padding: 16,
}

const slideStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    cursor: "grab",
}

const arrowStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(0,0,0,0.35)",
    border: "none",
    borderRadius: "50%",
    width: 36,
    height: 36,
    fontSize: 22,
    lineHeight: "36px",
    textAlign: "center",
    cursor: "pointer",
    zIndex: 2,
    padding: 0,
}

const counterStyle: React.CSSProperties = {
    position: "absolute",
    top: 12,
    right: 12,
    padding: "4px 10px",
    borderRadius: 999,
    background: "rgba(0,0,0,0.45)",
    color: "#FFFFFF",
    fontSize: 12,
    zIndex: 2,
}

const dotsContainerStyle: React.CSSProperties = {
    position: "absolute",
    bottom: 12,
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: 8,
    zIndex: 2,
}

const dotStyle: React.CSSProperties = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    border: "none",
    padding: 0,
    cursor: "pointer",
    transition: "transform 0.2s ease, background 0.2s ease",
}

addPropertyControls(CMSGallerySlideshow, {
    dataSource: {
        type: ControlType.Enum,
        title: "Origem",
        options: ["canvas", "manual"],
        optionTitles: ["Selecionar no Canvas", "Manual / Collection List"],
        defaultValue: "canvas",
    },
    collectionSource: {
        type: ControlType.ComponentInstance,
        title: "Elemento CMS",
        description:
            "Conecte um Collection List/Grid já vinculado à sua Collection do CMS (com um campo Gallery). Ele é renderizado internamente (invisível) e as imagens que produz alimentam o slideshow.",
        hidden: (props) => props.dataSource !== "canvas",
    },
    previewIndex: {
        type: ControlType.Number,
        title: "Slide (Canvas)",
        min: 0,
        step: 1,
        defaultValue: 0,
        description:
            "Apenas no Canvas: escolha manualmente qual imagem visualizar enquanto edita, já que os dados reais do CMS podem levar um instante a mais para aparecer no editor do que no Preview.",
        hidden: (props) => props.dataSource !== "canvas",
    },
    images: {
        type: ControlType.Array,
        title: "Galeria",
        description:
            "Vincule ao campo do tipo Gallery da sua Collection do CMS através do seletor de campos do Collection List.",
        control: {
            type: ControlType.ResponsiveImage,
        },
        hidden: (props) => props.dataSource !== "manual",
    },
    transitionStyle: {
        type: ControlType.Enum,
        title: "Transição",
        options: ["fade", "slide", "zoom"],
        optionTitles: ["Fade", "Slide", "Zoom"],
        defaultValue: "fade",
    },
    autoplay: {
        type: ControlType.Boolean,
        title: "Autoplay",
        defaultValue: true,
    },
    interval: {
        type: ControlType.Number,
        title: "Intervalo (s)",
        min: 1,
        max: 20,
        step: 0.5,
        defaultValue: 4,
        hidden: (props) => !props.autoplay,
    },
    pauseOnHover: {
        type: ControlType.Boolean,
        title: "Pausar no hover",
        defaultValue: true,
        hidden: (props) => !props.autoplay,
    },
    loop: {
        type: ControlType.Boolean,
        title: "Loop",
        defaultValue: true,
    },
    showArrows: {
        type: ControlType.Boolean,
        title: "Setas",
        defaultValue: true,
    },
    showDots: {
        type: ControlType.Boolean,
        title: "Indicadores",
        defaultValue: true,
    },
    showCounter: {
        type: ControlType.Boolean,
        title: "Contador",
        defaultValue: false,
    },
    objectFit: {
        type: ControlType.Enum,
        title: "Ajuste",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cobrir", "Conter", "Preencher"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Raio da borda",
        min: 0,
        max: 100,
        defaultValue: 0,
    },
    arrowColor: {
        type: ControlType.Color,
        title: "Cor das setas",
        defaultValue: "#FFFFFF",
    },
    dotColor: {
        type: ControlType.Color,
        title: "Cor do indicador",
        defaultValue: "rgba(255,255,255,0.5)",
    },
    dotActiveColor: {
        type: ControlType.Color,
        title: "Cor do indicador ativo",
        defaultValue: "#FFFFFF",
    },
})
