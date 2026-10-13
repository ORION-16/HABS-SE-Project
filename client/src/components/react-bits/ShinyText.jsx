/**
 * React Bits - ShinyText
 * Elegant shimmering text effect for badges, headers, and highlights.
 */
const ShinyText = ({ text, disabled = false, speed = 5, className = '' }) => {
  const animationDuration = `${speed}s`;

  return (
    <span
      className={`inline-block ${
        disabled
          ? ''
          : 'bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-indigo-600 to-gray-900 bg-[length:200%_auto] animate-shimmer'
      } ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </span>
  );
};

export default ShinyText;
