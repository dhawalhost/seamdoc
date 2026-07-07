import type { SdmDocument, SdmBlock } from '@seamdoc/semantic-model';
import type { Theme } from '@seamdoc/themes';

export interface CriticFinding {
  readonly id: string;
  readonly severity: 'warning' | 'info';
  readonly message: string;
  readonly path: string;
  readonly suggestion?: string;
  readonly autoFix?: {
    readonly replacementText: string;
  };
}

/** Check document structure offline using quick heuristics. */
export function runHeuristicCritic(doc: SdmDocument): readonly CriticFinding[] {
  const findings: CriticFinding[] = [];
  let headingLevel = 0;

  const checkBlocks = (blocks: readonly SdmBlock[], parentPath: string): void => {
    blocks.forEach((block, idx) => {
      const path = `${parentPath}/children/${idx}`;
      if (block.type === 'heading') {
        if (block.level > headingLevel + 1 && headingLevel !== 0) {
          findings.push({
            id: `hierarchy-${idx}`,
            severity: 'warning',
            message: `Heading hierarchy skipped from H${headingLevel} to H${block.level}.`,
            path,
            suggestion: `Change this heading to H${headingLevel + 1} for structural consistency.`,
          });
        }
        headingLevel = block.level;
      } else if (block.type === 'table') {
        const colCount = block.alignments?.length || 0;
        if (colCount > 6) {
          findings.push({
            id: `table-overflow-${idx}`,
            severity: 'warning',
            message: `Table has ${colCount} columns, which may overflow page margins on PDF/DOCX.`,
            path,
            suggestion: 'Consider splitting into multiple tables or consolidating columns.',
          });
        }
      } else if (block.type === 'paragraph') {
        // Compute total text character length
        const charCount = block.children
          .filter((c) => c.type === 'text')
          .reduce((sum, c) => sum + c.value.length, 0);

        if (charCount > 1000) {
          findings.push({
            id: `paragraph-length-${idx}`,
            severity: 'info',
            message: `Paragraph is quite long (${charCount} characters).`,
            path,
            suggestion:
              'Consider breaking this paragraph up or formatting it as a list to improve readability.',
          });
        }
      } else if (block.type === 'columns') {
        block.children.forEach((col, cIdx) => {
          checkBlocks(col.children, `${path}/children/${cIdx}`);
        });
      }
    });
  };

  checkBlocks(doc.children, '');
  return findings;
}

/** Run advanced Gemini-based semantic review. Falls back to heuristics if API key is invalid or fails. */
export async function analyzeDocumentStructure(
  doc: SdmDocument,
  apiKey?: string,
): Promise<readonly CriticFinding[]> {
  const localFindings = runHeuristicCritic(doc);
  if (!apiKey || apiKey.trim() === '') {
    return localFindings;
  }

  const prompt = `You are a professional document design and layout critic.
Analyze the following Seamdoc Document AST (Semantic Document Model) for readability, styling consistency, contrast issues, logical headers structure, and presentation flaws.

Return a JSON object containing a "findings" array of issues detected.
Each finding MUST fit this TypeScript interface:
interface CriticFinding {
  id: string; // Unique slug identifier
  severity: 'warning' | 'info';
  message: string; // User-facing description of the layout issue
  path: string; // The path of the node, e.g. "/children/2"
  suggestion?: string; // Auto-fix suggestion text if applicable
}

Here is the document to analyze:
${JSON.stringify({ metadata: doc.metadata, children: doc.children.map((c, i) => ({ type: c.type, path: `/children/${i}` })) }, null, 2)}

Provide findings in JSON format.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      },
    );

    if (!response.ok) {
      return localFindings;
    }

    const result = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string;
          }>;
        };
      }>;
    };
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const data = JSON.parse(text);
    if (Array.isArray(data.findings)) {
      // Merge AI findings with local findings
      const aiFindings: CriticFinding[] = data.findings.map((f: unknown, idx: number) => {
        const item = f as {
          id?: string;
          severity?: string;
          message?: string;
          path?: string;
          suggestion?: string;
        };
        return {
          id: item.id || `ai-${idx}`,
          severity: item.severity === 'warning' ? 'warning' : 'info',
          message: item.message || 'Layout suggestion.',
          path: item.path || '/children/0',
          suggestion: item.suggestion,
        };
      });
      return [...localFindings, ...aiFindings];
    }
  } catch (err) {
    console.error('Failed to run AI critic:', err);
  }

  return localFindings;
}

/** Generate a validated Seamdoc theme JSON based on a natural language description. */
export async function generateThemeFromPrompt(prompt: string, apiKey: string): Promise<Theme> {
  const systemPrompt = `You are a professional graphic designer and UI/UX developer.
Generate a complete, valid Seamdoc Theme JSON matching the following schema.
Colors MUST be #RRGGBB hex values.
Only return the valid Theme JSON object matching this schema:
{
  "schemaVersion": 1,
  "metadata": {
    "id": "generated-theme",
    "name": "Generated Theme",
    "version": "1.0.0",
    "author": "AI Assistant",
    "description": "Theme generated from prompt",
    "license": "MIT"
  },
  "branding": {
    "logo": "",
    "headerBackground": "#ffffff",
    "headerTextColor": "#111827",
    "showLogo": false
  },
  "typography": {
    "body": "Inter",
    "heading": "Inter",
    "code": "JetBrains Mono"
  },
  "colors": {
    "primary": "#3b82f6",
    "text": "#1f2937",
    "background": "#ffffff",
    "border": "#e5e7eb",
    "accent": "#f59e0b",
    "codeBackground": "#f3f4f6"
  },
  "headings": {
    "h1": { "fontFamily": "Inter", "fontSize": 24, "fontWeight": 700, "italic": false, "color": "#1f2937", "alignment": "left", "spacing": { "before": 12, "after": 6 } },
    "h2": { "fontFamily": "Inter", "fontSize": 20, "fontWeight": 700, "italic": false, "color": "#1f2937", "alignment": "left", "spacing": { "before": 12, "after": 6 } },
    "h3": { "fontFamily": "Inter", "fontSize": 16, "fontWeight": 700, "italic": false, "color": "#1f2937", "alignment": "left", "spacing": { "before": 12, "after": 6 } },
    "h4": { "fontFamily": "Inter", "fontSize": 14, "fontWeight": 700, "italic": false, "color": "#1f2937", "alignment": "left", "spacing": { "before": 12, "after": 6 } },
    "h5": { "fontFamily": "Inter", "fontSize": 12, "fontWeight": 700, "italic": false, "color": "#1f2937", "alignment": "left", "spacing": { "before": 12, "after": 6 } },
    "h6": { "fontFamily": "Inter", "fontSize": 11, "fontWeight": 700, "italic": false, "color": "#1f2937", "alignment": "left", "spacing": { "before": 12, "after": 6 } }
  },
  "paragraph": {
    "fontFamily": "Inter",
    "fontSize": 11,
    "fontWeight": 400,
    "italic": false,
    "color": "#1f2937",
    "alignment": "left",
    "lineHeight": 1.5,
    "spacing": { "before": 0, "after": 6 }
  },
  "list": {
    "indent": 18,
    "spacing": { "before": 0, "after": 6 }
  },
  "table": {
    "headerBackground": "#f3f4f6",
    "headerColor": "#1f2937",
    "headerFontWeight": 700,
    "borderColor": "#e5e7eb",
    "borderWidth": 1,
    "cellPadding": 6
  },
  "image": {
    "alignment": "center",
    "maxWidth": 450,
    "spacing": { "before": 12, "after": 12 }
  },
  "code": {
    "fontFamily": "JetBrains Mono",
    "fontSize": 10,
    "color": "#1f2937",
    "background": "#f3f4f6",
    "padding": 4,
    "spacing": { "before": 6, "after": 6 }
  },
  "quote": {
    "borderColor": "#e5e7eb",
    "borderWidth": 3,
    "color": "#4b5563",
    "italic": true,
    "indent": 12,
    "spacing": { "before": 6, "after": 6 }
  },
  "link": {
    "color": "#3b82f6",
    "underline": true
  },
  "horizontalRule": {
    "color": "#e5e7eb",
    "thickness": 1,
    "spacing": { "before": 12, "after": 12 }
  }
}

User Prompt: ${prompt}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: systemPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to generate theme: Gemini API returned status ${response.status}`);
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const theme = JSON.parse(text);

  // Set ID and name from prompt descriptive context if missing
  theme.metadata = theme.metadata || {};
  theme.metadata.id = theme.metadata.id || 'generated-theme';
  theme.metadata.name = theme.metadata.name || 'AI Prompted Theme';
  theme.metadata.version = theme.metadata.version || '1.0.0';
  theme.metadata.author = theme.metadata.author || 'AI Assistant';

  return theme as Theme;
}
