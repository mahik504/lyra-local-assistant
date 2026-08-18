import { NextResponse } from "next/server";
import { getGatewayConfig } from "@/lib/lyra/model-gateway";
import { getVaultConfig } from "@/lib/obsidian/vault";
import { readConfiguredMcpServers } from "@/lib/lyra/mcp-contract";
import { LYRA_SKILLS } from "@/lib/lyra/skill-registry";

export async function GET() {
  const gateway = getGatewayConfig();
  const vault = getVaultConfig();
  return NextResponse.json({
    local: true,
    vaultConfigured: Boolean(vault.root),
    autoWrite: vault.autoWrite,
    modelConfigured: Boolean(gateway.baseUrl && gateway.apiKey && Object.values(gateway.models).some(Boolean)),
    routesConfigured: Object.entries(gateway.models).filter(([, model]) => Boolean(model)).map(([route]) => route),
    skillsAvailable: LYRA_SKILLS.map((skill) => skill.id),
    mcpServersEnabled: readConfiguredMcpServers().filter((server) => server.enabled).map((server) => server.id),
  });
}
