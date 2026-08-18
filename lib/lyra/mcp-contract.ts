export type LyraMcpServer = {
  id: string;
  label: string;
  transport: "stdio" | "sse" | "streamable-http";
  endpoint?: string;
  command?: string;
  enabled: boolean;
  allowedTools: string[];
};

export function readConfiguredMcpServers(): LyraMcpServer[] {
  const raw = process.env.LYRA_MCP_CONFIG_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((server): server is LyraMcpServer => {
      if (!server || typeof server !== "object") return false;
      const value = server as Partial<LyraMcpServer>;
      return typeof value.id === "string" && typeof value.label === "string" && (value.transport === "stdio" || value.transport === "sse" || value.transport === "streamable-http") && typeof value.enabled === "boolean" && Array.isArray(value.allowedTools);
    });
  } catch {
    return [];
  }
}

export function canUseMcpTool(server: LyraMcpServer, toolId: string) {
  return server.enabled && server.allowedTools.includes(toolId);
}
