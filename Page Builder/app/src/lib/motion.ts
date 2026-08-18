import type { HTMLMotionProps, Target } from "framer-motion";
import { Animation, AnimationType } from "./schema";

const PRESETS: Record<AnimationType, { hidden: Target; visible: Target }> = {
  fade: { hidden: { opacity: 0 }, visible: { opacity: 1 } },
  slide: { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } },
  scale: { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1 } },
  custom: { hidden: {}, visible: {} },
};

export type MotionRenderProps = Pick<
  HTMLMotionProps<"div">,
  "initial" | "animate" | "whileInView" | "whileHover" | "whileTap" | "viewport" | "transition"
>;

/**
 * Converte a configuração de Animation do nó em props do framer-motion, para
 * que o efeito seja visível ao vivo no canvas (não é só metadado salvo).
 */
export function getMotionProps(animation: Animation): MotionRenderProps {
  const preset = PRESETS[animation.type] ?? PRESETS.fade;
  const transition: HTMLMotionProps<"div">["transition"] = {
    duration: (animation.durationMs ?? 500) / 1000,
    delay: (animation.delayMs ?? 0) / 1000,
    ease: "easeOut",
  };

  switch (animation.trigger) {
    case "onScroll":
      return {
        initial: preset.hidden,
        whileInView: preset.visible,
        viewport: { once: true, amount: 0.3 },
        transition,
      };
    case "onHover":
      return { whileHover: { scale: 1.03 }, transition: { duration: 0.2 } };
    case "onTap":
      return { whileTap: { scale: 0.96 }, transition: { duration: 0.1 } };
    case "onLoad":
    default:
      return { initial: preset.hidden, animate: preset.visible, transition };
  }
}
