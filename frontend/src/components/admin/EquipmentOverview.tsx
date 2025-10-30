import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Package, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { EquipmentSummary } from '@/types';

export default function EquipmentOverview() {
  const { events, fetchEvents } = useAppStore();
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [equipment, setEquipment] = useState<EquipmentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  useEffect(() => {
    if (selectedEventId) {
      loadEquipment();
    }
  }, [selectedEventId]);

  const loadEquipment = async () => {
    if (!selectedEventId) return;

    setIsLoading(true);
    try {
      const response = await api.getEventEquipment(selectedEventId);
      setEquipment(response.equipment);
    } catch (error: any) {
      console.error('Fehler beim Laden:', error);
      setEquipment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  const equipmentLabels: Record<string, { icon: string; label: string }> = {
    ball: { icon: '⚽', label: 'Ball' },
    pump: { icon: '🔧', label: 'Pumpe' },
    overboots: { icon: '👟', label: 'Überzieher' },
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6" />
        Utensilien Übersicht
      </h2>

      {/* Event Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event auswählen
        </label>
        <select
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
          className="input"
        >
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title} -{' '}
              {format(new Date(event.date), 'dd.MM.yyyy')}
            </option>
          ))}
        </select>
      </div>

      {/* Equipment Display */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Lädt...</div>
      ) : !equipment || Object.keys(equipment).length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Keine Utensilien für dieses Event
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(equipment).map(([type, users]) => {
            const config = equipmentLabels[type];
            if (!config || !users || users.length === 0) return null;

            return (
              <div key={type} className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  {config.label}
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                    {users.length}
                  </span>
                </h3>
                <ul className="space-y-2">
                  {users.map((user, index) => (
                    <li
                      key={`${user.user_id}-${index}`}
                      className="flex items-center gap-2 text-gray-700"
                    >
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                      {user.user_name}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
