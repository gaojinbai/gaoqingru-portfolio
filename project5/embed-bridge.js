(() => {
  if (new URLSearchParams(window.location.search).get('embed') !== '1') return;

  document.documentElement.classList.add('portfolio-embed');
  const style = document.createElement('style');
  style.textContent = `
    html.portfolio-embed { scrollbar-width: none; scroll-behavior: auto !important; }
    html.portfolio-embed::-webkit-scrollbar,
    html.portfolio-embed body::-webkit-scrollbar { display: none; }
    html.portfolio-embed .settings-toggle,
    html.portfolio-embed .editor,
    html.portfolio-embed .journey-settings-toggle,
    html.portfolio-embed .journey-tools,
    html.portfolio-embed .journey-upload,
    html.portfolio-embed .archive-settings-toggle,
    html.portfolio-embed .archive-tools,
    html.portfolio-embed .archive-upload { display: none !important; }
  `;
  document.head.appendChild(style);

  document.body.classList.remove('editing', 'editor-open');
  document.querySelectorAll('[contenteditable]').forEach((node) => node.setAttribute('contenteditable', 'false'));
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    input.disabled = true;
    input.tabIndex = -1;
  });

  const pageHeight = () => Math.max(
    document.documentElement.scrollHeight,
    document.body ? document.body.scrollHeight : 0
  );

  let lastHeight = 0;
  const reportMetrics = () => {
    const height = pageHeight();
    if (height === lastHeight) return;
    lastHeight = height;
    window.parent.postMessage({ type: 'project-scroll-metrics', height }, '*');
  };

  window.addEventListener('message', (event) => {
    if (!event.data || event.data.type !== 'portfolio-global-scroll') return;
    const scrollTop = Number(event.data.scrollTop);
    if (Number.isFinite(scrollTop)) window.scrollTo(0, scrollTop);
  });

  window.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaY) < Math.abs(event.deltaX)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    window.parent.postMessage({ type: 'project-global-wheel', deltaY: event.deltaY * unit }, '*');
  }, { passive: false, capture: true });

  window.addEventListener('load', reportMetrics);
  window.addEventListener('resize', reportMetrics, { passive: true });
  document.querySelectorAll('img').forEach((image) => {
    if (!image.complete) image.addEventListener('load', reportMetrics, { once: true });
  });
  if ('ResizeObserver' in window) new ResizeObserver(reportMetrics).observe(document.documentElement);
  requestAnimationFrame(reportMetrics);
  setTimeout(reportMetrics, 500);
})();
