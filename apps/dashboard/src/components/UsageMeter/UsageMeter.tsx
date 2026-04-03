import { Progress } from '@knowbase/ui/components/progress';

type UsageMeterProps = {
  label: string;
  current: number;
  limit: number;
  helperText?: string;
};

export function UsageMeter({
  label,
  current,
  limit,
  helperText,
}: UsageMeterProps) {
  const safeLimit = Math.max(limit, 1);
  const percentage = Math.min((current / safeLimit) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {current} / {limit}
        </span>
      </div>
      <Progress value={percentage} />
      {helperText ? (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      ) : null}
    </div>
  );
}
