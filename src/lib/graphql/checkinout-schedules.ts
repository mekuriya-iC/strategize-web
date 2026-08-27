import { gql } from "@apollo/client";

// Schedule queries intentionally return session metadata only. Tasks remain behind
// the existing task query so supervisors cannot access private Draft task plans.
const SCHEDULE_SESSION_FIELDS = gql`
  fragment CheckinoutScheduleSessionFields on CheckinoutSession {
    checkinoutSessionId
    title
    weekStartDate
    weekEndDate
    overallStatus
    isLocked
    checkinSubmittedAt
    checkoutSubmittedAt
    overallRating
    supervisorComment
    supervisorReviewAt
    createdAt
    updatedAt
    employee { employeeId fullName email title role }
    supervisor { employeeId fullName email title role }
    strategicPeriod { strategicPeriodId name startDate endDate }
  }
`;

const SCHEDULE_WEEK_PERIOD_FIELDS = gql`
  fragment CheckinoutScheduleWeekPeriodFields on CheckinoutScheduleWeek {
    annualStrategicPeriodId
    quarterlyStrategicPeriodId
    monthlyStrategicPeriodId
    fiscalYearStartYear
    fiscalYearLabel
    fiscalQuarterNumber
    calendarYear
    calendarMonth
  }
`;

const SCHEDULE_WEEK_FIELDS = gql`
  fragment CheckinoutScheduleWeekFields on CheckinoutScheduleWeek {
    scheduleWeekId
    name
    sequence
    quarterNumber
    monthNumber
    weekOfMonth
    weekStartDate
    weekEndDate
    status
    activatedAt
    ...CheckinoutScheduleWeekPeriodFields
    sessions { ...CheckinoutScheduleSessionFields }
    coverages {
      scheduleWeekCoverageId
      coverageType
      employee { employeeId fullName email title role }
      existingSession { ...CheckinoutScheduleSessionFields }
    }
  }
  ${SCHEDULE_SESSION_FIELDS}
  ${SCHEDULE_WEEK_PERIOD_FIELDS}
`;

const SCHEDULE_FIELDS = gql`
  fragment CheckinoutScheduleFields on CheckinoutSchedule {
    scheduleId
    title
    rangeStartDate
    rangeEndDate
    status
    strategicPlan { strategicPlanId title startDate endDate }
    participants { employee { employeeId fullName email title role } }
    weeks { ...CheckinoutScheduleWeekFields }
  }
  ${SCHEDULE_WEEK_FIELDS}
`;

export const PREVIEW_CHECKINOUT_SCHEDULE = gql`
  query PreviewCheckinoutSchedule($input: CheckinoutScheduleInput!) {
    previewCheckinoutSchedule(input: $input) {
      windowCount
      sessionCount
      missingCount
      adoptableCount
      legacyCoveredCount
      partialOverlapCount
      periodMismatchCount
      conflictCount
      weeks {
        name
        sequence
        quarterNumber
        monthNumber
        weekOfMonth
        weekStartDate
        weekEndDate
        annualStrategicPeriodId
        quarterlyStrategicPeriodId
        monthlyStrategicPeriodId
        fiscalYearStartYear
        fiscalYearLabel
        fiscalQuarterNumber
        calendarYear
        calendarMonth
        sessions {
          employeeId
          disposition
          existingSessionId
          existingWeekStartDate
          existingWeekEndDate
        }
      }
    }
  }
`;

export const GENERATE_CHECKINOUT_SCHEDULE = gql`
  mutation GenerateCheckinoutSchedule($input: CheckinoutScheduleInput!) {
    generateCheckinoutSchedule(input: $input) { ...CheckinoutScheduleFields }
  }
  ${SCHEDULE_FIELDS}
`;

export const GET_CHECKINOUT_SCHEDULES = gql`
  query CheckinoutSchedules {
    checkinoutSchedules { ...CheckinoutScheduleFields }
  }
  ${SCHEDULE_FIELDS}
`;

export const GET_CHECKINOUT_SCHEDULE = gql`
  query CheckinoutSchedule($scheduleId: ID!) {
    checkinoutSchedule(scheduleId: $scheduleId) { ...CheckinoutScheduleFields }
  }
  ${SCHEDULE_FIELDS}
`;

export const ACTIVATE_CHECKINOUT_SCHEDULE_WEEK = gql`
  mutation ActivateCheckinoutScheduleWeek($scheduleWeekId: ID!) {
    activateCheckinoutScheduleWeek(scheduleWeekId: $scheduleWeekId) { ...CheckinoutScheduleWeekFields }
  }
  ${SCHEDULE_WEEK_FIELDS}
`;
