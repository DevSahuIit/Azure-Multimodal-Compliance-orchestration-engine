import logging
import re
from typing import Dict, Any, List
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import yt_dlp

logger = logging.getLogger("video_transcript_service")


class VideoIndexerService:
    """
    In-memory direct metadata & transcript retrieval service.
    Replaces file downloading and Azure Video Indexer cloud uploads.
    """

    def extract_youtube_id(self, url: str) -> str:
        match = re.search(r"(?:v=|youtu\.be/|embed/)([\w-]{11})", url)
        if match:
            return match.group(1)
        raise ValueError(f"Could not parse valid YouTube ID from URL: {url}")

    def fetch_transcript_and_metadata(self, video_url: str) -> Dict[str, Any]:
        """
        Fetches YouTube transcript and metadata entirely in-memory.
        No video downloading or cloud storage uploads required.
        """
        youtube_id = self.extract_youtube_id(video_url)
        logger.info(f"Retrieving in-memory transcript for YouTube ID: {youtube_id}")

        # 1. Retrieve Transcript
        transcript_text = ""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(youtube_id, languages=['en', 'en-US'])
            transcript_text = " ".join([item['text'] for item in transcript_list])
        except (TranscriptsDisabled, NoTranscriptFound):
            logger.warning(f"No explicit English transcript found for video ID: {youtube_id}. Attempting auto-generated...")
            try:
                transcript_manifest = YouTubeTranscriptApi.list_transcripts(youtube_id)
                transcript_obj = transcript_manifest.find_generated_transcript(['en'])
                transcript_data = transcript_obj.fetch()
                transcript_text = " ".join([item['text'] for item in transcript_data])
            except Exception as e:
                logger.error(f"Failed to extract transcript: {str(e)}")
                transcript_text = ""
        except Exception as e:
            logger.error(f"Error extracting transcript for {youtube_id}: {str(e)}")
            transcript_text = ""

        # 2. Extract Metadata via yt-dlp without downloading media
        video_metadata = {"platform": "YouTube", "id": youtube_id}
        try:
            ydl_opts = {'skip_download': True, 'quiet': True, 'no_warnings': True}
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)
                video_metadata.update({
                    "title": info.get("title", ""),
                    "duration": info.get("duration", 0),
                    "uploader": info.get("uploader", ""),
                    "description": info.get("description", "")[:500]  # First 500 chars for context
                })
        except Exception as e:
            logger.warning(f"Could not fetch extended metadata: {str(e)}")

        return {
            "transcript": transcript_text,
            "ocr_text": [],  # Direct video stream OCR bypassed to avoid downloads
            "video_metadata": video_metadata
        }

    def check_cookie_health(self) -> bool:
        """Health check stub retained for compatibility with lifespan startup."""
        logger.info("[Health Check] In-memory transcript service initialized.")
        return True