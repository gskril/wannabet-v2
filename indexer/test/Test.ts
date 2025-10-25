import assert from "assert";
import { 
  TestHelpers,
  Bet_BetAccepted
} from "generated";
const { MockDb, Bet } = TestHelpers;

describe("Bet contract BetAccepted event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for Bet contract BetAccepted event
  const event = Bet.BetAccepted.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("Bet_BetAccepted is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await Bet.BetAccepted.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualBetBetAccepted = mockDbUpdated.entities.Bet_BetAccepted.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedBetBetAccepted: Bet_BetAccepted = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualBetBetAccepted, expectedBetBetAccepted, "Actual BetBetAccepted should be the same as the expectedBetBetAccepted");
  });
});
