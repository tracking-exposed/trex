import * as React from 'react';
import renderer from 'react-test-renderer';
import Popup from '../popup';

describe('Popup', () => {
  test('Should mount the Popup', () => {
    const component = renderer.create(<Popup />);
    let tree = component.toJSON();
    expect(tree).toMatchSnapshot();

    // re-rendering
    tree = component.toJSON();
    expect(tree).toMatchSnapshot();
  });
});
