import { PluginRegistry } from '@seamdoc/plugins';
import { latexPlugin, latexAltPlugin } from '@seamdoc/plugin-latex';
import { mermaidPlugin } from '@seamdoc/plugin-mermaid';

export function resolvePluginRegistry(enabledPluginIds: string[]): PluginRegistry {
  const registry = new PluginRegistry();
  if (enabledPluginIds.includes('latex')) {
    registry.register(latexPlugin);
    registry.register(latexAltPlugin);
  }
  if (enabledPluginIds.includes('mermaid')) {
    registry.register(mermaidPlugin);
  }
  return registry;
}
