document.addEventListener('DOMContentLoaded', () => {
    // --- 定数と設定 ---
    const NOTES_ENHARMONIC = ['C', 'C#(Db)', 'D', 'D#(Eb)', 'E', 'F', 'F#(Gb)', 'G', 'G#(Ab)', 'A', 'A#(Bb)', 'B'];
    const NOTES_SOLFEGE_ENHARMONIC = ['ド', 'ド#(レb)', 'レ', 'レ#(ミb)', 'ミ', 'ファ', 'ファ#(ソb)', 'ソ', 'ソ#(ラb)', 'ラ', 'ラ#(シb)', 'シ'];
    const NATURAL_INDICES = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
    const NATURAL_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const TUNING = [4, 11, 7, 2, 9, 4]; 
    const FRET_COUNT = 24;
    const STRING_COUNT = 6;
    const FRET_WIDTH = 80;
    const FRET_HEIGHT = 35;
    const POSITION_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    const DISPLAY_FRET_COUNT = 12;
    const FRET_NUM_AREA_HEIGHT = 30;

    // --- 音声関連の定数 ---
    const BASE_MIDI_NOTES = [64, 59, 55, 50, 45, 40]; 
    let audioContext;
    let soundBuffers = {}; 
    let soundsLoaded = false;
    const SOUND_FILE_PATH = './sounds/'; 
    const SOUND_FILE_EXTENSION = '.mp3';
    const MIN_MIDI_NOTE = 40; 
    const MAX_MIDI_NOTE = 88;

    // --- DOM要素 ---
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingText = loadingOverlay.querySelector('p');
    const messageEl = document.getElementById('message');
    const answerButtonsContainer = document.getElementById('answer-buttons');
    const tabFretboard = document.getElementById('tab-fretboard');
    const tabSolfege = document.getElementById('tab-solfege');
    const fretboardQuizContainer = document.getElementById('fretboard-quiz-container');
    const solfegeQuizContainer = document.getElementById('solfege-quiz-container');
    const fretboardContainer = document.getElementById('fretboard-container');
    const fretboardScoreEl = document.getElementById('fretboard-score');
    const fretboardNextBtn = document.getElementById('fretboard-next-btn');
    const stringModeSelector = document.getElementById('string-mode-selector');
    const fretboardQuizRangeSelector = document.getElementById('fretboard-quiz-range-selector');
    const fretboardDisplayOptionsSelector = document.getElementById('fretboard-display-options-selector');
    const fretboardQuestionTextEl = document.getElementById('fretboard-question-area').querySelector('p');
    const fretboardPositionHintEl = document.getElementById('fretboard-position-hint');
    const solfegeScoreEl = document.getElementById('solfege-score');
    const solfegeNextBtn = document.getElementById('solfege-next-btn');
    const solfegeQuestionEl = document.getElementById('solfege-question');
    const solfegeQuestionTextEl = solfegeQuizContainer.querySelector('p');
    const commonOptionsSelector = document.getElementById('common-options-selector');
    
    // Note Filter Modal UI
    const noteFilterModal = document.getElementById('note-filter-modal');
    const noteFilterOpenBtn = document.getElementById('note-filter-open-btn');
    const noteFilterButtons = document.getElementById('note-filter-buttons');
    const noteFilterCloseBtn = document.getElementById('note-filter-close-btn');
    const noteFilterClearBtn = document.getElementById('note-filter-clear-btn');


    // --- アプリケーションの状態 ---
    let state = {
        currentQuiz: 'fretboard',
        isQuizActive: true,
        showOpenStrings: false,
        noteNameSystem: 'english', 
        isSoundEnabled: true, 
        hideSemitones: false,

        fretboard: {
            score: 0,
            targetString: -1,
            targetFret: -1,
            targetNoteIndex: -1,
            selectedStrings: [], // Changed from trainingMode
            quizFretRange: '1-12',
            fretViewStart: 0,
            hideFretboard: false,
            noteFilter: [], // Array of note indices to include
        },

        solfege: {
            score: 0,
            targetNoteIndex: -1,
        }
    };

    // --- 音声再生機能 ---
    async function initAudioAndLoadSounds() {
        if (audioContext) return;
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            loadingText.textContent = 'サウンドを読み込んでいます...';
            await loadSounds();
            if (Object.keys(soundBuffers).length > 0) {
                soundsLoaded = true;
            } else {
                soundsLoaded = false;
            }
        } catch(e) {
            console.error("Audio setup failed:", e);
            soundsLoaded = false;
        } finally {
            loadingOverlay.style.display = 'none';
        }
    }

    async function loadSounds() {
        if (!audioContext) return;
        const loadingPromises = [];
        for (let i = MIN_MIDI_NOTE; i <= MAX_MIDI_NOTE; i++) {
            const url = `${SOUND_FILE_PATH}${i}${SOUND_FILE_EXTENSION}`;
            const promise = fetch(url)
                .then(response => response.ok ? response.arrayBuffer() : null)
                .then(arrayBuffer => arrayBuffer ? audioContext.decodeAudioData(arrayBuffer) : null)
                .then(audioBuffer => { if (audioBuffer) soundBuffers[i] = audioBuffer; })
                .catch(error => {});
            loadingPromises.push(promise);
        }
        await Promise.all(loadingPromises);
    }

    function playTone(midiNote) {
        if (!state.isSoundEnabled || !audioContext) return;
        if (soundsLoaded && soundBuffers[midiNote]) {
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffers[midiNote];
            source.connect(audioContext.destination);
            source.start(0);
        } else {
            const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.7);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.8);
        }
    }

    // --- 指板描画 ---
    function drawFretboard() {
        const { fretViewStart, selectedStrings, targetString, targetFret } = state.fretboard;
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const fretboardHeight = STRING_COUNT * FRET_HEIGHT;
        const totalWidth = (DISPLAY_FRET_COUNT + 1) * FRET_WIDTH;
        const totalHeight = fretboardHeight + FRET_NUM_AREA_HEIGHT;
        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
        svg.style.backgroundColor = '#E3C6A4';
        for (let i = 0; i <= DISPLAY_FRET_COUNT; i++) {
            const currentFret = fretViewStart + i;
            const x = (i + 0.5) * FRET_WIDTH;
            if (currentFret === 0) {
                const nut = document.createElementNS(svgNS, 'rect');
                nut.setAttribute('x', x - 4); nut.setAttribute('y', 0);
                nut.setAttribute('width', 8); nut.setAttribute('height', fretboardHeight);
                nut.setAttribute('fill', '#d1d5db'); svg.appendChild(nut);
            } else {
                const fretLine = document.createElementNS(svgNS, 'line');
                fretLine.setAttribute('x1', x); fretLine.setAttribute('y1', 0);
                fretLine.setAttribute('x2', x); fretLine.setAttribute('y2', fretboardHeight);
                fretLine.setAttribute('stroke', '#9ca3af');
                fretLine.setAttribute('stroke-width', currentFret === 12 ? '5' : '3');
                svg.appendChild(fretLine);
            }
            if (POSITION_MARKERS.includes(currentFret) && currentFret !== 0) {
                const marker = document.createElementNS(svgNS, 'circle');
                const markerX = x - FRET_WIDTH / 2; let markerY = fretboardHeight / 2;
                marker.setAttribute('cx', markerX); marker.setAttribute('cy', markerY);
                marker.setAttribute('r', '6'); marker.setAttribute('fill', '#000000');
                marker.setAttribute('fill-opacity', '0.2');
                if (currentFret === 12 || currentFret === 24) {
                    const marker2 = marker.cloneNode();
                    marker.setAttribute('cy', markerY - FRET_HEIGHT);
                    marker2.setAttribute('cy', markerY + FRET_HEIGHT);
                    svg.appendChild(marker2);
                }
                svg.appendChild(marker);
            }
        }
        for (let i = 0; i < STRING_COUNT; i++) {
            const y = (i + 0.5) * FRET_HEIGHT;
            const stringLine = document.createElementNS(svgNS, 'line');
            const stringIndex = i;
            const isStringActive = selectedStrings.length === 0 || selectedStrings.includes(stringIndex + 1);
            stringLine.setAttribute('x1', FRET_WIDTH/2); stringLine.setAttribute('y1', y);
            stringLine.setAttribute('x2', totalWidth - FRET_WIDTH/2); stringLine.setAttribute('y2', y);
            stringLine.setAttribute('stroke', isStringActive ? '#6b7280' : '#d1d5db');
            stringLine.setAttribute('stroke-width', 1.5 + stringIndex * 0.4);
            svg.appendChild(stringLine);
        }
        const fretNumGroup = document.createElementNS(svgNS, 'g');
        fretNumGroup.setAttribute('transform', `translate(0, ${fretboardHeight})`);
        for (let i = 1; i <= DISPLAY_FRET_COUNT; i++) {
            const currentFret = fretViewStart + i;
            if(currentFret === 0) continue;
            const x = i * FRET_WIDTH; const y = (FRET_NUM_AREA_HEIGHT / 2) + 5;
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', x); text.setAttribute('y', y);
            text.setAttribute('fill', '#6b7280'); text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', '600'); text.setAttribute('text-anchor', 'middle');
            text.textContent = currentFret; fretNumGroup.appendChild(text);
        }
        svg.appendChild(fretNumGroup);
        if (state.showOpenStrings && fretViewStart === 0) {
            const noteArray = state.noteNameSystem === 'solfege' ? NOTES_SOLFEGE_ENHARMONIC : NOTES_ENHARMONIC;
            for (let i = 0; i < STRING_COUNT; i++) {
                const stringIndex = i;
                if (targetFret === 0 && targetString === stringIndex) { continue; }
                const noteName = noteArray[TUNING[stringIndex]];
                const y = (i + 0.5) * FRET_HEIGHT + 6; const x = 0.25 * FRET_WIDTH;
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', x); text.setAttribute('y', y);
                text.setAttribute('fill', '#4b5563'); text.setAttribute('font-size', '16');
                text.setAttribute('font-weight', 'bold'); text.setAttribute('text-anchor', 'middle');
                text.textContent = noteName; svg.appendChild(text);
            }
        }
        if (targetFret >= fretViewStart && targetFret <= fretViewStart + DISPLAY_FRET_COUNT) {
            const marker = createQuestionMarker(targetString, targetFret - fretViewStart);
            svg.appendChild(marker);
        }
        fretboardContainer.innerHTML = '';
        fretboardContainer.appendChild(svg);
    }
    
    function createQuestionMarker(displayString, displayFret) {
        const svgNS = "http://www.w3.org/2000/svg";
        const g = document.createElementNS(svgNS, "g");
        g.classList.add('question-marker');
        let cx;
        if (state.fretboard.targetFret === 0) { cx = (0.25) * FRET_WIDTH; } 
        else { cx = (displayFret) * FRET_WIDTH; }
        const cy = (displayString + 0.5) * FRET_HEIGHT;
        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
        circle.setAttribute('r', FRET_HEIGHT * 0.4);
        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', cx); text.setAttribute('y', cy + 7);
        text.setAttribute('text-anchor', 'middle'); text.textContent = '?';
        g.appendChild(circle); g.appendChild(text);
        return g;
    }

    // --- クイズロジック ---
    function generateQuestion() {
        state.isQuizActive = true;
        hideMessage();
        resetAnswerButtons();
        if (state.currentQuiz === 'fretboard') {
            generateFretboardQuestion();
        } else {
            generateSolfegeQuestion();
        }
    }

    function generateFretboardQuestion() {
        const s = state.fretboard;
        let possiblePositions = [];
        const stringsToTest = s.selectedStrings.length > 0 ? s.selectedStrings.map(str => str - 1) : [0, 1, 2, 3, 4, 5];
        let minFret = 0, maxFret = 0;

        if (s.quizFretRange === '1-12') { minFret = 0; maxFret = 12; }
        else if (s.quizFretRange === '13-24') { minFret = 13; maxFret = 24; }
        else { minFret = 0; maxFret = 24; }

        for (const string of stringsToTest) {
            for (let fret = minFret; fret <= maxFret; fret++) {
                const noteIndex = (TUNING[string] + fret) % 12;
                if (state.hideSemitones && !NATURAL_INDICES.includes(noteIndex)) {
                    continue;
                }
                if (s.noteFilter.length > 0 && !s.noteFilter.includes(noteIndex)) {
                    continue;
                }
                possiblePositions.push({ string, fret, noteIndex });
            }
        }

        if (possiblePositions.length === 0) {
            fretboardPositionHintEl.textContent = '条件に合う音が見つかりません';
            fretboardContainer.innerHTML = ''; // Clear fretboard
            return;
        }

        const randomPosition = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
        s.targetString = randomPosition.string;
        s.targetFret = randomPosition.fret;
        s.targetNoteIndex = randomPosition.noteIndex;

        s.fretViewStart = s.targetFret > 12 ? 12 : 0;
        if (s.targetFret === 0) {
            fretboardQuestionTextEl.innerHTML = 'この<strong class="text-blue-600">開放弦</strong>の音名は何でしょう？';
            fretboardPositionHintEl.textContent = `${s.targetString + 1}弦 開放`;
        } else {
            fretboardQuestionTextEl.textContent = 'この場所の音名は何でしょう？';
            fretboardPositionHintEl.textContent = `${s.targetString + 1}弦 ${s.targetFret}フレット`;
        }
        fretboardNextBtn.disabled = true;
        if (!s.hideFretboard) {
            drawFretboard();
        } else {
            fretboardContainer.innerHTML = '';
        }
        const midiNote = BASE_MIDI_NOTES[s.targetString] + s.targetFret;
        playTone(midiNote);
    }

    function generateSolfegeQuestion() {
        const s = state.solfege;
        if(state.hideSemitones) {
            const randomIndex = Math.floor(Math.random() * NATURAL_INDICES.length);
            s.targetNoteIndex = NATURAL_INDICES[randomIndex];
        } else {
            s.targetNoteIndex = Math.floor(Math.random() * 12);
        }

        if (state.noteNameSystem === 'english') {
            solfegeQuestionTextEl.textContent = 'この音名を英語表記にすると？';
            solfegeQuestionEl.textContent = NOTES_SOLFEGE_ENHARMONIC[s.targetNoteIndex];
        } else {
            solfegeQuestionTextEl.textContent = 'この音名をドレミ表記にすると？';
            solfegeQuestionEl.textContent = NOTES_ENHARMONIC[s.targetNoteIndex];
        }
        solfegeNextBtn.disabled = true;
        fretboardPositionHintEl.textContent = '';
        const midiNote = 60 + s.targetNoteIndex;
        playTone(midiNote);
    }
    
    function handleAnswerClick(event) {
        if (!state.isQuizActive) return;
        const clickedButton = event.currentTarget;
        const clickedNoteIndex = parseInt(clickedButton.dataset.noteIndex);
        playTone(60 + clickedNoteIndex);
        const targetNoteIndex = state.currentQuiz === 'fretboard' ? state.fretboard.targetNoteIndex : state.solfege.targetNoteIndex;
        const isCorrect = clickedNoteIndex === targetNoteIndex;
        
        state.isQuizActive = false;
        disableAnswerButtons();

        if (isCorrect) {
            if(state.currentQuiz === 'fretboard') {
                state.fretboard.score++;
                fretboardScoreEl.textContent = state.fretboard.score;
            } else {
                state.solfege.score++;
                solfegeScoreEl.textContent = state.solfege.score;
            }
            showMessage('正解！', 'text-green-600');
            clickedButton.classList.add('correct');
        } else {
            const correctNoteName = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC[targetNoteIndex] : NOTES_SOLFEGE_ENHARMONIC[targetNoteIndex];
            showMessage(`不正解... 正解は ${correctNoteName}`, 'text-red-600');
            clickedButton.classList.add('incorrect');
            const correctButton = answerButtonsContainer.querySelector(`[data-note-index='${targetNoteIndex}']`);
            if (correctButton) correctButton.classList.add('correct');
        }
        
        if (state.currentQuiz === 'fretboard') {
            fretboardNextBtn.disabled = false;
        } else {
            solfegeNextBtn.disabled = false;
        }
    }

    // --- UIヘルパー ---
    function updateAnswerButtons() {
        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach((btn, index) => {
            btn.textContent = noteArray[index];
            if(state.hideSemitones && !NATURAL_INDICES.includes(index)) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        });
        answerButtonsContainer.classList.toggle('md:grid-cols-7', state.hideSemitones);
        answerButtonsContainer.classList.toggle('md:grid-cols-6', !state.hideSemitones);
    }

    function createAnswerButtons() {
        NOTES_ENHARMONIC.forEach((note, index) => {
            const button = document.createElement('button');
            button.dataset.noteIndex = index;
            button.classList.add('btn', 'answer-btn');
            button.addEventListener('click', handleAnswerClick);
            answerButtonsContainer.appendChild(button);
        });
        updateAnswerButtons();
    }

    function resetAnswerButtons() {
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
    }
    
    function disableAnswerButtons() {
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach(btn => {
            if(!btn.classList.contains('hidden')) {
               btn.disabled = true;
            }
        });
    }

    function showMessage(text, className) {
        messageEl.textContent = text;
        messageEl.className = `text-xl h-8 font-semibold transition-opacity duration-300 ${className} opacity-100`;
    }

    function hideMessage() {
        messageEl.textContent = '';
        messageEl.classList.add('opacity-0');
    }
    
    function switchTab(tabName) {
        state.currentQuiz = tabName;
        if (tabName === 'fretboard') {
            tabFretboard.classList.add('tab-active');
            tabSolfege.classList.remove('tab-active');
            fretboardQuizContainer.classList.remove('hidden');
            solfegeQuizContainer.classList.add('hidden');
            fretboardNextBtn.classList.remove('hidden');
            solfegeNextBtn.classList.add('hidden');
        } else {
            tabFretboard.classList.remove('tab-active');
            tabSolfege.classList.add('tab-active');
            fretboardQuizContainer.classList.add('hidden');
            solfegeQuizContainer.classList.remove('hidden');
            fretboardNextBtn.classList.add('hidden');
            solfegeNextBtn.classList.remove('hidden');
        }
        generateQuestion();
    }

    function updateNoteFilterBtnText() {
        const filter = state.fretboard.noteFilter;
        if (filter.length === 0 || filter.length === NATURAL_INDICES.length) {
            noteFilterOpenBtn.textContent = '音名を絞って出題';
            noteFilterOpenBtn.classList.remove('active-mode');
        } else {
            const selectedNotes = filter.map(index => NATURAL_NOTES[NATURAL_INDICES.indexOf(index)]).join(', ');
            noteFilterOpenBtn.textContent = `絞り込み: ${selectedNotes}`;
            noteFilterOpenBtn.classList.add('active-mode');
        }
    }
    
    // --- 初期化 ---
    function init() {
        document.body.addEventListener('click', initAudioAndLoadSounds, { once: true });
        createAnswerButtons();
        
        // --- Note Filter Modal ---
        NATURAL_INDICES.forEach(noteIndex => {
            const note = NOTES_ENHARMONIC[noteIndex].split('(')[0];
            const button = document.createElement('button');
            button.dataset.noteIndex = noteIndex;
            button.textContent = note;
            button.classList.add('btn', 'option-btn');
            noteFilterButtons.appendChild(button);
        });

        noteFilterOpenBtn.addEventListener('click', () => noteFilterModal.classList.replace('hidden', 'flex'));
        noteFilterCloseBtn.addEventListener('click', () => {
            noteFilterModal.classList.replace('flex', 'hidden');
            generateQuestion();
        });
        noteFilterClearBtn.addEventListener('click', () => {
            state.fretboard.noteFilter = [];
            noteFilterButtons.querySelectorAll('button').forEach(btn => btn.classList.remove('active-mode'));
            updateNoteFilterBtnText();
        });
        noteFilterButtons.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const noteIndex = parseInt(target.dataset.noteIndex);
            target.classList.toggle('active-mode');
            if (state.fretboard.noteFilter.includes(noteIndex)) {
                state.fretboard.noteFilter = state.fretboard.noteFilter.filter(i => i !== noteIndex);
            } else {
                state.fretboard.noteFilter.push(noteIndex);
            }
            updateNoteFilterBtnText();
        });

        // --- Other Event Listeners ---
        fretboardNextBtn.addEventListener('click', generateQuestion);
        solfegeNextBtn.addEventListener('click', generateQuestion);
        tabFretboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('fretboard'); });
        tabSolfege.addEventListener('click', (e) => { e.preventDefault(); switchTab('solfege'); });

        fretboardContainer.addEventListener('click', () => {
            if (state.fretboard.hideFretboard) return;
            const { targetString, targetFret } = state.fretboard;
            if (targetString !== -1 && targetFret !== -1) {
                const midiNote = BASE_MIDI_NOTES[targetString] + targetFret;
                playTone(midiNote);
            }
        });
        
        solfegeQuestionEl.addEventListener('click', () => {
            const { targetNoteIndex } = state.solfege;
            if (targetNoteIndex !== -1) playTone(60 + targetNoteIndex);
        });

        stringModeSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;
            const mode = target.dataset.mode;
            
            if (mode === 'all') {
                state.fretboard.selectedStrings = [];
                stringModeSelector.querySelectorAll('.active-mode').forEach(btn => btn.classList.remove('active-mode'));
                target.classList.add('active-mode');
            } else {
                stringModeSelector.querySelector('[data-mode="all"]').classList.remove('active-mode');
                target.classList.toggle('active-mode');
                const stringNum = parseInt(mode, 10);
                if (state.fretboard.selectedStrings.includes(stringNum)) {
                    state.fretboard.selectedStrings = state.fretboard.selectedStrings.filter(s => s !== stringNum);
                } else {
                    state.fretboard.selectedStrings.push(stringNum);
                }
            }
            generateQuestion();
        });

        fretboardQuizRangeSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn[data-quiz-range]');
            if (!target) return;
            fretboardQuizRangeSelector.querySelector('.active-mode').classList.remove('active-mode');
            target.classList.add('active-mode');
            state.fretboard.quizFretRange = target.dataset.quizRange;
            generateQuestion();
        });

        fretboardDisplayOptionsSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;
            if (target.id === 'toggle-open-strings-btn') {
                state.showOpenStrings = !state.showOpenStrings;
                target.classList.toggle('active-mode', state.showOpenStrings);
                if(!state.fretboard.hideFretboard) drawFretboard();
            } else if (target.id === 'toggle-fretboard-visibility-btn') {
                state.fretboard.hideFretboard = !state.fretboard.hideFretboard;
                target.classList.toggle('active-mode', state.fretboard.hideFretboard);
                fretboardContainer.parentElement.classList.toggle('hidden', state.fretboard.hideFretboard);
                target.textContent = state.fretboard.hideFretboard ? '指板を表示' : '指板を隠す';
                if (!state.fretboard.hideFretboard) {
                    drawFretboard();
                }
            }
        });

        commonOptionsSelector.addEventListener('click', (e) => {
             const target = e.target.closest('.option-btn');
            if (!target) return;
            if (target.id === 'toggle-note-name-btn') {
                state.noteNameSystem = state.noteNameSystem === 'english' ? 'solfege' : 'english';
                target.classList.toggle('active-mode', state.noteNameSystem === 'solfege');
                if (state.noteNameSystem === 'solfege') {
                    target.textContent = 'CDE→ドレミ';
                } else {
                    target.textContent = 'ドレミ→CDE';
                }
                updateAnswerButtons();
                if (state.currentQuiz === 'fretboard') {
                    if (!state.fretboard.hideFretboard) drawFretboard(); 
                } else {
                    generateQuestion();
                }
            } else if (target.id === 'toggle-semitones-btn') {
                state.hideSemitones = !state.hideSemitones;
                target.classList.toggle('active-mode', state.hideSemitones);
                updateAnswerButtons();
                generateQuestion();
            } else if (target.id === 'toggle-sound-btn') {
                state.isSoundEnabled = !state.isSoundEnabled;
                target.classList.toggle('active-mode', state.isSoundEnabled);
                target.textContent = state.isSoundEnabled ? 'サウンドON' : 'サウンドOFF';
            }
        });
        
        switchTab(state.currentQuiz);
    }

    init();
});

