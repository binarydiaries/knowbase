import { Field, FieldError, FieldLabel } from '@knowbase/ui/components/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@knowbase/ui/components/select';
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

      <Select value={field.value} onValueChange={field.onChange}>
        <SelectTrigger aria-invalid={!!fieldState.error?.message}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FieldError>{fieldState.error?.message}</FieldError>
    </Field>
  );
};
