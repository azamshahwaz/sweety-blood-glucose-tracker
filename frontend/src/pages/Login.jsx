import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import FormField from '../components/common/FormField';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { validateLogin } from '../utils/validation';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const found = validateLogin(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      toast.success('Welcome back!');
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell heading={<>Track Your Blood Glucose With Sweety</>} description="Record your daily readings, view insightful reports, and keep your health on track." showPoints>
      <h2 className="text-2xl font-bold">Welcome Back 👋</h2>
      <p className="mb-6 mt-1 text-sm text-muted">Sign in to your Sweety account</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-error">{formError}</div>}
        <FormField id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={onChange} className={`field-input ${errors.email ? 'input-error' : ''}`} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={onChange} error={errors.password} />
        </FormField>
        <Button type="submit" loading={submitting} className="w-full">{submitting ? 'Signing in…' : 'Log In'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account? <Link to="/register" className="font-semibold text-primary hover:underline">Sign up</Link>
      </p>
    </AuthShell>
  );
}
