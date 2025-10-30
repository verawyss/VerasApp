import { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';
import { User as UserIcon, Lock, Unlock } from 'lucide-react';

export default function UserManagement() {
  const { users, fetchUsers } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    setIsLoading(true);
    try {
      await api.toggleUserStatus(userId, !isActive);
      await fetchUsers();
    } catch (error: any) {
      alert(error.message || 'Fehler beim Aktualisieren');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <UserIcon className="w-6 h-6" />
        Spieler verwalten
      </h2>

      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h3 className="font-medium text-gray-900">{user.name}</h3>
                {user.is_admin && (
                  <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full">
                    Admin
                  </span>
                )}
                {!user.is_active && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                    Blockiert
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-1">{user.email}</p>
            </div>

            <button
              onClick={() => handleToggleStatus(user.id, user.is_active)}
              disabled={isLoading || user.is_admin}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                user.is_active
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {user.is_active ? (
                <>
                  <Lock className="w-4 h-4" />
                  Blockieren
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Aktivieren
                </>
              )}
            </button>
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Keine Spieler vorhanden
          </p>
        )}
      </div>
    </div>
  );
}
