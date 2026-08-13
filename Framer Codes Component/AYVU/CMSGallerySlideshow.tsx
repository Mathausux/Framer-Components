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
 *    componente lê as imagens e vídeos que ele produz, acompanhando
 *    atualizações via MutationObserver. Framer não permite que componentes
 *    de código leiam dados do CMS diretamente — por isso a leitura acontece
 *    no DOM já renderizado, não em uma API de dados.
 * 2. Manual: adicione itens diretamente na prop "Itens" — cada item pode
 *    ser uma imagem ou um vídeo.
 *
 * Slides podem ser imagem ou vídeo (com opção de aguardar o vídeo terminar
 * antes de avançar). Setas, indicadores (dots) e contador são totalmente
 * configuráveis: posição, tamanho, cores, blur, contorno e (para setas)
 * layout separado/agrupado.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 400
 * @framerIntrinsicHeight 300
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavPosition =
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
    | "outside"

type ArrowsPosition = "top" | "center" | "bottom" | "outside"

interface GallerySlide {
    type: "image" | "video"
    src: string
    alt?: string
    poster?: string
}

interface ManualItem {
    mediaType: "image" | "video"
    image?: { src: string }
    video?: string
    poster?: { src: string }
    alt?: string
}

interface ArrowsSettings {
    show: boolean
    layout: "split" | "grouped"
    position: ArrowsPosition
    groupedPosition: NavPosition
    groupedGap: number
    inset: number
    size: number
    iconSize: number
    color: string
    background: string
    radius: number
    blur: number
    strokeColor: string
    strokeWidth: number
}

interface DotsSettings {
    show: boolean
    position: NavPosition
    inset: number
    size: number
    gap: number
    padding: number
    backgroundColor: string
    activeColor: string
    inactiveColor: string
    blur: number
    strokeColor: string
    strokeWidth: number
}

interface CounterSettings {
    show: boolean
    position: NavPosition
    inset: number
    textColor: string
    background: string
    fontSize: number
}

interface CMSGallerySlideshowProps {
    dataSource: "canvas" | "manual"
    collectionSource?: React.ReactNode
    previewIndex: number
    items: ManualItem[]
    cmsVideoFile?: string
    cmsVideoVisible: boolean
    cmsVideoPosition: "first" | "last"
    autoplay: boolean
    interval: number
    pauseOnHover: boolean
    loop: boolean
    waitForVideo: boolean
    transitionStyle: "fade" | "slide" | "zoom"
    objectFit: "cover" | "contain" | "fill"
    borderRadius: number
    arrows: ArrowsSettings
    dots: DotsSettings
    counter: CounterSettings
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultArrows: ArrowsSettings = {
    show: true,
    layout: "split",
    position: "center",
    groupedPosition: "bottom-right",
    groupedGap: 8,
    inset: 12,
    size: 36,
    iconSize: 14,
    color: "#FFFFFF",
    background: "rgba(0,0,0,0.35)",
    radius: 999,
    blur: 0,
    strokeColor: "rgba(255,255,255,0.2)",
    strokeWidth: 0,
}

const defaultDots: DotsSettings = {
    show: true,
    position: "bottom-center",
    inset: 12,
    size: 8,
    gap: 8,
    padding: 6,
    backgroundColor: "rgba(0,0,0,0)",
    activeColor: "#FFFFFF",
    inactiveColor: "rgba(255,255,255,0.5)",
    blur: 0,
    strokeColor: "rgba(255,255,255,0.15)",
    strokeWidth: 0,
}

const defaultCounter: CounterSettings = {
    show: false,
    position: "top-right",
    inset: 12,
    textColor: "#FFFFFF",
    background: "rgba(0,0,0,0.45)",
    fontSize: 12,
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function getOverlayPosition(
    position: NavPosition,
    inset: number
): React.CSSProperties {
    switch (position) {
        case "top-left":
            return { top: inset, left: inset }
        case "top-center":
            return { top: inset, left: "50%", transform: "translateX(-50%)" }
        case "top-right":
            return { top: inset, right: inset }
        case "bottom-left":
            return { bottom: inset, left: inset }
        case "bottom-right":
            return { bottom: inset, right: inset }
        case "bottom-center":
        default:
            return {
                bottom: inset,
                left: "50%",
                transform: "translateX(-50%)",
            }
    }
}

function getArrowVerticalStyle(
    position: ArrowsPosition,
    inset: number,
    size: number
): React.CSSProperties {
    switch (position) {
        case "top":
            return { top: inset }
        case "bottom":
            return { bottom: inset }
        case "center":
        default:
            // Evita `transform: translateY(-50%)`: uma vez que o Framer
            // Motion anima o elemento, ele passa a controlar `transform`
            // por inteiro e descarta o que foi setado via style — usar
            // marginTop centraliza sem depender de transform.
            return { top: "50%", marginTop: -size / 2 }
    }
}

function ChevronIcon({
    direction,
    size,
    color,
}: {
    direction: "left" | "right"
    size: number
    color: string
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ display: "block", flexShrink: 0 }}
        >
            <path
                d={
                    direction === "left"
                        ? "M15 5L8 12L15 19"
                        : "M9 5L16 12L9 19"
                }
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CMSGallerySlideshow(props: CMSGallerySlideshowProps) {
    const {
        dataSource = "canvas",
        collectionSource,
        previewIndex = 0,
        items: manualItems = [],
        cmsVideoFile,
        cmsVideoVisible = true,
        cmsVideoPosition = "last",
        autoplay = true,
        interval = 4,
        pauseOnHover = true,
        loop = true,
        waitForVideo = true,
        transitionStyle = "fade",
        objectFit = "cover",
        borderRadius = 0,
        arrows = defaultArrows,
        dots = defaultDots,
        counter = defaultCounter,
    } = props

    const isOnCanvas = RenderTarget.current() === RenderTarget.canvas

    const [index, setIndex] = useState(0)
    const [direction, setDirection] = useState(1)
    const [isHovering, setIsHovering] = useState(false)
    const [canvasSlides, setCanvasSlides] = useState<GallerySlide[]>([])
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const collectionWrapperRef = useRef<HTMLDivElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)

    // Modo "canvas": o elemento conectado via ControlType.ComponentInstance
    // (ex.: um Collection List já vinculado à Collection) é renderizado
    // dentro de collectionWrapperRef, invisível. Depois de montado, lemos as
    // <img>/<video>/background-image produzidas por ele, na ordem em que
    // aparecem no DOM, e observamos mutações para acompanhar trocas de
    // dados do CMS.
    useLayoutEffect(() => {
        if (dataSource !== "canvas") {
            setCanvasSlides([])
            return
        }

        const node = collectionWrapperRef.current
        if (!node) return

        const extractSlides = () => {
            const seen = new Set<string>()
            const found: GallerySlide[] = []

            node.querySelectorAll("img, video").forEach((el) => {
                if (el.tagName === "VIDEO") {
                    const video = el as HTMLVideoElement
                    const src =
                        video.currentSrc ||
                        video.src ||
                        video.querySelector("source")?.src ||
                        ""
                    if (!src || seen.has(src)) return
                    seen.add(src)
                    found.push({
                        type: "video",
                        src,
                        alt: video.getAttribute("aria-label") ?? "",
                        poster: video.poster || undefined,
                    })
                } else {
                    const img = el as HTMLImageElement
                    const src = img.currentSrc || img.src
                    if (!src || seen.has(src)) return
                    seen.add(src)
                    found.push({ type: "image", src, alt: img.alt })
                }
            })

            // Um campo do tipo File (usado para importar .mp4 no CMS) é
            // renderizado pela Framer como um link, não como <video>. Detecta
            // qualquer <a href> apontando para um arquivo de vídeo.
            node.querySelectorAll<HTMLAnchorElement>("a[href]").forEach(
                (a) => {
                    const href = a.href
                    if (!href || seen.has(href)) return
                    if (!/\.(mp4|webm|mov|m4v|ogv|ogg)(\?.*)?$/i.test(href))
                        return
                    seen.add(href)
                    found.push({
                        type: "video",
                        src: href,
                        alt:
                            a.getAttribute("aria-label") ??
                            a.textContent?.trim() ??
                            "",
                    })
                }
            )

            node.querySelectorAll<HTMLElement>(
                "[style*='background-image']"
            ).forEach((el) => {
                const match = el.style.backgroundImage.match(
                    /url\(["']?(.*?)["']?\)/
                )
                const src = match?.[1]
                if (!src || seen.has(src)) return
                seen.add(src)
                found.push({
                    type: "image",
                    src,
                    alt: el.getAttribute("aria-label") ?? "",
                })
            })

            setCanvasSlides(found)
        }

        extractSlides()

        const observer = new MutationObserver(extractSlides)
        observer.observe(node, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["src", "srcset", "style", "poster", "href"],
        })

        return () => observer.disconnect()
    }, [dataSource, collectionSource])

    const manualSlides: GallerySlide[] = manualItems
        .map((item): GallerySlide | null => {
            if (item.mediaType === "video") {
                if (!item.video) return null
                return {
                    type: "video",
                    src: item.video,
                    alt: item.alt,
                    poster: item.poster?.src,
                }
            }
            if (!item.image?.src) return null
            return { type: "image", src: item.image.src, alt: item.alt }
        })
        .filter((slide): slide is GallerySlide => slide !== null)

    // Vídeo vinculado diretamente a uma variável do CMS (campo File), útil
    // quando este componente é colocado como o próprio item repetido dentro
    // de um Collection List. "Visível" permite ligar a um campo Boolean do
    // CMS para esconder o vídeo em registros que não o possuem.
    const cmsVideoSlides: GallerySlide[] =
        cmsVideoVisible && cmsVideoFile
            ? [{ type: "video", src: cmsVideoFile }]
            : []

    const baseSlides = dataSource === "canvas" ? canvasSlides : manualSlides
    const slides =
        cmsVideoPosition === "first"
            ? [...cmsVideoSlides, ...baseSlides]
            : [...baseSlides, ...cmsVideoSlides]
    const total = slides.length
    const hasMultiple = total > 1
    const maxIndex = Math.max(0, total - 1)

    // No Canvas do editor, o Collection List conectado pode demorar mais
    // para popular seus dados reais do CMS (ou usar dados de exemplo) do que
    // no Preview/site publicado. Enquanto isso, deixe escolher manualmente
    // qual slide visualizar através da prop "Slide (Canvas)".
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

    // Enquanto o usuário arrasta, o slide vizinho (próximo ou anterior)
    // aparece já encostado na borda que está sendo revelada, acompanhando o
    // dedo em tempo real, em vez de mostrar o fundo do container por baixo
    // do slide atual.
    const [peekDirection, setPeekDirection] = useState<0 | 1 | -1>(0)
    const [dragOffsetPx, setDragOffsetPx] = useState(0)

    const currentSlide = slides[index]
    const nextSlide = loop
        ? slides[(index + 1) % Math.max(total, 1)]
        : slides[index + 1]
    const prevSlide = loop
        ? slides[(index - 1 + Math.max(total, 1)) % Math.max(total, 1)]
        : slides[index - 1]
    const currentIsVideo = currentSlide?.type === "video"
    // Se o slide atual é um vídeo e "Aguardar vídeo" está ativo, o avanço
    // não usa o intervalo — ele acontece pelo evento onEnded do <video>.
    const autoAdvanceByTimer = autoplay && !(currentIsVideo && waitForVideo)

    useLayoutEffect(() => {
        if (!autoAdvanceByTimer || !hasMultiple) return
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
    }, [
        autoAdvanceByTimer,
        interval,
        pauseOnHover,
        isHovering,
        hasMultiple,
        total,
        loop,
    ])

    const handleDrag = (
        _event: MouseEvent | TouchEvent | PointerEvent,
        info: PanInfo
    ) => {
        setDragOffsetPx(info.offset.x)
        if (info.offset.x < -4) setPeekDirection(1)
        else if (info.offset.x > 4) setPeekDirection(-1)
        else setPeekDirection(0)
    }

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
        setPeekDirection(0)
        setDragOffsetPx(0)
    }

    const renderSlideMedia = (slide: GallerySlide | undefined) => {
        if (!slide) return null
        if (slide.type === "video") {
            return (
                <video
                    src={slide.src}
                    poster={slide.poster}
                    aria-label={slide.alt ?? ""}
                    muted
                    loop
                    playsInline
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit,
                        display: "block",
                        pointerEvents: "none",
                    }}
                />
            )
        }
        return (
            <img
                src={slide.src}
                alt={slide.alt ?? ""}
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
        )
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

    const isGroupedArrows = arrows.layout === "grouped"
    const arrowsEffectivePosition = isGroupedArrows
        ? arrows.groupedPosition
        : arrows.position

    const arrowsOverlay =
        arrows.show && arrowsEffectivePosition !== "outside" && hasMultiple
    const dotsOverlay = dots.show && dots.position !== "outside" && hasMultiple
    const counterOverlay = counter.show && counter.position !== "outside"

    const arrowsOutside =
        arrows.show && arrowsEffectivePosition === "outside" && hasMultiple
    const dotsOutside = dots.show && dots.position === "outside" && hasMultiple
    const counterOutside = counter.show && counter.position === "outside"

    const hasBottomBar = arrowsOutside || dotsOutside || counterOutside

    const isPrevDisabled = !loop && index <= 0
    const isNextDisabled = !loop && index >= maxIndex

    const arrowButtonBaseStyle = (disabled: boolean): React.CSSProperties => ({
        width: arrows.size,
        height: arrows.size,
        borderRadius: arrows.radius,
        border: `${arrows.strokeWidth}px solid ${arrows.strokeColor}`,
        boxSizing: "border-box",
        background: arrows.background,
        backdropFilter: arrows.blur > 0 ? `blur(${arrows.blur}px)` : undefined,
        WebkitBackdropFilter:
            arrows.blur > 0 ? `blur(${arrows.blur}px)` : undefined,
        color: arrows.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        padding: 0,
        flexShrink: 0,
        pointerEvents: "auto",
    })

    const renderArrowButtonsSplit = (positioned: boolean) => (
        <>
            <motion.button
                aria-label="Imagem anterior"
                onClick={goPrev}
                disabled={isPrevDisabled}
                whileTap={isPrevDisabled ? undefined : { scale: 0.9 }}
                style={{
                    position: positioned ? "absolute" : "relative",
                    left: positioned ? arrows.inset : undefined,
                    ...(positioned
                        ? getArrowVerticalStyle(
                              arrows.position,
                              arrows.inset,
                              arrows.size
                          )
                        : {}),
                    ...arrowButtonBaseStyle(isPrevDisabled),
                    zIndex: 2,
                }}
            >
                <ChevronIcon
                    direction="left"
                    size={arrows.iconSize}
                    color={arrows.color}
                />
            </motion.button>
            <motion.button
                aria-label="Próxima imagem"
                onClick={goNext}
                disabled={isNextDisabled}
                whileTap={isNextDisabled ? undefined : { scale: 0.9 }}
                style={{
                    position: positioned ? "absolute" : "relative",
                    right: positioned ? arrows.inset : undefined,
                    ...(positioned
                        ? getArrowVerticalStyle(
                              arrows.position,
                              arrows.inset,
                              arrows.size
                          )
                        : {}),
                    ...arrowButtonBaseStyle(isNextDisabled),
                    zIndex: 2,
                }}
            >
                <ChevronIcon
                    direction="right"
                    size={arrows.iconSize}
                    color={arrows.color}
                />
            </motion.button>
        </>
    )

    const renderArrowButtonsGrouped = () => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: arrows.groupedGap,
            }}
        >
            <motion.button
                aria-label="Imagem anterior"
                onClick={goPrev}
                disabled={isPrevDisabled}
                whileTap={isPrevDisabled ? undefined : { scale: 0.9 }}
                style={arrowButtonBaseStyle(isPrevDisabled)}
            >
                <ChevronIcon
                    direction="left"
                    size={arrows.iconSize}
                    color={arrows.color}
                />
            </motion.button>
            <motion.button
                aria-label="Próxima imagem"
                onClick={goNext}
                disabled={isNextDisabled}
                whileTap={isNextDisabled ? undefined : { scale: 0.9 }}
                style={arrowButtonBaseStyle(isNextDisabled)}
            >
                <ChevronIcon
                    direction="right"
                    size={arrows.iconSize}
                    color={arrows.color}
                />
            </motion.button>
        </div>
    )

    const renderDots = () => (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: dots.gap,
                padding: dots.padding,
                borderRadius: 999,
                background: dots.backgroundColor,
                border: `${dots.strokeWidth}px solid ${dots.strokeColor}`,
                boxSizing: "border-box",
                backdropFilter:
                    dots.blur > 0 ? `blur(${dots.blur}px)` : undefined,
                WebkitBackdropFilter:
                    dots.blur > 0 ? `blur(${dots.blur}px)` : undefined,
            }}
        >
            {slides.map((_, dotIndex) => {
                const isActive = dotIndex === index
                return (
                    <motion.button
                        key={dotIndex}
                        aria-label={`Ir para a imagem ${dotIndex + 1}`}
                        onClick={() => goTo(dotIndex, dotIndex > index ? 1 : -1)}
                        whileTap={{ scale: 0.85 }}
                        animate={{
                            scale: isActive ? 1.15 : 1,
                            backgroundColor: isActive
                                ? dots.activeColor
                                : dots.inactiveColor,
                        }}
                        style={{
                            width: dots.size,
                            height: dots.size,
                            borderRadius: 999,
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            flexShrink: 0,
                        }}
                    />
                )
            })}
        </div>
    )

    const renderCounter = () => (
        <div
            style={{
                padding: "4px 10px",
                borderRadius: 999,
                background: counter.background,
                color: counter.textColor,
                fontSize: counter.fontSize,
            }}
        >
            {index + 1} / {total}
        </div>
    )

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

            <div style={frameStyle}>
                {total === 0 ? (
                    <div style={emptyStateStyle}>
                        {dataSource === "canvas"
                            ? collectionSource
                                ? "Nenhuma imagem ou vídeo encontrado dentro do elemento conectado. Confirme que ele está vinculado a uma Collection com campo Gallery."
                                : "Conecte, no painel de propriedades, um Collection List já vinculado à sua Collection do CMS através do seletor \"Elemento CMS\"."
                            : "Adicione itens (imagem ou vídeo) na prop \"Itens\" no painel de propriedades."}
                    </div>
                ) : (
                    <>
                        {peekDirection !== 0 && (
                            <div
                                style={{
                                    ...slideStyle,
                                    transform: `translateX(calc(${
                                        peekDirection === 1 ? "100%" : "-100%"
                                    } + ${dragOffsetPx}px))`,
                                }}
                            >
                                {renderSlideMedia(
                                    peekDirection === 1 ? nextSlide : prevSlide
                                )}
                            </div>
                        )}

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
                                dragElastic={1}
                                style={slideStyle}
                                onDrag={handleDrag}
                                onDragEnd={handleDragEnd}
                            >
                                {currentSlide?.type === "video" ? (
                                    <video
                                        ref={videoRef}
                                        src={currentSlide.src}
                                        poster={currentSlide.poster}
                                        aria-label={currentSlide.alt ?? ""}
                                        autoPlay
                                        muted
                                        loop={!waitForVideo}
                                        playsInline
                                        onEnded={() => {
                                            if (waitForVideo) goNext()
                                        }}
                                        style={{
                                            width: "100%",
                                            height: "100%",
                                            objectFit,
                                            display: "block",
                                            pointerEvents: "none",
                                        }}
                                    />
                                ) : (
                                    <img
                                        src={currentSlide?.src}
                                        alt={currentSlide?.alt ?? ""}
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
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {arrowsOverlay &&
                            (isGroupedArrows ? (
                                <div
                                    style={{
                                        position: "absolute",
                                        zIndex: 2,
                                        pointerEvents: "auto",
                                        ...getOverlayPosition(
                                            arrows.groupedPosition,
                                            arrows.inset
                                        ),
                                    }}
                                >
                                    {renderArrowButtonsGrouped()}
                                </div>
                            ) : (
                                renderArrowButtonsSplit(true)
                            ))}

                        {dotsOverlay && (
                            <div
                                style={{
                                    position: "absolute",
                                    zIndex: 2,
                                    pointerEvents: "auto",
                                    ...getOverlayPosition(
                                        dots.position,
                                        dots.inset
                                    ),
                                }}
                            >
                                {renderDots()}
                            </div>
                        )}

                        {counterOverlay && (
                            <div
                                style={{
                                    position: "absolute",
                                    zIndex: 2,
                                    pointerEvents: "none",
                                    ...getOverlayPosition(
                                        counter.position,
                                        counter.inset
                                    ),
                                }}
                            >
                                {renderCounter()}
                            </div>
                        )}
                    </>
                )}
            </div>

            {hasBottomBar && total > 0 && (
                <div style={bottomBarStyle}>
                    {arrowsOutside && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: isGroupedArrows ? arrows.groupedGap : 12,
                            }}
                        >
                            {isGroupedArrows
                                ? renderArrowButtonsGrouped()
                                : renderArrowButtonsSplit(false)}
                        </div>
                    )}
                    {dotsOutside && renderDots()}
                    {counterOutside && renderCounter()}
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const containerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: "#000000",
    display: "flex",
    flexDirection: "column",
}

const frameStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
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
    position: "absolute",
    inset: 0,
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

const bottomBarStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px 12px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    background: "#000000",
}

// ---------------------------------------------------------------------------
// Property Controls
// ---------------------------------------------------------------------------

const NAV_POSITION_OPTIONS: NavPosition[] = [
    "top-left",
    "top-center",
    "top-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
    "outside",
]
const NAV_POSITION_TITLES = [
    "Superior esquerda",
    "Superior centro",
    "Superior direita",
    "Inferior esquerda",
    "Inferior centro",
    "Inferior direita",
    "Fora (abaixo)",
]

const ARROW_POSITION_OPTIONS: ArrowsPosition[] = [
    "top",
    "center",
    "bottom",
    "outside",
]
const ARROW_POSITION_TITLES = ["Topo", "Centro", "Base", "Fora (abaixo)"]

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
    items: {
        type: ControlType.Array,
        title: "Itens",
        description:
            "Cada item pode ser uma imagem ou um vídeo. Para vincular ao campo Gallery da sua Collection, prefira o modo \"Selecionar no Canvas\".",
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Tipo",
                    options: ["image", "video"],
                    optionTitles: ["Imagem", "Vídeo"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Imagem",
                    hidden: (item: ManualItem) => item.mediaType !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Vídeo",
                    allowedFileTypes: ["mp4", "webm", "mov", "ogg"],
                    hidden: (item: ManualItem) => item.mediaType !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Capa (opcional)",
                    hidden: (item: ManualItem) => item.mediaType !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Texto alternativo",
                    defaultValue: "",
                },
            },
        },
        hidden: (props) => props.dataSource !== "manual",
    },
    waitForVideo: {
        type: ControlType.Boolean,
        title: "Aguardar vídeo",
        defaultValue: true,
        description:
            "Quando um slide é vídeo, aguarda ele terminar antes de avançar automaticamente, em vez de usar o intervalo fixo.",
    },
    cmsVideoFile: {
        type: ControlType.File,
        title: "Vídeo (CMS)",
        allowedFileTypes: ["mp4", "webm", "mov", "m4v", "ogg"],
        description:
            "Vincule diretamente a um campo File da sua Collection do CMS usando o ícone de variável — útil quando este componente é usado como o próprio item repetido dentro de um Collection List. Independe do modo \"Origem\" acima.",
    },
    cmsVideoVisible: {
        type: ControlType.Boolean,
        title: "Vídeo visível",
        defaultValue: true,
        description:
            "Pode ser vinculado a um campo Boolean do CMS para esconder o vídeo em registros que não possuem um.",
        hidden: (props) => !props.cmsVideoFile,
    },
    cmsVideoPosition: {
        type: ControlType.Enum,
        title: "Posição do vídeo",
        options: ["first", "last"],
        optionTitles: ["Primeiro", "Último"],
        defaultValue: "last",
        hidden: (props) => !props.cmsVideoFile,
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

    arrows: {
        type: ControlType.Object,
        title: "Setas",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Mostrar",
                defaultValue: defaultArrows.show,
            },
            layout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["split", "grouped"],
                optionTitles: ["Separadas (bordas)", "Agrupadas"],
                defaultValue: defaultArrows.layout,
                displaySegmentedControl: true,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Posição",
                options: ARROW_POSITION_OPTIONS,
                optionTitles: ARROW_POSITION_TITLES,
                defaultValue: defaultArrows.position,
                hidden: (a: ArrowsSettings) => !a.show || a.layout !== "split",
            },
            groupedPosition: {
                type: ControlType.Enum,
                title: "Posição",
                options: NAV_POSITION_OPTIONS,
                optionTitles: NAV_POSITION_TITLES,
                defaultValue: defaultArrows.groupedPosition,
                hidden: (a: ArrowsSettings) =>
                    !a.show || a.layout !== "grouped",
            },
            groupedGap: {
                type: ControlType.Number,
                title: "Espaço entre",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: defaultArrows.groupedGap,
                unit: "px",
                hidden: (a: ArrowsSettings) =>
                    !a.show || a.layout !== "grouped",
            },
            inset: {
                type: ControlType.Number,
                title: "Distância da borda",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: defaultArrows.inset,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            size: {
                type: ControlType.Number,
                title: "Tamanho",
                min: 16,
                max: 96,
                step: 1,
                defaultValue: defaultArrows.size,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            iconSize: {
                type: ControlType.Number,
                title: "Tamanho do ícone",
                min: 6,
                max: 64,
                step: 1,
                defaultValue: defaultArrows.iconSize,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            radius: {
                type: ControlType.Number,
                title: "Raio da borda",
                min: 0,
                max: 999,
                step: 1,
                defaultValue: defaultArrows.radius,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            color: {
                type: ControlType.Color,
                title: "Cor do ícone",
                defaultValue: defaultArrows.color,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            background: {
                type: ControlType.Color,
                title: "Fundo",
                defaultValue: defaultArrows.background,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur do fundo",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: defaultArrows.blur,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Contorno",
                defaultValue: defaultArrows.strokeColor,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Espessura do contorno",
                min: 0,
                max: 8,
                step: 1,
                defaultValue: defaultArrows.strokeWidth,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
        },
    },

    dots: {
        type: ControlType.Object,
        title: "Indicadores",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Mostrar",
                defaultValue: defaultDots.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Posição",
                options: NAV_POSITION_OPTIONS,
                optionTitles: NAV_POSITION_TITLES,
                defaultValue: defaultDots.position,
                hidden: (d: DotsSettings) => !d.show,
            },
            inset: {
                type: ControlType.Number,
                title: "Distância da borda",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: defaultDots.inset,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            size: {
                type: ControlType.Number,
                title: "Tamanho",
                min: 4,
                max: 32,
                step: 1,
                defaultValue: defaultDots.size,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            gap: {
                type: ControlType.Number,
                title: "Espaço entre",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: defaultDots.gap,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            padding: {
                type: ControlType.Number,
                title: "Preenchimento do fundo",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: defaultDots.padding,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Fundo (pílula)",
                defaultValue: defaultDots.backgroundColor,
                hidden: (d: DotsSettings) => !d.show,
            },
            blur: {
                type: ControlType.Number,
                title: "Blur do fundo",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: defaultDots.blur,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Contorno",
                defaultValue: defaultDots.strokeColor,
                hidden: (d: DotsSettings) => !d.show,
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Espessura do contorno",
                min: 0,
                max: 8,
                step: 1,
                defaultValue: defaultDots.strokeWidth,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Ativo",
                defaultValue: defaultDots.activeColor,
                hidden: (d: DotsSettings) => !d.show,
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Inativo",
                defaultValue: defaultDots.inactiveColor,
                hidden: (d: DotsSettings) => !d.show,
            },
        },
    },

    counter: {
        type: ControlType.Object,
        title: "Contador",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Mostrar",
                defaultValue: defaultCounter.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Posição",
                options: NAV_POSITION_OPTIONS,
                optionTitles: NAV_POSITION_TITLES,
                defaultValue: defaultCounter.position,
                hidden: (c: CounterSettings) => !c.show,
            },
            inset: {
                type: ControlType.Number,
                title: "Distância da borda",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: defaultCounter.inset,
                unit: "px",
                hidden: (c: CounterSettings) => !c.show,
            },
            textColor: {
                type: ControlType.Color,
                title: "Texto",
                defaultValue: defaultCounter.textColor,
                hidden: (c: CounterSettings) => !c.show,
            },
            background: {
                type: ControlType.Color,
                title: "Fundo",
                defaultValue: defaultCounter.background,
                hidden: (c: CounterSettings) => !c.show,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Tamanho do texto",
                min: 8,
                max: 32,
                step: 1,
                defaultValue: defaultCounter.fontSize,
                unit: "px",
                hidden: (c: CounterSettings) => !c.show,
            },
        },
    },
})
