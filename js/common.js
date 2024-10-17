// Define the required types
type Color = {
  r: number;
  g: number;
};

type Position = {
  x: number;
  y: number;
};

type Rectangle = {
  position: Position;
  color: Color;
  width: number;
  height: number;
  strokeWeight?: number;
  cornerRadius?: number;
  dropShadow?: number;
};

type CustomTextNode = {
  name: string;
  type: "TEXT";
  text: {
    content: string; // The text content
    fontSize?: number; // Optional font size
    color?: Color; // Optional text color
    fontName?: { family: string; style: string }; // Optional font name
    position?: Position; // Optional position
  };
};

// Update the Node type to include both Rectangle and CustomTextNode
type Node = { type: "RECTANGLE"; name: string; node: Rectangle } | CustomTextNode;

type Scene = Array<Node>;

// Utility function to clone objects
const clone = (x: object | Array<any>): Array<any> => {
  return JSON.parse(JSON.stringify(x));
};

// Function to create a rectangle node
const createRectangle = (name: string, spec: Rectangle): SceneNode => {
  const node = figma.createRectangle();
  node.name = name;
  node.x = spec.position.x;
  node.y = spec.position.y;
  node.resize(spec.width, spec.height);

  // Set colors
  const fills = clone(node.fills as Array<any>);
  fills[0].color = spec.color;
  node.fills = fills;
  node.strokeWeight = spec.strokeWeight || 0;
  node.cornerRadius = spec.cornerRadius || 0;

  // Set drop shadow if specified
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
        showShadowBehindNode: false,
      },
    ];
  }
  return node;
};

// Function to create a text node
const createTextNode = async (textSpec: CustomTextNode): Promise<SceneNode> => {
  const textNode = figma.createText();
  textNode.name = textSpec.name;

  // Load the font before setting font-related properties
  if (textSpec.text.fontName) {
    await figma.loadFontAsync(textSpec.text.fontName);
    textNode.fontName = textSpec.text.fontName; // Set the font name
  }

  // Set text content
  textNode.characters = textSpec.text.content;

  // Optional properties
  if (textSpec.text.fontSize) {
    textNode.fontSize = textSpec.text.fontSize;
  }

  if (textSpec.text.color) {
    const fills = clone(textNode.fills as Array<any>);
    fills[0].color = textSpec.text.color;
    textNode.fills = fills;
  }

  // Set position if provided
  if (textSpec.text.position) {
    textNode.x = textSpec.text.position.x;
    textNode.y = textSpec.text.position.y;
  }

  return textNode;
};

// Function to create a group of nodes
const createGroup = (nodes: SceneNode[], frame: FrameNode): GroupNode => {
  const group = figma.group(nodes, frame);
  group.x = 0; // Optional: Set the group's position relative to the frame
  group.y = 0;
  return group;
};

// Function to create a scene with all nodes, optionally grouped
const createScene = async (scene: Scene, frame: FrameNode): Promise<FrameNode> => {
  try {
    const nodes: SceneNode[] = []; // Collect nodes to be grouped later
    await Promise.all(
      scene.map(async (node: Node) => {
        let createdNode: SceneNode;
        if (node.type === "RECTANGLE") {
          createdNode = createRectangle(node.name, node.node);
        } else if (node.type === "TEXT") {
          createdNode = await createTextNode(node); // Create text node
        } else {
          throw new Error(`Unsupported node type:`);
        }
        nodes.push(createdNode); // Store the created node
      })
    );

    // Optional: Group nodes together if more than one
    if (nodes.length > 1) {
      createGroup(nodes, frame); // Group all nodes within the frame
    } else {
      // Append the single node directly to the frame if only one node
      frame.appendChild(nodes[0]);
    }

    return frame; // Return the frame containing all nodes
  } catch (error) {
    console.error("Error creating scene:", error);
    throw error; // Re-throw error for higher-level handling
  }
};

// Function to parse JSON input and render the scene
const parseAndRenderJson = async (jsonInput: string) => {
  try {
    const scene: Scene = JSON.parse(jsonInput);
    const frame = figma.createFrame(); // Create a new frame to contain the scene
    await createScene(scene, frame);
    figma.currentPage.appendChild(frame); // Append the created frame to the current page
    figma.viewport.scrollAndZoomIntoView([frame]); // Optional: focus on the created frame
  } catch (error) {
    console.error("Failed to parse JSON or render scene:", error);
  }
};

// Plugin entry point
figma.showUI(__html__);
figma.ui.onmessage = async (msg) => {
  if (msg.type === "render") {
    await parseAndRenderJson(msg.json);
  }
};
