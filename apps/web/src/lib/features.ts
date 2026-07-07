/** Feature flags configuration. */
export const FEATURE_FLAGS = {
  enableAi: import.meta.env.VITE_ENABLE_AI !== 'false',
} as const;
