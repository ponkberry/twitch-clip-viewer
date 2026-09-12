import { useState } from 'react';
import { TOOLS } from '../tools/registry';

interface ToolsPageProps {
  toolId: string | null;
  onSelectTool: (id: string) => void;
}

export function ToolsPage({ toolId, onSelectTool }: ToolsPageProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeTool = toolId ? TOOLS.find((tool) => tool.id === toolId) : undefined;
  const ToolComponent = activeTool?.component;
  const pageTitle = activeTool ? activeTool.title : toolId ? 'Tool not found' : 'Tools';

  return (
    <div className={`tools-layout${collapsed ? ' collapsed' : ''}`}>
      <aside className="tools-nav">
        <button
          className="tools-nav-toggle"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand tools menu' : 'Collapse tools menu'}
          title={collapsed ? 'Expand tools menu' : 'Collapse tools menu'}
        >
          🛠️
        </button>
        <div className="tools-nav-divider" />
        {TOOLS.length === 0
          ? !collapsed && <div className="tools-nav-empty hint">No tools yet</div>
          : TOOLS.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  className={`tools-nav-item${tool.id === toolId ? ' active' : ''}`}
                  onClick={() => onSelectTool(tool.id)}
                  title={tool.title}
                >
                  <Icon />
                  {!collapsed && <span>{tool.name}</span>}
                </button>
              );
            })}
      </aside>

      <div className="tools-page">
        <h2 className="tools-page-title">{pageTitle}</h2>
        <div className="tools-page-divider" />
        <div className="input-card tools-page-body">
          {toolId && !activeTool && <p className="hint">That tool doesn't exist.</p>}
          {activeTool && ToolComponent && <ToolComponent />}
          {!toolId && (
            <p className="hint">
              {TOOLS.length === 0 ? 'No tools yet — check back soon.' : 'Select a tool from the left.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
