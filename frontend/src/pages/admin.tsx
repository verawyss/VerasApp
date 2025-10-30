import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuthStore, useAppStore } from '@/lib/store';
import { ArrowLeft, Users, Calendar, Package } from 'lucide-react';
import UserManagement from '@/components/admin/UserManagement';
import EventManagement from '@/components/admin/EventManagement';
import EquipmentOverview from '@/components/admin/EquipmentOverview';

type Tab = 'users' | 'events' | 'equipment';

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('events');

  useEffect(() => {
    if (!authLoading && (!user || !user.is_admin)) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user || !user.is_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Wird geladen...</div>
      </div>
    );
  }

  const tabs = [
    { id: 'events' as Tab, label: 'Events', icon: Calendar },
    { id: 'users' as Tab, label: 'Spieler', icon: Users },
    { id: 'equipment' as Tab, label: 'Utensilien', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Bereich
            </h1>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'events' && <EventManagement />}
        {activeTab === 'equipment' && <EquipmentOverview />}
      </main>
    </div>
  );
}
