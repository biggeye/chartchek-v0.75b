# Template Store (Zustand) Specification

This document outlines the implementation and functionality of the `templateStore` (located at `/store/templateStore.ts`). The store manages ChartChek templates and provides functions to fetch, retrieve, create, update, and delete templates via API endpoints.

---

## Overview

The `templateStore` is responsible for:
- Maintaining a list of templates.
- Tracking loading and error states during asynchronous operations.
- Interacting with API endpoints to perform CRUD operations on templates.

---

## State Structure

The store maintains the following key state properties:
- **`templates`**: An array of `ChartChekTemplate` objects.
- **`isLoading`**: A boolean indicating whether a template-related operation is in progress.
- **`error`**: A string holding error messages, if any.

---

## Key Functions and Actions

### 1. Fetching Templates

- **`fetchTemplates()`**  
  **Description:** Retrieves all templates from the `/api/admin/templates` endpoint.  
  **Behavior:**  
  - Sets the `isLoading` state to `true` and clears any previous errors.
  - On success, updates the `templates` array with the fetched data and sets `isLoading` to `false`.
  - On failure, updates the `error` state and sets `isLoading` to `false`.

### 2. Retrieving a Specific Template

- **`getTemplate(id: string): Promise<ChartChekTemplate | null>`**  
  **Description:** Retrieves a single template by its ID from the `/api/admin/templates/{id}` endpoint.  
  **Behavior:**  
  - Sets the loading state while fetching.
  - Returns the template data if successful; otherwise, returns `null` and updates the error state.

### 3. Creating a New Template

- **`createTemplate(template: ChartChekTemplate): Promise<void>`**  
  **Description:** Creates a new template by sending a POST request to `/api/admin/templates`.  
  **Behavior:**  
  - Sets the loading state and clears errors.
  - On success, appends the new template to the existing `templates` array.
  - Handles errors by updating the error state.

### 4. Saving (Updating) a Template

- **`saveTemplate(template: ChartChekTemplate): Promise<void>`**  
  **Description:** Updates an existing template by sending a PUT request to `/api/admin/templates/{template.id}`.  
  **Behavior:**  
  - Sets the loading state and clears errors.
  - On success, updates the corresponding template in the `templates` array.
  - Handles errors by updating the error state.

### 5. Deleting a Template

- **`deleteTemplate(id: string): Promise<void>`**  
  **Description:** Deletes a template by sending a DELETE request to `/api/admin/templates/{id}`.  
  **Behavior:**  
  - Sets the loading state and clears errors.
  - On success, removes the template from the `templates` array.
  - Handles errors by updating the error state.

---

## Usage Example

Below is an example of how you might interact with the `templateStore` in your application:

```typescript
import { useTemplateStore } from '@/store/templateStore';

// Fetch templates on component mount
useTemplateStore.getState().fetchTemplates()
  .then(() => {
    console.log('Templates fetched:', useTemplateStore.getState().templates);
  })
  .catch(error => {
    console.error('Error fetching templates:', error);
  });

// Get a specific template by ID
useTemplateStore.getState().getTemplate('template123')
  .then(template => {
    if (template) {
      console.log('Retrieved template:', template);
    } else {
      console.log('Template not found');
    }
  });

// Create a new template
const newTemplate = {
  id: 'new_template',
  // ...other template properties
};
useTemplateStore.getState().createTemplate(newTemplate)
  .then(() => {
    console.log('Template created successfully');
  })
  .catch(error => {
    console.error('Error creating template:', error);
  });

// Update an existing template
const updatedTemplate = {
  id: 'template123',
  // ...updated properties
};
useTemplateStore.getState().saveTemplate(updatedTemplate)
  .then(() => {
    console.log('Template updated successfully');
  })
  .catch(error => {
    console.error('Error updating template:', error);
  });

// Delete a template
useTemplateStore.getState().deleteTemplate('template123')
  .then(() => {
    console.log('Template deleted successfully');
  })
  .catch(error => {
    console.error('Error deleting template:', error);
  });
