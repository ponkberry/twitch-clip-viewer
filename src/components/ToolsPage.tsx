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
        {!collapsed &&
          (TOOLS.length === 0 ? (
            <div className="tools-nav-empty hint">No tools yet</div>
          ) : (
            TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={`tools-nav-item${tool.id === toolId ? ' active' : ''}`}
                onClick={() => onSelectTool(tool.id)}
              >
                {tool.name}
              </button>
            ))
          ))}
      </aside>

      <div className="input-card tools-page">
        {toolId && !activeTool && <p className="hint">That tool doesn't exist.</p>}
        {activeTool && ToolComponent ? (
          <>
            <h2>{activeTool.name}</h2>
            <ToolComponent />
          </>
        ) : (
          !toolId && (
            <>
              <h2>Tools</h2>
              <p className="hint">
                {TOOLS.length === 0 ? 'No tools yet — check back soon.' : 'Select a tool from the left.'}
              </p>
            </>
          )
        )}
      </div>
    </div>
  );
}
