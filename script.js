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
        let mouseX = -1000;
        let mouseY = -1000;
        
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
        
        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        });
        
        // Stati dell'apertura degli occhi (da apertissimi a chiusi)
        const eyeStates = [
            '[O_O]', 
            '(o_o)', 
            '(._.)', 
            '(-_-)'
        ];
        
        const maxDist = 350; // Distanza massima di reazione

        const drawEyesField = () => {
            // Ottieni i colori attuali
            const rootStyle = getComputedStyle(document.documentElement);
            const a1 = rootStyle.getPropertyValue('--accent-1').trim();
            const a2 = rootStyle.getPropertyValue('--accent-2').trim();
            
            ctx.clearRect(0, 0, width, height);
            
            for (let y = gridSpacing/2; y < height; y += gridSpacing) {
                for (let x = gridSpacing/2; x < width; x += gridSpacing) {
                    const dx = mouseX - x;
                    const dy = mouseY - y;
                    const dist = Math.hypot(dx, dy);
                    
                    // Calcola quale "stato" dell'occhio usare
                    let stateIndex = Math.floor((dist / maxDist) * eyeStates.length);
                    if (stateIndex >= eyeStates.length) stateIndex = eyeStates.length - 1;
                    if (stateIndex < 0) stateIndex = 0;
                    
                    const eyeStr = eyeStates[stateIndex];
                    
                    // Colore in base a quanto sono aperti
                    if (stateIndex === 0 || stateIndex === 1) {
                        ctx.fillStyle = a2; // Solo colore secondario/chiaro per highlight
                        ctx.globalAlpha = stateIndex === 0 ? 1.0 : 0.6;
                    } else if (stateIndex === 2) {
                        ctx.fillStyle = 'rgba(240, 240, 240, 0.4)'; // Grigio semi-trasparente
                        ctx.globalAlpha = 1;
                    } else {
                        ctx.fillStyle = 'rgba(240, 240, 240, 0.2)'; // Faccina addormentata flebile
                        ctx.globalAlpha = 1;
                    }
                    
                    // Parallasse: gli occhi si "girano/spostano" leggermente verso il cursore
                    const angle = Math.atan2(dy, dx);
                    // L'entità dello spostamento diminuisce con la distanza
                    const lookDist = Math.min(15, 500 / (dist + 1)); 
                    const lookX = x + Math.cos(angle) * lookDist;
                    const lookY = y + Math.sin(angle) * lookDist;

                    ctx.fillText(eyeStr, lookX, lookY);
                }
            }
            requestAnimationFrame(drawEyesField);
        };
        drawEyesField();
    }

    const brutalBoxes = document.querySelectorAll('.brutal-box');

    brutalBoxes.forEach(box => {
        // Distorsione casuale geometrica
        box.addEventListener('mouseenter', () => {
            const randomRotation = Math.floor(Math.random() * 4) - 2; // tra -2 e 2 gradi
            box.style.transform = `translate(-5px, -5px) rotate(${randomRotation}deg)`;
        });

        // Ripristino
        box.addEventListener('mouseleave', () => {
            box.style.transform = '';
        });
    });

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
});
