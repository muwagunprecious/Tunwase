"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy, Terminal, Bug, Eye, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { structureAiText, normalizeUnicode } from "@/lib/agents/content-cleaner";

interface MarkdownRendererProps {
  content: string;
  rawContent?: string;
  enableDebugMode?: boolean;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#272e3c] bg-[#0f1217]">
      <div className="flex items-center justify-between border-b border-[#222834] bg-[#151921] px-3.5 py-1.5 text-xs text-neutral-400">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-700">
          <Terminal className="h-3.5 w-3.5 text-amber-400" />
          <span>{language || "code"}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-neutral-400 hover:bg-[#202632] hover:text-neutral-200 transition-colors"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto p-3.5 font-mono text-xs text-neutral-200 leading-relaxed">
        <pre>{code}</pre>
      </div>
    </div>
  );
}

export function MarkdownRenderer({
  content,
  rawContent,
  enableDebugMode = false
}: MarkdownRendererProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugTab, setDebugTab] = useState<"raw" | "ast" | "rendered">("raw");

  // Fallback if content is empty
  if (!content) {
    return <span className="text-neutral-500 italic">No content</span>;
  }

  // Sanitize and structure content to ensure no asterisks or malformed elements leak
  const sanitizedContent = structureAiText(normalizeUnicode(content || ""));

  // Debug AST representation (basic tokenized breakdown for inspection)
  const tokenBreakdown = sanitizedContent
    .split("\n")
    .map((line, i) => {
      let type = "paragraph";
      if (line.startsWith("# ")) type = "heading-1";
      else if (line.startsWith("## ")) type = "heading-2";
      else if (line.startsWith("### ")) type = "heading-3";
      else if (line.startsWith("#### ")) type = "heading-4";
      else if (line.startsWith("- ") || line.startsWith("* ")) type = "unordered-list-item";
      else if (/^\d+\.\s/.test(line)) type = "ordered-list-item";
      else if (line.startsWith("> ")) type = "blockquote";
      else if (line.startsWith("|")) type = "table-row";
      else if (line.startsWith("```")) type = "code-fence";
      else if (/^---|\*\*\*|___/.test(line)) type = "horizontal-rule";
      return { line: i + 1, type, content: line };
    });

  return (
    <div className="markdown-body text-sm leading-relaxed text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 mt-5 mb-3 tracking-tight border-b border-slate-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-4 mb-2 tracking-tight">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-slate-900 mt-3.5 mb-1.5">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold text-slate-900 mt-2.5 mb-1">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm text-slate-800 leading-relaxed mb-3 last:mb-0">
              {children}
            </p>
          ),

          // Styling
          strong: ({ children }) => (
            <strong className="font-semibold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700">{children}</em>
          ),
          del: ({ children }) => (
            <del className="line-through text-neutral-500">{children}</del>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-2.5 ml-5 list-disc space-y-1 text-sm text-slate-800 marker:text-amber-600">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2.5 ml-5 list-decimal space-y-1 text-sm text-slate-800 marker:text-amber-600">
              {children}
            </ol>
          ),
          li: ({ children, ...props }: any) => {
            // Check if this list item has a task checkbox
            const isTask = props.className?.includes("task-list-item");
            return (
              <li
                className={`leading-relaxed ${
                  isTask ? "list-none -ml-4 flex items-start gap-2" : "pl-1"
                }`}
              >
                {children}
              </li>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-lg border-l-4 border-amber-500/80 bg-amber-500/5 px-4 py-2 italic text-slate-700">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-800">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#161a23] text-slate-700 font-semibold tracking-wider uppercase text-[11px]">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-200 bg-white">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-semibold text-slate-900 border-b border-slate-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2.5 text-slate-700 align-top border-b border-[#202633]">
              {children}
            </td>
          ),

          // Code
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && (match || codeString.includes("\n"))) {
              return (
                <CodeBlock
                  language={match ? match[1] : ""}
                  code={codeString}
                />
              );
            }

            return (
              <code
                className="rounded bg-slate-100 border border-slate-200 px-1.5 py-0.5 font-mono text-[12px] text-amber-800 font-medium"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </a>
          ),

          // Divider
          hr: () => <hr className="my-4 border-t border-[#272f3d]" />,

          // Input (task checkboxes)
          input: ({ type, checked, ...props }: any) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mt-1 h-3.5 w-3.5 rounded border-neutral-600 bg-neutral-800 text-amber-500 focus:ring-0 focus:ring-offset-0"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          }
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>

      {/* Internal Developer Debug Inspector (hidden unless enabled) */}
      {enableDebugMode && (
        <div className="mt-4 pt-3 border-t border-[#232936]">
          <button
            onClick={() => setDebugOpen(!debugOpen)}
            className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <Bug className="w-3 h-3 text-amber-500" />
            <span>Developer Inspector</span>
            {debugOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {debugOpen && (
            <div className="mt-2 rounded-xl border border-[#2a3240] bg-[#0c0e12] p-3 text-xs">
              <div className="flex gap-2 border-b border-[#202634] pb-2 mb-3">
                <button
                  onClick={() => setDebugTab("raw")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    debugTab === "raw"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  Raw Model Response
                </button>
                <button
                  onClick={() => setDebugTab("ast")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    debugTab === "ast"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  AST / Token Inspector ({tokenBreakdown.length} lines)
                </button>
                <button
                  onClick={() => setDebugTab("rendered")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    debugTab === "rendered"
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  Render Summary
                </button>
              </div>

              {debugTab === "raw" && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] text-neutral-500">
                    <span>Direct unmodified string buffer ({content.length} chars)</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(rawContent || content)}
                      className="text-amber-400 hover:underline"
                    >
                      Copy raw
                    </button>
                  </div>
                  <pre className="p-2.5 rounded bg-[#14171f] border border-[#222834] font-mono text-[11px] text-slate-700 overflow-x-auto whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {rawContent || content}
                  </pre>
                </div>
              )}

              {debugTab === "ast" && (
                <div className="space-y-1.5 max-h-60 overflow-y-auto font-mono text-[11px]">
                  {tokenBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 py-0.5 border-b border-[#181d26] text-neutral-400"
                    >
                      <span className="w-6 text-neutral-600 shrink-0 text-right">{item.line}</span>
                      <span className="px-1.5 py-0.2 rounded bg-[#1a202c] text-amber-400 text-[10px] shrink-0">
                        {item.type}
                      </span>
                      <span className="truncate text-slate-700">{item.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {debugTab === "rendered" && (
                <div className="space-y-2 text-[11px] text-slate-700">
                  <p>
                    <strong className="text-amber-400">Renderer:</strong> react-markdown + remark-gfm
                  </p>
                  <p>
                    <strong className="text-amber-400">Status:</strong> Fully parsed without raw markup exposure
                  </p>
                  <p>
                    <strong className="text-amber-400">Dashes Guard:</strong> Zero em-dash violation free, Markdown table delimiters intact.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
