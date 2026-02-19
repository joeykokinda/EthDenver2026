import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const skillPath = path.join(process.cwd(), "..", "skill.md");
    const content = fs.readFileSync(skillPath, "utf8");

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "skill.md not found" }, { status: 404 });
  }
}
