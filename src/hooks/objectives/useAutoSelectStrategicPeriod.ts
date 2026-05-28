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
 * Priority: Active status period > Current period by date > First ANNUAL period > First available period
 */
export const useAutoSelectStrategicPeriod = () => {
  const { strategicPeriods, loading } = useStrategicPeriods();
  const { selectedPeriod, setSelectedPeriod } = useStrategicPeriodStore();

  useEffect(() => {
    // Don't auto-select if still loading or no periods available
    if (loading || strategicPeriods.length === 0) {
      return;
    }

    // Check if the currently selected period is still valid
    const isSelectedPeriodValid = selectedPeriod && strategicPeriods.some(
      p => p.strategicPeriodId === selectedPeriod.strategicPeriodId
    );

    // If there's a valid selected period, keep it
    if (isSelectedPeriodValid) {
      return;
    }

    // If no valid period is selected, auto-select one
    // Priority 1: Find period with ACTIVE status
    const activePeriod = strategicPeriods.find(p => 
      p.status?.toUpperCase() === 'ACTIVE'
    );
    
    // Priority 2: Find the current period by date
    const currentPeriod = strategicPeriods.find(isCurrentPeriod);
    
    // Priority 3: Find the first ANNUAL period (best for corporate objectives)
    const firstAnnualPeriod = strategicPeriods.find(p => 
      p.periodType?.toUpperCase() === 'ANNUAL'
    );
    
    // Priority 4: First period in the list
    const periodToSelect = activePeriod || currentPeriod || firstAnnualPeriod || strategicPeriods[0];
    
    if (periodToSelect) {
      console.log('🎯 Auto-selecting strategic period:', {
        name: periodToSelect.name,
        id: periodToSelect.strategicPeriodId,
        status: periodToSelect.status,
        reason: activePeriod ? 'active status' : 
                currentPeriod ? 'current by date' : 
                firstAnnualPeriod ? 'first annual' : 
                'first available'
      });
      setSelectedPeriod(periodToSelect);
    }
  }, [strategicPeriods, loading, selectedPeriod, setSelectedPeriod]);

  return {
    loading,
    selectedPeriod,
  };
};
