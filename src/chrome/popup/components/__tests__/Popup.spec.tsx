import * as React from 'react';
import renderer from 'react-test-renderer';
import Popup from '../popup';

describe('Popup', () => {
  test('Should mount the Popup', () => {
    const component = renderer.create(<Popup publicKey={'pub-key'} />);
    const tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
