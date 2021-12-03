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

  const tooLong = value.length > limit;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value: newValue } = event.target;
    setValue(newValue);
    onChange?.(newValue);
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
