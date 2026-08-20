import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Mask
 *
 * Efeito inspirado no "Scroll Mask" do React Bits Pro: a seção fica presa
 * (sticky) no topo enquanto a página rola por ela; conforme o scroll avança,
 * uma máscara se abre e revela a imagem. Ao final do trecho de rolagem, a
 * imagem fica totalmente revelada e a seção se solta. Seis formas de
 * abertura disponíveis (círculo, losango, cortina horizontal, cortina
 * vertical, diagonal, persianas) mais a opção de usar um SVG personalizado
 * como forma da máscara.
 *
 * O tamanho da forma no início e no fim da revelação é configurável
 * (0 = totalmente escondida, 100 = totalmente revelada; valores acima de
 * 100 são permitidos para "estourar" além dos limites do container).
 *
 * Importante: o componente cria sua própria altura de rolagem (prop
 * "Altura do scroll", em vh) — coloque-o em uma seção de página normal,
 * sem limitar a altura do frame no Framer, para o efeito de pin funcionar.
 *
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 * @framerIntrinsicWidth 600
 * @framerIntrinsicHeight 1200
 */
export default function ScrollMask(props: ScrollMaskProps) {
    const {
        image,
        variant = "circle",
        customMask,
        startSize = 0,
        endSize = 100,
        revealStart = 0.1,
        revealEnd = 0.6,
        blindsCount = 8,
        imageFit = "cover",
        borderRadius = 0,
        backgroundColor = "#0A0A0A",
        scrollHeight = 250,
        stickyTopOffset = 0,
    } = props

    const wrapperRef = useRef<HTMLDivElement>(null)

    const { scrollYProgress } = useScroll({
        target: wrapperRef,
        offset: ["start start", "end end"],
    })

    const revealProgress = useTransform(
        scrollYProgress,
        [revealStart, revealEnd],
        [0, 1],
        { clamp: true }
    )

    const size = useTransform(revealProgress, [0, 1], [startSize, endSize])

    const isCustom = variant === "custom" && !!customMask
    const isBlinds = variant === "blinds"
    const usesMaskImage = isBlinds || isCustom
    const stripe = 100 / Math.max(blindsCount, 1)

    const clipPath =
        !usesMaskImage && variant !== "custom"
            ? clipPathByVariant[variant]
            : undefined

    const maskImageValue = isBlinds
        ? `repeating-linear-gradient(90deg, black 0, black calc(var(--p) * ${stripe / 100}%), transparent calc(var(--p) * ${stripe / 100}%), transparent ${stripe}%)`
        : isCustom
          ? `url(${customMask})`
          : undefined

    return (
        <div
            ref={wrapperRef}
            style={{
                position: "relative",
                width: "100%",
                height: `${scrollHeight}vh`,
            }}
        >
            <div
                style={{
                    position: "sticky",
                    top: stickyTopOffset,
                    width: "100%",
                    height: "100vh",
                    overflow: "hidden",
                    borderRadius,
                    background: backgroundColor,
                }}
            >
                <motion.div
                    style={{
                        ["--p" as string]: size,
                        position: "absolute",
                        inset: 0,
                        clipPath,
                        WebkitMaskImage: maskImageValue,
                        maskImage: maskImageValue,
                        WebkitMaskRepeat: isCustom ? "no-repeat" : undefined,
                        maskRepeat: isCustom ? "no-repeat" : undefined,
                        WebkitMaskPosition: isCustom ? "center" : undefined,
                        maskPosition: isCustom ? "center" : undefined,
                        WebkitMaskSize: isCustom
                            ? "calc(var(--p) * 1%) calc(var(--p) * 1%)"
                            : undefined,
                        maskSize: isCustom
                            ? "calc(var(--p) * 1%) calc(var(--p) * 1%)"
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
    | "custom"

const clipPathByVariant: Partial<Record<ScrollMaskVariant, string>> = {
    circle: "circle(calc(var(--p) * 1%) at 50% 50%)",
    diamond:
        "polygon(50% calc(50% - var(--p) * 1%), calc(50% + var(--p) * 1%) 50%, 50% calc(50% + var(--p) * 1%), calc(50% - var(--p) * 1%) 50%)",
    curtainHorizontal:
        "inset(0 calc((100% - var(--p) * 1%) / 2) 0 calc((100% - var(--p) * 1%) / 2))",
    curtainVertical:
        "inset(calc((100% - var(--p) * 1%) / 2) 0 calc((100% - var(--p) * 1%) / 2) 0)",
    diagonal:
        "polygon(0 0, calc(var(--p) * 1.5% - 30%) 0, calc(var(--p) * 1.5% - 50%) 100%, 0 100%)",
}

interface ScrollMaskImage {
    src: string
    alt?: string
}

interface ScrollMaskProps {
    image?: ScrollMaskImage
    variant: ScrollMaskVariant
    customMask?: string
    startSize: number
    endSize: number
    revealStart: number
    revealEnd: number
    blindsCount: number
    imageFit: "cover" | "contain" | "fill"
    borderRadius: number
    backgroundColor: string
    scrollHeight: number
    stickyTopOffset: number
}

addPropertyControls(ScrollMask, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Imagem",
    },
    scrollHeight: {
        type: ControlType.Number,
        title: "Altura do scroll",
        description:
            "Distância de rolagem (em vh) que a seção fica presa no topo enquanto a máscara se abre.",
        min: 120,
        max: 500,
        step: 10,
        defaultValue: 250,
    },
    stickyTopOffset: {
        type: ControlType.Number,
        title: "Offset do topo",
        description: "Distância do topo onde a seção fica presa (px).",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
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
            "custom",
        ],
        optionTitles: [
            "Círculo",
            "Losango",
            "Cortina Horizontal",
            "Cortina Vertical",
            "Diagonal",
            "Persianas",
            "Personalizado (SVG)",
        ],
        defaultValue: "circle",
    },
    customMask: {
        type: ControlType.File,
        title: "SVG da forma",
        description:
            "SVG usado como máscara. Áreas preenchidas (opacas) do SVG revelam a imagem; áreas transparentes escondem.",
        allowedFileTypes: ["svg"],
        hidden: (props) => props.variant !== "custom",
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
    startSize: {
        type: ControlType.Number,
        title: "Tamanho inicial",
        description:
            "Tamanho da forma no início da revelação (0 = escondida). Pode passar de 100 para começar já maior.",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 0,
    },
    endSize: {
        type: ControlType.Number,
        title: "Tamanho final",
        description:
            "Tamanho da forma no fim da revelação (100 = cobre o container por completo).",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 100,
    },
    revealStart: {
        type: ControlType.Number,
        title: "Início da revelação",
        description: "Ponto do scroll (0 a 1) em que a animação começa.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.1,
    },
    revealEnd: {
        type: ControlType.Number,
        title: "Fim da revelação",
        description: "Ponto do scroll (0 a 1) em que a animação termina.",
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
