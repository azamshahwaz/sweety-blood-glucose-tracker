import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/layout/AuthShell';
import FormField from '../components/common/FormField';
import PasswordInput from '../components/common/PasswordInput';
import Button from '../components/common/Button';
import { authApi } from '../api';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { validateRegister } from '../utils/validation';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const found = validateRegister(form);
    setErrors(found);
    setFormError('');
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      await authApi.register({ ...form, name: form.name.trim(), email: form.email.trim() });
      toast.success('Account created. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setErrors(getFieldErrors(err));
      setFormError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell heading={<>Start Your Health Journey With Sweety</>} description="Create your account to record readings, track progress, and view detailed reports.">
      <h2 className="text-2xl font-bold">Create Account</h2>
      <p className="mb-6 mt-1 text-sm text-muted">Sign up to get started</p>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && <div role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-error">{formError}</div>}
        <FormField id="name" label="Full Name" error={errors.name}>
          <input id="name" name="name" autoComplete="name" placeholder="Your full name" value={form.name} onChange={onChange} className={`field-input ${errors.name ? 'input-error' : ''}`} aria-invalid={!!errors.name} />
        </FormField>
        <FormField id="email" label="Email" error={errors.email}>
          <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={onChange} className={`field-input ${errors.email ? 'input-error' : ''}`} aria-invalid={!!errors.email} />
        </FormField>
        <FormField id="password" label="Password" error={errors.password}>
          <PasswordInput id="password" name="password" autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={onChange} error={errors.password} />
        </FormField>
        <FormField id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={onChange} error={errors.confirmPassword} />
        </FormField>
        <Button type="submit" loading={submitting} className="w-full">{submitting ? 'Creating account…' : 'Sign Up'}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link>
      </p>
    </AuthShell>
  );
}
