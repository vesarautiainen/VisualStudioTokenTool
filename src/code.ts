import * as utils from './utils';

figma.showUI(__html__,{width: 400, height: 700});

enum TokenType {
  Font = 1,
  Color
}

let nodesWithStyles: nodesWithStyles = {};
var colorStyleArray = [];
var textStyleArray = [];


// The datastructure that contains all the nodes with associated styles and will be passed to the UI
interface nodesWithStyles {
  ColorStyles?: any,
  TextStyles?: any
}

function checkNodeForStyles(node) {
  // Fill style. The token name is currently embedded in the node name.
  var values:string[];
  if (node.fillStyleId != undefined && node.fillStyleId != "" && node.visible) {
    colorStyleArray.push({"nodeId": node.id, "nodeName":extractLayerName(node.name), "value": extractTokenName(node.name)})
  }
    // Text style. The font token name is currently in the style description.
  if (node.textStyleId != undefined && node.textStyleId != "" && node.visible) {
    textStyleArray.push({"nodeId": node.id, "nodeName":extractLayerName(node.name), "value": figma.getStyleById(node.textStyleId).description})
  }
}

function extractLayerName(text:string):string {
  let colorTokenId = "[token:";
  let layerName = text;
  let verifyString = text.toLowerCase();
  let foundIndex = verifyString.indexOf(colorTokenId);

  return foundIndex ? layerName.slice(0, foundIndex) : layerName
}

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
    tokenValue = "No token id found"
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

  nodesWithStyles.ColorStyles = colorStyleArray;
  nodesWithStyles.TextStyles = textStyleArray;

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
  } else if (msg.type === 'create-color-annotation') {
    annotateColorToken(msg.nodeId, msg.tokenName)
  } else if (msg.type === 'create-typography-annotation') {
    annotateTypographyToken(msg.nodeId, msg.tokenName);
  }
}

function annotateColorToken(nodeId:string, tokenName:string){
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
    let yPos = yOrigin - annotationInstance.height + originalNode.height / 2;
    annotationInstance.relativeTransform = [[1, 0, xPos],[0, 1, yPos]];

    if (tokenName === "No token id found") { 
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
    console.log(originalNode.absoluteTransform)
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
    nodesWithStyles.ColorStyles.forEach(element => {
      annotateColorToken(element.nodeId, element.value);
    });
}

function annotateAllTypographyTokens() {
  nodesWithStyles.TextStyles.forEach(element => {
    annotateTypographyToken(element.nodeId, element.value);
  });
}

function switchThemeColor(nodeId:string, tokenName:string, themeObject:any){

    // Find the category and token values
    let colorTokenId = ".";
    let tokenCategory;
      let colorToken;
    let foundIndex = tokenName.indexOf(colorTokenId);
    if (foundIndex) {
      tokenCategory = tokenName.slice(0, foundIndex);
      colorToken = tokenName.slice(foundIndex+1);
    } else {
      console.log("Error: switchThemeColor() Can't extract category and color token")
    }

    // Find new color value from new theme
    var categories = themeObject.Themes.Theme[0].Category
    let category = categories.filter(item => item.$.Name == tokenCategory);
    let color = category[0].Color.filter(item => item.$.Name == colorToken);
    let colorValue = color[0].Background[0].$.Source;

    console.log("category:" + tokenCategory + " ,token: " + colorToken + " ,color: " + colorValue)

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

function changeTheme(theme:utils.ColorTheme) {
  console.log(theme);
  var themeObject;
  if (theme == utils.ColorTheme.Dark)
  themeObject = require('./themes/Theme.Dark.xml');
  else if (theme == utils.ColorTheme.Light) 
    themeObject = require('./themes/Theme.Light.xml');
  else if (theme == utils.ColorTheme.Blue) 
    themeObject = require('./themes/Theme.Blue.xml');

   nodesWithStyles.ColorStyles.forEach(element => {
    switchThemeColor(element.nodeId, element.value, themeObject);
  });
}

function clone(val) {
  return JSON.parse(JSON.stringify(val))
}

//figma.closePlugin()
