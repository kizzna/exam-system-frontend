# update batch upload and set max file size limit per file

## batch upload (ZIP)
- Current behavior: the batch upload will start next queue item immidiately when first file is uploaded.
- New behavior: the batch upload will wait for previous batch to finish before starting next batch.
Queue will make sure there will be only one batch processing at a time.

## max file size limit per file (ZIP)
- Current behavior: the max file size limit is 10 GB.
- New behavior: the max file size limit is 3 GB.

When user try to upload file that is larger than 3 GB, the file will be rejected and show error message.