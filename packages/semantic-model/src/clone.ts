/**
 * Deep clone for SDM documents. Nodes are JSON-serializable by design
 * (docs/02-architecture/semantic-document-model.md); cloning prevents
 * plugins from mutating the pipeline's working document on failure.
 */

import type { SdmDocument } from './nodes.js';

export function cloneDocument(document: SdmDocument): SdmDocument {
  return structuredClone(document);
}
