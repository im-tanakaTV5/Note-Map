document.addEventListener('DOMContentLoaded', () => {
    // --- 定数と設定 ---
    const NOTES_ENHARMONIC = ['C', 'C#(Db)', 'D', 'D#(Eb)', 'E', 'F', 'F#(Gb)', 'G', 'G#(Ab)', 'A', 'A#(Bb)', 'B'];
    const NOTES_SOLFEGE_ENHARMONIC = ['ド', 'ド#(レb)', 'レ', 'レ#(ミb)', 'ミ', 'ファ', 'ファ#(ソb)', 'ソ', 'ソ#(ラb)', 'ラ', 'ラ#(シb)', 'シ'];
    const SHARP_NOTE_INDICES = [1, 3, 6, 8, 10];
    const TUNING = [4, 11, 7, 2, 9, 4]; 
    const FRET_COUNT = 24;
    const STRING_COUNT = 6;
    const FRET_WIDTH = 80;
    const FRET_HEIGHT = 35;
    const POSITION_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
    const DISPLAY_FRET_COUNT = 12;
    const FRET_NUM_AREA_HEIGHT = 30;

    // --- DOM要素 ---
    const messageEl = document.getElementById('message');
    const answerButtonsContainer = document.getElementById('answer-buttons');

    // Tabs
    const tabFretboard = document.getElementById('tab-fretboard');
    const tabSolfege = document.getElementById('tab-solfege');
    const fretboardQuizContainer = document.getElementById('fretboard-quiz-container');
    const solfegeQuizContainer = document.getElementById('solfege-quiz-container');

    // Fretboard Quiz UI
    const fretboardContainer = document.getElementById('fretboard-container');
    const fretboardScoreEl = document.getElementById('fretboard-score');
    const fretboardNextBtn = document.getElementById('fretboard-next-btn');
    const stringModeSelector = document.getElementById('string-mode-selector');
    const fretboardQuizOptionsSelector = document.getElementById('fretboard-quiz-options-selector');
    const fretboardDisplayOptionsSelector = document.getElementById('fretboard-display-options-selector');
    const fretboardQuestionTextEl = document.getElementById('fretboard-question-area').querySelector('p');

    // Solfege Quiz UI
    const solfegeScoreEl = document.getElementById('solfege-score');
    const solfegeNextBtn = document.getElementById('solfege-next-btn');
    const solfegeQuestionEl = document.getElementById('solfege-question');
    const solfegeQuestionTextEl = solfegeQuizContainer.querySelector('p');

    // Common Options
    const commonOptionsSelector = document.getElementById('common-options-selector');
    
    // --- アプリケーションの状態 ---
    let state = {
        currentQuiz: 'fretboard',
        isQuizActive: true,
        showOpenStrings: false,
        noteNameSystem: 'english', 

        fretboard: {
            score: 0,
            targetString: -1,
            targetFret: -1,
            targetNoteIndex: -1,
            selectedStrings: ['all'],
            quizFretRange: '1-12',
            fretViewStart: 0,
            excludeSharps: false,
        },

        solfege: {
            score: 0,
            targetNoteIndex: -1,
        }
    };

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
            const stringNumber = stringIndex + 1;
            const isStringActive = selectedStrings.includes('all') || selectedStrings.includes(stringNumber);
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
        let isSharp;
        do {
            if (s.selectedStrings.includes('all')) {
                s.targetString = Math.floor(Math.random() * STRING_COUNT);
            } else {
                const randomStringNumber = s.selectedStrings[Math.floor(Math.random() * s.selectedStrings.length)];
                s.targetString = randomStringNumber - 1;
            }

            if (s.quizFretRange === '1-12') {
                s.targetFret = Math.floor(Math.random() * 13);
            } else if (s.quizFretRange === '13-24') {
                s.targetFret = 13 + Math.floor(Math.random() * 12);
            } else { // '1-24'
                s.targetFret = Math.floor(Math.random() * (FRET_COUNT + 1));
            }

            s.targetNoteIndex = (TUNING[s.targetString] + s.targetFret) % 12;
            isSharp = SHARP_NOTE_INDICES.includes(s.targetNoteIndex);

        } while (s.excludeSharps && isSharp);

        s.fretViewStart = s.targetFret > 12 ? 12 : 0;
        if (s.targetFret === 0) {
            fretboardQuestionTextEl.innerHTML = 'この<strong class="text-blue-600">開放弦</strong>の音名は何でしょう？';
        } else {
            fretboardQuestionTextEl.textContent = 'この場所の音名は何でしょう？';
        }
        fretboardNextBtn.disabled = true;
        drawFretboard();
    }

    function generateSolfegeQuestion() {
        const s = state.solfege;
        s.targetNoteIndex = Math.floor(Math.random() * 12);
        if (state.noteNameSystem === 'english') {
            solfegeQuestionTextEl.textContent = 'この音名を英語表記にすると？';
            solfegeQuestionEl.textContent = NOTES_SOLFEGE_ENHARMONIC[s.targetNoteIndex];
        } else {
            solfegeQuestionTextEl.textContent = 'この音名をドレミ表記にすると？';
            solfegeQuestionEl.textContent = NOTES_ENHARMONIC[s.targetNoteIndex];
        }
        solfegeNextBtn.disabled = true;
    }
    
    function handleAnswerClick(event) {
        if (!state.isQuizActive) return;
        const clickedButton = event.currentTarget;
        const clickedNoteIndex = parseInt(clickedButton.dataset.noteIndex);
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
            const noteArray = state.noteNameSystem === 'solfege' ? NOTES_SOLFEGE_ENHARMONIC : NOTES_ENHARMONIC;
            showMessage(`不正解... 正解は ${noteArray[targetNoteIndex]}`, 'text-red-600');
            clickedButton.classList.add('incorrect');
            answerButtonsContainer.querySelector(`[data-note-index='${targetNoteIndex}']`).classList.add('correct');
        }
        
        if (state.currentQuiz === 'fretboard') {
            fretboardNextBtn.disabled = false;
        } else {
            solfegeNextBtn.disabled = false;
        }
    }

    // --- UIヘルパー ---
    function updateAnswerButtonsText() {
        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach((btn, index) => {
            btn.textContent = noteArray[index];
        });
    }

    function updateAnswerButtonsVisibility() {
        const exclude = state.currentQuiz === 'fretboard' && state.fretboard.excludeSharps;
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach(btn => {
            const noteIndex = parseInt(btn.dataset.noteIndex, 10);
            if (exclude && SHARP_NOTE_INDICES.includes(noteIndex)) {
                btn.classList.add('hidden');
            } else {
                btn.classList.remove('hidden');
            }
        });
    }

    function createAnswerButtons() {
        NOTES_ENHARMONIC.forEach((note, index) => {
            const button = document.createElement('button');
            button.dataset.noteIndex = index;
            button.classList.add('btn', 'answer-btn');
            button.addEventListener('click', handleAnswerClick);
            answerButtonsContainer.appendChild(button);
        });
        updateAnswerButtonsText();
    }

    function resetAnswerButtons() {
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = false;
            btn.classList.remove('correct', 'incorrect');
        });
    }
    
    function disableAnswerButtons() {
        answerButtonsContainer.querySelectorAll('.answer-btn').forEach(btn => {
            btn.disabled = true;
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
        } else {
            tabFretboard.classList.remove('tab-active');
            tabSolfege.classList.add('tab-active');
            fretboardQuizContainer.classList.add('hidden');
            solfegeQuizContainer.classList.remove('hidden');
        }
        updateAnswerButtonsVisibility();
        generateQuestion();
    }
    
    // --- 初期化 ---
    function init() {
        createAnswerButtons();
        
        fretboardNextBtn.addEventListener('click', generateQuestion);
        solfegeNextBtn.addEventListener('click', generateQuestion);
        tabFretboard.addEventListener('click', (e) => { e.preventDefault(); switchTab('fretboard'); });
        tabSolfege.addEventListener('click', (e) => { e.preventDefault(); switchTab('solfege'); });

        stringModeSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;

            const mode = target.dataset.mode;
            const allStringsBtn = stringModeSelector.querySelector('[data-mode="all"]');

            if (mode === 'all') {
                state.fretboard.selectedStrings = ['all'];
                stringModeSelector.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active-mode'));
                target.classList.add('active-mode');
            } else {
                allStringsBtn.classList.remove('active-mode');
                if (state.fretboard.selectedStrings.includes('all')) {
                    state.fretboard.selectedStrings = [];
                }
                
                const stringNumber = parseInt(mode, 10);
                const index = state.fretboard.selectedStrings.indexOf(stringNumber);

                if (index > -1) {
                    state.fretboard.selectedStrings.splice(index, 1);
                    target.classList.remove('active-mode');
                } else {
                    state.fretboard.selectedStrings.push(stringNumber);
                    target.classList.add('active-mode');
                }

                if (state.fretboard.selectedStrings.length === 0) {
                    state.fretboard.selectedStrings = ['all'];
                    allStringsBtn.classList.add('active-mode');
                }
            }
            drawFretboard();
            generateQuestion();
        });

        fretboardQuizOptionsSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;

            if (target.matches('[data-quiz-range]')) {
                fretboardQuizOptionsSelector.querySelector('.active-mode[data-quiz-range]').classList.remove('active-mode');
                target.classList.add('active-mode');
                state.fretboard.quizFretRange = target.dataset.quizRange;
                generateQuestion();
            } else if (target.id === 'toggle-sharps-btn') {
                state.fretboard.excludeSharps = !state.fretboard.excludeSharps;
                target.classList.toggle('active-mode', state.fretboard.excludeSharps);
                updateAnswerButtonsVisibility();
                generateQuestion();
            }
        });

        fretboardDisplayOptionsSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;
            if (target.id === 'toggle-open-strings-btn') {
                state.showOpenStrings = !state.showOpenStrings;
                target.classList.toggle('active-mode', state.showOpenStrings);
                drawFretboard();
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

                updateAnswerButtonsText();
                
                if (state.currentQuiz === 'fretboard') {
                    drawFretboard(); 
                } else {
                    generateQuestion();
                }
            }
        });
        
        generateQuestion();
    }

    init();
});

