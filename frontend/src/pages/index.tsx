import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useAppStore } from '@/lib/store';
import { format } from 'date-fns';
import { Calendar, MapPin, Clock, Users, LogOut, Settings } from 'lucide-react';
import AttendanceCell from '@/components/AttendanceCell';
import AttendanceModal from '@/components/AttendanceModal';
import { Event } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, logout } = useAuthStore();
  const { events, users, fetchEvents, fetchUsers } = useAppStore();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
      fetchUsers();
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCellClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
    fetchEvents(); // Refresh data after attendance change
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Wird geladen...</div>
      </div>
    );
  }

  const activeUsers = users.filter((u) => u.is_active);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              Sports Attendance
            </h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} {user.is_admin && '(Admin)'}
              </span>
              {user.is_admin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
                  title="Admin Bereich"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="Abmelden"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Keine Events vorhanden
            </h3>
            <p className="text-gray-600">
              {user.is_admin
                ? 'Erstelle dein erstes Event im Admin-Bereich'
                : 'Es wurden noch keine Events erstellt'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-300">
                        Spieler
                      </th>
                      {events.map((event) => (
                        <th
                          key={event.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]"
                        >
                          <div className="space-y-1">
                            <div className="font-semibold text-gray-900">
                              {event.title}
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(event.date), 'dd.MM.yyyy')}
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <Clock className="w-3 h-3" />
                              {event.time_from} - {event.time_to}
                            </div>
                            <div className="flex items-center gap-1 text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </div>
                            <div className="flex items-center gap-1 text-primary-600 font-semibold">
                              <Users className="w-3 h-3" />
                              {event.total_participants || 0} Teilnehmer
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {activeUsers.map((playerUser) => (
                      <tr key={playerUser.id} className="hover:bg-gray-50">
                        <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-300">
                          {playerUser.name}
                        </td>
                        {events.map((event) => (
                          <td
                            key={`${playerUser.id}-${event.id}`}
                            className="px-6 py-4 whitespace-nowrap text-sm cursor-pointer hover:bg-gray-100"
                            onClick={() => {
                              if (playerUser.id === user.id) {
                                handleCellClick(event);
                              }
                            }}
                          >
                            <AttendanceCell
                              event={event}
                              userId={playerUser.id}
                              isCurrentUser={playerUser.id === user.id}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Attendance Modal */}
      {isModalOpen && selectedEvent && (
        <AttendanceModal
          event={selectedEvent}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}
