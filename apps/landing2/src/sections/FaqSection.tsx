import { useState } from 'react';
import { FaqItem } from '@/components/FaqItem';
import { faqs } from '@/data/landing';

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="section-shell">
      <div className="section-heading">
        <p className="eyebrow">FAQ</p>
        <h2 className="section-title">Answers before you start your rollout.</h2>
      </div>
      <div className="mt-8 space-y-3">
        {faqs.map((faq, index) => (
          <FaqItem
            key={faq.question}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
          />
        ))}
      </div>
    </section>
  );
}
