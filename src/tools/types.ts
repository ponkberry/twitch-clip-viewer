import type { ComponentType } from 'react';

export interface ToolDef {
  id: string;
  name: string;
  description: string;
  component: ComponentType;
}
