import React from 'react';

import { TextField, StandardTextFieldProps } from '@material-ui/core';

type CharLimitedInputProps = Omit<StandardTextFieldProps, 'onChange'> & {
  limit: number;
  onChange: (value: string) => void;
}

const CharLimitedInput: React.FC<CharLimitedInputProps> = ({
  limit,
  value: initialValue,
  onChange,
  ...props
}) => {
  const [value, setValue] = React.useState<string>(initialValue as string ?? '');
  const [overflowed, setOverflowed] = React.useState<boolean>(false);

  const tooLong = value.length > limit || overflowed;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: newValue } = event.target;
    if (newValue.length > limit) {
      const trimmed = newValue.substring(0, limit);
      setValue(trimmed);
      setOverflowed(true);
      onChange?.(trimmed);
    } else {
      setValue(newValue);
      setOverflowed(false);
      onChange?.(newValue);
    }
  };

  return (
    <TextField
      {...props}
      helperText={tooLong && `This field cannot exceed ${limit} characters`}
      onChange={handleChange}
      value={value}
      variant="outlined"
    />
  );
}

export default CharLimitedInput;
