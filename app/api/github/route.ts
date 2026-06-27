import { NextRequest, NextResponse } from "next/server";

const REPO = "lanayagiraldo-a11y/ia-masters-os";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const { action, title, body, labels } = await req.json();
    
    if (action === "create-issue") {
      const resp = await fetch(`https://api.github.com/repos/${REPO}/issues`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title,
          body: body || "",
          labels: labels || ["agent-todo"],
          assignee: "lanayagiraldo-a11y",
        }),
      });
      const data = await resp.json();
      if (!resp.ok) return NextResponse.json({ error: data.message }, { status: resp.status });
      return NextResponse.json({ issue: { number: data.number, title: data.title, url: data.html_url, state: data.state, labels: data.labels.map((l: any) => l.name) } });
    }

    if (action === "list-issues") {
      const resp = await fetch(`https://api.github.com/repos/${REPO}/issues?state=all&per_page=30&sort=updated&direction=desc`, {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
        },
      });
      const data = await resp.json();
      if (!resp.ok) return NextResponse.json({ error: data.message }, { status: resp.status });
      const issues = data.map((i: any) => ({
        number: i.number,
        title: i.title,
        url: i.html_url,
        state: i.state,
        labels: i.labels.map((l: any) => l.name),
        assignee: i.assignee?.login || null,
        created_at: i.created_at,
      }));
      return NextResponse.json({ issues });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
