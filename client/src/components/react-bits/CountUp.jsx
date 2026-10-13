import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * React Bits - CountUp
 * GSAP-driven numeric counter animation for dashboard metrics.
 */
const CountUp = ({
  to,
  from = 0,
  duration = 1.2,
  separator = '',
  prefix = '',
  suffix = '',
  padZero = false,
  className = '',
}) => {
  const spanRef = useRef(null);

  useEffect(() => {
    const obj = { val: from };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: to,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          if (spanRef.current) {
            const currentInt = Math.floor(obj.val);
            const formatted = padZero && currentInt < 10 ? `0${currentInt}` : `${currentInt}`;
            spanRef.current.textContent = `${prefix}${formatted}${suffix}`;
          }
        },
      });
    });

    return () => ctx.revert();
  }, [to, from, duration, prefix, suffix, padZero]);

  return <span ref={spanRef} className={className}>{prefix}{to}{suffix}</span>;
};

export default CountUp;
