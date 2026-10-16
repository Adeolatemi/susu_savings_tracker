const { SusuGroup } = require("./index");

// Create a group with a weekly contribution of GH₵50.00.
// Amounts are stored in pesewas, so GH₵50.00 = 5000.
const group = new SusuGroup(5000);

// Add members in payout order.
group.addMember("Ama");
group.addMember("Kofi");
group.addMember("Esi");

// Week 1: Ama and Kofi pay in full.
// Esi initially pays GH₵30.00.
group.recordContribution("Ama", 5000);
group.recordContribution("Kofi", 5000);
group.recordContribution("Esi", 3000);

console.log("First attempt to close Week 1:");
console.log(JSON.stringify(group.closeWeek(), null, 2));

// Esi pays the remaining GH₵20.00.
group.recordContribution("Esi", 2000);

console.log("Second attempt to close Week 1:");
console.log(JSON.stringify(group.closeWeek(), null, 2));

console.log("Current week:", group.currentWeek);
console.log("Payout history:", group.payoutHistory);

console.log("\nWeekly report:");
console.log(JSON.stringify(group.getWeeklyReport(), null, 2));