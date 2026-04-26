import { Field, FieldError, FieldLabel } from '@knowbase/ui/components/field';
import {
  NativeSelect,
  NativeSelectOption,
} from '@knowbase/ui/components/native-select';
import {
  type FieldValues,
  type UseControllerProps,
  useController,
} from 'react-hook-form';

interface Option {
  label: string;
  value: string;
}

interface IFormSelectProps<T extends FieldValues>
  extends UseControllerProps<T> {
  label: string;
  placeholder?: string;
  options: Option[];
}

export const FormSelect = <T extends FieldValues>({
  label,
  control,
  name,
  options,
  placeholder = 'Select an option',
}: IFormSelectProps<T>) => {
  const { field, fieldState } = useController({
    control,
    name,
  });

  return (
    <Field data-invalid={fieldState.error?.message}>
      <FieldLabel>{label}</FieldLabel>

      <NativeSelect {...field}>
        <NativeSelectOption value="">{placeholder}</NativeSelectOption>
        {options.map((option) => (
          <NativeSelectOption value={option.value} key={option.value}>
            {option.label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <FieldError>{fieldState.error?.message}</FieldError>
    </Field>
  );
};
