const getBO = () => {
  if (typeof window !== undefined) {
    return (window as any).chrome || (window as any).browser;
  }
};

export const bo = getBO();
