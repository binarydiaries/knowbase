const brands = ['Microsoft', 'Notion', 'Google', 'Slack', 'Square', 'Zoom'];

export default function SocialProof() {
  return (
    <section className="border-y border-border bg-muted/20 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <p className="mb-6 text-center text-muted-foreground text-sm font-medium uppercase tracking-widest">
          Trusted by teams at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {brands.map((brand) => (
            <span
              key={brand}
              className="font-semibold text-lg text-muted-foreground/50 tracking-tight select-none"
            >
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
