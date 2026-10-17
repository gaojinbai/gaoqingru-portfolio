/* PocketBay image MIME fallback: decode image bytes as blobs when static MIME is text/plain. */
(function () {
  'use strict';
  function loadImage(img) {
    if (!img || img.dataset.mediaFallback === '1' || !img.src || img.src.startsWith('data:') || img.src.startsWith('blob:')) return;
    img.dataset.mediaFallback = '1';
    var url = img.currentSrc || img.src;
    fetch(url, { cache: 'force-cache' }).then(function (r) {
      if (!r.ok) throw new Error('image ' + r.status);
      return r.blob();
    }).then(function (blob) {
      if (!blob.type || blob.type === 'text/plain') {
        var fixed = new Blob([blob], { type: 'image/webp' });
        img.src = URL.createObjectURL(fixed);
      }
    }).catch(function () {});
  }
  function scan(root) {
    (root || document).querySelectorAll('img').forEach(loadImage);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { subtree: true, childList: true });
})();

