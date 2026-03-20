import './GradientText.css'

// Wraps children in an animated teal gradient text effect
export default function GradientText({
  children,
  className = '',
  colors = ['#00a884', '#00d4aa', '#00a884'],
  animationSpeed = 6,
}) {
  const gradient = `linear-gradient(135deg, ${colors.join(', ')})`

  return (
    <span
      className={`gradient-text ${className}`}
      style={{
        backgroundImage: gradient,
        backgroundSize: '200% auto',
        animationDuration: `${animationSpeed}s`,
      }}
    >
      {children}
    </span>
  )
}
