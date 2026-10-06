#!/usr/bin/env python3
"""Serve the deck locally, with MP4 ranges and durable per-slide review feedback."""
import argparse
from datetime import datetime, timezone
import functools
import hashlib
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import ipaddress
import json
import os
from pathlib import Path
import re
import tempfile
import threading
from urllib.parse import urlsplit

REVIEW_LOCK = threading.RLock()
MAX_BODY = 131072
MAX_TEXT = 20000


class SlideParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.slides = {}
        self.revision = None

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'meta' and attrs.get('name') == 'deck-revision':
            self.revision = attrs.get('content')
        if tag == 'article' and attrs.get('data-slide-id'):
            self.slides[attrs['data-slide-id']] = attrs.get('data-title', '')


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, '.js': 'text/javascript', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.mp4': 'video/mp4'}

    def __init__(self, *args, review_store=None, **kwargs):
        self.review_store = Path(review_store).resolve() if review_store else None
        super().__init__(*args, **kwargs)

    @property
    def feedback_path(self):
        return self.review_store or Path(self.directory).resolve() / 'review' / 'feedback.json'

    def deck_metadata(self):
        data = (Path(self.directory) / 'index.html').read_bytes()
        parser = SlideParser()
        parser.feed(data.decode('utf-8'))
        return parser.slides, parser.revision or hashlib.sha256(data).hexdigest()[:12]

    def read_feedback(self):
        path = self.feedback_path
        if not path.exists():
            return {'schema_version': 1, 'events': []}
        data = json.loads(path.read_text(encoding='utf-8'))
        if data.get('schema_version') != 1 or not isinstance(data.get('events'), list):
            raise ValueError('Unsupported feedback format; existing file was left unchanged')
        return data

    def write_feedback(self, data):
        path = self.feedback_path
        path.parent.mkdir(exist_ok=True)
        name = None
        try:
            with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent, prefix='.feedback-', suffix='.tmp', delete=False) as stream:
                name = stream.name
                json.dump(data, stream, ensure_ascii=False, indent=2)
                stream.write('\n')
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(name, path)
        finally:
            if name and os.path.exists(name):
                os.unlink(name)

    def json_response(self, status, value):
        body = json.dumps(value, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def trusted_request(self, write=False):
        """No remote clients, cross-origin writes, or DNS-rebinding hosts."""
        try:
            if not ipaddress.ip_address(self.client_address[0]).is_loopback:
                return False
            host = self.headers.get('Host', '')
            authority = urlsplit('http://' + host)
            if authority.hostname not in ('localhost', '127.0.0.1', '::1'):
                return False
            if authority.port != self.server.server_port:
                return False
            origin = self.headers.get('Origin')
            if write and not origin:
                return False
            if origin and origin != 'http://' + host:
                return False
            if self.headers.get('Sec-Fetch-Site') in ('cross-site',):
                return False
            return True
        except ValueError:
            return False

    def do_GET(self):
        if urlsplit(self.path).path != '/api/review':
            return super().do_GET()
        if not self.trusted_request():
            return self.json_response(403, {'error': 'Review feedback is available only from this local deck'})
        try:
            with REVIEW_LOCK:
                data = self.read_feedback()
                _, revision = self.deck_metadata()
            self.json_response(200, {**data, 'deck_revision': revision})
        except (OSError, ValueError, UnicodeError) as exc:
            self.json_response(503, {'error': f'Cannot read review feedback: {exc}'})

    def validate_event(self, raw, events):
        if not isinstance(raw, dict):
            raise ValueError('event must be an object')
        event_id = raw.get('id')
        if not isinstance(event_id, str) or not re.fullmatch(r'[A-Za-z0-9_-]{8,80}', event_id):
            raise ValueError('Invalid event id')
        slides, _ = self.deck_metadata()
        slide_id = raw.get('slide_id')
        kind = raw.get('type')
        target = raw.get('target_id')
        comment = next((e for e in events if e.get('id') == target and e.get('type') == 'comment'), None) if kind == 'status' else None
        historical_status = comment is not None and comment.get('slide_id') == slide_id
        if not isinstance(slide_id, str) or (slide_id not in slides and not historical_status):
            raise ValueError('Unknown slide id')
        revision = raw.get('revision')
        if not isinstance(revision, str) or not re.fullmatch(r'[A-Za-z0-9._-]{1,80}', revision):
            raise ValueError('Invalid deck revision')
        title = raw.get('title', slides.get(slide_id, comment.get('title', slide_id) if comment else slide_id))
        if not isinstance(title, str) or len(title) > 500:
            raise ValueError('Invalid slide title')
        slide_revision = raw.get('slide_revision')
        if slide_revision is not None and (not isinstance(slide_revision, str) or not re.fullmatch(r'[A-Za-z0-9._-]{1,80}', slide_revision)):
            raise ValueError('Invalid slide revision')
        event = {'id': event_id, 'type': kind, 'slide_id': slide_id, 'title': title, 'revision': revision}
        if slide_revision is not None:
            event['slide_revision'] = slide_revision
        if kind in ('draft', 'comment'):
            text = raw.get('text')
            if not isinstance(text, str) or len(text) > MAX_TEXT:
                raise ValueError(f'Advice must be text of at most {MAX_TEXT} characters')
            if kind == 'comment' and not text.strip():
                raise ValueError('Advice cannot be empty')
            event['text'] = text
            if kind == 'comment':
                event['status'] = 'open'
        elif kind == 'status':
            if not historical_status:
                raise ValueError('Unknown advice item for this slide')
            if raw.get('status') not in ('open', 'addressed'):
                raise ValueError('Status must be open or addressed')
            event.update(target_id=target, status=raw['status'])
            if 'response' in raw:
                if not isinstance(raw['response'], str) or len(raw['response']) > MAX_TEXT:
                    raise ValueError('Invalid revision response')
                event['response'] = raw['response']
        else:
            raise ValueError('Unknown review event type')
        return event

    def do_POST(self):
        if urlsplit(self.path).path != '/api/review':
            return self.json_response(404, {'error': 'Unknown endpoint'})
        if not self.trusted_request(write=True):
            return self.json_response(403, {'error': 'Review changes require the same local deck origin'})
        if self.headers.get_content_type() != 'application/json':
            return self.json_response(415, {'error': 'Expected application/json'})
        try:
            length = int(self.headers.get('Content-Length', '-1'))
        except ValueError:
            length = -1
        if length < 0 or length > MAX_BODY:
            return self.json_response(413, {'error': 'Invalid or excessive request size'})
        try:
            raw = json.loads(self.rfile.read(length))
            if not isinstance(raw, dict) or set(raw) != {'event'}:
                raise ValueError('Expected one event')
            with REVIEW_LOCK:
                data = self.read_feedback()
                event = self.validate_event(raw['event'], data['events'])
                existing = next((e for e in data['events'] if e.get('id') == event['id']), None)
                if existing:
                    if {k: v for k, v in existing.items() if k != 'created_at'} != event:
                        return self.json_response(409, {'error': 'Event id already has different content'})
                    return self.json_response(200, {'event': existing, 'saved': True})
                event['created_at'] = datetime.now(timezone.utc).isoformat(timespec='milliseconds')
                data['events'].append(event)
                data['updated_at'] = event['created_at']
                self.write_feedback(data)
            self.json_response(201, {'event': event, 'saved': True})
        except (ValueError, UnicodeError) as exc:
            self.json_response(400, {'error': str(exc)})
        except OSError as exc:
            self.json_response(503, {'error': f'Cannot save feedback: {exc}'})

    def send_head(self):
        self.byte_range = None
        requested_range = self.headers.get('Range')
        path = Path(self.translate_path(self.path))
        private = Path(self.directory).resolve() / 'review'
        if path.resolve().is_relative_to(private) or path.resolve() == self.feedback_path:
            self.send_error(403, 'Use the local review API to access feedback')
            return None
        if not requested_range or not path.is_file():
            return super().send_head()
        length = path.stat().st_size
        match = re.fullmatch(r'bytes=(\d*)-(\d*)', requested_range.strip())
        if not match or not any(match.groups()):
            self.send_error(400, 'Invalid range')
            return None
        first, last = match.groups()
        if not first:
            start, end = max(0, length - int(last)), length - 1
        else:
            start, end = int(first), min(int(last) if last else length - 1, length - 1)
        if start >= length or end < start:
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{length}')
            self.send_header('Content-Length', '0')
            self.end_headers()
            return None
        stream = path.open('rb')
        stream.seek(start)
        self.byte_range = (start, end)
        self.send_response(206)
        self.send_header('Content-Type', self.guess_type(str(path)))
        self.send_header('Content-Range', f'bytes {start}-{end}/{length}')
        self.send_header('Content-Length', str(end - start + 1))
        self.send_header('Last-Modified', self.date_time_string(path.stat().st_mtime))
        self.end_headers()
        return stream

    def end_headers(self):
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()

    def copyfile(self, source, outputfile):
        try:
            if self.byte_range is None:
                return super().copyfile(source, outputfile)
            remaining = self.byte_range[1] - self.byte_range[0] + 1
            while remaining:
                block = source.read(min(65536, remaining))
                if not block:
                    break
                outputfile.write(block)
                remaining -= len(block)
        except (BrokenPipeError, ConnectionResetError):
            pass  # Browsers cancel media requests when visitors switch scenes.


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8088)
    parser.add_argument('--review-store', type=Path, help='Optional feedback JSON path, useful for isolated review tests')
    args = parser.parse_args()
    handler = functools.partial(Handler, directory=str(Path(__file__).resolve().parent), review_store=args.review_store)
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler)
    print(f'Recova is available at http://localhost:{args.port}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
