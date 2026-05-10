// Instant Feedback Utility for Button Interactions
// Provides ripple effect and haptic feedback on button clicks

export function addInstantFeedback(element) {
  if (!element) return;

  // Ripple effect
  element.addEventListener('click', function (e) {
    const ripple = document.createElement('span');
    const rect = this.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      pointer-events: none;
      animation: ripple 0.6s ease-out;
    `;

    // Add animation
    if (!document.querySelector('style[data-ripple]')) {
      const style = document.createElement('style');
      style.setAttribute('data-ripple', '');
      style.textContent = `
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    this.style.position = 'relative';
    this.style.overflow = 'hidden';
    this.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  });

  // Haptic feedback if available
  if (navigator.vibrate) {
    element.addEventListener('click', () => {
      navigator.vibrate(10); // 10ms vibration
    });
  }
}

// Add scale down effect on touch for mobile feedback
export function addTouchFeedback(element) {
  if (!element) return;

  element.addEventListener('touchstart', () => {
    element.style.transform = 'scale(0.95)';
  });

  element.addEventListener('touchend', () => {
    element.style.transform = 'scale(1)';
  });

  element.addEventListener('touchcancel', () => {
    element.style.transform = 'scale(1)';
  });
}

// Debounce function for button clicks to prevent multiple rapid clicks
export function createClickDebounce(fn, delay = 300) {
  let timeoutId;
  let isDisabled = false;

  return function (...args) {
    if (isDisabled) return;

    isDisabled = true;
    fn.apply(this, args);

    timeoutId = setTimeout(() => {
      isDisabled = false;
    }, delay);
  };
}
