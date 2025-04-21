export enum Algorithm {
  Default = 'smoothstep',
  Linear = 'linear',
  // cspell:disable-next-line
  CatmullRom = 'catmull-rom',
  // cspell:disable-next-line
  BezierCatmullRom = 'bezier-catmull-rom',
}

export const COLORS = {
  [Algorithm.Default]: '#777777',
  [Algorithm.Linear]: '#0375ff',
  // cspell:disable-next-line
  [Algorithm.BezierCatmullRom]: '#68D391',
  // cspell:disable-next-line
  [Algorithm.CatmullRom]: '#FF0072',
};
  

export const DEFAULT_ALGORITHM = Algorithm.Default;
export const DEFAULT_EDGE_VARIANT = {
  algorithm: DEFAULT_ALGORITHM,
  label: 'Default',
};