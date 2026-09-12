import type { ToolDef } from './types';
import { RngTool } from './RngTool';
import { DiceIcon } from './icons/DiceIcon';

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
];
