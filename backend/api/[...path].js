import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    return user?.is_active ? user : null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const route = `/${path.join('/')}`;

  try {
    if (route === '/health') {
      return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (route === '/auth/login' && req.method === 'POST') {
      const { email, password } = req.body;
      const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
      if (!user || !user.is_active) return res.status(401).json({ error: 'Invalid credentials' });
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign({ userId: user.id, email: user.email, is_admin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '30d' });
      return res.status(200).json({ token, user: { id: user.id, email: user.email, name: user.name, is_admin: user.is_admin }});
    }

    if (route === '/auth/me' && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      return res.status(200).json({ user });
    }

    if (route === '/events' && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { data: events } = await supabase.from('events').select(`*, attendances (id, user_id, status, additional_players, comment, users (id, name), equipment (id, type))`).order('date', { ascending: true });
      const eventsWithTotals = events.map(event => {
        const confirmed = event.attendances.filter(a => a.status === 'confirmed');
        const total = confirmed.reduce((sum, a) => sum + 1 + (a.additional_players || 0), 0);
        return { ...event, total_participants: total };
      });
      return res.status(200).json({ events: eventsWithTotals });
    }

    if (route === '/events' && req.method === 'POST') {
      const user = await verifyToken(req);
      if (!user?.is_admin) return res.status(403).json({ error: 'Admin required' });
      const { title, date, time_from, time_to, location } = req.body;
      const { data: event } = await supabase.from('events').insert([{ title, date, time_from, time_to, location, created_by: user.id }]).select().single();
      return res.status(201).json({ event });
    }

    if (route.startsWith('/events/') && req.method === 'DELETE') {
      const user = await verifyToken(req);
      if (!user?.is_admin) return res.status(403).json({ error: 'Admin required' });
      const eventId = route.split('/')[2];
      await supabase.from('events').delete().eq('id', eventId);
      return res.status(200).json({ message: 'Event deleted' });
    }

    if (route.match(/^\/events\/[^\/]+\/equipment$/) && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const eventId = route.split('/')[2];
      const { data: attendances } = await supabase.from('attendances').select(`id, user_id, users (name), equipment (id, type)`).eq('event_id', eventId).eq('status', 'confirmed');
      const equipment = attendances.reduce((acc, a) => {
        a.equipment.forEach(eq => {
          if (!acc[eq.type]) acc[eq.type] = [];
          acc[eq.type].push({ user_name: a.users.name, user_id: a.user_id });
        });
        return acc;
      }, {});
      return res.status(200).json({ equipment });
    }

    if (route.match(/^\/attendance\/[^\/]+$/) && req.method === 'POST') {
      const user = await verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const eventId = route.split('/')[2];
      const { status, additional_players, comment, equipment } = req.body;
      const { data: existing } = await supabase.from('attendances').select('id').eq('user_id', user.id).eq('event_id', eventId).single();
      let attendanceId;
      if (existing) {
        const { data } = await supabase.from('attendances').update({ status, additional_players: additional_players || 0, comment: comment || null, updated_at: new Date().toISOString() }).eq('id', existing.id).select().single();
        attendanceId = data.id;
        await supabase.from('equipment').delete().eq('attendance_id', attendanceId);
      } else {
        const { data } = await supabase.from('attendances').insert([{ user_id: user.id, event_id: eventId, status, additional_players: additional_players || 0, comment: comment || null }]).select().single();
        attendanceId = data.id;
      }
      if (status === 'confirmed' && equipment?.length > 0) {
        await supabase.from('equipment').insert(equipment.map(type => ({ attendance_id: attendanceId, type })));
      }
      const { data: attendance } = await supabase.from('attendances').select(`*, users (id, name), equipment (id, type)`).eq('id', attendanceId).single();
      return res.status(200).json({ attendance });
    }

    if (route.match(/^\/attendance\/[^\/]+$/) && req.method === 'DELETE') {
      const user = await verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const eventId = route.split('/')[2];
      await supabase.from('attendances').delete().eq('user_id', user.id).eq('event_id', eventId);
      return res.status(200).json({ message: 'Deleted' });
    }

    if (route === '/users' && req.method === 'GET') {
      const user = await verifyToken(req);
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      const { data: users } = await supabase.from('users').select('id, email, name, is_admin, is_active, created_at').order('name');
      return res.status(200).json({ users });
    }

    if (route.match(/^\/users\/[^\/]+\/status$/) && req.method === 'PATCH') {
      const user = await verifyToken(req);
      if (!user?.is_admin) return res.status(403).json({ error: 'Admin required' });
      const userId = route.split('/')[2];
      const { is_active } = req.body;
      const { data } = await supabase.from('users').update({ is_active, updated_at: new Date().toISOString() }).eq('id', userId).select().single();
      return res.status(200).json({ user: data });
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Server error', details: error.message });
  }
}
