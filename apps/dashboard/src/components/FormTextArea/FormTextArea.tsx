import { Field, FieldError, FieldLabel } from '@knowbase/ui/components/field';
import { Textarea } from '@knowbase/ui/components/textarea';
import type { ComponentProps } from 'react';
import {
  type FieldValues,
  type UseControllerProps,
  useController,
} from 'react-hook-form';

interface IFormTextareaProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<ComponentProps<typeof Textarea>, 'defaultValue' | 'name'> {
  label: string;
}

export const FormTextarea = <T extends FieldValues>({
  label,
  control,
  name,
  ...otherProps
}: IFormTextareaProps<T>) => {
  const { fieldState, field } = useController({
    control,
    name,
  });

  return (
    <Field data-invalid={fieldState.error?.message}>
      <FieldLabel>{label}</FieldLabel>
      <Textarea
        {...field}
        aria-invalid={!!fieldState.error?.message}
        {...otherProps}
      />
      <FieldError>{fieldState.error?.message}</FieldError>
    </Field>
  );
};
