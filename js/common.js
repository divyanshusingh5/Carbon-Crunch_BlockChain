const getImage = async (url: string) => {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const data = new Uint8Array(buffer);
  return figma.createImage(data);
};

type Color = {
  r: number;
  g: number;
  b: number;
};

type Position = {
  x: number;
  y: number;
};

type Shadow = {
  color: Color;
  x: number;
  y: number;
};

type Rectangle = {
  strokeWeight?: number;
  position: Position;
  color: Color;
  opacity?: number;
  width: number;
  height: number;
  cornerRadius?: number;
  dropShadow?: number;
};

type Text = {
  color: Color;
  fontSize: number;
  fontWeight: number;
  fontName: FontName;
  position: Position;
  width: number;
  height: number;
  characters: string;
  strokeWeight: number;
  textAlignHorizontal: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
};

type Ellipse = {
  position: Position;
  color: Color;
  height: number;
  width: number;
};

type Group = {
  children: Node[];
};

type Frame = {
  children: Node[];
};

type Node = {
  name: string;
  type: "FRAME" | "GROUP" | "RECTANGLE" | "TEXT" | "ELLIPSE";
  node: Frame | Group | Ellipse | Text | Rectangle;
};

type Scene = Array<Node>;

/* ##########################################
 * # Node Creation Functions
 * ########################################## */

const clone = (x: object | Array<any>): Array<any> => {
  return JSON.parse(JSON.stringify(x));
};

const createRectangle = (name: string, spec: Rectangle): SceneNode => {
  const node = figma.createRectangle();
  node.name = name;
  node.x = spec.position.x;
  node.y = spec.position.y;
  node.resize(spec.width, spec.height);
  const fills = clone(node.fills as Array<any>);
  fills[0].color = spec.color;
  node.fills = fills;
  node.strokeWeight = spec.strokeWeight ?? 0;
  node.cornerRadius = spec.cornerRadius ?? 0;

  if (spec.dropShadow) {
    node.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.25 },
        offset: { x: 0, y: spec.dropShadow },
        radius: 4,
        spread: 0,
        visible: true,
        blendMode: "NORMAL",
      },
    ];
  }

  return node;
};

const createCircle = (name: string, spec: Ellipse): SceneNode => {
  const node = figma.createEllipse();
  node.name = name;
  node.x = spec.position.x;
  node.y = spec.position.y;
  node.resize(spec.width, spec.height);
  const fills = clone(node.fills as Array<any>);
  fills[0].color = spec.color;
  node.fills = fills;
  return node;
};

const createText = (name: string, spec: Text): SceneNode => {
  const node = figma.createText();
  node.name = name;
  node.x = spec.position.x;
  node.y = spec.position.y;
  node.resize(spec.width, spec.height);
  node.characters = spec.characters;
  node.fontSize = spec.fontSize;
  node.fontName = spec.fontName;
  node.strokeWeight = spec.strokeWeight;
  const fills = clone(node.fills as Array<any>);
  fills[0].color = spec.color;
  node.fills = fills;
  node.textAlignHorizontal = spec.textAlignHorizontal;
  return node;
};

const createGroupNode = (name: string, spec: Group, frame: FrameNode): SceneNode => {
  const node = figma.group(
    spec.children.map((x) => createNode(x, frame)),
    frame
  );
  node.name = name;
  return node;
};

const createNode = (node: Node, frame: FrameNode): SceneNode => {
  if (node.type === "GROUP") return createGroupNode(node.name, node.node as Group, frame);
  if (node.type === "RECTANGLE") return createRectangle(node.name, node.node as Rectangle);
  if (node.type === "ELLIPSE") return createCircle(node.name, node.node as Ellipse);
  if (node.type === "TEXT") return createText(node.name, node.node as Text);
  throw new Error(`Unknown node type: ${node.type}`);
};

const createScene = (scene: Scene, frame: FrameNode): SceneNode => {
  const nodes = scene.map((x) => createNode(x, frame));
  let outputGroup: GroupNode;
  if (nodes.length === 1) {
    outputGroup = nodes[0] as GroupNode;
    outputGroup.x = 0;
    outputGroup.y = 0;
  } else {
    outputGroup = figma.group(nodes, frame);
  }
  return outputGroup;
};

/* ##########################################
 * # Node Serialization Functions
 * ########################################## */

const serializeRectangleNode = (node: RectangleNode): Node => {
  const fills = node.fills;
  let color: Color = { r: 0, g: 0, b: 0 };

  if (Array.isArray(fills) && fills.length > 0 && 'color' in fills[0]) {
    color = (fills[0] as SolidPaint).color;
  }

  const dropShadowEffect = node.effects.find(
    (effect) => effect.type === "DROP_SHADOW"
  ) as DropShadowEffect | undefined;
  const dropShadow = dropShadowEffect?.offset?.y;

  return {
    name: node.name,
    type: "RECTANGLE",
    node: {
      color,
      position: { x: node.x, y: node.y },
      width: node.width,
      height: node.height,
      cornerRadius: node.cornerRadius as number,
      strokeWeight: typeof node.strokeWeight === 'number' ? node.strokeWeight : 0,
      dropShadow,
    },
  };
};

const serializeTextNode = (node: TextNode): Node => {
  const fills = node.fills;
  let color: Color = { r: 0, g: 0, b: 0 };

  if (Array.isArray(fills) && fills.length > 0 && 'color' in fills[0]) {
    color = (fills[0] as SolidPaint).color;
  }

  return {
    name: node.name,
    type: "TEXT",
    node: {
      characters: node.characters,
      color: color,
      fontSize: typeof node.fontSize === 'number' ? node.fontSize : 12, // Default font size
      fontWeight: typeof node.fontWeight === 'number' ? node.fontWeight : 400, // Default weight
      fontName: typeof node.fontName === 'object' ? node.fontName : { family: "Roboto", style: "Regular" }, // Default font
      position: { x: node.x, y: node.y },
      width: node.width,
      height: node.height,
      textAlignHorizontal: node.textAlignHorizontal,
    },
  };
};

const serializeEllipseNode = (node: EllipseNode): Node => {
  const fills = node.fills;
  let color: Color = { r: 0, g: 0, b: 0 };

  if (Array.isArray(fills) && fills.length > 0 && 'color' in fills[0]) {
    color = (fills[0] as SolidPaint).color;
  }

  return {
    name: node.name,
    type: "ELLIPSE",
    node: {
      position: { x: node.x, y: node.y },
      color: color,
      width: node.width,
      height: node.height,
    },
  };
};

const serializeGroupNode = (node: GroupNode): Node => {
  const children = node.children.map((x) => serializeNode(x));
  return {
    name: node.name,
    type: "GROUP",
    node: { children },
  };
};

const serializeFrameNode = (node: FrameNode): Node => {
  const children = node.children.map((x) => serializeNode(x));
  return {
    name: node.name,
    type: "FRAME",
    node: { children },
  };
};

const serializeNode = (node: SceneNode): Node => {
  if (node.type === "RECTANGLE") return serializeRectangleNode(node);
  if (node.type === "TEXT") return serializeTextNode(node);
  if (node.type === "ELLIPSE") return serializeEllipseNode(node);
  if (node.type === "GROUP") return serializeGroupNode(node);
  if (node.type === "FRAME") return serializeFrameNode(node);
  throw new Error(`Unknown node type: ${node.type}`);
};

/* ##########################################
 * # Utils
 * ########################################## */

const serverUrl = "http://localhost:8081";

const testConnection = async () => {
  const response = await fetch(`${serverUrl}/healthcheck`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const json = await response.json();
  if (json.status === "ok") {
    console.log("Connection to server is ok");
  } else {
    console.error("Connection to server failed");
  }
};

const str2ab = (str: string): Uint8Array => {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0; i < str.length; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return bufView;
};

const saveScene = async () => {
  const exampleNodes = figma.currentPage.children.filter((x) =>
    x.name.startsWith("Example")
  );
  const scene = exampleNodes.map((node) => serializeNode(node));
  const response = await fetch(`${serverUrl}/save-scene`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: str2ab(JSON.stringify({ scene })),
  });
  const json = await response.json();
  console.log("Scene saved successfully", json);
};

const runPrompt = async (promptType: string) => {
  const response = await fetch(`${serverUrl}/convert/${promptType}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  const json = await response.json();
  console.log(`Prompt '${promptType}' executed successfully`, json);
};

