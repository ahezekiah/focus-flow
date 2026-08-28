Scenario: Missed Day 1 task

Given a user has onboarded with a goal

And there is a group

And the person belongs to a group

And they have a goal of writing 30min a day for a week

And day 1 is over

And they didn’t complete today’s goal

When day 1 is over

Then the group is notified that the user didn’t complete day 1 over their writing goal