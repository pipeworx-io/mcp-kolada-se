# mcp-kolada-se

Kolada (RKA) MCP — Sweden's municipal & regional key-performance-indicator (KPI) database.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_kpi` | Find Kolada KPI (indicator) ids by title substring (Swedish). Searches ~5,000 indicators covering economy, schools, health, demographics, and personnel. Returns id, title, description, operating_area, and is_divided_by_gender. Use the returned id with get_data. |
| `list_municipalities` | Find Sweden municipality/region ids by name substring. Returns id, title, and type ("K" = municipality of 290, "L" = region/landsting of 21). Use the returned id with get_data. Omit title to list all. |
| `get_data` | Fetch numeric KPI values from Kolada for a specific indicator (kpiId), Swedish municipality or region (municipalityId), and year. Returns value rows broken down by gender: T=total, K=women (kvinnor), M=men (män); non-gendered KPIs return only T.municipalityId from list_municipalities. Returns values per gender ("T" total, "K" women, "M" men); non-gendered KPIs report only "T". |
| `list_org_units` | List organizational units (schools, preschools, eldercare facilities, etc.) within a municipality. Returns id, title, municipality. OU ids can be used for unit-level data drilldowns. Filter by title substring and/or municipality id. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "kolada-se": {
      "url": "https://gateway.pipeworx.io/kolada-se/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Kolada Se data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
