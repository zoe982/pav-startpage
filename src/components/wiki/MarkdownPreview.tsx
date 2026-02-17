import type { JSX, ComponentPropsWithoutRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import type { Components } from 'react-markdown';

const components: Components = {
  h1: ({ children, ...props }: ComponentPropsWithoutRef<'h1'>) => (
    <h1 className="mt-0 mb-4 text-2xl font-bold text-pav-blue" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: ComponentPropsWithoutRef<'h2'>) => (
    <h2 className="mt-8 mb-3 text-xl font-bold text-pav-blue" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: ComponentPropsWithoutRef<'h3'>) => (
    <h3 className="mt-6 mb-2 text-lg font-semibold text-pav-blue" {...props}>{children}</h3>
  ),
  p: ({ children, ...props }: ComponentPropsWithoutRef<'p'>) => (
    <p className="my-3 leading-relaxed text-on-surface" {...props}>{children}</p>
  ),
  ul: ({ children, ...props }: ComponentPropsWithoutRef<'ul'>) => (
    <ul className="my-3 list-disc pl-6 space-y-1 text-on-surface" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: ComponentPropsWithoutRef<'ol'>) => (
    <ol className="my-3 list-decimal pl-6 space-y-1 text-on-surface" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: ComponentPropsWithoutRef<'li'>) => (
    <li className="leading-relaxed" {...props}>{children}</li>
  ),
  a: ({ children, ...props }: ComponentPropsWithoutRef<'a'>) => (
    <a className="state-layer rounded-sm font-medium text-pav-terra underline motion-standard hover:text-pav-terra-hover" {...props}>{children}</a>
  ),
  blockquote: ({ children, ...props }: ComponentPropsWithoutRef<'blockquote'>) => (
    <blockquote className="my-4 border-l-4 border-pav-gold pl-4 italic text-on-surface-variant" {...props}>{children}</blockquote>
  ),
  code: ({ children, className = '', ...props }: ComponentPropsWithoutRef<'code'>) => {
    const isBlock = className.includes('language-');
    if (isBlock) {
      return (
        <code className={`${className} block overflow-x-auto rounded-lg bg-pav-blue p-4 text-sm text-pav-cream`} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-surface-container-high px-2 py-1 text-sm font-medium text-pav-blue" {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }: ComponentPropsWithoutRef<'pre'>) => (
    <pre className="my-4 overflow-x-auto rounded-lg bg-pav-blue p-4 text-sm text-pav-cream" {...props}>{children}</pre>
  ),
  hr: (props: ComponentPropsWithoutRef<'hr'>) => (
    <hr className="my-6 border-outline-variant" {...props} />
  ),
  table: ({ children, ...props }: ComponentPropsWithoutRef<'table'>) => (
    <div className="my-4 overflow-x-auto">
      <table className="min-w-full border-collapse text-sm" {...props}>{children}</table>
    </div>
  ),
  th: ({ children, ...props }: ComponentPropsWithoutRef<'th'>) => (
    <th className="border border-outline-variant bg-surface-container px-3 py-2 text-left font-semibold text-pav-blue" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: ComponentPropsWithoutRef<'td'>) => (
    <td className="border border-outline-variant px-3 py-2 text-on-surface" {...props}>{children}</td>
  ),
  strong: ({ children, ...props }: ComponentPropsWithoutRef<'strong'>) => (
    <strong className="font-semibold text-on-surface" {...props}>{children}</strong>
  ),
  img: (props: ComponentPropsWithoutRef<'img'>) => (
    <img className="my-4 max-w-full rounded-lg" {...props} />
  ),
};

export function MarkdownPreview({
  content,
}: {
  readonly content: string;
}): JSX.Element {
  return (
    <div className="max-w-none text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
