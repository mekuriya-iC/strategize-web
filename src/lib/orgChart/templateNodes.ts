import type { OrgChartNodeInput } from '@/hooks/orgChart/useOrgChartMutations';

// Colors match the design system from docs/COMPANY_STRUCTURE.md
const C = { corporate: '#5B5BF7', division: '#8B5CF6', department: '#EC4899', unit: '#F43F5E', employee: '#EF4444' };

function node(
  id: string,
  name: string,
  subtitle: string,
  color: string,
  level: number,
  parentId: string | undefined,
  children: OrgChartNodeInput[],
): OrgChartNodeInput {
  return { id, name, subtitle, color, level, parentId, children };
}

// ── Classic Top-Down ─────────────────────────────────────────────────────────
// Corporate → 2 Divisions → Departments → Teams
export const classicTopDown: OrgChartNodeInput = node(
  'tpl-root', 'Corporate', 'CEO', C.corporate, 0, undefined, [
    node('tpl-div1', 'Division 1', 'Director', C.division, 1, 'tpl-root', [
      node('tpl-dept1', 'Department A', 'Manager', C.department, 2, 'tpl-div1', [
        node('tpl-team1', 'Team 1', 'Team Lead', C.unit, 3, 'tpl-dept1', []),
        node('tpl-team2', 'Team 2', 'Team Lead', C.unit, 3, 'tpl-dept1', []),
      ]),
      node('tpl-dept2', 'Department B', 'Manager', C.department, 2, 'tpl-div1', []),
    ]),
    node('tpl-div2', 'Division 2', 'Director', C.division, 1, 'tpl-root', [
      node('tpl-dept3', 'Department C', 'Manager', C.department, 2, 'tpl-div2', []),
      node('tpl-dept4', 'Department D', 'Manager', C.department, 2, 'tpl-div2', []),
    ]),
  ]
);

// ── Multi-Department ─────────────────────────────────────────────────────────
// Corporate → Strategy / Operations / Finance / HR / Sales
export const multiDepartment: OrgChartNodeInput = node(
  'tpl-root', 'Corporate', 'CEO', C.corporate, 0, undefined, [
    node('tpl-strategy',   'Strategy',   'Director', C.division,   1, 'tpl-root', [
      node('tpl-planning', 'Planning',   'Manager',  C.department, 2, 'tpl-strategy',   []),
    ]),
    node('tpl-operations', 'Operations', 'Director', C.division,   1, 'tpl-root', [
      node('tpl-ops-a',    'Ops Team A', 'Manager',  C.department, 2, 'tpl-operations', []),
      node('tpl-ops-b',    'Ops Team B', 'Manager',  C.department, 2, 'tpl-operations', []),
    ]),
    node('tpl-finance',    'Finance',    'Director', C.division,   1, 'tpl-root', [
      node('tpl-accounting','Accounting','Manager',  C.department, 2, 'tpl-finance',    []),
    ]),
    node('tpl-hr',         'Human Resources','Director',C.division,1, 'tpl-root', [
      node('tpl-talent',   'Talent Acquisition','Manager',C.department,2,'tpl-hr',     []),
    ]),
    node('tpl-sales',      'Sales & Marketing','Director',C.division,1,'tpl-root', [
      node('tpl-sales-a',  'Sales',      'Manager',  C.department, 2, 'tpl-sales',     []),
      node('tpl-marketing','Marketing',  'Manager',  C.department, 2, 'tpl-sales',     []),
    ]),
  ]
);

// ── Matrix Team ──────────────────────────────────────────────────────────────
// Corporate → Functional Areas + Cross-functional project teams
export const matrixTeam: OrgChartNodeInput = node(
  'tpl-root', 'Corporate', 'CEO', C.corporate, 0, undefined, [
    node('tpl-eng',     'Engineering',  'VP Engineering', C.division,   1, 'tpl-root', [
      node('tpl-fe',    'Frontend',     'Manager',        C.department, 2, 'tpl-eng',  []),
      node('tpl-be',    'Backend',      'Manager',        C.department, 2, 'tpl-eng',  []),
      node('tpl-qa',    'QA',           'Manager',        C.department, 2, 'tpl-eng',  []),
    ]),
    node('tpl-product', 'Product',      'VP Product',     C.division,   1, 'tpl-root', [
      node('tpl-pm',    'Product Mgmt', 'Manager',        C.department, 2, 'tpl-product', []),
      node('tpl-design','Design',       'Manager',        C.department, 2, 'tpl-product', []),
    ]),
    node('tpl-biz',     'Business',     'VP Business',    C.division,   1, 'tpl-root', [
      node('tpl-sales2','Sales',        'Manager',        C.department, 2, 'tpl-biz',  []),
      node('tpl-cs',    'Customer Success','Manager',     C.department, 2, 'tpl-biz',  []),
    ]),
  ]
);

export const TEMPLATE_NODES: Record<string, OrgChartNodeInput> = {
  'classic-top-down': classicTopDown,
  'multi-department':  multiDepartment,
  'matrix-team':       matrixTeam,
};
