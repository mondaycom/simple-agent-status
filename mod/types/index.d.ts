/** The spinner word for the tool call running now, or null to keep the engine's. */
export type ToolStatus = string | null

declare module 'claude-code' {
  interface PluginState {
    'tool-status': { current: ToolStatus }
  }
}
