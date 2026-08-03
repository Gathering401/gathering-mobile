Here's specs for everything that's not quite working as I'd want.  
I don't have any specific desires for design yet. I have 22 screenshots I can share for every page I could think to find on the app.  
I'd like to share all 22 of those images, and explain what I don't love about them overall here directly.

## All Screens

- I'd like to be able to tap the blank space outside a modal to close the modal

## All Forms

- I'd like to be able to tap the blank space to close the keyboard. Some have this, others don't
- For all forms except the login form, I'd like the little red stars for required fields, and an indicator as to what that little red star means somewhere
- Name inputs should not have autocorrect (event name, group name, username, first/last name)
- Enum selection modals should say "Close" instead of "Cancel"

### Screens I don't think need a header include:
##### These screens need nothing for a header:
- Login Screen
- Sign Up Screen
- Forgot Password Screen
- Groups Screen
- Event Form
- Group Form
##### These screens don't need a title, but want the back button:
- Event Details Screen
- Group Details Screen

## Login Screen

- Nothing specific to the login screen

## Forgot Password Screen

- I also don't think the header needs to exist here, including the button that takes you back to the login screen (in the header). I think just the "Back to log in" button is sufficient
- I'd like the placeholder for the input to be "gathering_user@example.com"

## Signup Screen

- First and last name inputs should have auto capitalization (first word only)
- Birthdate input should be a date input, currently text

## Home Screen (Calendar Screen)

- The day's and recommended events lists should be a horizontal scroller
- Need to implement a "Pending Invitations" horizontal scroller as well
- When switching months, your selected day should default to the first day of that month
- The + button in the top right should be a secondary styled button
  - The + button also currently has a little extra white space to the right of the + that makes it look goofy
- I think adding pagination to the calendar query would be good
  - Changing the query from grabbing *all* events, to only grabbing those for the current month
  - Grabbing all events could be thousands, maybe 10s of thousands for some users. Grabbing one month at a time would make it much more efficient
  - They can be cached as well so it's not recalling the API if they go back and forth between months

## Event Form

- Event name should auto capitalize every word
- Event description should auto capitalize first word of each sentence
- Location I want to change to be a google API input, similar to the one on the business application form
- Cost should remove leading 0s
- Date picker isn't automatically in full view when opened, I'd like the screen to auto scroll so it is
- Date picker "Done" button doesn't look like a button, should look like other secondary buttons
- Time picker within datepicker should be in 5 minute increments
- Verify API endpoint for the event form selects all groups that the user can create in, not all groups that they're a part of
- Not a huge deal, but if coming from a group screen, the group dropdown doesn't feel fully disabled, as tapping it makes the text look like it's been interacted with. I feel it shouldn't do anything at all

## Event Details Screen

- I'd like the "View all dates" button to say "All Dates" and be secondary button styled
  - All dates button should also not be there if it's repetition = none
- I'd like to create a hamburger menu on the right side of the header, with these options within the menu
  - Edit Event (remove old edit button, still same gates)
  - Guest List (remove old guest list button, still same gates)
  - Cancel Event (doesn't exist anywhere yet, same gates as edit)
- Tapping on location should open your phone's native maps app
  - Had a temporary placeholder of copying the location, but that placeholder can go now
- The guest list modal shouldn't cover the whole screen
  - The header for the modal should read "Guest List" also, to stay consistent rather than have fun lingo

## Group Form Screen

- Name should capitalize every word
- Description should capitalize every sentence
- Is public should be defaulted to true
  - Subtext for public should just be "Anyone can join"
  - Subtext for private should just be "Users must be invited or accepted"

## Group Details Screen

- I'd also like to create a hamburger menu on the right side of this header, with these options within the menu
  - Edit Group (remove old edit button, still same gates)
  - Delete Group (doesn't yet exist, same gates as edit)
- Changed "Owned by <user>" to "Lead by <user>" - this does not affect any enums or naming within the code, only the display here
- If there are no members other than the group owner (so I'm the only person looking at the group currently), the members header/section shouldn't be there
- Invite user modal - clicking into the search input brings the keyboard up, covering the modal itself. This modal should probably be a full screen one

## Profile Screen

- Profile should only be in the header at the top of the screen
- Full name and username should swap positions, making the full name more prominent for the user
- Hamburger menu on the right side of the header with these menu options:
  - Edit Account (remove old edit button)
  - Logout (remove old logout button)
- Change password should be a button on the edit form
  - Should be similar to the "Forgot your password?" button on the login screen, but should say "Change Password", just same location on the edit account screen - just below the submit button
- Edit form should have a cancel button as well, as it shouldn't have a header at all

## Groups Screen

- Nothing specific to the groups screen

## Reset Password Screen

- Error text needs help, just says "Something went wrong. Please try again". This should at least say something like "Incorrect password" or the same error text that we'd expect from the initial signup page password errors

## Change Password Screen

- Should this and reset password be the same screen (with slight differences)? I'm sure there was a reason for not, I just don't remember what it was. My only assumption is that it's because of auth gating the change password screen but not the reset password screen?
