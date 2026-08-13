import { useLayoutEffect, useRef, useState } from "react"
import { AnimatePresence, motion, type PanInfo } from "framer-motion"
import { addPropertyControls, ControlType, RenderTarget } from "framer"

/**
 * CMS Gallery Slideshow
 *
 * Two ways to connect to the CMS:
 * 1. Canvas (recommended): use the "CMS Element" selector to connect a
 *    Collection List/Grid already linked to your Collection (with a
 *    Gallery field). The connected element is rendered internally
 *    (invisible) and this component reads the images/videos it produces,
 *    tracking updates via MutationObserver. Framer does not allow code
 *    components to read CMS data directly — so this reads the already
 *    rendered DOM instead of a data API.
 * 2. Manual: add items directly in the "Items" prop — each item can be an
 *    image or a video.
 *
 * A slide can be an image or a video (with an option to wait for the video
 * to finish before advancing). Transition (style/duration/easing/autoplay/
 * loop/drag), Arrows, Dots and Counter are fully configurable.
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

interface TransitionSettings {
    style: "slide" | "fade"
    duration: number
    easing: "linear" | "easeIn" | "easeOut" | "easeInOut"
    autoplay: boolean
    autoplayInterval: number
    pauseOnHover: boolean
    loop: boolean
    enableDrag: boolean
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
    waitForVideo: boolean
    transition: TransitionSettings
    objectFit: "cover" | "contain" | "fill"
    borderRadius: number
    arrows: ArrowsSettings
    dots: DotsSettings
    counter: CounterSettings
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultTransition: TransitionSettings = {
    style: "slide",
    duration: 0.5,
    easing: "easeInOut",
    autoplay: true,
    autoplayInterval: 4,
    pauseOnHover: true,
    loop: true,
    enableDrag: true,
}

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
            // Deliberately not using `transform: translateY(-50%)` here.
            // These buttons are motion.button elements — once Framer
            // Motion animates a component, it fully owns the `transform`
            // CSS property and silently drops any transform set via
            // style. marginTop achieves the same vertical centering
            // without touching `transform`.
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
        waitForVideo = true,
        transition = defaultTransition,
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

    // "Canvas" mode: the element connected via ControlType.ComponentInstance
    // (e.g. a Collection List already linked to the Collection) is rendered
    // inside collectionWrapperRef, invisible. Once mounted, we read the
    // <img>/<video>/background-image it produces, in the order they appear
    // in the DOM, and observe mutations to track CMS data changes.
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

            // A File field (used to import an .mp4 in the CMS) is rendered
            // by Framer as a link, not as a <video>. Detect any <a href>
            // pointing to a video file.
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

    // Video bound directly to a CMS variable (File field), useful when this
    // component is placed as the repeated item itself inside a Collection
    // List. "Visible" can be bound to a Boolean CMS field to hide the video
    // on records that don't have one.
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

    // On the Canvas editor, the connected Collection List may take longer
    // to populate its real CMS data (or use placeholder data) than in
    // Preview/the published site. Meanwhile, let the user manually pick
    // which slide to view via the "Preview Slide" property.
    useLayoutEffect(() => {
        if (!isOnCanvas || total === 0) return
        const clamped = Math.max(0, Math.min(maxIndex, previewIndex ?? 0))
        setIndex(clamped)
    }, [isOnCanvas, previewIndex, maxIndex, total])

    const goTo = (nextIndex: number, dir: number) => {
        if (total === 0) return
        setDirection(dir)
        if (transition.loop) {
            setIndex(((nextIndex % total) + total) % total)
        } else {
            setIndex(Math.min(Math.max(nextIndex, 0), total - 1))
        }
    }

    const goNext = () => goTo(index + 1, 1)
    const goPrev = () => goTo(index - 1, -1)

    const currentSlide = slides[index]
    const currentIsVideo = currentSlide?.type === "video"
    // If the current slide is a video and "Wait for Video" is on, advancing
    // does not use the interval — it happens via the <video>'s onEnded
    // event instead.
    const autoAdvanceByTimer =
        transition.autoplay && !(currentIsVideo && waitForVideo)

    useLayoutEffect(() => {
        if (!autoAdvanceByTimer || !hasMultiple) return
        if (transition.pauseOnHover && isHovering) return

        timerRef.current = setInterval(() => {
            setDirection(1)
            setIndex((current) => {
                const next = current + 1
                if (next >= total) {
                    return transition.loop ? 0 : current
                }
                return next
            })
        }, Math.max(transition.autoplayInterval, 0.5) * 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [
        autoAdvanceByTimer,
        transition.autoplayInterval,
        transition.pauseOnHover,
        isHovering,
        hasMultiple,
        total,
        transition.loop,
    ])

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
            initial: (dir: number) => ({
                x: dir > 0 ? "100%" : "-100%",
                opacity: 1,
            }),
            animate: { x: "0%", opacity: 1 },
            exit: (dir: number) => ({
                x: dir > 0 ? "-100%" : "100%",
                opacity: 1,
            }),
        },
    } as const

    const activeVariant = variants[transition.style] ?? variants.fade
    const dragEnabled = transition.enableDrag && hasMultiple

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

    const isPrevDisabled = !transition.loop && index <= 0
    const isNextDisabled = !transition.loop && index >= maxIndex

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
                aria-label="Previous slide"
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
                aria-label="Next slide"
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
                aria-label="Previous slide"
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
                aria-label="Next slide"
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
                        aria-label={`Go to slide ${dotIndex + 1}`}
                        onClick={() =>
                            goTo(dotIndex, dotIndex > index ? 1 : -1)
                        }
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
                                ? "No image or video found inside the connected element. Make sure it's linked to a Collection with a Gallery field."
                                : "Connect a Collection List already linked to your CMS Collection using the \"CMS Element\" selector in the properties panel."
                            : "Add items (image or video) in the \"Items\" property panel."}
                    </div>
                ) : (
                    <>
                        <AnimatePresence
                            initial={false}
                            custom={direction}
                            mode="popLayout"
                        >
                            <motion.div
                                key={index}
                                custom={direction}
                                variants={activeVariant}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{
                                    duration: transition.duration,
                                    ease: transition.easing,
                                }}
                                drag={dragEnabled ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                // 0 = the slide never visually moves away
                                // from its resting position. Framer Motion
                                // still reports the real pointer
                                // offset/velocity in onDragEnd regardless
                                // of this value, so the swipe is still
                                // detected correctly — this only stops the
                                // gesture from dragging the slide (and
                                // exposing the background behind it)
                                // visually. The actual transition between
                                // slides is handled by the variants above.
                                dragElastic={0}
                                dragMomentum={false}
                                style={slideStyle}
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

// The connected Collection List is rendered here, out of view, only so we
// can read the images it produces in the DOM.
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
    "Top Left",
    "Top Center",
    "Top Right",
    "Bottom Left",
    "Bottom Center",
    "Bottom Right",
    "Outside (Below)",
]

const ARROW_POSITION_OPTIONS: ArrowsPosition[] = [
    "top",
    "center",
    "bottom",
    "outside",
]
const ARROW_POSITION_TITLES = ["Top", "Center", "Bottom", "Outside (Below)"]

addPropertyControls(CMSGallerySlideshow, {
    dataSource: {
        type: ControlType.Enum,
        title: "Source",
        options: ["canvas", "manual"],
        optionTitles: ["Select on Canvas", "Manual / Collection List"],
        defaultValue: "canvas",
    },
    collectionSource: {
        type: ControlType.ComponentInstance,
        title: "CMS Element",
        description:
            "Connect a Collection List/Grid already linked to your CMS Collection (with a Gallery field). It is rendered internally (invisible) and the images it produces feed the slideshow.",
        hidden: (props) => props.dataSource !== "canvas",
    },
    previewIndex: {
        type: ControlType.Number,
        title: "Preview Slide",
        min: 0,
        step: 1,
        defaultValue: 0,
        description:
            "Canvas only: manually choose which slide to preview while editing, since real CMS data can take a moment longer to appear in the editor than in Preview.",
        hidden: (props) => props.dataSource !== "canvas",
    },
    items: {
        type: ControlType.Array,
        title: "Items",
        description:
            "Each item can be an image or a video. To bind directly to your Collection's Gallery field, prefer \"Select on Canvas\" instead.",
        control: {
            type: ControlType.Object,
            controls: {
                mediaType: {
                    type: ControlType.Enum,
                    title: "Type",
                    options: ["image", "video"],
                    optionTitles: ["Image", "Video"],
                    defaultValue: "image",
                    displaySegmentedControl: true,
                },
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                    hidden: (item: ManualItem) => item.mediaType !== "image",
                },
                video: {
                    type: ControlType.File,
                    title: "Video",
                    allowedFileTypes: ["mp4", "webm", "mov", "ogg"],
                    hidden: (item: ManualItem) => item.mediaType !== "video",
                },
                poster: {
                    type: ControlType.ResponsiveImage,
                    title: "Poster (optional)",
                    hidden: (item: ManualItem) => item.mediaType !== "video",
                },
                alt: {
                    type: ControlType.String,
                    title: "Alt Text",
                    defaultValue: "",
                },
            },
        },
        hidden: (props) => props.dataSource !== "manual",
    },
    waitForVideo: {
        type: ControlType.Boolean,
        title: "Wait for Video",
        defaultValue: true,
        description:
            "When a slide is a video, wait for it to finish before advancing automatically, instead of using the fixed interval.",
    },
    cmsVideoFile: {
        type: ControlType.File,
        title: "Video (CMS)",
        allowedFileTypes: ["mp4", "webm", "mov", "m4v", "ogg"],
        description:
            "Bind directly to a File field of your CMS Collection using the variable icon — useful when this component is used as the repeated item itself inside a Collection List. Independent of the \"Source\" mode above.",
    },
    cmsVideoVisible: {
        type: ControlType.Boolean,
        title: "Video Visible",
        defaultValue: true,
        description:
            "Can be bound to a Boolean CMS field to hide the video on records that don't have one.",
        hidden: (props) => !props.cmsVideoFile,
    },
    cmsVideoPosition: {
        type: ControlType.Enum,
        title: "Video Position",
        options: ["first", "last"],
        optionTitles: ["First", "Last"],
        defaultValue: "last",
        hidden: (props) => !props.cmsVideoFile,
    },

    transition: {
        type: ControlType.Object,
        title: "Transition",
        controls: {
            style: {
                type: ControlType.Enum,
                title: "Type",
                options: ["slide", "fade"],
                optionTitles: ["Slide", "Fade"],
                defaultValue: defaultTransition.style,
                displaySegmentedControl: true,
            },
            duration: {
                type: ControlType.Number,
                title: "Duration",
                min: 0,
                max: 2,
                step: 0.05,
                defaultValue: defaultTransition.duration,
                unit: "s",
            },
            easing: {
                type: ControlType.Enum,
                title: "Easing",
                options: ["linear", "easeIn", "easeOut", "easeInOut"],
                optionTitles: ["Linear", "Ease In", "Ease Out", "Ease In-Out"],
                defaultValue: defaultTransition.easing,
            },
            autoplay: {
                type: ControlType.Boolean,
                title: "Autoplay",
                defaultValue: defaultTransition.autoplay,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            autoplayInterval: {
                type: ControlType.Number,
                title: "Interval",
                min: 1,
                max: 20,
                step: 0.5,
                defaultValue: defaultTransition.autoplayInterval,
                unit: "s",
                hidden: (t: TransitionSettings) => !t.autoplay,
            },
            pauseOnHover: {
                type: ControlType.Boolean,
                title: "Pause on Hover",
                defaultValue: defaultTransition.pauseOnHover,
                enabledTitle: "On",
                disabledTitle: "Off",
                hidden: (t: TransitionSettings) => !t.autoplay,
            },
            loop: {
                type: ControlType.Boolean,
                title: "Loop",
                defaultValue: defaultTransition.loop,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
            enableDrag: {
                type: ControlType.Boolean,
                title: "Drag to Navigate",
                defaultValue: defaultTransition.enableDrag,
                enabledTitle: "On",
                disabledTitle: "Off",
            },
        },
    },

    objectFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 100,
        defaultValue: 0,
    },

    arrows: {
        type: ControlType.Object,
        title: "Arrows",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: defaultArrows.show,
            },
            layout: {
                type: ControlType.Enum,
                title: "Layout",
                options: ["split", "grouped"],
                optionTitles: ["Split (Edges)", "Grouped"],
                defaultValue: defaultArrows.layout,
                displaySegmentedControl: true,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: ARROW_POSITION_OPTIONS,
                optionTitles: ARROW_POSITION_TITLES,
                defaultValue: defaultArrows.position,
                hidden: (a: ArrowsSettings) => !a.show || a.layout !== "split",
            },
            groupedPosition: {
                type: ControlType.Enum,
                title: "Position",
                options: NAV_POSITION_OPTIONS,
                optionTitles: NAV_POSITION_TITLES,
                defaultValue: defaultArrows.groupedPosition,
                hidden: (a: ArrowsSettings) =>
                    !a.show || a.layout !== "grouped",
            },
            groupedGap: {
                type: ControlType.Number,
                title: "Button Gap",
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
                title: "Inset",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: defaultArrows.inset,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 16,
                max: 96,
                step: 1,
                defaultValue: defaultArrows.size,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            iconSize: {
                type: ControlType.Number,
                title: "Icon Size",
                min: 6,
                max: 64,
                step: 1,
                defaultValue: defaultArrows.iconSize,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            radius: {
                type: ControlType.Number,
                title: "Radius",
                min: 0,
                max: 999,
                step: 1,
                defaultValue: defaultArrows.radius,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            color: {
                type: ControlType.Color,
                title: "Icon Color",
                defaultValue: defaultArrows.color,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaultArrows.background,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            blur: {
                type: ControlType.Number,
                title: "Background Blur",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: defaultArrows.blur,
                unit: "px",
                hidden: (a: ArrowsSettings) => !a.show,
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Stroke",
                defaultValue: defaultArrows.strokeColor,
                hidden: (a: ArrowsSettings) => !a.show,
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
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
        title: "Dots",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: defaultDots.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: NAV_POSITION_OPTIONS,
                optionTitles: NAV_POSITION_TITLES,
                defaultValue: defaultDots.position,
                hidden: (d: DotsSettings) => !d.show,
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: defaultDots.inset,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            size: {
                type: ControlType.Number,
                title: "Size",
                min: 4,
                max: 32,
                step: 1,
                defaultValue: defaultDots.size,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            gap: {
                type: ControlType.Number,
                title: "Gap",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: defaultDots.gap,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            padding: {
                type: ControlType.Number,
                title: "Background Padding",
                min: 0,
                max: 32,
                step: 1,
                defaultValue: defaultDots.padding,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            backgroundColor: {
                type: ControlType.Color,
                title: "Background (Pill)",
                defaultValue: defaultDots.backgroundColor,
                hidden: (d: DotsSettings) => !d.show,
            },
            blur: {
                type: ControlType.Number,
                title: "Background Blur",
                min: 0,
                max: 40,
                step: 1,
                defaultValue: defaultDots.blur,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            strokeColor: {
                type: ControlType.Color,
                title: "Stroke",
                defaultValue: defaultDots.strokeColor,
                hidden: (d: DotsSettings) => !d.show,
            },
            strokeWidth: {
                type: ControlType.Number,
                title: "Stroke Width",
                min: 0,
                max: 8,
                step: 1,
                defaultValue: defaultDots.strokeWidth,
                unit: "px",
                hidden: (d: DotsSettings) => !d.show,
            },
            activeColor: {
                type: ControlType.Color,
                title: "Active",
                defaultValue: defaultDots.activeColor,
                hidden: (d: DotsSettings) => !d.show,
            },
            inactiveColor: {
                type: ControlType.Color,
                title: "Inactive",
                defaultValue: defaultDots.inactiveColor,
                hidden: (d: DotsSettings) => !d.show,
            },
        },
    },

    counter: {
        type: ControlType.Object,
        title: "Counter",
        controls: {
            show: {
                type: ControlType.Boolean,
                title: "Show",
                defaultValue: defaultCounter.show,
            },
            position: {
                type: ControlType.Enum,
                title: "Position",
                options: NAV_POSITION_OPTIONS,
                optionTitles: NAV_POSITION_TITLES,
                defaultValue: defaultCounter.position,
                hidden: (c: CounterSettings) => !c.show,
            },
            inset: {
                type: ControlType.Number,
                title: "Inset",
                min: 0,
                max: 60,
                step: 1,
                defaultValue: defaultCounter.inset,
                unit: "px",
                hidden: (c: CounterSettings) => !c.show,
            },
            textColor: {
                type: ControlType.Color,
                title: "Text",
                defaultValue: defaultCounter.textColor,
                hidden: (c: CounterSettings) => !c.show,
            },
            background: {
                type: ControlType.Color,
                title: "Background",
                defaultValue: defaultCounter.background,
                hidden: (c: CounterSettings) => !c.show,
            },
            fontSize: {
                type: ControlType.Number,
                title: "Text Size",
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
