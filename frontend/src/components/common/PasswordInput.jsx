import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordInput({ id, error, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? 'text' : 'password'} className={`field-input pr-11 ${error ? 'input-error' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} {...props} />
      <button type="button" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-primary">
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
