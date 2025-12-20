# update score box color and add total score box below 3rd subject score box on answer-image-viewer.tsx

## All subject's score text depends on following conditions:
- if score < 25 RED color
- if score >= 25 and < 50 ORANGE color
- if score >= 50 GREEN color

## Add new total score box below 3rd subject score box
- Title: รวม
- if total >= 150 GREEN color
- if total >= 120 and < 150 ORANGE color
- if total < 110 RED color