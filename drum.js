document.addEventListener('DOMContentLoaded', () => {
    const playBtn = document.getElementById('play-btn');
    const stopBtn = document.getElementById('stop-btn');
    const bpmSlider = document.getElementById('bpm');
    const bpmVal = document.getElementById('bpm-val');
    const grid = document.getElementById('seq-grid');

    if (!grid) return; // Non eseguire se non siamo nella pagina della drum machine

    let audioCtx;
    let isPlaying = false;
    let currentStep = 0;
    let nextNoteTime = 0.0;
    let lookahead = 25.0; // ms
    let scheduleAheadTime = 0.1; // s
    let timerID;

    // Define instruments and sequences
    const steps = 32;
    const instruments = [
        { name: 'KICK', seq: new Array(steps).fill(false) },
        { name: 'SNARE', seq: new Array(steps).fill(false) },
        { name: 'HIHAT', seq: new Array(steps).fill(false) },
        { name: 'BASS', seq: new Array(steps).fill(false) } // Simple single-note bass for now
    ];

    // Note default per far capire come funziona subito
    instruments[0].seq[0] = true;
    instruments[0].seq[8] = true;
    instruments[0].seq[16] = true;
    instruments[0].seq[24] = true;
    
    // Snare sul 2 e sul 4
    instruments[1].seq[4] = true;
    instruments[1].seq[12] = true;
    instruments[1].seq[20] = true;
    instruments[1].seq[28] = true;
    
    instruments[2].seq[0] = true;
    instruments[2].seq[4] = true;
    instruments[2].seq[8] = true;
    instruments[2].seq[12] = true;
    instruments[2].seq[16] = true;
    instruments[2].seq[20] = true;
    instruments[2].seq[24] = true;
    instruments[2].seq[28] = true;

    instruments[3].seq[2] = true;
    instruments[3].seq[10] = true;
    instruments[3].seq[18] = true;
    instruments[3].seq[26] = true;

    // Build UI Grid
    instruments.forEach((inst, targetIndex) => {
        const row = document.createElement('div');
        row.className = 'seq-row';
        
        const label = document.createElement('div');
        label.className = 'seq-label';
        label.textContent = inst.name;
        row.appendChild(label);

        const stepsContainer = document.createElement('div');
        stepsContainer.className = 'seq-steps';

        for (let i = 0; i < steps; i++) {
            const stepBtn = document.createElement('button');
            stepBtn.className = 'seq-step';
            if (i % 4 === 0) stepBtn.classList.add('beat-mark');
            if (inst.seq[i]) stepBtn.classList.add('active');
            stepBtn.dataset.inst = targetIndex;
            stepBtn.dataset.step = i;

            stepBtn.addEventListener('click', () => {
                inst.seq[i] = !inst.seq[i];
                stepBtn.classList.toggle('active', inst.seq[i]);
            });

            stepsContainer.appendChild(stepBtn);
        }
        row.appendChild(stepsContainer);
        grid.appendChild(row);
    });

    const stepElements = document.querySelectorAll('.seq-step');

    function playKick(time) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        
        osc.start(time);
        osc.stop(time + 0.5);
    }

    function playSnare(time) {
        // Noise buffer for snare
        const bufferSize = audioCtx.sampleRate * 0.2; // 200ms
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        noise.connect(noiseFilter);
        
        const noiseGain = audioCtx.createGain();
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        noiseGain.gain.setValueAtTime(1, time);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        noise.start(time);

        // Snap oscillator
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.connect(oscGain);
        oscGain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(250, time);
        oscGain.gain.setValueAtTime(0.5, time);
        oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.start(time);
        osc.stop(time + 0.2);
    }

    function playHihat(time) {
        const bufferSize = audioCtx.sampleRate * 0.1; 
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const bandpass = audioCtx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.value = 10000;
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.3, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Molto corto
        
        noise.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        noise.start(time);
    }

    function playBass(time) {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'square';
        // Random note from sub bass range (E1, G1, A1, C2)
        const notes = [41.2, 49.0, 55.0, 65.4];
        osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], time);
        
        // Filter per suono più squelchy (stile acid bass 303 light)
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);
        
        gainNode.gain.setValueAtTime(0, time);
        gainNode.gain.linearRampToValueAtTime(0.4, time + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.25);
        
        osc.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start(time);
        osc.stop(time + 0.3);
    }

    function scheduleNote(stepNumber, time) {
        // Aggiorna UI visivamente per il beat
        requestAnimationFrame(() => {
            stepElements.forEach(el => el.classList.remove('current-step'));
            const currentStepEls = document.querySelectorAll(`[data-step="${stepNumber}"]`);
            currentStepEls.forEach(el => el.classList.add('current-step'));
        });

        if (instruments[0].seq[stepNumber]) playKick(time);
        if (instruments[1].seq[stepNumber]) playSnare(time);
        if (instruments[2].seq[stepNumber]) playHihat(time);
        if (instruments[3].seq[stepNumber]) playBass(time);
    }

    function scheduler() {
        while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
            scheduleNote(currentStep, nextNoteTime);
            nextNoteTime += 0.25 * (60.0 / parseInt(bpmSlider.value)); // 16th note
            currentStep = (currentStep + 1) % steps;
        }
        timerID = setTimeout(scheduler, lookahead);
    }

    playBtn.addEventListener('click', () => {
        if (isPlaying) return;
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        isPlaying = true;
        currentStep = 0;
        nextNoteTime = audioCtx.currentTime + 0.05;
        scheduler();
        playBtn.style.color = 'var(--accent-2)';
    });

    stopBtn.addEventListener('click', () => {
        isPlaying = false;
        clearTimeout(timerID);
        stepElements.forEach(el => el.classList.remove('current-step'));
        playBtn.style.color = '';
    });

    bpmSlider.addEventListener('input', (e) => {
        bpmVal.textContent = e.target.value;
    });
});
