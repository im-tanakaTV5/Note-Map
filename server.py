#!/usr/bin/env python3
"""
Flask backend server: ギター理論学習アプリ + AutoGuitarAnalyzer MIDI解析 API

起動方法:
    pip install flask
    python server.py

ブラウザで http://localhost:5000 を開いてください。
"""
import logging
import sys
import tempfile
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory

# ── AutoGuitarAnalyzer パイプラインを読み込む ──────────────────────────────────
_PIPELINE_DIR = Path('/Users/ajishitakumashi/Desktop/skills集/ギター専用MIDI分析/output')
sys.path.insert(0, str(_PIPELINE_DIR))

try:
    from main import run_pipeline as _run_pipeline  # type: ignore
    _PIPELINE_AVAILABLE = True
    _PIPELINE_ERROR = ''
except Exception as _import_err:
    _PIPELINE_AVAILABLE = False
    _PIPELINE_ERROR = str(_import_err)

# ── Flask アプリ設定 ───────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S',
)
logger = logging.getLogger(__name__)

_WEB_DIR = Path(__file__).parent
_ALLOWED_SUFFIXES = {'.wav', '.mp3', '.flac', '.aiff', '.ogg'}
_MAX_UPLOAD_BYTES = 100 * 1024 * 1024  # 100 MB

app = Flask(__name__, static_folder=str(_WEB_DIR), static_url_path='')
app.config['MAX_CONTENT_LENGTH'] = _MAX_UPLOAD_BYTES


# ── ルート ─────────────────────────────────────────────────────────────────────

@app.route('/')
def serve_index():
    return send_from_directory(str(_WEB_DIR), 'index.html')


@app.route('/api/status', methods=['GET'])
def pipeline_status():
    """フロントエンドがサーバー疎通・パイプライン可用性を確認するためのエンドポイント。"""
    return jsonify({
        'available': _PIPELINE_AVAILABLE,
        'error': _PIPELINE_ERROR if not _PIPELINE_AVAILABLE else '',
    })


@app.route('/api/analyze', methods=['POST'])
def analyze_audio():
    """音楽ファイルを受け取り、AutoGuitarAnalyzer パイプラインを実行して JSON を返す。"""
    if not _PIPELINE_AVAILABLE:
        return jsonify({'error': f'パイプラインが利用できません: {_PIPELINE_ERROR}'}), 503

    if 'file' not in request.files:
        return jsonify({'error': 'ファイルが見つかりません (multipart key: "file")'}), 400

    f = request.files['file']
    if not f.filename:
        return jsonify({'error': 'ファイル名が空です'}), 400

    suffix = Path(f.filename).suffix.lower()
    if suffix not in _ALLOWED_SUFFIXES:
        return jsonify({'error': f'未対応のファイル形式: {suffix}'}), 400

    with tempfile.TemporaryDirectory(prefix='guitar_web_') as tmp_dir:
        tmp = Path(tmp_dir)
        input_path = tmp / ('upload' + suffix)
        f.save(str(input_path))
        logger.info(f'解析開始: {f.filename} ({input_path.stat().st_size // 1024} KB)')

        try:
            result = _run_pipeline(input_path, tmp / 'result.json')
        except Exception as exc:
            logger.exception('Pipeline failed')
            return jsonify({'error': f'解析中にエラーが発生しました: {exc}'}), 500

    logger.info('解析完了')
    return jsonify(result)


# ── エントリーポイント ─────────────────────────────────────────────────────────

if __name__ == '__main__':
    logger.info('=' * 60)
    logger.info('ギター理論学習アプリ + MIDI解析サーバー')
    if _PIPELINE_AVAILABLE:
        logger.info('AutoGuitarAnalyzer: 読み込み済み ✓')
    else:
        logger.warning(f'AutoGuitarAnalyzer: 未読み込み — {_PIPELINE_ERROR}')
        logger.warning('  pip install -r requirements.txt を確認してください')
    logger.info('アクセス → http://localhost:5000')
    logger.info('=' * 60)
    app.run(host='0.0.0.0', port=5000, debug=False)
