import { Field, FieldError, FieldLabel } from '@knowbase/ui/components/field';
import { Input } from '@knowbase/ui/components/input';
import type { ComponentProps } from 'react';
import {
  type FieldValues,
  type UseControllerProps,
  useController,
} from 'react-hook-form';

interface IFormInputColorProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<ComponentProps<typeof Input>, 'defaultValue' | 'name'> {
  label: string;
}

export const FormInputColor = <T extends FieldValues>({
  label,
  control,
  name,
  ...otherProps
}: IFormInputColorProps<T>) => {
  const { fieldState, field } = useController({
    control,
    name,
  });

  return (
    <Field data-invalid={fieldState.error?.message}>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          {...field}
          aria-invalid={!!fieldState.error?.message}
          className="h-10 w-14 cursor-pointer p-1"
          {...otherProps}
        />

        <Input
          {...field}
          aria-invalid={!!fieldState.error?.message}
          className="max-w-[140px]"
          {...otherProps}
        />
      </div>

      <FieldError>{fieldState.error?.message}</FieldError>
    </Field>
  );
};
