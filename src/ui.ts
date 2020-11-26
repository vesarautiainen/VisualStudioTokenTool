
import 'figma-plugin-ds/dist/figma-plugin-ds.css'
import './ui.css'
import * as themes from './themes';

onmessage = (event) => {
  listTokens(event.data.pluginMessage.ColorStyles, "color-list")
  listTokens(event.data.pluginMessage.TextStyles, "typography-list")
}

function listTokens(tokenArray, destinationListId) {
  let targetList = document.getElementById(destinationListId);

  tokenArray.forEach(function (token) {
    
    // first line
    let firstline = document.createElement('div')
    firstline.textContent = 'Layer: ' + token.nodeName
    firstline.id = 'token_info_first_row'
    firstline.className = 'token_info_row'
   

    // second line
    let secondline = document.createElement('div')
    secondline.textContent = 'Token: '
    secondline.id = 'token_info_second_row'
    secondline.className = 'token_info_row'
    
    let tokenValue = document.createElement('div')
    tokenValue.className = 'input'
    let tokenInput = document.createElement('input')
    tokenInput.type = 'input'
    tokenInput.className = 'input__field'
    tokenInput.value = token.value
    secondline.appendChild(tokenValue)
    secondline.appendChild(tokenInput)

    let div = document.createElement('div');
    div.className = "token"
    div.id = token.nodeId + "/" + token.value;
    div.onmouseover = handleTokenMouseover;
    div.onclick = handleTokenClick         
    
    // append items
    secondline.appendChild(tokenValue)
    div.appendChild(firstline)
    div.appendChild(secondline)

    targetList.appendChild(div);

  }); 
}

// Extract the color token from the token div id field
function getId(object) {
  let id
  var separator = "/";
  let closest = object.closest(".token")
  if (closest) {
    id = closest.id
  }
  return id.slice(0,id.indexOf(separator));
}

function getTokenName(text) {
  var separator = "/";
  return text.slice(text.indexOf(separator)+separator.length);
}

var handleTokenMouseover = function(sender) {
  parent.postMessage({ pluginMessage: { type: 'token-hover', nodeId: getId(sender.target)} }, '*')
}

var handleTokenClick = function(sender) {
  console.log(sender.tokenId)
  if (isColorToken(sender)) {
    parent.postMessage({ pluginMessage: { 
      type: 'create-color-annotation', 
      nodeId: getId(sender.target), 
      tokenName: getTokenName(sender.target.id)} 
      }, '*')
  } else {
    parent.postMessage({ pluginMessage: { 
      type: 'create-typography-annotation', 
      nodeId: getId(sender.target), 
      tokenName: getTokenName(sender.target.id)} 
      }, '*')
  } 
}

function isColorToken(sender) {
  return document.getElementById('color-list').contains(sender.target);
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
