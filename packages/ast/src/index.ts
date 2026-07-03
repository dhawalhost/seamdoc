/**
 * AST node definitions (docs/02-architecture/folder-structure.md).
 *
 * Seamdoc uses mdast as its Markdown AST standard. This package re-exports
 * the node types the pipeline supports so downstream packages depend on a
 * Seamdoc-owned surface rather than directly on mdast. No rendering logic.
 */

export type {
  AlignType,
  BlockContent,
  Blockquote,
  Break,
  Code,
  DefinitionContent,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
  ThematicBreak,
} from 'mdast';
