// Aggiunge interazioni rumorose e distorsioni ai blocchi

// Ripristina il tema salvato il prima possibile (anche prima del DOMContentLoaded per limitare il flash)
const savedC1 = localStorage.getItem('poison-color-1');
const savedC2 = localStorage.getItem('poison-color-2');
if (savedC1 && savedC2) {
    document.documentElement.style.setProperty('--accent-1', savedC1);
    document.documentElement.style.setProperty('--accent-2', savedC2);
}

document.addEventListener('DOMContentLoaded', () => {
    // Loader Ascii
    const loaderOverlay = document.getElementById('ascii-loader');
    const loaderEye = document.getElementById('loader-eye');

    if (loaderOverlay && loaderEye) {
        const loaderFrames = ['[-_-]', '(._.)', '(o_o)', '[O_O]'];
        let frameIndex = 0;

        const animateLoader = setInterval(() => {
            loaderEye.textContent = loaderFrames[frameIndex];
            frameIndex++;

            if (frameIndex >= loaderFrames.length) {
                clearInterval(animateLoader);
                loaderOverlay.classList.add('hidden');
                setTimeout(() => {
                    loaderOverlay.style.display = 'none';
                }, 400); // Dissolvenza morbida
            }
        }, 225); // Diviso per non accorciare il tempo
    }

    // Gestione Canvas Vector Eyes (ASCII)
    const canvas = document.getElementById('vector-field');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let width, height;
        let startTime = Date.now();

        // Spaziatura per la griglia di testo
        const gridSpacing = 60;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            // Font monospace in stile terminale per gli occhi
            ctx.font = 'bold 20px "Courier New", Courier, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
        };
        window.addEventListener('resize', resize);
        resize();

        // Stati dell'apertura degli occhi (da apertissimi a chiusi)
        const eyeStates = [
            '[O_O]',
            '(o_o)',
            '(._.)',
            '(-_-)'
        ];

        const maxDist = 600; // Zona di transizione dell'onda
        const coreThickness = 150; // "Cuore" dell'onda in cui le faccine sono apertissime

        const drawEyesField = () => {
            // Ottieni i colori attuali
            const rootStyle = getComputedStyle(document.documentElement);
            const a1 = rootStyle.getPropertyValue('--accent-1').trim();
            const a2 = rootStyle.getPropertyValue('--accent-2').trim();

            ctx.clearRect(0, 0, width, height);

            const time = Date.now() - startTime;
            // Calcola la posizione Y base dell'onda
            const waveSpeed = 0.25;
            const cycle = height + maxDist * 3;
            let waveY = (time * waveSpeed) % cycle - maxDist;

            for (let y = gridSpacing / 2; y < height; y += gridSpacing) {
                for (let x = gridSpacing / 2; x < width; x += gridSpacing) {
                    // Crea una sinusoide per farla sembrare un'onda in movimento
                    const waveOffset = Math.sin(x * 0.005 + time * 0.002) * 150;
                    const wavePos = waveY + waveOffset;

                    // Distanza dall'onda
                    const dist = Math.abs(y - wavePos);
                    const effectiveDist = Math.max(0, dist - coreThickness);

                    // Calcola quale "stato" dell'occhio usare
                    let stateIndex = Math.floor((effectiveDist / maxDist) * eyeStates.length);
                    if (stateIndex >= eyeStates.length) stateIndex = eyeStates.length - 1;
                    if (stateIndex < 0) stateIndex = 0;

                    const eyeStr = eyeStates[stateIndex];

                    // Colore in base a quanto sono aperti - resi più visibili
                    if (stateIndex === 0 || stateIndex === 1) {
                        ctx.fillStyle = a2;
                        ctx.globalAlpha = stateIndex === 0 ? 1.0 : 0.85;
                    } else if (stateIndex === 2) {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                        ctx.globalAlpha = 1;
                    } else {
                        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                        ctx.globalAlpha = 1;
                    }

                    // Parallasse: gli occhi guardano "verso" l'onda
                    const dy = wavePos - y;
                    // L'entità dello spostamento diminuisce con la distanza dall'onda
                    const lookDist = Math.min(15, 500 / (dist + 1));
                    const lookY = y + (Math.sign(dy) * lookDist * 0.5); // Guardano su o giù

                    ctx.fillText(eyeStr, x, lookY);
                }
            }
            requestAnimationFrame(drawEyesField);
        };
        drawEyesField();
    }

    const brutalBoxes = document.querySelectorAll('.brutal-box');
    // Box geometric distortion on hover removed.

    // Effetto distorsione testo sui titoli quando cliccati
    const headers = document.querySelectorAll('h2, .glitch');
    headers.forEach(h2 => {
        h2.addEventListener('mousedown', () => {
            h2.style.transform = `scale(1.1) skewX(${Math.floor(Math.random() * 30 - 15)}deg)`;
            h2.style.color = 'var(--accent-2)';
            h2.style.textShadow = 'none';
        });

        const resetTitle = () => {
            h2.style.transform = '';
            h2.style.color = '';
            h2.style.textShadow = '';
        };

        h2.addEventListener('mouseup', resetTitle);
        h2.addEventListener('mouseleave', resetTitle);
    });

    // Selettore Colore
    const colorBtns = document.querySelectorAll('.color-btn');
    const root = document.documentElement;

    // Evidenzia il bottone salvato (o quello di default) attingendo dai colori attuali
    const currentA1 = savedC1 || getComputedStyle(root).getPropertyValue('--accent-1').trim();
    colorBtns.forEach(b => {
        if (b.style.getPropertyValue('--c1').trim() === currentA1) {
            b.classList.add('active');
        }
    });

    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const c1 = btn.style.getPropertyValue('--c1').trim();
            const c2 = btn.style.getPropertyValue('--c2').trim();

            root.style.setProperty('--accent-1', c1);
            root.style.setProperty('--accent-2', c2);

            // Salva la selezione in locale
            localStorage.setItem('poison-color-1', c1);
            localStorage.setItem('poison-color-2', c2);

            // Evidenzia pulsante attivo
            colorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // ==========================================
    // Easter Egg Drum Machine
    // ==========================================
    const pTrigger = document.getElementById('easter-egg');
    if (pTrigger) {
        let clickCount = 0;
        let pTimer;

        pTrigger.style.cursor = 'pointer';

        pTrigger.addEventListener('mousedown', (e) => {
            e.stopPropagation(); // Evita l'effetto glitch standard se si clicca esattamente sulla P
            clickCount++;

            // Piccolo feedback visivo
            const h1 = document.querySelector('.glitch');
            if (h1) {
                h1.style.color = 'var(--accent-2)';
                h1.style.transform = `scale(1.1) skewX(${Math.floor(Math.random() * 40 - 20)}deg)`;
                setTimeout(() => {
                    h1.style.color = '';
                    h1.style.transform = '';
                }, 150);
            }

            clearTimeout(pTimer);
            if (clickCount >= 5) {
                // Vai alla pagina segreta
                window.location.href = 'secret-drum.html';
            } else {
                pTimer = setTimeout(() => {
                    clickCount = 0;
                }, 2000); // Reset dopo 2 secondi
            }
        });
    }

    // Easter Egg: Clicca 5 volte la "N" per DOOM In ASCII
    const nTrigger = document.getElementById('easter-egg-2');
    if (nTrigger) {
        let nClickCount = 0;
        let nTimer;

        nTrigger.style.cursor = 'crosshair';

        nTrigger.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            nClickCount++;

            // Feedback visivo rosso/sangue
            const h1 = document.querySelector('.glitch');
            if (h1) {
                h1.style.color = 'var(--accent-1)';
                h1.style.transform = `scale(1.1) skewY(${Math.floor(Math.random() * 40 - 20)}deg)`;
                setTimeout(() => {
                    h1.style.color = '';
                    h1.style.transform = '';
                }, 150);
            }

            clearTimeout(nTimer);
            if (nClickCount >= 5) {
                window.location.href = 'secret-doom.html';
            } else {
                nTimer = setTimeout(() => {
                    nClickCount = 0;
                }, 2000);
            }
        });
    }
});
