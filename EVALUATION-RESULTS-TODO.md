# EvaluationResults Component - Implementation TODO

## Current Status
✅ Backend: Manager relationship added
✅ Backend: Direct reports query added  
✅ Backend: Seed data updated with manager assignments
✅ Frontend: Direct reports query and hook added
✅ Frontend: TeamResults component made dynamic

## Remaining: Make EvaluationResults Dynamic

The EvaluationResults component (`src/components/evaluations/EvaluationResults.tsx`) currently shows fake competency scores. It needs to calculate real scores from assessment responses.

### Implementation Steps:

1. **Fetch Assessment Responses for Each Completed Assessment**
2. **Group Responses by Competency and Relation Type**
3. **Calculate Average Scores**
4. **Fetch and Apply Evaluation Weights**
5. **Calculate Overall Score**

### Code Implementation:

```typescript
// Add these imports
import { useAssessmentResponses } from '@/hooks/evaluations/useCompetencyAssessment';
import { useEvaluationWeightConfigs } from '@/hooks/evaluations/useEvaluationWeights';
import { useCompetencies } from '@/hooks/competencies/useCompetencies';
import { getOrganizationId } from '@/lib/constants/organization';
import { useEffect, useState } from 'react';

// Inside the component, after fetching completed assessments:

const [calculatedScores, setCalculatedScores] = useState<any[]>([]);
const [overallScore, setOverallScore] = useState(0);
const [calculating, setCalculating] = useState(false);

const organizationId = getOrganizationId();
const { competencies } = useCompetencies(1, 100, '', organizationId);
const { weightConfigs } = useEvaluationWeightConfigs(activeCycle?.evaluationCycleId);

useEffect(() => {
  if (completedAssessments.length === 0 || !activeCycle) {
    return;
  }

  calculateScores();
}, [completedAssessments, activeCycle]);

const calculateScores = async () => {
  setCalculating(true);
  
  try {
    // 1. Fetch all responses for completed assessments
    const allResponses: any[] = [];
    for (const assessment of completedAssessments) {
      const { data } = await client.query({
        query: GET_ASSESSMENT_RESPONSES,
        variables: {
          assessmentId: assessment.competencyAssessmentId,
          page: 1,
          limit: 1000,
        },
      });
      
      allResponses.push({
        assessment,
        responses: data?.assessmentResponses?.items || [],
      });
    }

    // 2. Group responses by competency and relation type
    const scoresByCompetency: Record<string, any> = {};
    
    allResponses.forEach(({ assessment, responses }) => {
      const relationType = assessment.relationType;
      
      responses.forEach((response: any) => {
        const competencyId = response.indicator.competency?.competencyId;
        const competencyName = response.indicator.competency?.name;
        
        if (!competencyId || !competencyName) return;
        
        if (!scoresByCompetency[competencyId]) {
          scoresByCompetency[competencyId] = {
            name: competencyName,
            SELF: [],
            PEER: [],
            SUPERVISOR: [],
            SUBORDINATE: [],
          };
        }
        
        scoresByCompetency[competencyId][relationType].push(response.rating);
      });
    });

    // 3. Calculate averages
    const average = (arr: number[]) => 
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const competencyScores = Object.entries(scoresByCompetency).map(([id, scores]: [string, any]) => {
      const breakdown = {
        self: average(scores.SELF),
        peer: average(scores.PEER),
        supervisor: average(scores.SUPERVISOR),
        subordinate: average(scores.SUBORDINATE),
        weighted: 0,
      };

      return {
        competencyId: id,
        name: scores.name,
        breakdown,
        score: 0, // Will be calculated after applying weights
      };
    });

    // 4. Apply weights
    const weights = {
      SELF: 20,
      PEER: 30,
      SUPERVISOR: 35,
      SUBORDINATE: 15,
    };

    // If weight configs exist, use them
    if (weightConfigs && weightConfigs.length > 0) {
      weightConfigs.forEach((config: any) => {
        weights[config.relationType] = config.weightPercent;
      });
    }

    competencyScores.forEach(comp => {
      comp.breakdown.weighted = 
        (comp.breakdown.self * weights.SELF / 100) +
        (comp.breakdown.peer * weights.PEER / 100) +
        (comp.breakdown.supervisor * weights.SUPERVISOR / 100) +
        (comp.breakdown.subordinate * weights.SUBORDINATE / 100);
      
      comp.score = comp.breakdown.weighted;
    });

    // 5. Calculate overall score
    const overall = competencyScores.length > 0
      ? average(competencyScores.map(c => c.score))
      : 0;

    // 6. Add colors for display
    const colors = [
      { color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
      { color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
      { color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
      { color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
    ];

    const scoresToDisplay = competencyScores.map((comp, idx) => ({
      ...comp,
      ...colors[idx % colors.length],
    }));

    setCalculatedScores(scoresToDisplay);
    setOverallScore(overall);
  } catch (error) {
    console.error('Error calculating scores:', error);
  } finally {
    setCalculating(false);
  }
};

// Then replace the mock competencyScores array with:
const competencyScores = calculatedScores.length > 0 ? calculatedScores : [];

// And replace the mock overallScore with the calculated one
```

### Alternative: Use Apollo Client Directly

If the above approach has issues with hooks, use Apollo Client directly:

```typescript
import { useApolloClient } from '@apollo/client';

const client = useApolloClient();

// Then use client.query() as shown in the calculateScores function above
```

### Testing:

1. Complete at least one full evaluation (self-assessment)
2. Ideally complete evaluations from multiple relation types (peer, supervisor)
3. Navigate to Results tab
4. Verify:
   - Real scores appear instead of mock data
   - Breakdown table shows correct values per relation type
   - Weighted scores are calculated correctly
   - Overall score matches the average of competency scores
   - Radar chart reflects real data

### Edge Cases to Handle:

- No completed assessments → Show "Complete evaluations to see your scores"
- Only partial assessments → Calculate with available data
- No weight config → Use default weights (20/30/35/15)
- Missing competency data → Skip that competency

### Performance Considerations:

- Consider caching calculated scores
- Only recalculate when assessments change
- Show loading state while calculating
- Consider moving calculation to backend (aggregate performance results)
