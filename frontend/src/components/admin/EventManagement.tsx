import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Calendar, Plus, Trash2, Edit2, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function EventManagement() {
  const { events, fetchEvents } = useAppStore();
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time_from: '',
    time_to: '',
    location: '',
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.createEvent(formData);
      await fetchEvents();
      setIsCreating(false);
      setFormData({
        title: '',
        date: '',
        time_from: '',
        time_to: '',
        location: '',
      });
    } catch (error: any) {
      alert(error.message || 'Fehler beim Erstellen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Event wirklich löschen? Alle Anmeldungen werden gelöscht.')) {
      return;
    }

    setIsLoading(true);
    try {
      await api.deleteEvent(eventId);
      await fetchEvents();
    } catch (error: any) {
      alert(error.message || 'Fehler beim Löschen');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Events verwalten
        </h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Neues Event
        </button>
      </div>

      {/* Create Event Form */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titel
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="z.B. Fussballtraining"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datum
              </label>
              <input
                type="date"
                required
                className="input"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ort
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="z.B. Sportplatz Mitte"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Von (Uhrzeit)
              </label>
              <input
                type="time"
                required
                className="input"
                value={formData.time_from}
                onChange={(e) =>
                  setFormData({ ...formData, time_from: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bis (Uhrzeit)
              </label>
              <input
                type="time"
                required
                className="input"
                value={formData.time_to}
                onChange={(e) =>
                  setFormData({ ...formData, time_to: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Erstellen...' : 'Event erstellen'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="btn-secondary"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 text-lg mb-2">
                {event.title}
              </h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(event.date), 'dd.MM.yyyy')}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {event.time_from} - {event.time_to}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {event.location}
                </div>
              </div>
              <div className="mt-2">
                <span className="px-3 py-1 text-sm font-medium bg-primary-100 text-primary-800 rounded-full">
                  {event.total_participants || 0} Teilnehmer
                </span>
              </div>
            </div>

            <button
              onClick={() => handleDelete(event.id)}
              disabled={isLoading}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Event löschen"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {events.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Noch keine Events erstellt
          </p>
        )}
      </div>
    </div>
  );
}
