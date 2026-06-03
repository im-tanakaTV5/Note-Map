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

    const SCALES = {
        major: { name: 'メジャー', intervals: [0, 2, 4, 5, 7, 9, 11] },
        minor: { name: 'ナチュラルマイナー', intervals: [0, 2, 3, 5, 7, 8, 10] },
        major_pentatonic: { name: 'メジャーペンタトニック', intervals: [0, 2, 4, 7, 9] },
        minor_pentatonic: { name: 'マイナーペンタトニック', intervals: [0, 3, 5, 7, 10] },
        dorian: { name: 'ドリアン', intervals: [0, 2, 3, 5, 7, 9, 10] },
        phrygian: { name: 'フリジアン', intervals: [0, 1, 3, 5, 7, 8, 10] },
        lydian: { name: 'リディアン', intervals: [0, 2, 4, 6, 7, 9, 11] },
        mixolydian: { name: 'ミクソリディアン', intervals: [0, 2, 4, 5, 7, 9, 10] },
        locrian: { name: 'ロクリアン', intervals: [0, 1, 3, 5, 6, 8, 10] },
        harmonic_minor: { name: 'ハーモニックマイナー', intervals: [0, 2, 3, 5, 7, 8, 11] },
        melodic_minor: { name: 'メロディックマイナー', intervals: [0, 2, 3, 5, 7, 9, 11] }
    };

    const CHORDS = {
        major: { name: 'メジャー (Major)', intervals: [0, 4, 7], weight: 100 },
        minor: { name: 'マイナー (m)', intervals: [0, 3, 7], weight: 100 },
        diminished: { name: 'ディミニッシュ (dim)', intervals: [0, 3, 6], weight: 70 },
        augmented: { name: 'オーギュメント (aug)', intervals: [0, 4, 8], weight: 70 },
        sus4: { name: 'sus4', intervals: [0, 5, 7], weight: 80 },
        sus2: { name: 'sus2', intervals: [0, 2, 7], weight: 80 },
        major7: { name: 'メジャーセブンス (Maj7)', intervals: [0, 4, 7, 11], weight: 90 },
        minor7: { name: 'マイナーセブンス (m7)', intervals: [0, 3, 7, 10], weight: 90 },
        dominant7: { name: 'セブンス (7)', intervals: [0, 4, 7, 10], weight: 90 },
        minor7b5: { name: 'マイナーセブンス・フラットファイブ (m7b5)', intervals: [0, 3, 6, 10], weight: 85 },
        diminished7: { name: 'ディミニッシュセブンス (dim7)', intervals: [0, 3, 6, 9], weight: 85 },
        minorMaj7: { name: 'マイナーメジャーセブンス (mM7)', intervals: [0, 3, 7, 11], weight: 80 },
        add9: { name: 'add9', intervals: [0, 4, 7, 14], weight: 80 },
        major9: { name: 'Maj9', intervals: [0, 4, 7, 11, 14], weight: 75 },
        minor9: { name: 'm9', intervals: [0, 3, 7, 10, 14], weight: 75 },
        dominant9: { name: '9', intervals: [0, 4, 7, 10, 14], weight: 75 },
        dominant7b9: { name: '7(b9)', intervals: [0, 4, 7, 10, 13], weight: 70 },
        dominant7sharp9: { name: '7(#9)', intervals: [0, 4, 7, 10, 15], weight: 70 },
        dominant13: { name: '13', intervals: [0, 4, 7, 10, 14, 21], weight: 65 },
        minor11: { name: 'm11', intervals: [0, 3, 7, 10, 14, 17], weight: 65 },
        six: { name: '6', intervals: [0, 4, 7, 9], weight: 85 },
        minor6: { name: 'm6', intervals: [0, 3, 7, 9], weight: 85 }
    };

    // --- CAGEDシステム定義 ---
    // 各フォームのフレット範囲: 6弦上のルート音フレットからのオフセット
    // メジャースケールのボックスパターンから導出
    const CAGED_FORMS_ORDER = ['E', 'D', 'C', 'A', 'G'];
    const CAGED_FORMS = {
        E: { name: 'E Form', color: '#3b82f6', offsetMin: -1, offsetMax: 2 },
        D: { name: 'D Form', color: '#a855f7', offsetMin: 2,  offsetMax: 5 },
        C: { name: 'C Form', color: '#ef4444', offsetMin: 4,  offsetMax: 7 },
        A: { name: 'A Form', color: '#f59e0b', offsetMin: 7,  offsetMax: 10 },
        G: { name: 'G Form', color: '#22c55e', offsetMin: 9,  offsetMax: 12 },
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
    
    // Scale Finder Elements
    const tabScaleFinder = document.getElementById('tab-scale-finder');
    const scaleFinderContainer = document.getElementById('scale-finder-container');
    const scaleFinderFretboardContainer = document.getElementById('scale-finder-fretboard-container');
    const scaleFinderSelectedNotesEl = document.getElementById('scale-finder-selected-notes');
    const scaleFinderClearBtn = document.getElementById('scale-finder-clear-btn');
    const scaleFinderUndoBtn = document.getElementById('scale-finder-undo-btn');
    const scaleFinderResultsList = document.getElementById('scale-finder-results-list');
    const scaleFinderEmptyMessage = document.getElementById('scale-finder-empty-message');
    const scaleFinderKeyResult = document.getElementById('scale-finder-key-result');
    const scaleFinderKeyCards = document.getElementById('scale-finder-key-cards');

    // Chord Builder Elements
    const tabChordBuilder = document.getElementById('tab-chord-builder');
    const chordBuilderContainer = document.getElementById('chord-builder-container');
    const chordBuilderKeySelector = document.getElementById('chord-builder-key-selector');
    const chordBuilderFretboardContainer = document.getElementById('chord-builder-fretboard-container');
    const chordBuilderSelectedNotesEl = document.getElementById('chord-builder-selected-notes');
    const chordBuilderClearBtn = document.getElementById('chord-builder-clear-btn');
    const chordBuilderUndoBtn = document.getElementById('chord-builder-undo-btn');
    const chordBuilderResultsList = document.getElementById('chord-builder-results-list');
    const chordBuilderEmptyMessage = document.getElementById('chord-builder-empty-message');

    // MIDI Analyzer Elements
    const tabMidiAnalyzer = document.getElementById('tab-midi-analyzer');
    const midiAnalyzerContainer = document.getElementById('midi-analyzer-container');

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
    const toggleKeyViewerDegreeBtn = document.getElementById('toggle-key-viewer-degree-btn'); // 追加
    const keyViewerCagedSelector = document.getElementById('key-viewer-caged-selector');


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
            isPlaying: false,
            showDegree: false,
            cagedForm: null  // null = 全体表示, 'C'|'A'|'G'|'E'|'D' = 特定フォーム
        },

        scaleFinder: {
            selectedPositions: [] // { string, fret, noteIndex } の配列
        },

        chordBuilder: {
            selectedKeyIndex: 0, // 0 = C
            selectedPositions: [], // { string, fret, noteIndex, midiNote } の配列
            previewChord: null // { rootIndex, type } または null
        },

        midiAnalyzer: {
            selectedFile: null,
            lastResult: null,
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

    // --- 度数計算ヘルパー ---
    function getDegreeString(interval) {
        switch (interval) {
            case 0: return 'R';
            case 1: return 'm2';
            case 2: return 'M2';
            case 3: return 'm3';
            case 4: return 'M3';
            case 5: return 'P4';
            case 6: return 'dim5';
            case 7: return 'P5';
            case 8: return 'm6';
            case 9: return 'M6';
            case 10: return 'm7';
            case 11: return 'M7';
            default: return '';
        }
    }

    function getDegreeColor(interval) {
        if (interval === 0) return '#ef4444'; // Root: 赤
        if ([3, 4, 6, 7, 10, 11].includes(interval)) return '#f59e0b'; // 3rd, 5th, 7th (dim5含): オレンジ
        return '#60a5fa'; // その他(テンション等): 薄青
    }

    // --- CAGEDフォーム フレット範囲計算 ---
    function getCagedFretRanges(rootNoteIndex, formName) {
        const form = CAGED_FORMS[formName];
        // 6弦上でルート音が来る最小フレット (0-11)
        const rootFret6 = (rootNoteIndex - TUNING[5] + 12) % 12;
        const ranges = [];
        // オクターブ繰り返しで全指板をカバー
        for (let octave = 0; octave <= 2; octave++) {
            const start = rootFret6 + form.offsetMin + octave * 12;
            const end = rootFret6 + form.offsetMax + octave * 12;
            if (start > KEY_VIEWER_FRET_COUNT) break;
            ranges.push({
                start: Math.max(0, start),
                end: Math.min(KEY_VIEWER_FRET_COUNT, end)
            });
        }
        return ranges;
    }

    // フレットがCAGEDフォーム範囲内かどうかチェック
    function isFretInCagedRanges(fret, ranges) {
        return ranges.some(r => fret >= r.start && fret <= r.end);
    }


    function getPossiblePositionsForMidi(midiNote) {
        const positions = [];
        for (let s = 0; s < 6; s++) {
            const fret = midiNote - BASE_MIDI_NOTES[s];
            if (fret >= 0 && fret <= KEY_VIEWER_FRET_COUNT) {
                positions.push({ string: s, fret: fret, midiNote: midiNote });
            }
        }
        return positions;
    }

    function solveFingeringPath(midiNotes, baseFret, biasDiagonal = false) {
        if (midiNotes.length === 0) return [];
        let path = [];
        let currentString = -1;
        let currentFret = baseFret;

        for (const midi of midiNotes) {
            const possibilities = getPossiblePositionsForMidi(midi);
            if (possibilities.length === 0) continue;
            
            let bestPos = null;
            let minCost = Infinity;

            for (const pos of possibilities) {
                if (currentString === -1) {
                    const cost = Math.abs(pos.fret - currentFret);
                    if (cost < minCost) { minCost = cost; bestPos = pos; }
                    continue;
                }

                const fretDiffOrigin = pos.fret - currentFret; 
                const fretDiff = Math.abs(fretDiffOrigin);
                const stringDiff = Math.abs(pos.string - currentString);
                
                let cost = fretDiff * 2 + stringDiff * 1.5;
                
                if (biasDiagonal) {
                    if (fretDiffOrigin > 0 && fretDiffOrigin <= 3) cost -= 2;
                } else {
                    if (fretDiff > 4) cost += 10; // ストレッチのペナルティ
                }

                if (cost < minCost) {
                    minCost = cost;
                    bestPos = pos;
                }
            }

            if (bestPos) {
                path.push(bestPos);
                currentString = bestPos.string;
                currentFret = bestPos.fret;
            }
        }
        return path;
    }

    function getScaleMidiNotes(rootMidi, scaleDef, octaves) {
        let notes = [];
        for (let oct = 0; oct < octaves; oct++) {
            for (const interval of scaleDef.intervals) {
                notes.push(rootMidi + interval + oct * 12);
            }
        }
        notes.push(rootMidi + octaves * 12);
        return notes;
    }

    function generatePhraseData(approachType, rootNoteIndex, scaleDef) {
        let startMidi = 40;
        while (startMidi % 12 !== rootNoteIndex) startMidi++;
        const scaleMidiNotes = getScaleMidiNotes(startMidi, scaleDef, 2);
        let phraseMidi = [];
        let biasDiagonal = false;

        if (approachType === 'thirds') {
            for (let i = 0; i < scaleMidiNotes.length - 2; i++) {
                phraseMidi.push(scaleMidiNotes[i]);
                phraseMidi.push(scaleMidiNotes[i + 2]);
            }
            phraseMidi.push(scaleMidiNotes[0]);
        } else if (approachType === 'four_notes') {
            for (let i = 0; i < scaleMidiNotes.length - 3; i++) {
                phraseMidi.push(scaleMidiNotes[i]);
                phraseMidi.push(scaleMidiNotes[i+1]);
                phraseMidi.push(scaleMidiNotes[i+2]);
                phraseMidi.push(scaleMidiNotes[i+3]);
            }
            phraseMidi.push(scaleMidiNotes[scaleMidiNotes.length - 1]);
        } else if (approachType === 'diagonal') {
            biasDiagonal = true;
            for (let i = 0; i < scaleMidiNotes.length - 1; i++) {
                phraseMidi.push(scaleMidiNotes[i]);
                if(i > 0 && i % 3 === 0 && i < scaleMidiNotes.length - 2) {
                     phraseMidi.push(scaleMidiNotes[i-1]);
                }
            }
            phraseMidi.push(scaleMidiNotes[scaleMidiNotes.length - 1]);
        } else if (approachType === 'chord_tones') {
            const targetIndices = [0, 2, 4, 6]; 
            for (let oct = 0; oct < 2; oct++) {
                for(let ti of targetIndices) {
                     if(ti < scaleDef.intervals.length) {
                         const targetMidi = startMidi + oct*12 + scaleDef.intervals[ti];
                         let approachIdx = ti - 1;
                         if (approachIdx < 0) approachIdx = scaleDef.intervals.length - 1;
                         const approachMidi = startMidi + (ti===0 ? (oct-1)*12 : oct*12) + scaleDef.intervals[approachIdx];
                         phraseMidi.push(approachMidi);
                         phraseMidi.push(targetMidi);
                     }
                }
            }
            phraseMidi.push(startMidi + 24);
        } else {
             phraseMidi = [...scaleMidiNotes];
        }

        const startPositions = getPossiblePositionsForMidi(startMidi);
        const baseFret = startPositions.length > 0 ? startPositions[0].fret : 5;
        return solveFingeringPath(phraseMidi, baseFret, biasDiagonal);
    }

    function clearPhraseHighlights() {
        document.querySelectorAll('.playing-highlight').forEach(el => el.classList.remove('playing-highlight'));
    }

    async function playPhrase(phraseData) {
        if (state.keyViewer.isPlaying || !state.isSoundEnabled || !audioContext) return;
        state.keyViewer.isPlaying = true;
        
        const btn = document.getElementById('generate-phrase-btn');
        const scaleBtn = document.getElementById('key-viewer-play-scale-btn');
        if(btn) { btn.disabled = true; btn.classList.add('opacity-50', 'cursor-not-allowed'); }
        if(scaleBtn) { scaleBtn.disabled = true; scaleBtn.classList.add('opacity-50', 'cursor-not-allowed'); }

        clearPhraseHighlights();

        const bpm = 120;
        const noteDurationMs = (60 / bpm) * 1000 / 2; // 八分音符相当

        for (const note of phraseData) {
            if (!state.keyViewer.isPlaying) break;
            
            const marker = document.querySelector(`.scale-marker[data-string="${note.string}"][data-fret="${note.fret}"]`);
            if (marker) {
                marker.classList.add('playing-highlight');
                // 次の音が鳴る直前にハイライトを少し消す
                setTimeout(() => marker.classList.remove('playing-highlight'), noteDurationMs * 0.9);
            }
            
            playTone(note.midiNote);
            await new Promise(resolve => setTimeout(resolve, noteDurationMs));
        }

        state.keyViewer.isPlaying = false;
        if(btn) { btn.disabled = false; btn.classList.remove('opacity-50', 'cursor-not-allowed'); }
        if(scaleBtn) { scaleBtn.disabled = false; scaleBtn.classList.remove('opacity-50', 'cursor-not-allowed'); }
    }

    // --- スケールファインダー（判定）エンジン ---
    function findMatchingScales() {
        const validPositions = state.scaleFinder.selectedPositions.filter(p => !p.isUncertain);
        const uniqueNoteIndicesArr = Array.from(new Set(validPositions.map(p => p.noteIndex)));
        
        if (validPositions.length === 0) return [];

        const rawResults = [];
        
        for (let rootIndex = 0; rootIndex < 12; rootIndex++) {
            for (const scaleType in SCALES) {
                const scaleDef = SCALES[scaleType];
                const scalePitchClasses = scaleDef.intervals.map(inter => (rootIndex + inter) % 12);
                
                let score = 0;
                let matchCount = 0;
                const hitNoteIndices = new Set();
                
                for (let i = 0; i < validPositions.length; i++) {
                    const pos = validPositions[i];
                    if (scalePitchClasses.includes(pos.noteIndex)) {
                        let pts = 1;
                        if (i === validPositions.length - 1) pts = 3;
                        else if (i === 0 && validPositions.length > 1) pts = 2;
                        
                        score += pts;
                        hitNoteIndices.add(pos.noteIndex);
                    }
                }
                matchCount = hitNoteIndices.size;

                if (score > 0) {
                    rawResults.push({
                        rootIndex: rootIndex,
                        scaleType: scaleType,
                        matchCount: matchCount,
                        score: score,
                        totalScaleNotes: scalePitchClasses.length,
                        totalSelectedNotes: uniqueNoteIndicesArr.length,
                        scalePitchClasses: scalePitchClasses
                    });
                }
            }
        }

        const groups = {};
        for (const res of rawResults) {
            const key = res.scalePitchClasses.slice().sort((a,b)=>a-b).join(',');
            if (!groups[key]) {
                groups[key] = {
                    pitchClassesKey: key,
                    scales: [],
                    matchCount: res.matchCount,
                    score: res.score,
                    totalScaleNotes: res.totalScaleNotes,
                    totalSelectedNotes: res.totalSelectedNotes
                };
            }
            groups[key].scales.push(res);
        }

        const groupedResults = [];
        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;

        for (const key in groups) {
            const group = groups[key];
            const scales = group.scales;

            let majorScale = scales.find(s => s.scaleType === 'major');
            let minorScale = scales.find(s => s.scaleType === 'minor');
            let majorPenta = scales.find(s => s.scaleType === 'major_pentatonic');
            let minorPenta = scales.find(s => s.scaleType === 'minor_pentatonic');

            let mainTitle = "";
            let primaryScale = null;
            let subModes = [];

            if (majorScale || minorScale) {
                const parts = [];
                if (majorScale) {
                    parts.push(`${noteArray[majorScale.rootIndex].replace(/\(.+\)/, '')} ${SCALES['major'].name}`);
                    primaryScale = majorScale;
                }
                if (minorScale) {
                    parts.push(`${noteArray[minorScale.rootIndex].replace(/\(.+\)/, '')} ${SCALES['minor'].name}`);
                    if (!primaryScale) primaryScale = minorScale;
                }
                mainTitle = parts.join(' / ');
                subModes = scales.filter(s => s !== majorScale && s !== minorScale);
            } else if (majorPenta || minorPenta) {
                const parts = [];
                if (majorPenta) {
                    parts.push(`${noteArray[majorPenta.rootIndex].replace(/\(.+\)/, '')} ${SCALES['major_pentatonic'].name}`);
                    primaryScale = majorPenta;
                }
                if (minorPenta) {
                    parts.push(`${noteArray[minorPenta.rootIndex].replace(/\(.+\)/, '')} ${SCALES['minor_pentatonic'].name}`);
                    if (!primaryScale) primaryScale = minorPenta;
                }
                mainTitle = parts.join(' / ');
                subModes = scales.filter(s => s !== majorPenta && s !== minorPenta);
            } else {
                primaryScale = scales[0];
                mainTitle = `${noteArray[primaryScale.rootIndex].replace(/\(.+\)/, '')} ${SCALES[primaryScale.scaleType].name}`;
                subModes = scales.slice(1);
            }

            const subModesText = subModes.length > 0 
                ? "関連モード: " + subModes.map(s => `${noteArray[s.rootIndex].replace(/\(.+\)/, '')} ${SCALES[s.scaleType].name}`).join(', ')
                : "";

            groupedResults.push({
                mainTitle: mainTitle,
                primaryScale: primaryScale,
                subModesText: subModesText,
                matchCount: group.matchCount,
                score: group.score,
                totalScaleNotes: group.totalScaleNotes,
                totalSelectedNotes: group.totalSelectedNotes
            });
        }

        groupedResults.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
            return a.totalScaleNotes - b.totalScaleNotes;
        });

        return groupedResults;
    }

    function detectKey() {
        const validPositions = state.scaleFinder.selectedPositions.filter(p => !p.isUncertain);
        if (validPositions.length === 0) return [];
        const selectedPitches = Array.from(new Set(validPositions.map(p => p.noteIndex)));
        const candidates = [];
        for (let rootIndex = 0; rootIndex < 12; rootIndex++) {
            for (const scaleType of ['major', 'minor']) {
                const scalePitchClasses = SCALES[scaleType].intervals.map(i => (rootIndex + i) % 12);
                const matching = selectedPitches.filter(pc => scalePitchClasses.includes(pc)).length;
                if (matching === 0) continue;
                const coverage = matching / selectedPitches.length;
                const completeness = matching / scalePitchClasses.length;
                candidates.push({ rootIndex, scaleType, matching, total: selectedPitches.length, coverage, completeness, score: coverage * completeness });
            }
        }
        return candidates
            .sort((a, b) => b.score !== a.score ? b.score - a.score : b.coverage - a.coverage)
            .slice(0, 3);
    }

    function updateScaleFinder() {
        const selected = state.scaleFinder.selectedPositions;
        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;
        
        if (selected.length === 0) {
            scaleFinderSelectedNotesEl.textContent = '(なし)';
            scaleFinderResultsList.innerHTML = '';
            scaleFinderEmptyMessage.classList.remove('hidden');
            scaleFinderResultsList.classList.add('hidden');
            scaleFinderKeyResult.classList.add('hidden');
            return;
        }

        const validSelected = selected.filter(p => !p.isUncertain);
        const maxPossibleScore = validSelected.length > 0 ? (3 + (validSelected.length > 1 ? 2 : 0) + Math.max(0, validSelected.length - 2)) : 0;

        const sequenceStr = selected.map(p => {
             let name = noteArray[p.noteIndex].replace(/\(.+\)/, '');
             if (p.isUncertain) name += '(?)';
             return name;
        }).join(' → ');
        
        scaleFinderSelectedNotesEl.textContent = sequenceStr;

        // キー判定レンダリング
        const keyResults = detectKey();
        if (keyResults.length > 0) {
            const keyNoteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;
            scaleFinderKeyCards.innerHTML = '';
            keyResults.forEach((k, idx) => {
                const rootName = keyNoteArray[k.rootIndex].replace(/\(.+\)/, '');
                const scaleName = SCALES[k.scaleType].name;
                const coveragePct = Math.round(k.coverage * 100);
                let badgeClass, badgeText;
                if (k.coverage >= 1.0)       { badgeClass = 'bg-green-900 text-green-400 border border-green-800';   badgeText = '完全一致'; }
                else if (k.coverage >= 0.8)  { badgeClass = 'bg-blue-900 text-blue-400 border border-blue-800';      badgeText = '高確信'; }
                else if (k.coverage >= 0.6)  { badgeClass = 'bg-yellow-900 text-yellow-400 border border-yellow-800'; badgeText = '中確信'; }
                else                         { badgeClass = 'bg-[#2a2a2a] text-[#666666] border border-[#333333]';   badgeText = '参考'; }
                const isTop = idx === 0;
                const card = document.createElement('div');
                card.className = `flex flex-col items-center p-4 ${isTop ? 'bg-[#1e1e1e] border-[#3a3a3a]' : 'bg-[#181818] border-[#222222]'} rounded-lg border cursor-pointer hover:border-[#555555] transition-all min-w-[150px] flex-1 max-w-[200px]`;
                card.innerHTML = `
                    ${isTop ? '<div class="text-[10px] text-[#888888] mb-1 tracking-widest uppercase">最有力候補</div>' : ''}
                    <div class="text-2xl font-bold text-white leading-tight">${rootName}</div>
                    <div class="text-sm text-[#888888] mb-2">${scaleName}</div>
                    <div class="w-full bg-[#2a2a2a] rounded-full h-1 mb-2">
                        <div class="h-1 rounded-full ${isTop ? 'bg-white' : 'bg-[#555555]'}" style="width:${coveragePct}%"></div>
                    </div>
                    <div class="text-xs text-[#777777] mb-2">${k.matching}/${k.total}音一致 (${coveragePct}%)</div>
                    <span class="text-[11px] px-2 py-0.5 rounded-full ${badgeClass}">${badgeText}</span>
                `;
                card.addEventListener('click', () => {
                    state.keyViewer.rootNoteIndex = k.rootIndex;
                    state.keyViewer.scaleType = k.scaleType;
                    document.getElementById('key-viewer-root-selector').querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
                    document.getElementById('key-viewer-root-selector').querySelector(`[data-root-index="${k.rootIndex}"]`).classList.add('active-mode');
                    document.getElementById('key-viewer-scale-selector').querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
                    document.getElementById('key-viewer-scale-selector').querySelector(`[data-scale="${k.scaleType}"]`).classList.add('active-mode');
                    tabKeyViewer.click();
                });
                scaleFinderKeyCards.appendChild(card);
            });
            scaleFinderKeyResult.classList.remove('hidden');
        } else {
            scaleFinderKeyResult.classList.add('hidden');
        }

        const results = findMatchingScales();
        scaleFinderResultsList.innerHTML = '';
        scaleFinderEmptyMessage.classList.add('hidden');
        scaleFinderResultsList.classList.remove('hidden');
        // ちょっと間隔を広げて見やすく
        scaleFinderResultsList.classList.replace('gap-2', 'gap-3');

        const uniqueNoteIndicesArr = Array.from(new Set(validSelected.map(p => p.noteIndex)));

        const MAX_RESULTS = 15;
        let count = 0;
        for (const res of results) {
            if (count >= MAX_RESULTS) break;

            const isPerfectMatch = res.matchCount === res.totalSelectedNotes;
            
            const offScalePositions = validSelected.filter(p => !res.primaryScale.scalePitchClasses.includes(p.noteIndex));
            const offScaleNames = offScalePositions.map(p => {
                const noteName = noteArray[p.noteIndex].replace(/\(.+\)/, '');
                return `${noteName}(${p.string + 1}弦${p.fret}f)`;
            }).join(', ');
            
            const item = document.createElement('div');
            item.className = 'p-4 rounded-lg flex flex-col cursor-pointer transition-all duration-200 bg-[#171717] hover:bg-[#1e1e1e] border border-[#222222] hover:border-[#3a3a3a] gap-1';

            let colorCls = isPerfectMatch ? 'text-green-400' : 'text-orange-400';

            let htmlStr = `
                <div class="flex justify-between items-start">
                    <h3 class="font-bold text-lg text-white">${res.mainTitle}</h3>
                    <div class="text-right ml-2 flex-shrink-0 text-right">
                        <div class="font-bold whitespace-nowrap text-[#aaaaaa]">スコア: ${res.score} <span class="text-xs text-[#555555]">/ ${maxPossibleScore}</span></div>
                        <div class="text-xs ${colorCls} mt-1">${res.matchCount}/${res.totalSelectedNotes}音一致
                        ${isPerfectMatch ? '<span class="ml-1 text-[10px] bg-green-900 text-green-400 px-1 py-0.5 rounded-sm inline-block align-middle transform -translate-y-px">全音包含</span>' : ''}</div>
                    </div>
                </div>
            `;
            if (res.subModesText) {
                htmlStr += `<p class="text-xs text-[#666666] leading-relaxed mt-1">${res.subModesText}</p>`;
            }
            if (!isPerfectMatch && offScaleNames) {
                htmlStr += `<p class="text-xs text-red-400 font-medium mt-1">スケール外の音: <span class="font-bold">${offScaleNames}</span></p>`;
            }
            item.innerHTML = htmlStr;
            
            item.addEventListener('mouseenter', () => {
                const markers = scaleFinderFretboardContainer.querySelectorAll('.finder-marker');
                markers.forEach(marker => {
                    const noteIdx = parseInt(marker.dataset.noteIndex, 10);
                    const circle = marker.querySelector('circle:nth-child(2)');
                    const text = marker.querySelector('text');
                    const questionMark = marker.querySelector('text:nth-child(4)');
                    if (circle && !res.primaryScale.scalePitchClasses.includes(noteIdx)) {
                        circle.setAttribute('fill', '#ef4444');
                        circle.setAttribute('stroke', '#ef4444');
                        circle.setAttribute('fill-opacity', '1');
                        if (text) text.setAttribute('fill', '#ffffff');
                        if (questionMark) questionMark.setAttribute('fill', '#ffffff');
                    }
                });
            });

            item.addEventListener('mouseleave', () => {
                drawScaleFinderFretboard();
            });
            
            item.addEventListener('click', () => {
                state.keyViewer.rootNoteIndex = res.primaryScale.rootIndex;
                state.keyViewer.scaleType = res.primaryScale.scaleType;
                
                document.getElementById('key-viewer-root-selector').querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
                document.getElementById('key-viewer-root-selector').querySelector(`[data-root-index="${res.primaryScale.rootIndex}"]`).classList.add('active-mode');
                document.getElementById('key-viewer-scale-selector').querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
                document.getElementById('key-viewer-scale-selector').querySelector(`[data-scale="${res.primaryScale.scaleType}"]`).classList.add('active-mode');
                
                tabKeyViewer.click();
            });
            
            scaleFinderResultsList.appendChild(item);
            count++;
        }
    }

    function drawScaleFinderFretboard() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const fretboardHeight = STRING_COUNT * FRET_HEIGHT;
        const singleBoardHeight = fretboardHeight + FRET_NUM_AREA_HEIGHT;
        const gapBetweenBoards = 40;
        
        const totalWidth = 13 * FRET_WIDTH; 
        const totalHeight = singleBoardHeight * 2 + gapBetweenBoards;

        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
        svg.style.height = 'auto';

        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;

        const drawSection = (startFret, endFret, yOffset) => {
            const fretOffset = startFret === 0 ? 0 : startFret - 1;
            const bgWidth = (endFret - fretOffset + 1) * FRET_WIDTH;

            const bg = document.createElementNS(svgNS, 'rect');
            bg.setAttribute('x', 0);
            bg.setAttribute('y', yOffset);
            bg.setAttribute('width', Math.min(bgWidth, totalWidth));
            bg.setAttribute('height', singleBoardHeight);
            bg.setAttribute('fill', '#E3C6A4');
            bg.setAttribute('rx', 4);
            svg.appendChild(bg);

            const group = document.createElementNS(svgNS, 'g');
            group.setAttribute('transform', `translate(0, ${yOffset})`);

            if (startFret > 0) {
                const nut = document.createElementNS(svgNS, 'rect');
                nut.setAttribute('x', 40 - 4); 
                nut.setAttribute('y', 0);
                nut.setAttribute('width', 8); 
                nut.setAttribute('height', fretboardHeight);
                nut.setAttribute('fill', '#9ca3af');
                group.appendChild(nut);
            }

            for (let i = startFret; i <= endFret; i++) {
                const mapped_i = i - fretOffset;
                const x = (mapped_i + 0.5) * FRET_WIDTH;

                if (mapped_i === 0 && startFret === 0) {
                    const nut = document.createElementNS(svgNS, 'rect');
                    nut.setAttribute('x', x - 4); nut.setAttribute('y', 0);
                    nut.setAttribute('width', 8); nut.setAttribute('height', fretboardHeight);
                    nut.setAttribute('fill', '#d1d5db'); group.appendChild(nut);
                } else {
                    const fretLine = document.createElementNS(svgNS, 'line');
                    fretLine.setAttribute('x1', x); fretLine.setAttribute('y1', 0);
                    fretLine.setAttribute('x2', x); fretLine.setAttribute('y2', fretboardHeight);
                    fretLine.setAttribute('stroke', '#9ca3af');
                    fretLine.setAttribute('stroke-width', i === 12 || i === 24 ? '5' : '3');
                    group.appendChild(fretLine);
                }

                if (POSITION_MARKERS.includes(i) && i !== 0) {
                    const marker = document.createElementNS(svgNS, 'circle');
                    const markerX = x - FRET_WIDTH / 2; let markerY = fretboardHeight / 2;
                    marker.setAttribute('cx', markerX); marker.setAttribute('cy', markerY);
                    marker.setAttribute('r', '6');
                    marker.setAttribute('fill', '#000000');
                    marker.setAttribute('fill-opacity', '0.6');
                    if (i === 12 || i === 24) {
                        const marker2 = marker.cloneNode();
                        marker.setAttribute('cy', markerY - FRET_HEIGHT);
                        marker2.setAttribute('cy', markerY + FRET_HEIGHT);
                        group.appendChild(marker2);
                    }
                    group.appendChild(marker);
                }
            }

            for (let s = 0; s < STRING_COUNT; s++) {
                const y = (s + 0.5) * FRET_HEIGHT;
                const stringLine = document.createElementNS(svgNS, 'line');
                stringLine.setAttribute('x1', FRET_WIDTH / 2); stringLine.setAttribute('y1', y);
                const maxMapped_i = endFret - fretOffset;
                stringLine.setAttribute('x2', (maxMapped_i + 0.5) * FRET_WIDTH); stringLine.setAttribute('y2', y);
                stringLine.setAttribute('stroke', '#6b7280');
                stringLine.setAttribute('stroke-width', 1.5 + s * 0.4);
                group.appendChild(stringLine);
            }

            const fretNumGroup = document.createElementNS(svgNS, 'g');
            fretNumGroup.setAttribute('transform', `translate(0, ${fretboardHeight})`);
            for (let i = startFret; i <= endFret; i++) {
                if (i === 0) continue;
                const mapped_i = i - fretOffset;
                const x = mapped_i * FRET_WIDTH; 
                const y = (FRET_NUM_AREA_HEIGHT / 2) + 5;
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', x); text.setAttribute('y', y);
                text.setAttribute('fill', '#6b7280'); text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', '600'); text.setAttribute('text-anchor', 'middle');
                text.textContent = i; fretNumGroup.appendChild(text);
            }
            group.appendChild(fretNumGroup);

            for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
                const openNoteIndex = TUNING[stringIdx];
                for (let fret = startFret; fret <= endFret; fret++) {
                    const mapped_i = fret - fretOffset;
                    const currentNoteIndex = (openNoteIndex + fret) % 12;
                    const hitX = mapped_i === 0 && startFret === 0 ? (0.25) * FRET_WIDTH : mapped_i * FRET_WIDTH;
                    const hitY = (stringIdx + 0.5) * FRET_HEIGHT;
                    
                    const selectedPos = state.scaleFinder.selectedPositions.find(p => p.string === stringIdx && p.fret === fret);
                    const isSelected = !!selectedPos;

                    const g = document.createElementNS(svgNS, "g");
                    g.classList.add('finder-marker');
                    g.style.cursor = 'pointer';
                    g.dataset.string = stringIdx;
                    g.dataset.fret = fret;
                    g.dataset.noteIndex = currentNoteIndex;
                    g.dataset.midiNote = BASE_MIDI_NOTES[stringIdx] + fret;
                    
                    const hitCircle = document.createElementNS(svgNS, 'circle');
                    hitCircle.setAttribute('cx', hitX); hitCircle.setAttribute('cy', hitY);
                    hitCircle.setAttribute('r', FRET_HEIGHT * 0.45);
                    hitCircle.setAttribute('fill', 'transparent');
                    g.appendChild(hitCircle);

                    if (isSelected) {
                        const circle = document.createElementNS(svgNS, 'circle');
                        circle.setAttribute('cx', hitX); circle.setAttribute('cy', hitY);
                        circle.setAttribute('r', FRET_HEIGHT * 0.4);
                        
                        if (selectedPos.isUncertain) {
                            circle.setAttribute('fill', '#10b981');
                            circle.setAttribute('fill-opacity', '0.2');
                            if (selectedPos.isUnnatural) {
                                circle.setAttribute('stroke', '#f97316');
                                circle.setAttribute('stroke-width', '2');
                            } else {
                                circle.setAttribute('stroke', '#10b981');
                                circle.setAttribute('stroke-width', '2');
                                circle.setAttribute('stroke-dasharray', '4,2');
                            }
                        } else {
                            circle.setAttribute('fill', '#10b981');
                        }

                        const text = document.createElementNS(svgNS, 'text');
                        text.setAttribute('x', hitX); text.setAttribute('y', hitY + 4.5);
                        text.setAttribute('fill', selectedPos.isUncertain ? (selectedPos.isUnnatural ? '#f97316' : '#10b981') : '#ffffff');
                        text.setAttribute('font-size', '11');
                        text.setAttribute('font-weight', 'bold');
                        text.setAttribute('text-anchor', 'middle');
                        text.style.pointerEvents = 'none';
                        text.textContent = noteArray[currentNoteIndex].replace(/\(.+\)/, '');

                        g.appendChild(circle);
                        g.appendChild(text);

                        if (selectedPos.isUncertain) {
                            const questionMark = document.createElementNS(svgNS, 'text');
                            questionMark.setAttribute('x', hitX + FRET_HEIGHT * 0.35); 
                            questionMark.setAttribute('y', hitY - FRET_HEIGHT * 0.25);
                            questionMark.setAttribute('fill', selectedPos.isUnnatural ? '#f97316' : '#10b981');
                            questionMark.setAttribute('font-size', '14');
                            questionMark.setAttribute('font-weight', 'bold');
                            questionMark.setAttribute('text-anchor', 'middle');
                            questionMark.style.pointerEvents = 'none';
                            questionMark.textContent = selectedPos.isUnnatural ? '!' : '?';
                            g.appendChild(questionMark);
                        }
                    }
                    group.appendChild(g);
                }
            }
            svg.appendChild(group);
        };

        drawSection(0, 12, 0);
        drawSection(13, 24, singleBoardHeight + gapBetweenBoards);

        scaleFinderFretboardContainer.innerHTML = '';
        scaleFinderFretboardContainer.appendChild(svg);
    }

    function findPlayableCombinations(missingPitches, currentPositions) {
        if (missingPitches.length === 0) return [{ combo: [], stretch: 0 }];
        
        const usedStrings = currentPositions.map(p => p.string);
        const availableStrings = [0, 1, 2, 3, 4, 5].filter(s => !usedStrings.includes(s));
        
        if (availableStrings.length < missingPitches.length) return []; 

        let validCombinations = [];

        function backtrack(missingIdx, currentCombo, usedStringsInCombo) {
            if (missingIdx === missingPitches.length) {
                const allPositions = [...currentPositions, ...currentCombo].filter(p => p.fret > 0);
                let stretch = 0;
                if (allPositions.length > 0) {
                    const frets = allPositions.map(p => p.fret);
                    stretch = Math.max(...frets) - Math.min(...frets);
                }
                if (stretch <= 5) {
                    validCombinations.push({ combo: [...currentCombo], stretch });
                }
                return;
            }

            const targetPitch = missingPitches[missingIdx];
            
            let minSearchFret = 0;
            let maxSearchFret = 24;
            
            let existingFrets = currentPositions.filter(p => p.fret > 0).map(p => p.fret);
            if (existingFrets.length > 0) {
                const cMin = Math.min(...existingFrets);
                const cMax = Math.max(...existingFrets);
                minSearchFret = Math.max(0, cMin - 5);
                maxSearchFret = Math.min(24, cMax + 5);
            }

            for (let s of availableStrings) {
                if (usedStringsInCombo.has(s)) continue;
                
                const openNoteIndex = TUNING[s];
                for (let f = minSearchFret; f <= maxSearchFret; f++) {
                    if ((openNoteIndex + f) % 12 === targetPitch) {
                        currentCombo.push({ string: s, fret: f, noteIndex: targetPitch, midiNote: BASE_MIDI_NOTES[s] + f });
                        usedStringsInCombo.add(s);
                        backtrack(missingIdx + 1, currentCombo, usedStringsInCombo);
                        usedStringsInCombo.delete(s);
                        currentCombo.pop();
                    }
                }
            }
        }

        backtrack(0, [], new Set());
        
        validCombinations.sort((a, b) => a.stretch - b.stretch);
        return validCombinations;
    }

    function updateChordBuilder() {
        const { selectedKeyIndex, selectedPositions } = state.chordBuilder;
        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;

        if (selectedPositions.length === 0) {
            chordBuilderSelectedNotesEl.innerHTML = '(なし)';
            chordBuilderResultsList.innerHTML = '';
            chordBuilderEmptyMessage.classList.remove('hidden');
            chordBuilderResultsList.classList.add('hidden');
            return;
        }

        const uniquePitches = Array.from(new Set(selectedPositions.map(p => p.noteIndex))).sort((a, b) => a - b);
        const pitchHtml = uniquePitches.map(pitch => {
            const name = noteArray[pitch].replace(/\(.+\)/, '');
            const interval = (pitch - selectedKeyIndex + 12) % 12;
            const degree = getDegreeString(interval);
            return `<span class="bg-[#0e1e2e] text-[#7aaece] px-2 py-0.5 rounded text-sm border border-[#1a3a52]">${name} <span class="text-xs text-[#5a8ab0]">(${degree})</span></span>`;
        }).join('');
        chordBuilderSelectedNotesEl.innerHTML = pitchHtml;

        const results = [];
        for (let rootIndex = 0; rootIndex < 12; rootIndex++) {
            for (const chordType in CHORDS) {
                const chordDef = CHORDS[chordType];
                const chordPitchClasses = chordDef.intervals.map(inter => (rootIndex + inter) % 12);

                let isSubset = true;
                for (const pitch of uniquePitches) {
                    if (!chordPitchClasses.includes(pitch)) {
                        isSubset = false;
                        break;
                    }
                }
                
                if (isSubset) {
                    const missingPitches = chordPitchClasses.filter(p => !uniquePitches.includes(p));
                    const playableCombos = findPlayableCombinations(missingPitches, selectedPositions);

                    if (playableCombos.length > 0) {
                        const bestCombo = playableCombos[0];
                        
                        let score = chordDef.weight;
                        const keyScalePitches = SCALES['major'].intervals.map(inter => (selectedKeyIndex + inter) % 12);
                        const isDiatonic = chordPitchClasses.every(p => keyScalePitches.includes(p));
                        if (isDiatonic) score += 20;

                        score -= missingPitches.length * 10;
                        score -= bestCombo.stretch * 2;

                        results.push({
                            rootIndex,
                            chordType,
                            chordDef,
                            combo: bestCombo.combo,
                            missingPitches,
                            score
                        });
                    }
                }
            }
        }

        results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.missingPitches.length - b.missingPitches.length;
        });

        chordBuilderResultsList.innerHTML = '';
        chordBuilderEmptyMessage.classList.add('hidden');
        chordBuilderResultsList.classList.remove('hidden');

        const MAX_RESULTS = 15;
        let count = 0;
        for (const res of results) {
            if (count >= MAX_RESULTS) break;

            const rootName = noteArray[res.rootIndex].replace(/\(.+\)/, '');
            
            const comboTextNodes = res.combo.map(c => {
                const name = noteArray[c.noteIndex].replace(/\(.+\)/, '');
                const interval = (c.noteIndex - res.rootIndex + 12) % 12;
                const degree = getDegreeString(interval);
                return `<span class="bg-[#252525] text-[#aaaaaa] font-semibold px-1.5 py-0.5 rounded text-xs border border-[#333333]">${c.string + 1}弦 ${c.fret}F (${degree})</span>`;
            });

            const item = document.createElement('div');
            item.className = 'p-4 rounded-lg flex flex-col cursor-pointer transition-all duration-200 bg-[#171717] hover:bg-[#1e1e1e] border border-[#222222] hover:border-[#3a3a3a] gap-2';
            
            item.addEventListener('mouseenter', () => {
                state.chordBuilder.previewChord = {
                    combo: res.combo
                };
                drawChordBuilderFretboard();
            });
            item.addEventListener('mouseleave', () => {
                state.chordBuilder.previewChord = null;
                drawChordBuilderFretboard();
            });

            let htmlStr = `
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h3 class="font-bold text-lg text-white">${rootName} ${res.chordDef.name}</h3>
                        <div class="mt-1 flex flex-wrap gap-1 items-center">
                            ${res.combo.length === 0 ? '<span class="text-green-400 font-bold text-xs bg-green-900 px-2 py-1 rounded">完成形</span>' : '<span class="text-xs text-[#666666] mr-1">追加ポジション:</span>' + comboTextNodes.join('')}
                        </div>
                    </div>
                    <div class="flex gap-2 mt-3 sm:mt-0 w-full sm:w-auto">
                        <button class="play-btn bg-[#1e1e1e] hover:bg-[#282828] text-[#aaaaaa] font-bold py-1.5 px-3 rounded text-sm flex-1 sm:flex-none flex items-center justify-center transition border border-[#2e2e2e]">
                            <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                            試聴する
                        </button>
                        ${res.combo.length > 0 ? `
                        <button class="adopt-btn bg-white hover:bg-[#e0e0e0] text-black font-bold py-1.5 px-3 rounded text-sm flex-1 sm:flex-none flex items-center justify-center transition">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                            採用する
                        </button>` : ''}
                    </div>
                </div>
            `;
            item.innerHTML = htmlStr;
            
            const playBtn = item.querySelector('.play-btn');
            playBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // 全部同時に鳴らす
                const allMidis = [...selectedPositions.map(p => p.midiNote), ...res.combo.map(c => c.midiNote)];
                allMidis.forEach(m => playTone(m));
            });

            const adoptBtn = item.querySelector('.adopt-btn');
            if (adoptBtn) {
                adoptBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    state.chordBuilder.selectedPositions.push(...res.combo);
                    state.chordBuilder.previewChord = null;
                    drawChordBuilderFretboard();
                    updateChordBuilder();
                });
            }

            chordBuilderResultsList.appendChild(item);
            count++;
        }
        if (results.length === 0) {
            chordBuilderResultsList.innerHTML = '<p class="text-[#555555] text-center py-4">現在の構成音を含むコードのポジションが見つかりません。別の音を選択してください。</p>';
        }
    }

    function drawChordBuilderFretboard() {
        const svgNS = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(svgNS, "svg");
        const fretboardHeight = STRING_COUNT * FRET_HEIGHT;
        const singleBoardHeight = fretboardHeight + FRET_NUM_AREA_HEIGHT;
        const gapBetweenBoards = 40;
        
        const totalWidth = 13 * FRET_WIDTH; 
        const totalHeight = singleBoardHeight * 2 + gapBetweenBoards;

        svg.setAttribute('width', '100%');
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
        svg.style.height = 'auto';

        const noteArray = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC : NOTES_SOLFEGE_ENHARMONIC;
        const { selectedKeyIndex, selectedPositions, previewChord } = state.chordBuilder;

        const drawSection = (startFret, endFret, yOffset) => {
            const fretOffset = startFret === 0 ? 0 : startFret - 1;
            const bgWidth = (endFret - fretOffset + 1) * FRET_WIDTH;

            const bg = document.createElementNS(svgNS, 'rect');
            bg.setAttribute('x', 0);
            bg.setAttribute('y', yOffset);
            bg.setAttribute('width', Math.min(bgWidth, totalWidth));
            bg.setAttribute('height', singleBoardHeight);
            bg.setAttribute('fill', '#E3C6A4');
            bg.setAttribute('rx', 4);
            svg.appendChild(bg);

            const group = document.createElementNS(svgNS, 'g');
            group.setAttribute('transform', `translate(0, ${yOffset})`);

            if (startFret > 0) {
                const nut = document.createElementNS(svgNS, 'rect');
                nut.setAttribute('x', 40 - 4); 
                nut.setAttribute('y', 0);
                nut.setAttribute('width', 8); 
                nut.setAttribute('height', fretboardHeight);
                nut.setAttribute('fill', '#9ca3af');
                group.appendChild(nut);
            }

            for (let i = startFret; i <= endFret; i++) {
                const mapped_i = i - fretOffset;
                const x = (mapped_i + 0.5) * FRET_WIDTH;

                if (mapped_i === 0 && startFret === 0) {
                    const nut = document.createElementNS(svgNS, 'rect');
                    nut.setAttribute('x', x - 4); nut.setAttribute('y', 0);
                    nut.setAttribute('width', 8); nut.setAttribute('height', fretboardHeight);
                    nut.setAttribute('fill', '#d1d5db'); group.appendChild(nut);
                } else {
                    const fretLine = document.createElementNS(svgNS, 'line');
                    fretLine.setAttribute('x1', x); fretLine.setAttribute('y1', 0);
                    fretLine.setAttribute('x2', x); fretLine.setAttribute('y2', fretboardHeight);
                    fretLine.setAttribute('stroke', '#9ca3af');
                    fretLine.setAttribute('stroke-width', i === 12 || i === 24 ? '5' : '3');
                    group.appendChild(fretLine);
                }

                if (POSITION_MARKERS.includes(i) && i !== 0) {
                    const marker = document.createElementNS(svgNS, 'circle');
                    const markerX = x - FRET_WIDTH / 2; let markerY = fretboardHeight / 2;
                    marker.setAttribute('cx', markerX); marker.setAttribute('cy', markerY);
                    marker.setAttribute('r', '6'); marker.setAttribute('fill', '#000000');
                    marker.setAttribute('fill-opacity', '0.6');
                    if (i === 12 || i === 24) {
                        const marker2 = marker.cloneNode();
                        marker.setAttribute('cy', markerY - FRET_HEIGHT);
                        marker2.setAttribute('cy', markerY + FRET_HEIGHT);
                        group.appendChild(marker2);
                    }
                    group.appendChild(marker);
                }
            }

            for (let s = 0; s < STRING_COUNT; s++) {
                const y = (s + 0.5) * FRET_HEIGHT;
                const stringLine = document.createElementNS(svgNS, 'line');
                stringLine.setAttribute('x1', FRET_WIDTH / 2); stringLine.setAttribute('y1', y);
                const maxMapped_i = endFret - fretOffset;
                stringLine.setAttribute('x2', (maxMapped_i + 0.5) * FRET_WIDTH); stringLine.setAttribute('y2', y);
                stringLine.setAttribute('stroke', '#6b7280');
                stringLine.setAttribute('stroke-width', 1.5 + s * 0.4);
                group.appendChild(stringLine);
            }

            const fretNumGroup = document.createElementNS(svgNS, 'g');
            fretNumGroup.setAttribute('transform', `translate(0, ${fretboardHeight})`);
            for (let i = startFret; i <= endFret; i++) {
                if (i === 0) continue;
                const mapped_i = i - fretOffset;
                const x = mapped_i * FRET_WIDTH; 
                const y = (FRET_NUM_AREA_HEIGHT / 2) + 5;
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', x); text.setAttribute('y', y);
                text.setAttribute('fill', '#6b7280'); text.setAttribute('font-size', '14');
                text.setAttribute('font-weight', '600'); text.setAttribute('text-anchor', 'middle');
                text.textContent = i; fretNumGroup.appendChild(text);
            }
            group.appendChild(fretNumGroup);

            // ノート描画用の計算
            let minSelectedFret = 24, maxSelectedFret = 0;
            selectedPositions.forEach(p => {
                if(p.fret > 0) { // 開放弦は計算から除外
                    if(p.fret < minSelectedFret) minSelectedFret = p.fret;
                    if(p.fret > maxSelectedFret) maxSelectedFret = p.fret;
                }
            });
            const centerFret = selectedPositions.length > 0 && minSelectedFret <= maxSelectedFret 
                                ? (minSelectedFret + maxSelectedFret) / 2 : null;

            for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
                const openNoteIndex = TUNING[stringIdx];
                for (let fret = startFret; fret <= endFret; fret++) {
                    const mapped_i = fret - fretOffset;
                    const currentNoteIndex = (openNoteIndex + fret) % 12;
                    const hitX = mapped_i === 0 && startFret === 0 ? (0.25) * FRET_WIDTH : mapped_i * FRET_WIDTH;
                    const hitY = (stringIdx + 0.5) * FRET_HEIGHT;
                    
                    const selectedPos = selectedPositions.find(p => p.string === stringIdx && p.fret === fret);
                    const isSelected = !!selectedPos;

                    let isPreview = false;
                    if (!isSelected && previewChord) {
                        const isComboHit = previewChord.combo.some(c => c.string === stringIdx && c.fret === fret);
                        if (isComboHit) isPreview = true;
                    }

                    const g = document.createElementNS(svgNS, "g");
                    g.classList.add('builder-marker');
                    g.style.cursor = 'pointer';
                    g.dataset.string = stringIdx;
                    g.dataset.fret = fret;
                    g.dataset.noteIndex = currentNoteIndex;
                    g.dataset.midiNote = BASE_MIDI_NOTES[stringIdx] + fret;
                    
                    // クリック用の透明ヒットエリア
                    const hitCircle = document.createElementNS(svgNS, 'circle');
                    hitCircle.setAttribute('cx', hitX); hitCircle.setAttribute('cy', hitY);
                    hitCircle.setAttribute('r', FRET_HEIGHT * 0.45);
                    hitCircle.setAttribute('fill', 'transparent');
                    g.appendChild(hitCircle);

                    if (isSelected || isPreview) {
                        const circle = document.createElementNS(svgNS, 'circle');
                        circle.setAttribute('cx', hitX); circle.setAttribute('cy', hitY);
                        circle.setAttribute('r', FRET_HEIGHT * 0.4);
                        
                        const interval = (currentNoteIndex - selectedKeyIndex + 12) % 12;

                        if (isSelected) {
                            circle.setAttribute('fill', '#3b82f6'); // 確定音: 青
                        } else if (isPreview) {
                            circle.setAttribute('fill', '#10b981'); // 推奨追加: 緑
                            circle.setAttribute('fill-opacity', '0.25');
                            circle.setAttribute('stroke', '#10b981');
                            circle.setAttribute('stroke-width', '2');
                            circle.setAttribute('stroke-dasharray', '4,2');
                        }

                        const text = document.createElementNS(svgNS, 'text');
                        text.setAttribute('x', hitX); text.setAttribute('y', hitY + 4.5);
                        
                        if (isSelected) {
                            text.setAttribute('fill', '#ffffff');
                            text.setAttribute('font-weight', 'bold');
                        } else {
                            text.setAttribute('fill', '#059669');
                            text.setAttribute('font-weight', 'normal');
                        }
                        
                        text.setAttribute('font-size', '11');
                        text.setAttribute('text-anchor', 'middle');
                        text.style.pointerEvents = 'none';
                        text.textContent = getDegreeString(interval);

                        g.appendChild(circle);
                        g.appendChild(text);
                    }
                    group.appendChild(g);
                }
            }
            svg.appendChild(group);
        };

        drawSection(0, 12, 0);
        drawSection(13, 24, singleBoardHeight + gapBetweenBoards);

        const chordBuilderFretboardContainer = document.getElementById('chord-builder-fretboard-container');
        if (chordBuilderFretboardContainer) {
            chordBuilderFretboardContainer.innerHTML = '';
            chordBuilderFretboardContainer.appendChild(svg);
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
        svg.style.height = 'auto';
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

        // --- CAGED フォーム範囲のオーバーレイ描画 ---
        const activeCaged = state.keyViewer.cagedForm;
        let cagedRanges = null;
        if (activeCaged) {
            cagedRanges = getCagedFretRanges(rootNoteIndex, activeCaged);
            const formColor = CAGED_FORMS[activeCaged].color;
            
            for (const range of cagedRanges) {
                const overlayX = range.start === 0 ? 0 : (range.start - 0.5) * FRET_WIDTH;
                const overlayW = (range.end + 0.5) * FRET_WIDTH - overlayX;
                
                const overlay = document.createElementNS(svgNS, 'rect');
                overlay.setAttribute('x', overlayX);
                overlay.setAttribute('y', 0);
                overlay.setAttribute('width', overlayW);
                overlay.setAttribute('height', fretboardHeight);
                overlay.setAttribute('fill', formColor);
                overlay.setAttribute('opacity', '0.08');
                overlay.setAttribute('rx', '6');
                overlay.classList.add('caged-zone-overlay');
                svg.appendChild(overlay);
                
                // フォーム範囲の枠線
                const border = document.createElementNS(svgNS, 'rect');
                border.setAttribute('x', overlayX);
                border.setAttribute('y', 0);
                border.setAttribute('width', overlayW);
                border.setAttribute('height', fretboardHeight);
                border.setAttribute('fill', 'none');
                border.setAttribute('stroke', formColor);
                border.setAttribute('stroke-width', '2');
                border.setAttribute('stroke-opacity', '0.4');
                border.setAttribute('rx', '6');
                border.style.pointerEvents = 'none';
                svg.appendChild(border);
                
                // フォーム名ラベル
                const label = document.createElementNS(svgNS, 'text');
                label.setAttribute('x', overlayX + overlayW / 2);
                label.setAttribute('y', fretboardHeight + FRET_NUM_AREA_HEIGHT - 2);
                label.setAttribute('fill', formColor);
                label.setAttribute('font-size', '12');
                label.setAttribute('font-weight', '700');
                label.setAttribute('text-anchor', 'middle');
                label.setAttribute('opacity', '0.8');
                label.textContent = CAGED_FORMS[activeCaged].name;
                svg.appendChild(label);
            }
        }

        // --- 全弦・全フレットを走査して対象ノートをマッピング ---
        const noteArray = state.noteNameSystem === 'solfege' ? NOTES_SOLFEGE_ENHARMONIC : NOTES_ENHARMONIC;

        for (let stringIdx = 0; stringIdx < STRING_COUNT; stringIdx++) {
            const openNoteIndex = TUNING[stringIdx];
            for (let fret = 0; fret <= KEY_VIEWER_FRET_COUNT; fret++) {
                const currentNoteIndex = (openNoteIndex + fret) % 12;

                // このフレットの音がスケールに含まれているか？
                if (scaleNoteIndices.includes(currentNoteIndex)) {
                    // CAGED フォームが選択されている場合、範囲外の音は描画しない
                    if (activeCaged && cagedRanges && !isFretInCagedRanges(fret, cagedRanges)) {
                        continue;
                    }

                    const isRoot = currentNoteIndex === rootNoteIndex;
                    const cx = fret === 0 ? (0.25) * FRET_WIDTH : fret * FRET_WIDTH;
                    const cy = (stringIdx + 0.5) * FRET_HEIGHT;

                    const g = document.createElementNS(svgNS, "g");
                    g.classList.add('scale-marker');
                    g.dataset.midiNote = BASE_MIDI_NOTES[stringIdx] + fret;
                    g.dataset.string = stringIdx;
                    g.dataset.fret = fret;
                    g.style.cursor = 'pointer';
                    g.style.transformOrigin = `${cx}px ${cy}px`;

                    const circle = document.createElementNS(svgNS, 'circle');
                    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
                    const defaultR = FRET_HEIGHT * 0.4;
                    circle.setAttribute('r', defaultR);
                    circle.style.transition = 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    const interval = (currentNoteIndex - rootNoteIndex + 12) % 12;

                    circle.setAttribute('fill', getDegreeColor(interval));

                    const text = document.createElementNS(svgNS, 'text');
                    text.setAttribute('x', cx); text.setAttribute('y', cy + 4.5);
                    text.setAttribute('fill', '#ffffff');
                    text.setAttribute('font-size', '11');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('text-anchor', 'middle');
                    text.style.pointerEvents = 'none';
                    
                    if (state.keyViewer.showDegree) {
                        text.textContent = getDegreeString(interval);
                    } else {
                        text.textContent = noteArray[currentNoteIndex].replace(/\(.+\)/, '');
                    }

                    g.appendChild(circle);
                    g.appendChild(text);
                    svg.appendChild(g);
                }
            }
        }

        // ヘッダータイトルの更新
        const rootNoteName = noteArray[rootNoteIndex].replace(/\(.+\)/, '');
        let titleText = `${rootNoteName} ${scaleDef.name}`;
        if (activeCaged) {
            titleText += ` — ${CAGED_FORMS[activeCaged].name}`;
        }
        keyViewerTitle.textContent = titleText;

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
                    
                    // 色分けとテキスト表示の制御用インターバル
                    const interval = (currentNoteIndex - rootNoteIndex + 12) % 12;
                    // 度数に基づく色分け
                    circle.setAttribute('fill', getDegreeColor(interval));

                    const text = document.createElementNS(svgNS, 'text');
                    text.setAttribute('x', cx); text.setAttribute('y', cy + 5);
                    text.setAttribute('fill', '#ffffff');
                    text.setAttribute('font-size', '12');
                    text.setAttribute('font-weight', 'bold');
                    text.setAttribute('text-anchor', 'middle');
                    
                    if (state.keyViewer.showDegree) {
                        text.textContent = getDegreeString(interval);
                    } else {
                        text.textContent = noteArray[currentNoteIndex].replace(/\(.+\)/, '');
                    }

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

        for (let stringIdx of stringsToTest) {
            for (let fret = minFret; fret <= maxFret; fret++) {
                const noteIndex = (TUNING[stringIdx] + fret) % 12;
                
                // 半音除外のフィルタリング
                if (state.hideSemitones && !NATURAL_INDICES.includes(noteIndex)) {
                    continue;
                }
                
                // 指定音名フィルタリング
                if (s.noteFilter && s.noteFilter.length > 0 && !s.noteFilter.includes(noteIndex)) {
                    continue;
                }
                
                possiblePositions.push({
                    string: stringIdx,
                    fret: fret,
                    noteIndex: noteIndex
                });
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
            fretboardQuestionTextEl.innerHTML = 'この<strong class="text-white">開放弦</strong>の音名は何でしょう？';
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
            showMessage('正解！', 'text-green-400');
            clickedButton.classList.add('correct');
        } else {
            const correctNoteName = state.noteNameSystem === 'english' ? NOTES_ENHARMONIC[targetNoteIndex] : NOTES_SOLFEGE_ENHARMONIC[targetNoteIndex];
            showMessage(`不正解... 正解は ${correctNoteName}`, 'text-red-400');
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
        if (tabScaleFinder) tabScaleFinder.classList.remove('tab-active');
        if (tabChordBuilder) tabChordBuilder.classList.remove('tab-active');
        if (tabMidiAnalyzer) tabMidiAnalyzer.classList.remove('tab-active');

        fretboardQuizContainer.classList.add('hidden');
        solfegeQuizContainer.classList.add('hidden');
        keyViewerContainer.classList.add('hidden');
        if (scaleFinderContainer) scaleFinderContainer.classList.add('hidden');
        if (chordBuilderContainer) chordBuilderContainer.classList.add('hidden');
        if (midiAnalyzerContainer) midiAnalyzerContainer.classList.add('hidden');
        
        fretboardNextBtn.classList.add('hidden');
        solfegeNextBtn.classList.add('hidden');

        // ツール系タブ (keyViewer, scaleFinder, chordBuilder, midiAnalyzer) は回答エリアを隠す
        const isNotTools = tabName !== 'keyViewer' && tabName !== 'scaleFinder' && tabName !== 'chordBuilder' && tabName !== 'midiAnalyzer';
        answerArea.classList.toggle('hidden', !isNotTools);
        // hideSemitonesボタンはツール系では使わないため表示切り替え
        const semitonesBtn = document.getElementById('toggle-semitones-btn');
        if (semitonesBtn) semitonesBtn.parentElement.classList.toggle('hidden', !isNotTools);

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
        } else if (tabName === 'scaleFinder') {
            if (tabScaleFinder) tabScaleFinder.classList.add('tab-active');
            if (scaleFinderContainer) scaleFinderContainer.classList.remove('hidden');
            drawScaleFinderFretboard();
        } else if (tabName === 'chordBuilder') {
            if (tabChordBuilder) tabChordBuilder.classList.add('tab-active');
            if (chordBuilderContainer) chordBuilderContainer.classList.remove('hidden');
            if (typeof drawChordBuilderFretboard === 'function') drawChordBuilderFretboard();
            if (typeof updateChordBuilder === 'function') updateChordBuilder();
        } else if (tabName === 'midiAnalyzer') {
            if (tabMidiAnalyzer) tabMidiAnalyzer.classList.add('tab-active');
            if (midiAnalyzerContainer) midiAnalyzerContainer.classList.remove('hidden');
            checkMidiServerAndInit();
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
        if (tabScaleFinder) tabScaleFinder.addEventListener('click', (e) => { e.preventDefault(); switchTab('scaleFinder'); });
        if (tabChordBuilder) tabChordBuilder.addEventListener('click', (e) => { e.preventDefault(); switchTab('chordBuilder'); });
        if (tabMidiAnalyzer) tabMidiAnalyzer.addEventListener('click', (e) => { e.preventDefault(); switchTab('midiAnalyzer'); });

        if (chordBuilderClearBtn) {
            chordBuilderClearBtn.addEventListener('click', () => {
                state.chordBuilder.selectedPositions = [];
                state.chordBuilder.previewChord = null;
                if (typeof drawChordBuilderFretboard === 'function') drawChordBuilderFretboard();
                if (typeof updateChordBuilder === 'function') updateChordBuilder();
            });
        }

        if (chordBuilderUndoBtn) {
            chordBuilderUndoBtn.addEventListener('click', () => {
                if (state.chordBuilder.selectedPositions.length > 0) {
                    state.chordBuilder.selectedPositions.pop();
                    state.chordBuilder.previewChord = null;
                    if (typeof drawChordBuilderFretboard === 'function') drawChordBuilderFretboard();
                    if (typeof updateChordBuilder === 'function') updateChordBuilder();
                }
            });
        }

        if (chordBuilderKeySelector) {
            chordBuilderKeySelector.addEventListener('change', (e) => {
                state.chordBuilder.selectedKeyIndex = parseInt(e.target.value);
                state.chordBuilder.previewChord = null;
                if (typeof drawChordBuilderFretboard === 'function') drawChordBuilderFretboard();
                if (typeof updateChordBuilder === 'function') updateChordBuilder();
            });
        }

        if (scaleFinderClearBtn) {
            scaleFinderClearBtn.addEventListener('click', () => {
                state.scaleFinder.selectedPositions = [];
                drawScaleFinderFretboard();
                updateScaleFinder();
            });
        }

        if (scaleFinderUndoBtn) {
            scaleFinderUndoBtn.addEventListener('click', () => {
                if (state.scaleFinder.selectedPositions.length > 0) {
                    state.scaleFinder.selectedPositions.pop();
                    drawScaleFinderFretboard();
                    updateScaleFinder();
                }
            });
        }

        if (scaleFinderFretboardContainer) {
            const handleInteract = (e) => {
                const marker = e.target.closest('.finder-marker');
                if (!marker) return;

                if (e.type === 'contextmenu') e.preventDefault();

                const stringIdx = parseInt(marker.dataset.string);
                const fret = parseInt(marker.dataset.fret);
                const noteIndex = parseInt(marker.dataset.noteIndex);
                const midiNote = parseInt(marker.dataset.midiNote);

                const isRightClick = e.type === 'contextmenu' || e.shiftKey || (e.button === 2);

                const existingIndex = state.scaleFinder.selectedPositions.findIndex(
                    p => p.string === stringIdx && p.fret === fret
                );

                if (existingIndex >= 0) {
                    if (isRightClick) {
                        state.scaleFinder.selectedPositions[existingIndex].isUncertain = !state.scaleFinder.selectedPositions[existingIndex].isUncertain;
                    } else {
                        state.scaleFinder.selectedPositions.splice(existingIndex, 1);
                    }
                } else {
                    let isUncertain = isRightClick;
                    let isUnnatural = false;

                    if (state.scaleFinder.selectedPositions.length > 0) {
                        const lastPos = state.scaleFinder.selectedPositions[state.scaleFinder.selectedPositions.length - 1];
                        if (fret !== 0 && lastPos.fret !== 0 && Math.abs(fret - lastPos.fret) >= 6) {
                            isUnnatural = true;
                            isUncertain = true;
                        }
                    }

                    state.scaleFinder.selectedPositions.push({
                        string: stringIdx,
                        fret: fret,
                        noteIndex: noteIndex,
                        midiNote: midiNote,
                        isUncertain: isUncertain,
                        isUnnatural: isUnnatural
                    });
                    playTone(midiNote);
                }

                drawScaleFinderFretboard();
                updateScaleFinder();
            };

            scaleFinderFretboardContainer.addEventListener('click', handleInteract);
            scaleFinderFretboardContainer.addEventListener('contextmenu', handleInteract);
        }

        if (chordBuilderFretboardContainer) {
            chordBuilderFretboardContainer.addEventListener('click', (e) => {
                const marker = e.target.closest('.builder-marker');
                if (!marker) return;

                const stringIdx = parseInt(marker.dataset.string);
                const fret = parseInt(marker.dataset.fret);
                const noteIndex = parseInt(marker.dataset.noteIndex);
                const midiNote = parseInt(marker.dataset.midiNote);

                const existingIndex = state.chordBuilder.selectedPositions.findIndex(
                    p => p.string === stringIdx && p.fret === fret
                );

                if (existingIndex >= 0) {
                    state.chordBuilder.selectedPositions.splice(existingIndex, 1);
                } else {
                    state.chordBuilder.selectedPositions = state.chordBuilder.selectedPositions.filter(p => p.string !== stringIdx);
                    state.chordBuilder.selectedPositions.push({
                        string: stringIdx,
                        fret: fret,
                        noteIndex: noteIndex,
                        midiNote: midiNote
                    });
                    playTone(midiNote);
                }
                
                state.chordBuilder.previewChord = null;
                drawChordBuilderFretboard();
                updateChordBuilder();
            });
        }

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

        toggleKeyViewerDegreeBtn.addEventListener('click', (e) => {
            state.keyViewer.showDegree = !state.keyViewer.showDegree;
            e.target.classList.toggle('active-mode', state.keyViewer.showDegree);
            drawKeyViewerFretboard();
        });

        // CAGED フォームセレクター
        if (keyViewerCagedSelector) {
            keyViewerCagedSelector.addEventListener('click', (e) => {
                const target = e.target.closest('.option-btn');
                if (!target) return;
                const cagedValue = target.dataset.caged;
                
                keyViewerCagedSelector.querySelectorAll('.active-mode').forEach(b => b.classList.remove('active-mode'));
                target.classList.add('active-mode');
                
                if (cagedValue === 'all') {
                    state.keyViewer.cagedForm = null;
                } else {
                    state.keyViewer.cagedForm = cagedValue;
                }
                
                drawKeyViewerFretboard();
            });
        }

        keyViewerFretboardContainer.addEventListener('click', (e) => {
            const marker = e.target.closest('.scale-marker');
            if (marker && marker.dataset.midiNote) {
                playTone(parseInt(marker.dataset.midiNote));
            }
        });

        const generatePhraseBtn = document.getElementById('generate-phrase-btn');
        if (generatePhraseBtn) {
            generatePhraseBtn.addEventListener('click', () => {
                if (state.keyViewer.isPlaying) return;
                const approach = document.getElementById('phrase-approach-selector').value;
                const root = state.keyViewer.rootNoteIndex;
                const scaleDef = SCALES[state.keyViewer.scaleType];
                
                const phraseData = generatePhraseData(approach, root, scaleDef);
                playPhrase(phraseData);
            });
        }

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
                } else if (state.currentQuiz === 'scaleFinder') {
                    drawScaleFinderFretboard();
                    updateScaleFinder();
                } else if (state.currentQuiz === 'chordBuilder') {
                    if (typeof drawChordBuilderFretboard === 'function') drawChordBuilderFretboard();
                    if (typeof updateChordBuilder === 'function') updateChordBuilder();
                } else if (state.currentQuiz === 'midiAnalyzer') {
                    // 音名切り替えはMIDI解析タブに影響しない
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

    // ══════════════════════════════════════════════════════════
    //  MIDI 解析タブ (AutoGuitarAnalyzer 統合)
    // ══════════════════════════════════════════════════════════

    let _midiServerAvailable = null; // null = 未確認, true/false = 確認済み

    function checkMidiServerAndInit() {
        const warning = document.getElementById('midi-server-warning');
        if (_midiServerAvailable === true) {
            if (warning) warning.classList.add('hidden');
            setupMidiAnalyzerEvents();
            return;
        }
        fetch('/api/status', { signal: AbortSignal.timeout(3000) })
            .then(r => r.json())
            .then(data => {
                _midiServerAvailable = true;
                if (warning) warning.classList.add('hidden');
                setupMidiAnalyzerEvents();
                if (!data.available) {
                    _showMidiError('パイプラインが利用できません: ' + data.error);
                }
            })
            .catch(() => {
                _midiServerAvailable = false;
                if (warning) warning.classList.remove('hidden');
            });
    }

    let _midiEventsSetup = false;
    function setupMidiAnalyzerEvents() {
        if (_midiEventsSetup) return;
        _midiEventsSetup = true;

        const dropZone   = document.getElementById('midi-drop-zone');
        const fileInput  = document.getElementById('midi-file-input');
        const analyzeBtn = document.getElementById('midi-analyze-btn');
        const resetBtn   = document.getElementById('midi-reset-btn');
        const retryBtn   = document.getElementById('midi-retry-btn');
        const downloadBtn = document.getElementById('midi-download-btn');
        const gotoScaleBtn = document.getElementById('midi-goto-scale-btn');

        // ドラッグ&ドロップ
        dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) _selectMidiFile(file);
        });
        dropZone.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', e => {
            if (e.target.files[0]) _selectMidiFile(e.target.files[0]);
        });

        analyzeBtn.addEventListener('click', _runMidiAnalysis);
        resetBtn.addEventListener('click', _resetMidiAnalyzer);
        retryBtn.addEventListener('click', _resetMidiAnalyzer);

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                if (!state.midiAnalyzer.lastResult) return;
                const json = JSON.stringify(state.midiAnalyzer.lastResult, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'guitar_analysis.json';
                a.click();
            });
        }

        if (gotoScaleBtn) {
            gotoScaleBtn.addEventListener('click', () => {
                const result = state.midiAnalyzer.lastResult;
                if (!result) return;
                const keyStr = result.song_meta.key; // e.g. "B Major" or "C# minor"
                const parts = keyStr.trim().split(/\s+/);
                const rootName = parts[0];
                const noteArr = NOTES_ENHARMONIC;
                // 通常表記 (#/b) → NOTES_ENHARMONIC のインデックスを探す
                const SHARP_TO_ENHARMONIC = { 'C#': 1,'D#': 3,'F#': 6,'G#': 8,'A#': 10 };
                let rootIdx = noteArr.findIndex(n => n.split('(')[0] === rootName);
                if (rootIdx === -1) rootIdx = SHARP_TO_ENHARMONIC[rootName] ?? 0;
                // スケールタイプ
                const isMajor = keyStr.toLowerCase().includes('major');
                state.keyViewer.rootNoteIndex = rootIdx;
                state.keyViewer.scaleType = isMajor ? 'major' : 'minor';
                switchTab('keyViewer');
            });
        }
    }

    function _selectMidiFile(file) {
        const allowed = ['.wav', '.mp3', '.flac', '.aiff', '.ogg'];
        const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
        if (!allowed.includes(ext)) {
            _showMidiError(`未対応のファイル形式です: ${ext}\n対応形式: ${allowed.join(', ')}`);
            return;
        }
        state.midiAnalyzer.selectedFile = file;

        document.getElementById('midi-file-name').textContent = file.name;
        document.getElementById('midi-file-size').textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        document.getElementById('midi-drop-zone').classList.add('hidden');
        document.getElementById('midi-file-info').classList.remove('hidden');
        document.getElementById('midi-status-section').classList.add('hidden');
        document.getElementById('midi-error-section').classList.add('hidden');
        document.getElementById('midi-results-section').classList.add('hidden');
    }

    function _resetMidiAnalyzer() {
        state.midiAnalyzer.selectedFile = null;
        state.midiAnalyzer.lastResult = null;
        document.getElementById('midi-drop-zone').classList.remove('hidden');
        document.getElementById('midi-file-info').classList.add('hidden');
        document.getElementById('midi-status-section').classList.add('hidden');
        document.getElementById('midi-error-section').classList.add('hidden');
        document.getElementById('midi-results-section').classList.add('hidden');
        const fi = document.getElementById('midi-file-input');
        if (fi) fi.value = '';
    }

    async function _runMidiAnalysis() {
        const file = state.midiAnalyzer.selectedFile;
        if (!file) return;

        document.getElementById('midi-file-info').classList.add('hidden');
        document.getElementById('midi-status-section').classList.remove('hidden');
        document.getElementById('midi-error-section').classList.add('hidden');
        document.getElementById('midi-results-section').classList.add('hidden');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/analyze', { method: 'POST', body: formData });
            const data = await res.json();
            document.getElementById('midi-status-section').classList.add('hidden');

            if (!res.ok || data.error) {
                _showMidiError(data.error || `サーバーエラー (${res.status})`);
                return;
            }

            state.midiAnalyzer.lastResult = data;
            _renderMidiResults(data);
        } catch (err) {
            document.getElementById('midi-status-section').classList.add('hidden');
            _showMidiError('通信エラー: ' + err.message);
        }
    }

    function _showMidiError(msg) {
        document.getElementById('midi-error-text').textContent = msg;
        document.getElementById('midi-error-section').classList.remove('hidden');
        document.getElementById('midi-file-info').classList.add('hidden');
        document.getElementById('midi-status-section').classList.add('hidden');
        document.getElementById('midi-results-section').classList.add('hidden');
    }

    function _renderMidiResults(data) {
        // ソングメタ
        document.getElementById('midi-result-key').textContent   = data.song_meta.key;
        document.getElementById('midi-result-tempo').textContent = data.song_meta.tempo;

        // トラック一覧
        const container = document.getElementById('midi-tracks-container');
        container.innerHTML = '';
        (data.guitar_tracks || []).forEach(track => {
            container.appendChild(_buildTrackCard(track, data.song_meta.key));
        });

        document.getElementById('midi-results-section').classList.remove('hidden');
    }

    function _buildTrackCard(track, songKey) {
        const card = document.createElement('div');
        card.className = 'midi-track-card';

        const isLead = track.detected_role === 'Lead';
        const roleCls = isLead ? 'midi-role-lead' : 'midi-role-backing';
        const roleJa  = isLead ? 'リード' : 'バッキング';

        // ヘッダー（クリックで展開/折りたたみ）
        const header = document.createElement('div');
        header.className = 'midi-track-header';
        header.innerHTML = `
            <span class="font-bold text-[#e0e0e0] text-sm">${track.track_id}</span>
            <span class="midi-role-badge ${roleCls}">${roleJa}</span>
            <span class="text-xs text-[#777777] bg-[#1e1e1e] px-2 py-0.5 rounded-full border border-[#2a2a2a]">Pan: ${track.pan_position}</span>
            <span class="text-xs text-[#777777] bg-[#1e1e1e] px-2 py-0.5 rounded-full border border-[#2a2a2a]">Capo: ${track.capo}</span>
            ${track.estimated_form ? `<span class="text-xs text-[#888888] bg-[#1a1a1a] px-2 py-0.5 rounded-full border border-[#2a2a2a]">${track.estimated_form}</span>` : ''}
            <span class="ml-auto text-xs text-[#555555]">${(track.events || []).length} ノート</span>
            <svg class="midi-chevron w-4 h-4 text-[#555555] ml-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>`;

        // ボディ
        const body = document.createElement('div');
        body.className = 'p-4 bg-[#101010]';

        const events = track.events || [];
        if (events.length === 0) {
            body.innerHTML = '<p class="text-[#555555] text-sm text-center py-4">ノートイベントなし</p>';
        } else {
            const PREVIEW = 30;
            const showAll = events.length <= PREVIEW;
            body.innerHTML = _buildEventsTable(events, showAll ? events.length : PREVIEW);
            if (!showAll) {
                const more = document.createElement('button');
                more.className = 'midi-show-more-btn';
                more.textContent = `残り ${events.length - PREVIEW} ノートを表示`;
                more.addEventListener('click', () => {
                    body.innerHTML = _buildEventsTable(events, events.length);
                });
                body.appendChild(more);
            }
        }

        // 折りたたみ
        header.addEventListener('click', () => {
            const hidden = body.classList.toggle('hidden');
            header.querySelector('.midi-chevron').style.transform = hidden ? 'rotate(-90deg)' : '';
        });

        card.appendChild(header);
        card.appendChild(body);
        return card;
    }

    function _buildEventsTable(events, count) {
        const rows = events.slice(0, count).map(ev => {
            const degCls = _degreeClass(ev.degree);
            return `<tr>
                <td class="text-gray-400 text-xs">${ev.time_sec.toFixed(2)}s</td>
                <td class="font-semibold text-[#e0e0e0]">${ev.actual_note}</td>
                <td class="midi-tab-cell">${ev.tab.string}弦 / ${ev.tab.fret}f</td>
                <td><span class="midi-degree ${degCls}">${ev.degree}</span></td>
            </tr>`;
        }).join('');
        return `<div class="midi-events-scroll"><table class="midi-events-table">
            <thead><tr>
                <th>時刻</th><th>音</th><th>TAB</th><th>度数</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function _degreeClass(degree) {
        if (!degree) return 'midi-deg-other';
        const d = degree.toLowerCase();
        if (d.includes('unison') || d.includes('root')) return 'midi-deg-root';
        if (d.includes('2nd') || d.includes('9th'))      return 'midi-deg-2nd';
        if (d.includes('3rd'))                            return 'midi-deg-3rd';
        if (d.includes('4th') || d.includes('11th'))     return 'midi-deg-4th';
        if (d.includes('tritone') || d.includes('b5'))   return 'midi-deg-tritone';
        if (d.includes('5th'))                            return 'midi-deg-5th';
        if (d.includes('6th') || d.includes('13th'))     return 'midi-deg-6th';
        if (d.includes('7th'))                            return 'midi-deg-7th';
        return 'midi-deg-other';
    }

    // ══════════════════════════════════════════════════════════
    //  / MIDI 解析タブ
    // ══════════════════════════════════════════════════════════

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

