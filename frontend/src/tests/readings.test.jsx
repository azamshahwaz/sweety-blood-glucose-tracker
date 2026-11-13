import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import toast from 'react-hot-toast';
import { apiError, renderWithProviders } from './testUtils';
import ReadingFormModal from '../components/readings/ReadingFormModal';
import ReadingsTable from '../components/readings/ReadingsTable';
import Readings from '../pages/Readings';
import { readingsApi, authApi } from '../api';
import { todayLocal } from '../utils/date';
import { validateReading } from '../utils/validation';

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));
vi.mock('../api', () => ({
  authApi: { me: vi.fn() },
  readingsApi: { list: vi.fn(), interpret: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}));

const listOf = (readings) => ({ data: { readings, pagination: { page: 1, limit: 10, total: readings.length, totalPages: 1 } } });
const reading = (over = {}) => ({ id: 'r1', reading_date: '2025-06-10', time_slot: 'AFTER_LUNCH', glucose_value: 128, ...over });

beforeEach(() => {
  vi.clearAllMocks();
  readingsApi.list.mockResolvedValue(listOf([]));
  readingsApi.interpret.mockResolvedValue({ data: { interpretation: {
    status: 'NORMAL', label: 'Normal', color: 'green', emoji: '😊', icon: 'CheckCircle',
    reading_type: 'Fasting', reference_range: '70–99 mg/dL', explanation: 'Within the general range.',
    disclaimer: 'Educational reference.', range_scale: { min: 40, max: 300, unit: 'mg/dL', segments: [] },
  } } });
  authApi.me.mockRejectedValue(apiError('no', 401));
});

describe('ReadingFormModal', () => {
  const setup = (props = {}) => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    render(<ReadingFormModal open onClose={onClose} onSaved={onSaved} {...props} />);
    return { onClose, onSaved };
  };
  const submit = () => userEvent.click(screen.getByRole('button', { name: /add reading|update/i }));

  test('defaults the date to today and disables future dates', async () => {
    setup();
    await waitFor(() => expect(readingsApi.list).toHaveBeenCalled());
    const date = screen.getByLabelText('Date');
    expect(date).toHaveValue(todayLocal());
    expect(date).toHaveAttribute('max', todayLocal());
  });

  test('requires a glucose value', async () => {
    setup();
    await submit();
    expect(screen.getByText('Please enter a glucose value.')).toBeInTheDocument();
    expect(readingsApi.create).not.toHaveBeenCalled();
  });

  test.each([['39'], ['601'], ['120.5']])('rejects invalid value %s', async (value) => {
    setup();
    await userEvent.type(screen.getByLabelText(/glucose value/i), value);
    await submit();
    expect(screen.getAllByText('Value must be a whole number between 40 and 600 mg/dl.').length).toBeGreaterThan(0);
    expect(readingsApi.create).not.toHaveBeenCalled();
  });

  test('rejects a future date', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2999-01-01' } });
    await userEvent.type(screen.getByLabelText(/glucose value/i), '110');
    await submit();
    expect(screen.getByText('Date cannot be in the future.')).toBeInTheDocument();
  });

  test('prevents adding a slot that is already recorded and shows slot status', async () => {
    readingsApi.list.mockResolvedValue(listOf([reading({ reading_date: todayLocal() })]));
    setup();
    await waitFor(() => expect(screen.getByTestId('slot-AFTER_LUNCH')).toHaveAttribute('data-taken', 'true'));
    expect(screen.getByTestId('slot-MORNING_FASTING')).toHaveAttribute('data-taken', 'false');
    await userEvent.selectOptions(screen.getByLabelText('Time Slot'), 'AFTER_LUNCH');
    await userEvent.type(screen.getByLabelText(/glucose value/i), '130');
    await submit();
    expect(screen.getByText('You already have an After lunch reading for this date.')).toBeInTheDocument();
    expect(readingsApi.create).not.toHaveBeenCalled();
  });

  test('submits a valid reading, shows a toast and notifies the parent', async () => {
    readingsApi.create.mockResolvedValue({ data: {} });
    const { onSaved, onClose } = setup();
    await userEvent.selectOptions(screen.getByLabelText('Time Slot'), 'AFTER_BREAKFAST');
    await userEvent.type(screen.getByLabelText(/glucose value/i), '110');
    await submit();
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(await screen.findByRole('status')).toHaveTextContent('Reading saved successfully');
    expect(screen.getByText('Normal')).toBeInTheDocument();
    expect(readingsApi.create).toHaveBeenCalledWith({ reading_date: todayLocal(), time_slot: 'AFTER_BREAKFAST', glucose_value: 110 });
    expect(toast.success).toHaveBeenCalledWith('Reading added successfully');
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });

  test('shows a slot-based interpretation without timing confirmation', async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/glucose value/i), '110');
    expect(await screen.findByText('Normal')).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm at least 8 hours/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/minutes after meal started/i)).not.toBeInTheDocument();
    expect(readingsApi.interpret).toHaveBeenCalledWith({
      glucose_value: 110,
      time_slot: 'MORNING_FASTING',
    });
  });

  test('submits a reading without obsolete timing fields', async () => {
    readingsApi.create.mockResolvedValue({ data: {} });
    setup();
    await userEvent.type(screen.getByLabelText(/glucose value/i), '90');
    await submit();
    await waitFor(() => expect(readingsApi.create).toHaveBeenCalledWith({
      reading_date: todayLocal(), time_slot: 'MORNING_FASTING', glucose_value: 90,
    }));
  });

  test('shows a loading state and blocks duplicate submissions', async () => {
    let resolve;
    readingsApi.create.mockReturnValue(new Promise((r) => { resolve = r; }));
    setup();
    await userEvent.type(screen.getByLabelText(/glucose value/i), '110');
    await submit();
    const busy = screen.getByRole('button', { name: /add reading/i });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(busy);
    expect(readingsApi.create).toHaveBeenCalledTimes(1);
    resolve({ data: {} });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  test('displays the backend error message', async () => {
    readingsApi.create.mockRejectedValue(apiError('You can add only 4 readings per day.', 409, { reading_date: 'You can add only 4 readings per day.' }));
    setup();
    await userEvent.type(screen.getByLabelText(/glucose value/i), '110');
    await submit();
    expect(await screen.findByText('You can add only 4 readings per day.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });

  test('edit mode pre-fills the form and calls update', async () => {
    readingsApi.update.mockResolvedValue({ data: {} });
    const { onSaved, onClose } = setup({ reading: reading() });
    expect(screen.getByRole('heading', { name: 'Edit Reading' })).toBeInTheDocument();
    expect(screen.getByLabelText(/glucose value/i)).toHaveValue(128);
    expect(screen.getByLabelText('Time Slot')).toBeEnabled();
    await userEvent.selectOptions(screen.getByLabelText('Time Slot'), 'AFTER_BREAKFAST');
    await userEvent.clear(screen.getByLabelText(/glucose value/i));
    await userEvent.type(screen.getByLabelText(/glucose value/i), '140');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(readingsApi.update).toHaveBeenCalledWith('r1', { reading_date: '2025-06-10', time_slot: 'AFTER_BREAKFAST', glucose_value: 140 });
    expect(readingsApi.interpret).toHaveBeenCalledWith({ glucose_value: 140, time_slot: 'AFTER_BREAKFAST' });
    expect(await screen.findByRole('status')).toHaveTextContent('Reading saved successfully');
    expect(screen.getByText('Normal')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('Readings table & page states', () => {
  test('renders an empty state when there are no readings', () => {
    render(<ReadingsTable readings={[]} />);
    expect(screen.getByTestId('empty-state')).toHaveTextContent('No readings found');
  });

  test('renders rows with edit and delete actions', () => {
    render(<ReadingsTable readings={[reading()]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('10 Jun 2025')).toBeInTheDocument();
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit reading' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete reading' })).toBeInTheDocument();
  });

  test('page shows loading, then empty state', async () => {
    renderWithProviders(<Readings />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading readings');
    expect(await screen.findByTestId('empty-state')).toBeInTheDocument();
  });

  test('page shows an error with retry', async () => {
    readingsApi.list.mockRejectedValueOnce(apiError('Server exploded', 500));
    renderWithProviders(<Readings />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server exploded');
    readingsApi.list.mockResolvedValue(listOf([reading()]));
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('128')).toBeInTheDocument();
  });

  test('delete asks for confirmation and then removes the reading', async () => {
    readingsApi.list.mockResolvedValue(listOf([reading()]));
    readingsApi.remove.mockResolvedValue({});
    renderWithProviders(<Readings />);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete reading' }));
    expect(screen.getByRole('dialog', { name: /delete reading/i })).toBeInTheDocument();
    expect(readingsApi.remove).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(readingsApi.remove).toHaveBeenCalledWith('r1'));
    expect(toast.success).toHaveBeenCalledWith('Reading deleted successfully');
  });
});

describe('validateReading', () => {
  const ok = { date: '2025-06-10', slot: 'AFTER_LUNCH', value: '120' };
  test('accepts a valid reading', () => expect(validateReading(ok, [])).toEqual({}));
  test('enforces the 4-readings-per-day rule', () => {
    const all = ['MORNING_FASTING', 'AFTER_BREAKFAST', 'AFTER_LUNCH', 'AFTER_DINNER'];
    expect(validateReading(ok, all).date).toBe('You can add only 4 readings per day.');
  });
  test('uses the correct article in the duplicate message', () => {
    expect(validateReading({ ...ok, slot: 'MORNING_FASTING' }, ['MORNING_FASTING']).slot).toBe('You already have a Morning fasting reading for this date.');
  });
});
