import * as utils from './utils';
import * as themes from './themes';

let colorThemes = new themes.Themes();

figma.showUI(__html__,{width: 500, height: 700});

enum TokenType {
  Font = 1,
  Color
}

// config
let annotationDotSize: number = 5


enum VerticalAlignement {
  Top = 1,
  Bottom = 2,
  Center = 3
}

let nodesWithStyles = [];

// The datastructure that contains all the nodes with associated styles and will be passed to the UI
interface NodeData {
  id: string,
  indexId: number,
  name: string,
  type: string, 
  token: string
}

function checkNodeForStyles(node) {
  let nodeData:NodeData
  // Fill style. The token name is currently in the plugin data and accessible only via plugin API and only by this plugin
  if (node && node.fillStyleId != undefined && node.fillStyleId != "" && node.visible) {
    nodeData = {
      id: node.id, 
      indexId: getNextFreeIndexId(),
      name: extractLayerName(node.name), 
      type: "fillStyle", 
      token: node.getSharedPluginData('tokendata', 'color-token')
    }
    nodesWithStyles.push(nodeData)
  }

  if (node && node.strokeStyleId != undefined && node.strokeStyleId != "" && node.visible) {
    nodeData = {
      id: node.id, 
      indexId: getNextFreeIndexId(), 
      name: extractLayerName(node.name), 
      type: "strokeStyle", 
      token: node.getSharedPluginData('tokendata', 'color-token')
    }
    nodesWithStyles.push(nodeData)
  }
  
    // Text style. The font token name is currently in the style description.
  if (node && node.textStyleId != undefined && node.textStyleId != "" && node.visible) {
    nodeData = {
      id: node.id, 
      indexId: getNextFreeIndexId(),
      name: extractLayerName(node.name), 
      type: "textStyle", 
      token: figma.getStyleById(node.textStyleId).description
    }
    nodesWithStyles.push(nodeData)
  }
}

function getNextFreeIndexId() {
  return nodesWithStyles.length > 0 ? nodesWithStyles[nodesWithStyles.length-1].indexId + 1 : 0
}

function extractLayerName(text:string):string {
  let colorTokenId = "[token:";
  let layerName = text;
  let verifyString = text.toLowerCase();
  let foundIndex = verifyString.indexOf(colorTokenId);

  return foundIndex != -1 ? layerName.slice(0, foundIndex) : layerName
}

// Deprecated
function extractTokenName(text: string):string {
  let colorTokenId = "[token:";
  let tokenValue = text;
  let verifyString = text.toLowerCase();
  let foundIndex = verifyString.indexOf(colorTokenId);

  if (foundIndex && verifyString.includes(colorTokenId)) {
    tokenValue = tokenValue.slice(foundIndex + colorTokenId.length)
    tokenValue = tokenValue.replace(']', '');
    tokenValue = tokenValue.replace(' ', '');
  } else {
    tokenValue = "No color token defined!"
  }
  return tokenValue;
}

function traverse(node) {
  checkNodeForStyles(node)
  
  if ("children" in node) {
    for (const child of node.children) {
      traverse(child)    
    }
  }
}

// START

// Loading fonts
figma.loadFontAsync({family: "Consolas", style: "Regular"}).then(initSuccess, initFailure)

function initSuccess() {
  // Go through the all the nodes in the current selection
  for (const node of figma.currentPage.selection) {
    traverse(node) 
  }

  // Send nodes with styles to the UI
  figma.ui.postMessage(nodesWithStyles);
}

function initFailure() {
  console.log("Required fonts failed to load. Exit.")
}

// -------------------Events from the UI ------------------------------
function createAnnotation(type: TokenType):InstanceNode {
  var component : ComponentNode;
  var instanceName : string;
  if (type == TokenType.Font) {
    component = <ComponentNode>figma.currentPage.findOne(n => n.name === "Token Annotation / Typography")
    instanceName = "Font Annotation";  
  } else {
    component = <ComponentNode>figma.currentPage.findOne(n => n.name === "Token Annotation / Color")
    instanceName = "Color Token Annotation";  
  }
  if (component != undefined) {
    var instance:InstanceNode = component.createInstance();
    instance.name = instanceName;  
    return instance;
  } else {
    console.log("Error: Could not creat annotation instance")
  }
}

//Commands from the UI 
figma.ui.onmessage = msg => {
  if (msg.type === 'create-color-annotation-all') {
    annotateAllColorTokens();
  } else if (msg.type === 'create-typography-annotation-all') {
    annotateAllTypographyTokens();
  } else if (msg.type === 'change-theme-version') {
      changeTheme(msg.themeId)
  } else if (msg.type === 'token-hover') {
    console.log(msg.nodeId)
    highlightNode(msg.nodeId);
  } else if (msg.type === 'create-annotation') {
    let verticalAlignement = msg.nodeData.type == "strokeStyle" ? VerticalAlignement.Top : VerticalAlignement.Center
    msg.nodeData.type == "textStyle" ? 
      annotateTypographyToken(msg.nodeData.id, msg.nodeData.token) :
      annotateColorToken(msg.nodeData.id, msg.nodeData.token, verticalAlignement)
  } else if (msg.type === 'update-color-token') {
    updatePluginData(msg.nodeId, msg.newTokenName);
  }
}

// updated node data that only this plugin can read
function updatePluginData(nodeId, newTokenName) {
  let node = <SceneNode>figma.getNodeById(nodeId);
  if (node) {
    node.setSharedPluginData('tokendata', 'color-token', newTokenName)
  }
}

function annotateColorToken(nodeId:string, tokenName:string, verticalAlignement:VerticalAlignement){
  const annotationInstance = createAnnotation(TokenType.Color);
  if (annotationInstance) {
    // set data
    var label = <TextNode>annotationInstance.findOne(n => n.type === "TEXT")
    label.characters = "Color Token: " + tokenName
    // find the original node and set the annotation label position
    let originalNode = <SceneNode>figma.getNodeById(nodeId);
    let xOrigin = originalNode.absoluteTransform[0][2]
    let yOrigin = originalNode.absoluteTransform[1][2]
    annotationInstance.resize(annotationInstance.width,utils.randomInteger(30,150))
    let xPos = xOrigin - annotationInstance.width / 2 + originalNode.width / 2;

    let yPos = verticalAlignement == VerticalAlignement.Center ? 
      yOrigin - annotationInstance.height + originalNode.height / 2 + annotationDotSize / 2 :
      yOrigin - annotationInstance.height + annotationDotSize / 2 

    annotationInstance.relativeTransform = [[1, 0, xPos],[0, 1, yPos]];

    if (tokenName == "No color token defined!") { 
      var background = <RectangleNode>annotationInstance.findOne(n => n.type === "FRAME" && n.name === "AnnotationLabel")
      const fills = clone(background.fills)
      fills[0].color.r = 0.83
      fills[0].color.g = 0.69
      fills[0].color.b = 0.0
      background.fills = fills    
    }
    figma.currentPage.appendChild(annotationInstance);
  } else {
    // @TODO: create a fallback annotation style
    console.log("Error: No annotation instance found")
  }
}

function annotateTypographyToken(nodeId:string, tokenName:string){
  const annotationInstance = createAnnotation(TokenType.Font);
  if (annotationInstance) {
    // set data
    var label = <TextNode>annotationInstance.findOne(n => n.type === "TEXT")
    label.characters = "Font Token: " + tokenName

    // find the original node and set the annotation label position
    let originalNode = <TextNode>figma.getNodeById(nodeId);
    let xOrigin = originalNode.absoluteTransform[0][2]
    let yOrigin = originalNode.absoluteTransform[1][2]
    let xPos = xOrigin - annotationInstance.width / 2 + originalNode.width / 2;
    let yPos = yOrigin + originalNode.height / 2;
    annotationInstance.relativeTransform = [[1, 0, xPos],[0, 1, yPos]];

    figma.currentPage.appendChild(annotationInstance);
  } else {
    // @TODO: create a fallback annotation style
    console.log("Error: No annotation instance found")
  }
}

// Annotate tokens
//------------------------------------------------------
function annotateAllColorTokens() {
  let colorTokenNodes = nodesWithStyles.filter( e => e.type != "textStyle")
  colorTokenNodes.forEach(element => {
    let verticalAlignement = element.type == "strokeStyle" ? VerticalAlignement.Top : VerticalAlignement.Center
    annotateColorToken(element.id, element.token, verticalAlignement);
  });
}

function annotateAllTypographyTokens() {
  let fontTokenNodes = nodesWithStyles.filter( e => e.type == "textStyle")
  fontTokenNodes.forEach(element => {
    annotateTypographyToken(element.id, element.token);
  });
}

function switchThemeColor(nodeId:string, tokenName:string, theme:themes.ColorTheme){

  let colorValue = colorThemes.getColorValue(tokenName, theme);

  // Find the node and set the new color value
  let originalNode = <SceneNode>figma.getNodeById(nodeId);
  if (isSceneNode(originalNode)) {
    let rectNode = <RectangleNode>originalNode;
    const fills = clone(rectNode.fills)

    // get rgb values
    let rgb = hexToRgb(colorValue.slice(2))

    // set data
    fills[0].color.r = rgb.r/255;
    fills[0].color.g = rgb.g/255;
    fills[0].color.b = rgb.b/255;
    rectNode.fills = fills 
  }
}
function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

// Highlight node
//------------------------------------------------------
function highlightNode(nodeId:string) {
  let highlightedNode:BaseNode = figma.getNodeById(nodeId)
  if (figma.getNodeById(nodeId) && isSceneNode(figma.getNodeById(nodeId))) {
    figma.currentPage.selection = [<SceneNode>figma.getNodeById(nodeId)]
  }
}

function isSceneNode(node:BaseNode) {
  return node.type === "FRAME" ||
  node.type == "COMPONENT" ||
  node.type == "INSTANCE" ||
  node.type == "VECTOR" ||
  node.type == "LINE" ||
  node.type == "ELLIPSE" ||
  node.type == "POLYGON" ||
  node.type == "TEXT" ||
  node.type == "RECTANGLE"

}
// Change theme (placeholder functions)
//------------------------------------------------------

function changeTheme(theme:themes.ColorTheme) {
  let colorTokenNodes = nodesWithStyles.filter( e => e.type != "textStyle")
  colorTokenNodes.forEach(element => {
    switchThemeColor(element.id, element.token, theme);
  });
}

function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

//figma.closePlugin()
