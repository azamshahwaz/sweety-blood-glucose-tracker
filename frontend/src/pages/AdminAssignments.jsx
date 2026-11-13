
import { useCallback, useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  UserPlus,
  LoaderCircle,
  UserRound,
  Mail,
  LockKeyhole,
  Stethoscope,
  Users,
  ShieldCheck,
  UserMinus,
} from 'lucide-react';

import { adminApi } from '../api';
import {
  ErrorBlock,
  LoadingBlock,
} from '../components/common/StateBlock';

export default function AdminAssignments() {
  const [data, setData] = useState({
    doctors: [],
    patients: [],
    assignments: [],
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [doctorId, setDoctor] = useState('');
  const [patientId, setPatient] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Load admin accounts and validate API response.
  const refresh = useCallback(async () => {
    try {
      setError('');

      const response = await adminApi.accounts();

      const payload =
        response?.data?.data ??
        response?.data ??
        response;

      if (
        !payload ||
        !Array.isArray(payload.doctors) ||
        !Array.isArray(payload.patients) ||
        !Array.isArray(payload.assignments)
      ) {
        throw new Error(
          'Invalid accounts API response. Expected doctors, patients and assignments arrays.'
        );
      }

      setData({
        doctors: payload.doctors,
        patients: payload.patients,
        assignments: payload.assignments,
      });
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Unable to load accounts.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Handle create, assign and revoke operations.
  const perform = async (action) => {
    setBusy(true);
    setError('');

    try {
      await action();
      await refresh();
    } catch (e) {
      setError(
        e.response?.data?.message ||
          e.message ||
          'Request failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  // Initial loading state.
  if (loading) {
    return (
      <LoadingBlock label="Loading account management…" />
    );
  }

  // Error state with retry.
  if (
    error &&
    !data.doctors.length &&
    !data.patients.length &&
    !data.assignments.length
  ) {
    return (
      <ErrorBlock
        message={error}
        onRetry={() => {
          setLoading(true);
          refresh();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">

      {/* Page heading */}
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Doctor and patient access
            </h1>

            <p className="text-sm text-muted">
              Manage doctor accounts and patient assignments.
            </p>
          </div>
        </div>
      </header>

      {/* API error */}
      {error && (
        <div
          role="alert"
          className="alert alert-error"
        >
          {error}
        </div>
      )}

      {/* Main forms */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* CREATE DOCTOR FORM */}
        <form
          className="card-sweety space-y-5 p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();

            perform(async () => {
              await adminApi.createDoctor({
                name,
                email,
                password,
              });

              setName('');
              setEmail('');
              setPassword('');
              setShowPassword(false);
            });
          }}
        >
          {/* Form heading */}
          <div className="flex items-center gap-3 border-b border-base-300 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Create doctor account
              </h2>

              <p className="text-xs text-muted">
                Register a new doctor in Sweety.
              </p>
            </div>
          </div>

          {/* Doctor name */}
          <div className="space-y-2">
            <label
              htmlFor="doctor-name"
              className="text-sm font-medium"
            >
              Doctor name
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              />

              <input
                id="doctor-name"
                aria-label="Doctor name"
                className="field-input w-full pl-10"
                required
                minLength={2}
                placeholder="Enter doctor's full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Doctor email */}
          <div className="space-y-2">
            <label
              htmlFor="doctor-email"
              className="text-sm font-medium"
            >
              Email address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              />

              <input
                id="doctor-email"
                aria-label="Doctor email"
                className="field-input w-full pl-10"
                required
                type="email"
                placeholder="doctor@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password with eye icon */}
          <div className="space-y-2">
            <label
              htmlFor="doctor-password"
              className="text-sm font-medium"
            >
              Temporary password
            </label>

            <div className="relative">
              <LockKeyhole
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40"
              />

              <input
                id="doctor-password"
                aria-label="Temporary password"
                className="field-input w-full pl-10 pr-12"
                required
                minLength={8}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-base-content/50 transition-colors hover:bg-base-200 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
                title={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>

            <p className="text-xs leading-relaxed text-muted">
              Use at least 8 characters with uppercase,
              lowercase, a number and a symbol.
            </p>
          </div>

          {/* Create doctor button */}
          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary min-h-12 w-full gap-2 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
                Creating doctor...
              </>
            ) : (
              <>
                <UserPlus size={19} />
                Create Doctor Account
              </>
            )}
          </button>
        </form>

        {/* ASSIGN PATIENT FORM */}
        <form
          className="card-sweety space-y-5 p-5 sm:p-6"
          onSubmit={(e) => {
            e.preventDefault();

            perform(async () => {
              await adminApi.assign(doctorId, patientId);

              setDoctor('');
              setPatient('');
            });
          }}
        >
          {/* Form heading */}
          <div className="flex items-center gap-3 border-b border-base-300 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={22} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Assign patient
              </h2>

              <p className="text-xs text-muted">
                Give a doctor access to a registered patient.
              </p>
            </div>
          </div>

          {/* Select doctor */}
          <div className="space-y-2">
            <label
              htmlFor="assign-doctor"
              className="text-sm font-medium"
            >
              Select doctor
            </label>

            <select
              id="assign-doctor"
              aria-label="Doctor"
              className="field-input w-full"
              required
              value={doctorId}
              onChange={(e) => setDoctor(e.target.value)}
            >
              <option value="">Select doctor</option>

              {data.doctors.map((doctor) => (
                <option
                  key={doctor.id}
                  value={doctor.id}
                >
                  {doctor.name} · {doctor.email}
                </option>
              ))}
            </select>

            {data.doctors.length === 0 && (
              <p className="text-xs text-warning">
                No doctors available. Create a doctor account first.
              </p>
            )}
          </div>

          {/* Select patient */}
          <div className="space-y-2">
            <label
              htmlFor="assign-patient"
              className="text-sm font-medium"
            >
              Select patient
            </label>

            <select
              id="assign-patient"
              aria-label="Patient"
              className="field-input w-full"
              required
              value={patientId}
              onChange={(e) => setPatient(e.target.value)}
            >
              <option value="">Select patient</option>

              {data.patients.map((patient) => (
                <option
                  key={patient.id}
                  value={patient.id}
                >
                  {patient.name} · {patient.email}
                </option>
              ))}
            </select>

            {data.patients.length === 0 && (
              <p className="text-xs text-warning">
                No registered patients available.
              </p>
            )}
          </div>

          {/* Assign button */}
          <button
            type="submit"
            disabled={
              busy ||
              !doctorId ||
              !patientId
            }
            className="btn btn-primary min-h-12 w-full gap-2 rounded-xl text-sm font-semibold shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
                Please wait...
              </>
            ) : (
              <>
                <Users size={19} />
                Assign Patient Access
              </>
            )}
          </button>
        </form>
      </div>

      {/* CURRENT ASSIGNMENTS */}
      <section className="card-sweety p-5 sm:p-6">

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-300 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users size={21} />
            </div>

            <div>
              <h2 className="text-lg font-bold">
                Current assignments
              </h2>

              <p className="text-xs text-muted">
                Manage existing doctor-patient access.
              </p>
            </div>
          </div>

          <span className="badge badge-ghost">
            {data.assignments.length} total
          </span>
        </div>

        {data.assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-base-200 text-base-content/40">
              <Users size={26} />
            </div>

            <h3 className="font-semibold">
              No assignments yet
            </h3>

            <p className="mt-1 text-sm text-muted">
              Assign a patient to a doctor to get started.
            </p>
          </div>
        ) : (
          <div className="mt-3 divide-y divide-base-300">
            {data.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Stethoscope size={19} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {assignment.doctor_name}
                    </p>

                    <p className="text-xs text-muted">
                      Assigned to {assignment.patient_name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-error btn-sm gap-2 rounded-lg"
                  disabled={busy}
                  onClick={() =>
                    perform(() =>
                      adminApi.removeAssignment(assignment.id)
                    )
                  }
                >
                  <UserMinus size={16} />
                  Revoke access
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
