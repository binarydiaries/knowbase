import { Link, useParams, Navigate } from 'react-router-dom';
import { getPostBySlug, type ContentBlock } from '../../data/blog-posts';
import { Clock, Calendar, ArrowLeft } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2
          key={index}
          className="text-xl font-bold text-[#301B69] mt-10 mb-3"
        >
          {block.text}
        </h2>
      );
    case 'h3':
      return (
        <h3
          key={index}
          className="text-base font-semibold text-[#301B69] mt-7 mb-2"
        >
          {block.text}
        </h3>
      );
    case 'p':
      return (
        <p key={index} className="text-[#301B69]/80 leading-relaxed mb-4">
          {block.text}
        </p>
      );
    case 'ul':
      return (
        <ul key={index} className="list-disc list-inside space-y-1.5 mb-4">
          {block.items.map((item, i) => (
            <li key={i} className="text-[#301B69]/80 leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      );
    case 'ol':
      return (
        <ol key={index} className="list-decimal list-inside space-y-1.5 mb-4">
          {block.items.map((item, i) => (
            <li key={i} className="text-[#301B69]/80 leading-relaxed">
              {item}
            </li>
          ))}
        </ol>
      );
    case 'quote':
      return (
        <blockquote
          key={index}
          className="border-l-4 border-[#301B69]/30 bg-[#301B69]/5 rounded-r-xl px-6 py-4 my-6"
        >
          <p className="text-[#301B69]/80 italic leading-relaxed">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.author && (
            <p className="text-xs text-[#301B69]/50 mt-2 font-medium">
              — {block.author}
            </p>
          )}
        </blockquote>
      );
    default:
      return null;
  }
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug ?? '');

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <header className="px-6 py-4 border-b border-[#301B69]/10 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" aria-label="Agenvik home">
            <img src="/TextLogo.svg" alt="Agenvik" className="h-7 w-auto" />
          </Link>
          <Link
            to="/blog"
            className="flex items-center gap-1.5 text-sm text-[#301B69]/70 hover:text-[#301B69] transition"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            All posts
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="bg-white rounded-3xl border border-[#301B69]/10 shadow-sm overflow-hidden">
          <div
            className={`h-48 bg-gradient-to-br ${post.gradient} flex items-end p-8`}
          >
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold text-white/90 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="p-8 md:p-12">
            <div className="flex items-center gap-5 text-xs text-[#301B69]/40 mb-5">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} aria-hidden="true" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={12} aria-hidden="true" />
                {post.readTime} min read
              </span>
              <span>{post.author}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-[#301B69] leading-snug mb-4">
              {post.title}
            </h1>
            <p className="text-[#301B69]/60 text-base leading-relaxed mb-10 pb-8 border-b border-[#301B69]/10">
              {post.excerpt}
            </p>

            <article className="text-sm">
              {post.content.map((block, i) => renderBlock(block, i))}
            </article>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#301B69]/60 hover:text-[#301B69] transition"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to all posts
          </Link>
        </div>
      </main>

      <footer className="text-center py-10 text-sm text-[#301B69]/40 border-t border-[#301B69]/10 mt-8">
        <p>
          © 2026 Agenvik ·{' '}
          <Link to="/privacy-policy" className="hover:text-[#301B69]">
            Privacy Policy
          </Link>
          {' · '}
          <Link to="/terms" className="hover:text-[#301B69]">
            Terms
          </Link>
        </p>
      </footer>
    </div>
  );
};

export default BlogPostPage;
