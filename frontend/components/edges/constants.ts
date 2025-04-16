export enum Algorithm {
//   Default = 'default',
  Linear = 'linear',
  CatmullRom = 'catmull-rom',
  BezierCatmullRom = 'bezier-catmull-rom'
}

// export const DEFAULT_ALGORITHM = Algorithm.Default;

export const COLORS = {
//   [Algorithm.Default]: '#b1b1b7',
  [Algorithm.Linear]: '#3288bd',
  [Algorithm.CatmullRom]: '#66c2a5',
  [Algorithm.BezierCatmullRom]: '#abdda4'
} as const; 