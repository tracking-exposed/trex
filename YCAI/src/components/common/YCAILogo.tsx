import * as React from 'react';
import ycaiLogoSrc from './ycai_logo.svg';

const YCAILogo: React.FC<{ width: string | number }> = ({ width }) => {
  return <img src={ycaiLogoSrc} style={{ width: '100%' }} />;
};

export default YCAILogo;
