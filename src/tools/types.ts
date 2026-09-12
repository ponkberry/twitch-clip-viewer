import type { ComponentType } from 'react';

export interface ToolDef {
  id: string;
  /** Short label shown next to the icon in the nav — keep it tight, it has to fit collapsed. */
  name: string;
  /** Full name shown as the page heading once the tool is open. */
  title: string;
  description: string;
  icon: ComponentType;
  component: ComponentType;
}
