import type { ToolDef } from './types';
import { RngTool } from './RngTool';
import { WheelTool } from './WheelTool';
import { DiceIcon } from './icons/DiceIcon';
import { WheelIcon } from './icons/WheelIcon';

// Add a tool by dropping its component in this folder and listing it here — the tools
// tab, its grid, and its /tools/:id routing all key off this array, nothing else.
export const TOOLS: ToolDef[] = [
  {
    id: 'rng',
    name: 'RNG',
    title: 'Random Number Generator',
    description: 'Generate a random whole number within a min/max range.',
    icon: DiceIcon,
    component: RngTool,
  },
  {
    id: 'wheel',
    name: 'Wheel',
    title: 'Spin Wheel',
    description: 'Spin a wheel to randomly pick from a list of options.',
    icon: WheelIcon,
    component: WheelTool,
  },
];
