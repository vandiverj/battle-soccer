import type { TargetDefinition } from './types';

export const GRID_SIZE = 8;

export const TARGET_DEFINITIONS: TargetDefinition[] = [
  {
    id: 'redwood-rovers',
    name: 'Redwood Rovers',
    shortName: 'Rovers',
    length: 4,
    chant: 'A back-line wall hidden in the grass.',
  },
  {
    id: 'harbor-united',
    name: 'Harbor United',
    shortName: 'Harbor',
    length: 3,
    chant: 'A tight midfield triangle waiting to break.',
  },
  {
    id: 'metro-strikers',
    name: 'Metro Strikers',
    shortName: 'Metro',
    length: 3,
    chant: 'A forward press tucked behind defenders.',
  },
  {
    id: 'valley-fc',
    name: 'Valley FC',
    shortName: 'Valley',
    length: 2,
    chant: 'A quick one-two partnership near the box.',
  },
];
