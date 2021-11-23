import * as React from 'react';

interface IconProps {
  className?: string,
  color: string;
}
const LabIcon: React.FC<IconProps> = ({ color, ...props }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M7.5 5.6L10 7L8.6 4.5L10 2L7.5 3.4L5 2L6.4 4.5L5 7L7.5 5.6ZM19.5 15.4L17 14L18.4 16.5L17 19L19.5 17.6L22 19L20.6 16.5L22 14L19.5 15.4ZM22 2L19.5 3.4L17 2L18.4 4.5L17 7L19.5 5.6L22 7L20.6 4.5L22 2ZM14.37 7.29C13.98 6.9 13.35 6.9 12.96 7.29L1.29 18.96C0.899998 19.35 0.899998 19.98 1.29 20.37L3.63 22.71C4.02 23.1 4.65 23.1 5.04 22.71L16.7 11.05C17.09 10.66 17.09 10.03 16.7 9.64L14.37 7.29ZM13.34 12.78L11.22 10.66L13.66 8.22L15.78 10.34L13.34 12.78Z"
        fill={color}
      />
    </svg>
  );
};

export default LabIcon;