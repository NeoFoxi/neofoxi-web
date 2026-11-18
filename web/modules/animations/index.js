/**
 * Animation utilities — IntersectionObserver-based scroll reveal.
 *
 * Adds `.animate-visible` to elements with `animate-fade-in-up`,
 * `animate-fade-in`, or `animate-scale-in` classes when they scroll
 * into view. Respects `prefers-reduced-motion`.
 *
 * @param {Element} [root=document] - Root element to query within.
 * @returns {() => void} Cleanup function to disconnect the observer.
 */
export function observeReveal(root = document) {
  const els = root.querySelectorAll(
    '.animate-fade-in-up, .animate-fade-in, .animate-scale-in'
  );
  if (!els.length) return () => {};

  // Respect reduced motion — reveal everything immediately
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('animate-visible'));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach((el) => observer.observe(el));

  return () => observer.disconnect();
}
