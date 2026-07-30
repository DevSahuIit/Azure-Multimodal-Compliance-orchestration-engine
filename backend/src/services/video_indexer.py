import os
import re
import logging
import subprocess
from typing import Dict, Any

import requests
import imageio_ffmpeg

logger = logging.getLogger("video_analysis_service")

GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
GROQ_WHISPER_MODEL = os.getenv("GROQ_WHISPER_MODEL", "whisper-large-v3")


class VideoIndexerService:
    """
    Processes a locally uploaded video file end-to-end, entirely on your own
    server. No YouTube, no yt-dlp, no cookies, no proxy — the person uploads
    a file directly, we extract its audio track and transcribe it with Groq
    Whisper, and pull light metadata via ffmpeg.
    """

    def __init__(self):
        # imageio-ffmpeg ships a self-contained static ffmpeg binary, so this
        # works on Render's standard Python runtime without apt-get/root
        # access to install a system package.
        self.ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    def _probe_metadata(self, file_path: str) -> Dict[str, Any]:
        """Extracts duration/resolution by parsing ffmpeg's own stderr output."""
        try:
            result = subprocess.run(
                [self.ffmpeg_path, "-i", file_path],
                stderr=subprocess.PIPE,
                stdout=subprocess.PIPE,
                text=True,
                timeout=30,
            )
            stderr = result.stderr
            duration_sec = None
            duration_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", stderr)
            if duration_match:
                h, m, s = duration_match.groups()
                duration_sec = int(h) * 3600 + int(m) * 60 + float(s)
            resolution_match = re.search(r"(\d{2,5})x(\d{2,5})", stderr)
            return {
                "platform": "Local Upload",
                "duration_sec": duration_sec,
                "resolution": resolution_match.group(0) if resolution_match else None,
            }
        except Exception as e:
            logger.warning(f"Metadata probe failed: {e}")
            return {"platform": "Local Upload"}

    def _extract_audio(self, video_path: str) -> str:
        """Extracts a small mono MP3 audio track for transcription."""
        audio_path = video_path + "_audio.mp3"
        cmd = [
            self.ffmpeg_path, "-y",
            "-i", video_path,
            "-vn", "-ac", "1", "-ar", "16000", "-b:a", "64k",
            audio_path,
        ]
        result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=600)
        if result.returncode != 0 or not os.path.exists(audio_path):
            raise Exception(f"Audio extraction failed: {result.stderr.decode(errors='ignore')[:500]}")
        return audio_path

    def _transcribe_audio(self, audio_path: str) -> str:
        """Sends the extracted audio to Groq's Whisper endpoint."""
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise Exception("GROQ_API_KEY is not configured — cannot transcribe audio.")

        with open(audio_path, "rb") as f:
            files = {"file": (os.path.basename(audio_path), f, "audio/mpeg")}
            data = {"model": GROQ_WHISPER_MODEL, "response_format": "text"}
            headers = {"Authorization": f"Bearer {api_key}"}
            response = requests.post(
                GROQ_TRANSCRIBE_URL, headers=headers, files=files, data=data, timeout=300
            )

        if response.status_code != 200:
            raise Exception(f"Groq transcription failed ({response.status_code}): {response.text[:300]}")

        return response.text.strip()

    def analyze_local_video(self, file_path: str, original_filename: str = "") -> Dict[str, Any]:
        """
        Full pipeline for a locally uploaded video: probe metadata, extract
        audio, transcribe. Cleans up the intermediate audio file itself; the
        caller (server.py) is responsible for cleaning up the original upload.
        """
        audio_path = None
        try:
            metadata = self._probe_metadata(file_path)
            metadata["filename"] = original_filename or os.path.basename(file_path)

            logger.info(f"Extracting audio from uploaded file: {file_path}")
            audio_path = self._extract_audio(file_path)

            logger.info("Transcribing audio via Groq Whisper...")
            transcript = self._transcribe_audio(audio_path)

            return {
                "transcript": transcript,
                "ocr_text": [],
                "video_metadata": metadata,
            }
        finally:
            if audio_path and os.path.exists(audio_path):
                os.remove(audio_path)

    def check_health(self) -> bool:
        """Startup check — confirms ffmpeg is available and GROQ_API_KEY is set."""
        ffmpeg_ok = os.path.exists(self.ffmpeg_path)
        groq_ok = bool(os.getenv("GROQ_API_KEY"))
        if ffmpeg_ok and groq_ok:
            logger.info("[Health Check] ffmpeg and Groq transcription are ready.")
            return True
        if not ffmpeg_ok:
            logger.error("[Health Check] FAILED: ffmpeg binary not found.")
        if not groq_ok:
            logger.error("[Health Check] FAILED: GROQ_API_KEY is not set.")
        return False