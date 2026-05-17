import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

const CATEGORIES = [
  'Customer Support',
  'E-commerce',
  'HR & Internal Tools',
  'Sales & Lead Generation',
  'Healthcare',
  'Education',
  'Real Estate',
  'Other',
] as const;

type FormState = {
  name: string;
  email: string;
  company: string;
  phone: string;
  category: string;
  message: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function validate(data: FormState): FieldErrors {
  const errors: FieldErrors = {};
  if (!data.name.trim()) errors.name = 'Name is required';
  if (!data.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    errors.email = 'Enter a valid email';
  if (!data.company.trim()) errors.company = 'Company is required';
  if (!data.category) errors.category = 'Please select a category';
  return errors;
}

function BookDemoForm() {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    company: '',
    phone: '',
    category: '',
    message: '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  }

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const fieldErrors = validate(form);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
        return;
      }
      if (!executeRecaptcha) {
        setServerError('CAPTCHA not ready. Please try again.');
        return;
      }
      setSubmitting(true);
      setServerError('');
      try {
        const captchaToken = await executeRecaptcha('book_demo');
        const payload: Record<string, string> = {
          name: form.name.trim(),
          email: form.email.trim(),
          company: form.company.trim(),
          category: form.category,
          captchaToken,
        };
        if (form.phone.trim()) payload.phone = form.phone.trim();
        if (form.message.trim()) payload.message = form.message.trim();

        const res = await fetch(
          `${import.meta.env.VITE_API_BASE as string}/demo`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          },
        );
        if (!res.ok) throw new Error('Something went wrong. Please try again.');
        setSubmitted(true);
      } catch (err) {
        setServerError(
          err instanceof Error ? err.message : 'Something went wrong.',
        );
      } finally {
        setSubmitting(false);
      }
    },
    [executeRecaptcha, form],
  );

  return (
    <div className="min-h-screen bg-[#f8f7fc]">
      <header className="px-6 py-4 border-b border-[#301B69]/10 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
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

      <main className="max-w-2xl mx-auto px-6 py-16">
        {submitted ? (
          <div className="bg-white rounded-3xl border border-[#301B69]/10 shadow-sm p-10 md:p-14 text-center">
            <div className="text-5xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-[#301B69] mb-3">
              Thanks! We'll be in touch shortly.
            </h1>
            <p className="text-[#301B69]/60 mb-8">
              We've received your details and will reach out within one business
              day to schedule your personalised demo.
            </p>
            <Link
              to="/"
              className="inline-block px-6 py-2.5 bg-[#301B69] text-white rounded-xl text-sm font-medium hover:opacity-90 transition"
            >
              Back to Home
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#301B69]/10 shadow-sm p-10 md:p-14">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-[#301B69] mb-2">
                Book a Demo
              </h1>
              <p className="text-[#301B69]/60 text-sm">
                See how Agenvik can work for your team. Fill in your details and
                we'll reach out to schedule a personalised walkthrough.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <Field label="Full Name" required error={errors.name}>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Jane Smith"
                  className={inputCls(!!errors.name)}
                />
              </Field>

              <Field label="Work Email" required error={errors.email}>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="jane@company.com"
                  className={inputCls(!!errors.email)}
                />
              </Field>

              <Field label="Company" required error={errors.company}>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Acme Inc."
                  className={inputCls(!!errors.company)}
                />
              </Field>

              <Field label="Phone" error={errors.phone}>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className={inputCls(false)}
                />
              </Field>

              <Field
                label="What are you looking to build?"
                required
                error={errors.category}
              >
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className={selectCls(!!errors.category)}
                >
                  <option value="" disabled>
                    Select a category…
                  </option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="What do you want to use Agenvik for?"
                error={errors.message}
              >
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="E.g. customer support bot for our e-commerce store, internal HR FAQ assistant..."
                  rows={4}
                  className={inputCls(false)}
                />
              </Field>

              {serverError && (
                <p className="text-sm text-red-600">{serverError}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-[#301B69] text-white rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-60"
              >
                {submitting ? 'Submitting…' : 'Request a Demo →'}
              </button>

              <p className="text-center text-xs text-[#301B69]/40">
                Protected by reCAPTCHA —{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#301B69]/60"
                >
                  Privacy
                </a>{' '}
                &{' '}
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[#301B69]/60"
                >
                  Terms
                </a>
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm text-[#301B69] outline-none',
    'placeholder:text-[#301B69]/30 focus:ring-2 focus:ring-[#301B69]/20 transition',
    hasError
      ? 'border-red-400 focus:border-red-400'
      : 'border-[#301B69]/15 focus:border-[#301B69]/40',
  ].join(' ');
}

function selectCls(hasError: boolean) {
  return [
    'w-full rounded-xl border px-4 py-2.5 text-sm text-[#301B69] outline-none bg-white appearance-none',
    'focus:ring-2 focus:ring-[#301B69]/20 transition cursor-pointer',
    hasError
      ? 'border-red-400 focus:border-red-400'
      : 'border-[#301B69]/15 focus:border-[#301B69]/40',
  ].join(' ');
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-[#301B69]/70">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

const BookDemoPage = () => (
  <GoogleReCaptchaProvider
    reCaptchaKey={import.meta.env.VITE_RECAPTCHA_SITE_KEY as string}
  >
    <BookDemoForm />
  </GoogleReCaptchaProvider>
);

export default BookDemoPage;
