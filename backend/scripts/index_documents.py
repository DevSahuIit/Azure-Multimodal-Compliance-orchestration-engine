import os
import glob
import logging
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import AzureSearch

# --------------------------------------------------------------------------
# Setup Logging
# --------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("indexer")

# Load environment variables
load_dotenv(override=True)


def index_docs():
    """
    Reads PDFs from backend/data, splits them into chunks using RecursiveCharacterTextSplitter,
    embeds them using Ollama, and indexes them into Azure AI Search.
    """
    # 1. Define folder paths relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_folder = os.path.join(script_dir, "..", "data")

    logger.info("--------------------------------------------------")
    logger.info("Environment & Path Configuration Check:")
    logger.info(f"Ollama Embedding Model : {os.getenv('OLLAMA_EMBEDDING_MODEL', 'nomic-embed-text')}")
    logger.info(f"Azure Search Endpoint  : {os.getenv('AZURE_SEARCH_ENDPOINT')}")
    logger.info(f"Azure Search Index Name: {os.getenv('AZURE_SEARCH_INDEX_NAME')}")
    logger.info("--------------------------------------------------")

    # 2. Validate required environment variables
    required_vars = [
        "AZURE_SEARCH_ENDPOINT",
        "AZURE_SEARCH_API_KEY",
        "AZURE_SEARCH_INDEX_NAME",
    ]
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"Missing required environment variables: {missing_vars}")
        logger.error("Please check your .env file and ensure all variables are set.")
        return

    # 3. Initialize Ollama Embeddings (Replaces AzureOpenAIEmbeddings)
    try:
        logger.info("Initializing Ollama Embeddings...")
        embeddings = OllamaEmbeddings(
            model=os.getenv("OLLAMA_EMBEDDING_MODEL", "nomic-embed-text")
        )
        logger.info("Ollama Embeddings initialized successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Ollama embeddings: {str(e)}")
        logger.error("Please make sure Ollama is running and you have pulled the model (`ollama pull nomic-embed-text`).")
        return

    # 4. Initialize Azure AI Search Vector Store
    try:
        logger.info("Initializing Azure AI Search vector store...")
        index_name = os.getenv("AZURE_SEARCH_INDEX_NAME")
        vector_store = AzureSearch(
            azure_search_endpoint=os.getenv("AZURE_SEARCH_ENDPOINT"),
            azure_search_key=os.getenv("AZURE_SEARCH_API_KEY"),
            index_name=index_name,
            embedding_function=embeddings.embed_query
        )
        logger.info(f"Vector store initialized for index: {index_name}")
    except Exception as e:
        logger.error(f"Failed to initialize Azure Search: {str(e)}")
        logger.error("Please verify your Azure Search endpoint, API key, and index name.")
        return

    # 5. Scan and load PDF documents from data folder
    pdf_files = glob.glob(os.path.join(data_folder, "*.pdf"))
    if not pdf_files:
        logger.warning(f"No PDFs found in the data folder ({data_folder}). Please add PDF files.")
        return

    logger.info(f"Found {len(pdf_files)} PDF(s) to process: {[os.path.basename(f) for f in pdf_files]}")

    # 6. Load and split documents
    all_splits = []
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    for pdf_path in pdf_files:
        filename = os.path.basename(pdf_path)
        try:
            logger.info(f"Loading document: {filename}")
            loader = PyPDFLoader(pdf_path)
            raw_docs = loader.load()

            splits = text_splitter.split_documents(raw_docs)

            # Add filename metadata to each chunk
            for split in splits:
                split.metadata["source"] = filename

            all_splits.extend(splits)
            logger.info(f"Splitted {filename} into {len(splits)} chunks.")

        except Exception as e:
            logger.error(f"Failed to process PDF {filename}: {str(e)}")

    # 7. Upload document chunks to Azure AI Search
    if all_splits:
        logger.info(f"Uploading {len(all_splits)} total chunks to Azure AI Search index '{index_name}'...")
        try:
            vector_store.add_documents(all_splits)
            logger.info("Indexing complete! Knowledge base is ready.")
            logger.info(f"Indexed {len(all_splits)} total chunks into Azure AI Search.")
        except Exception as e:
            logger.error(f"Failed to upload documents to Azure Search: {str(e)}")
            logger.error("Please check your Azure Search configuration and try again.")
    else:
        logger.warning("No document chunks were processed.")


if __name__ == "__main__":
    index_docs()