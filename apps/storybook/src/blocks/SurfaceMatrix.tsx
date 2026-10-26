import { manifest } from '../manifest.ts';
import { modeLabel } from '../tokens.ts';
import { ContextFrame } from './ContextFrame.tsx';

/**
 * Every surface in every theme, each painted with its own roles: the same markup takes other
 * colours only because its attributes change.
 */
export function SurfaceMatrix() {
  const { theme, surface } = manifest.modes;
  return (
    <div className="sb-matrix">
      {theme.flatMap((themeMode) => (
        <div key={themeMode} className="sb-theme sb-matrix">
          {surface.map((surfaceMode) => (
            <ContextFrame
              key={`${themeMode}-${surfaceMode}`}
              context={{ theme: themeMode, surface: surfaceMode }}
              className="sb-surface"
            >
              <span className="ui-text-eyebrow">
                {modeLabel(themeMode)} · {modeLabel(surfaceMode)}
              </span>
              <code className="ui-text-caption">
                data-theme=&quot;{themeMode}&quot; data-surface=&quot;{surfaceMode}&quot;
              </code>
              <p className="ui-text-body sb-sample">Primary text on this surface.</p>
              <p className="ui-text-body-small sb-sample sb-muted">Secondary text, for details.</p>
              <span className="ui-text-body-small sb-link">A link</span>
              <span className="ui-text-body-small sb-action">Primary action</span>
            </ContextFrame>
          ))}
        </div>
      ))}
    </div>
  );
}
