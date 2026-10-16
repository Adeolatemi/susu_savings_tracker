// class SusuGroup {
//   constructor(weeklyContribution) {
//     if (!Number.isSafeInteger(weeklyContribution) || weeklyContribution <= 0) {
//       throw new Error("Weekly contribution must be a positive integer in pesewas.");
//     }

//     this.weeklyContribution = weeklyContribution;
//     this.members = [];
//     this.currentWeek = 1;
//     this.payoutHistory = [];
//     this.weekStarted = false;
//   }
// }

class SusuGroup {
  constructor(weeklyContribution) {
    if (!Number.isSafeInteger(weeklyContribution) || weeklyContribution <= 0) {
      throw new Error(
        "Weekly contribution must be a positive integer in pesewas."
      );
    }

    this.weeklyContribution = weeklyContribution;
    this.members = [];
    this.currentWeek = 1;
    this.payoutHistory = [];
    this.weekStarted = false;
  }

  addMember(name) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Member name or ID cannot be empty.");
    }

    const memberName = name.trim();

    const alreadyExists = this.members.some(
      (member) => member.name.toLowerCase() === memberName.toLowerCase()
    );

    if (alreadyExists) {
      throw new Error(`Member "${memberName}" already exists.`);
    }

    if (this.weekStarted) {
      throw new Error("Cannot add members after the first week has started.");
    }

    const member = {
      name: memberName,
      contributions: {}
    };

    this.members.push(member);

    return member;
  }

recordContribution(memberName, amountInPesewas) {
    if (!Number.isSafeInteger(amountInPesewas) || amountInPesewas <= 0) {
      throw new Error("Payment must be a positive amount in pesewas.");
    }

    const member = this.members.find(
      (person) => person.name.toLowerCase() === memberName.trim().toLowerCase()
    );

    if (!member) {
      throw new Error(`Member "${memberName}" does not exist.`);
    }

    this.weekStarted = true;

    const week = this.currentWeek;
    const alreadyPaid = member.contributions[week] || 0;
    const outstanding = this.weeklyContribution - alreadyPaid;

    if (amountInPesewas > outstanding) {
      throw new Error(
        `${member.name} owes only ${this.formatMoney(outstanding)} this week.`
      );
    }

    member.contributions[week] = alreadyPaid + amountInPesewas;

    return {
      member: member.name,
      week,
      paidThisWeek: member.contributions[week],
      outstanding: this.weeklyContribution - member.contributions[week]
    };
  }

  formatMoney(amountInPesewas) {
    return `GHS ${(amountInPesewas / 100).toFixed(2)}`;
  }

}

// const group = new SusuGroup(5000);

// group.addMember("Ama");
// group.addMember("Kofi");
// group.addMember("Esi");
// group.addMember("ama");
// console.log(group.members);

const group = new SusuGroup(5000);

group.addMember("Ama");
group.addMember("Kofi");
group.addMember("Esi");

group.recordContribution("Ama", 5000);
group.recordContribution("Kofi", 5000);
group.recordContribution("Esi", 3000);

console.log("Esi's first payment:");
console.log(group.formatMoney(group.members[2].contributions[1]));

group.recordContribution("Esi", 2000);

console.log("Esi's total payment:");
console.log(group.formatMoney(group.members[2].contributions[1]));