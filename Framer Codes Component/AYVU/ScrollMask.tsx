import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import { addPropertyControls, ControlType } from "framer"

/**
 * Scroll Mask
 *
 * Logo intro effect: the section sticks to the top while the page scrolls
 * through it. Two zoom animations run in parallel: (1) the logo itself
 * appears at its initial size and zooms in a lot as the scroll advances;
 * (2) the background image also gets a subtle zoom, reinforcing the feeling
 * of "entering" the image. The background image is never clipped — it stays
 * fully visible behind the logo.
 *
 * "Zoom Mode" controls how the logo behaves: "Grow" animates from Start Size
 * to End Size (100 = covers the container box; values well above 100 make
 * it burst past the screen); "Fullscreen" makes the logo fill the entire
 * screen from the start and stay that way for the whole scroll.
 *
 * Important: the component creates its own scroll height (prop "Scroll
 * Height", in vh) — place it in a normal page section, without constraining
 * the frame's height in Framer, for the pin effect to work.
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
        zoomMode = "grow",
        animationTiming = "duringPin",
        lockOffset = 0,
        startSize = 30,
        endSize = 800,
        imageZoomEnd = 1.2,
        revealStart = 0.1,
        revealEnd = 0.6,
        imageFit = "cover",
        imagePadding = "0px 0px 0px 0px",
        imageMaxWidth = 0,
        borderRadius = 0,
        backgroundColor = "#0A0A0A",
        scrollHeight = 250,
        stickyTopOffset = 0,
        zIndex = 0,
        svgZIndex = 1,
    } = props

    const wrapperRef = useRef<HTMLDivElement>(null)

    const lockPoint = lockOffset > 0 ? (`start ${lockOffset}px` as const) : "start start"

    const { scrollYProgress } = useScroll({
        target: wrapperRef,
        offset: (animationTiming === "beforePin"
            ? ["start end", lockPoint]
            : [lockPoint, "end end"]) as any,
    })

    const revealProgress = useTransform(
        scrollYProgress,
        [revealStart, revealEnd],
        [0, 1],
        { clamp: true }
    )

    const size = useTransform(revealProgress, [0, 1], [startSize, endSize])
    const imageScale = useTransform(revealProgress, [0, 1], [1, imageZoomEnd])

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
                    background: backgroundColor,
                    zIndex,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        overflow: "hidden",
                        borderRadius,
                    }}
                >
                    <motion.div
                        style={{
                            position: "absolute",
                            inset: 0,
                            scale: imageScale,
                            padding: imagePadding,
                            boxSizing: "border-box",
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >
                        {image?.src ? (
                            <img
                                src={image.src}
                                alt={image.alt ?? ""}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    maxWidth: imageMaxWidth > 0 ? imageMaxWidth : undefined,
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
                                Select an image in the properties panel.
                            </div>
                        )}
                    </motion.div>
                </div>

                {shape && (
                    <motion.img
                        src={shape}
                        alt=""
                        style={
                            zoomMode === "fullscreen"
                                ? {
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      width: "100vw",
                                      height: "100vh",
                                      objectFit: "cover",
                                      zIndex: svgZIndex,
                                      transform: "translate(-50%, -50%)",
                                      pointerEvents: "none",
                                      userSelect: "none",
                                  }
                                : {
                                      ["--p" as string]: size,
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      width: "calc(var(--p) * 1%)",
                                      height: "calc(var(--p) * 1%)",
                                      objectFit: "contain",
                                      zIndex: svgZIndex,
                                      transform: "translate(-50%, -50%)",
                                      pointerEvents: "none",
                                      userSelect: "none",
                                  }
                        }
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
    zoomMode: "grow" | "fullscreen"
    animationTiming: "duringPin" | "beforePin"
    lockOffset: number
    startSize: number
    endSize: number
    imageZoomEnd: number
    revealStart: number
    revealEnd: number
    imageFit: "cover" | "contain" | "fill"
    imagePadding: string
    imageMaxWidth: number
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
        title: "Image",
    },
    shape: {
        type: ControlType.File,
        title: "Logo (SVG)",
        description:
            "Logo displayed over the background image. Appears at Start Size and zooms in as the page scrolls.",
        allowedFileTypes: ["svg"],
    },
    zoomMode: {
        type: ControlType.Enum,
        title: "Zoom Mode",
        description:
            "\"Grow\" animates the logo from Start Size to End Size. \"Fullscreen\" makes the logo fill the entire screen from the start and stay that way until the end of the scroll.",
        options: ["grow", "fullscreen"],
        optionTitles: ["Grow (zoom)", "Fullscreen"],
        defaultValue: "grow",
    },
    animationTiming: {
        type: ControlType.Enum,
        title: "Animation Timing",
        description:
            "\"During Pin\" (default): the animation runs while the section is stuck at the top. \"Before Pin\": the animation finishes while the section is still scrolling in, already at its final state by the time it locks.",
        options: ["duringPin", "beforePin"],
        optionTitles: ["During Pin", "Before Pin"],
        defaultValue: "duringPin",
    },
    lockOffset: {
        type: ControlType.Number,
        title: "Lock Offset",
        description:
            "How many pixels before the section is fully locked/visible the animation reaches its boundary (start of \"During Pin\", or end of \"Before Pin\"). 0 = exactly at the lock point.",
        min: 0,
        max: 1000,
        step: 10,
        defaultValue: 0,
    },
    svgZIndex: {
        type: ControlType.Number,
        title: "SVG Z-Index",
        description:
            "Stacking order of the SVG relative to the background image within this section. Positive = in front of the image, negative = behind it. Use \"Section Z-Index\" to control stacking against the rest of the page.",
        min: -1,
        max: 10,
        step: 1,
        defaultValue: 1,
    },
    scrollHeight: {
        type: ControlType.Number,
        title: "Scroll Height",
        description:
            "Scroll distance (in vh) the section stays pinned to the top while the mask animation plays.",
        min: 120,
        max: 500,
        step: 10,
        defaultValue: 250,
    },
    stickyTopOffset: {
        type: ControlType.Number,
        title: "Top Offset",
        description: "Distance from the top where the section sticks (px).",
        min: 0,
        max: 200,
        step: 1,
        defaultValue: 0,
    },
    zIndex: {
        type: ControlType.Number,
        title: "Section Z-Index",
        description:
            "Stacking order of the pinned section (SVG + image) relative to other elements on the page.",
        min: -100,
        max: 100,
        step: 1,
        defaultValue: 0,
    },
    startSize: {
        type: ControlType.Number,
        title: "Start Size",
        description:
            "Logo size before scrolling (100 = covers the container box). Use a visible value, e.g. 30.",
        min: 0,
        max: 150,
        step: 1,
        defaultValue: 30,
        hidden: (props) => props.zoomMode !== "grow",
    },
    endSize: {
        type: ControlType.Number,
        title: "End Size",
        description:
            "Logo size at the end of the zoom. Use a very high value (e.g. 800) for a big zoom.",
        min: 0,
        max: 10000,
        step: 10,
        defaultValue: 800,
        hidden: (props) => props.zoomMode !== "grow",
    },
    imageZoomEnd: {
        type: ControlType.Number,
        title: "Image Zoom",
        description:
            "Background image scale at the end of the animation (1 = no zoom). Creates a \"zoom into the scene\" effect alongside the logo zoom.",
        min: 1,
        max: 3,
        step: 0.05,
        defaultValue: 1.2,
    },
    revealStart: {
        type: ControlType.Number,
        title: "Reveal Start",
        description: "Scroll point (0 to 1) where the animation starts.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.1,
    },
    revealEnd: {
        type: ControlType.Number,
        title: "Reveal End",
        description: "Scroll point (0 to 1) where the animation ends.",
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0.6,
    },
    imageFit: {
        type: ControlType.Enum,
        title: "Fit",
        options: ["cover", "contain", "fill"],
        optionTitles: ["Cover", "Contain", "Fill"],
        defaultValue: "cover",
    },
    imagePadding: {
        type: ControlType.Padding,
        title: "Image Padding",
        description: "Inner spacing between the image and the container edge.",
        defaultValue: "0px 0px 0px 0px",
    },
    imageMaxWidth: {
        type: ControlType.Number,
        title: "Image Max Width",
        description:
            "Maximum image width in px. Use 0 for no limit (the image fills the available width).",
        min: 0,
        max: 3000,
        step: 10,
        defaultValue: 0,
    },
    borderRadius: {
        type: ControlType.Number,
        title: "Border Radius",
        min: 0,
        max: 100,
        defaultValue: 0,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0A0A0A",
    },
})
