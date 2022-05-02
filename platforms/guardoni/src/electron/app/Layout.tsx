import * as React from 'react';
import { Header, HeaderProps } from './Header';

interface LayoutProps extends HeaderProps {}

const Layout: React.FC<LayoutProps> = ({ children, ...headerProps }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header {...headerProps} />
      <div style={{ height: '100%', width: '100%' }}>{children}</div>
    </div>
  );
};

export default Layout;
