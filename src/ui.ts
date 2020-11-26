import 'figma-plugin-ds/dist/figma-plugin-ds.css'
import './ui.css'
import * as themes from './themes';

let nodesWithStyles

onmessage = (event) => {
  nodesWithStyles = event.data.pluginMessage
  createTokenList(nodesWithStyles.filter(e => {
    return e.type == "fillStyle" || e.type == "strokeStyle"
  }), "color-list")

  createTokenList(nodesWithStyles.filter(e => {
    return e.type == "textStyle"
  }), "typography-list")
}

function createTokenList(tokenArray, destinationListId) {
  let targetList = document.getElementById(destinationListId);

  tokenArray.forEach(e => {
    
    // first line
    let firstline = document.createElement('div')
    let layername = document.createElement('div')
    layername.textContent = 'Layer: ' + e.name
    firstline.id = 'token_info_first_row'
    firstline.className = 'token_info_row'
    firstline.appendChild(layername)

    // first line buttons
    let firstlinebuttons = document.createElement('div')
    firstlinebuttons.className = "button-container"
    let button = document.createElement('div')
    let buttonicon = document.createElement('div')
    button.className = "icon-button"
    buttonicon.className = "icon icon--plus"
    button.appendChild(buttonicon)
    firstlinebuttons.appendChild(button)
    firstline.appendChild(firstlinebuttons)
    button.onclick = handleAddAnnotation

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
    tokenInput.onchange = handleTokenNameUpdate
    tokenInput.value = e.token
    secondline.appendChild(tokenValue)
    secondline.appendChild(tokenInput)

    let div = document.createElement('div');
    div.className = "token"
    div.id = e.id + "/" + e.indexId;
    div.onmouseover = handleTokenMouseover;
    
    // append items
    secondline.appendChild(tokenValue)
    div.appendChild(firstline)
    div.appendChild(secondline)

    targetList.appendChild(div);

  }); 
}

// Extract the color token from the token div id field
function getId(object) {
  let closest
  let id:string = ""
  var separator = "/";
  if (object) {
    closest = object.closest(".token")
  } else {
    console.log("Error in getTokenName. Object is null.")
    return 
  }
  if (closest) {
    id = closest.id
  }
  console.log(id, id.slice(0,id.indexOf(separator)))
  return id.slice(0,id.indexOf(separator));
}

function getIndexId(object) {
  let closest 
  let id:string = ""
  var separator = "/";
  if (object) {
    closest = object.closest(".token")
  } else {
    console.log("Error in getTokenName. Object is null.")
    return 
  }
  if (closest) {
    id = closest.id
  }
  return id.slice(id.indexOf(separator)+1);
}

var handleTokenMouseover = function(sender) {
  parent.postMessage({ pluginMessage: { type: 'token-hover', nodeId: getId(sender.target)} }, '*')
}

var handleAddAnnotation = function(sender) {
  // Find the data based on 'indexId' that is unique to each item
  parent.postMessage({ pluginMessage: { 
    type: 'create-annotation', 
    nodeData: nodesWithStyles.find(e => (e.indexId == getIndexId(sender.target)))}
    }, '*')
}

var handleTokenNameUpdate = function(sender) {
  parent.postMessage({ pluginMessage: { type: 'update-color-token', nodeId: getId(sender.target), newTokenName: sender.target.value} }, '*')
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
