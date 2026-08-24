import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Partner Interaction
 *
 * A single logo box that randomly swaps between the logos it was given.
 * One logo is picked at random on load, and — if "Change Interval" is
 * greater than 0 — a different random logo (never the one currently
 * showing) replaces it with a slide-to-top transition on that interval:
 * the current logo slides up and out while the next one slides in from
 * the bottom.
 *
 * Each logo carries its own link. The whole box is a link to whichever
 * logo is currently showing, so clicking it always opens that partner's
 * page. On hover, the box reveals a bracketed overlay panel with a short
 * text and an arrow icon, centered on top of the logo.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 405
 * @framerIntrinsicHeight 168
 */
export default function PartnerInteraction(props: PartnerInteractionProps) {
    const {
        logos = [],
        openInNewTab = false,
        hoverText = "Abrir projeto",
        changeInterval = 4,
        logoMaxWidth = 78,
        logoMaxHeight = 30,
        backgroundColor = "#FFFFFF",
        borderColor = "rgba(0,0,0,0.08)",
        hoverBackgroundColor = "rgba(255,255,255,0.72)",
        hoverTextColor = "#000000",
        cornerColor = "#000000",
    } = props

    const validLogos = logos.filter((logo) => logo?.image?.src)

    const [index, setIndex] = useState(0)
    const [isHovering, setIsHovering] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useEffect(() => {
        if (validLogos.length === 0) return
        setIndex(Math.floor(Math.random() * validLogos.length))
    }, [validLogos.length])

    useEffect(() => {
        if (!changeInterval || validLogos.length < 2) return

        timerRef.current = setInterval(() => {
            setIndex((current) => {
                if (validLogos.length < 2) return current
                let next = Math.floor(Math.random() * validLogos.length)
                while (next === current) {
                    next = Math.floor(Math.random() * validLogos.length)
                }
                return next
            })
        }, Math.max(changeInterval, 0.5) * 1000)

        return () => {
            if (timerRef.current) clearInterval(timerRef.current)
        }
    }, [changeInterval, validLogos.length])

    const currentLogo = validLogos[index]
    const currentLink = currentLogo?.link

    return (
        <a
            href={currentLink || undefined}
            target={openInNewTab ? "_blank" : undefined}
            rel={openInNewTab ? "noopener noreferrer" : undefined}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            style={{
                position: "relative",
                display: "flex",
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
                background: backgroundColor,
                border: `1px solid ${borderColor}`,
                overflow: "hidden",
                boxSizing: "border-box",
                cursor: currentLink ? "pointer" : "default",
                textDecoration: "none",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: logoMaxWidth,
                    height: logoMaxHeight,
                    overflow: "hidden",
                }}
            >
                <AnimatePresence mode="popLayout" initial={false}>
                    {currentLogo && (
                        <motion.img
                            key={index}
                            src={currentLogo.image.src}
                            alt={currentLogo.image.alt ?? ""}
                            initial={{ y: "100%", opacity: 1 }}
                            animate={{ y: "0%", opacity: 1 }}
                            exit={{ y: "-100%", opacity: 1 }}
                            transition={{ duration: 0.5, ease: [0.65, 0, 0.35, 1] }}
                            style={{
                                position: "absolute",
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                pointerEvents: "none",
                                userSelect: "none",
                            }}
                            draggable={false}
                        />
                    )}
                </AnimatePresence>
            </div>

            <motion.div
                initial={false}
                animate={{ opacity: isHovering ? 1 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                style={{
                    position: "absolute",
                    inset: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: 10,
                    background: hoverBackgroundColor,
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                    border: `1px solid ${borderColor}`,
                    boxSizing: "border-box",
                    pointerEvents: "none",
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 12,
                        lineHeight: "normal",
                        color: hoverTextColor,
                        whiteSpace: "nowrap",
                    }}
                >
                    {hoverText}
                </p>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={hoverTextColor}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                </svg>

                <CornerBracket position="top-left" color={cornerColor} />
                <CornerBracket position="top-right" color={cornerColor} />
                <CornerBracket position="bottom-left" color={cornerColor} />
                <CornerBracket position="bottom-right" color={cornerColor} />
            </motion.div>
        </a>
    )
}

function CornerBracket({
    position,
    color,
}: {
    position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
    color: string
}) {
    const base: React.CSSProperties = {
        position: "absolute",
        width: 16,
        height: 16,
        background: "transparent",
        boxSizing: "border-box",
    }

    const byPosition: Record<typeof position, React.CSSProperties> = {
        "top-left": {
            top: -1,
            left: -1,
            borderTop: `1px solid ${color}`,
            borderLeft: `1px solid ${color}`,
        },
        "top-right": {
            top: -1,
            right: -1,
            borderTop: `1px solid ${color}`,
            borderRight: `1px solid ${color}`,
        },
        "bottom-left": {
            bottom: -1,
            left: -1,
            borderBottom: `1px solid ${color}`,
            borderLeft: `1px solid ${color}`,
        },
        "bottom-right": {
            bottom: -1,
            right: -1,
            borderBottom: `1px solid ${color}`,
            borderRight: `1px solid ${color}`,
        },
    }

    return <div style={{ ...base, ...byPosition[position] }} />
}

interface LogoImage {
    src: string
    alt?: string
}

interface LogoItem {
    image?: LogoImage
    link?: string
}

interface PartnerInteractionProps {
    logos: LogoItem[]
    openInNewTab: boolean
    hoverText: string
    changeInterval: number
    logoMaxWidth: number
    logoMaxHeight: number
    backgroundColor: string
    borderColor: string
    hoverBackgroundColor: string
    hoverTextColor: string
    cornerColor: string
}

addPropertyControls(PartnerInteraction, {
    logos: {
        type: ControlType.Array,
        title: "Logos",
        description:
            "Add every partner logo and its own link. One is shown at random, and — if Change Interval is greater than 0 — a different random logo slides in on that interval. The box always links to whichever logo is currently showing.",
        control: {
            type: ControlType.Object,
            controls: {
                image: {
                    type: ControlType.ResponsiveImage,
                    title: "Image",
                },
                link: {
                    type: ControlType.Link,
                    title: "Link",
                },
            },
        },
    },
    openInNewTab: {
        type: ControlType.Boolean,
        title: "New Tab",
        defaultValue: false,
    },
    hoverText: {
        type: ControlType.String,
        title: "Hover Text",
        defaultValue: "Abrir projeto",
    },
    changeInterval: {
        type: ControlType.Number,
        title: "Change Interval",
        description:
            "Seconds between random logo swaps. Use 0 to keep a single random logo without rotating.",
        min: 0,
        max: 30,
        step: 0.5,
        defaultValue: 4,
        unit: "s",
    },
    logoMaxWidth: {
        type: ControlType.Number,
        title: "Logo Max Width",
        min: 10,
        max: 400,
        step: 1,
        defaultValue: 78,
    },
    logoMaxHeight: {
        type: ControlType.Number,
        title: "Logo Max Height",
        min: 10,
        max: 400,
        step: 1,
        defaultValue: 30,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#FFFFFF",
    },
    borderColor: {
        type: ControlType.Color,
        title: "Border",
        defaultValue: "rgba(0,0,0,0.08)",
    },
    hoverBackgroundColor: {
        type: ControlType.Color,
        title: "Hover Background",
        defaultValue: "rgba(255,255,255,0.72)",
    },
    hoverTextColor: {
        type: ControlType.Color,
        title: "Hover Text & Icon",
        defaultValue: "#000000",
    },
    cornerColor: {
        type: ControlType.Color,
        title: "Corner Brackets",
        defaultValue: "#000000",
    },
})
