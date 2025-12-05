# Walkthrough - Image Optimization for OMR Editor

I have implemented the on-the-fly image resizing for the OMR sheet image endpoint.

## Changes

### API Layer
#### [sheets.py](file:///workspaces/omr-backend/src/api/routers/sheets.py)
- Added optional `width` query parameter to [get_sheet_image](file:///workspaces/omr-backend/src/domains/sheets/service.py#34-72).

### Domain Layer
#### [service.py](file:///workspaces/omr-backend/src/domains/sheets/service.py)
- Updated [get_sheet_image](file:///workspaces/omr-backend/src/domains/sheets/service.py#34-72) to accept `width`.
- Implemented resizing logic using `PIL.Image.resize` with `LANCZOS` resampling.
- Ensures aspect ratio is maintained.

## Verification Results

### Automated Verification
I created a temporary script to verify the resizing logic using a real OMR sheet image ([/cephfs/omr/omr_sheets/real/14900123/149-00457.jpg](file:///cephfs/omr/omr_sheets/real/14900123/149-00457.jpg)).

**Test 1: Top Part Resize**
- Original Crop: 1440x595
- Target Width: 920
- Result: 920x380
- Aspect Ratio: Maintained (~2.42)

**Test 2: Bottom Part Resize**
- Original Crop: 1170x1650
- Target Width: 350
- Result: 350x493
- Aspect Ratio: Maintained (~0.71)

**Test 3: No Resize**
- Result: Returns original cropped image dimensions.

## Usage Example
```bash
# Get top part resized to 920px width
GET /sheets/{sheet_id}/image?part=top&width=920

# Get bottom part resized to 350px width
GET /sheets/{sheet_id}/image?part=bottom&width=350
```
