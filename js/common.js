from pydantic import BaseModel, AnyUrl
from typing import List, Optional, Dict, Union

# Basic Global Properties common across all nodes
class Node(BaseModel):
    id: str
    name: str
    visible: bool = True
    type: str
    rotation: Optional[float] = 0
    pluginData: Optional[Any]
    sharedPluginData: Optional[Any]
    componentPropertyReferences: Optional[Dict[str, str]]
    boundVariables: Optional[Dict[str, Union[str, List[str], Dict[str, str]]]]
    explicitVariableModes: Optional[Dict[str, str]]

# Color type (RGBA)
class Color(BaseModel):
    r: float
    g: float
    b: float
    a: float

# Export settings for nodes
class ExportSetting(BaseModel):
    suffix: Optional[str]
    format: str  # JPG, PNG, SVG
    constraint: Optional[Dict[str, Union[str, float]]]  # For scaling or size

# Rectangle model for bounding boxes
class Rectangle(BaseModel):
    x: float
    y: float
    width: float
    height: float

# Vector model for size
class Vector(BaseModel):
    x: float
    y: float

# Effect Model (e.g., shadows, blurs)
class Effect(BaseModel):
    type: str  # INNER_SHADOW, DROP_SHADOW, LAYER_BLUR, BACKGROUND_BLUR
    visible: bool = True
    radius: float
    color: Optional[Color]
    blendMode: Optional[str]
    offset: Optional[Vector]
    spread: Optional[float] = 0

# Paint Model (for fills, strokes)
class Paint(BaseModel):
    type: str  # SOLID, GRADIENT_LINEAR, IMAGE, etc.
    visible: bool = True
    opacity: float = 1.0
    color: Optional[Color]
    gradientHandlePositions: Optional[List[Vector]]
    gradientStops: Optional[List[Dict[str, Union[float, Color]]]]
    imageRef: Optional[str]

# Transform Matrix
class Transform(BaseModel):
    matrix: List[List[float]]

# Common properties for frame and instance nodes
class Frame(Node):
    children: List[Node]
    locked: bool = False
    backgroundColor: Optional[Color]
    fills: List[Paint] = []
    strokes: List[Paint] = []
    strokeWeight: Optional[float]
    strokeAlign: Optional[str]  # INSIDE, OUTSIDE, CENTER
    cornerRadius: Optional[float]
    size: Vector
    relativeTransform: Optional[Transform]
    absoluteBoundingBox: Optional[Rectangle]
    opacity: float = 1
    effects: List[Effect] = []
    exportSettings: List[ExportSetting] = []

# Vector node model (extends Frame with vector-specific properties)
class Vector(Frame):
    strokeDashes: Optional[List[float]]
    strokeCap: Optional[str]  # NONE, ROUND, SQUARE, LINE_ARROW, etc.
    strokeJoin: Optional[str]  # MITER, BEVEL, ROUND
    strokeMiterAngle: Optional[float] = 28.96

# Text Style (for TEXT nodes)
class TextStyle(BaseModel):
    fontFamily: str
    fontPostScriptName: Optional[str]
    paragraphSpacing: Optional[float]
    paragraphIndent: Optional[float]
    fontWeight: Optional[float]
    fontSize: float
    textAlignHorizontal: Optional[str]  # LEFT, RIGHT, CENTER, etc.
    textAlignVertical: Optional[str]  # TOP, CENTER, BOTTOM
    letterSpacing: Optional[float]
    lineHeight: Optional[float]

# Text node model (inherits Vector and adds text-specific fields)
class Text(Vector):
    characters: str
    style: TextStyle
    styleOverrideTable: Optional[Dict[int, TextStyle]]
    characterStyleOverrides: Optional[List[int]] = []

# Component model (inherits from Frame)
class Component(Frame):
    componentPropertyDefinitions: Dict[str, Any] = {}

# Component Set Model
class ComponentSet(Frame):
    componentPropertyDefinitions: Dict[str, Any] = {}

# Instance Model (inherits Frame and Component specific fields)
class Instance(Frame):
    componentId: str
    isExposedInstance: bool = False
    exposedInstances: List[str] = []
    componentProperties: Dict[str, Union[str, bool]] = {}
    overrides: Optional[List[str]] = []

# Canvas Model (inherits Node)
class Canvas(Node):
    children: List[Frame]
    backgroundColor: Optional[Color]

# Document model (inherits Node and represents the root of the Figma document)
class Document(Node):
    children: List[Canvas]

# FlowStartingPoint model
class FlowStartingPoint(BaseModel):
    nodeId: str
    name: str

# PrototypeDevice model
class PrototypeDevice(BaseModel):
    type: str  # NONE, PRESET, CUSTOM, PRESENTATION
    size: Vector
    presetIdentifier: Optional[str]
    rotation: Optional[str]  # NONE, CCW_90

# API response schema for Figma file
class FigmaAPIResponse(BaseModel):
    document: Document
    schemaVersion: str
    name: str
    lastModified: str
    thumbnailUrl: AnyUrl
    version: str
    role: str
    flowStartingPoints: Optional[List[FlowStartingPoint]] = []
    prototypeDevice: Optional[PrototypeDevice]
......................


        import json
from pydantic import ValidationError
from typing import Any
from pathlib import Path
from pydantic.error_wrappers import display_errors
from figma_pydantic_schema import FigmaAPIResponse  # Adjust the import path as needed

# Function to load a JSON file
def load_json(filepath: str) -> Any:
    """Load JSON data from a file."""
    with open(filepath, 'r') as file:
        return json.load(file)

# Function to validate the Figma API response against the Pydantic schema
def validate_figma_response(data: dict) -> None:
    """Validate the Figma API response using Pydantic schema."""
    try:
        # Validate the data using the FigmaAPIResponse schema
        FigmaAPIResponse.parse_obj(data)
        print("Validation succeeded!")
    except ValidationError as e:
        # Handle validation errors and provide detailed feedback
        print("Validation failed!")
        for error in e.errors():
            loc = " -> ".join(str(step) for step in error['loc'])  # JSON path of the error
            print(f"Error at {loc}: {error['msg']} (expected: {error['type']})")
        # Optional: print detailed errors using Pydantic's built-in display
        print(display_errors(e.errors()))

# Main script to load and validate the JSON response
if __name__ == "__main__":
    # Load the Figma API response from a file (adjust the path as needed)
    figma_file_path = 'figma_response.json'  # Change to the path of your Figma API response JSON
    figma_data = load_json(figma_file_path)

    # Validate the JSON response
    validate_figma_response(figma_data)

