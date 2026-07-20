import { motion, useReducedMotion } from 'framer-motion';

export default function AnimatedTab({ children, isActive, onClick, className = '', id }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      id={id}
      type="button"
      role="tab"
      aria-selected={Boolean(isActive)}
      aria-pressed={Boolean(isActive)}
      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      onClick={onClick}
      className={`${isActive ? 'active' : ''} animated-tab ${className}`.trim()}
    >
      {children}
    </motion.button>
  );
}
