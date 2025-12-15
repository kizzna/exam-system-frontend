# suggestion for finding missing student

## Overview
Current suggestion system for finding student to assign sheet using search popover works quite well.
But it can be further improved.

## Current use case
current row: master_roll 170, student_roll 20170, status Duplicate
previous row: master_roll 170, student_roll 20170, status Duplicate
current row-2: master_roll 169, student_roll 20169, status OK
next row: master_roll 173, student_roll 20173, status OK
missing row:  master_roll 171, student_roll 20171, status missing (not shown)


## Logic for suggesting sorted list of suggested student list on top of student row

what would help most is:
- scan is ordered by student_roll (95%)
- missing stauts should be included on search student list popover and should have high priority on sort to be on top.
  currently only works if error row has exactly between 2 normal sequential roll
  i.e. current row: error (supposed to be 171), previous row master_roll 170 with status ok, next row master_roll 172
  system currently shows 171 as top suggested (regardless of row status)
- order that will help find proper student to assign to:
  1st level candidate: if next.master_roll - prev.master_roll == 1 then 1st level candidate
  2nd level candidates: find its current position i.e. if 1..9 and next = 7, previous = 4, any missing status from 1..9 should be sorted and listed as 2nd level candiates. Next = 14, previous = 10, missing status of 10..19 should be sorted and listed as 2nd level candidates. Next = 160, Previous = 157, missing status of 150..159 should be sorted and listed asn 2nd level candidates, etc.
  rest of the list as 3rd level candidates

