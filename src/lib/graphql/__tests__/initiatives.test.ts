import { print } from "graphql";
import { describe, expect, it } from "vitest";
import {
  CREATE_ACTIVITY,
  CREATE_INITIATIVE,
  REMOVE_INITIATIVE,
  UPDATE_ACTIVITY,
  UPDATE_INITIATIVE,
} from "../mutations/initiatives";
import {
  GET_ACTIVITIES,
  GET_ACTIVITY,
  GET_INITIATIVE,
  GET_INITIATIVES,
} from "../queries/initiatives";

describe("initiative GraphQL scope contract", () => {
  it.each([GET_INITIATIVES, GET_INITIATIVE, GET_ACTIVITIES, GET_ACTIVITY])(
    "selects initiative scope in queries",
    (document) => {
      const printed = print(document);
      expect(printed).toContain("scopeType");
      expect(printed).toContain("scopeId");
    }
  );

  it.each([
    CREATE_INITIATIVE,
    UPDATE_INITIATIVE,
    REMOVE_INITIATIVE,
    CREATE_ACTIVITY,
    UPDATE_ACTIVITY,
  ])(
    "selects initiative scope in mutation results",
    (document) => {
      const printed = print(document);
      expect(printed).toContain("scopeType");
      expect(printed).toContain("scopeId");
    }
  );

  it("preserves the create initiative API input name", () => {
    const printed = print(CREATE_INITIATIVE);
    expect(printed).toContain("$createInitiativeInput: CreateInitiativeInput!");
    expect(printed).toContain(
      "createInitiative(createInitiativeInput: $createInitiativeInput)"
    );
  });
});
