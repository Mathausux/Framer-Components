import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Mask
 *
 * Efeito inspirado no "Scroll Mask" do React Bits Pro: conforme a página
 * rola, uma máscara se abre e revela a imagem. Seis formas de abertura
 * disponíveis: círculo, losango, cortina horizontal, cortina vertical,
 * diagonal e persianas.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 500
 */
export default function ScrollMask(props: ScrollMaskProps) {
    const {
        image,
        variant = "circle",
        revealStart = 0.1,
        revealEnd = 0.6,
        blindsCount = 8,
        imageFit = "cover",
        borderRadius = 0,
        backgroundColor = "#0A0A0A",
    } = props

    const containerRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    })

    const progress = useTransform(
        scrollYProgress,
        [revealStart, revealEnd],
        [0, 1],
        { clamp: true }
    )

    const clipPath = clipPathByVariant[variant]
    const usesMask = variant === "blinds"
    const stripe = 100 / Math.max(blindsCount, 1)

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                borderRadius,
                background: backgroundColor,
            }}
        >
            <motion.div
                style={{
                    ["--p" as string]: progress,
                    position: "absolute",
                    inset: 0,
                    clipPath: usesMask ? undefined : clipPath,
                    WebkitMaskImage: usesMask
                        ? `repeating-linear-gradient(90deg, black 0, black calc(var(--p) * ${stripe}%), transparent calc(var(--p) * ${stripe}%), transparent ${stripe}%)`
                        : undefined,
                    maskImage: usesMask
                        ? `repeating-linear-gradient(90deg, black 0, black calc(var(--p) * ${stripe}%), transparent calc(var(--p) * ${stripe}%), transparent ${stripe}%)`
                        : undefined,
                }}
            >
                {image?.src ? (
                    <img
                        src={image.src}
                        alt={image.alt ?? ""}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: imageFit,
                            display: "block",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                        draggable={false}
                    />
                ) : (
                    <div
                        style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#8A8A8A",
                            fontSize: 13,
                            textAlign: "center",
                            padding: 16,
                        }}
                    >
                        Selecione uma imagem no painel de propriedades.
                    </div>
                )}
            </motion.div>
        </div>
    )
}

type ScrollMaskVariant =
    | "circle"
    | "diamond"
    | "curtainHorizontal"
    | "curtainVertical"
    | "diagonal"
    | "blinds"

const clipPathByVariant: Record<
    Exclude<ScrollMaskVariant, "blinds">,
    string
> = {
    circle: "circle(calc(var(--p) * 85%) at 50% 50%)",
    diamond:
        "polygon(50% calc(50% - var(--p) * 80%), calc(50% + var(--p) * 80%) 50%, 50% calc(50% + var(--p) * 80%), calc(50% - var(--p) * 80%) 50%)",
    curtainHorizontal:
        "inset(0 calc(50% - var(--p) * 50%) 0 calc(50% - var(--p) * 50%))",
    curtainVertical:
        "inset(calc(50% - var(--p) * 50%) 0 calc(50% - var(--p) * 50%) 0)",
    diagonal:
        "polygon(0 0, calc(var(--p) * 140% - 20%) 0, calc(var(--p) * 140% - 50%) 100%, 0 100%)",
}

interface ScrollMaskImage {
    src: string
    alt?: string
}

interface ScrollMaskProps {
    image?: ScrollMaskImage
    variant: ScrollMaskVariant
    revealStart: number
    revealEnd: number
    blindsCount: number
    imageFit: "cover" | "contain" | "fill"
    borderRadius: number
    backgroundColor: string
}

addPropertyControls(ScrollMask, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Imagem",
    },
    variant: {
        type: ControlType.Enum,
        title: "Formato",
        options: [
            "circle",
            "diamond",
            "curtainHorizontal",
            "curtainVertical",
            "diagonal",
            "blinds",
        ],
        optionTitles: [
            "Círculo",
            "Losango",
            "Cortina Horizontal",
            "Cortina Vertical",
            "Diagonal",
            "Persianas",
        ],
        defaultValue: "circle",
    },
    blindsCount: {
        type: ControlType.Number,
        title: "Nº persianas",
        min: 2,
        max: 24,
        step: 1,
        defaultValue: 8,
        hidden: (props) => props.variant !== "blinds",
    },
    revealStart: {
        type: ControlType.Number,
        title: "Início da revelação",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.1,
    },
    revealEnd: {
        type: ControlType.Number,
        title: "Fim da revelação",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },
    imageFit: {
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
    backgroundColor: {
        type: ControlType.Color,
        title: "Fundo",
        defaultValue: "#0A0A0A",
    },
})
