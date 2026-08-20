import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Mask
 *
 * Efeito de intro com logo: a seção fica presa (sticky) no topo enquanto a
 * página rola por ela. A logo (SVG) aparece visível no início; conforme o
 * scroll avança, ela dá um zoom grande (cresce muito) e desaparece
 * (fade out) ao final, revelando a imagem de fundo por completo. A imagem
 * de fundo em si nunca é recortada — fica sempre visível atrás da logo.
 *
 * O tamanho da logo no início e no fim do zoom é configurável (100 = cobre
 * a caixa do container; valores bem acima de 100 no "Tamanho final" criam
 * o efeito de zoom estourando a tela). A opacidade da logo cai a zero entre
 * "Início do fade" e o fim da animação.
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
        startSize = 30,
        endSize = 800,
        fadeOutStart = 0.7,
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
    const logoOpacity = useTransform(
        revealProgress,
        [0, Math.min(fadeOutStart, 0.99), 1],
        [1, 1, 0]
    )

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
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
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
                </div>

            </div>

            {shape && (
                <div
                    style={{
                        position: "sticky",
                        top: stickyTopOffset,
                        marginTop: "-100vh",
                        width: "100%",
                        height: "100vh",
                        zIndex: svgZIndex,
                        pointerEvents: "none",
                    }}
                >
                    <motion.img
                        src={shape}
                        alt=""
                        style={{
                            ["--p" as string]: size,
                            opacity: logoOpacity,
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            width: "calc(var(--p) * 1%)",
                            height: "calc(var(--p) * 1%)",
                            transform: "translate(-50%, -50%)",
                            pointerEvents: "none",
                            userSelect: "none",
                        }}
                        draggable={false}
                    />
                </div>
            )}
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
    fadeOutStart: number
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
        title: "Logo (SVG)",
        description:
            "Logo exibida sobre a imagem de fundo. Aparece no tamanho inicial, dá zoom conforme o scroll e desaparece (fade) revelando a imagem por completo.",
        allowedFileTypes: ["svg"],
    },
    svgZIndex: {
        type: ControlType.Number,
        title: "Z-Index do SVG",
        description:
            "Ordem de empilhamento do SVG em relação a todos os outros elementos da página (não só a imagem deste componente).",
        min: -1,
        max: 10,
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
            "Tamanho da logo antes de rolar (100 = cobre a caixa do container). Use um valor visível, ex. 30.",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 30,
    },
    endSize: {
        type: ControlType.Number,
        title: "Tamanho final",
        description:
            "Tamanho da logo ao final do zoom. Use um valor bem alto (ex. 800) para um zoom grande.",
        min: 0,
        max: 2000,
        step: 10,
        defaultValue: 800,
    },
    fadeOutStart: {
        type: ControlType.Number,
        title: "Início do fade",
        description:
            "Ponto da animação (0 a 1, relativo a Início/Fim da revelação) em que a logo começa a sumir (opacidade), até ficar totalmente transparente no fim do zoom e revelar a imagem de fundo por completo.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.7,
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
