import os
import time
import logging
import tempfile
import requests
import yt_dlp
from azure.identity import ClientSecretCredential, DefaultAzureCredential

logger = logging.getLogger("video_indexer")


class VideoIndexerService:
    def __init__(self):
        self.account_id = os.getenv("AZURE_VI_ACCOUNT_ID")
        self.location = os.getenv("AZURE_VI_LOCATION", "eastus")
        self.subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
        self.resource_group = os.getenv("AZURE_RESOURCE_GROUP")
        self.vi_name = os.getenv("AZURE_VI_NAME")

        tenant_id = os.getenv("AZURE_TENANT_ID")
        client_id = os.getenv("AZURE_CLIENT_ID")
        client_secret = os.getenv("AZURE_CLIENT_SECRET")

        if tenant_id and client_id and client_secret:
            # Explicit Client Secret authentication for cloud deployments (Render, Vercel)
            self.credential = ClientSecretCredential(
                tenant_id=tenant_id,
                client_id=client_id,
                client_secret=client_secret
            )
        else:
            # Fallback to default credential chain (Azure CLI / Developer tools locally)
            self.credential = DefaultAzureCredential()

    def get_access_token(self) -> str:
        """Generates Azure Resource Manager (ARM) Access Token."""
        try:
            token_object = self.credential.get_token("https://management.azure.com/.default")
            return token_object.token
        except Exception as e:
            logger.error(f"Failed to obtain Azure ARM token: {str(e)}")
            raise e

    def get_account_token(self, arm_token: str) -> str:
        """Exchanges ARM Access Token for a Video Indexer Account Access Token."""
        url = (
            f"https://management.azure.com/subscriptions/{self.subscription_id}"
            f"/resourceGroups/{self.resource_group}"
            f"/providers/Microsoft.VideoIndexer/accounts/{self.vi_name}"
            f"/generateAccessToken?api-version=2024-01-01"
        )
        headers = {"Authorization": f"Bearer {arm_token}"}
        
        payload = {
            "permissionType": "Contributor",
            "scope": "Account"
        }
        
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        if response.status_code != 200:
            raise Exception(f"Failed to obtain Video Indexer account token: {response.text}")
            
        return response.json().get("accessToken")

    def get_account_access_token(self) -> str:
        """Convenience method to retrieve a fresh Video Indexer Account Token."""
        arm_token = self.get_access_token()
        return self.get_account_token(arm_token)

    def download_youtube_video(self, url: str) -> str:
        """Downloads a YouTube video to a temporary local MP4 file."""
        logger.info(f"Downloading YouTube video locally: {url}")
        
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".mp4")
        temp_path = temp_file.name
        temp_file.close()

        ydl_opts = {
            "format": "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
            "outtmpl": temp_path,
            "quiet": True,
            "overwrites": True,
            "extractor_args": {
                "youtube": {
                    "player_client": ["android", "web"]
                }
            }
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            logger.info(f"Download completed successfully: {temp_path}")
            return temp_path
        except Exception as e:
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise Exception(f"YouTube video download failed: {str(e)}")

    def upload_video_file(self, file_path: str, video_name: str) -> str:
        """Uploads a local video file directly to Azure Video Indexer via Multipart FormData."""
        token = self.get_account_access_token()
        api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos"

        params = {
            "accessToken": token,
            "name": video_name,
            "privacy": "Private",
            "indexingPreset": "Basic",
            "streamingPreset": "NoStreaming"
        }

        logger.info(f"Uploading local file '{file_path}' to Azure Video Indexer...")
        
        with open(file_path, "rb") as video_file:
            files = {"file": (os.path.basename(file_path), video_file, "video/mp4")}
            response = requests.post(api_url, params=params, files=files, timeout=300)

        if response.status_code != 200:
            raise Exception(f"Azure Video Indexer file upload failed ({response.status_code}): {response.text}")

        video_id = response.json().get("id")
        logger.info(f"Video uploaded successfully. Video ID: {video_id}")
        return video_id

    def upload_video_from_url(self, video_url: str, video_name: str) -> str:
        """
        Sends video URL to Azure Video Indexer.
        Automatically falls back to local download & multipart upload if YouTube blocks Azure URL fetching.
        """
        token = self.get_account_access_token()
        api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos"

        params = {
            "accessToken": token,
            "name": video_name,
            "privacy": "Private",
            "videoUrl": video_url,
            "indexingPreset": "Basic",
            "streamingPreset": "NoStreaming"
        }

        logger.info(f"Submitting video URL to Azure Video Indexer: {video_url}")
        
        try:
            response = requests.post(api_url, params=params, timeout=30)
            if response.status_code == 200:
                return response.json().get("id")
            else:
                logger.warning(
                    f"Direct URL upload rejected ({response.status_code}): {response.text}. "
                    "Switching to local download & upload fallback..."
                )
        except Exception as e:
            logger.warning(f"Direct URL upload attempt failed ({str(e)}). Switching to local download fallback...")

        # 🔄 FALLBACK: Download video locally via yt-dlp and upload directly
        temp_file_path = None
        try:
            temp_file_path = self.download_youtube_video(video_url)
            video_id = self.upload_video_file(temp_file_path, video_name)
            return video_id
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temporary video file: {temp_file_path}")

    def wait_for_processing(self, video_id: str, timeout_seconds: int = 900) -> dict:
        """
        Polls Azure Video Indexer until status is Processed.
        Uses adaptive backoff and a hard timeout to prevent infinite hanging.
        """
        logger.info(f"Waiting for video ID '{video_id}' to process...")
        start_time = time.time()
        poll_interval = 5

        while True:
            if time.time() - start_time > timeout_seconds:
                raise TimeoutError(f"Processing timed out after {timeout_seconds} seconds for video ID '{video_id}'.")

            vi_token = self.get_account_access_token()
            api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos/{video_id}/Index"
            params = {"accessToken": vi_token}

            response = requests.get(api_url, params=params, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                state = data.get("state")

                if state == "Processed":
                    logger.info("Azure Video Indexer processing complete.")
                    return data
                elif state == "Failed":
                    raise Exception("Video indexing failed in Azure Video Indexer.")
                elif state == "Quarantined":
                    raise Exception("Video quarantined due to content policy violation.")

                logger.info(f"Video state: {state}... Waiting {poll_interval}s.")
            else:
                logger.warning(f"Polling warning ({response.status_code}): {response.text}")

            time.sleep(poll_interval)
            poll_interval = min(poll_interval + 2, 15)

    def extract_data(self, vi_json: dict) -> dict:
        """Parses Azure Video Indexer JSON output to extract transcript, OCR, and duration."""
        transcript_lines = []
        ocr_lines = []

        for video in vi_json.get("videos", []):
            insights = video.get("insights", {})

            # Extract spoken dialogue transcript
            for item in insights.get("transcript", []):
                text = item.get("text", "").strip()
                if text:
                    transcript_lines.append(text)

            # Extract on-screen OCR text
            for item in insights.get("ocr", []):
                text = item.get("text", "").strip()
                if text:
                    ocr_lines.append(text)

        duration = vi_json.get("summarizedInsights", {}).get("duration", {})

        return {
            "transcript": " ".join(transcript_lines),
            "ocr_text": list(set(ocr_lines)),  # Deduplicate OCR text entries
            "video_metadata": {
                "duration": duration,
                "platform": "YouTube"
            }
        }

    def delete_video(self, video_id: str):
        """Deletes the video from Azure Video Indexer to prevent account storage bloat."""
        try:
            token = self.get_account_access_token()
            api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos/{video_id}"
            params = {"accessToken": token}
            
            response = requests.delete(api_url, params=params, timeout=15)
            if response.status_code == 204:
                logger.info(f"Successfully deleted Video ID '{video_id}' from Azure Video Indexer.")
            else:
                logger.warning(f"Failed to delete Video ID '{video_id}': {response.text}")
        except Exception as e:
            logger.error(f"Error while deleting Video ID '{video_id}': {str(e)}")