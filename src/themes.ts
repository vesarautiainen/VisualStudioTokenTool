import { Interface } from "readline";

let blueThemeObj = require("./themes/Theme.Blue.xml");
let lightThemeObj = require("./themes/Theme.Light.xml");
let darkThemeObj = require("./themes/Theme.Dark.xml");

export enum ColorTheme {
    Blue = 1,
    Light, 
    Dark
}

export interface TokenInfo {
    category:string,
    tokenName:string
}

let themeInfos = new Map([
    [ ColorTheme.Blue, blueThemeObj ],
    [ ColorTheme.Light, lightThemeObj ],
    [ ColorTheme.Dark, darkThemeObj],
]);


export class Theme {
    themeName:ColorTheme;
    themeObject:any;
    
    constructor(type:ColorTheme, theme:Object) {
        this.themeName = type;
        this.themeObject = theme;

        if (!this.themeObject) {
            console.log("Error: theme object creation for " + this.themeName + " theme failed.")
        }
    }
}

export class Themes {
    themes: Theme[] = [];

    constructor() {
        for (let entry of themeInfos.entries()) {
            this.themes.push(new Theme(entry[0], entry[1]));
        }
    }

    getThemeObject(themeName:ColorTheme) {
        return this.themes.find(element => element.themeName == themeName).themeObject
    }

    getColorValue(tokenName:string, theme:ColorTheme):string {

        let tokenInfo:TokenInfo;
        let colorTokenSeparator = ".";
        let foundIndex = tokenName.indexOf(colorTokenSeparator);
        if (foundIndex) {
            tokenInfo = {
                category: tokenName.slice(0, foundIndex),
                tokenName: tokenName.slice(foundIndex + 1)
            }
        } else {
          console.log("Error: switchThemeColor() Can't extract category and color token")
        }
    
        // Find new color value from new theme
        let themeObject = this.getThemeObject(theme);

        // parse
        var categories = themeObject.Themes.Theme[0].Category
        let category = categories.filter(item => item.$.Name == tokenInfo.category);
        let color = category[0].Color.filter(item => item.$.Name == tokenInfo.tokenName);
        let colorValue = color[0].Background[0].$.Source;
        
        console.log("category:" + tokenInfo.category + " ,token: " + tokenInfo.tokenName + " ,color: " + colorValue)
        return colorValue
    }
}
