import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

export default function AnimatedPage({ children, pageKey = 'page', className = '' }) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={reduceMotion ? false : 'initial'}
        animate="in"
        exit={reduceMotion ? undefined : 'out'}
        variants={pageVariants}
        transition={{ duration: reduceMotion ? 0 : 0.3, ease: 'easeOut' }}
        className={`animated-page ${className}`.trim()}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

  );
}
