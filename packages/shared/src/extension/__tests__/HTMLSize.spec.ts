import { fc } from '../../test';
import { HTMLSize } from '../utils/HTMLSize.utils';

describe('HTMLSize', () => {
  test('succeeds with a simple html', () => {
    const simpleHTML = fc.sample(fc.string({ minLength: 100001 }))[0];
    const simpleHTMLSize = HTMLSize();
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(true);
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(false);

    simpleHTMLSize.reset();
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(true);
  });

  test('succeeds with a simple html that grows', () => {
    let simpleHTML = fc.sample(
      fc.string({ minLength: 100001, maxLength: 100002 })
    )[0];

    const simpleHTMLSize = HTMLSize();

    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(true);

    simpleHTML += fc.sample(fc.string({ minLength: 100, maxLength: 100 }));
    expect(simpleHTMLSize.getPercentageIncrease(simpleHTML)).toBeLessThan(10);
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(true);
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(false);

    simpleHTML += fc.sample(fc.string({ minLength: 10, maxLength: 10 }));
    expect(simpleHTMLSize.getPercentageIncrease(simpleHTML)).toBeLessThan(1);
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(false);

    simpleHTML += fc.sample(fc.string({ minLength: 100, maxLength: 100 }));
    expect(simpleHTMLSize.getPercentageIncrease(simpleHTML)).toBeLessThan(11);
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(true);
    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(false);

    simpleHTMLSize.reset()

    expect(simpleHTMLSize.hasNewContent(simpleHTML)).toBe(true);
  });
});
