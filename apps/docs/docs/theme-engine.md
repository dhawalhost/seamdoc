# Theme Engine

Seamdoc features a dynamic theme engine that separates structure and formatting.

## Built-in Themes

We ship with multiple built-in themes out of the box, including:
- **Minimal**: Plain, academic formatting.
- **Modern**: Sleek sans-serif typography with generous spacing.
- **GitHub**: Classic GitHub markdown style.
- **Technical**: Technical documentation focus.
- **Corporate**: Professional enterprise layout.

## Theme Configuration

A theme JSON specifies typographical properties for blocks and inline nodes:

```json
{
  "metadata": {
    "id": "my-theme",
    "name": "My Custom Theme",
    "version": "1.0.0"
  },
  "paragraph": {
    "fontFamily": "Inter",
    "fontSize": 11,
    "color": "#111111",
    "lineHeight": 1.5
  },
  "headings": {
    "h1": {
      "fontFamily": "Inter",
      "fontSize": 20,
      "fontWeight": 700,
      "color": "#09090b"
    }
  }
}
```
