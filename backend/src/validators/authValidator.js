const { z } = require('zod');

const registerSchema = z
  .object({
    name: z.string({ required_error: 'Full name is required.' }).trim().min(1, 'Full name is required.').max(100, 'Full name must be at most 100 characters.'),
    email: z.string({ required_error: 'Email is required.' }).trim().toLowerCase().max(255).email('Please enter a valid email address.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(8, 'Password must be at least 8 characters.')
      .refine((v) => Buffer.byteLength(v) <= 72, 'Password must be at most 72 bytes.'),
    confirmPassword: z.string({ required_error: 'Please confirm your password.' }),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });

const loginSchema = z.object({
  email: z.string({ required_error: 'Email is required.' }).trim().toLowerCase().email('Please enter a valid email address.'),
  password: z.string({ required_error: 'Password is required.' }).min(1, 'Password is required.'),
});

module.exports = { registerSchema, loginSchema };
