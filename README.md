# mcp-kolada-se

Kolada (RKA) MCP — Sweden's municipal & regional key-performance-indicator (KPI) database.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

| Tool | Description |
|------|-------------|
| `search_kpi` | Find Kolada KPI (indicator) ids by title substring (Swedish). Searches ~5,000 indicators covering economy, schools, health, demographics, and personnel. Returns id, title, description, operating_area, and is_divided_by_gender. Use the returned id with get_data. |
| `list_municipalities` | Find Sweden municipality/region ids by name substring. Returns id, title, and type ("K" = municipality of 290, "L" = region/landsting of 21). Use the returned id with get_data. Omit title to list all. |
| `get_data` | Fetch numeric KPI values from Kolada for a specific indicator (kpiId), Swedish municipality or region (municipalityId), and year. Returns value rows broken down by gender: T=total, K=women (kvinnor), M=men (män); non-gendered KPIs return only T.municipalityId from list_municipalities. Returns values per gender ("T" total, "K" women, "M" men); non-gendered KPIs report only "T". |
| `list_org_units` | Kolada, the Swedish municipal and regional KPI database run by RKA — list the organizational units it tracks (schools, preschools, eldercare facilities) within one of Sweden's 290 municipalities or 21 regions. Returns id, title, municipality. OU ids can be used for unit-level data drilldowns. Filter by title substring and/or municipality id. |

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/kolada-se/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/search_kpi \
  -H 'Content-Type: application/json' \
  -d '{"title":"arbetslöshet"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/search_kpi`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-kolada-se` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/kolada-se/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "kolada-se": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-kolada-se"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Kolada Se data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
