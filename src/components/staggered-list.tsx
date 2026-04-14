'use client'

import { motion, useReducedMotion } from 'framer-motion'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}

const itemVariantsReduced = {
  hidden: { opacity: 1, y: 0 },
  visible: { opacity: 1, y: 0 },
}

interface Props {
  children: React.ReactNode
  className?: string
}

export function StaggeredList({ children, className }: Props) {
  const reduced = useReducedMotion()
  const variants = reduced ? itemVariantsReduced : itemVariants
  const childArray = Array.isArray(children) ? children : [children]

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {childArray.map((child, i) => (
        <motion.div key={i} variants={i < 5 ? variants : undefined}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
