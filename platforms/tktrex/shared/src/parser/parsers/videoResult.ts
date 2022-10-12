import _ from 'lodash';

export const publishingDate = (img: Element | null): string | null => {
  return _.reduce<any, string | null>(
    img?.parentNode?.parentNode?.childNodes ?? [],
    function(memo, n) {
      if (!memo && n.textContent.trim().match(/(\d{4})-(\d{1,2})-(\d{1,2})/))
        memo = n.textContent;
      if (!memo && n.textContent.trim().match(/(\d{1,2})-(\d{1,2})/))
        memo = new Date().getFullYear() + '-' + n.textContent;
      return memo;
    },
    null,
  );
};
