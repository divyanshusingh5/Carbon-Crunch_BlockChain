import requests
from pydantic import BaseModel, Field, ValidationError
from typing import List, Optional, Union, Dict, Any
from enum import Enum
import json

# Set up your Figma API key and file ID
FIGMA_API_KEY = 'your-figma-api-key-here'  # Replace with your actual Figma API key
FIGMA_FILE_ID = 'your-figma-file-id-here'  # Replace with your actual Figma file ID

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
    pluginData: Optional[Dict[str, Any]] = None
    sharedPluginData: Optional[Dict[str, Any]] = None

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

class VectorNode(BaseNode):  # Renamed to VectorNode to avoid conflict
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

Node = Union[Document, Canvas, Frame, Group, VectorNode, Text, Component, Instance]

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

# Fetch data from Figma API
def fetch_figma_file(file_id: str):
    url = f'https://api.figma.com/v1/files/{file_id}'
    headers = {
        'X-Figma-Token': FIGMA_API_KEY,
    }
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        print(f'Error fetching data: {response.status_code} - {response.text}')
        return None

# Validate the Figma file data using Pydantic models
def validate_figma_file(file_data: dict):
    try:
        figma_file = FigmaFile(**file_data)
        print("Validation successful!")
        return figma_file
    except ValidationError as e:
        print(f"Validation error: {e}")
        return None

# Example usage
if __name__ == "__main__":
    # Fetch the Figma file data
    file_data = fetch_figma_file(FIGMA_FILE_ID)
    
    if file_data:
        # Validate the fetched file data
        figma_file = validate_figma_file(file_data)

        if figma_file:
            print(f"Figma file name: {figma_file.name}")
            print(f"Last modified: {figma_file.lastModified}")
        else:
            print("Invalid Figma file structure.")
