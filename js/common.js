import os
from langchain.indexes import VectorstoreIndexCreator
from langchain_community.document_loaders.figma import FigmaFileLoader
from langchain_core.prompts.chat import (
    ChatPromptTemplate,
    HumanMessagePromptTemplate,
    SystemMessagePromptTemplate,
)
from langchain_openai import ChatOpenAI

# Setup Figma File Loader
figma_loader = FigmaFileLoader(
    os.environ.get("ACCESS_TOKEN"),  # Your Figma access token
    os.environ.get("NODE_IDS", ""),  # Optional: Node IDs, or leave blank for the whole document
    os.environ.get("FILE_KEY")  # The Figma file key
)

# Index the Figma document
index = VectorstoreIndexCreator().from_loaders([figma_loader])
figma_doc_retriever = index.vectorstore.as_retriever()

def generate_code(human_input):
    # System message template to instruct the model
    system_prompt_template = """You are expert coder Jon Carmack. Use the provided design context to create idiomatic HTML/CSS code as possible based on the user request.
    Everything must be inline in one file and your response must be directly renderable by the browser.
    Figma file nodes and metadata: {context}"""

    # Human prompt asking for a specific element
    human_prompt_template = "Code the {text}. Ensure it's mobile responsive"
    
    # Create system and human message prompts
    system_message_prompt = SystemMessagePromptTemplate.from_template(system_prompt_template)
    human_message_prompt = HumanMessagePromptTemplate.from_template(human_prompt_template)

    # Use the gpt-4-0-mini model for response generation
    chat_model = ChatOpenAI(temperature=0.02, model_name="gpt-4-0-mini")  # Update to gpt-4-0-mini

    # Retrieve relevant nodes from the Figma file
    relevant_nodes = figma_doc_retriever.invoke(human_input)

    # Format the chat conversation
    conversation = [system_message_prompt, human_message_prompt]
    chat_prompt = ChatPromptTemplate.from_messages(conversation)

    # Generate a response using the model
    response = chat_model(
        chat_prompt.format_prompt(
            context=relevant_nodes, text=human_input
        ).to_messages()
    )
    return response

# Example usage
response = generate_code("page top header")
print(response.content)
# Figma API Access Token
ACCESS_TOKEN=your_figma_access_token_here

# Figma File Key (from the URL)
FILE_KEY=your_figma_file_key_here

# Optional: Figma Node IDs (comma-separated if multiple, or leave blank)
NODE_IDS=your_node_ids_here
