export enum ColorTheme {
    Blue = 1,
    Light, 
    Dark
  }

export class Themes {
    themes:Theme[];

    themeInfos = new Map([
        [ ColorTheme.Blue, "Theme.Blue.xml" ],
        [ ColorTheme.Light, "Theme.Light.xml" ],
        [ ColorTheme.Dark, "Theme.Dark.xml" ]
    ]);

    constructor() {
        for (let entry of this.themeInfos.entries()) {
            themes.add(new Theme(entry[0], entry[1]));
        }
    }

    add(theme:Theme) {
        this.themes.push(theme)
      }
}

export let themes = new Themes();

export class Theme {
    type:ColorTheme;
    filename:string;

    constructor(type:ColorTheme,file:string) {
        this.type = type;
        this.filename = file;
      }
}


