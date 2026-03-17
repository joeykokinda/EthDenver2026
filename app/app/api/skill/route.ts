import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET(req: NextRequest) {
  const agentId = req.nextUrl.searchParams.get("agent");

  // Read the base skill.md from public/
  const filePath = join(process.cwd(), "public", "skill.md");
  let content: string;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch {
    return new NextResponse("Skill not found", { status: 404 });
  }

  if (agentId) {
    // Pre-fill the agent ID throughout the skill document
    content = content
      .replace(/your-agent-id/g, agentId)
      .replace(/your-unique-agent-id/g, agentId)
      .replace(/AGENT_ID = "my-openclaw-agent"/g, `AGENT_ID = "${agentId}"`)
      .replace(/agentId:   "your-unique-agent-id"/g, `agentId:   "${agentId}"`);

    // Inject agent ID into frontmatter
    content = content.replace(
      /^---\n/,
      `---\nagent: ${agentId}\n`
    );
  }

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
