# New overlay on Panel C.

## New transparent circle overlay, dark gray border, width 5 pixel, on any question where student did not answer.
answers: "val": = 0 means empty;

Position for button to activate this overlay:
- after button with label "การตรวจ" and before "ทั้งหมด"

Current request:
Request URL
http://omr.gt/api/sheets/375731/overlay
Request Method
GET
Response:
{
...
        "answers": [
            {
                "q": 1,
                "val": 4
            },
	/* ... */
        ]
    }

