# OMR Profile Management Guide

This document provides a comprehensive guide on using and implementing the OMR Profile Management system.

## 1. User Guide

The OMR Profile system allows administrators to define custom processing configurations for OMR batches. This is useful for handling different types of exam sheets (e.g., "Light-Filled", "High-Sensitivity", "Legacy Format") without modifying the core system configuration.

### How it Works
1.  **Default Configuration**: The system uses [omr_config-04.json](file:///workspaces/omr-backend/config/omr_config-04.json) as the base configuration.
2.  **Profiles**: Profiles are stored in the database and contain *overrides*.
3.  **Merging**: When a batch is processed with a profile, the system merges the profile's overrides into the base configuration.

### Managing Profiles
-   **Create**: Define a new profile with specific settings (e.g., lower darkness threshold).
-   **Clone**: Create a copy of an existing profile to tweak settings.
-   **Edit**: Update the configuration JSON of a profile.
-   **Delete**: Remove a profile (only if not used by any batches).

### Using a Profile
When uploading a batch (via API or UI), select the desired `profile_id`. The system will automatically apply the configuration during processing.

## 2. API Reference

**Base URL**: `/api/profiles`
**Auth**: Required (Bearer Token). Only `is_admin=True` users can perform write operations.

### Endpoints

| Method | Endpoint | Description | Permissions |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List all profiles | Authenticated Users |
| `GET` | `/{id}` | Get profile details | Authenticated Users |
| `POST` | `/` | Create a new profile | Admin Only |
| `POST` | `/{id}/clone` | Clone a profile | Admin Only |
| `PUT` | `/{id}` | Update a profile | Admin Only |
| `DELETE` | `/{id}` | Delete a profile | Admin Only |

### Example Payloads

**Create Profile**
```json
POST /api/profiles/
{
  "name": "Light-Filled Sheets",
  "description": "For sheets marked with light pencil",
  "config_json": {
    "bubble_detection": {
      "darkness_empty_threshold": 0.35,
      "grid_density_min_threshold": 10.0
    }
  },
  "is_default": false
}
```

**Clone Profile**
```
POST /api/profiles/1/clone?new_name=Light-Filled%20v2
```

## 3. Frontend Implementation Guide

This section is for the frontend team to implement the OMR Profile Management UI.

### UI Requirements

#### 1. Profile List View
-   **Table Columns**: ID, Name, Description, Is Default, Created At, Actions.
-   **Actions**:
    -   **Edit**: Open modal/page to edit.
    -   **Clone**: Button to clone (prompt for new name).
    -   **Delete**: Button to delete (show confirmation, disable if `is_default` or used).
-   **Create Button**: "New Profile" button to open create form.

#### 2. Create/Edit Form
-   **Fields**:
    -   **Name**: Text input (required, unique).
    -   **Description**: Text area (optional).
    -   **Configuration**: JSON Editor (monaco-editor or similar).
        -   *Tip*: Provide validation or a "Format JSON" button.
    -   **Is Default**: Checkbox (careful with this, usually only one should be default).

#### 3. Batch Upload Integration
-   **Upload Modal**: Add a "Processing Profile" dropdown.
-   **Data Source**: Fetch list from `GET /api/profiles`.
-   **Default Selection**: Select the profile where `is_default=true` (or "Default System Config" if none).

### Key Logic
-   **Cloning**: When clicking "Clone", prompt the user for a `new_name` immediately, then call `POST /api/profiles/{id}/clone?new_name=...`. Then redirect to the Edit page for the new profile.
-   **Validation**: Ensure the JSON entered in the configuration field is valid JSON before submitting.
-   **Error Handling**: Handle 400 errors (e.g., "Name already exists") gracefully by showing a toast notification.
