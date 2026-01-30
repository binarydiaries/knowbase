import { Field, FieldError, FieldLabel } from '@knowbase/ui/components/field';
import { Input } from '@knowbase/ui/components/input';
import type { ComponentProps } from 'react';
import {
  type FieldValues,
  type UseControllerProps,
  useController,
} from 'react-hook-form';

interface IFormInputProps<T extends FieldValues>
  extends UseControllerProps<T>,
    Omit<ComponentProps<typeof Input>, 'defaultValue' | 'name'> {
  label: string;
}

export const FormInput = <T extends FieldValues>({
  label,
  control,
  name,
  ...otherProps
}: IFormInputProps<T>) => {
  const { fieldState, field } = useController({
    control,
    name,
  });

  return (
    <Field data-invalid={fieldState.error?.message}>
      <FieldLabel>{label}</FieldLabel>
      <Input
        {...field}
        aria-invalid={!!fieldState.error?.message}
        {...otherProps}
      />
      <FieldError>{fieldState.error?.message}</FieldError>
    </Field>
  );
};
