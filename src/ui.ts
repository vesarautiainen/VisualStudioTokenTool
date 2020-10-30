
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
import './ui.css'
import * as themes from './themes';

onmessage = (event) => {
  listTokens(event.data.pluginMessage.ColorStyles, "color-list")
  listTokens(event.data.pluginMessage.TextStyles, "typography-list")
}

function listTokens(tokenArray, destinationListId) {
  console.log("here2")
  let targetList = document.getElementById(destinationListId);

  tokenArray.forEach(function (token) {
    let div = document.createElement("div");

    div.innerHTML += "Layer: " + token.nodeName + "<br/>" + "Token: " + token.value 
    div.className = "token"
    div.id = token.nodeId + "/" + token.value;
    div.onmouseover = handleTokenMouseover;
    div.onclick = handleTokenClick         
    targetList.appendChild(div);
  }); 
}

function getId(text) {
  var separator = "/";
  return text.slice(0,text.indexOf(separator));
}

function getTokenName(text) {
  var separator = "/";
  return text.slice(text.indexOf(separator)+separator.length);
}

var handleTokenMouseover = function(sender) {
  parent.postMessage({ pluginMessage: { type: 'token-hover', nodeId: getId(sender.target.id)} }, '*')
}

var handleTokenClick = function(sender) {
  console.log(sender.tokenId)
  if (isColorToken(sender)) {
    parent.postMessage({ pluginMessage: { 
      type: 'create-color-annotation', 
      nodeId: getId(sender.target.id), 
      tokenName: getTokenName(sender.target.id)} 
      }, '*')
  } else {
    parent.postMessage({ pluginMessage: { 
      type: 'create-typography-annotation', 
      nodeId: getId(sender.target.id), 
      tokenName: getTokenName(sender.target.id)} 
      }, '*')
  } 
}

function isColorToken(sender) {
  console.log(sender)
  return sender.target.parentElement.id == "color-list"
}

document.getElementById('create-color-all').onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'create-color-annotation-all'} }, '*')
}

document.getElementById('create-typography-all').onclick = () => {
  parent.postMessage({ pluginMessage: { type: 'create-typography-annotation-all'} }, '*')
}

document.getElementById('change-theme-dark').onclick = () => {
  document.getElementById('change-theme-dark').className = "button button--primary";
  document.getElementById('change-theme-light').className = "button button--secondary";
  document.getElementById('change-theme-blue').className = "button button--secondary";
  parent.postMessage({ pluginMessage: { type: 'change-theme-version', themeId: themes.ColorTheme.Dark} }, '*')
}

document.getElementById('change-theme-light').onclick = () => {
  document.getElementById('change-theme-dark').className = "button button--secondary";
  document.getElementById('change-theme-light').className = "button button--primary";
  document.getElementById('change-theme-blue').className = "button button--secondary";
  parent.postMessage({ pluginMessage: { type: 'change-theme-version', themeId: themes.ColorTheme.Light} }, '*')
}

document.getElementById('change-theme-blue').onclick = () => {
  document.getElementById('change-theme-dark').className = "button button--secondary";
  document.getElementById('change-theme-light').className = "button button--secondary";
  document.getElementById('change-theme-blue').className = "button button--primary";
  parent.postMessage({ pluginMessage: { type: 'change-theme-version', themeId: themes.ColorTheme.Blue} }, '*')
}
