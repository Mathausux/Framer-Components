import { useMemo, useRef } from "react"
import { motion, useInView, useReducedMotion } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Pattern Reveal
 *
 * Decorative line-grid pattern where every line "draws" itself starting
 * from its own center point and growing out towards both tips at once.
 * Built on top of `scale`, which for a straight line is orientation-
 * agnostic: scaling a segment around its own midpoint always grows it
 * symmetrically toward both ends, regardless of whether the line is
 * vertical, horizontal or diagonal. `vector-effect="non-scaling-stroke"`
 * keeps the stroke thickness constant while that scale animates, so only
 * the length grows.
 *
 * "Pattern" swaps the whole line layout across eight generated styles.
 * "Irregular Grid" and "Scattered" additionally take a numeric Seed, so
 * changing that single number reshuffles the layout into a new,
 * reproducible arrangement.
 *
 * When "Stagger From Center" is on, lines closer to the canvas center
 * start revealing first, so the whole composition also grows outward as
 * a group, echoing the same center-to-tips motion at the pattern level.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 800
 * @framerIntrinsicHeight 458
 */
export default function PatternReveal(props: PatternRevealProps) {
    const {
        variant = "blueprintGrid",
        columns = 10,
        rows = 6,
        diagonalSpacing = 90,
        frameCount = 6,
        scatterCount = 24,
        burstCount = 24,
        burstRadius = 280,
        seed = 7,
        strokeColor = "rgba(255,255,255,0.22)",
        strokeWidth = 1,
        backgroundColor = "#1E1E1E",
        fit = "fill",
        trigger = "onView",
        viewAmount = 0.3,
        replay = false,
        duration = 1.1,
        stagger = 0.025,
        staggerFromCenter = true,
    } = props

    const containerRef = useRef<HTMLDivElement>(null)
    const prefersReducedMotion = useReducedMotion()
    const isInView = useInView(containerRef, {
        once: !replay,
        amount: viewAmount,
    })
    const shouldAnimate = trigger === "onLoad" ? true : isInView

    const rawLines = useMemo(() => {
        switch (variant) {
            case "irregularGrid":
                return buildIrregularGrid(seed, columns, rows)
            case "symmetric":
                return buildSymmetric(columns, rows)
            case "diagonalCross":
                return buildDiagonalCross(diagonalSpacing)
            case "chevron":
                return buildChevron(columns, rows)
            case "radialBurst":
                return buildRadialBurst(burstCount, burstRadius)
            case "concentricFrames":
                return buildConcentricFrames(frameCount)
            case "scattered":
                return buildScattered(seed, scatterCount)
            case "blueprintGrid":
            default:
                return BLUEPRINT_GRID_LINES
        }
    }, [
        variant,
        columns,
        rows,
        diagonalSpacing,
        frameCount,
        scatterCount,
        burstCount,
        burstRadius,
        seed,
    ])

    const lines = useMemo(() => {
        if (!staggerFromCenter) return rawLines
        const cx = VB_W / 2
        const cy = VB_H / 2
        return [...rawLines].sort((a, b) => {
            const da = Math.hypot((a.x1 + a.x2) / 2 - cx, (a.y1 + a.y2) / 2 - cy)
            const db = Math.hypot((b.x1 + b.x2) / 2 - cx, (b.y1 + b.y2) / 2 - cy)
            return da - db
        })
    }, [rawLines, staggerFromCenter])

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                height: "100%",
                background: backgroundColor,
                overflow: "hidden",
            }}
        >
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                preserveAspectRatio={fit === "fill" ? "none" : "xMidYMid meet"}
            >
                {lines.map((line, index) => (
                    <motion.line
                        key={index}
                        x1={line.x1}
                        y1={line.y1}
                        x2={line.x2}
                        y2={line.y2}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        vectorEffect="non-scaling-stroke"
                        initial={{ scale: prefersReducedMotion ? 1 : 0 }}
                        animate={{ scale: shouldAnimate ? 1 : prefersReducedMotion ? 1 : 0 }}
                        transition={{
                            duration: prefersReducedMotion ? 0 : duration,
                            delay: prefersReducedMotion ? 0 : index * stagger,
                            ease: "easeOut",
                        }}
                    />
                ))}
            </svg>
        </div>
    )
}

interface LineSeg {
    x1: number
    y1: number
    x2: number
    y2: number
}

interface PatternRevealProps {
    variant:
        | "blueprintGrid"
        | "irregularGrid"
        | "symmetric"
        | "diagonalCross"
        | "chevron"
        | "radialBurst"
        | "concentricFrames"
        | "scattered"
    columns: number
    rows: number
    diagonalSpacing: number
    frameCount: number
    scatterCount: number
    burstCount: number
    burstRadius: number
    seed: number
    strokeColor: string
    strokeWidth: number
    backgroundColor: string
    fit: "fill" | "contain"
    trigger: "onLoad" | "onView"
    viewAmount: number
    replay: boolean
    duration: number
    stagger: number
    staggerFromCenter: boolean
}

const VB_W = 1000
const VB_H = 572

function mulberry32(seed: number) {
    let state = seed | 0
    return function random() {
        state = (state + 0x6d2b79f5) | 0
        let t = Math.imul(state ^ (state >>> 15), 1 | state)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
}

/** Fixed architectural blueprint grid: irregular columns, a full-width
 *  horizontal split, a subdivided inner column, and a coarser row of
 *  columns below the split. */
const BLUEPRINT_GRID_LINES: LineSeg[] = (() => {
    const splitY = 407
    const topXs = [2, 39, 109, 130, 156, 184, 230, 281, 372, 406, 504, 519, 554, 749, 921, 944, 971, 998]
    const bottomXs = [39, 281, 504, 749, 998]
    const lines: LineSeg[] = []
    for (const x of topXs) lines.push({ x1: x, y1: 0, x2: x, y2: splitY })
    lines.push({ x1: 0, y1: splitY, x2: VB_W, y2: splitY })
    lines.push({ x1: 554, y1: 104, x2: 749, y2: 104 })
    lines.push({ x1: 554, y1: 255, x2: 749, y2: 255 })
    for (const x of bottomXs) lines.push({ x1: x, y1: splitY, x2: x, y2: VB_H })
    return lines
})()

/** Same architectural-grid spirit as Blueprint Grid, but with randomized
 *  (seeded) column widths and row heights instead of a fixed layout. */
function buildIrregularGrid(seed: number, columns: number, rows: number): LineSeg[] {
    const random = mulberry32(seed)
    const colWeights = Array.from({ length: columns }, () => 0.4 + random())
    const rowWeights = Array.from({ length: rows }, () => 0.4 + random())
    const colSum = colWeights.reduce((a, b) => a + b, 0)
    const rowSum = rowWeights.reduce((a, b) => a + b, 0)

    const xs = [0]
    let x = 0
    for (const w of colWeights) {
        x += (w / colSum) * VB_W
        xs.push(x)
    }
    const ys = [0]
    let y = 0
    for (const w of rowWeights) {
        y += (w / rowSum) * VB_H
        ys.push(y)
    }

    const lines: LineSeg[] = []
    for (const xv of xs) lines.push({ x1: xv, y1: 0, x2: xv, y2: VB_H })
    for (const yv of ys) lines.push({ x1: 0, y1: yv, x2: VB_W, y2: yv })
    return lines
}

function buildSymmetric(columns: number, rows: number): LineSeg[] {
    const lines: LineSeg[] = []
    for (let i = 0; i <= columns; i++) {
        const x = (i / columns) * VB_W
        lines.push({ x1: x, y1: 0, x2: x, y2: VB_H })
    }
    for (let j = 0; j <= rows; j++) {
        const y = (j / rows) * VB_H
        lines.push({ x1: 0, y1: y, x2: VB_W, y2: y })
    }
    return lines
}

function buildDiagonalCross(spacing: number, legLen = 64): LineSeg[] {
    const lines: LineSeg[] = []
    for (let cx = 0; cx <= VB_W; cx += spacing) {
        for (let cy = 0; cy <= VB_H; cy += spacing) {
            lines.push({ x1: cx - legLen, y1: cy - legLen, x2: cx + legLen, y2: cy + legLen })
            lines.push({ x1: cx - legLen, y1: cy + legLen, x2: cx + legLen, y2: cy - legLen })
        }
    }
    return lines
}

/** Herringbone-style rows of "^" chevrons, one per grid cell. */
function buildChevron(columns: number, rows: number): LineSeg[] {
    const lines: LineSeg[] = []
    const cellW = VB_W / columns
    const cellH = VB_H / rows
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < columns; c++) {
            const x0 = c * cellW
            const xMid = x0 + cellW / 2
            const x1 = x0 + cellW
            const yTop = r * cellH
            const yBottom = yTop + cellH
            lines.push({ x1: x0, y1: yTop, x2: xMid, y2: yBottom })
            lines.push({ x1: xMid, y1: yBottom, x2: x1, y2: yTop })
        }
    }
    return lines
}

/** Lines through the canvas center at even angles, like a starburst. */
function buildRadialBurst(count: number, radius: number): LineSeg[] {
    const cx = VB_W / 2
    const cy = VB_H / 2
    const lines: LineSeg[] = []
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        const dx = Math.cos(angle) * radius
        const dy = Math.sin(angle) * radius
        lines.push({ x1: cx - dx, y1: cy - dy, x2: cx + dx, y2: cy + dy })
    }
    return lines
}

function buildConcentricFrames(count: number): LineSeg[] {
    const lines: LineSeg[] = []
    const maxInset = Math.min(VB_W, VB_H) / 2 - 10
    const steps = Math.max(count - 1, 1)
    for (let i = 0; i < count; i++) {
        const inset = (i / steps) * maxInset
        const x1 = inset
        const y1 = inset
        const x2 = VB_W - inset
        const y2 = VB_H - inset
        if (x2 <= x1 || y2 <= y1) continue
        lines.push({ x1, y1, x2, y2: y1 })
        lines.push({ x1, y1: y2, x2, y2 })
        lines.push({ x1, y1, x2: x1, y2 })
        lines.push({ x1: x2, y1, x2, y2 })
    }
    return lines
}

function buildScattered(seed: number, count: number): LineSeg[] {
    const random = mulberry32(seed)
    const lines: LineSeg[] = []
    for (let i = 0; i < count; i++) {
        if (random() > 0.5) {
            const x = random() * VB_W
            const len = 80 + random() * 400
            const y1 = random() * Math.max(VB_H - len, 0)
            lines.push({ x1: x, y1, x2: x, y2: y1 + len })
        } else {
            const y = random() * VB_H
            const len = 100 + random() * 500
            const x1 = random() * Math.max(VB_W - len, 0)
            lines.push({ x1, y1: y, x2: x1 + len, y2: y })
        }
    }
    return lines
}

const GRID_VARIANTS = ["symmetric", "irregularGrid", "chevron"]
const SEEDED_VARIANTS = ["irregularGrid", "scattered"]

addPropertyControls(PatternReveal, {
    variant: {
        type: ControlType.Enum,
        title: "Pattern",
        options: [
            "blueprintGrid",
            "irregularGrid",
            "symmetric",
            "diagonalCross",
            "chevron",
            "radialBurst",
            "concentricFrames",
            "scattered",
        ],
        optionTitles: [
            "Blueprint Grid",
            "Irregular Grid",
            "Symmetric Grid",
            "Diagonal Lattice",
            "Chevron Rows",
            "Radial Burst",
            "Concentric Frames",
            "Scattered Lines",
        ],
        defaultValue: "blueprintGrid",
    },
    columns: {
        type: ControlType.Number,
        title: "Columns",
        min: 2,
        max: 30,
        step: 1,
        defaultValue: 10,
        hidden: (props) => !GRID_VARIANTS.includes(props.variant),
    },
    rows: {
        type: ControlType.Number,
        title: "Rows",
        min: 1,
        max: 20,
        step: 1,
        defaultValue: 6,
        hidden: (props) => !GRID_VARIANTS.includes(props.variant),
    },
    diagonalSpacing: {
        type: ControlType.Number,
        title: "Spacing",
        description: "Distance between diagonal X marks in the lattice.",
        min: 20,
        max: 300,
        step: 5,
        defaultValue: 90,
        hidden: (props) => props.variant !== "diagonalCross",
    },
    burstCount: {
        type: ControlType.Number,
        title: "Line Count",
        min: 6,
        max: 72,
        step: 1,
        defaultValue: 24,
        hidden: (props) => props.variant !== "radialBurst",
    },
    burstRadius: {
        type: ControlType.Number,
        title: "Radius",
        min: 50,
        max: 500,
        step: 10,
        defaultValue: 280,
        hidden: (props) => props.variant !== "radialBurst",
    },
    frameCount: {
        type: ControlType.Number,
        title: "Frame Count",
        min: 2,
        max: 15,
        step: 1,
        defaultValue: 6,
        hidden: (props) => props.variant !== "concentricFrames",
    },
    scatterCount: {
        type: ControlType.Number,
        title: "Line Count",
        min: 4,
        max: 80,
        step: 1,
        defaultValue: 24,
        hidden: (props) => props.variant !== "scattered",
    },
    seed: {
        type: ControlType.Number,
        title: "Seed",
        description: "Change this number to reshuffle the layout into a new arrangement.",
        min: 0,
        max: 9999,
        step: 1,
        defaultValue: 7,
        hidden: (props) => !SEEDED_VARIANTS.includes(props.variant),
    },
    strokeColor: {
        type: ControlType.Color,
        title: "Line Color",
        defaultValue: "rgba(255,255,255,0.22)",
    },
    strokeWidth: {
        type: ControlType.Number,
        title: "Line Width",
        min: 0.5,
        max: 4,
        step: 0.5,
        defaultValue: 1,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#1E1E1E",
    },
    fit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["fill", "contain"],
        optionTitles: ["Fill (stretch)", "Contain (keep ratio)"],
        defaultValue: "fill",
    },
    trigger: {
        type: ControlType.Enum,
        title: "Trigger",
        options: ["onLoad", "onView"],
        optionTitles: ["On Load", "On Scroll Into View"],
        defaultValue: "onView",
    },
    viewAmount: {
        type: ControlType.Number,
        title: "View Amount",
        description: "Fraction of the component that must be visible before the reveal starts.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.3,
        hidden: (props) => props.trigger !== "onView",
    },
    replay: {
        type: ControlType.Boolean,
        title: "Replay",
        description: "Replay the reveal every time it re-enters view instead of only once.",
        defaultValue: false,
        hidden: (props) => props.trigger !== "onView",
    },
    duration: {
        type: ControlType.Number,
        title: "Duration",
        min: 0.2,
        max: 4,
        step: 0.1,
        defaultValue: 1.1,
        unit: "s",
    },
    stagger: {
        type: ControlType.Number,
        title: "Stagger",
        description: "Delay added between each line's start.",
        min: 0,
        max: 0.3,
        step: 0.005,
        defaultValue: 0.025,
        unit: "s",
    },
    staggerFromCenter: {
        type: ControlType.Boolean,
        title: "Stagger From Center",
        description: "Lines closer to the canvas center start revealing first.",
        defaultValue: true,
    },
})
