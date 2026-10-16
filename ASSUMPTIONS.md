Susu Savings Tracker Assumptions and Design Decisions

A. Weekly Contribution and Currency

- All members contribute the same fixed amount each week.
- Amounts are entered and stored as integer pesewas to avoid floating-point rounding errors.
- For example, GH₵50.00 is represented internally as "5000" pesewas.
- Weekly contributions and payments must be positive safe integers when represented in pesewas.

B. Member Management

- Each member is identified by name.
- Member names are trimmed of leading and trailing whitespace.
- Member names must not be empty.
- Duplicate names are rejected without regard to letter case. For example, "Ama" and "ama" are considered duplicates.
- New members cannot be added after the first contribution has been recorded. This keeps the contribution obligation and payout rotation consistent throughout the savings cycle.

C. Contributions

- Members may pay their weekly contribution in multiple partial payments.
- Every payment is applied to the member's outstanding balance for the current week.
- Payments of zero, negative amounts, fractional pesewas, non-numeric values, and amounts exceeding the outstanding balance are rejected.
- Failed payments must not modify contribution records or group balances.
- A member's payment for one week does not count toward another week.

D. Week Closure and Payouts

- A week can close only when every member has paid the full weekly contribution.
- If any member owes money, the week remains open, no payout is made, and the program reports each outstanding balance.
- The payout equals the fixed weekly contribution multiplied by the number of group members.
- Payouts follow the order in which members joined the group.
- Each successfully closed week advances the payout rotation by one member and starts the next contribution week.
- A failed week closure must not advance the week or record a payout.

E. Reporting

- The weekly report shows the current week, members who have paid in full, members who still owe money, and payout history.
- Monetary amounts in reports are formatted in Ghanaian cedis (GHS) with two decimal places.
- Payment statuses in the report relate to the current week only.
- Historical payouts remain available after the group advances to a new week.

F. Scope and Limitations

- The program manages one in-memory savings group.
- Data is not persisted after the program terminates.
- The program does not implement user authentication, a database, a graphical interface, or real bank transfers.
- Payouts are recorded by the program; recording a payout does not itself transfer money to a member.