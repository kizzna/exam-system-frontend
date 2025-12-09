# Duplicate counterpart finder

## Overview
This feature will jump to row where it's counterpart(s) are.
99% of the time, its counterpart has wrong roll number (sorted by scan order or original_filename).
Currently, user has to manually navigate to find the counterpart.
This feature will help user to quickly find and fix the counterpart.

### Keyboard Navigation
Ctrl-Right Arrow: Go to next counterpart
Ctrl-Left Arrow: Go to previous counterpart

### Scenario
Case 1. Student roll 10001 has 2 sheets marked as 10001.
When user press Ctrl-Right arrow, it will go to the next sheet with roll 10001.    
Case 2. Student roll 10024 has 3 sheets marked as 10024.
When user press Ctrl-Right arrow, it will go to the next sheet with roll 10024.

### Note: This works on any mode (Sequential or Priority).
