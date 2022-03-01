import * as React from 'react';
import ycaiLogoSrc from '../../resources/studio-logo-youchoose.svg';

const YCAILogo: React.FC<{ height: string | number }> = ({ height }) => {
  return <img
    src={ycaiLogoSrc}
    style={{ height }}
  />;
};

export default YCAILogo;
