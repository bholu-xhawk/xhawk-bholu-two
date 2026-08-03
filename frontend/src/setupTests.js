import '@testing-library/jest-dom'

jest.mock('framer-motion', () => {
  const React = require('react')

  const withoutMotionProps = ({
    animate,
    children,
    exit,
    initial,
    transition,
    variants,
    viewport,
    whileHover,
    whileInView,
    whileTap,
    ...props
  }) => ({ children, props })

  const motion = new Proxy({}, {
    get: (_target, element) => React.forwardRef(({ children, ...props }, ref) => {
      const { props: domProps } = withoutMotionProps(props)
      return React.createElement(element, { ...domProps, ref }, children)
    }),
  })

  return {
    AnimatePresence: ({ children }) => React.createElement(React.Fragment, null, children),
    motion,
  }
})
