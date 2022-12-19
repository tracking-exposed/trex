import { GridCellParams } from '@mui/x-data-grid';

export const getApplyFilterFnIncluded = (
  value: string
): null | ((p: GridCellParams) => boolean) => {
  // console.log('value', value);
  if (!value || value.length !== 4 || !/\d{4}/.test(value)) {
    // If the value is not a 4 digit string, it can not be a year so applying this filter is useless
    return null;
  }
  return (params: GridCellParams): boolean => {
    return params.value.includes(value);
  };
};
