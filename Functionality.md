

### **1\. Events Board (Tournament Management Hub)**

**Core Objective:**  
Provide a centralized interface for administrators to create new tournaments, transition them from draft to active status, and manage the complete athlete roster and registration lifecycle.

**Essential Capabilities Required:**

* **Event Lifecycle Management:**  
  * Users must be able to create a new event.  
  * Events must start in a "Draft" state where specifications can be edited.  
  * Users must be able to officially "Activate" or "Publish" an event to open it for registrations.  
  * Users must be able to archive past events.  
      
* **Event Discovery & Navigation:**  
  * A grid or list view separating Active, Draft, and Archived events.  
  * Global search (by name, ID, location) and filtering (by sport, level, status) to easily locate specific tournaments.  
      
* **Athlete Roster Management (Inside an Event):**  
    
  * Administrators must be able to manually register a new fighter into the event.  
  * The roster must clearly separate athletes into logical buckets: **Approved**, **Pending Approval**, and **Validation Issues** (e.g., weight/age mismatches).  
  * Bulk actions must be supported (e.g., Exporting the full roster list).

**Core Business Rules & Constraints:**

* **State Dependency:** An event in a "Draft" state cannot accept fighter registrations. Registration capabilities must only unlock once the event is marked "Active."  
    
* **Approval Workflow:** All incoming athlete registrations must land in a "Pending" state until an authorized admin explicitly approves them, moving them to the "Approved" roster.  
    
* **Data Persistence:** Any athlete registered must immediately persist in the database and appear in the roster without data loss upon page navigation.

### **2\. All Events (Event Overview)**

**Core Objective:** Provide a comprehensive, high-level tabular overview of all created tournaments across the platform, filtered dynamically by the logged-in user's geographic jurisdiction and assigned administrative roles.

**Essential Capabilities Required:**

* **Event Directory (Tabular View):** Present a structured data table listing all accessible events. The table must display key data points including Event Name, Event ID, Location, Date, Status (e.g., Draft, Registration Open), the user's specific Role in that event, and an Action trigger (e.g., "VIEW").  
    
* **Search & Discovery:** Include a global search bar to allow users to quickly locate specific events.  
    
* **Filtering & Sorting:** Provide dropdown filters (such as filtering by Status) and sorting capabilities (such as Sort by Event Name) to help users manage and organize large lists of events.  
    
* **Data Export:** Provide an "EXPORT TO EXCEL" function at the top level to allow administrators to download the filtered list of events for offline reporting or analysis.  
    
* **Pagination:** Handle large datasets gracefully using paginated results at the bottom of the table (e.g., displaying entry counts and Previous/Next controls).

**Core Business Rules & Constraints:**

* **Role-Based Access Visibility:** The data populated in this table must be strictly filtered based on the logged-in user's system permissions. A user should only see events that fall under their specific jurisdiction (e.g., Country Admin sees their country's events) or to which they have been explicitly assigned a role.  
* **Read-Only & Navigation Intent:** Unlike the Events Board (which is for creation and lifecycle management), this tab serves primarily for reporting, oversight, and quick navigation. The "VIEW" action should simply route the user into the respective event's dashboard rather than allowing inline table edits.

### **3\. User Accounts (System & Access Management)**

**Core Objective:** Provide a centralized directory for authorized administrators to create, view, and manage platform users, including the assignment of specific administrative roles and geographic jurisdictions.

**Essential Capabilities Required:**

* **User Directory Table:** The interface must present a structured grid displaying all registered users with distinct columns for User Name, Email & Phone, Assigned Role, Jurisdiction, Status, and Actions.  
* **User Account Creation:** A primary **"+ ADD ACCOUNT"** button must be available to allow administrators to instantiate new user profiles and assign them the necessary access levels.  
* **Search and Sort Options:**

  * The directory must include a robust search bar capable of querying accounts by name, email, role, or region.  
      
  * A sorting dropdown (e.g., sorting by "Name") must be provided to organize the list.  
      
* **Inline Account Management:** Each user record must feature quick-action icons—an edit (pencil) button to modify profile details or role assignments, and a delete (trash) button to remove or deactivate an account.  
    
* **Data Export & Refresh:** The tab must include an **"EXPORT"** button to download the user list for reporting, alongside a manual refresh control to fetch the latest directory data.

**Core Business Rules & Constraints:**

* **Role & Jurisdiction Mapping:** The system must strictly bind the user's Assigned Role (e.g., Country Admin L0, State Head L1, District Head L2) to a valid logical Jurisdiction (e.g., specific country, state, or district) to ensure proper data isolation.  
* **Hierarchy Enforcement (RBAC):** When creating or editing an account, an administrator must only be permitted to assign roles and geographic jurisdictions that fall under or are equal to their own authorization level.

* **Persistence & Visibility:** Newly created users must persist in the database and immediately appear within this directory view.

### **4\. Role & Jurisdiction Management**

**Core Objective:** Provide a secure, administrative interface to define system roles, assign granular permissions, and establish the hierarchical access architecture (scopes) that governs the entire platform.

**Essential Capabilities Required:**

* **Role Definitions View:** The system must display a clear overview of all configured roles (e.g., Super Admin, Country Admin, State Head). Each role profile must highlight its assigned hierarchy level, unique system ID, and its geographical scope (e.g., Global Scope, Country Scope, State Scope).  
    
* **Granular Permission Mapping:** Administrators must be able to view and modify the exact system actions authorized for each role using a granular permission matrix (e.g., enabling event.create, user.edit, template.view, etc.).  
* **Custom/Child Role Creation:** The interface must provide an action (e.g., "+ CREATE CHILD ROLE") to instantiate new, specialized sub-roles derived from existing access tiers to support custom administrative workflows.  
    
* **Role Modification:** Authorized users must be able to edit existing roles to dynamically adjust their granted permissions and operational scopes.


**Core Business Rules & Constraints:**

* **Hierarchical Constraints (Parent-Subset):** The backend must enforce strict hierarchical logic; a newly created "Child Role" cannot be granted permissions that exceed the authority of its parent role.  
* **Scope Enforcement:** Permissions must be rigidly bound to the role's defined jurisdiction scope. For example, a role with a "State Scope" cannot execute actions that affect data at a "Country" or "Global" level.  
    
* **Delegation Control:** The system must explicitly track and enforce whether a specific role has the authority to delegate its permissions (e.g., "Can Delegate Sub-Roles: YES/NO") to users below them in the hierarchy.  
    
* **System Role Protection:** Core, hardcoded roles (marked as "SYSTEM") should be protected from accidental deletion to maintain baseline platform stability.

### **5\. Organization Chart**

**Core Objective:** Provide a read-only, visual hierarchy tree representing the distribution of platform users across geographic jurisdictions and administrative roles.

**Essential Capabilities Required:**

* **Visual Hierarchy Representation:** The interface must render a node-based tree map that groups users by their assigned geographic tiers (e.g., Country, State, District). Individual nodes must display the region name, the total count of admins within that jurisdiction, and basic user cards detailing avatar, name, and email.  
    
* **Summary Metrics (KPIs):** The dashboard must display high-level KPI counters summarizing the total user count across the platform, broken down by specific tier classifications (e.g., Total Users, Country, State, District, Standard).  
    
* **Search and Filtering:** Administrators must be able to query the chart using a search input field capable of matching by name, email, phone, or jurisdiction. A dropdown filter must also be available to isolate the tree map by specific roles.  
    
* **Canvas Navigation Controls:** To handle large organizational structures, the visualization canvas must support horizontal and vertical scrolling. Floating zoom controls (zoom in, zoom out, reset) and a global "Collapse" toggle must be provided to manipulate the tree view.


**Core Business Rules & Constraints:**

* **Strictly Read-Only Context:** This interface serves purely as a data visualization and reporting tool. No account creation, deletion, or role modifications should be executed from this tab; those actions belong strictly to the User Accounts tab.  
    
* **Dynamic Data Binding:** The hierarchy tree must be generated dynamically by querying the backend for active user accounts and mapping them strictly to their assigned jurisdiction levels.  
    
* **Role-Based Visibility (RBAC):** The structural tree rendered must inherently respect the logged-in administrator's geographic scope (e.g., a State Admin should only be able to visualize the hierarchy tree from their specific state downwards, rather than the entire global organization).

### **6\. Form Templates (Registration Schemas)**

**Core Objective:** Serve as a schema builder and central repository for athlete registration forms. This module allows administrators to define, manage, and preview the specific data collection structures (e.g., required fields, age categories, weight classes) that will be enforced when registering fighters for a tournament.

**Essential Capabilities Required:**

* **Template Directory:** The system must display a grid or directory of all available form templates, clearly identifying each with metadata such as Template Name, Sport category (e.g., Sambo), and visual badges indicating the template type (e.g., "CUSTOM" or "PRESET").  
* **Template Creation & Inheritance:** A "+ Create Template" action must launch a setup workflow where the user selects the "Template Type". The system must support an inheritance model, allowing the user to either start from "Scratch (Blank)" or select a "Base Preset Template" to build upon.  
* **Form Preview Generation:** Each template card must feature a "VIEW FORM" button. This action must render a read-only preview of the exact "Register New Athlete" modal (displaying fields like Athlete Full Name, Date of Birth, Age Category, and Weight Group Division) to show administrators exactly what data will be collected.  
    
* **Template Lifecycle Management:** The interface must provide inline actions to edit (via a "Continue to Builder" flow), delete, or manage the active status of the templates.


**Core Business Rules & Constraints:**

* **Immutability of Presets:** The system must strictly enforce the difference between template types. "Preset Templates" act as canonical base standards for official sports and **cannot be edited once created**. "Custom Templates" are flexible and remain editable for specific event requirements.  
* **Inheritance Logic:** If a user creates a new template by extending a "Base Preset Template," the system must pull in all standard sport fields as a read-only foundation, preventing core structural changes while allowing custom additions.  
    
* **Event Dependency (Cross-Module Logic):** These templates are the architectural foundation for the Events Board. When an event is created, it must be bound to one of these templates. That selected template dictates the exact input fields and validation rules rendered when a user clicks "+ REGISTER FIGHTER" inside that specific event.

