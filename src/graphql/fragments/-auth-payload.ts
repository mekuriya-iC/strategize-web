import { gql } from '@apollo/client';

export const AUTHPAYLOAD_FRAGMENT = gql`
  fragment AuthPayloadFields on AuthPayload {
    # TODO: Add fields from your schema
    # Example fields:
    # id
    # name
    # createdAt
    # updatedAt
  }
`;
