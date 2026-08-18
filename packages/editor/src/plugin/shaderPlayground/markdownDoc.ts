/**
 * 轻量 Markdown → HTML（知识点文档预览用，不引入额外依赖）
 */
export function markdownToHtml(md: string): string {
	const lines = md.replace(/\r\n/g, "\n").split("\n");
	const out: string[] = [];
	let inCode = false;
	let codeLang = "";
	let codeBuf: string[] = [];
	let inList = false;

	const flushList = () => {
		if (inList) {
			out.push("</ul>");
			inList = false;
		}
	};

	const escapeHtml = (s: string) =>
		s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

	const inline = (s: string) => {
		let t = escapeHtml(s);
		t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
		t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
		t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
		return t;
	};

	for (const line of lines) {
		if (line.startsWith("```")) {
			if (!inCode) {
				flushList();
				inCode = true;
				codeLang = line.slice(3).trim();
				codeBuf = [];
			} else {
				out.push(`<pre><code class="lang-${escapeHtml(codeLang)}">${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
				inCode = false;
				codeLang = "";
			}
			continue;
		}
		if (inCode) {
			codeBuf.push(line);
			continue;
		}

		if (/^---+$/.test(line.trim())) {
			flushList();
			out.push("<hr/>");
			continue;
		}

		const h = /^(#{1,4})\s+(.+)$/.exec(line);
		if (h) {
			flushList();
			const level = h[1].length;
			out.push(`<h${level}>${inline(h[2])}</h${level}>`);
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			if (!inList) {
				out.push("<ul>");
				inList = true;
			}
			out.push(`<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
			continue;
		}

		if (!line.trim()) {
			flushList();
			continue;
		}

		flushList();
		out.push(`<p>${inline(line)}</p>`);
	}

	flushList();
	if (inCode) {
		out.push(`<pre><code>${escapeHtml(codeBuf.join("\n"))}</code></pre>`);
	}

	return out.join("\n");
}

export function openMarkdownInNewTab(title: string, markdown: string): void {
	const body = markdownToHtml(markdown);
	const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title.replace(/</g, "")}</title>
  <style>
    :root { color-scheme: dark light; }
    body {
      margin: 0 auto; max-width: 820px; padding: 32px 20px 64px;
      font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
      line-height: 1.7; color: #e8e8ec; background: #141418;
    }
    h1,h2,h3,h4 { line-height: 1.3; margin: 1.4em 0 0.6em; }
    h1 { font-size: 1.75rem; border-bottom: 1px solid #333; padding-bottom: 0.4em; }
    h2 { font-size: 1.35rem; }
    p { margin: 0.75em 0; }
    code { background: #2a2a32; padding: 0.1em 0.35em; border-radius: 4px; font-size: 0.92em; }
    pre { background: #1e1e24; padding: 14px 16px; border-radius: 8px; overflow: auto; }
    pre code { background: none; padding: 0; }
    ul { padding-left: 1.4em; }
    li { margin: 0.35em 0; }
    a { color: #7eb6ff; }
    hr { border: none; border-top: 1px solid #333; margin: 2em 0; }
    strong { color: #fff; }
  </style>
</head>
<body>
  <article>${body}</article>
</body>
</html>`;

	const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
	const win = window.open(url, "_blank");
	if (!win) {
		URL.revokeObjectURL(url);
		window.$message?.warning?.("请允许弹窗以预览知识点文档");
		return;
	}
	// 延迟释放，避免部分浏览器空白页
	setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
