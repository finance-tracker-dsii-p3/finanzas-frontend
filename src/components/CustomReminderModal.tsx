import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import './CustomReminderModal.css';

interface CustomReminderModalProps {
  reminder?: {
    id: number;
    title: string;
    message: string;
    reminder_date: string;
    reminder_time: string;
  } | null;
  onClose: () => void;
  onSave: (data: {
    title: string;
    message: string;
    reminder_date: string;
    reminder_time: string;
  }) => Promise<void>;
}

const CustomReminderModal: React.FC<CustomReminderModalProps> = ({
  reminder,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title);
      setMessage(reminder.message);
      setReminderDate(reminder.reminder_date);
      setReminderTime(reminder.reminder_time.slice(0, 5));
    } else {

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setReminderDate(tomorrow.toISOString().split('T')[0]);
      setReminderTime('09:00');
    }
  }, [reminder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    if (!message.trim()) {
      setError('El mensaje es requerido');
      return;
    }

    if (!reminderDate) {
      setError('La fecha es requerida');
      return;
    }

    if (!reminderTime) {
      setError('La hora es requerida');
      return;
    }

    const reminderDateTime = new Date(`${reminderDate}T${reminderTime}`);
    const now = new Date();

    if (reminderDateTime <= now) {
      setError('La fecha y hora del recordatorio debe ser futura');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        title: title.trim(),
        message: message.trim(),
        reminder_date: reminderDate,
        reminder_time: `${reminderTime}:00`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el recordatorio');
    } finally {
      setIsSaving(false);
    }
  };

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {reminder ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
          </h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="reminder-form">
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Título *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder="Ej: Reunión con contador"
              required
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Mensaje *
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="form-textarea"
              placeholder="Ej: Llevar documentos del mes"
              required
              rows={4}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="reminder_date" className="form-label">
                <Calendar className="w-4 h-4 inline mr-1" />
                Fecha *
              </label>
              <input
                id="reminder_date"
                type="date"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="form-input"
                min={minDateStr}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="reminder_time" className="form-label">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora *
              </label>
              <input
                id="reminder_time"
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn modal-btn-secondary"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomReminderModal;

