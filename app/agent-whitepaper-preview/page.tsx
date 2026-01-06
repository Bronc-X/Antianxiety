import fs from 'node:fs/promises';
import path from 'node:path';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import './whitepaper.css';

export default async function AgentWhitepaperPreviewPage() {
    const filePath = path.join(process.cwd(), 'docs', 'AGENT_WHITEPAPER.md');
    const markdown = await fs.readFile(filePath, 'utf8');

    return (
        <main className="whitepaper-page">
            <div className="whitepaper-shell">
                <article className="whitepaper-prose">
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                    >
                        {markdown}
                    </ReactMarkdown>
                </article>
            </div>
        </main>
    );
}
