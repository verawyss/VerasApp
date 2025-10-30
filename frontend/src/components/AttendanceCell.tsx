import { Users, MessageSquare } from 'lucide-react';
import { Event, AttendanceWithDetails } from '@/types';

interface AttendanceCellProps {
  event: Event;
  userId: string;
  isCurrentUser: boolean;
}

export default function AttendanceCell({
  event,
  userId,
  isCurrentUser,
}: AttendanceCellProps) {
  const attendance = event.attendances?.find((a) => a.user_id === userId);

  if (!attendance) {
    return (
      <div className="flex items-center justify-center h-12">
        {isCurrentUser && (
          <span className="text-xs text-gray-400">Klicken zum Anmelden</span>
        )}
      </div>
    );
  }

  const bgColor =
    attendance.status === 'confirmed'
      ? 'bg-green-100 border-green-300'
      : 'bg-red-100 border-red-300';

  const textColor =
    attendance.status === 'confirmed' ? 'text-green-800' : 'text-red-800';

  const equipmentIcons: Record<string, string> = {
    ball: '⚽',
    pump: '🔧',
    overboots: '👟',
  };

  return (
    <div
      className={`${bgColor} ${textColor} border rounded-lg p-2 min-h-[3rem] flex flex-col gap-1`}
    >
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {attendance.status === 'confirmed' && attendance.additional_players > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold">
            <Users className="w-3 h-3" />
            +{attendance.additional_players}
          </span>
        )}

        {attendance.equipment && attendance.equipment.length > 0 && (
          <span className="flex items-center gap-1 text-sm">
            {attendance.equipment.map((eq) => (
              <span key={eq.id} title={eq.type}>
                {equipmentIcons[eq.type] || '?'}
              </span>
            ))}
          </span>
        )}

        {attendance.comment && (
          <span className="flex items-center gap-1 text-xs" title={attendance.comment}>
            <MessageSquare className="w-3 h-3" />
          </span>
        )}
      </div>

      {!isCurrentUser && attendance.status === 'confirmed' && (
        <div className="text-xs text-center font-medium">Zugesagt</div>
      )}
      {!isCurrentUser && attendance.status === 'declined' && (
        <div className="text-xs text-center font-medium">Abgesagt</div>
      )}
    </div>
  );
}
