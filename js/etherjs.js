import openai
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional, Union, Dict, Any
from enum import Enum
import json

# Set up your OpenAI API key
openai.api_key = 'your-api-key-here'

# Pydantic models for Figma-like structures

class Color(BaseModel):
    r: float
    g: float
    b: float
    a: float

class Vector(BaseModel):
    x: float
    y: float

class Rectangle(BaseModel):
    x: float
    y: float
    width: float
    height: float

class NodeType(str, Enum):
    DOCUMENT = "DOCUMENT"
    CANVAS = "CANVAS"
    FRAME = "FRAME"
    GROUP = "GROUP"
    VECTOR = "VECTOR"
    TEXT = "TEXT"
    COMPONENT = "COMPONENT"
    INSTANCE = "INSTANCE"

class BaseNode(BaseModel):
    id: str
    name: str
    visible: bool
    type: NodeType
    pluginData: Optional[Dict[str, Any]]
    sharedPluginData: Optional[Dict[str, Any]]

class Document(BaseNode):
    children: List['Node']

class Canvas(BaseNode):
    children: List['Node']
    backgroundColor: Color

class Frame(BaseNode):
    children: List['Node']
    background: List[Dict[str, Any]]
    backgroundColor: Color
    size: Vector

class Group(BaseNode):
    children: List['Node']
    size: Vector

class Vector(BaseNode):
    size: Vector
    strokeWeight: float

class Text(BaseNode):
    characters: str
    style: Dict[str, Any]
    size: Vector

class Component(BaseNode):
    children: List['Node']
    size: Vector

class Instance(BaseNode):
    componentId: str
    size: Vector

Node = Union[Document, Canvas, Frame, Group, Vector, Text, Component, Instance]

# Update forward references
Document.update_forward_refs()
Canvas.update_forward_refs()
Frame.update_forward_refs()
Group.update_forward_refs()

class FigmaFile(BaseModel):
    name: str
    lastModified: str
    version: str
    document: Document
    components: Dict[str, Any]
    styles: Dict[str, Any]
    schemaVersion: int

class FlexibleNode(BaseModel):
    __root__: Dict[str, Any]

    def __getattr__(self, name):
        return self.__root__.get(name)

# Update the Node type to include FlexibleNode
Node = Union[Document, Canvas, Frame, Group, Vector, Text, Component, Instance, FlexibleNode]

# GPT Integration Functions

def generate_gpt_response(prompt: str) -> str:
    """Generate a response from GPT based on the given prompt."""
    response = openai.Completion.create(
        engine="text-davinci-002",
        prompt=prompt,
        max_tokens=1000,
        n=1,
        stop=None,
        temperature=0.7,
    )
    return response.choices[0].text.strip()

def parse_gpt_response(response: str) -> Dict[str, Any]:
    """Parse the GPT response into a dictionary."""
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        print("Error: GPT response is not valid JSON")
        return {}

def create_node(node_data: Dict[str, Any]) -> Node:
    """Create a Node object based on the node type."""
    node_type = node_data.get('type')
    try:
        if node_type == 'DOCUMENT':
            return Document(**node_data)
        elif node_type == 'CANVAS':
            return Canvas(**node_data)
        elif node_type == 'FRAME':
            return Frame(**node_data)
        elif node_type == 'GROUP':
            return Group(**node_data)
        elif node_type == 'VECTOR':
            return Vector(**node_data)
        elif node_type == 'TEXT':
            return Text(**node_data)
        elif node_type == 'COMPONENT':
            return Component(**node_data)
        elif node_type == 'INSTANCE':
            return Instance(**node_data)
        else:
            return FlexibleNode(__root__=node_data)
    except ValidationError as e:
        print(f"Validation error for node type {node_type}: {e}")
        return FlexibleNode(__root__=node_data)

def create_figma_file(file_data: Dict[str, Any]) -> FigmaFile:
    """Create a FigmaFile object from the parsed data."""
    try:
        # Recursively create Node objects for the document and its children
        def process_children(node_data):
            if isinstance(node_data, dict):
                children = node_data.get('children', [])
                if children:
                    node_data['children'] = [process_children(child) for child in children]
                return create_node(node_data)
            elif isinstance(node_data, list):
                return [process_children(child) for child in node_data]
            else:
                return node_data

        file_data['document'] = process_children(file_data['document'])
        return FigmaFile(**file_data)
    except ValidationError as e:
        print(f"Validation error for FigmaFile: {e}")
        return None

def generate_figma_like_response(prompt: str) -> FigmaFile:
    """Generate a Figma-like response using GPT and parse it into a FigmaFile object."""
    gpt_prompt = f"""
    Generate a Figma-like JSON structure for the following design request: {prompt}
    Include a document with at least one canvas, frame, and various design elements like shapes and text.
    Follow this structure:
    {{
        "name": "Design File",
        "lastModified": "2023-05-20T12:00:00Z",
        "version": "1",
        "document": {{
            "id": "0:1",
            "name": "Document",
            "type": "DOCUMENT",
            "children": [
                {{
                    "id": "1:1",
                    "name": "Page 1",
                    "type": "CANVAS",
                    "backgroundColor": {{"r": 0.9, "g": 0.9, "b": 0.9, "a": 1}},
                    "children": [
                        {{
                            "id": "2:1",
                            "name": "Frame 1",
                            "type": "FRAME",
                            "size": {{"x": 1000, "y": 800}},
                            "children": [
                                // Add design elements here
                            ]
                        }}
                    ]
                }}
            ]
        }},
        "components": {{}},
        "styles": {{}},
        "schemaVersion": 1
    }}
    """

    gpt_response = generate_gpt_response(gpt_prompt)
    parsed_response = parse_gpt_response(gpt_response)
    figma_file = create_figma_file(parsed_response)

    return figma_file

# Example usage
if __name__ == "__main__":
    design_prompt = "Create a simple landing page with a header, hero section, and footer."
    figma_file = generate_figma_like_response(design_prompt)

    if figma_file:
        print(f"Generated Figma-like file: {figma_file.name}")
        print(f"Document structure: {figma_file.document}")
    else:
        print("Failed to generate a valid Figma-like structure.")
Last edited 1 minute ago
