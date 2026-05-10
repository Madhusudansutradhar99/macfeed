import React, { useEffect } from 'react';

/**
 * Global hook to add instant feedback to all buttons
 * Provides ripple effect, haptic feedback, and opacity change
 */
export function useInstantButtonFeedback() {
  useEffect(() => {
    // Add styles for button feedback
    if (!document.querySelector('style[data-button-feedback]')) {
      const style = document.createElement('style');
      style.setAttribute('data-button-feedback', '');
      style.textContent = `
        button, [role="button"], input[type="button"], input[type="submit"] {
          transition: all 0.08s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        button:active, [role="button"]:active, input[type="button"]:active, input[type="submit"]:active {
          transform: scale(0.98);
          opacity: 0.85;
        }
        
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        
        .ripple-effect {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple 0.6s ease-out;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    // Add click listeners to all buttons
    const buttons = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"], label[role="button"]');
    
    const addRipple = (e) => {
      const button = e.currentTarget;
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      const ripple = document.createElement('span');
      ripple.className = 'ripple-effect';
      ripple.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
      `;

      // Ensure button has position relative
      if (getComputedStyle(button).position === 'static') {
        button.style.position = 'relative';
      }

      button.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      // Haptic feedback
      if (navigator.vibrate) {
        try {
          navigator.vibrate(8);
        } catch (e) {}
      }
    };

    buttons.forEach(button => {
      button.addEventListener('click', addRipple);
    });

    return () => {
      buttons.forEach(button => {
        button.removeEventListener('click', addRipple);
      });
    };
  }, []);
}

export default function InstantFeedbackProvider() {
  useInstantButtonFeedback();
  return null;
}
