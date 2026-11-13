import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DoctorDashboard from '../pages/DoctorDashboard';
import { doctorApi } from '../api';

vi.mock('../api', () => ({ doctorApi: { patients: vi.fn() } }));

function show() { return render(<MemoryRouter><DoctorDashboard/></MemoryRouter>); }

describe('Doctor dashboard', () => {
  beforeEach(() => vi.clearAllMocks());
  test('shows a clear empty state when no patients are assigned', async () => {
    doctorApi.patients.mockResolvedValue({ patients: [], pagination: { total: 0, totalPages: 1 } });
    show();
    expect(await screen.findByText('No patients assigned')).toBeInTheDocument();
  });
  test('shows assigned patient latest reading and interpretation', async () => {
    doctorApi.patients.mockResolvedValue({ patients: [{ id: 'patient-1', name: 'Sam Lee', email: 'sam@example.com', latest_glucose: 145, latest_date: '2025-06-10', interpretation: { status: 'MODERATE', color: 'orange', reading_type: 'General post-meal' } }], pagination: { total: 1, totalPages: 1 } });
    show();
    expect(await screen.findByText('Sam Lee')).toBeInTheDocument();
    expect(screen.getByText(/Latest reading: 145 mg\/dL/)).toBeInTheDocument();
    expect(screen.getByText('MODERATE')).toBeInTheDocument();
  });
});
