import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// CORS Headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json'
};

// Auth Helper
async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
    return user;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).json({});
  }

  const { path } = req.query;
  const route = `/${path.join('/')}`;

  try {
    // ============ AUTH ROUTES ============
    
    // POST /api/auth/login
    if (route === '/auth/login' && req.method === 'POST') {
      const { email, password } = req.body;
      
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!user || !user.is_active) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, is_admin: user.is_admin },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          is_admin: user.is_admin
        }
      });
    }

    // GET /api/auth/me
    if (route === '/auth/me' && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.status(200).json({ user });
    }

    // ============ EVENTS ROUTES ============
    
    // GET /api/events
    if (route === '/events' && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: events } = await supabase
        .from('events')
        .select(`
          *,
          attendances (
            id,
            user_id,
            status,
            additional_players,
            comment,
            users (id, name),
            equipment (id, type)
          )
        `)
        .order('date', { ascending: true });

      const eventsWithTotals = events.map(event => {
        const confirmedAttendances = event.attendances.filter(a => a.status === 'confirmed');
        const totalParticipants = confirmedAttendances.reduce(
          (sum, a) => sum + 1 + (a.additional_players || 0),
          0
        );
        return { ...event, total_participants: totalParticipants };
      });

      return res.status(200).json({ events: eventsWithTotals });
    }

    // POST /api/events
    if (route === '/events' && req.method === 'POST') {
      const user = await verifyToken(req);
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { title, date, time_from, time_to, location } = req.body;

      const { data: event } = await supabase
        .from('events')
        .insert([{ title, date, time_from, time_to, location, created_by: user.id }])
        .select()
        .single();

      return res.status(201).json({ event });
    }

    // DELETE /api/events/:id
    if (route.startsWith('/events/') && req.method === 'DELETE') {
      const user = await verifyToken(req);
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const eventId = route.split('/')[2];
      await supabase.from('events').delete().eq('id', eventId);

      return res.status(200).json({ message: 'Event deleted' });
    }

    // GET /api/events/:id/equipment
    if (route.match(/^\/events\/[^\/]+\/equipment$/) && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const eventId = route.split('/')[2];
      
      const { data: attendances } = await supabase
        .from('attendances')
        .select(`
          id,
          user_id,
          users (name),
          equipment (id, type)
        `)
        .eq('event_id', eventId)
        .eq('status', 'confirmed');

      const equipmentSummary = attendances.reduce((acc, attendance) => {
        attendance.equipment.forEach(eq => {
          if (!acc[eq.type]) acc[eq.type] = [];
          acc[eq.type].push({
            user_name: attendance.users.name,
            user_id: attendance.user_id
          });
        });
        return acc;
      }, {});

      return res.status(200).json({ equipment: equipmentSummary });
    }

    // ============ ATTENDANCE ROUTES ============
    
    // POST /api/attendance/:eventId
    if (route.match(/^\/attendance\/[^\/]+$/) && req.method === 'POST') {
      const user = await verifyToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const eventId = route.split('/')[2];
      const { status, additional_players, comment, equipment } = req.body;

      const { data: existingAttendance } = await supabase
        .from('attendances')
        .select('id')
        .eq('user_id', user.id)
        .eq('event_id', eventId)
        .single();

      let attendanceId;

      if (existingAttendance) {
        const { data: updatedAttendance } = await supabase
          .from('attendances')
          .update({
            status,
            additional_players: additional_players || 0,
            comment: comment || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAttendance.id)
          .select()
          .single();

        attendanceId = updatedAttendance.id;
        await supabase.from('equipment').delete().eq('attendance_id', attendanceId);
      } else {
        const { data: newAttendance } = await supabase
          .from('attendances')
          .insert([{
            user_id: user.id,
            event_id: eventId,
            status,
            additional_players: additional_players || 0,
            comment: comment || null
          }])
          .select()
          .single();

        attendanceId = newAttendance.id;
      }

      if (status === 'confirmed' && equipment && equipment.length > 0) {
        const equipmentData = equipment.map(type => ({
          attendance_id: attendanceId,
          type
        }));
        await supabase.from('equipment').insert(equipmentData);
      }

      const { data: attendance } = await supabase
        .from('attendances')
        .select(`
          *,
          users (id, name),
          equipment (id, type)
        `)
        .eq('id', attendanceId)
        .single();

      return res.status(200).json({ attendance });
    }

    // DELETE /api/attendance/:eventId
    if (route.match(/^\/attendance\/[^\/]+$/) && req.method === 'DELETE') {
      const user = await verifyToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const eventId = route.split('/')[2];
      await supabase
        .from('attendances')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);

      return res.status(200).json({ message: 'Attendance deleted' });
    }

    // ============ USERS ROUTES ============
    
    // GET /api/users
    if (route === '/users' && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { data: users } = await supabase
        .from('users')
        .select('id, email, name, is_admin, is_active, created_at')
        .order('name');

      return res.status(200).json({ users });
    }

    // PATCH /api/users/:userId/status
    if (route.match(/^\/users\/[^\/]+\/status$/) && req.method === 'PATCH') {
      const user = await verifyToken(req);
      if (!user || !user.is_admin) {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const userId = route.split('/')[2];
      const { is_active } = req.body;

      const { data: updatedUser } = await supabase
        .from('users')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      return res.status(200).json({ user: updatedUser });
    }

    // Health check
    if (route === '/health') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
