const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlay-title");
const overlayCopy = document.querySelector("#overlay-copy");
const startButton = document.querySelector("#start-button");
const coinCount = document.querySelector("#coin-count");
const coinTotal = document.querySelector("#coin-total");
const gameMessage = document.querySelector("#game-message");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const WORLD_WIDTH = 2800;
const GROUND_Y = 460;
const GRAVITY = 1800;
const MOVE_SPEED = 300;
const JUMP_SPEED = 700;

const platforms = [
    { x: 340, y: 380, width: 150, height: 18 },
    { x: 610, y: 320, width: 150, height: 18 },
    { x: 870, y: 390, width: 180, height: 18 },
    { x: 1190, y: 350, width: 150, height: 18 },
    { x: 1480, y: 300, width: 180, height: 18 },
    { x: 1780, y: 380, width: 170, height: 18 },
    { x: 2070, y: 330, width: 190, height: 18 },
    { x: 2370, y: 380, width: 150, height: 18 },
];

const hazards = [
    { x: 520, y: GROUND_Y - 28, width: 48, height: 28 },
    { x: 790, y: GROUND_Y - 28, width: 56, height: 28 },
    { x: 1080, y: GROUND_Y - 28, width: 56, height: 28 },
    { x: 1390, y: GROUND_Y - 28, width: 56, height: 28 },
    { x: 1700, y: GROUND_Y - 28, width: 56, height: 28 },
    { x: 2010, y: GROUND_Y - 28, width: 56, height: 28 },
    { x: 2310, y: GROUND_Y - 28, width: 56, height: 28 },
];

const coinPositions = [
    [385, 340], [455, 340], [655, 280], [715, 280], [920, 350],
    [990, 350], [1235, 310], [1300, 310], [1535, 260], [1605, 260],
    [1830, 340], [1900, 340], [2130, 290], [2200, 290], [2420, 340],
    [2500, 420],
];

const goal = { x: 2690, y: GROUND_Y - 96, width: 34, height: 96 };
const input = { left: false, right: false, jump: false };
const player = { x: 60, y: GROUND_Y - 46, width: 32, height: 46, velocityY: 0, grounded: false };

let coins = [];
let collected = 0;
let cameraX = 0;
let state = "title";
let previousTime = 0;

function resetGame() {
    player.x = 60;
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    player.grounded = false;
    cameraX = 0;
    collected = 0;
    coins = coinPositions.map(([x, y]) => ({ x, y, collected: false }));
    updateHud();
}

function updateHud() {
    coinCount.textContent = String(collected);
    coinTotal.textContent = String(coins.length);
}

function startGame() {
    resetGame();
    state = "playing";
    overlay.classList.add("is-hidden");
    gameMessage.textContent = "ゴールを目指そう！";
}

function finishGame(won) {
    state = won ? "won" : "lost";
    overlayTitle.textContent = won ? "ゴール！" : "トゲにぶつかった！";
    overlayCopy.textContent = won
        ? `おめでとう！コインを ${collected} 枚集めたよ。`
        : "もう一度挑戦して、ゴールを目指そう。";
    startButton.textContent = won ? "もう一度遊ぶ" : "リトライ";
    overlay.classList.remove("is-hidden");
}

function overlaps(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x
        && a.y < b.y + b.height && a.y + a.height > b.y;
}

function update(delta) {
    if (state !== "playing") return;

    const direction = Number(input.right) - Number(input.left);
    player.x = Math.max(0, Math.min(WORLD_WIDTH - player.width, player.x + direction * MOVE_SPEED * delta));

    if (input.jump && player.grounded) {
        player.velocityY = -JUMP_SPEED;
        player.grounded = false;
    }

    const previousBottom = player.y + player.height;
    player.velocityY += GRAVITY * delta;
    player.y += player.velocityY * delta;
    player.grounded = false;

    if (player.y + player.height >= GROUND_Y) {
        player.y = GROUND_Y - player.height;
        player.velocityY = 0;
        player.grounded = true;
    }

    if (player.velocityY >= 0) {
        for (const platform of platforms) {
            const crossedTop = previousBottom <= platform.y && player.y + player.height >= platform.y;
            const overlapsPlatform = player.x + player.width > platform.x && player.x < platform.x + platform.width;
            if (crossedTop && overlapsPlatform) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.grounded = true;
            }
        }
    }

    for (const hazard of hazards) {
        if (overlaps(player, hazard)) {
            finishGame(false);
            return;
        }
    }

    for (const coin of coins) {
        if (!coin.collected && overlaps(player, { x: coin.x - 12, y: coin.y - 12, width: 24, height: 24 })) {
            coin.collected = true;
            collected += 1;
            updateHud();
        }
    }

    if (overlaps(player, goal)) {
        finishGame(true);
        return;
    }

    cameraX = Math.max(0, Math.min(WORLD_WIDTH - WIDTH, player.x - WIDTH * 0.35));
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#75c9f0");
    sky.addColorStop(1, "#d0f3ff");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#ffffff99";
    for (let i = 0; i < 7; i += 1) {
        const x = ((i * 190 - cameraX * 0.22) % (WIDTH + 180) + WIDTH + 180) % (WIDTH + 180) - 90;
        const y = 70 + (i % 3) * 55;
        ctx.beginPath();
        ctx.ellipse(x, y, 42, 14, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 24, y - 9, 28, 19, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 49, y, 34, 13, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = "#84cfa4";
    for (let i = 0; i < 8; i += 1) {
        const x = ((i * 180 - cameraX * 0.42) % (WIDTH + 180) + WIDTH + 180) % (WIDTH + 180) - 90;
        ctx.beginPath();
        ctx.arc(x, GROUND_Y + 45, 100, Math.PI, 0);
        ctx.fill();
    }
}

function drawWorld() {
    ctx.save();
    ctx.translate(-cameraX, 0);

    ctx.fillStyle = "#4c9a69";
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, HEIGHT - GROUND_Y);
    ctx.fillStyle = "#75c978";
    ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 12);
    ctx.fillStyle = "#a8e8a1";
    for (let x = 0; x < WORLD_WIDTH; x += 44) {
        ctx.fillRect(x, GROUND_Y + 25 + (x % 3) * 5, 18, 5);
    }

    for (const platform of platforms) {
        ctx.fillStyle = "#754c35";
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        ctx.fillStyle = "#75c978";
        ctx.fillRect(platform.x, platform.y, platform.width, 7);
    }

    for (const hazard of hazards) {
        ctx.fillStyle = "#e94f69";
        const spikes = Math.floor(hazard.width / 16);
        for (let i = 0; i < spikes; i += 1) {
            const x = hazard.x + i * 16;
            ctx.beginPath();
            ctx.moveTo(x, hazard.y + hazard.height);
            ctx.lineTo(x + 8, hazard.y);
            ctx.lineTo(x + 16, hazard.y + hazard.height);
            ctx.fill();
        }
    }

    for (const coin of coins) {
        if (coin.collected) continue;
        ctx.fillStyle = "#ffd84d";
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff4a8";
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    ctx.fillStyle = "#f4f7ff";
    ctx.fillRect(goal.x, goal.y, 6, goal.height);
    ctx.fillStyle = "#ff6d6d";
    ctx.beginPath();
    ctx.moveTo(goal.x + 6, goal.y + 3);
    ctx.lineTo(goal.x + 48, goal.y + 18);
    ctx.lineTo(goal.x + 6, goal.y + 34);
    ctx.fill();

    ctx.fillStyle = "#f28c55";
    ctx.fillRect(player.x, player.y, player.width, player.height);
    ctx.fillStyle = "#26344f";
    ctx.fillRect(player.x + 20, player.y + 11, 5, 5);
    ctx.fillStyle = "#ffe0bd";
    ctx.fillRect(player.x + 4, player.y + 6, 22, 12);
    ctx.fillStyle = "#26344f";
    ctx.fillRect(player.x + 20, player.y + 10, 4, 5);
    ctx.fillStyle = "#74453c";
    ctx.fillRect(player.x + 3, player.y + player.height - 5, 12, 5);
    ctx.fillRect(player.x + 18, player.y + player.height - 5, 12, 5);

    ctx.restore();
}

function draw() {
    drawBackground();
    drawWorld();
}

function frame(time) {
    const delta = Math.min((time - previousTime) / 1000 || 0, 1 / 30);
    previousTime = time;
    update(delta);
    draw();
    requestAnimationFrame(frame);
}

function setControl(control, pressed, button) {
    input[control] = pressed;
    if (button) button.classList.toggle("is-pressed", pressed);
}

const keyControls = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "jump",
    Space: "jump",
    KeyW: "jump",
};

window.addEventListener("keydown", (event) => {
    const control = keyControls[event.code];
    if (!control) return;
    event.preventDefault();
    input[control] = true;
});

window.addEventListener("keyup", (event) => {
    const control = keyControls[event.code];
    if (control) input[control] = false;
});

window.addEventListener("blur", () => {
    input.left = false;
    input.right = false;
    input.jump = false;
});

document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        button.setPointerCapture(event.pointerId);
        setControl(control, true, button);
    });
    const release = () => setControl(control, false, button);
    button.addEventListener("pointerup", release);
    button.addEventListener("pointercancel", release);
    button.addEventListener("lostpointercapture", release);
});

startButton.addEventListener("click", startGame);

coinTotal.textContent = String(coinPositions.length);
resetGame();
requestAnimationFrame(frame);
