import os
import time
import logging
import requests
import yt_dlp
from azure.identity import DefaultAzureCredential

logger = logging.getLogger("video_indexer")


class VideoIndexerService:
    def __init__(self):
        self.account_id = os.getenv("AZURE_VI_ACCOUNT_ID")
        self.location = os.getenv("AZURE_VI_LOCATION", "eastus")
        self.subscription_id = os.getenv("AZURE_SUBSCRIPTION_ID")
        self.resource_group = os.getenv("AZURE_RESOURCE_GROUP")
        self.vi_name = os.getenv("AZURE_VI_NAME")
        self.credential = DefaultAzureCredential()

    def get_access_token(self):
        """Generates Azure Resource Manager (ARM) Access Token."""
        try:
            token_object = self.credential.get_token("https://management.azure.com/.default")
            return token_object.token
        except Exception as e:
            logger.error(f"Failed to get Azure token: {str(e)}")
            raise e

    def get_account_token(self, arm_token: str):
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
        
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code != 200:
            raise Exception(f"Failed to get VI account token: {response.text}")
            
        return response.json().get("accessToken")

    def download_youtube_video(self, url: str, output_path: str = "temp_video.mp4") -> str:
        """Downloads YouTube video locally via yt-dlp."""
        logger.info(f"Downloading YouTube video: {url}")
        ydl_opts = {
            "format": "best[ext=mp4]/best",
            "outtmpl": output_path,
            "quiet": False,
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
            logger.info("Download complete.")
            return output_path
        except Exception as e:
            raise Exception(f"YouTube video download failed: {str(e)}")

    def upload_video(self, video_path: str, video_name: str) -> str:
        """Uploads the local binary video file to Azure Video Indexer with fast indexing presets."""
        arm_token = self.get_access_token()
        vi_token = self.get_account_token(arm_token)

        api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos"
        
        # ⚡ OPTIMIZED PARAMS FOR SPEED:
        params = {
            "accessToken": vi_token,
            "name": video_name,
            "privacy": "Private",
            "indexingPreset": "Basic",        # Basic indexing: extracts transcript + OCR without heavy CV
            "streamingPreset": "NoStreaming"   # Skips video HLS re-encoding (saves ~90 seconds)
        }

        logger.info(f"Uploading binary file from {video_path} to Azure Video Indexer (Fast Preset)...")
        with open(video_path, "rb") as video_file:
            files = {"file": video_file}
            response = requests.post(api_url, params=params, files=files)

        if response.status_code != 200:
            raise Exception(f"Azure upload failed: {response.text}")

        return response.json().get("id")

    def wait_for_processing(self, video_id: str) -> dict:
        """Polls Azure Video Indexer until status transitions to Processed."""
        logger.info(f"Waiting for video ID '{video_id}' to process...")
        while True:
            arm_token = self.get_access_token()
            vi_token = self.get_account_token(arm_token)

            api_url = f"https://api.videoindexer.ai/{self.location}/Accounts/{self.account_id}/Videos/{video_id}/Index"
            params = {"accessToken": vi_token}

            response = requests.get(api_url, params=params)
            data = response.json()
            state = data.get("state")

            if state == "Processed":
                logger.info("Azure Video Indexer processing complete.")
                return data
            elif state == "Failed":
                raise Exception("Video indexing failed in Azure.")
            elif state == "Quarantined":
                raise Exception("Video quarantined due to copyright or content policy violation.")

            # ⚡ OPTIMIZED: Reduced check interval from 30s to 5s for rapid state detection
            logger.info(f"Status: {state}... Waiting 5 seconds.")
            time.sleep(5)

    def extract_data(self, vi_json: dict) -> dict:
        """Parses raw Azure Video Indexer JSON output to extract transcript, OCR text, and duration."""
        transcript_lines = []
        ocr_lines = []

        for video in vi_json.get("videos", []):
            insights = video.get("insights", {})

            # Extract spoken dialogue transcript
            for item in insights.get("transcript", []):
                if item.get("text"):
                    transcript_lines.append(item.get("text"))

            # Extract on-screen OCR text
            for item in insights.get("ocr", []):
                if item.get("text"):
                    ocr_lines.append(item.get("text"))

        # Extract video duration
        duration = vi_json.get("summarizedInsights", {}).get("duration", {})

        return {
            "transcript": " ".join(transcript_lines),
            "ocr_text": ocr_lines,
            "video_metadata": {
                "duration": duration,
                "platform": "YouTube"
            }
        }