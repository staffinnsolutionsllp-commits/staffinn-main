/**
 * useCampusSlotAvailability
 *
 * Fetches and maintains real-time slot availability for a given institute.
 * Uses API polling only — no new socket connection created here.
 * Real-time updates are handled by passing a refresh trigger from the parent.
 *
 * Returns:
 *   availabilityMap   — { "2026-06-15::10:00 AM – 1:00 PM": { status, ... }, ... }
 *   getSlotStatus     — (date, slot) => 'Confirmed' | 'Tentative' | null
 *   isDateFullyBooked — (date, slotsOffered[]) => boolean
 *   loading           — boolean
 *   refresh           — () => void  (manual re-fetch)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import apiService from '../services/api';

const slotKey = (date, slot) => `${date}::${slot}`;

const useCampusSlotAvailability = (instituteId) => {
  const [availabilityMap, setAvailabilityMap] = useState({});
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  const fetchAvailability = useCallback(async () => {
    if (!instituteId) {
      setAvailabilityMap({});
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.getCampusSlotAvailability(instituteId);
      if (mountedRef.current) {
        setAvailabilityMap((res.success && res.data) ? res.data : {});
      }
    } catch (e) {
      console.error('useCampusSlotAvailability fetch error:', e);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [instituteId]);

  useEffect(() => {
    mountedRef.current = true;
    fetchAvailability();
    return () => { mountedRef.current = false; };
  }, [fetchAvailability]);

  /** Returns 'Confirmed' | 'Tentative' | null */
  const getSlotStatus = useCallback((date, slot) => {
    if (!date || !slot) return null;
    const entry = availabilityMap[slotKey(date, slot)];
    return entry ? entry.status : null;
  }, [availabilityMap]);

  /**
   * Returns true if ALL slotsOffered on a given date are Confirmed-booked.
   * If slotsOffered is empty, returns false (nothing to check).
   */
  const isDateFullyBooked = useCallback((date, slotsOffered = []) => {
    if (!slotsOffered.length) return false;
    return slotsOffered.every(slot => getSlotStatus(date, slot) === 'Confirmed');
  }, [getSlotStatus]);

  return { availabilityMap, getSlotStatus, isDateFullyBooked, loading, refresh: fetchAvailability };
};

export default useCampusSlotAvailability;
