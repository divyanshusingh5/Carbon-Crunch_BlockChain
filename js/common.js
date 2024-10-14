from pydantic import BaseModel, Field
from typing import List, Optional, Union
from enum import Enum

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
    BOOLEAN_OPERATION = "BOOLEAN_OPERATION"
    STAR = "STAR"
    LINE = "LINE"
    ELLIPSE = "ELLIPSE"
    REGULAR_POLYGON = "REGULAR_POLYGON"
    RECTANGLE = "RECTANGLE"
    TEXT = "TEXT"
    SLICE = "SLICE"
    COMPONENT = "COMPONENT"
    COMPONENT_SET = "COMPONENT_SET"
    INSTANCE = "INSTANCE"

class BlendMode(str, Enum):
    PASS_THROUGH = "PASS_THROUGH"
    NORMAL = "NORMAL"
    DARKEN = "DARKEN"
    MULTIPLY = "MULTIPLY"
    LINEAR_BURN = "LINEAR_BURN"
    COLOR_BURN = "COLOR_BURN"
    LIGHTEN = "LIGHTEN"
    SCREEN = "SCREEN"
    LINEAR_DODGE = "LINEAR_DODGE"
    COLOR_DODGE = "COLOR_DODGE"
    OVERLAY = "OVERLAY"
    SOFT_LIGHT = "SOFT_LIGHT"
    HARD_LIGHT = "HARD_LIGHT"
    DIFFERENCE = "DIFFERENCE"
    EXCLUSION = "EXCLUSION"
    HUE = "HUE"
    SATURATION = "SATURATION"
    COLOR = "COLOR"
    LUMINOSITY = "LUMINOSITY"

class ConstraintType(str, Enum):
    SCALE = "SCALE"
    WIDTH = "WIDTH"
    HEIGHT = "HEIGHT"

class LayoutAlign(str, Enum):
    MIN = "MIN"
    CENTER = "CENTER"
    MAX = "MAX"
    STRETCH = "STRETCH"

class LayoutMode(str, Enum):
    NONE = "NONE"
    HORIZONTAL = "HORIZONTAL"
    VERTICAL = "VERTICAL"

class StrokeAlign(str, Enum):
    INSIDE = "INSIDE"
    OUTSIDE = "OUTSIDE"
    CENTER = "CENTER"

class StyleType(str, Enum):
    FILL = "FILL"
    STROKE = "STROKE"
    TEXT = "TEXT"
    EFFECT = "EFFECT"
    GRID = "GRID"

class Constraint(BaseModel):
    type: ConstraintType
    value: float

class LayoutGrid(BaseModel):
    pattern: str
    sectionSize: float
    visible: bool
    color: Color
    alignment: LayoutAlign
    gutterSize: float
    offset: float
    count: int

class Effect(BaseModel):
    type: str
    visible: bool
    radius: float
    color: Color
    blendMode: BlendMode
    offset: Optional[Vector]

class Paint(BaseModel):
    type: str
    visible: bool
    opacity: float
    color: Optional[Color]
    blendMode: BlendMode
    gradientHandlePositions: Optional[List[Vector]]
    gradientStops: Optional[List[dict]]

class TypeStyle(BaseModel):
    fontFamily: str
    fontPostScriptName: Optional[str]
    fontWeight: int
    fontSize: float
    textAlignHorizontal: str
    textAlignVertical: str
    letterSpacing: float
    lineHeightPx: float
    lineHeightPercent: float
    lineHeightUnit: str

class BaseNode(BaseModel):
    id: str
    name: str
    visible: bool
    type: NodeType
    pluginData: Optional[dict]
    sharedPluginData: Optional[dict]

class Document(BaseNode):
    children: List['Node']

class Canvas(BaseNode):
    children: List['Node']
    backgroundColor: Color
    prototypeStartNodeID: Optional[str]
    exportSettings: List[dict]

class Frame(BaseNode):
    children: List['Node']
    locked: bool
    background: List[Paint]
    backgroundColor: Color
    exportSettings: List[dict]
    blendMode: BlendMode
    preserveRatio: bool
    constraints: Constraint
    layoutAlign: LayoutAlign
    layoutMode: LayoutMode
    layoutGrow: float
    clipsContent: bool
    layoutPositioning: str
    itemSpacing: float
    counterAxisSizingMode: str
    horizontalPadding: float
    verticalPadding: float
    itemReverseZIndex: bool
    strokesIncludedInLayout: bool
    absoluteBoundingBox: Rectangle
    size: Vector
    minWidth: Optional[float] = None
    maxWidth: Optional[float] = None
    minHeight: Optional[float] = None
    maxHeight: Optional[float] = None
    fills: List[Paint]
    strokes: List[Paint]
    strokeWeight: float
    strokeAlign: StrokeAlign
    cornerRadius: float
    rectangleCornerRadii: List[float]
    effects: List[Effect]
    style: Optional[dict]

class Group(BaseNode):
    children: List['Node']
    locked: bool
    exportSettings: List[dict]
    blendMode: BlendMode
    preserveRatio: bool
    layoutAlign: LayoutAlign
    layoutGrow: float
    absoluteBoundingBox: Rectangle
    size: Vector
    clipsContent: bool
    effects: List[Effect]

class Vector(BaseNode):
    locked: bool
    exportSettings: List[dict]
    blendMode: BlendMode
    preserveRatio: bool
    layoutAlign: LayoutAlign
    layoutGrow: float
    constraints: Constraint
    absoluteBoundingBox: Rectangle
    size: Vector
    fills: List[Paint]
    strokes: List[Paint]
    strokeWeight: float
    strokeAlign: StrokeAlign
    effects: List[Effect]
    style: Optional[dict]

class Text(BaseNode):
    locked: bool
    exportSettings: List[dict]
    blendMode: BlendMode
    preserveRatio: bool
    layoutAlign: LayoutAlign
    layoutGrow: float
    constraints: Constraint
    absoluteBoundingBox: Rectangle
    size: Vector
    fills: List[Paint]
    strokes: List[Paint]
    strokeWeight: float
    strokeAlign: StrokeAlign
    effects: List[Effect]
    characters: str
    style: TypeStyle
    characterStyleOverrides: List[int]
    styleOverrideTable: dict

class Component(BaseNode):
    children: List['Node']
    locked: bool
    exportSettings: List[dict]
    blendMode: BlendMode
    preserveRatio: bool
    layoutAlign: LayoutAlign
    layoutGrow: float
    constraints: Constraint
    absoluteBoundingBox: Rectangle
    size: Vector
    fills: List[Paint]
    strokes: List[Paint]
    strokeWeight: float
    strokeAlign: StrokeAlign
    effects: List[Effect]
    style: Optional[dict]

class Instance(BaseNode):
    componentId: str
    children: List['Node']
    locked: bool
    exportSettings: List[dict]
    blendMode: BlendMode
    preserveRatio: bool
    layoutAlign: LayoutAlign
    layoutGrow: float
    constraints: Constraint
    absoluteBoundingBox: Rectangle
    size: Vector
    fills: List[Paint]
    strokes: List[Paint]
    strokeWeight: float
    strokeAlign: StrokeAlign
    effects: List[Effect]
    style: Optional[dict]

Node = Union[Document, Canvas, Frame, Group, Vector, Text, Component, Instance]

Document.update_forward_refs()
Canvas.update_forward_refs()
Frame.update_forward_refs()
Group.update_forward_refs()

class FigmaFile(BaseModel):
    name: str
    lastModified: str
    thumbnailUrl: str
    version: str
    document: Document
    components: dict
    styles: dict
    schemaVersion: int
