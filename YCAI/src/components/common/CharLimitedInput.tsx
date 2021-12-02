import React from 'react';

import { TextField, StandardTextFieldProps } from '@material-ui/core';

interface CharLimitedInputProps extends StandardTextFieldProps {
  limit: number;
}

const CharLimitedInput: React.FC<CharLimitedInputProps> = ({
  limit,
  ...props
}) => {
  const [value, setValue] = React.useState<string>(props.value as string ?? '');
  const [overflowed, setOverflowed] = React.useState<boolean>(false);

  const tooLong = value.length > limit || overflowed;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { value } = event.target;
    if (value.length > limit) {
      setValue(value.substring(0, limit));
      setOverflowed(true);
    } else {
      setValue(value);
      setOverflowed(false);
    }
    props.onChange?.(event);
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
