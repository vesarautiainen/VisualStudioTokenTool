export function randomInteger(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }
  
  export enum ColorTheme {
    Blue = 1,
    Light, 
    Dark
  }
