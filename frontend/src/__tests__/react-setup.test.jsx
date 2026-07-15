import React from 'react';
import { render, screen } from '@testing-library/react';

function Hello() {
  return <div>Hello, Jest</div>;
}

test('renders hello text', () => {
  render(<Hello />);
  expect(screen.getByText('Hello, Jest')).toBeInTheDocument();
});
