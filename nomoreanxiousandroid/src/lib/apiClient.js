import { API_BASE, hasApiBase } from './config';
import { supabase } from './supabase';

async function getAccessToken() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session) return null;
  return data.session.access_token;
}

export async function apiFetch(path, options = {}) {
  if (!hasApiBase) throw new Error('API_BASE 未配置，无法请求后端');
  const token = await getAccessToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(text || `请求失败: ${resp.status}`);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  }
  return resp.text();
}

export async function chatWithAI(messages) {
  return apiFetch('/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });
}
