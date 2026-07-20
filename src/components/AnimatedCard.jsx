import { motion, useReducedMotion } from 'framer-motion';

export default function AnimatedCard({
  children,
  delay = 0,
  className = '',
  onClick,
  as = 'div'
}) {
  const reduceMotion = useReducedMotion();
  const MotionElement = motion[as] || motion.div;

  return (
    <MotionElement
      initial={reduceMotion ? false : { opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : delay, ease: 'easeOut' }}
      whileHover={reduceMotion ? undefined : { y: -6, transition: { duration: 0.2 } }}
      whileTap={reduceMotion || !onClick ? undefined : { scale: 0.985 }}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 motion-card animated-card ${onClick ? 'is-clickable' : ''} ${className}`.trim()}
    >
      {children}
    </MotionElement>
  );
}

  );
}
