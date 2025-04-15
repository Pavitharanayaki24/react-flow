export enum Algorithm {
    Linear = 'linear',
    CatmullRom = 'catmull-rom',
    BezierCatmullRom = 'bezier-catmull-rom',
  }
  
  export const COLORS = {
    
    [Algorithm.Linear]: '#0375ff',
    [Algorithm.BezierCatmullRom]: '#68D391',
    [Algorithm.CatmullRom]: '#FF0072',
  };
  
  // export const DEFAULT_ALGORITHM = Algorithm.Linear;
  // export const DEFAULT_EDGE_VARIANT = {
  //   algorithm: DEFAULT_ALGORITHM,
  //   label: 'Default',
  // };
