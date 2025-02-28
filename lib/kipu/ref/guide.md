# KIPU API Documentation

**Base URL:** `https://api.kipuapi.com`

Kipu will provide the following credentials:
- **access_id:** `[YOUR_ACCESS_ID]`
- **secret_key:** `[YOUR_SECRET_KEY]`
- **app_id (recipient_id):** `[YOUR_APP_ID]`

---

## Authentication & Headers

Every request **requires** an encoded signature (HMAC SHA-1).  
All API requests must include these HTTP headers:

### For POST Requests:
- **Accept:** `application/vnd.kipusystems+json; version=3`  
  (Constant value.)
- **Date:** The current date/time in RFC 822 / RFC 1123 format  
  *(e.g., `Wed, 06 Nov 2019 15:38:34 GMT`)*
- **Authorization:** `APIAuth <access_id>:<signature>`  
  **Note:** There is a space between `APIAuth` and your access_id.  
  *Example:*  
  `APIAuth 8s6lf46sG7UkIco9zIPM1S0VdoYSexampleauthJAn0:vIu4TeSNSA3kv/OlTO68oSExIEo=`
- **Content-Type:** Either  
  - `application/json` **or**  
  - `multipart/form-data; boundary=BOUNDARY`  
    *(Where BOUNDARY is a string of your choice.)*
- **Content-MD5:** A 24-character Base64 encoded MD5 digest of the request body  
  *(e.g., `VpofNeoRAzRvCD/YjO1mSw==`)*

### For GET Requests:
- **Accept:** `application/vnd.kipusystems+json; version=3`
- **Date:** Current date/time in RFC 822 / RFC 1123 format
- **Authorization:** `APIAuth <access_id>:<signature>`

---

## Calculating the Encoded Signature

1. **Build a canonical string.**  
   The structure and sequence is *strict*.

   - **POST Requests:**  
     ```
     Content-Type,Content-MD5,request_uri,Date
 ```
   - **GET Requests:**  
     ```
     ,,request_uri,Date
     ```
   **Important Notes:**
   - There are no spaces before or after commas.
   - For GET requests, the two leading commas are required.
   - For GET requests, the `request_uri` must include all query parameters (prefixed by `?` and separated by `&`). 
   **Examples:**

 - *POST Example:*  
 ```
     application/json,VpofNeoRAzRvCD/YjO1mSw==,/api/patients,Wed, 06 Nov 2019 15:38:34 GMT
     ```
   - *GET Example:*  
     ```
     ,,/api/patients/census?phi_level=high&app_id=[YOUR_APP_ID],Thu,07 Nov 2019 20:08:59 GMT
     ``` 
2. **Create an HMAC SHA-1 encrypted hash.**  
   Use your `secret_key` and the canonical string to generate the HMAC SHA-1 hash.  
   *(For example, in JavaScript using CryptoJS:)*

   ```javascript
   const hmac = CryptoJS.HmacSHA1(canonicalString, secretKey);`` 

3.  **Perform strict Base64 encoding.**  
    Base64 encode the HMAC hash.  
    _(Example in JavaScript using CryptoJS:)_
    
    javascript
    
    Copy
    
    `const signature = CryptoJS.enc.Base64.stringify(hmac);` 
    

----------

## Request URI

Your request URI should include:

-   The full request path (e.g., `/api/patients/census`)
-   All query parameters (e.g., `?app_id=[YOUR_APP_ID]&phi_level=high`)

Example:

bash

Copy

`/api/patients/census?app_id=[YOUR_APP_ID]&phi_level=high` 

----------

## Patient POST with File Upload / Attachment

When the request body includes file attachments (using `attachments_attributes`), note the following:

-   **Supported attachment types:** PDF and JPEG.

### Attachment Attributes:

-   **Client ID image:**  
    `attachment_name: patient_patient_id_image`
    
-   **Client profile picture:**  
    `attachment_name: patient_image`
    
-   **Front of an Insurance Card:**
    
    -   `attachment_name: insurance_image`
    -   `origin_id: [MATCH_INSURANCE_RECORD_ORIGIN_ID]`
-   **Back of an Insurance Card:**
    
    -   `attachment_name: insurance_insurance_card_image`
    -   `origin_id: [MATCH_INSURANCE_RECORD_ORIGIN_ID]`
-   **Generic attachments:**  
    _Do not include the `attachment_name` attribute._
    
-   **Patient evaluation attachments:**
    
    -   `attachment_evaluation_item_id: [EVALUATION_ITEM_ID]`
    -   `attachment_name: patient_evaluation_item`
    -   `origin_id: [MATCH_PATIENT_EVALUATION_RECORD_ORIGIN_ID]`

_To specify a process tab for a generic attachment, first obtain the process tab ID via the GET Patient Process endpoint and include it as:_

-   `attachment_patient_process_id: [PROCESS_TAB_ID]`

### Example Multipart POST Request:

lua

Copy

`--MultipartBoundary
Content-Disposition: form-data; name="document[recipient_id]"

[KIPU_SUPPLIED_RECIPIENT_ID]
--MultipartBoundary
Content-Disposition: form-data; name="document[data][first_name]"

John
--MultipartBoundary
Content-Disposition: form-data; name="document[data][last_name]"

Doe
--MultipartBoundary
Content-Disposition: form-data; name="document[data][dob]"

1909-09-09
--MultipartBoundary
Content-Disposition: form-data; name="document[data][insurances_attributes][0][insurance_company]"

Sample Insurance Company
...
--MultipartBoundary--` 

----------

## Response Codes

Code

Text

Description

200

OK

Successful GET request.

201

Created

Successful POST request where a record was created.

400

Bad Request

The request was invalid or cannot be served.

401

Unauthorized

Authentication signature was missing or incorrect.

403

Forbidden

Request understood, but access is not allowed.

404

Not Found

The URI is invalid or the resource doesn’t exist.

410

Gone

The resource is gone.

422

Not Processable Entity

Returned when an attachment cannot be processed.

500

Server Error

Something is broken.

502

Bad Gateway

Kipu API services are down or being upgraded.

503

Service Unavailable

The service is overloaded with requests.

504

Gateway Timeout

The request couldn’t be serviced due to internal stack failures.

----------

## Special Considerations

-   **PATCH Requests:**  
    Salesforce does not allow PATCH requests with binary data.  
    **Workaround:**
    
    -   Use a POST request instead.
    -   Add the header `X-HTTP-Method-Override` with the value `PATCH`.
-   **Date Header Issues:**  
    If the Date header is forbidden by your client, use `X-Auth-Date` instead.
    

----------

## Available Endpoints
see:  /lib/kipu/endpoints.json

----------

## Schemas

The following schema names are provided as placeholders. Replace them with detailed schema definitions as needed:

-   `patient_colors_map`
-   `consent_form_record_base`
-   `rfc822`
-   `main_user_object`
-   `casefile`
-   `restricted_patients_map`
-   `days_of_the_week`
-   `glucose_log_object`
-   `contact_person_object`
-   `selected_billing_code`
-   `orthostatic_vital_sign_object`
-   `appointments_map`
-   `roles_map`
-   `cow_object`
-   `accepted_response`
-   `with_locations`
-   `role_object`
-   `patient_tag_object`
-   `patient_order_object`
-   `scheduler_appointment_object`
-   `vital_sign_object`
-   `with_restricted_patients`
-   `pagination_object`
-   `patient_colors_object`
-   `settings_map`
-   `delivered_response`
-   `share_response`
-   `users_map`
-   `timestamp`
-   `patient_basic_info_object`
-   `patient_order_with_schedules_object`
-   `settings_object`
-   `patient_settings_map`
-   `with_roles`
-   `patient_evaluation_item_base`
-   `consent_form_record_extended`
-   `uuid`
-   `patient_evaluation_field_type_enum`
-   `ciwa_b_object`
-   `user_object`
-   `evaluation_item_object`
-   `contact_object`
-   `full_user_object`
-   `restricted_patient_object`
-   `evaluation_items_map`
-   `error_response`
-   `patient_evaluation_item`
-   `locations_map`
-   `ciwa_ar_object`
-   `patient_tags_map`
-   `nullable_datetime`

----