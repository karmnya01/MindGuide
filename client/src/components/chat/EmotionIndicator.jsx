import { motion } from "framer-motion";

/**
 * Emotion pill displayed next to user messages.
 * Only renders when an emotion string is present.
 * Keeps styling subtle — no emojis, no bright colours.
 */

const EMOTION_STYLES = {
  joy:       { bg: "bg-emerald-950/60", text: "text-emerald-400", border: "border-emerald-800/50" },
  anger:     { bg: "bg-rose-950/60",    text: "text-rose-400",    border: "border-rose-800/50"    },
  fear:      { bg: "bg-violet-950/60",  text: "text-violet-400",  border: "border-violet-800/50"  },
  sadness:   { bg: "bg-blue-950/60",    text: "text-blue-400",    border: "border-blue-800/50"    },
  disgust:   { bg: "bg-amber-950/60",   text: "text-amber-400",   border: "border-amber-800/50"   },
  surprise:  { bg: "bg-sky-950/60",     text: "text-sky-400",     border: "border-sky-800/50"     },
  neutral:   { bg: "bg-slate-800/60",   text: "text-slate-400",   border: "border-slate-700/50"   },
};

const DEFAULT_STYLE = EMOTION_STYLES.neutral;

const EmotionIndicator = ({ emotion }) => {
  if (!emotion) return null;

  const key = emotion.toLowerCase();
  const style = EMOTION_STYLES[key] || DEFAULT_STYLE;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
        font-medium tracking-wide border self-start mt-1
        ${style.bg} ${style.text} ${style.border}
      `}
      title={`Detected emotion: ${emotion}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {emotion}
    </motion.span>
  );
};

export default EmotionIndicator;
