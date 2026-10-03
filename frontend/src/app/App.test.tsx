import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';

vi.stubGlobal(
  'fetch',
  vi.fn(() => new Promise(() => undefined)),
);

describe('App', () => {
  it('muestra la página inicial', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /todo lo que necesitas/i })).toBeInTheDocument();
  });
});
