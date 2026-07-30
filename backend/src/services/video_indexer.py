import os
import logging
import re
import requests
from typing import Dict, Any, Optional
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound

logger = logging.getLogger("video_transcript_service")


class VideoIndexerService:
    """
    Fully server-side content retrieval — no video/audio download, no cookies,
    no proxy required.

    Transcript: youtube-transcript-api (free, best-effort — can fail on any
    given day if YouTube has currently rate-flagged Render/Vercel's IP range,
    which is a known, unavoidable limitation without a proxy or cookies) with
    an optional hosted-API fallback that never touches YouTube from your
    server at all.

    Metadata: official YouTube Data API v3 (key-based, zero bot-detection
    risk) with an oEmbed fallback.
    """

    def extract_youtube_id(self, url: str) -> str:
        match = re.search(r"(?:v=|youtu\.be/|embed/)([\w-]{11})", url)
        if match:
            return match.group(1)
        raise ValueError(f"Could not parse valid YouTube ID from URL: {url}")

    def _fetch_transcript_native(self, youtube_id: str) -> Optional[str]:
        """Free path. Succeeds whenever Render's IP isn't currently ASN-blocked."""
        try:
            transcript_list = YouTubeTranscriptApi.get_transcript(youtube_id, languages=["en", "en-US"])
            return " ".join(item["text"] for item in transcript_list)
        except (TranscriptsDisabled, NoTranscriptFound):
            try:
                manifest = YouTubeTranscriptApi.list_transcripts(youtube_id)
                obj = manifest.find_generated_transcript(["en"])
                data = obj.fetch()
                return " ".join(item["text"] for item in data)
            except Exception as e:
                logger.warning(f"No generated transcript available for {youtube_id}: {e}")
                return None
        except Exception as e:
            # Most commonly an IP-block/RequestBlocked error from a cloud IP.
            logger.warning(f"Native transcript fetch failed for {youtube_id} (likely IP block): {e}")
            return None

    def _fetch_transcript_hosted(self, youtube_id: str) -> Optional[str]:
        """
        Optional paid fallback. A plain server-to-server REST call to a hosted
        transcript API — YouTube only ever sees the provider's IP, never
        Render/Vercel's. Enable by setting TRANSCRIPT_API_KEY + TRANSCRIPT_API_URL.
        Skipped entirely (returns None immediately) if unset.
        """
        api_key = os.getenv("TRANSCRIPT_API_KEY")
        api_url = os.getenv("TRANSCRIPT_API_URL")
        if not api_key or not api_url:
            return None
        try:
            resp = requests.get(
                api_url,
                params={"videoId": youtube_id},
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=15,
            )
            if resp.status_code == 200:
                data = resp.json()
                # Response shape differs by provider — adjust these keys to match
                # whichever hosted API you configure.
                segments = data.get("transcript") or data.get("content")
                if isinstance(segments, list):
                    return " ".join(s.get("text", "") for s in segments)
                if isinstance(segments, str):
                    return segments
            logger.warning(f"Hosted transcript API returned {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            logger.warning(f"Hosted transcript API call failed: {e}")
        return None

    def _fetch_metadata_official(self, youtube_id: str) -> Dict[str, Any]:
        """YouTube Data API v3 — official REST API, key-based, no bot detection."""
        api_key = os.getenv("YOUTUBE_DATA_API_KEY")
        if api_key:
            try:
                resp = requests.get(
                    "https://www.googleapis.com/youtube/v3/videos",
                    params={"id": youtube_id, "part": "snippet,contentDetails", "key": api_key},
                    timeout=10,
                )
                if resp.status_code == 200:
                    items = resp.json().get("items", [])
                    if items:
                        snippet = items[0]["snippet"]
                        details = items[0]["contentDetails"]
                        return {
                            "platform": "YouTube",
                            "id": youtube_id,
                            "title": snippet.get("title", ""),
                            "description": (snippet.get("description") or "")[:500],
                            "uploader": snippet.get("channelTitle", ""),
                            "duration_iso8601": details.get("duration", ""),
                        }
                else:
                    logger.warning(f"YouTube Data API returned {resp.status_code}: {resp.text[:200]}")
            except Exception as e:
                logger.warning(f"YouTube Data API call failed: {e}")

        # Fallback: oEmbed — no key needed, official endpoint, title only.
        try:
            resp = requests.get(
                "https://www.youtube.com/oembed",
                params={"url": f"https://www.youtube.com/watch?v={youtube_id}", "format": "json"},
                timeout=5,
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "platform": "YouTube",
                    "id": youtube_id,
                    "title": data.get("title", ""),
                    "uploader": data.get("author_name", ""),
                    "description": "",
                }
        except Exception as e:
            logger.warning(f"oEmbed metadata fallback failed: {e}")

        return {"platform": "YouTube", "id": youtube_id}

    def fetch_transcript_and_metadata(self, video_url: str) -> Dict[str, Any]:
        youtube_id = self.extract_youtube_id(video_url)
        logger.info(f"Fetching content for YouTube ID: {youtube_id}")

        transcript_text = self._fetch_transcript_native(youtube_id)

        if not transcript_text:
            logger.info(f"Native transcript unavailable for {youtube_id} — trying hosted fallback (if configured)...")
            transcript_text = self._fetch_transcript_hosted(youtube_id)

        video_metadata = self._fetch_metadata_official(youtube_id)

        if not transcript_text:
            # Graceful degradation: don't hard-fail the whole audit just
            # because a transcript couldn't be fetched today. Run the
            # compliance check on title + description instead, and make the
            # metadata reflect that it's a reduced-confidence pass.
            logger.warning(f"No transcript retrievable for {youtube_id}. Falling back to metadata-only audit.")
            video_metadata["transcript_unavailable"] = True
            transcript_text = f"{video_metadata.get('title', '')}. {video_metadata.get('description', '')}".strip()

        return {
            "transcript": transcript_text,
            "ocr_text": [],
            "video_metadata": video_metadata,
        }

    def check_cookie_health(self) -> bool:
        """Startup check — confirms at least one transcript path is currently reachable."""
        test_id = "jNQXAC9IVRw"  # "Me at the zoo" — stable public video, always has captions
        try:
            result = self._fetch_transcript_native(test_id) or self._fetch_transcript_hosted(test_id)
            if result:
                logger.info("[Health Check] Transcript retrieval is healthy.")
                return True
            logger.warning(
                "[Health Check] Native transcript path returned nothing right now — "
                "this usually means YouTube has currently rate-flagged this IP range. "
                "It often clears within 24-48h on its own. Set TRANSCRIPT_API_KEY + "
                "TRANSCRIPT_API_URL for a fallback that doesn't depend on this IP at all."
            )
            return False
        except Exception as e:
            logger.warning(f"[Health Check] Error during health check: {e}")
            return False