interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Kolada (RKA) MCP — Sweden's municipal & regional key-performance-indicator (KPI) database.
 *
 * Kolada covers ~5,000 indicators across economy, schools, health, demographics, and
 * personnel for Sweden's 290 municipalities (type "K") and 21 regions (type "L").
 *
 * Workflow:
 *   1. search_kpi   — find KPI ids by title substring (Swedish), e.g. "N15428".
 *   2. list_municipalities — find municipality/region ids by name, e.g. Stockholm = "0180".
 *   3. get_data     — combine a kpiId + municipalityId + year to read the values.
 *
 * Values are returned per year and gender. The gender field is one of:
 *   "T" = total, "K" = women (kvinnor), "M" = men (män). Non-gendered KPIs report only "T".
 *
 * Keyless public API. Base: https://api.kolada.se/v3 (v2 is deprecated).
 */


const BASE = 'https://api.kolada.se/v3';
const UA = 'pipeworx-mcp-kolada-se/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'search_kpi',
    description:
      'Find Kolada KPI (indicator) ids by title substring (Swedish). Searches ~5,000 indicators ' +
      'covering economy, schools, health, demographics, and personnel. Returns id, title, description, ' +
      'operating_area, and is_divided_by_gender. Use the returned id with get_data.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Substring of the indicator title (Swedish), e.g. "arbetslös" or "betyg".' },
        page: { type: 'integer', description: 'Page number, 1-based (default 1).' },
        per_page: { type: 'integer', description: 'Results per page (default 30).' },
      },
      required: ['title'],
    },
  },
  {
    name: 'list_municipalities',
    description:
      'Find Sweden municipality/region ids by name substring. Returns id, title, and type ' +
      '("K" = municipality of 290, "L" = region/landsting of 21). Use the returned id with get_data. ' +
      'Omit title to list all.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Substring of the municipality/region name, e.g. "Stockholm" or "Göteborg".' },
      },
    },
  },
  {
    name: 'get_data',
    description:
      'Read KPI values for a municipality (or region) and year. Provide a kpiId from search_kpi and a ' +
      'municipalityId from list_municipalities. Returns values per gender ("T" total, "K" women, "M" men); ' +
      'non-gendered KPIs report only "T".',
    inputSchema: {
      type: 'object',
      properties: {
        kpiId: { type: 'string', description: 'KPI id from search_kpi, e.g. "N15428".' },
        municipalityId: { type: 'string', description: 'Municipality/region id from list_municipalities, e.g. "0180" (Stockholm).' },
        year: { type: 'integer', description: 'Four-digit year, e.g. 2022.' },
      },
      required: ['kpiId', 'municipalityId', 'year'],
    },
  },
  {
    name: 'list_org_units',
    description:
      'List organizational units (schools, preschools, eldercare facilities, etc.) within a municipality. ' +
      'Returns id, title, municipality. OU ids can be used for unit-level data drilldowns. ' +
      'Filter by title substring and/or municipality id.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Substring of the unit name (Swedish), e.g. "skola" or "förskola".' },
        municipalityId: { type: 'string', description: 'Restrict to a municipality/region id, e.g. "0180".' },
      },
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_kpi': {
      const title = reqStr(args, 'title', '"arbetslös"');
      const qs = new URLSearchParams({ title });
      const page = args.page;
      const perPage = args.per_page;
      if (page !== undefined) qs.set('page', String(page));
      if (perPage !== undefined) qs.set('per_page', String(perPage));
      return koladaGet(`/kpi?${qs.toString()}`);
    }
    case 'list_municipalities': {
      const title = args.title;
      const qs = new URLSearchParams();
      if (typeof title === 'string' && title.trim()) qs.set('title', title);
      const q = qs.toString();
      return koladaGet(`/municipality${q ? `?${q}` : ''}`);
    }
    case 'get_data': {
      const kpiId = enc(reqStr(args, 'kpiId', '"N15428"'));
      const municipalityId = enc(reqStr(args, 'municipalityId', '"0180"'));
      const year = args.year;
      if (year === undefined || year === null || !`${year}`.trim()) {
        throw new Error('Required argument "year" is missing. Pass a four-digit year like 2022.');
      }
      return koladaGet(`/data/kpi/${kpiId}/municipality/${municipalityId}/year/${enc(String(year))}`);
    }
    case 'list_org_units': {
      const qs = new URLSearchParams();
      const title = args.title;
      const municipalityId = args.municipalityId;
      if (typeof title === 'string' && title.trim()) qs.set('title', title);
      if (typeof municipalityId === 'string' && municipalityId.trim()) qs.set('municipality', municipalityId);
      const q = qs.toString();
      return koladaGet(`/ou${q ? `?${q}` : ''}`);
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function koladaGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Kolada: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function enc(v: string): string {
  return encodeURIComponent(v);
}

function reqStr(args: Record<string, unknown>, key: string, example: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${example}.`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
