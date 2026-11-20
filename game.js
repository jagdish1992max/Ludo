/* Ludo — 2 to 4 players, one device.
   Plain JavaScript, no build step, no dependencies. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var CELL = 40;          // one board square = 40 units, board is 15 x 15 squares
  var FINISH = 56;        // 0..50 ring -> 51..55 home lane -> 56 home
  var COLORS = ['#e5484d', '#2fa84f', '#f0b429', '#3b82f6'];
  var NAMES = ['Red', 'Green', 'Yellow', 'Blue'];

  /* The 52 squares of the main track, in travel order, as [row, col].
     Index 0 is Red's starting square. */
  var TRACK = [
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    [0, 7],
    [0, 8], [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    [7, 14],
    [8, 14], [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    [14, 7],
    [14, 6], [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    [7, 0],
    [6, 0]
  ];

  var STARTS = [0, 13, 26, 39];
  var SAFE = new Set([0, 8, 13, 21, 26, 34, 39, 47]);
  var HOME_PATH = [
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
  ];
  var YARDS = [[0, 0], [0, 9], [9, 9], [9, 0]];
  var YARD_SLOTS = [[1.4, 1.4], [1.4, 3.6], [3.6, 1.4], [3.6, 3.6]];
  var FINISH_DIR = [[-1, 0], [0, -1], [1, 0], [0, 1]];
  var FACES = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };

  var svg = document.getElementById('board');
  var rollBtn = document.getElementById('roll');
  var diceEl = document.getElementById('dice');
  var statusEl = document.getElementById('status');
  var playersEl = document.getElementById('players');
  var overlay = document.getElementById('overlay');
  var rulesBox = document.getElementById('rules');
  var restartBtn = document.getElementById('restart');
  var rulesBtn = document.getElementById('rules-btn');

  var game = null;
  var tokenLayer = null;
  var busy = false;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function el(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    for (var k in attrs) {
      if (Object.prototype.hasOwnProperty.call(attrs, k)) node.setAttribute(k, attrs[k]);
    }
    return node;
  }

  function label(text, attrs) {
    var node = el('text', attrs);
    node.textContent = text;
    return node;
  }

  function cx(c) { return c * CELL + CELL / 2; }
  function cy(r) { return r * CELL + CELL / 2; }

  /* ---------------------------------------------------------------- board */

  function drawBoard() {
    svg.innerHTML = '';

    var g = el('g', {});
    svg.appendChild(g);

    g.appendChild(el('rect', { x: 0, y: 0, width: 600, height: 600, fill: '#ffffff' }));

    /* yards (6x6 corners) */
    YARDS.forEach(function (pos, p) {
      var x = pos[1] * CELL;
      var y = pos[0] * CELL;
      var s = 6 * CELL;
      g.appendChild(el('rect', { x: x + 3, y: y + 3, width: s - 6, height: s - 6, rx: 16, fill: COLORS[p] }));
      g.appendChild(el('rect', { x: x + 20, y: y + 20, width: s - 40, height: s - 40, rx: 10, fill: '#ffffff' }));
      YARD_SLOTS.forEach(function (slot) {
        g.appendChild(el('circle', {
          cx: (pos[1] + slot[1]) * CELL,
          cy: (pos[0] + slot[0]) * CELL,
          r: 15,
          fill: '#f7f9fc',
          stroke: COLORS[p],
          'stroke-width': 2.5,
          'stroke-dasharray': '4 4',
          opacity: 0.85
        }));
      });
    });

    /* main track */
    TRACK.forEach(function (cell, i) {
      var owner = STARTS.indexOf(i);
      var isStart = owner !== -1;
      var isSafe = SAFE.has(i);
      var fill = isStart ? COLORS[owner] : (isSafe ? '#eef1f6' : '#ffffff');

      g.appendChild(el('rect', {
        x: cell[1] * CELL, y: cell[0] * CELL, width: CELL, height: CELL,
        fill: fill, stroke: '#c9d2dd', 'stroke-width': 1
      }));

      if (isStart) {
        g.appendChild(label('★', {
          x: cx(cell[1]), y: cy(cell[0]) + 6, 'text-anchor': 'middle',
          'font-size': 17, fill: '#ffffff'
        }));
      } else if (isSafe) {
        g.appendChild(label('★', {
          x: cx(cell[1]), y: cy(cell[0]) + 6, 'text-anchor': 'middle',
          'font-size': 17, fill: '#9aa7b6'
        }));
      }
    });

    /* home lanes */
    HOME_PATH.forEach(function (lane, p) {
      lane.forEach(function (cell) {
        g.appendChild(el('rect', {
          x: cell[1] * CELL, y: cell[0] * CELL, width: CELL, height: CELL,
          fill: COLORS[p], stroke: '#ffffff', 'stroke-width': 1.5
        }));
      });
    });

    /* centre: four triangles */
    var tri = [
      [[240, 240], [240, 360], [300, 300]],
      [[240, 240], [360, 240], [300, 300]],
      [[360, 240], [360, 360], [300, 300]],
      [[240, 360], [360, 360], [300, 300]]
    ];
    tri.forEach(function (pts, p) {
      g.appendChild(el('polygon', {
        points: pts.map(function (q) { return q.join(','); }).join(' '),
        fill: COLORS[p], stroke: '#ffffff', 'stroke-width': 2
      }));
    });

    g.appendChild(el('rect', { x: 240, y: 240, width: 120, height: 120, fill: 'none', stroke: '#b9c4d1', 'stroke-width': 2 }));
    g.appendChild(el('rect', { x: 1.5, y: 1.5, width: 597, height: 597, rx: 4, fill: 'none', stroke: '#b9c4d1', 'stroke-width': 3 }));
  }

  /* --------------------------------------------------------------- tokens */

  function tokenPoint(tk) {
    var pos = tk.pos;

    if (pos < 0) {
      var yard = YARDS[tk.p];
      var slot = YARD_SLOTS[tk.t];
      return [(yard[1] + slot[1]) * CELL, (yard[0] + slot[0]) * CELL];
    }
    if (pos <= 50) {
      var cell = TRACK[(STARTS[tk.p] + pos) % 52];
      return [cx(cell[1]), cy(cell[0])];
    }
    if (pos <= 55) {
      var lane = HOME_PATH[tk.p][pos - 51];
      return [cx(lane[1]), cy(lane[0])];
    }
    var dir = FINISH_DIR[tk.p];
    return [300 + dir[0] * 42, 300 + dir[1] * 42];
  }

  function cellKey(tk) {
    if (tk.pos < 0) return 'y' + tk.p + tk.t;
    if (tk.pos > 50 && tk.pos < FINISH) return 'h' + tk.p + tk.pos;
    if (tk.pos === FINISH) return 'f' + tk.p;
    return 'r' + ((STARTS[tk.p] + tk.pos) % 52);
  }

  function buildTokens() {
    if (tokenLayer && tokenLayer.parentNode) tokenLayer.parentNode.removeChild(tokenLayer);
    tokenLayer = el('g', {});
    svg.appendChild(tokenLayer);

    game.tokens.forEach(function (tk) {
      var g = el('g', { 'class': 'tok' });

      g.appendChild(el('ellipse', { cx: 0, cy: 3, rx: 12.5, ry: 10, fill: 'rgba(15,23,42,0.22)' }));
      g.appendChild(el('circle', {
        cx: 0, cy: 0, r: 13.5, fill: COLORS[tk.p], stroke: '#ffffff',
        'stroke-width': 2.5, 'class': 'body'
      }));
      g.appendChild(el('path', {
        d: 'M -6.5 -3 A 8 8 0 0 1 5.5 -4.5',
        fill: 'none', stroke: 'rgba(255,255,255,0.8)', 'stroke-width': 2.2, 'stroke-linecap': 'round'
      }));

      g.addEventListener('click', function (ev) {
        ev.stopPropagation();
        onTokenClick(tk);
      });

      tk.grp = g;
      tokenLayer.appendChild(g);
    });

    updateTokens();
  }

  function updateTokens() {
    var groups = new Map();

    game.tokens.forEach(function (tk) {
      var key = cellKey(tk);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(tk);
    });

    groups.forEach(function (list, key) {
      var n = list.length;
      list.forEach(function (tk, i) {
        var point = tokenPoint(tk);
        var offset = n > 1 ? (i - (n - 1) / 2) * 10 : 0;
        var dx = offset;
        var dy = offset;
        if (key.charAt(0) === 'f') { dx = offset; dy = 0; }
        var scale = n > 1 ? 0.78 : 1;
        tk.grp.style.transform =
          'translate(' + (point[0] + dx) + 'px,' + (point[1] + dy) + 'px) scale(' + scale + ')';
      });
    });
  }

  function highlight(list) {
    game.tokens.forEach(function (tk) {
      tk.grp.classList.toggle('movable', list.indexOf(tk) !== -1);
    });
  }

  /* ------------------------------------------------------------ game rules */

  function legalMoves(p, value) {
    var moves = [];
    game.tokens.forEach(function (tk) {
      if (tk.p !== p || tk.pos === FINISH) return;
      if (tk.pos < 0) {
        if (value === 6) moves.push(tk);
        return;
      }
      if (tk.pos + value <= FINISH) moves.push(tk);
    });
    return moves;
  }

  function startGame(count) {
    var active = [];
    for (var i = 0; i < count; i++) active.push(i);

    game = {
      active: active,
      tokens: [],
      turn: 0,
      dice: 0,
      phase: 'roll',
      sixes: 0,
      over: false,
      moves: null
    };

    active.forEach(function (p) {
      for (var t = 0; t < 4; t++) game.tokens.push({ p: p, t: t, pos: -1, grp: null });
    });

    buildTokens();
    renderDice(0);
    renderPlayers();
    overlay.classList.add('hidden');
    statusEl.classList.remove('win');
    setStatus(NAMES[active[0]] + ' starts — roll the dice.');
    updateControls();
  }

  function renderDice(value) {
    diceEl.innerHTML = '';
    var on = FACES[value] || [];
    for (var i = 0; i < 9; i++) {
      var pip = document.createElement('span');
      pip.className = 'pip' + (on.indexOf(i) !== -1 ? ' on' : '');
      diceEl.appendChild(pip);
    }
  }

  function renderPlayers() {
    playersEl.innerHTML = '';
    if (!game) return;

    game.active.forEach(function (p, i) {
      var card = document.createElement('div');
      card.className = 'pcard' + (i === game.turn && !game.over ? ' active' : '');
      card.style.setProperty('--c', COLORS[p]);

      var dot = document.createElement('span');
      dot.className = 'dot';

      var name = document.createElement('span');
      name.className = 'pname';
      name.textContent = NAMES[p];

      var stat = document.createElement('span');
      stat.className = 'pstat';
      var home = 0;
      var out = 0;
      game.tokens.forEach(function (tk) {
        if (tk.p !== p) return;
        if (tk.pos === FINISH) home++;
        else if (tk.pos >= 0) out++;
      });
      stat.textContent = out + ' out · ' + home + '/4 home';

      card.appendChild(dot);
      card.appendChild(name);
      card.appendChild(stat);
      playersEl.appendChild(card);
    });
  }

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function updateControls() {
    rollBtn.disabled = !game || game.over || game.phase !== 'roll' || busy;
  }

  /* ------------------------------------------------------------- turn flow */

  async function roll() {
    if (busy || !game || game.over || game.phase !== 'roll') return;

    busy = true;
    updateControls();

    var p = game.active[game.turn];
    var value = 1 + Math.floor(Math.random() * 6);

    for (var i = 0; i < 8; i++) {
      renderDice(1 + Math.floor(Math.random() * 6));
      await sleep(50);
    }
    renderDice(value);
    diceEl.classList.remove('pop');
    void diceEl.offsetWidth;
    diceEl.classList.add('pop');

    game.dice = value;
    game.sixes = value === 6 ? game.sixes + 1 : 0;

    if (game.sixes === 3) {
      game.sixes = 0;
      setStatus(NAMES[p] + ' rolled three sixes — turn skipped!');
      await sleep(850);
      nextTurn();
      busy = false;
      updateControls();
      return;
    }

    var moves = legalMoves(p, value);

    if (moves.length === 0) {
      setStatus(NAMES[p] + ' rolled ' + value + ' — no move possible.');
      await sleep(800);
      nextTurn();
      busy = false;
      updateControls();
      return;
    }

    game.moves = moves;
    game.phase = 'move';
    setStatus(NAMES[p] + ' rolled ' + value + ' — tap a glowing token.');
    highlight(moves);
    renderPlayers();
    busy = false;
    updateControls();
  }

  function onTokenClick(tk) {
    if (busy || !game || game.over || game.phase !== 'move') return;
    if (!game.moves || game.moves.indexOf(tk) === -1) return;
    playMove(tk);
  }

  async function playMove(tk) {
    busy = true;
    game.phase = 'animating';
    game.moves = null;
    highlight([]);
    updateControls();

    var value = game.dice;
    var p = tk.p;

    if (tk.pos < 0) {
      tk.pos = 0;
      updateTokens();
      await sleep(180);
    } else {
      for (var step = 0; step < value; step++) {
        tk.pos += 1;
        updateTokens();
        await sleep(140);
      }
    }

    var captured = 0;
    if (tk.pos >= 0 && tk.pos <= 50) {
      var abs = (STARTS[p] + tk.pos) % 52;
      if (!SAFE.has(abs)) {
        game.tokens.forEach(function (other) {
          if (other.p === p || other.pos < 0 || other.pos > 50) return;
          if ((STARTS[other.p] + other.pos) % 52 === abs) {
            other.pos = -1;
            captured++;
          }
        });
        if (captured) {
          updateTokens();
          renderPlayers();
          await sleep(420);
        }
      }
    }

    renderPlayers();

    var allHome = game.tokens.every(function (t) { return t.p !== p || t.pos === FINISH; });
    if (allHome) {
      game.over = true;
      highlight([]);
      statusEl.classList.add('win');
      setStatus(NAMES[p] + ' wins! All four tokens are home. 🎉');
      renderPlayers();
      busy = false;
      updateControls();
      return;
    }

    if (captured || value === 6) {
      game.phase = 'roll';
      game.moves = null;
      setStatus(
        captured
          ? NAMES[p] + ' captured ' + captured + ' token' + (captured > 1 ? 's' : '') + ' — bonus roll!'
          : NAMES[p] + ' rolled a 6 — roll again!'
      );
      if (captured) game.sixes = 0;
      busy = false;
      updateControls();
      return;
    }

    nextTurn();
    busy = false;
    updateControls();
  }

  function nextTurn() {
    game.phase = 'roll';
    game.moves = null;
    game.dice = 0;
    game.sixes = 0;
    game.turn = (game.turn + 1) % game.active.length;
    highlight([]);
    renderPlayers();
    renderDice(0);
    setStatus(NAMES[game.active[game.turn]] + '\'s turn — roll the dice.');
    updateControls();
  }

  /* ----------------------------------------------------------------- wiring */

  rollBtn.addEventListener('click', roll);

  document.addEventListener('keydown', function (ev) {
    if (ev.code !== 'Space' && ev.code !== 'Enter') return;
    if (!overlay.classList.contains('hidden')) return;
    /* let the browser turn Space/Enter into a click when the button has focus */
    if (ev.target === rollBtn) return;
    ev.preventDefault();
    roll();
  });

  overlay.addEventListener('click', function (ev) {
    var btn = ev.target.closest ? ev.target.closest('button[data-count]') : null;
    if (!btn) return;
    startGame(parseInt(btn.getAttribute('data-count'), 10));
  });

  restartBtn.addEventListener('click', function () {
    overlay.classList.remove('hidden');
    setStatus('Pick how many players are playing.');
  });

  rulesBtn.addEventListener('click', function () { rulesBox.classList.remove('hidden'); });
  rulesBox.addEventListener('click', function (ev) {
    if (ev.target === rulesBox || ev.target.id === 'rules-close') rulesBox.classList.add('hidden');
  });

  drawBoard();
  renderDice(0);
})();
