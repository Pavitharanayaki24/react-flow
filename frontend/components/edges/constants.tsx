export enum Algorithm {
    Default = 'default',
    Linear = 'linear',
    CatmullRom = 'catmull-rom',
    BezierCatmullRom = 'bezier-catmull-rom',
  }
  
  export const COLORS = {
    [Algorithm.Default]: '#777777',
    [Algorithm.Linear]: '#0375ff',
    [Algorithm.BezierCatmullRom]: '#68D391',
    [Algorithm.CatmullRom]: '#FF0072',
  };
  
  export const DEFAULT_ALGORITHM = Algorithm.Default;
  export const DEFAULT_EDGE_VARIANT = {
    algorithm: DEFAULT_ALGORITHM,
    label: 'Default',
  };
