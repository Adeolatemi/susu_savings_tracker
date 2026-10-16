"use strict";

class SusuGroup {
  constructor(weeklyContribution) {
    if (
      !Number.isSafeInteger(weeklyContribution) ||
      weeklyContribution <= 0
    ) {
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

closeWeek() {
    if (this.members.length === 0) {
      throw new Error("Cannot close a week without any members.");
    }

    const week = this.currentWeek;

    // Find members who have not paid their full contribution.
    const outstandingMembers = this.members
      .map((member) => {
        const paid = member.contributions[week] || 0;

        return {
          member: member.name,
          paid,
          outstanding: this.weeklyContribution - paid
        };
      })
      .filter((member) => member.outstanding > 0);

    // If anyone still owes money, do not pay out or advance the week.
    if (outstandingMembers.length > 0) {
      return {
        success: false,
        week,
        message: "Week cannot close. Some members still owe money.",
        outstandingMembers
      };
    }

    // Rotate the payout in member joining order.
    const payoutIndex = this.payoutHistory.length % this.members.length;
    const recipient = this.members[payoutIndex];
    const pot = this.weeklyContribution * this.members.length;

    const payout = {
      week,
      recipient: recipient.name,
      amount: pot
    };

    this.payoutHistory.push(payout);

    // Advance only after a successful payout.
    this.currentWeek += 1;

    return {
      success: true,
      message: "Week closed successfully.",
      payout
    };
  }

getWeeklyReport() {
    const week = this.currentWeek;

    const memberStatuses = this.members.map((member) => {
      const paid = member.contributions[week] || 0;

      return {
        member: member.name,
        paid: this.formatMoney(paid),
        outstanding: this.formatMoney(
          this.weeklyContribution - paid
        ),
        paidInFull: paid === this.weeklyContribution
      };
    });

    return {
      currentWeek: week,
      membersPaidInFull: memberStatuses
        .filter((member) => member.paidInFull)
        .map((member) => member.member),
      membersOwing: memberStatuses
        .filter((member) => !member.paidInFull)
        .map((member) => ({
          member: member.member,
          amountOwed: member.outstanding
        })),
      payoutHistory: this.payoutHistory.map((payout) => ({
        week: payout.week,
        recipient: payout.recipient,
        amount: this.formatMoney(payout.amount)
      }))
    };
  }

  // Format pesewas as Ghanaian cedis.
  formatMoney(amountInPesewas) {
    if (!Number.isSafeInteger(amountInPesewas)) {
      throw new Error("Amount must be an integer in pesewas.");
    }

    return new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency: "GHS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amountInPesewas / 100);
  }

  // Find a member without regard to letter case.
  findMember(memberName) {
    if (typeof memberName !== "string" || memberName.trim() === "") {
      throw new Error("Member name or ID cannot be empty.");
    }

    return this.members.find(
      (member) =>
        member.name.toLowerCase() === memberName.trim().toLowerCase()
    );
  }

  // Add a new member to the group.
  addMember(name) {
    if (typeof name !== "string" || name.trim() === "") {
      throw new Error("Member name or ID cannot be empty.");
    }

    if (this.weekStarted) {
      throw new Error(
        "Cannot add members after the first week has started."
      );
    }

    const memberName = name.trim();

    const alreadyExists = this.members.some(
      (member) => member.name.toLowerCase() === memberName.toLowerCase()
    );

    if (alreadyExists) {
      throw new Error(`Member "${memberName}" already exists.`);
    }

    const member = {
      name: memberName,
      contributions: {}
    };

    this.members.push(member);

    return member;
  }

  // Record a full or partial contribution for the current week.
  recordContribution(memberName, amountInPesewas) {
    if (
      !Number.isSafeInteger(amountInPesewas) ||
      amountInPesewas <= 0
    ) {
      throw new Error(
        "Payment must be a positive amount in pesewas."
      );
    }

    const member = this.findMember(memberName);

    if (!member) {
      throw new Error(`Member "${memberName}" does not exist.`);
    }

    const week = this.currentWeek;
    const alreadyPaid = member.contributions[week] || 0;
    const outstanding = this.weeklyContribution - alreadyPaid;

    if (outstanding <= 0) {
      throw new Error(
        `${member.name} has already completed the contribution for week ${week}.`
      );
    }

    if (amountInPesewas > outstanding) {
      throw new Error(
        `${member.name} owes only ${this.formatMoney(outstanding)} for week ${week}.`
      );
    }

    // Update the contribution only after all validations pass.
    member.contributions[week] = alreadyPaid + amountInPesewas;
    this.weekStarted = true;

    return {
      member: member.name,
      week,
      paymentReceived: amountInPesewas,
      paidThisWeek: member.contributions[week],
      outstanding:
        this.weeklyContribution - member.contributions[week]
    };
  }

  // Calculate a member's contribution for a particular week.
  getMemberContribution(memberName, week = this.currentWeek) {
    const member = this.findMember(memberName);

    if (!member) {
      throw new Error(`Member "${memberName}" does not exist.`);
    }

    if (!Number.isSafeInteger(week) || week < 1) {
      throw new Error("Week must be a positive integer.");
    }

    return member.contributions[week] || 0;
  }

  // Calculate how much a member still owes for a particular week.
  getOutstandingContribution(memberName, week = this.currentWeek) {
    const paid = this.getMemberContribution(memberName, week);

    return Math.max(0, this.weeklyContribution - paid);
  }

  // Calculate a member's total contributions across all weeks.
  getTotalContribution(memberName) {
    const member = this.findMember(memberName);

    if (!member) {
      throw new Error(`Member "${memberName}" does not exist.`);
    }

    return Object.values(member.contributions).reduce(
      (total, amount) => total + amount,
      0
    );
  }

  // Calculate the total contributions received during a week.
  getWeeklyTotal(week = this.currentWeek) {
    if (!Number.isSafeInteger(week) || week < 1) {
      throw new Error("Week must be a positive integer.");
    }

    return this.members.reduce(
      (total, member) => total + (member.contributions[week] || 0),
      0
    );
  }

  // Calculate all contributions received by the group.
  getGroupTotalContributions() {
    return this.members.reduce(
      (total, member) => total + this.getTotalContribution(member.name),
      0
    );
  }

  // Start the next contribution week.
  // startNextWeek() {
  //   if (this.members.length === 0) {
  //     throw new Error("Add members before starting a contribution week.");
  //   }

  //   this.currentWeek += 1;
  //   this.weekStarted = false;

  //   return this.currentWeek;
  // }

  // Record a payout to a group member.
  // recordPayout(memberName, amountInPesewas) {
  //   if (
  //     !Number.isSafeInteger(amountInPesewas) ||
  //     amountInPesewas <= 0
  //   ) {
  //     throw new Error(
  //       "Payout must be a positive amount in pesewas."
  //     );
  //   }

  //   const member = this.findMember(memberName);

  //   if (!member) {
  //     throw new Error(`Member "${memberName}" does not exist.`);
  //   }

  //   const totalContributions = this.getGroupTotalContributions();

  //   const totalPaidOut = this.payoutHistory.reduce(
  //     (total, payout) => total + payout.amount,
  //     0
  //   );

  //   const availableBalance = totalContributions - totalPaidOut;

  //   if (amountInPesewas > availableBalance) {
  //     throw new Error(
  //       `Insufficient funds. Available balance: ${this.formatMoney(availableBalance)}.`
  //     );
  //   }

  //   const payout = {
  //     member: member.name,
  //     amount: amountInPesewas,
  //     week: this.currentWeek,
  //     date: new Date().toISOString()
  //   };

  //   this.payoutHistory.push(payout);

  //   return payout;
  // }

  // Calculate the group's current balance.
  getGroupBalance() {
    const totalContributions = this.getGroupTotalContributions();

    const totalPayouts = this.payoutHistory.reduce(
      (total, payout) => total + payout.amount,
      0
    );

    return totalContributions - totalPayouts;
  }

  // Return a summary of the group.
  getSummary() {
    return {
      numberOfMembers: this.members.length,
      currentWeek: this.currentWeek,
      weeklyContribution: this.formatMoney(this.weeklyContribution),
      totalContributions: this.formatMoney(
        this.getGroupTotalContributions()
      ),
      totalPayouts: this.formatMoney(
        this.payoutHistory.reduce(
          (total, payout) => total + payout.amount,
          0
        )
      ),
      availableBalance: this.formatMoney(this.getGroupBalance())
    };
  }
}

// Example usage of the SusuGroup class.

const group = new SusuGroup(5000);

group.addMember("Ama");
group.addMember("Kofi");
group.addMember("Esi");

// Week 1: Esi initially pays only GHS 30.00.
group.recordContribution("Ama", 5000);
group.recordContribution("Kofi", 5000);
group.recordContribution("Esi", 3000);

console.log("First attempt to close Week 1:");
console.log(group.closeWeek());

// Esi completes her remaining GHS 20.00.
group.recordContribution("Esi", 2000);

console.log("Second attempt to close Week 1:");
console.log(group.closeWeek());

console.log("Current week:", group.currentWeek);
console.log("Payout history:", group.payoutHistory);

console.log("\nWeekly report:");
console.log(JSON.stringify(group.getWeeklyReport(), null, 2));

module.exports = { SusuGroup };