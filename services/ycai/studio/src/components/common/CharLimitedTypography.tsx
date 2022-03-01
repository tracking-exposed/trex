import React from 'react';

import { Typography, TypographyProps } from '@material-ui/core';

type CharLimitedTypographyProps = Omit<TypographyProps, 'children'> & {
  component?: React.ElementType<any>;
  children: string;
  limit: number;
};

const CharLimitedTypography: React.FC<CharLimitedTypographyProps> = ({
  children,
  limit,
  ...props
}) => {
  const text = children.substring(0, limit);
  const ellipsis = children.length > limit ? '...' : '';
  return <Typography {...props}>{text}{ellipsis}</Typography>;
};

export default CharLimitedTypography;
