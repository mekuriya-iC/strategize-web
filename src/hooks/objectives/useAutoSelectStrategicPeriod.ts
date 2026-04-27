/**
 * Hook to automatically select the current strategic period
 * Used for non-admin users who should be redirected directly to dashboard
 */
import { useEffect } from 'react';
import { useStrategicPeriods } from './useStrategicPeriods';
import { useStrategicPeriodStore } from '@/stores';
import { StrategicPeriod } from '@/types/graphql';

/**
 * Determines if a strategic period is current based on today's date
 */
const isCurrentPeriod = (period: StrategicPeriod): boolean => {
  const now = new Date();
  const startDate = new Date(period.startDate);
  const endDate = new Date(period.endDate);
  
  return now >= startDate && now <= endDate;
};

/**
 * Auto-selects the current strategic period if none is selected
 * Priority: Current period > First available period
 */
export const useAutoSelectStrategicPeriod = () => {
  const { strategicPeriods, loading } = useStrategicPeriods();
  const { selectedPeriod, setSelectedPeriod } = useStrategicPeriodStore();

  useEffect(() => {
    // Don't auto-select if already selected or still loading
    if (selectedPeriod || loading || strategicPeriods.length === 0) {
      return;
    }

    // Try to find the current period
    const currentPeriod = strategicPeriods.find(isCurrentPeriod);
    
    // Select current period if found, otherwise select the first one
    const periodToSelect = currentPeriod || strategicPeriods[0];
    
    if (periodToSelect) {
      setSelectedPeriod(periodToSelect);
    }
  }, [strategicPeriods, loading, selectedPeriod, setSelectedPeriod]);

  return {
    loading,
    selectedPeriod,
  };
};
