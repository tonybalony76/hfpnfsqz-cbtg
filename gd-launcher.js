
(function () {
'use strict';

var BASE = 'https://cdn.jsdelivr.net/gh/Ale7208/geometry-dash-wasm/';
var MANIFEST = BASE + 'gd_assets.json';

var REPO = 'https://cdn.jsdelivr.net/gh/tonybalony76/hfpnfsqz-cbtg@main/';
var GAME = REPO + 'index.html';

var CACHE_NAME = 'gdwasm-assets';
var status = document.getElementById('gd-status');
var detail = document.getElementById('gd-detail');
var bar = document.getElementById('gd-bar');
var button = document.getElementById('gd-play');

var controller = new AbortController();
var stopped = false;
var finished = false;
var done = 0;
var total = 0;
var failed = 0;

function say(message, info) {
  if (status) status.textContent = message;
  if (detail) detail.textContent = info || '';
}

function update() {
  var percent = total ? Math.round(done / total * 100) : 0;

  if (bar) bar.style.width = percent + '%';

  say(
    finished ? 'Game files are ready!' :
    stopped ? 'Preloading paused.' :
    'Preloading game files…',
    done + ' of ' + total + ' files cached' +
    (failed ? ' · ' + failed + ' failed' : '')
  );
}

async function preload() {
  if (!('caches' in window)) {
    say('Ready to play.', 'Background caching is unavailable.');
    return;
  }

  try {
    var cache = await caches.open(CACHE_NAME);

    var response = await fetch(MANIFEST, {
      cache: 'no-cache',
      mode: 'cors',
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error('Manifest request failed: ' + response.status);
    }

    var manifest = await response.json();

    try {
      await cache.put(MANIFEST, response.clone());
    } catch (e) {}

    var entries = [
      manifest.loader,
      manifest.wasm
    ].concat(manifest.data.chunks || []);

    var urls = entries.map(function (entry) {
      return new URL(entry.url, BASE).href;
    });

    total = urls.length;

    var pending = [];

    for (var i = 0; i < urls.length; i++) {
      if (await cache.match(urls[i])) {
        done++;
      } else {
        pending.push(urls[i]);
      }
    }

    update();

    var cursor = 0;

    async function worker() {
      while (!stopped) {
        var index = cursor++;

        if (index >= pending.length) return;

        var url = pending[index];
        var success = false;

        for (var attempt = 0; attempt < 3 && !stopped; attempt++) {
          try {
            var asset = await fetch(url, {
              mode: 'cors',
              cache: 'force-cache',
              signal: controller.signal
            });

            if (!asset.ok) {
              throw new Error('HTTP ' + asset.status);
            }

            if (asset.type === 'opaque') {
              throw new Error('CDN access denied');
            }

            await cache.put(url, asset.clone());

            success = true;
            break;

          } catch (e) {
            if (stopped) return;

            await new Promise(function (resolve) {
              setTimeout(resolve, 350 * (attempt + 1));
            });
          }
        }

        if (success) done++;
        else failed++;

        update();
      }
    }

    var connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;

    var workers = connection &&
      typeof connection.downlink === 'number'
      ? (connection.downlink < 1.5 ? 2 :
         connection.downlink < 5 ? 4 : 6)
      : 6;

    var pool = [];

    for (var w = 0; w < Math.min(workers, pending.length); w++) {
      pool.push(worker());
    }

    await Promise.all(pool);

    if (!stopped) {
      finished = true;
      update();
    }

  } catch (e) {
    if (!stopped) {
      say(
        'Preloading could not finish.',
        'You can still launch. Missing files will download when needed.'
      );
    }
  }
}

function openGame() {
  var tab = window.open('about:blank', '_blank');

  if (!tab) {
    say('New tab blocked.', 'Allow pop-ups and try again.');
    return;
  }

  stopped = true;
  controller.abort();

  if (button) button.disabled = true;

  say('Opening Geometry Dash…', 'Loading game files.');

  fetch(GAME + '?launcher=1', {
    cache: 'no-cache',
    mode: 'cors'
  })
  .then(function (response) {
    if (!response.ok) {
      throw new Error('Game page failed: HTTP ' + response.status);
    }

    return response.text();
  })
  .then(function (source) {
    var baseTag = '<base href="' + REPO + '">';

    if (/<base\b/i.test(source)) {
      source = source.replace(/<base\b[^>]*>/i, baseTag);
    } else if (/<head[^>]*>/i.test(source)) {
      source = source.replace(/<head[^>]*>/i, function (head) {
        return head + baseTag;
      });
    } else {
      source = baseTag + source;
    }

    tab.document.open();
    tab.document.write(source);
    tab.document.close();

    say('Geometry Dash opened!', 'You can close this launcher.');
  })
  .catch(function (error) {
    try {
      tab.document.body.textContent =
        'Could not load Geometry Dash: ' + error.message;
    } catch (e) {}

    if (button) button.disabled = false;

    say('Could not open the game.', error.message);
  });
}

window.GDLauncher = {
  open: openGame,
  preload: preload
};

var connection =
  navigator.connection ||
  navigator.mozConnection ||
  navigator.webkitConnection;

if (
  connection &&
  (connection.saveData ||
   /^(slow-2g|2g)$/.test(connection.effectiveType || ''))
) {
  say('Ready to preload.', 'Automatic downloading is paused.');
} else {
  preload();
}

})();
