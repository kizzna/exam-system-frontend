# Edit answer frontend implementaion

# api code for manually editing answer
@router.patch("/{sheet_id}/answers")
async def update_sheet_answers(
    sheet_id: str,
    payload: AnswerEditPayload,
    service: SheetService = Depends(get_sheet_service),
    current_user: User = Depends(get_current_user)
):
    """
    Manual answer edit.
    """
    try:
        service.edit_answers(sheet_id, payload)
        return {"status": "success", "message": "Answers updated successfully"}
    except EntityNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# api code for manually editing answer (score is calculated for every answer edit, this is acceptable)
def edit_answers(self, sheet_id: str, payload: AnswerEditPayload) -> None:
        """
        Manual answer edit.
        Updates answers table then triggers reprocess ONCE.
        """
        if not self.repository.find_by_id(sheet_id):
             raise EntityNotFoundError("Sheet", sheet_id)
             
        for q_no, val in payload.answers.items():
            self.repository.update_answer(sheet_id, q_no, val)
            
        # Trigger reprocess once to recalculate scores/errors
        # Manual edit answers -> ALWAYS force score
        self.repository.reprocess_sheet(int(sheet_id), force_score=True)

# Frontend layout idea:
Panel D shows 150 answers image (bottom part of the sheet) and bubble overlay.
We need a way to edit the answer for 150 questions manually.
We add a button label "Edit answers" in the top right corner of the panel D next row from button "แสดง / ซ่อน การระบายทั้งหมด".
When clicked, a searchable popover modal will pop up to show 150 questions and answers.
Layout is just 2 columns: Column 1 shows the question number and Column 2 shows the answer.
Column 2 is editable box and has follow feature applied to it.
It has 4 choices A, B, C, D. All values are bitmask values.
A = 1, B = 2, C = 4, D = 8.
User can type either 3 of these and will be converted to bit mask value.
A or ก or 1 will be bitmask value 1 but display in Thai alphabet ก.
B or ข or 2 will be bitmask value 2 but display in Thai alphabet ข.
C or ค or 3 will be bitmask value 4 but display in Thai alphabet ค.
D or ง or 4 will be bitmask value 8 but display in Thai alphabet ง.
Value is saved as user type to make it not possible to forget to save.
This modal should be made searchable by question number which will scroll position to that question (not filter every thing out like normal search, it is more like a search for a question number to jump to).
Popover should be slightly smaller than Panel C size.

Advance user edit answer flow:
1. Click on the edit answers button in panel D.
2. A searchable popover modal will pop up to show 150 questions and answers.
3. User type question number in the search box to jump to that question
4. User press arrow down to move focus to the answer box.
5. User type in the answer box to edit the answer.
6. User press arrow down to move focus to the next answer box.
7. User can click on the save button to save the answer.
8. User can click on the save all button to save all answers.
9. User can click on the close button to close the modal.

# Note: each time we send answer to backend, use notice to notify user that "บันทึกสำเร็จ" or "บันทึกไม่สำเร็จ" with toast.