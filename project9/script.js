const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

  revealItems.forEach((item) => observer.observe(item));
}

const dialog = document.querySelector('.lightbox');
const dialogImage = dialog?.querySelector('.lightbox-stage img');
const dialogCaption = dialog?.querySelector('.lightbox-caption');
const closeButton = dialog?.querySelector('.lightbox-close');

document.querySelectorAll('[data-lightbox]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!dialog || !dialogImage || !dialogCaption) return;
    dialogImage.src = button.dataset.lightbox;
    dialogImage.alt = button.dataset.caption || button.querySelector('img')?.alt || '';
    dialogCaption.textContent = button.dataset.caption || '';
    dialog.showModal();
  });
});

closeButton?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog?.addEventListener('close', () => {
  if (dialogImage) dialogImage.src = '';
});

/* 嵌入完整作品集时，将滚轮、触控和章节导航交给外层全局滚动轴。 */
if (document.documentElement.classList.contains('embed-mode')) {
  const pageBottom = () => {
    const footer = document.querySelector('.site-footer');
    return Math.ceil(Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      footer ? footer.getBoundingClientRect().bottom + window.scrollY : 0
    ));
  };

  const reportHeight = () => parent.postMessage({
    type: 'project-scroll-metrics',
    height: pageBottom()
  }, '*');

  window.addEventListener('load', reportHeight);
  window.addEventListener('resize', reportHeight, { passive: true });
  new ResizeObserver(reportHeight).observe(document.body);
  document.querySelectorAll('img').forEach((image) => {
    if (!image.complete) image.addEventListener('load', reportHeight, { once: true });
  });
  reportHeight();

  const forwardScroll = (deltaY) => parent.postMessage({ type: 'project-global-wheel', deltaY }, '*');
  window.addEventListener('wheel', (event) => {
    if (dialog?.open && event.target.closest('.lightbox-stage')) return;
    event.preventDefault();
    const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
    forwardScroll(event.deltaY * scale);
  }, { passive: false });

  let touchX = 0;
  let touchY = 0;
  window.addEventListener('touchstart', (event) => {
    touchX = event.touches[0]?.clientX || 0;
    touchY = event.touches[0]?.clientY || 0;
  }, { passive: true });
  window.addEventListener('touchmove', (event) => {
    if (dialog?.open && event.target.closest('.lightbox-stage')) return;
    const touch = event.touches[0];
    if (!touch) return;
    const dx = touch.clientX - touchX;
    const dy = touch.clientY - touchY;
    if (Math.abs(dy) <= Math.abs(dx)) return;
    event.preventDefault();
    forwardScroll(-dy);
    touchX = touch.clientX;
    touchY = touch.clientY;
  }, { passive: false });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      parent.postMessage({
        type: 'project-local-scroll-request',
        localTop: target.offsetTop
      }, '*');
    });
  });

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'portfolio-global-scroll') {
      window.scrollTo(0, Number(event.data.scrollTop) || 0);
    }
  });
}
