/* 消消乐 · DaoBox 家族（v0.1.0） */
"use strict";

var APP_VERSION = "v0.1.0";
var SIZE = 8;
var TYPES = 6;
var FRUITS = ["🍉", "🍓", "🍇", "🍋", "🍑", "🍒"];
var STORE_KEY = "dbxxl-save";

var board = [];        // SIZE x SIZE 的水果编号（0..TYPES-1）
var score = 0;
var best = 0;
var selected = null;   // {r, c}
var busy = false;      // 动画/结算中，禁止输入
var locked = false;    // 时长超时锁定
var undoState = null;  // {board, score} 上一次成功交换前快照

function $(id) { return document.getElementById(id); }
function sleep(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
function idx(r, c) { return r * SIZE + c; }

/* ---------- 存档 ---------- */
function saveGame() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      board: board, score: score, best: best
    }));
  } catch (err) {}
}

function loadGame() {
  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (!raw) return false;
    var d = JSON.parse(raw);
    if (!d || !Array.isArray(d.board) || d.board.length !== SIZE) return false;
    for (var r = 0; r < SIZE; r++) {
      if (!Array.isArray(d.board[r]) || d.board[r].length !== SIZE) return false;
      for (var c = 0; c < SIZE; c++) {
        var v = d.board[r][c];
        if (!Number.isInteger(v) || v < 0 || v >= TYPES) return false;
      }
    }
    board = d.board.map(function (row) { return row.slice(); });
    score = d.score || 0;
    best = Math.max(d.best || 0, score);
    return true;
  } catch (err) { return false; }
}

/* ---------- 核心逻辑 ---------- */
function randomFruit() { return Math.floor(Math.random() * TYPES); }

function newBoard() {
  var b;
  do {
    b = [];
    for (var r = 0; r < SIZE; r++) {
      var row = [];
      for (var c = 0; c < SIZE; c++) row.push(randomFruit());
      b.push(row);
    }
  } while (findMatches(b).size > 0 || !hasAnyMove(b));
  return b;
}

// 返回 Set（idx(r,c)），包含所有 3 连及以上的格子
function findMatches(b) {
  var marked = new Set();
  var r, c, run, start;
  // 横向
  for (r = 0; r < SIZE; r++) {
    run = 1;
    for (c = 1; c <= SIZE; c++) {
      if (c < SIZE && b[r][c] === b[r][c - 1]) { run++; continue; }
      if (run >= 3) { for (var k = c - run; k < c; k++) marked.add(idx(r, k)); }
      run = 1;
    }
  }
  // 纵向
  for (c = 0; c < SIZE; c++) {
    run = 1;
    for (r = 1; r <= SIZE; r++) {
      if (r < SIZE && b[r][c] === b[r - 1][c]) { run++; continue; }
      if (run >= 3) { for (var k2 = r - run; k2 < r; k2++) marked.add(idx(k2, c)); }
      run = 1;
    }
  }
  return marked;
}

// 重力下落 + 顶部补位（原地修改）
function applyGravity(b) {
  var newCells = [];
  for (var c = 0; c < SIZE; c++) {
    var write = SIZE - 1;
    for (var r = SIZE - 1; r >= 0; r--) {
      if (b[r][c] >= 0) {
        if (write !== r) { b[write][c] = b[r][c]; b[r][c] = -1; newCells.push(idx(write, c)); }
        write--;
      }
    }
    for (var fill = write; fill >= 0; fill--) {
      b[fill][c] = randomFruit();
      newCells.push(idx(fill, c));
    }
  }
  return newCells;
}

// 是否存在任意一个可行交换
function hasAnyMove(b) {
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (c + 1 < SIZE) { swapIn(b, r, c, r, c + 1); var ok1 = findMatches(b).size > 0; swapIn(b, r, c, r, c + 1); if (ok1) return true; }
      if (r + 1 < SIZE) { swapIn(b, r, c, r + 1, c); var ok2 = findMatches(b).size > 0; swapIn(b, r, c, r + 1, c); if (ok2) return true; }
    }
  }
  return false;
}

function swapIn(b, r1, c1, r2, c2) {
  var t = b[r1][c1]; b[r1][c1] = b[r2][c2]; b[r2][c2] = t;
}

/* ---------- 渲染 ---------- */
function renderCells(opts) {
  opts = opts || {};
  var layer = $("cells");
  layer.innerHTML = "";
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      var el = document.createElement("div");
      el.className = "cell";
      el.dataset.r = r; el.dataset.c = c;
      el.textContent = FRUITS[board[r][c]];
      if (opts.clearSet && opts.clearSet.has(idx(r, c))) el.classList.add("clearing");
      if (opts.dropSet && opts.dropSet.indexOf(idx(r, c)) !== -1) el.classList.add("drop-in");
      if (opts.swapPair && ((opts.swapPair[0] === r && opts.swapPair[1] === c) || (opts.swapPair[2] === r && opts.swapPair[3] === c))) el.classList.add("swap-bump");
      if (opts.shakePair && ((opts.shakePair[0] === r && opts.shakePair[1] === c) || (opts.shakePair[2] === r && opts.shakePair[3] === c))) el.classList.add("shake");
      if (selected && selected.r === r && selected.c === c) el.classList.add("selected");
      layer.appendChild(el);
    }
  }
}

function renderSelection() {
  var cells = $("cells").children;
  for (var i = 0; i < cells.length; i++) {
    var el = cells[i];
    var isSel = selected && selected.r === +el.dataset.r && selected.c === +el.dataset.c;
    el.classList.toggle("selected", !!isSel);
  }
}

function updateHud() {
  $("score").textContent = score;
  $("best").textContent = best;
  $("btn-undo").disabled = !undoState || busy;
}

function floatText(text) {
  var layer = $("float-layer");
  var el = document.createElement("div");
  el.className = "float-text";
  el.textContent = text;
  layer.appendChild(el);
  setTimeout(function () { el.remove(); }, 1100);
}

var toastTimer = null;
function toast(msg) {
  var old = document.querySelector(".toast");
  if (old) old.remove();
  if (toastTimer) clearTimeout(toastTimer);
  var el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.body.appendChild(el);
  toastTimer = setTimeout(function () { el.remove(); }, 1800);
}

/* ---------- 交换与消除 ---------- */
function adjacent(a, b) {
  return Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;
}

async function trySwap(a, b) {
  if (busy || locked) return;
  busy = true;
  selected = null;
  updateHud();

  var snapshot = { board: board.map(function (row) { return row.slice(); }), score: score };
  swapIn(board, a.r, a.c, b.r, b.c);
  renderCells({ swapPair: [a.r, a.c, b.r, b.c] });
  await sleep(180);

  var matches = findMatches(board);
  if (matches.size === 0) {
    // 无消除，换回原位
    swapIn(board, a.r, a.c, b.r, b.c);
    renderCells({ shakePair: [a.r, a.c, b.r, b.c] });
    await sleep(320);
    busy = false;
    updateHud();
    return;
  }

  undoState = snapshot;
  await resolveMatches();
  saveGame();

  // 死局检测
  if (!hasAnyMove(board)) {
    await sleep(200);
    board = newBoard();
    renderCells({ dropSet: allIdx() });
    toast("没有可消除的组合，已自动洗牌");
    await sleep(260);
  }

  busy = false;
  updateHud();
}

function allIdx() {
  var list = [];
  for (var i = 0; i < SIZE * SIZE; i++) list.push(i);
  return list;
}

async function resolveMatches() {
  var combo = 0;
  var totalGained = 0;
  while (true) {
    var matches = findMatches(board);
    if (matches.size === 0) break;
    combo++;
    var gained = matches.size * 10 * combo;
    totalGained += gained;
    score += gained;
    if (score > best) best = score;
    updateHud();

    renderCells({ clearSet: matches });
    await sleep(280);

    matches.forEach(function (i) {
      var r = Math.floor(i / SIZE), c = i % SIZE;
      board[r][c] = -1;
    });
    var dropped = applyGravity(board);
    renderCells({ dropSet: dropped });
    await sleep(260);
  }
  if (combo > 1) {
    floatText("+" + totalGained + " · Combo x" + combo + "!");
  } else if (totalGained > 0) {
    floatText("+" + totalGained);
  }
}

function doUndo() {
  if (!undoState || busy || locked) return;
  board = undoState.board.map(function (row) { return row.slice(); });
  score = undoState.score;
  undoState = null;
  selected = null;
  renderCells();
  updateHud();
  saveGame();
}

function newGame() {
  if (busy) return;
  board = newBoard();
  score = 0;
  undoState = null;
  selected = null;
  renderCells();
  updateHud();
  saveGame();
}

/* ---------- 输入（点选 + 拖动） ---------- */
function cellFromPoint(x, y) {
  var layer = $("cells");
  var rect = layer.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return null;
  var cw = rect.width / SIZE, ch = rect.height / SIZE;
  var c = Math.floor((x - rect.left) / cw);
  var r = Math.floor((y - rect.top) / ch);
  if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return null;
  return { r: r, c: c };
}

function bindInput() {
  var boardEl = $("board");
  var startX = 0, startY = 0, startCell = null, tracking = false;

  boardEl.addEventListener("pointerdown", function (e) {
    if (busy || locked) return;
    var cell = cellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    startCell = cell;
    startX = e.clientX; startY = e.clientY;
    tracking = true;
  });

  boardEl.addEventListener("pointerup", function (e) {
    if (!tracking || busy || locked) return;
    tracking = false;
    var cell = cellFromPoint(e.clientX, e.clientY);
    var dx = e.clientX - startX, dy = e.clientY - startY;
    var dragged = Math.hypot(dx, dy) > 18 && cell && (cell.r !== startCell.r || cell.c !== startCell.c);

    if (dragged) {
      if (adjacent(startCell, cell)) { trySwap(startCell, cell); }
      selected = null;
      renderSelection();
      return;
    }

    // 点选逻辑
    if (selected && adjacent(selected, startCell)) {
      trySwap(selected, startCell);
      selected = null;
      return;
    }
    if (selected && selected.r === startCell.r && selected.c === startCell.c) {
      selected = null;
    } else {
      selected = startCell;
    }
    renderSelection();
  });

  // 防止拖动时触发系统手势
  boardEl.addEventListener("pointercancel", function () { tracking = false; });
}

/* ---------- 时长体系：portal.js 超时事件 ---------- */
function applyTimeLock() {
  locked = true;
  selected = null;
  renderSelection();
  $("time-lock").classList.remove("hidden");
}
window.addEventListener("daobox:timeexceeded", function () { applyTimeLock(); });
setTimeout(function () {
  try { if (window.DaoBox && window.DaoBox.timeExceeded) applyTimeLock(); } catch (err) {}
}, 1200);

/* ---------- 启动 ---------- */
function boot() {
  $("app-version").textContent = APP_VERSION;
  $("refresh-btn").addEventListener("click", function () {
    if ("caches" in window) {
      caches.keys().then(function (keys) {
        return Promise.all(keys.map(function (k) { return caches.delete(k); }));
      }).finally(function () { location.reload(); });
    } else { location.reload(); }
  });

  if (!loadGame()) {
    board = newBoard();
    score = 0;
    saveGame();
  }
  renderCells();
  updateHud();
  bindInput();

  $("btn-new").addEventListener("click", newGame);
  $("btn-undo").addEventListener("click", doUndo);
  $("lock-close").addEventListener("click", function () { $("time-lock").classList.add("hidden"); });
}
document.addEventListener("DOMContentLoaded", boot);

// 页面隐藏时保存
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") saveGame();
});
