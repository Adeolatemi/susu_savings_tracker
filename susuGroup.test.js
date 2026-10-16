const test = require("node:test");
const assert = require("node:assert/strict");
const { SusuGroup } = require("./index");

function createGroup() {
  const group = new SusuGroup(5000);

  group.addMember("Ama");
  group.addMember("Kofi");
  group.addMember("Esi");

  return group;
}

test("creates a group with a valid weekly contribution", () => {
  const group = new SusuGroup(5000);

  assert.equal(group.weeklyContribution, 5000);
  assert.equal(group.currentWeek, 1);
});

test("rejects a duplicate member name", () => {
  const group = createGroup();

  assert.throws(
    () => group.addMember("ama"),
    /already exists/
  );
});

test("records a partial contribution", () => {
  const group = createGroup();

  const result = group.recordContribution("Esi", 3000);

  assert.equal(result.paidThisWeek, 3000);
  assert.equal(result.outstanding, 2000);
});

test("rejects a payment from an unknown member", () => {
  const group = createGroup();

  assert.throws(
    () => group.recordContribution("Yaw", 5000),
    /does not exist/
  );
});

test("does not close a week when a member owes money", () => {
  const group = createGroup();

  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 3000);

  const result = group.closeWeek();

  assert.equal(result.success, false);
  assert.equal(group.currentWeek, 1);
  assert.equal(group.payoutHistory.length, 0);
  assert.equal(result.outstandingMembers[0].outstanding, 2000);
});

test("closes a fully paid week and pays the first member", () => {
  const group = createGroup();

  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 5000);

  const result = group.closeWeek();

  assert.equal(result.success, true);
  assert.equal(result.payout.recipient, "Ama");
  assert.equal(result.payout.amount, 15000);
  assert.equal(group.currentWeek, 2);
});

test("rejects a payment that exceeds the outstanding amount", () => {
  const group = createGroup();

  group.recordContribution("Ama", 3000);

  assert.throws(
    () => group.recordContribution("Ama", 3000),
    /owes only/
  );
});

test("pays members in joining order across three weeks", () => {
  const group = createGroup();

  // Week 1: Ama receives the pot.
  for (const name of ["Ama", "Kofi", "Esi"]) {
    group.recordContribution(name, 5000);
  }

  const week1 = group.closeWeek();

  assert.equal(week1.success, true);
  assert.equal(week1.payout.recipient, "Ama");
  assert.equal(group.currentWeek, 2);

  // Week 2: Kofi receives the pot.
  for (const name of ["Ama", "Kofi", "Esi"]) {
    group.recordContribution(name, 5000);
  }

  const week2 = group.closeWeek();

  assert.equal(week2.success, true);
  assert.equal(week2.payout.recipient, "Kofi");
  assert.equal(group.currentWeek, 3);

  // Week 3: Esi receives the pot.
  for (const name of ["Ama", "Kofi", "Esi"]) {
    group.recordContribution(name, 5000);
  }

  const week3 = group.closeWeek();

  assert.equal(week3.success, true);
  assert.equal(week3.payout.recipient, "Esi");
  assert.equal(group.currentWeek, 4);

  assert.equal(group.payoutHistory.length, 3);
});

test("reports the exact outstanding amount when a week cannot close", () => {
  const group = createGroup();

  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 3000);

  const result = group.closeWeek();

  assert.equal(result.success, false);
  assert.equal(result.week, 1);
  assert.deepEqual(result.outstandingMembers, [
    {
      member: "Esi",
      paid: 3000,
      outstanding: 2000
    }
  ]);

  assert.equal(group.currentWeek, 1);
  assert.equal(group.payoutHistory.length, 0);
});

test("reports members who have paid in full and members who owe", () => {
  const group = createGroup();

  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 3000);

  const report = group.getWeeklyReport();

  assert.equal(report.currentWeek, 1);

  assert.deepEqual(report.membersPaidInFull, [
    "Ama",
    "Kofi"
  ]);

  assert.deepEqual(report.membersOwing, [
    {
      member: "Esi",
      amountOwed: "GH₵20.00"
    }
  ]);

  assert.deepEqual(report.payoutHistory, []);
});

test("reports payout history and the new current week", () => {
  const group = createGroup();

  group.recordContribution("Ama", 5000);
  group.recordContribution("Kofi", 5000);
  group.recordContribution("Esi", 5000);

  group.closeWeek();

  const report = group.getWeeklyReport();

  assert.equal(report.currentWeek, 2);

  assert.deepEqual(report.membersPaidInFull, []);

  assert.deepEqual(
    report.membersOwing.map((member) => member.member),
    ["Ama", "Kofi", "Esi"]
  );

  assert.deepEqual(report.payoutHistory, [
    {
      week: 1,
      recipient: "Ama",
      amount: "GH₵150.00"
    }
  ]);
});

test("rejects zero and negative weekly contributions", () => {
  assert.throws(() => new SusuGroup(0), /positive integer/);
  assert.throws(() => new SusuGroup(-5000), /positive integer/);
});

test("rejects non-integer or non-numeric weekly contributions", () => {
  assert.throws(() => new SusuGroup(50.5), /positive integer/);
  assert.throws(() => new SusuGroup("5000"), /positive integer/);
  assert.throws(() => new SusuGroup(NaN), /positive integer/);
});

test("rejects zero and negative member payments", () => {
  const group = createGroup();

  assert.throws(
    () => group.recordContribution("Ama", 0),
    /positive amount/
  );

  assert.throws(
    () => group.recordContribution("Ama", -1000),
    /positive amount/
  );

  assert.equal(group.getMemberContribution("Ama"), 0);
});

test("rejects fractional and non-numeric member payments", () => {
  const group = createGroup();

  assert.throws(
    () => group.recordContribution("Ama", 100.5),
    /positive amount/
  );

  assert.throws(
    () => group.recordContribution("Ama", "1000"),
    /positive amount/
  );

  assert.equal(group.getMemberContribution("Ama"), 0);
});

test("does not change a contribution after an invalid overpayment", () => {
  const group = createGroup();

  group.recordContribution("Ama", 3000);

  assert.throws(
    () => group.recordContribution("Ama", 3000),
    /owes only/
  );

  assert.equal(group.getMemberContribution("Ama"), 3000);
  assert.equal(group.getOutstandingContribution("Ama"), 2000);
});

test("rejects empty or whitespace-only member names", () => {
  const group = new SusuGroup(5000);

  assert.throws(() => group.addMember(""), /cannot be empty/);
  assert.throws(() => group.addMember("   "), /cannot be empty/);

  assert.equal(group.members.length, 0);
});

test("rejects empty member names when recording payments", () => {
  const group = createGroup();

  assert.throws(
    () => group.recordContribution("", 1000),
    /cannot be empty/
  );

  assert.throws(
    () => group.recordContribution("   ", 1000),
    /cannot be empty/
  );

  assert.equal(group.getGroupTotalContributions(), 0);
});

test("rejects unknown members without changing group balances", () => {
  const group = createGroup();

  assert.throws(
    () => group.recordContribution("Yaw", 5000),
    /does not exist/
  );

  assert.equal(group.getGroupTotalContributions(), 0);
  assert.equal(group.payoutHistory.length, 0);
  assert.equal(group.currentWeek, 1);
});

test("rejects duplicate members without changing the group", () => {
  const group = createGroup();

  assert.throws(
    () => group.addMember("ama"),
    /already exists/
  );

  assert.equal(group.members.length, 3);
  assert.deepEqual(
    group.members.map((member) => member.name),
    ["Ama", "Kofi", "Esi"]
  );
});

test("rejects unsafe integer amounts", () => {
  const group = createGroup();

  assert.throws(
    () => new SusuGroup(Number.MAX_SAFE_INTEGER + 1),
    /positive integer/
  );

  assert.throws(
    () => group.recordContribution("Ama", Number.MAX_SAFE_INTEGER + 1),
    /positive amount/
  );

  assert.equal(group.getMemberContribution("Ama"), 0);
});

test("does not allow adding members after contributions begin", () => {
  const group = createGroup();

  group.recordContribution("Ama", 1000);

  assert.throws(
    () => group.addMember("Yaw"),
    /after the first week has started/
  );

  assert.equal(group.members.length, 3);
});

test("rejects closing a week when the group has no members", () => {
  const group = new SusuGroup(5000);

  assert.throws(
    () => group.closeWeek(),
    /without any members/
  );

  assert.equal(group.currentWeek, 1);
  assert.equal(group.payoutHistory.length, 0);
});