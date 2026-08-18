export type AegisMcpServer = {
  id: string;
  label: string;
  transport: "stdio" | "sse" | "streamable-http";
  endpoint?: string;
  command?: string;
  enabled: boolean;
  allowedTools: string[];
};

export function readConfiguredMcpServers(): AegisMcpServer[] {
  const raw = process.env.AEGIS_MCP_CONFIG_JSON?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((server): server is AegisMcpServer => {
      if (!server || typeof server !== "object") return false;
      const value = server as Partial<AegisMcpServer>;
      return typeof value.id === "string" && typeof value.label === "string" && (value.transport === "stdio" || value.transport === "sse" || value.transport === "streamable-http") && typeof value.enabled === "boolean" && Array.isArray(value.allowedTools);
    });
  } catch {
    return [];
  }
}

export function canUseMcpTool(server: AegisMcpServer, toolId: string) {
  return server.enabled && server.allowedTools.includes(toolId);
}
