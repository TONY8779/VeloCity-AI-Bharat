import { useEffect, useRef, useState, useCallback } from 'react';
import { api } from '../services/api';

export const useAutoSave = (projectId, data, intervalMs = 60000) => {
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const lastData = useRef(null);
  const timeoutRef = useRef(null);

  const save = useCallback(async () => {
    if (!projectId || !data) return;

    const serialized = JSON.stringify(data);
    if (serialized === lastData.current) return;

    setSaveStatus('saving');
    try {
      await api.post(`/api/projects/${projectId}/save-state`, data);
      lastData.current = serialized;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
    }
  }, [projectId, data]);

  useEffect(() => {
    if (!projectId) return;

    timeoutRef.current = setInterval(() => {
      save();
    }, intervalMs);

    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
    };
  }, [projectId, intervalMs, save]);

  return { saveStatus, saveNow: save };
};
