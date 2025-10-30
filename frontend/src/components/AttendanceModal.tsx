import { useState, useEffect } from 'react';
import { X, Users, MessageSquare } from 'lucide-react';
import { Event } from '@/types';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

interface AttendanceModalProps {
  event: Event;
  onClose: () => void;
}

export default function AttendanceModal({
  event,
  onClose,
}: AttendanceModalProps) {
  const user = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<'confirmed' | 'declined'>('confirmed');
  const [additionalPlayers, setAdditionalPlayers] = useState(0);
  const [comment, setComment] = useState('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load existing attendance data
    const attendance = event.attendances?.find((a) => a.user_id === user?.id);
    if (attendance) {
      setStatus(attendance.status);
      setAdditionalPlayers(attendance.additional_players || 0);
      setComment(attendance.comment || '');
      setEquipment(attendance.equipment?.map((e) => e.type) || []);
    }
  }, [event, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.createOrUpdateAttendance(event.id, {
        status,
        additional_players: status === 'confirmed' ? additionalPlayers : 0,
        comment: comment.trim() || null,
        equipment: status === 'confirmed' ? equipment : [],
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Möchtest du deine Anmeldung wirklich löschen?')) return;

    setIsLoading(true);
    try {
      await api.deleteAttendance(event.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Fehler beim Löschen');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEquipment = (type: string) => {
    setEquipment((prev) =>
      prev.includes(type) ? prev.filter((e) => e !== type) : [...prev, type]
    );
  };

  const hasAttendance = event.attendances?.some((a) => a.user_id === user?.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {event.title}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setStatus('confirmed')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      status === 'confirmed'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">✅</div>
                      <div className="text-sm font-medium">Zusage</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('declined')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      status === 'declined'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-1">❌</div>
                      <div className="text-sm font-medium">Absage</div>
                    </div>
                  </button>
                </div>
              </div>

              {status === 'confirmed' && (
                <>
                  {/* Additional Players */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Zusätzliche Spieler
                    </label>
                    <select
                      value={additionalPlayers}
                      onChange={(e) =>
                        setAdditionalPlayers(Number(e.target.value))
                      }
                      className="input"
                    >
                      <option value={0}>Nur ich</option>
                      <option value={1}>+1 Person</option>
                      <option value={2}>+2 Personen</option>
                      <option value={3}>+3 Personen</option>
                    </select>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Was bringst du mit?
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      <button
                        type="button"
                        onClick={() => toggleEquipment('ball')}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          equipment.includes('ball')
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">⚽</div>
                          <div className="text-xs font-medium">Ball</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEquipment('pump')}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          equipment.includes('pump')
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">🔧</div>
                          <div className="text-xs font-medium">Pumpe</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleEquipment('overboots')}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          equipment.includes('overboots')
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-center">
                          <div className="text-2xl mb-1">👟</div>
                          <div className="text-xs font-medium">Überzieher</div>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Comment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 inline mr-1" />
                  Kommentar (optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Notizen oder Hinweise..."
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Speichern...' : 'Speichern'}
                </button>
                {hasAttendance && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="btn-danger disabled:opacity-50"
                  >
                    Löschen
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
