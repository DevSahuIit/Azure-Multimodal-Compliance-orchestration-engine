from langgraph.graph import StateGraph, END
from backend.src.graph.state import VideoAuditState
from backend.src.graph.nodes import index_video_node, audio_content_node

def create_graph():
    """Constructs and compiles the LangGraph DAG workflow."""
    
    # 1. Initialize StateGraph with schema
    workflow = StateGraph(VideoAuditState)

    # 2. Add computation nodes
    workflow.add_node("indexer", index_video_node)
    workflow.add_node("auditor", audio_content_node)

    # 3. Define execution entry point
    workflow.set_entry_point("indexer")

    # 4. Define directed edges
    workflow.add_edge("indexer", "auditor")
    workflow.add_edge("auditor", END)

    # 5. Compile into runnable graph
    app = workflow.compile()
    return app

# Expose executable app instance for CLI / FastAPI integration
app = create_graph()