/* Adsterra ads for Ludo.
   ------------------------------------------------------------------
   Yahan apne Adsterra dashboard se copy kiye hue code paste karo.
   Jo khaali chhod doge, uski ad jagah page par dikhegi hi nahi.

   Preview ke liye: index.html?adspreview khol lo — tab khaali
   jagahon par "Ad space" ka dabba dikhega.
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* ================= PASTE YOUR CODES HERE ================= */

  /* 1. Top banner — desktop (728x90) */
  var AD_TOP_DESKTOP = `<script type="text/javascript">
  atOptions = {
    'key' : '761ef6cd0c847f71e4ba6fe0f4629673',
    'format' : 'iframe',
    'height' : 90,
    'width' : 728,
    'params' : {}
  };
</script>
<script src="https://bicea.org/22/761ef6cd0c847f71e4ba6fe0f4629673"></script>`;

  /* 2. Top banner — mobile (320x50) */
  var AD_TOP_MOBILE = ``;

  /* 3. Bottom banner (300x250) */
  var AD_BOTTOM = ``;

  /* 4. Social Bar — page ke bottom wala code */
  var AD_SOCIAL_BAR = ``;

  /* ========================================================= */

  var SHOW_EMPTY = /[?&]adspreview\b/.test(window.location.search);

  var SIZES = {
    'ad-top-desktop': [728, 90],
    'ad-top-mobile': [320, 50],
    'ad-bottom': [300, 250]
  };

  function isVisible(el) {
    return !!el && window.getComputedStyle(el).display !== 'none';
  }

  /* Adtha ke banner code me document.write() hota hai. Page load hone ke
     baad wo seedha chalaya jaye to poora page blank ho jata hai. Isliye
     har banner apne alag frame (iframe) ke andar chalta hai — ad kuch bhi
     kare, hamara game safe rehta hai. atOptions bhi tab conflict nahi karta. */
  function frameDoc(code) {
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' +
      '<style>html,body{margin:0;padding:0;overflow:hidden;background:#fff}' +
      'iframe{border:0;display:block}</style></head><body>' + code + '</body></html>';
  }

  function place(id, code, label) {
    var box = document.getElementById(id);
    if (!box) return;

    if (!code.trim() || !isVisible(box)) {
      box.textContent = '';
      if (!code.trim() && SHOW_EMPTY) {
        box.textContent = label;
        box.classList.add('placeholder');
      } else {
        box.classList.add('empty');
      }
      return;
    }

    var size = SIZES[id] || [300, 250];
    var w = size[0];
    var h = size[1];

    var avail = box.clientWidth || w;
    var scale = Math.min(1, avail / w);

    var frame = document.createElement('iframe');
    frame.title = 'Advertisement';
    frame.width = String(w);
    frame.height = String(h);
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('frameborder', '0');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');
    frame.style.cssText = 'border:0;display:block;width:' + w + 'px;height:' + h + 'px;' +
      (scale < 1 ? 'transform:scale(' + scale + ');transform-origin:top left;' : '');
    frame.srcdoc = frameDoc(code);

    if (scale < 1) {
      box.style.width = Math.ceil(w * scale) + 'px';
      box.style.height = Math.ceil(h * scale) + 'px';
      box.style.margin = '0 auto 14px';
    }

    box.appendChild(frame);
  }

  function socialBar() {
    /* Social Bar khud page ke upar apna element banata hai, isliye wo
       seedha page me hi chalta hai. */
    if (!AD_SOCIAL_BAR.trim()) return;
    var holder = document.createElement('div');
    holder.innerHTML = AD_SOCIAL_BAR;
    var nodes = Array.prototype.slice.call(holder.childNodes);
    nodes.forEach(function (node) {
      if (node.nodeType !== 1) return;
      if (node.tagName !== 'SCRIPT') {
        holder.appendChild(node);
        return;
      }
      var s = document.createElement('script');
      for (var a = 0; a < node.attributes.length; a++) {
        s.setAttribute(node.attributes[a].name, node.attributes[a].value);
      }
      s.text = node.textContent || '';
      document.body.appendChild(s);
    });
  }

  function start() {
    place('ad-top-desktop', AD_TOP_DESKTOP, 'Ad space · 728×90');
    place('ad-top-mobile', AD_TOP_MOBILE, 'Ad space · 320×50');
    place('ad-bottom', AD_BOTTOM, 'Ad space · 300×250');
    socialBar();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
