import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * React Bits - MagneticButton
 * Interactive magnetic effect that gently draws the element towards the cursor.
 */
const MagneticButton = ({ children, className = '', strength = 0.35, onClick, ...props }) => {
  const buttonRef = useRef(null);

  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = el.getBoundingClientRect();
      const x = (clientX - (left + width / 2)) * strength;
      const y = (clientY - (top + height / 2)) * strength;

      gsap.to(el, { x, y, duration: 0.3, ease: 'power2.out' });
    };

    const handleMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return (
    <button ref={buttonRef} onClick={onClick} className={className} {...props}>
      {children}
    </button>
  );
};

export default MagneticButton;
