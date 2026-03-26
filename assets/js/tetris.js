(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var trigger = document.getElementById("tetris-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", function (e) {
      e.preventDefault();
      launchTetris();
    });
  });

  function launchTetris() {
    var profileDiv = document.querySelector(".profile");
    var profileImg = profileDiv.querySelector("img");
    var figure = profileDiv.querySelector("figure");
    if (!profileDiv || !profileImg) return;

    // Capture the image source and dimensions before replacing
    var imgSrc = profileImg.currentSrc || profileImg.src;
    var imgRect = profileImg.getBoundingClientRect();
    var imgW = imgRect.width;
    var imgH = imgRect.height;

    // Load the profile image into an offscreen Image for drawing
    var texImg = new Image();
    texImg.crossOrigin = "anonymous";
    texImg.src = imgSrc;

    // Board dimensions — use the profile image aspect ratio
    // Standard tetris is 10 cols. Compute rows to match aspect ratio.
    var COLS = 10;
    var BLOCK = Math.floor(imgW / COLS);
    var ROWS = Math.floor(imgH / BLOCK);
    if (ROWS < 10) ROWS = 10;
    // Recalculate block size to fit exactly
    BLOCK = Math.min(Math.floor(imgW / COLS), Math.floor(imgH / ROWS));
    var canvasW = COLS * BLOCK;
    var canvasH = ROWS * BLOCK;

    // Inject styles
    var style = document.createElement("style");
    style.textContent =
      "#tetris-wrapper { position: relative; display: inline-block; }" +
      "#tetris-wrapper * { box-sizing: border-box; }" +
      "#tetris-canvas {" +
      "  display: block; background: #111;" +
      "  border-radius: 0.375rem;" +
      "}" +
      "#tetris-hud {" +
      "  font-family: monospace; font-size: 12px; margin-top: 6px;" +
      "  display: flex; justify-content: space-between; align-items: center;" +
      "}" +
      "html[data-theme='dark'] #tetris-hud { color: #ccc; }" +
      "html[data-theme='light'] #tetris-hud { color: #333; }" +
      "#tetris-hud span { min-width: 60px; }" +
      "#tetris-close-btn {" +
      "  background: none; border: 1px solid #888; font-family: monospace;" +
      "  font-size: 11px; cursor: pointer; padding: 1px 8px; border-radius: 3px;" +
      "}" +
      "html[data-theme='dark'] #tetris-close-btn { color: #ccc; }" +
      "html[data-theme='light'] #tetris-close-btn { color: #333; }" +
      "#tetris-close-btn:hover { background: rgba(128,128,128,0.2); }" +
      "#tetris-controls {" +
      "  display: none; margin-top: 8px; gap: 6px;" +
      "  flex-wrap: wrap; justify-content: center;" +
      "}" +
      "@media (pointer: coarse), (max-width: 768px) {" +
      "  #tetris-controls { display: flex; }" +
      "}" +
      ".tetris-btn {" +
      "  width: 52px; height: 44px; font-size: 18px; border: 1px solid #666;" +
      "  background: rgba(30,30,30,0.8); color: #fff; border-radius: 6px;" +
      "  cursor: pointer; touch-action: manipulation; user-select: none;" +
      "  -webkit-user-select: none;" +
      "  display: flex; align-items: center; justify-content: center;" +
      "}" +
      ".tetris-btn:active { background: rgba(80,80,80,0.8); }" +
      "#tetris-btn-drop { width: 114px; }" +
      "#tetris-game-over {" +
      "  position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);" +
      "  color: #fff; font-family: monospace; font-size: 18px; text-align: center;" +
      "  display: none; background: rgba(0,0,0,0.75); padding: 16px; border-radius: 8px;" +
      "  z-index: 10;" +
      "}" +
      "#tetris-game-over button {" +
      "  margin-top: 10px; font-family: monospace; font-size: 14px;" +
      "  padding: 4px 16px; cursor: pointer; background: #222; color: #fff;" +
      "  border: 1px solid #666; border-radius: 4px;" +
      "}" +
      "#tetris-game-over button:hover { background: #444; }";
    document.head.appendChild(style);

    // Build the tetris wrapper to replace the figure
    var wrapper = document.createElement("div");
    wrapper.id = "tetris-wrapper";
    wrapper.innerHTML =
      '<canvas id="tetris-canvas" width="' + canvasW + '" height="' + canvasH + '"></canvas>' +
      '<div id="tetris-game-over">' +
      "  GAME OVER<br>" +
      '  <span id="tetris-final-score"></span><br>' +
      '  <button id="tetris-restart">Play Again</button>' +
      "</div>" +
      '<div id="tetris-hud">' +
      '  <span id="tetris-score">Score: 0</span>' +
      '  <span id="tetris-level">Lvl: 1</span>' +
      '  <button id="tetris-close-btn">&#x2715; Close</button>' +
      "</div>" +
      '<div id="tetris-controls">' +
      '  <button class="tetris-btn" id="tetris-btn-left">&larr;</button>' +
      '  <button class="tetris-btn" id="tetris-btn-rotate">&#x21bb;</button>' +
      '  <button class="tetris-btn" id="tetris-btn-right">&rarr;</button>' +
      '  <button class="tetris-btn" id="tetris-btn-down">&darr;</button>' +
      '  <button class="tetris-btn" id="tetris-btn-drop">Drop</button>' +
      "</div>";

    // Replace the figure with the game
    var moreInfo = profileDiv.querySelector(".more-info");
    if (figure) {
      figure.replaceWith(wrapper);
    } else {
      profileImg.replaceWith(wrapper);
    }

    var canvas = document.getElementById("tetris-canvas");
    canvas.style.width = imgW + "px";
    canvas.style.height = (ROWS * BLOCK * imgW / canvasW) + "px";
    var ctx = canvas.getContext("2d");

    // Prepare an offscreen canvas with the profile image scaled to board size
    var texCanvas = document.createElement("canvas");
    texCanvas.width = canvasW;
    texCanvas.height = canvasH;
    var texCtx = texCanvas.getContext("2d");

    function drawTextureWhenReady() {
      // Draw image covering the full board area, cropping to fit
      var iw = texImg.naturalWidth;
      var ih = texImg.naturalHeight;
      var srcAspect = iw / ih;
      var dstAspect = canvasW / canvasH;
      var sx, sy, sw, sh;
      if (srcAspect > dstAspect) {
        // Image is wider — crop sides
        sh = ih;
        sw = ih * dstAspect;
        sx = (iw - sw) / 2;
        sy = 0;
      } else {
        // Image is taller — crop top/bottom
        sw = iw;
        sh = iw / dstAspect;
        sx = 0;
        sy = (ih - sh) / 2;
      }
      texCtx.drawImage(texImg, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
    }

    if (texImg.complete) {
      drawTextureWhenReady();
    } else {
      texImg.onload = drawTextureWhenReady;
    }

    // Tetromino definitions
    var PIECES = [
      { shape: [[1, 1, 1, 1]] },           // I
      { shape: [[1, 0, 0], [1, 1, 1]] },   // J
      { shape: [[0, 0, 1], [1, 1, 1]] },   // L
      { shape: [[1, 1], [1, 1]] },          // O
      { shape: [[0, 1, 1], [1, 1, 0]] },   // S
      { shape: [[0, 1, 0], [1, 1, 1]] },   // T
      { shape: [[1, 1, 0], [0, 1, 1]] },   // Z
    ];

    var board = [];
    var score = 0;
    var level = 1;
    var linesCleared = 0;
    var currentPiece, currentX, currentY;
    var gameOver = false;
    var dropInterval;
    var animFrame;

    function initBoard() {
      board = [];
      for (var r = 0; r < ROWS; r++) {
        board.push(new Array(COLS).fill(0));
      }
    }

    function spawnPiece() {
      var idx = Math.floor(Math.random() * PIECES.length);
      currentPiece = PIECES[idx].shape.map(function (row) {
        return row.slice();
      });
      currentX = Math.floor((COLS - currentPiece[0].length) / 2);
      currentY = 0;
      if (collides(currentPiece, currentX, currentY)) {
        gameOver = true;
      }
    }

    function collides(piece, px, py) {
      for (var r = 0; r < piece.length; r++) {
        for (var c = 0; c < piece[r].length; c++) {
          if (!piece[r][c]) continue;
          var nx = px + c;
          var ny = py + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function lock() {
      for (var r = 0; r < currentPiece.length; r++) {
        for (var c = 0; c < currentPiece[r].length; c++) {
          if (!currentPiece[r][c]) continue;
          var ny = currentY + r;
          var nx = currentX + c;
          if (ny < 0) {
            gameOver = true;
            return;
          }
          board[ny][nx] = 1;
        }
      }
      clearLines();
      spawnPiece();
    }

    function clearLines() {
      var cleared = 0;
      for (var r = ROWS - 1; r >= 0; r--) {
        if (board[r].every(function (v) { return v; })) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared > 0) {
        var points = [0, 100, 300, 500, 800];
        score += (points[cleared] || 800) * level;
        linesCleared += cleared;
        level = Math.floor(linesCleared / 10) + 1;
        updateHUD();
        resetDropInterval();
      }
    }

    function rotate(piece) {
      var rows = piece.length;
      var cols = piece[0].length;
      var rotated = [];
      for (var c = 0; c < cols; c++) {
        var newRow = [];
        for (var r = rows - 1; r >= 0; r--) {
          newRow.push(piece[r][c]);
        }
        rotated.push(newRow);
      }
      return rotated;
    }

    function moveLeft() {
      if (!collides(currentPiece, currentX - 1, currentY)) currentX--;
    }
    function moveRight() {
      if (!collides(currentPiece, currentX + 1, currentY)) currentX++;
    }
    function moveDown() {
      if (!collides(currentPiece, currentX, currentY + 1)) {
        currentY++;
        return true;
      }
      return false;
    }
    function rotatePiece() {
      var rotated = rotate(currentPiece);
      var offsets = [0, -1, 1, -2, 2];
      for (var i = 0; i < offsets.length; i++) {
        if (!collides(rotated, currentX + offsets[i], currentY)) {
          currentPiece = rotated;
          currentX += offsets[i];
          return;
        }
      }
    }
    function hardDrop() {
      while (!collides(currentPiece, currentX, currentY + 1)) {
        currentY++;
        score += 2;
      }
      updateHUD();
      lock();
    }

    function getGhostY() {
      var gy = currentY;
      while (!collides(currentPiece, currentX, gy + 1)) gy++;
      return gy;
    }

    // Draw a block that shows the corresponding slice of the profile image
    function drawImgBlock(x, y, alpha) {
      if (y < 0) return;
      var px = x * BLOCK;
      var py = y * BLOCK;
      var prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha;
      // Draw the slice of the texture that maps to this board position
      ctx.drawImage(texCanvas, px, py, BLOCK, BLOCK, px + 1, py + 1, BLOCK - 2, BLOCK - 2);
      // Subtle edge highlight so blocks are distinguishable
      ctx.strokeStyle = "rgba(255,255,255,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, BLOCK - 1, BLOCK - 1);
      ctx.globalAlpha = prevAlpha;
    }

    function draw() {
      // Clear to dark background
      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvasW, canvasH);

      // Faint grid
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 0.5;
      for (var c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * BLOCK, 0);
        ctx.lineTo(c * BLOCK, canvasH);
        ctx.stroke();
      }
      for (var r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * BLOCK);
        ctx.lineTo(canvasW, r * BLOCK);
        ctx.stroke();
      }

      // Draw locked blocks — each shows the slice of the profile image at its position
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (board[r][c]) {
            drawImgBlock(c, r, 1.0);
          }
        }
      }

      if (!gameOver && currentPiece) {
        // Ghost piece
        var ghostY = getGhostY();
        for (var r = 0; r < currentPiece.length; r++) {
          for (var c = 0; c < currentPiece[r].length; c++) {
            if (currentPiece[r][c]) {
              drawImgBlock(currentX + c, ghostY + r, 0.25);
            }
          }
        }

        // Current piece
        for (var r = 0; r < currentPiece.length; r++) {
          for (var c = 0; c < currentPiece[r].length; c++) {
            if (currentPiece[r][c]) {
              drawImgBlock(currentX + c, currentY + r, 1.0);
            }
          }
        }
      }
    }

    function updateHUD() {
      var scoreEl = document.getElementById("tetris-score");
      var levelEl = document.getElementById("tetris-level");
      if (scoreEl) scoreEl.textContent = "Score: " + score;
      if (levelEl) levelEl.textContent = "Lvl: " + level;
    }

    function getDropDelay() {
      return Math.max(100, 800 - (level - 1) * 70);
    }

    function resetDropInterval() {
      clearInterval(dropInterval);
      dropInterval = setInterval(tick, getDropDelay());
    }

    function tick() {
      if (gameOver) {
        showGameOver();
        return;
      }
      if (!moveDown()) {
        lock();
        if (gameOver) showGameOver();
      }
    }

    function showGameOver() {
      clearInterval(dropInterval);
      var goEl = document.getElementById("tetris-game-over");
      document.getElementById("tetris-final-score").textContent = "Score: " + score;
      goEl.style.display = "block";
    }

    function gameLoop() {
      draw();
      animFrame = requestAnimationFrame(gameLoop);
    }

    function startGame() {
      gameOver = false;
      score = 0;
      level = 1;
      linesCleared = 0;
      updateHUD();
      document.getElementById("tetris-game-over").style.display = "none";
      initBoard();
      spawnPiece();
      resetDropInterval();
      gameLoop();
    }

    function cleanup() {
      clearInterval(dropInterval);
      cancelAnimationFrame(animFrame);
      document.removeEventListener("keydown", onKey);
      // Restore the original figure
      wrapper.replaceWith(figure || profileImg);
      style.remove();
    }

    // Keyboard controls
    function onKey(e) {
      if (gameOver) return;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
          e.preventDefault();
          moveLeft();
          break;
        case "ArrowRight":
        case "d":
          e.preventDefault();
          moveRight();
          break;
        case "ArrowDown":
        case "s":
          e.preventDefault();
          if (moveDown()) score += 1;
          updateHUD();
          break;
        case "ArrowUp":
        case "w":
          e.preventDefault();
          rotatePiece();
          break;
        case " ":
          e.preventDefault();
          hardDrop();
          break;
        case "Escape":
          cleanup();
          break;
      }
    }
    document.addEventListener("keydown", onKey);

    // Close button
    document.getElementById("tetris-close-btn").addEventListener("click", cleanup);

    // Restart button
    document.getElementById("tetris-restart").addEventListener("click", function () {
      cancelAnimationFrame(animFrame);
      startGame();
    });

    // Touch button controls
    function bindBtn(id, fn) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("touchstart", function (e) {
        e.preventDefault();
        if (!gameOver) fn();
      });
      el.addEventListener("mousedown", function (e) {
        e.preventDefault();
        if (!gameOver) fn();
      });
    }
    bindBtn("tetris-btn-left", moveLeft);
    bindBtn("tetris-btn-right", moveRight);
    bindBtn("tetris-btn-down", function () {
      if (moveDown()) {
        score += 1;
        updateHUD();
      }
    });
    bindBtn("tetris-btn-rotate", rotatePiece);
    bindBtn("tetris-btn-drop", hardDrop);

    // Swipe gestures on canvas
    var touchStartX = null;
    var touchStartY = null;
    var touchStartTime = null;
    canvas.addEventListener("touchstart", function (e) {
      if (gameOver) return;
      var touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      e.preventDefault();
    });
    canvas.addEventListener("touchend", function (e) {
      if (gameOver || touchStartX === null) return;
      var touch = e.changedTouches[0];
      var dx = touch.clientX - touchStartX;
      var dy = touch.clientY - touchStartY;
      var dt = Date.now() - touchStartTime;
      touchStartX = null;
      touchStartY = null;

      if (dt > 300) return;

      var absDx = Math.abs(dx);
      var absDy = Math.abs(dy);
      var threshold = 30;

      if (absDx < threshold && absDy < threshold) {
        rotatePiece();
      } else if (absDx > absDy) {
        if (dx > 0) moveRight();
        else moveLeft();
      } else {
        if (dy > 0) hardDrop();
        else rotatePiece();
      }
      e.preventDefault();
    });

    startGame();
  }
})();
