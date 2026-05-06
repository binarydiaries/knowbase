import { Link } from 'react-router-dom';
import { blogPosts } from '../../data/blog-posts';
import { Clock, Calendar } from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const BlogListPage = () => {
  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <header className="px-6 py-4 border-b border-[#301B69]/10 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" aria-label="Agenvik home">
            <img src="/TextLogo.svg" alt="Agenvik" className="h-7 w-auto" />
          </Link>
          <Link
            to="/"
            className="text-sm text-[#301B69]/70 hover:text-[#301B69] transition"
          >
            ← Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#301B69]/50 uppercase mb-3">
            ✦ Blog
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-[#301B69] mb-4">
            Insights & Guides
          </h1>
          <p className="text-[#301B69]/60 max-w-xl mx-auto">
            Practical articles on AI agents, customer support automation, and
            building knowledge-powered products.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-[#301B69]/10 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div
                className={`h-32 bg-gradient-to-br ${post.gradient} flex items-end p-5`}
              >
                <span className="text-xs font-semibold text-white/80 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  {post.tags[0]}
                </span>
              </div>

              <div className="p-6">
                <h2 className="text-base font-bold text-[#301B69] leading-snug mb-2 group-hover:text-[#7B4FA6] transition-colors line-clamp-2">
                  {post.title}
                </h2>
                <p className="text-sm text-[#301B69]/60 leading-relaxed mb-4 line-clamp-3">
                  {post.excerpt}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#301B69]/40">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" />
                    {formatDate(post.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} aria-hidden="true" />
                    {post.readTime} min read
                  </span>
                </div>
              </div>
            </Link>
          ))}
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

export default BlogListPage;
