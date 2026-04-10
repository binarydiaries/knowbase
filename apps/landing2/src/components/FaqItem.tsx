type FaqItemProps = {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
};

export function FaqItem({ question, answer, isOpen, onToggle }: FaqItemProps) {
  return (
    <article className="faq-item">
      <button type="button" className="faq-trigger" aria-expanded={isOpen} onClick={onToggle}>
        <span>{question}</span>
        <span aria-hidden="true" className="text-2xl leading-none text-violet-600">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      {isOpen && <p className="faq-content">{answer}</p>}
    </article>
  );
}
