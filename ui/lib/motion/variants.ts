import { VariantProps } from "framer-motion";

export const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

export const item = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export const popIn = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 260, damping: 20 } },
};

export const rewardBurst = {
  hidden: { opacity: 0, scale: 0.3 },
  visible: {
    opacity: 1,
    scale: [0.3, 1.2, 1],
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

export const shimmer = {
  hidden: { opacity: 0.5 },
  visible: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity },
  },
};

export type ContainerVariants = VariantProps<typeof container>;
export type ItemVariants = VariantProps<typeof item>;
export type FadeInVariants = VariantProps<typeof fadeIn>;
export type SlideUpVariants = VariantProps<typeof slideUp>;
export type ScaleInVariants = VariantProps<typeof scaleIn>;
export type PopInVariants = VariantProps<typeof popIn>;
export type RewardBurstVariants = VariantProps<typeof rewardBurst>;
export type ShimmerVariants = VariantProps<typeof shimmer>;
