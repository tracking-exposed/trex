const getBO = () => {
  return (window as any).chrome || (window as any).browser;
};

export const bo = getBO();
