import { gql } from '@apollo/client';

/**
 * Kpis fragment
 * Contains all common fields for kpis
 */
export const KpisFragment = gql`
  fragment KpisFragment on Kpis {
    kpiId
    name
    description
    target
    current
    unit
  }
`;
