Susu Savings Tracker

A small JavaScript application for managing a rotating susu savings group.

Features

- Create a group with a fixed weekly contribution.
- Add members with unique names.
- Record full and partial weekly contributions.
- Prevent week closure when any member owes money.
- Pay out the full pot in member joining order.
- Display current-week payment statuses, outstanding balances, and payout history.
- Validate invalid inputs and prevent overpayments.
- Handle money using integer pesewas to avoid floating-point rounding errors.

Requirements

- Node.js with built-in test runner support.

Run the example

node example.js

Run the tests

node --test

Assumptions

See "ASSUMPTIONS.md" (ASSUMPTIONS.md) for the project's design decisions and limitations.

Scope

This project manages one in-memory savings group. It does not use a database or perform actual bank transfers.