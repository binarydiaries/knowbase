import { Badge } from '@knowbase/ui/components/badge';
import { Separator } from '@knowbase/ui/components/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@knowbase/ui/components/table';
import { Check, Minus } from 'lucide-react';
import CTABanner from '@/sections/CTABanner';
import FAQ from '@/sections/FAQ';
import PricingCards, { plans } from '@/sections/PricingCards';

const comparisonRows = [
  { feature: 'Chatbots', values: ['1', '3', '10', '30'] },
  { feature: 'Knowledge sources', values: ['10', '250', '1,000', '5,000'] },
  { feature: 'Messages / month', values: ['100', '500', '2,000', '8,000'] },
  { feature: 'Training runs / day', values: ['3', '10', '20', '40'] },
  { feature: 'Web channel', values: [true, true, true, true] },
  { feature: 'WhatsApp channel', values: [false, true, true, true] },
  { feature: 'Instagram channel', values: [false, true, true, true] },
  { feature: 'Analytics dashboard', values: [false, true, true, true] },
  { feature: 'Priority support', values: [false, false, false, true] },
];

function CellValue({ value }: { value: string | boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="mx-auto h-4 w-4 text-primary" />
    ) : (
      <Minus className="mx-auto h-4 w-4 text-muted-foreground" />
    );
  }
  return <span>{value}</span>;
}

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <Badge variant="secondary" className="mb-6">Pricing</Badge>
          <h1 className="mb-6 font-bold text-4xl tracking-tight md:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="text-muted-foreground text-xl leading-relaxed">
            Start free. Scale as you grow. Every plan includes all three deployment channels and
            a full-featured chatbot builder.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <PricingCards highlight />
        </div>
      </section>

      <Separator />

      {/* Comparison table */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center font-bold text-2xl tracking-tight md:text-3xl">
            Compare all plans
          </h2>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Feature</TableHead>
                  {plans.map((plan) => (
                    <TableHead key={plan.name} className="text-center">
                      <div className="font-semibold">{plan.name}</div>
                      <div className="font-normal text-muted-foreground text-xs">{plan.price}/mo</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium text-sm">{row.feature}</TableCell>
                    {row.values.map((value, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: stable order
                      <TableCell key={i} className="text-center text-sm">
                        <CellValue value={value} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <Separator />

      <FAQ />

      <Separator />

      <CTABanner />
    </>
  );
}
