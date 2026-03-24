document.addEventListener('DOMContentLoaded', () => {
    const screen = document.getElementById('doom-screen');
    const startBtn = document.getElementById('doom-start');
    if (!screen || !startBtn) return;

    // --- GAME ENGINE (ASCII Raycaster) ---
    const screenWidth = 80;
    const screenHeight = 35;
    const FOV = Math.PI / 3;
    const depth = 16.0;

    const mapWidth = 16;
    const mapHeight = 16;
    let mapArray = new Array(mapWidth * mapHeight).fill('#');
    
    // Generazione Labirinto (Recursive Backtracker scavando corridoi partendo da 1,1)
    function carveMaze(x, y) {
        mapArray[y * mapWidth + x] = ' ';
        let dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        // Mischia direzioni
        for (let i = dirs.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
        }
        
        for (let [dx, dy] of dirs) {
            let nx = x + dx * 2;
            let ny = y + dy * 2;
            if (nx > 0 && nx < mapWidth - 1 && ny > 0 && ny < mapHeight - 1 && mapArray[ny * mapWidth + nx] === '#') {
                mapArray[(y + dy) * mapWidth + (x + dx)] = ' ';
                carveMaze(nx, ny);
            }
        }
    }
    carveMaze(1, 1);
    
    // Assicura l'area di base da cui parte il player
    mapArray[1 * mapWidth + 1] = ' ';
    mapArray[1 * mapWidth + 2] = ' ';
    mapArray[2 * mapWidth + 1] = ' ';
    mapArray[2 * mapWidth + 2] = ' ';
    
    let playerX = 1.5;
    let playerY = 1.5;
    let playerA = Math.PI / 4; // Guarda in diagonale verso il centro del labirinto

    // Piazziamo 6 teschi in spazi vuoti lontani dal punto d'inizio
    let emptySpaces = [];
    for (let y = 1; y < mapHeight - 1; y++) {
        for (let x = 1; x < mapWidth - 1; x++) {
            if (mapArray[y * mapWidth + x] === ' ' && (x > 4 || y > 4)) {
                emptySpaces.push({x: x + 0.5, y: y + 0.5});
            }
        }
    }
    // Shuffle empty spaces
    for (let i = emptySpaces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [emptySpaces[i], emptySpaces[j]] = [emptySpaces[j], emptySpaces[i]];
    }
    
    let sprites = [];
    for (let i = 0; i < Math.min(6, emptySpaces.length); i++) {
        sprites.push({ x: emptySpaces[i].x, y: emptySpaces[i].y, active: true });
    }
    
    const map = mapArray.join('');

    let projectiles = [];

    const skullSprite = [
        `                       uuuuuuuuuuuuuuuuuuuuu.           `,
        `                   .u$$$$$$$$$$$$$$$$$$$$$$$$$$W.       `,
        `                 u$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$Wu.  `,
        `               $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$i`,
        `              $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `         \`    $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `           .i$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$i`,
        `           $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$W`,
        `          .$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$W`,
        `         .$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$i`,
        `         #$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$.`,
        `         W$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `$u       #$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$~`,
        `$#      \`"$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `$i        $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `$$        #$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `$$         $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `#$.        $$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$#`,
        ` $$      $iW$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$!`,
        ` $$i      $$$$$$$#"" \`"""#$$$$$$$$$$$$$$$$$#""""""#$$$$$$$$$$$$$$$W`,
        ` #$$W    \`$$$#"            "       !$$$$$\`           \`"#$$$$$$$$$$#`,
        `  $$$     \`\`                 ! !iuW$$$$$                 #$$$$$$$#`,
        `  #$$    $u                  $   $$$$$$$                  $$$$$$$~`,
        `   "#    #$$i.               #   $$$$$$$.                 \`$$$$$$`,
        `          $$$$$i.                """#$$$$i.               .$$$$#`,
        `          $$$$$$$$!         .   \`    $$$$$$$$$i           $$$$$`,
        `          \`$$$$$  $iWW   .uW\`        #$$$$$$$$$W.       .$$$$$$#`,
        `            "#$$$$$$$$$$$$#\`          $$$$$$$$$$$iWiuuuW$$$$$$$$W`,
        `               !#""    ""             \`$$$$$$$##$$$$$$$$$$$$$$$$`,
        `          i$$$$    .                   !$$$$$$ .$$$$$$$$$$$$$$$#`,
        `         $$$$$$$$$$\`                    $$$$$$$$$Wi$$$$$$#"#$$\``,
        `         #$$$$$$$$$W.                   $$$$$$$$$$$#   \`\``,
        `          \`$$$$##$$$$!       i$u.  $. .i$$$$$$$$$#""`,
        `             "     \`#W       $$$$$$$$$$$$$$$$$$$\`      u$#`,
        `                            W$$$$$$$$$$$$$$$$$$      $$$$W`,
        `                            $$\`!$$$##$$$$\`\`$$$$      $$$$!`,
        `                           i$" $$$$  $$#"\`  """     W$$$$`,
        `                                                   W$$$$!`,
        `                      uW$$  uu  uu.  $$$  $$$Wu#   $$$$$$`,
        `                     ~$$$$iu$$iu$$$uW$$! $$$$$$i .W$$$$$$`,
        `             ..  !   "#$$$$$$$$$$##$$$$$$$$$$$$$$$$$$$$#"`,
        `             $$W  $     "#$$$$$$$iW$$$$$$$$$$$$$$$$$$$$$W`,
        `             $#\`   \`       ""#$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
        `                              !$$$$$$$$$$$$$$$$$$$$$#\``,
        `                              $$$$$$$$$$$$$$$$$$$$$$!`,
        `                            $$$$$$$$$$$$$$$$$$$$$$$\``,
        `                             $$$$$$$$$$$$$$$$$$$$"`
    ].map(s => s.padEnd(76, ' ')); // Assicuriamoci che ogni riga abbia la stessa larghezza per la griglia tex

    const flowerSprite = [
        " ** ** ",
        "*******",
        " ***** ",
        "  ***  ",
        "   *   "
    ].map(s => s.padEnd(7, ' '));

    let isPlaying = false;
    let keys = {};
    window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

    let spacePressed = false;
    window.addEventListener('keydown', e => {
        if (e.key === ' ' && isPlaying && !spacePressed) {
            spacePressed = true;
            // Shoot flower
            projectiles.push({ x: playerX, y: playerY, a: playerA, distTraveled: 0, active: true });
            if(audioCtx) playShoot(audioCtx.currentTime);
        }
    });
    window.addEventListener('keyup', e => {
        if (e.key === ' ') spacePressed = false;
    });

    let depthBuffer = new Array(screenWidth).fill(0);
    let screenBuffer = new Array(screenWidth * screenHeight).fill(' ');

    function loop() {
        if (!isPlaying) return;

        // Player look and move
        if (keys['a'] || keys['arrowleft']) playerA -= 0.05;
        if (keys['d'] || keys['arrowright']) playerA += 0.05;
        
        // Normalize angle to 0..2PI
        if (playerA < 0) playerA += 2 * Math.PI;
        if (playerA > 2 * Math.PI) playerA -= 2 * Math.PI;
        
        let moveStep = 0.05;
        let strafeStep = 0.03;
        
        if (keys['w'] || keys['arrowup']) {
            playerX += Math.cos(playerA) * moveStep;
            playerY += Math.sin(playerA) * moveStep;
            if (map[Math.floor(playerY) * mapWidth + Math.floor(playerX)] === '#') {
                playerX -= Math.cos(playerA) * moveStep;
                playerY -= Math.sin(playerA) * moveStep;
            }
        }
        if (keys['s'] || keys['arrowdown']) {
            playerX -= Math.cos(playerA) * moveStep;
            playerY -= Math.sin(playerA) * moveStep;
            if (map[Math.floor(playerY) * mapWidth + Math.floor(playerX)] === '#') {
                playerX += Math.cos(playerA) * moveStep;
                playerY += Math.sin(playerA) * moveStep;
            }
        }

        // Clear buffer
        screenBuffer.fill(' ');

        // Render Walls
        for (let x = 0; x < screenWidth; x++) {
            let rayAngle = (playerA - FOV / 2.0) + (x / screenWidth) * FOV;
            let distanceToWall = 0;
            let hitWall = false;

            let eyeX = Math.cos(rayAngle);
            let eyeY = Math.sin(rayAngle);

            while (!hitWall && distanceToWall < depth) {
                distanceToWall += 0.1;
                let testX = Math.floor(playerX + eyeX * distanceToWall);
                let testY = Math.floor(playerY + eyeY * distanceToWall);

                if (testX < 0 || testX >= mapWidth || testY < 0 || testY >= mapHeight) {
                    hitWall = true;
                    distanceToWall = depth;
                } else {
                    if (map[testY * mapWidth + testX] === '#') {
                        hitWall = true;
                    }
                }
            }

            // Fix fisheye
            let correctedDist = distanceToWall * Math.cos(rayAngle - playerA);
            depthBuffer[x] = correctedDist;

            let ceiling = screenHeight / 2.0 - screenHeight / correctedDist;
            let floor = screenHeight - ceiling;

            for (let y = 0; y < screenHeight; y++) {
                let shade = ' ';
                if (y <= ceiling) {
                    shade = ' '; // Cielo
                } else if (y > ceiling && y <= floor) {
                    if (distanceToWall <= depth / 4.0) shade = '█';
                    else if (distanceToWall < depth / 3.0) shade = '▓';
                    else if (distanceToWall < depth / 2.0) shade = '▒';
                    else if (distanceToWall < depth) shade = '░';
                    else shade = '.';
                } else {
                    let b = 1.0 - (y - screenHeight / 2.0) / (screenHeight / 2.0);
                    if (b < 0.25) shade = '#';
                    else if (b < 0.5) shade = 'x';
                    else if (b < 0.75) shade = '.';
                    else if (b < 0.9) shade = '-';
                    else shade = ' ';
                }
                
                screenBuffer[y * screenWidth + x] = shade;
            }
        }

        // Update Projectiles
        for (let p of projectiles) {
            if (!p.active) continue;
            p.x += Math.cos(p.a) * 0.4; // Speed of projectile
            p.y += Math.sin(p.a) * 0.4;
            p.distTraveled += 0.4;
            
            // Hit Wall
            if (map[Math.floor(p.y) * mapWidth + Math.floor(p.x)] === '#') {
                p.active = false;
                continue;
            }
            
            // Hit Enemy
            for (let s of sprites) {
                if (!s.active) continue;
                if (Math.hypot(p.x - s.x, p.y - s.y) < 0.6) {
                    // Boom
                    s.active = false;
                    p.active = false;
                    if(audioCtx) playSquelch(audioCtx.currentTime);
                    
                    // Win Condition
                    if (sprites.every(sprite => !sprite.active)) {
                        setTimeout(() => {
                            document.getElementById('win-screen').style.display = 'block';
                            isPlaying = false;
                            screen.style.cursor = 'pointer';
                        }, 500);
                    }
                    
                    break;
                }
            }
            
            if (p.distTraveled > depth) p.active = false;
        }

        // Prepare Render List (Enemies + Projectiles)
        let renderList = [];
        for (let s of sprites) {
            if (s.active) renderList.push({ x: s.x, y: s.y, type: 'skull' });
        }
        for (let p of projectiles) {
            if (p.active) renderList.push({ x: p.x, y: p.y, type: 'flower' });
        }

        // Sort far to near for correct occlusion
        renderList.sort((a, b) => {
            let distA = Math.hypot(playerX - a.x, playerY - a.y);
            let distB = Math.hypot(playerX - b.x, playerY - b.y);
            return distB - distA;
        });

        // Draw Sprites
        for (let el of renderList) {
            let dx = el.x - playerX;
            let dy = el.y - playerY;
            let dist = Math.hypot(dx, dy);

            let spriteAngle = Math.atan2(dy, dx) - playerA;
            // Normalizza angolo tra -PI e PI
            while(spriteAngle < -Math.PI) spriteAngle += 2*Math.PI;
            while(spriteAngle > Math.PI) spriteAngle -= 2*Math.PI;

            // Se è davanti al giocatore
            if (Math.abs(spriteAngle) < FOV / 1.5) {
                let screenX = (0.5 * (spriteAngle / (FOV / 2.0)) + 0.5) * screenWidth;
                
                // Evitiamo divisioni per zero ed effetti strani se è troppo vicino
                if (dist < 0.5) dist = 0.5;
                let spriteSize = screenHeight / dist;

                let startX = Math.floor(screenX - spriteSize / 2);
                let endX = Math.floor(screenX + spriteSize / 2);
                let startY = Math.floor(screenHeight / 2 - spriteSize / 2);
                let endY = Math.floor(screenHeight / 2 + spriteSize / 2);

                let tex = el.type === 'skull' ? skullSprite : flowerSprite;
                let texW = tex[0].length;
                let texH = tex.length;

                for (let sx = startX; sx < endX; sx++) {
                    // Check depth buffer per assicurarci che non sia dietro un muro
                    if (sx >= 0 && sx < screenWidth && dist < depthBuffer[sx]) {
                        for (let sy = startY; sy < endY; sy++) {
                            if (sy >= 0 && sy < screenHeight) {
                                let u = Math.floor((sx - startX) / spriteSize * texW);
                                let v = Math.floor((sy - startY) / spriteSize * texH);
                                if (u >= 0 && u < texW && v >= 0 && v < texH) {
                                    let c = tex[v][u];
                                    if (c !== ' ') {
                                        screenBuffer[sy * screenWidth + sx] = c;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        // Crosshair
        screenBuffer[Math.floor(screenHeight/2) * screenWidth + Math.floor(screenWidth/2)] = '+';

        // Draw Frame
        let outputStr = "";
        for(let y = 0; y < screenHeight; y++) {
            outputStr += screenBuffer.slice(y * screenWidth, (y + 1) * screenWidth).join("") + "\n";
        }
        
        screen.textContent = outputStr;
        requestAnimationFrame(loop);
    }

    // --- AUDIO GENERATOR ---
    let audioCtx;
    let nextNoteTime = 0;
    let currentNote = 0;
    
    // Note E1M1
    const E1 = 41.20, E2 = 82.41, G1 = 49.00, A1 = 55.00, Bb1 = 58.27, B1 = 61.74, C2 = 65.41, D2 = 73.42;
    // Main riff
    const riff = [
        E1, E1, E2, E1, E1, D2, E1, E1, C2, E1, E1, Bb1, E1, E1, B1, C2
    ];
    
    function scheduleAudio() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            playRiffNote(nextNoteTime, riff[currentNote]);
            nextNoteTime += 0.125; // tempo 120bpm sedicesimi circa
            currentNote = (currentNote + 1) % riff.length;
            
            // Kick drum ogni 4 step
            if (currentNote % 4 === 0) playKick(nextNoteTime);
        }
        setTimeout(scheduleAudio, 25);
    }

    function playRiffNote(time, freq) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, time);
        filter.Q.value = 6;
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.7, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.11);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.12);
    }
    
    function playKick(time) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        osc.start(time);
        osc.stop(time + 0.1);
    }

    function playShoot(time) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, time);
        osc.frequency.exponentialRampToValueAtTime(100, time + 0.1);
        
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.1);
    }

    function playSquelch(time) {
        // Suono ucciisione (basso acido distorto e rumore)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, time);
        osc.frequency.exponentialRampToValueAtTime(1, time + 0.3);
        
        gain.gain.setValueAtTime(1, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.3);
    }

    startBtn.addEventListener('click', () => {
        startBtn.style.display = 'none';
        screen.textContent = "INITIALIZING...";
        // Non nascondere cursore altrimenti l'utente si perde
        
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        isPlaying = true;
        nextNoteTime = audioCtx.currentTime + 0.1;
        scheduleAudio();
        requestAnimationFrame(loop);
    });

    const winCloseBtn = document.getElementById('win-close');
    if (winCloseBtn) {
        winCloseBtn.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
