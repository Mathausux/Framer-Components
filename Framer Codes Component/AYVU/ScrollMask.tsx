import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Mask
 *
 * Efeito inspirado no "Scroll Mask" do React Bits Pro: a seção fica presa
 * (sticky) no topo enquanto a página rola por ela; conforme o scroll avança,
 * uma máscara em forma de SVG importado se abre e revela a imagem. Ao final
 * do trecho de rolagem, a imagem fica totalmente revelada e a seção se
 * solta.
 *
 * O tamanho da forma no início e no fim da revelação é configurável
 * (0 = totalmente escondida, 100 = o SVG cobre a caixa do container).
 * Para que a imagem apareça por completo ao final, sem a silhueta do SVG
 * visível, o tamanho final deve ultrapassar bastante os limites do
 * container (padrão: 300).
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
        shape,
        startSize = 0,
        endSize = 100,
        revealStart = 0.1,
        revealEnd = 0.6,
        imageFit = "cover",
        borderRadius = 0,
        backgroundColor = "#0A0A0A",
        scrollHeight = 250,
        stickyTopOffset = 0,
        zIndex = 0,
        svgZIndex = 1,
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

    const maskImageValue = shape ? `url(${shape})` : undefined

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
                    zIndex,
                }}
            >
                <motion.div
                    style={{
                        ["--p" as string]: size,
                        position: "absolute",
                        inset: 0,
                        WebkitMaskImage: maskImageValue,
                        maskImage: maskImageValue,
                        WebkitMaskRepeat: "no-repeat",
                        maskRepeat: "no-repeat",
                        WebkitMaskPosition: "center",
                        maskPosition: "center",
                        WebkitMaskSize: "calc(var(--p) * 1%) calc(var(--p) * 1%)",
                        maskSize: "calc(var(--p) * 1%) calc(var(--p) * 1%)",
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

                {shape && (
                    <motion.img
                        src={shape}
                        alt=""
                        style={{
                            ["--p" as string]: size,
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "calc(var(--p) * 1%)",
                            height: "calc(var(--p) * 1%)",
                            transform: "translate(-50%, -50%)",
                            zIndex: svgZIndex,
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                        draggable={false}
                    />
                )}
            </div>
        </div>
    )
}

interface ScrollMaskImage {
    src: string
    alt?: string
}

interface ScrollMaskProps {
    image?: ScrollMaskImage
    shape?: string
    startSize: number
    endSize: number
    revealStart: number
    revealEnd: number
    imageFit: "cover" | "contain" | "fill"
    borderRadius: number
    backgroundColor: string
    scrollHeight: number
    stickyTopOffset: number
    zIndex: number
    svgZIndex: number
}

addPropertyControls(ScrollMask, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Imagem",
    },
    shape: {
        type: ControlType.File,
        title: "Forma (SVG)",
        description:
            "SVG usado como máscara. Áreas preenchidas (opacas) do SVG revelam a imagem; áreas transparentes escondem.",
        allowedFileTypes: ["svg"],
    },
    svgZIndex: {
        type: ControlType.Number,
        title: "Z-Index do SVG",
        description:
            "Ordem de empilhamento do SVG (renderizado como elemento visível) em relação à imagem revelada. Positivo = na frente, negativo = atrás.",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 1,
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
    zIndex: {
        type: ControlType.Number,
        title: "Z-Index da seção",
        description:
            "Ordem de empilhamento da seção presa (SVG + imagem) em relação a outros elementos da página.",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
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
            "Tamanho da forma no fim da revelação. Use um valor bem acima de 100 para que a forma ultrapasse os limites do container e a imagem apareça por completo, sem silhueta do SVG.",
        min: 0,
        max: 500,
        step: 1,
        defaultValue: 300,
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
