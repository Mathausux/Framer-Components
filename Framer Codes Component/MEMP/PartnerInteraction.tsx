import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Partner Interaction
 *
 * A single logo box that randomly swaps between the logos it was given.
 * One logo is picked at random on load, and — if "Change Interval" is
 * greater than 0 — a different random logo (never the one currently
 * showing) replaces it with a crossfade on that interval.
 *
 * On hover, the box reveals a bracketed overlay panel with a short text
 * and an arrow icon, centered on top of the logo. The whole box is a
 * link to the page set in "Link" — hovering communicates "this goes
 * somewhere", clicking anywhere on the box follows it.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 405
 * @framerIntrinsicHeight 168
 */
export default function PartnerInteraction(props: PartnerInteractionProps) {
    const {
        logos = [],
        link,
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

    const validLogos = logos.filter((logo) => logo?.src)

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

    return (
        <a
            href={link || undefined}
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
                cursor: link ? "pointer" : "default",
                textDecoration: "none",
            }}
        >
            <AnimatePresence mode="wait">
                {currentLogo && (
                    <motion.img
                        key={index}
                        src={currentLogo.src}
                        alt={currentLogo.alt ?? ""}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: "easeInOut" }}
                        style={{
                            maxWidth: logoMaxWidth,
                            maxHeight: logoMaxHeight,
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                        draggable={false}
                    />
                )}
            </AnimatePresence>

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

interface PartnerInteractionProps {
    logos: LogoImage[]
    link?: string
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
            "Add every partner logo here. One is shown at random, and — if Change Interval is greater than 0 — a different random logo replaces it on that interval.",
        control: {
            type: ControlType.ResponsiveImage,
        },
    },
    link: {
        type: ControlType.Link,
        title: "Link",
        description: "Page the box links to when clicked.",
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
