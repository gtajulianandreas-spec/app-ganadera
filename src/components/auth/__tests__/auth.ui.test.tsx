import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../../../context/AuthContext';
import { AuthModal } from '../AuthModal';

describe('AuthModal UI, Privacy Consents (Ley 1581) & Token Hygiene', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ authenticated: false, user: null, backendConfigured: true }),
      })
    );
  });

  it('renders Google OAuth button and Email/Password login cleanly without storing tokens in localStorage', async () => {
    render(
      <AuthProvider>
        <AuthModal onClose={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Continuar con Google')).toBeTruthy();
    });

    expect(screen.getByPlaceholderText('ganadero@ejemplo.com')).toBeTruthy();
    expect(localStorage.getItem('ag_session')).toBeNull();
    expect(sessionStorage.getItem('ag_session')).toBeNull();
  });

  it('keeps Ley 1581 privacy and data-processing checkboxes UNCHECKED by default on registration', async () => {
    render(
      <AuthProvider>
        <AuthModal initialMode="register" onClose={() => {}} />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Juan Carlos Gómez')).toBeTruthy();
    });

    const checkboxes = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes.length).toBe(3);
    checkboxes.forEach(cb => {
      expect(cb.checked).toBe(false);
    });

    fireEvent.change(screen.getByPlaceholderText('Juan Carlos Gómez'), { target: { value: 'Carlos Pérez' } });
    fireEvent.change(screen.getByPlaceholderText('ganadero@ejemplo.com'), { target: { value: 'carlos@finca.co' } });
    fireEvent.change(screen.getByPlaceholderText('Ej. finca pradera ganado 2026'), {
      target: { value: 'finca la pradera 2026' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear Cuenta' }));
    expect(
      screen.getByText('Debes aceptar la Política de Privacidad y autorizar el tratamiento de datos personales.')
    ).toBeTruthy();
  });
});
