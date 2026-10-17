/* ============================================
   动态成片卡片渲染 video-hub v1
   读取 assets/video-hub-data.js 中的链接配置，
   把封面、二维码、说明文案、可复制链接渲染进 .video-hub 挂载点。
   ============================================ */
(function () {
  var DATA = window.VIDEO_HUB_LINKS || {};
  var QR_SVG = '<svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">' +
    '<g fill="none" stroke="#9c9280" stroke-width="1.5">' +
    '<rect x="2" y="2" width="10" height="10"/><rect x="22" y="2" width="10" height="10"/><rect x="2" y="22" width="10" height="10"/>' +
    '</g><path d="M22 22h4v4h-4zM28 28h4v4h-4z" fill="#9c9280"/></svg>';

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function bindCopy(btn, getText) {
    btn.addEventListener('click', function () {
      var text = getText();
      function done(ok) {
        btn.textContent = ok ? '已复制 ✓' : '复制失败';
        setTimeout(function () { btn.textContent = '复制'; }, 1600);
      }
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = text;
          ta.style.cssText = 'position:fixed;opacity:0';
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          done(ok);
        } catch (e) { done(false); }
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, fallback);
      } else { fallback(); }
    });
  }

  document.querySelectorAll('.video-hub').forEach(function (mount) {
    var id = mount.getAttribute('data-vh');
    var cfg = DATA[id] || {};
    var url = (cfg.url || '').trim();
    var qr = mount.getAttribute('data-vh-qr') || '';
    var cover = mount.getAttribute('data-vh-cover') || '';
    var title = mount.getAttribute('data-vh-title') || '作品动态成片';
    var sub = mount.getAttribute('data-vh-sub') || '';
    var theme = mount.getAttribute('data-vh-theme') || 'light';
    var layout = mount.getAttribute('data-vh-layout') || 'full';

    var qrInner = qr
      ? '<img src="' + esc(qr) + '" alt="B站视频二维码" loading="lazy">'
      : '<div class="vh-qrph">' + QR_SVG + '<span>二维码待上传</span></div>';
    var urlHtml = url
      ? '<a class="vh-url" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(url) + '</a>'
      : '<span class="vh-url vh-url--empty">待补充 · B站上传后填入 assets/video-hub-data.js</span>';

    var el = document.createElement('div');
    var QRBOX = '<div class="vh-qrbox">' + qrInner + '</div>';

    if (layout === 'slot') {
      el.className = 'vh vh--slot';
      el.setAttribute('data-theme', theme);
      el.innerHTML =
        '<div class="vh-slot-media">' +
          (cover ? '<img class="vh-cover" src="' + esc(cover) + '" alt="' + esc(title) + ' 封面" loading="lazy">' : '') +
          '<div class="vh-slot-qr">' + QRBOX + '</div>' +
        '</div>' +
        '<div class="vh-title"><span>🎬 作品动态成片</span></div>' +
        (sub ? '<p class="vh-sub">' + esc(sub) + '</p>' : '') +
        '<p class="vh-lines">移动端：扫描右侧二维码，即可跳转观看完整视频<br>电脑端：复制下方链接在浏览器打开观看</p>' +
        '<div class="vh-linkrow"><span class="vh-label">视频链接：</span>' + urlHtml +
          '<button class="vh-copy" type="button"' + (url ? '' : ' disabled') + '>复制</button></div>';
    } else {
      var coverHtml = (layout !== 'bar' && cover)
        ? '<img class="vh-cover" src="' + esc(cover) + '" alt="' + esc(title) + ' 封面" loading="lazy">'
        : '';
      el.className = 'vh' + (layout === 'bar' ? ' vh--bar' : '');
      el.setAttribute('data-theme', theme);
      el.innerHTML =
        '<div class="vh-grid">' +
          '<div class="vh-main">' + coverHtml +
            '<div>' +
              '<div class="vh-title"><span>🎬 作品动态成片</span></div>' +
              (sub ? '<p class="vh-sub">' + esc(sub) + '</p>' : '') +
              '<p class="vh-lines">移动端：扫描右侧二维码，即可跳转观看完整视频<br>电脑端：复制下方链接在浏览器打开观看</p>' +
            '</div>' +
          '</div>' +
          '<div class="vh-side">' + QRBOX + '<span class="vh-qrnote">B站 · 扫码观看</span></div>' +
        '</div>' +
        '<div class="vh-linkrow"><span class="vh-label">视频链接：</span>' + urlHtml +
          '<button class="vh-copy" type="button"' + (url ? '' : ' disabled') + '>复制</button></div>';
    }

    mount.appendChild(el);
    var qrImg = el.querySelector('.vh-qrbox img');
    if (qrImg) {
      qrImg.addEventListener('error', function () {
        qrImg.parentElement.innerHTML = '<div class="vh-qrph">' + QR_SVG + '<span>二维码待上传</span></div>';
      });
    }
    if (url) bindCopy(el.querySelector('.vh-copy'), function () { return url; });
  });
})();
