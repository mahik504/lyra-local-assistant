import { NextResponse } from "next/server";
import { getGatewayConfig } from "@/lib/aegis/model-gateway";
import { getVaultConfig } from "@/lib/obsidian/vault";
import { readConfiguredMcpServers } from "@/lib/aegis/mcp-contract";
import { AEGIS_SKILLS } from "@/lib/aegis/skill-registry";

export async function GET() {
  const gateway = getGatewayConfig();
  const vault = getVaultConfig();
  return NextResponse.json({
    local: true,
    vaultConfigured: Boolean(vault.root),
    autoWrite: vault.autoWrite,
    modelConfigured: Boolean(gateway.baseUrl && gateway.apiKey && Object.values(gateway.models).some(Boolean)),
    routesConfigured: Object.entries(gateway.models).filter(([, model]) => Boolean(model)).map(([route]) => route),
    skillsAvailable: AEGIS_SKILLS.map((skill) => skill.id),
    mcpServersEnabled: readConfiguredMcpServers().filter((server) => server.enabled).map((server) => server.id),
  });
}
