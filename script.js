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
    const DISPLAY_FRET_COUNT = 12; // クイズ用
    const KEY_VIEWER_FRET_COUNT = 24; // キー確認用
    const FRET_NUM_AREA_HEIGHT = 30;

    // --- スケール定義 (ルート音からの半音のインターバル) ---
    const SCALES = {
        major: { name: 'メジャー', intervals: [0, 2, 4, 5, 7, 9, 11] },
        minor: { name: 'ナチュラルマイナー', intervals: [0, 2, 3, 5, 7, 8, 10] },
        major_pentatonic: { name: 'メジャーペンタトニック', intervals: [0, 2, 4, 7, 9] },
        minor_pentatonic: { name: 'マイナーペンタトニック', intervals: [0, 3, 5, 7, 10] }
    };

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
    const tabKeyViewer = document.getElementById('tab-key-viewer');
    const fretboardQuizContainer = document.getElementById('fretboard-quiz-container');
    const solfegeQuizContainer = document.getElementById('solfege-quiz-container');
    const keyViewerContainer = document.getElementById('key-viewer-container');
    const answerArea = document.getElementById('answer-area');
    const commonOptionsArea = document.getElementById('common-options-area');
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

    // Key Viewer DOM elements
    const keyViewerRootSelector = document.getElementById('key-viewer-root-selector');
    const keyViewerScaleSelector = document.getElementById('key-viewer-scale-selector');
    const keyViewerFretboardContainer = document.getElementById('key-viewer-fretboard-container');
    const loupeContainer = document.getElementById('loupe-container'); // 追加
    const keyViewerTitle = document.getElementById('key-viewer-title');
    const keyViewerPlayScaleBtn = document.getElementById('key-viewer-play-scale-btn');

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
        },

        keyViewer: {
            rootNoteIndex: 0, // 0 = C
            scaleType: 'major',
            isPlaying: false
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
        } catch (e) {
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
                .catch(error => { });
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
            stringLine.setAttribute('x1', FRET_WIDTH / 2); stringLine.setAttribute('y1', y);
            stringLine.setAttribute('x2', totalWidth - FRET_WIDTH / 2); stringLine.setAttribute('y2', y);
            stringLine.setAttribute('stroke', isStringActive ? '#6b7280' : '#d1d5db');
            stringLine.setAttribute('stroke-width', 1.5 + stringIndex * 0.4);
            svg.appendChild(stringLine);
        }
        const fretNumGroup = document.createElementNS(svgNS, 'g');
        fretNumGroup.setAttribute('transform', `translate(0, ${fretboardHeight})`);
        for (let i = 1; i <= DISPLAY_FRET_COUNT; i++) {
            const currentFret = fretViewStart + i;
            if (currentFret === 0) continue;
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

    function drawKeyViewerFretboard() {
        const { rootNoteIndex, scaleType } = state.keyViewer;
        const scaleDef = SCALES[scaleType];

        // --- 構成音のインデックス（0〜11）を算出 ---
        const scaleNoteIndices = scaleDef.intervals.map(interval => (rootNoteIndex + interval) % 12);

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const fretboardHeight = STRING_COUNT * FRET_HEIGHT;
        const totalWidth = (KEY_VIEWER_FRET_COUNT + 1) * FRET_WIDTH;
        const totalHeight = fretboardHeight + FRET_NUM_AREA_HEIGHT;
        svg.setAttribute('width', '100%');
        // SVGが親要素にフィットするようにviewBoxを設定し、高さを自動計算
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
        svg.style.backgroundColor = '#E3C6A4';
        svg.style.height = 'auto';
        svg.style.maxHeight = '400px';

        // --- ベースの指板描画（クイズ用とほぼ同じ機能） ---
        for (let i = 0; i <= KEY_VIEWER_FRET_COUNT; i++) {
            const x = (i + 0.5) * FRET_WIDTH;
            if (i === 0) {
                const nut = document.createElementNS(svgNS, 'rect');
                nut.setAttribute('x', x - 4); nut.setAttribute('y', 0);
                nut.setAttribute('width', 8); nut.setAttribute('height', fretboardHeight);
                nut.setAttribute('fill', '#d1d5db'); svg.appendChild(nut);
            } else {
                const fretLine = document.createElementNS(svgNS, 'line');
                fretLine.setAttribute('x1', x); fretLine.setAttribute('y1', 0);
                fretLine.setAttribute('x2', x); fretLine.setAttribute('y2', fretboardHeight);
                fretLine.setAttribute('stroke', '#9ca3af');
                fretLine.setAttribute('stroke-width', i === 12 || i === 24 ? '5' : '3');
                svg.appendChild(fretLine);
            }
            if (POSITION_MARKERS.includes(i) && i !== 0) {
                const marker = document.createElementNS(svgNS, 'circle');
                const markerX = x - FRET_WIDTH / 2; let markerY = fretboardHeight / 2;
                marker.setAttribute('cx', markerX); marker.setAttribute('cy', markerY);
                marker.setAttribute('r', '6'); marker.setAttribute('fill', '#000000');
                marker.setAttribute('fill-opacity', '0.2');
                if (i === 12 || i === 24) {
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
            stringLine.setAttribute('x1', FRET_WIDTH / 2); stringLine.setAttribute('y1', y);
            stringLine.setAttribute('x2', totalWidth - FRET_WIDTH / 2); stringLine.setAttribute('y2', y);
            stringLine.setAttribute('stroke', '#6b7280');
            stringLine.setAttribute('stroke-width', 1.5 + i * 0.4);
            svg.appendChild(stringLine);
        }
        const fretNumGroup = document.createElementNS(svgNS, 'g');
        fretNumGroup.setAttribute('transform', `translate(0, ${fretboardHeight})`);
        for (let i = 1; i <= KEY_VIEWER_FRET_COUNT; i++) {
            const x = i * FRET_WIDTH; const y = (FRET_NUM_AREA_HEIGHT / 2) + 5;
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', x); text.setAttribute('y', y);
            text.setAttribute('fill', '#6b7280'); text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', '600'); text.setAttribute('text-anchor', 'middle');
            text.textContent = i; fretNumGroup.appendChild(text);
        }
        svg.appendChild(fretNumGroup);

        // --- 全弦・全フレットを走査して対象ノートをマッピング ---
        const noteArray = state.noteNameSystem === 'solfege' ? NOTES_SOLFEGE_ENHARMONIC : NOTES_ENHARMONIC;

        for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
            const openNoteIndex = TUNING[stringIdx];
            for (let fret = 0; fret <= KEY_VIEWER_FRET_COUNT; fret++) {
                const currentNoteIndex = (openNoteIndex + fret) % 12;

                // このフレットの音がスケールに含まれているか？
                if (scaleNoteIndices.includes(currentNoteIndex)) {
                    const isRoot = currentNoteIndex === rootNoteIndex;
                    const cx = fret === 0 ? (0.25) * FRET_WIDTH : fret * FRET_WIDTH;
                    const cy = (stringIdx + 0.5) * FRET_HEIGHT;

                    const g = document.createElementNS(svgNS, "g");
                    g.classList.add('scale-marker');
                    // クリックで音を鳴らすためのデータ属性
                    g.dataset.midiNote = BASE_MIDI_NOTES[stringIdx] + fret;
                    // iOS等でのタッチ・クリック反応エリア
                    g.style.cursor = 'pointer';
                    // Safari / 旧ブラウザ等で確実に中心を原点にするためインライン指定
                    g.style.transformOrigin = `${cx}px ${cy}px`;

                    const circle = document.createElementNS(svgNS, 'circle');
                    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
                    // 初期サイズを保持
                    const defaultR = FRET_HEIGHT * 0.4;
                    circle.setAttribute('r', defaultR);
                    // SVGのtransition (属性値の変更にアニメーションを効かせる)
                    circle.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    // ルート音なら色を変える赤系、それ以外は青系
                    if (isRoot) {
                        circle.setAttribute('fill', '#ef4444'); // Tailwind red-500
                    } else {
                        circle.setAttribute('fill', '#3b82f6'); // Tailwind blue-500
                    }

                    const text = document.createElementNS(svgNS, 'text');
                    text.setAttribute('x', cx); text.setAttribute('y', cy + 4.5); // 中央より少し下に調整
                    text.setAttribute('fill', '#ffffff');
                    const defaultFontSize = 11;
                    text.setAttribute('font-size', defaultFontSize);
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('text-anchor', 'middle');
                    text.style.pointerEvents = 'none'; // テキスト自体はホバー判定しないように
                    text.textContent = noteArray[currentNoteIndex].replace(/\(.+\)/, '');

                    g.appendChild(circle);
                    g.appendChild(text);
                    svg.appendChild(g);
                }
            }
        }

        // ヘッダータイトルの更新
        const rootNoteName = noteArray[rootNoteIndex].replace(/\(.+\)/, '');
        keyViewerTitle.textContent = `${rootNoteName} ${scaleDef.name}`;

        keyViewerFretboardContainer.innerHTML = '';
        keyViewerFretboardContainer.appendChild(svg);

        setupLoupeInteraction(keyViewerFretboardContainer); // ルーペイベントのセットアップ
    }

    // --- ルーペ機能 ---
    function setupLoupeInteraction(container) {
        if (!loupeContainer) return;

        // すでに登録されているかもしれないイベントを消すための簡易対応としてクローンリプレイスはせずにフラグ管理
        container.onmouseenter = (e) => {
            loupeContainer.classList.remove('hidden');
        };

        container.onmouseleave = (e) => {
            loupeContainer.classList.add('hidden');
        };

        container.onmousemove = (e) => {
            if (loupeContainer.classList.contains('hidden')) return;

            const rect = container.getBoundingClientRect();
            // コンテナ内のスクロール量も加味してマウスの相対位置を計算
            const containerScrollLeft = container.parentNode.scrollLeft || 0;
            const mouseX = e.clientX - rect.left + containerScrollLeft;
            const mouseY = e.clientY - rect.top;

            // FRET_WIDTH等に基づいて、今マウスが何フレット付近にいるか算出
            let currentFret = Math.floor(mouseX / FRET_WIDTH);
            if (currentFret < 0) currentFret = 0;
            if (currentFret > KEY_VIEWER_FRET_COUNT) currentFret = KEY_VIEWER_FRET_COUNT;

            // ★表示範囲と倍率をルーペとして美しく見える値に調整
            const LOUPE_SCALE = 1.6;
            const fretRange = 2; // 前後2フレット(計5フレット)

            const viewBoxFretStart = Math.max(0, currentFret - fretRange);
            const viewBoxFretEnd = Math.min(KEY_VIEWER_FRET_COUNT, currentFret + fretRange);

            // 描画すべき元の座標系での幅と高さ (実寸)
            const viewWidth = (viewBoxFretEnd - viewBoxFretStart + 1) * FRET_WIDTH;
            const viewHeight = STRING_COUNT * FRET_HEIGHT + FRET_NUM_AREA_HEIGHT;

            // 表示するDOM要素のサイズを拡大倍率に合わせて計算
            const loupeWidth = viewWidth * LOUPE_SCALE;
            const loupeHeight = viewHeight * LOUPE_SCALE;

            loupeContainer.style.width = `${loupeWidth}px`;
            loupeContainer.style.height = `${loupeHeight}px`;

            // 要素全体にかぶさるように独立させた(fixed)ため、ブラウザ内のビューポート座標を直接扱う。
            // マウスカーソルより少し上にポップさせる。
            let loupeLeft = e.clientX - (loupeWidth / 2);
            let loupeTop = e.clientY - (loupeHeight / 2) - 70;

            // 画面外に見切れないようにする処理
            if (loupeLeft < 10) loupeLeft = 10;
            if (loupeLeft + loupeWidth > window.innerWidth - 10) loupeLeft = window.innerWidth - loupeWidth - 10;
            if (loupeTop < 10) loupeTop = 10;

            loupeContainer.style.left = `${loupeLeft}px`;
            loupeContainer.style.top = `${loupeTop}px`;

            // ルーペの中身（拡大SVG）を描画
            drawLoupeContent(viewBoxFretStart, viewBoxFretEnd, viewWidth, viewHeight);
        };
    }

    function drawLoupeContent(viewBoxFretStart, viewBoxFretEnd, viewWidth, viewHeight) {
        if (!loupeContainer) return;

        // 開始X座標
        const viewStartX = viewBoxFretStart * FRET_WIDTH;

        const { rootNoteIndex, scaleType } = state.keyViewer;
        const scaleDef = SCALES[scaleType];
        const scaleNoteIndices = scaleDef.intervals.map(interval => (rootNoteIndex + interval) % 12);
        const noteArray = state.noteNameSystem === 'solfege' ? NOTES_SOLFEGE_ENHARMONIC : NOTES_ENHARMONIC;

        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");

        // viewBoxで特定区間だけ切り出す。
        svg.setAttribute('viewBox', `${viewStartX} 0 ${viewWidth} ${viewHeight}`);
        // コンテナのサイズにフィットさせ、見切れを防ぐための設定追加
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.style.backgroundColor = '#E3C6A4';

        const fretboardHeight = STRING_COUNT * FRET_HEIGHT;

        // 指板の線描画
        for (let i = viewBoxFretStart; i <= viewBoxFretEnd; i++) {
            const x = (i + 0.5) * FRET_WIDTH;
            if (i === 0) {
                const nut = document.createElementNS(svgNS, 'rect');
                nut.setAttribute('x', x - 4); nut.setAttribute('y', 0);
                nut.setAttribute('width', 8); nut.setAttribute('height', fretboardHeight);
                nut.setAttribute('fill', '#d1d5db'); svg.appendChild(nut);
            } else {
                const fretLine = document.createElementNS(svgNS, 'line');
                fretLine.setAttribute('x1', x); fretLine.setAttribute('y1', 0);
                fretLine.setAttribute('x2', x); fretLine.setAttribute('y2', fretboardHeight);
                fretLine.setAttribute('stroke', '#9ca3af');
                fretLine.setAttribute('stroke-width', i === 12 || i === 24 ? '5' : '3');
                svg.appendChild(fretLine);
            }
            if (POSITION_MARKERS.includes(i) && i !== 0) {
                const marker = document.createElementNS(svgNS, 'circle');
                const markerX = x - FRET_WIDTH / 2; let markerY = fretboardHeight / 2;
                marker.setAttribute('cx', markerX); marker.setAttribute('cy', markerY);
                marker.setAttribute('r', '6'); marker.setAttribute('fill', '#000000');
                marker.setAttribute('fill-opacity', '0.2');
                if (i === 12 || i === 24) {
                    const marker2 = marker.cloneNode();
                    marker.setAttribute('cy', markerY - FRET_HEIGHT);
                    marker2.setAttribute('cy', markerY + FRET_HEIGHT);
                    svg.appendChild(marker2);
                }
                svg.appendChild(marker);
            }
        }

        // 弦の描画
        for (let i = 0; i < STRING_COUNT; i++) {
            const y = (i + 0.5) * FRET_HEIGHT;
            const stringLine = document.createElementNS(svgNS, 'line');
            stringLine.setAttribute('x1', viewStartX); stringLine.setAttribute('y1', y);
            stringLine.setAttribute('x2', viewStartX + viewWidth); stringLine.setAttribute('y2', y);
            stringLine.setAttribute('stroke', '#6b7280');
            stringLine.setAttribute('stroke-width', 1.5 + i * 0.4);
            svg.appendChild(stringLine);
        }

        // フレット番号
        const fretNumGroup = document.createElementNS(svgNS, 'g');
        fretNumGroup.setAttribute('transform', `translate(0, ${fretboardHeight})`);
        for (let i = viewBoxFretStart; i <= viewBoxFretEnd; i++) {
            if (i === 0) continue;
            const x = i * FRET_WIDTH; const y = (FRET_NUM_AREA_HEIGHT / 2) + 5;
            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', x); text.setAttribute('y', y);
            text.setAttribute('fill', '#6b7280'); text.setAttribute('font-size', '14');
            text.setAttribute('font-weight', '600'); text.setAttribute('text-anchor', 'middle');
            text.textContent = i; fretNumGroup.appendChild(text);
        }
        svg.appendChild(fretNumGroup);

        // マーカーの描画
        for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
            const openNoteIndex = TUNING[stringIdx];
            for (let fret = viewBoxFretStart; fret <= viewBoxFretEnd; fret++) {
                const currentNoteIndex = (openNoteIndex + fret) % 12;
                if (scaleNoteIndices.includes(currentNoteIndex)) {
                    const isRoot = currentNoteIndex === rootNoteIndex;
                    const cx = fret === 0 ? (0.25) * FRET_WIDTH : fret * FRET_WIDTH;
                    const cy = (stringIdx + 0.5) * FRET_HEIGHT;

                    const g = document.createElementNS(svgNS, "g");
                    const circle = document.createElementNS(svgNS, 'circle');
                    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
                    circle.setAttribute('r', FRET_HEIGHT * 0.4);
                    circle.setAttribute('fill', isRoot ? '#ef4444' : '#3b82f6');

                    const text = document.createElementNS(svgNS, 'text');
                    text.setAttribute('x', cx); text.setAttribute('y', cy + 5);
                    text.setAttribute('fill', '#ffffff');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('text-anchor', 'middle');
                    text.textContent = noteArray[currentNoteIndex].replace(/\(.+\)/, '');

                    g.appendChild(circle);
                    g.appendChild(text);
                    svg.appendChild(g);
                }
            }
        }

        loupeContainer.innerHTML = '';
        loupeContainer.appendChild(svg);
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

        // OVERRIDE: Only 5th string open and 5th string 5th fret
        // 5th string is index 4 in TUNING array (0-indexed, where 0 is 1st string)
        console.log("Generating restricted question: 5th string Open or 5th Fret");
        possiblePositions = [
            { string: 4, fret: 0, noteIndex: (TUNING[4] + 0) % 12 }, // 5th string open (A)
            { string: 4, fret: 5, noteIndex: (TUNING[4] + 5) % 12 }  // 5th string 5th fret (D)
        ];

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
        if (state.hideSemitones) {
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
            if (state.currentQuiz === 'fretboard') {
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
            if (state.hideSemitones && !NATURAL_INDICES.includes(index)) {
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
            if (!btn.classList.contains('hidden')) {
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
        // Reset state for all tabs first
        tabFretboard.classList.remove('tab-active');
        tabSolfege.classList.remove('tab-active');
        tabKeyViewer.classList.remove('tab-active');
        fretboardQuizContainer.classList.add('hidden');
        solfegeQuizContainer.classList.add('hidden');
        keyViewerContainer.classList.add('hidden');
        fretboardNextBtn.classList.add('hidden');
        solfegeNextBtn.classList.add('hidden');

        // Key Viewerの場合は回答エリア・問題関連エリアを隠す
        const isNotKeyViewer = tabName !== 'keyViewer';
        answerArea.classList.toggle('hidden', !isNotKeyViewer);
        // hideSemitonesボタンはキー表示では使わないため表示切り替え
        const semitonesBtn = document.getElementById('toggle-semitones-btn');
        if (semitonesBtn) semitonesBtn.parentElement.classList.toggle('hidden', !isNotKeyViewer);

        if (tabName === 'fretboard') {
            tabFretboard.classList.add('tab-active');
            fretboardQuizContainer.classList.remove('hidden');
            fretboardNextBtn.classList.remove('hidden');
            generateQuestion();
        } else if (tabName === 'solfege') {
            tabSolfege.classList.add('tab-active');
            solfegeQuizContainer.classList.remove('hidden');
            solfegeNextBtn.classList.remove('hidden');
            generateQuestion();
        } else if (tabName === 'keyViewer') {
            tabKeyViewer.classList.add('tab-active');
            keyViewerContainer.classList.remove('hidden');
            drawKeyViewerFretboard();
        }
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
        tabKeyViewer.addEventListener('click', (e) => { e.preventDefault(); switchTab('keyViewer'); });

        // Key Viewer Setup
        NOTES_ENHARMONIC.forEach((note, index) => {
            const btn = document.createElement('button');
            // Cをデフォルトでアクティブに
            if (index === 0) btn.classList.add('active-mode');
            btn.classList.add('btn', 'option-btn');
            btn.dataset.rootIndex = index;
            // 簡略化して表示
            btn.textContent = note.replace(/\(.+\)/, '');
            keyViewerRootSelector.appendChild(btn);
        });

        keyViewerRootSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;
            keyViewerRootSelector.querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
            target.classList.add('active-mode');
            state.keyViewer.rootNoteIndex = parseInt(target.dataset.rootIndex);
            drawKeyViewerFretboard();
        });

        keyViewerScaleSelector.addEventListener('click', (e) => {
            const target = e.target.closest('.option-btn');
            if (!target) return;
            keyViewerScaleSelector.querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
            target.classList.add('active-mode');
            state.keyViewer.scaleType = target.dataset.scale;
            drawKeyViewerFretboard();
        });

        keyViewerFretboardContainer.addEventListener('click', (e) => {
            const marker = e.target.closest('.scale-marker');
            if (marker && marker.dataset.midiNote) {
                playTone(parseInt(marker.dataset.midiNote));
            }
        });

        keyViewerPlayScaleBtn.addEventListener('click', async () => {
            if (state.keyViewer.isPlaying || !state.isSoundEnabled || !audioContext) return;
            state.keyViewer.isPlaying = true;
            keyViewerPlayScaleBtn.disabled = true;
            keyViewerPlayScaleBtn.classList.add('opacity-50', 'cursor-not-allowed');

            const { rootNoteIndex, scaleType } = state.keyViewer;
            const scaleDef = SCALES[scaleType];

            // ルート音 (ここでは中央のC付近 = MIDI 60を基準とする)
            let baseMidi = 60;
            // C = 0〜B = 11。もしルートがC以上なら足すだけだが、音域的に調整するかも
            // シンプルに C4(60) を基準に足していく
            const rootMidi = 60 + rootNoteIndex;

            const scaleNotes = scaleDef.intervals.map(interval => rootMidi + interval);
            // 最後に1オクターブ上のルート音も追加
            scaleNotes.push(rootMidi + 12);

            for (let i = 0; i < scaleNotes.length; i++) {
                playTone(scaleNotes[i]);
                // 300ms待つ
                await new Promise(resolve => setTimeout(resolve, 300));
            }

            state.keyViewer.isPlaying = false;
            keyViewerPlayScaleBtn.disabled = false;
            keyViewerPlayScaleBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        });

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
                if (!state.fretboard.hideFretboard) drawFretboard();
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
                } else if (state.currentQuiz === 'keyViewer') {
                    drawKeyViewerFretboard();
                    // ルートUIのラベルも更新する
                    updateKeyViewerRootLabels();
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

    function updateKeyViewerRootLabels() {
        const noteArray = state.noteNameSystem === 'solfege' ? NOTES_SOLFEGE_ENHARMONIC : NOTES_ENHARMONIC;
        keyViewerRootSelector.querySelectorAll('button').forEach((btn, index) => {
            btn.textContent = noteArray[index].replace(/\(.+\)/, '');
        });
        const rootNoteName = noteArray[state.keyViewer.rootNoteIndex].replace(/\(.+\)/, '');
        const scaleDef = SCALES[state.keyViewer.scaleType];
        keyViewerTitle.textContent = `${rootNoteName} ${scaleDef.name}`;
    }

    init();
});

