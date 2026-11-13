import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import { renderWithProviders, apiError } from './testUtils';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { authApi } from '../api';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));
vi.mock('../api', () => ({
  authApi: { me: vi.fn(), login: vi.fn(), logout: vi.fn(), register: vi.fn() },
  readingsApi: { list: vi.fn() },
}));

const user = { id: '1', name: 'Asha', email: 'asha@example.com' };

beforeEach(() => {
  vi.clearAllMocks();
  authApi.me.mockRejectedValue(apiError('Authentication required.', 401));
});

describe('Login page', () => {
  const renderLogin = () =>
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<div>Dashboard Page</div>} />
      </Routes>,
      { route: '/login' }
    );

  test('shows inline validation errors for empty fields', async () => {
    renderLogin();
    await userEvent.click(await screen.findByRole('button', { name: /log in/i }));
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(authApi.login).not.toHaveBeenCalled();
  });

  test('shows an error for an invalid email address', async () => {
    renderLogin();
    await userEvent.type(await screen.findByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
  });

  test('toggles password visibility', async () => {
    renderLogin();
    const input = await screen.findByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');
  });

  test('logs in successfully and navigates to the dashboard', async () => {
    authApi.login.mockResolvedValue({ data: { user } });
    renderLogin();
    await userEvent.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText('Dashboard Page')).toBeInTheDocument();
    expect(authApi.login).toHaveBeenCalledWith({ email: 'asha@example.com', password: 'secret123' });
  });

  test('displays the server error message when credentials are wrong', async () => {
    authApi.login.mockRejectedValue(apiError('Invalid email or password.', 401));
    renderLogin();
    await userEvent.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
  });

  test('shows a loading state and prevents double submission', async () => {
    let resolve;
    authApi.login.mockReturnValue(new Promise((r) => { resolve = r; }));
    renderLogin();
    await userEvent.type(await screen.findByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));
    const busy = await screen.findByRole('button', { name: /signing in/i });
    expect(busy).toBeDisabled();
    await userEvent.click(busy);
    expect(authApi.login).toHaveBeenCalledTimes(1);
    resolve({ data: { user } });
    await waitFor(() => expect(screen.getByText('Dashboard Page')).toBeInTheDocument());
  });
});

describe('Register page', () => {
  const renderRegister = () =>
    renderWithProviders(
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: '/register' }
    );

  test('validates every field', async () => {
    renderRegister();
    await userEvent.click(await screen.findByRole('button', { name: /sign up/i }));
    expect(screen.getByText('Full name is required.')).toBeInTheDocument();
    expect(screen.getByText('Email is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
  });

  test('enforces minimum password length and matching passwords', async () => {
    renderRegister();
    await userEvent.type(await screen.findByLabelText('Full Name'), 'Asha Rao');
    await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'short');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'different');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(screen.getByText('Password must be at least 8 characters.')).toBeInTheDocument();
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  test('registers and redirects to login', async () => {
    authApi.register.mockResolvedValue({ data: { user } });
    renderRegister();
    await userEvent.type(await screen.findByLabelText('Full Name'), 'Asha Rao');
    await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPass1');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'StrongPass1');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(authApi.register).toHaveBeenCalledWith({ name: 'Asha Rao', email: 'asha@example.com', password: 'StrongPass1', confirmPassword: 'StrongPass1' });
  });

  test('shows the duplicate-email error from the server', async () => {
    authApi.register.mockRejectedValue(apiError('An account with this email already exists.', 409, { email: 'An account with this email already exists.' }));
    renderRegister();
    await userEvent.type(await screen.findByLabelText('Full Name'), 'Asha Rao');
    await userEvent.type(screen.getByLabelText('Email'), 'asha@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'StrongPass1');
    await userEvent.type(screen.getByLabelText('Confirm Password'), 'StrongPass1');
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));
    const matches = await screen.findAllByText('An account with this email already exists.');
    expect(matches.length).toBeGreaterThan(0);
  });
});

describe('Protected routes', () => {
  const tree = (
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<div>Secret Content</div>} />
      </Route>
    </Routes>
  );

  test('redirects unauthenticated users to the login page', async () => {
    renderWithProviders(tree, { route: '/secret' });
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  test('shows a loader while the session is being checked', () => {
    authApi.me.mockReturnValue(new Promise(() => {}));
    renderWithProviders(tree, { route: '/secret' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('renders protected content for authenticated users', async () => {
    authApi.me.mockResolvedValue({ data: { user } });
    renderWithProviders(tree, { route: '/secret' });
    expect(await screen.findByText('Secret Content')).toBeInTheDocument();
  });
});
