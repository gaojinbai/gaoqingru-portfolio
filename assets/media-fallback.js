/* Decode static images even when the host serves WebP as text/plain. */
(function () {
  'use strict';
  var nativeSet = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
  var nativeGet = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').get;
  var pending = new WeakSet();
  function mediaType(url) {
    var clean = String(url).split('?')[0].toLowerCase();
    if (clean.endsWith('.webp')) return 'image/webp';
    if (clean.endsWith('.png')) return 'image/png';
    if (clean.endsWith('.jpg') || clean.endsWith('.jpeg')) return 'image/jpeg';
    return '';
  }
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true,
    get: nativeGet,
    set: function (value) {
      var type = mediaType(value);
      if (!type || String(value).startsWith('data:') || String(value).startsWith('blob:') || pending.has(this)) {
        nativeSet.call(this, value);
        return;
      }
      var self = this;
      pending.add(self);
      fetch(value, { cache: 'force-cache' }).then(function (r) {
        if (!r.ok) throw new Error(String(r.status));
        return r.blob();
      }).then(function (blob) {
        var fixed = new Blob([blob], { type: type });
        nativeSet.call(self, URL.createObjectURL(fixed));
      }).catch(function () { nativeSet.call(self, value); }).finally(function () { pending.delete(self); });
    }
  });
  function scan(root) {
    (root || document).querySelectorAll('img').forEach(function (img) {
      if (img.src && mediaType(img.src) && !img.dataset.mediaFallback) {
        var current = img.getAttribute('src');
        img.dataset.mediaFallback = '1';
        img.removeAttribute('src');
        img.src = current;
      }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { scan(); });
  else scan();
  new MutationObserver(function () { scan(); }).observe(document.documentElement, { subtree: true, childList: true });
})();

