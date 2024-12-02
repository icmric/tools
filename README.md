# Directus API Tools Endpoint
This is a custom API endpoint for directus which allows for generic API calls to be prepared and used by more specialised 'tools' which are used to define more specific funcions using the generic API calls 

# THIS PACKAGE IS NO LONGER SUPORTED, SEE CURRENTLY SUPORTED VERSION [HERE}(https://github.com/icmric/api-automations/tree/main)

# Data Structure

**NOTES**
* API endpoint is accesable at /tools/(tool name)
* If the variable within {} is not found, it will be returned unaltered
* When acsessing an array within {}, acsess location using dot notation rather than square brackets (USE Array.0.value NOT Array[0].value) 

### API Response

* Entire Response: {apiResponse}

### URL

* Entire URL: {$url}
* JSON of URL querys: {$url.query}
* Specific query: {$url.QueryName}

### Tool

* Main Field of Tool: {$tool.main}

### Extra Values
NOTE Variables CAN be added to the extra values and will be converted before use

* All Extra Values: {extraValues}
* Specific Value: {extraValues.ValueName}

### Accountability

* All Accountability Fields: {reqAccountability}
* User: {reqAccountability.user}
* User Role: {reqAccountability.role}
* Admin (T/F): {reqAccountability.admin}
* User IP: {reqAccountability.ip}
* User Permissions (Array): _reqAccountability.permissions}

# API Calls (Generics) layout

![image](https://github.com/user-attachments/assets/03db4e5f-c8ed-4970-a04b-7bd27ffa641c)

![image](https://github.com/user-attachments/assets/3326ae5a-dda4-439c-a856-7fa5f43c6922)
Example Request and Transform for openAI API

### Fields

* Title: Identifier for the API (Input - String)
* Description: Description field for the API (TextArea - Text)
* Method: API Request Method (GET and POST are tested and known to work) (Dropdown)
* URL: API URL (Input - String)
* Header: Defines the header(s) to be sent with the request (Repeater - JSON - key (string) - value (string))
* Request: Request field of the API call (code - JSON)
* Transform: Defines the structure of the returned data, returns entire raw response if left blank (code - JSON)

# API Parents (tools)

![image](https://github.com/user-attachments/assets/4f0473eb-5111-47c3-874e-c05f37c6c0b2)

### Fields

* Title: Identifier for the Tool (name used in URL) (Input - String)
* API: Relation to define which API the tool uses (Relation - Many To One)
  * ![image](https://github.com/user-attachments/assets/cb855c46-006b-491b-bcd3-c9ffa425b90f)
* Description: Description field for the Tool (TextArea - Text)
* Main: Where the main query is written (TextArea - Text)
* ExtraValues: Extra values which can be used anywhere in the Tool or Generic (Repeater - JSON - key (string) - value (string))

# Example Usage
## API Calls (Generic)
![image](https://github.com/user-attachments/assets/1ac578da-3b5d-4ba8-acdd-254a51ba3fcb)
![image](https://github.com/user-attachments/assets/81c0ed12-1ba1-41bc-9313-79dccd926635)

## API Parents (Tools)
![image](https://github.com/user-attachments/assets/8aaaecb4-ec5f-4947-93e0-250d53f6b0cb)
![image](https://github.com/user-attachments/assets/d2cbc42e-ff27-409b-bf00-08370eb9198e)

