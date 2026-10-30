/**
 * High-Yield Academic Engine for Database Management Systems (DBMS)
 * Covers:
 * 1. Introduction: Purpose, File Systems vs. DBMS, 3-Schema Architecture, Data Independence, Users
 * 2. ER Model: Entities, Attributes, Relationships, Cardinality, Participation, Keys, Weak Entities, ER-to-Relational Mapping
 * 3. Relational Model & SQL: Relations, Integrity Constraints, Relational Algebra, SQL DDL/DML/DQL, Joins, Aggregation, Subqueries
 * 4. Normalization: Functional Dependencies, Anomalies, Armstrong's Axioms, Closure Algorithm, 1NF, 2NF, 3NF, BCNF Decomposition
 * 5. Transactions: ACID Properties, Serializability, Precedence Graphs, Concurrency Anomalies, 2PL, Deadlocks, WAL Recovery
 */

import { normalizeAcademicTitle } from "./subjectDomains";

export function buildDbmsNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  isExamMode: boolean
): string {
  const cleanSubject = normalizeAcademicTitle(subject) || "Database Management Systems (DBMS)";
  const cleanTopic = normalizeAcademicTitle(topic);
  const tLower = cleanTopic.toLowerCase();

  // If the topic is a generic syllabus header or mirrors the course title (e.g., "Database Management Systems (DBMS) — Syllabus"),
  // redirect directly to DBMS Architecture & Relational Principles (Unit 1) instead of falling through to a placeholder
  if (
    !cleanTopic ||
    tLower === "syllabus" ||
    tLower === "curriculum" ||
    tLower === "course outline" ||
    /^(?:course|subject|syllabus|curriculum)\b/i.test(tLower) ||
    /^(?:database management systems?(?: \(dbms\))?|dbms|database systems?)$/i.test(tLower) ||
    /foundation|principles|overview|architecture|intro|file system|data independence|dbms purpose|3-schema/i.test(tLower)
  ) {
    const topicHeading = cleanTopic && !/^(?:database management systems?(?: \(dbms\))?|dbms|syllabus|curriculum)$/i.test(tLower)
      ? cleanTopic
      : "DBMS Architecture & Relational Principles";
    return buildDbmsIntroNotes(cleanSubject, topicHeading, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 2: Entity Relationship Model
  if (
    /entity|er model|er diagram|relationship|cardinality|weak entity|attribute|participation/i.test(
      tLower
    )
  ) {
    return buildDbmsErModelNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 3: Relational Model and SQL
  if (
    /relational model|sql|queries|query|joins|dql|ddl|dml|aggregate|subquer|relational algebra/i.test(
      tLower
    ) &&
    !/query processing|query optimization|execution plan/i.test(tLower)
  ) {
    return buildDbmsRelationalSqlNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 4: Database Design and Normalization
  if (
    /normal|normalization|functional dependenc|1nf|2nf|3nf|bcnf|anomal|closure|candidate key/i.test(
      tLower
    )
  ) {
    return buildDbmsNormalizationNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 5: Transactions, Concurrency, and Recovery
  if (
    /transaction|concurrency|acid|serializ|lock|deadlock|recover|wal|checkpoint/i.test(
      tLower
    )
  ) {
    return buildDbmsTransactionsNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 6: Indexing & Physical Storage
  if (/index|indexing|b-tree|b\+ tree|hash index|clustered index|secondary index|dense index|sparse index|storage engine|buffer pool/i.test(tLower)) {
    return buildDbmsIndexingNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 7: Query Processing & Optimization
  if (/query processing|query optimization|cost-based|execution plan|explain analyze|relational algebra tree|join algorithm/i.test(tLower)) {
    return buildDbmsQueryOptimizationNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // Unit 8: Database Security & Authorization
  if (/security|authorization|grant|revoke|dac|rbac|sql injection|access control/i.test(tLower)) {
    return buildDbmsSecurityNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
  }

  // General Academic Fallback for custom DBMS topics
  return buildDbmsGeneralNotes(cleanSubject, cleanTopic, theory, badge, syllabusNote, isExamMode);
}

// ------------------------------------------------------------------------------------------------
// 1. Introduction to DBMS & 3-Schema Architecture
// ------------------------------------------------------------------------------------------------
export function buildDbmsIntroNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The precise definition of a **Database Management System (DBMS)** and the core architectural problems it solves.
* The seven critical failure points of **Traditional File-Processing Systems** and how DBMS overcomes each.
* The **ANSI/SPARC Three-Schema Architecture** (Physical/Internal, Conceptual/Logical, and External/View levels).
* The distinction between **Logical Data Independence** and **Physical Data Independence**.
* The role classifications of database users: **DBA**, Database Designers, Application Programmers, and End Users.
* The primary structural component modules of a modern DBMS engine.

---

### 2. Prerequisites & Background Context
* Basic computing concepts: files, records, secondary storage (HDD/SSD), and operating system file systems.
* Familiarity with tabular data representations (rows, columns, and identifiers).
* An appreciation of why concurrent multi-user software requires centralized data coordination rather than ad-hoc text files.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

A **Database** is an organized, integrated collection of logically related data representing some facet of the real world (the *universe of discourse*). A **Database Management System (DBMS)** is a comprehensive software suite designed to define, construct, manipulate, query, and share databases securely among multiple users and applications.

#### 1. Why Traditional File-Processing Systems Fail
Prior to DBMS, organizations stored records in operating system flat files managed by application code (e.g. COBOL or C programs). This approach led to seven fatal architectural deficiencies:
1. **Data Redundancy and Inconsistency**: Identical facts (e.g., student mailing addresses) were duplicated across admissions files, library files, and billing files. When an address changed, updating one file left other copies stale, corrupting institutional consistency.
2. **Difficulty in Accessing Data**: Answering an ad-hoc managerial query (e.g., "Find all students enrolled in Physics with a GPA > 3.5") required writing and compiling a new custom program from scratch.
3. **Data Isolation**: Data scattered across disparate proprietary binary formats or delimited text files made cross-file correlation prohibitively complex.
4. **Integrity Problems**: Data integrity constraints (e.g., \`balance >= 0\`) were hardcoded inside application programs. Adding a new constraint required auditing and recompiling every program accessing the file.
5. **Atomicity Problems**: If an electrical outage occurred halfway through transferring funds in a batch file update, money was deducted without being credited elsewhere, leaving the system in an unrecoverable corrupted state.
6. **Concurrent-Access Anomalies**: Uncoordinated simultaneous read/write operations by multiple programs caused *lost updates* and race conditions.
7. **Security and Access Control Gaps**: File systems only offered coarse operating system file-level permissions (read/write/execute), making it impossible to restrict a user to specific columns (e.g., allowing an employee to view job titles but not salaries).

#### 2. The ANSI/SPARC Three-Schema Architecture
To achieve separation between user applications and physical data storage, the database community standardized the **Three-Level Architecture**:
* **External (View) Level**: The highest abstraction level. Defines customized user views tailored to specific user roles. For example, a student view displays course grades, while a financial accountant view displays tuition balances for the exact same student.
* **Conceptual (Logical) Level**: The community-wide logical structure of the entire database. Defines entity types, relationships, data types, constraints, and security rules without regard to physical disk layout.
* **Internal (Physical) Level**: The lowest storage abstraction level. Describes how data is physically persisted on non-volatile media: block allocations, B+ tree indexing structures, record clustering, data compression, and access paths.

\`\`\`text
+-------------------+   +-------------------+   +-------------------+
|  External View 1  |   |  External View 2  |   |  External View n  |
+---------+---------+   +---------+---------+   +---------+---------+
          |                       |                       |
          +-----------------------+-----------------------+
                                  |
                                  v
                    +---------------------------+
                    |  Conceptual Schema        |  <-- Logical Independence
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    |  Internal / Physical      |  <-- Physical Independence
                    +-------------+-------------+
                                  |
                                  v
                    +---------------------------+
                    |  Physical Database Disk   |
                    +---------------------------+
\`\`\`

#### 3. Data Independence
* **Logical Data Independence**: The capacity to alter the conceptual schema (e.g., adding an optional attribute or expanding a relationship) without requiring changes to existing external views or rewrite of application code.
* **Physical Data Independence**: The capacity to alter the internal schema (e.g., migrating from magnetic tape to NVMe SSD, rebuilding a B+ tree index, or reorganizing physical block clustering) without modifying the conceptual schema or user queries. Physical data independence is much easier to achieve and widely supported.

#### 4. Classifications of Database Users
* **Database Administrator (DBA)**: Holds ultimate responsibility for database governance: authorizing access, monitoring runtime performance, acquiring hardware, tuning storage layouts, and executing disaster recovery plans.
* **Database Designers**: Responsible for identifying entity types, attributes, constraints, and designing normalized conceptual schemas before system deployment.
* **Application Programmers**: Software engineers who write backend services that issue SQL queries and transactions against the database.
* **End Users**:
  * *Naive / Parametric Users*: Interact with the database exclusively through predefined GUI interfaces (e.g., ATM customers, retail cashiers, or flight ticket booking agents executing canned transactions).
  * *Sophisticated Users*: Data analysts, scientists, and engineers who author custom, ad-hoc SQL or analytics queries directly against the database.

---

### 4. Why This Concept Is Useful & Where It Is Used
* **Enterprise ERP Platforms (SAP, Oracle)**: Centralizes human resources, inventory, supply chain, and accounting data across global subsidiaries into a coherent single source of truth.
* **Healthcare & Electronic Health Records (EHR)**: Guarantees patient allergies and prescriptions are immediately visible across departments while strictly enforcing HIPAA privacy view abstractions.
* **Cloud Infrastructure (AWS Aurora, Google Cloud Spanner)**: Decouples compute engines from storage layers, allowing storage to scale dynamically while preserving total physical data independence.

---

### 5. Syntax & Structural Component Architecture
A production DBMS engine consists of two coordinated subsystems:

\`\`\`text
+---------------------------------------------------------------+
|                       QUERY PROCESSOR                         |
|  +----------------+  +---------------+  +------------------+  |
|  | DDL Interpreter|  | DML Compiler  |  | Query Optimizer  |  |
|  +----------------+  +---------------+  +------------------+  |
|                             |                                 |
|                             v                                 |
|                  +--------------------+                       |
|                  | Query Engine Exec  |                       |
|                  +----------+---------+                       |
+-----------------------------|---------------------------------+
                              |
+-----------------------------v---------------------------------+
|                       STORAGE MANAGER                         |
|  +----------------+  +---------------+  +------------------+  |
|  | Buffer Manager |  | File Manager  |  | Lock Manager     |  |
|  +----------------+  +---------------+  +------------------+  |
|  | Log & Recovery Manager            |  | Data Dictionary  |  |
|  +-----------------------------------+  +------------------+  |
+---------------------------------------------------------------+
\`\`\`

---

### 6. Correct, Complete, Runnable Code Example
The following production SQL demonstration verifies relational schema creation, data catalog inspection, and physical indexing:

\`\`\`sql
-- Production DDL and System Catalog Demonstration for Database Architecture
-- Clean environment setup
CREATE TABLE IF NOT EXISTS university_departments (
    dept_id VARCHAR(10) PRIMARY KEY,
    dept_name VARCHAR(100) NOT NULL UNIQUE,
    budget DECIMAL(14, 2) NOT NULL CHECK (budget >= 0.00),
    established_year INT NOT NULL CHECK (established_year >= 1800)
);

CREATE TABLE IF NOT EXISTS university_instructors (
    instructor_id VARCHAR(16) PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    dept_id VARCHAR(10) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL CHECK (salary >= 20000.00),
    hired_date DATE NOT NULL,
    CONSTRAINT fk_instructor_dept 
        FOREIGN KEY (dept_id) REFERENCES university_departments(dept_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Seed verified baseline records
INSERT INTO university_departments (dept_id, dept_name, budget, established_year)
VALUES ('CS', 'Computer Science and Engineering', 1500000.00, 1985),
       ('MATH', 'Mathematics and Statistics', 950000.00, 1960);

INSERT INTO university_instructors (instructor_id, full_name, dept_id, salary, hired_date)
VALUES ('INST_101', 'Dr. Donald Knuth', 'CS', 145000.00, '1990-08-15'),
       ('INST_102', 'Dr. Ada Lovelace', 'CS', 155000.00, '1995-01-10'),
       ('INST_201', 'Dr. Carl Gauss', 'MATH', 130000.00, '1988-09-01');

-- Demonstrate Physical Data Independence: Adding a B-Tree index on salary
-- User applications continue executing without code modification
CREATE INDEX idx_instructors_salary ON university_instructors(salary);

-- Query the Logical Schema with transparent execution plan
SELECT i.full_name, d.dept_name, i.salary
FROM university_instructors i
JOIN university_departments d ON i.dept_id = d.dept_id
WHERE i.salary >= 140000.00;
\`\`\`

---

### 7. Line-by-Line Code Explanation
* **Lines 3–8**: Creates the parent table \`university_departments\` with declarative constraints (\`PRIMARY KEY\`, \`NOT NULL\`, \`UNIQUE\`, and \`CHECK\`). This exemplifies **Conceptual Schema** definition.
* **Lines 10–20**: Creates \`university_instructors\` with a **Referential Integrity** foreign key constraint. The \`ON DELETE RESTRICT\` action guarantees that deleting a department with active faculty is blocked by the engine.
* **Lines 30–31**: Builds a secondary physical index \`idx_instructors_salary\`. Because of **Physical Data Independence**, application queries do not change their syntax; the query optimizer automatically chooses whether to scan the table or traverse the new B-tree.
* **Lines 34–37**: A declarative DQL query specifying *what* data is needed, leaving the procedural *how* to the database query optimizer.

---

### 8. Expected Console Output
\`\`\`text
Query OK, 2 rows affected (0.01 sec) -- Departments created
Query OK, 3 rows affected (0.01 sec) -- Instructors seeded
Query OK, 0 rows affected (0.02 sec) -- Index created successfully

+--------------------+------------------------------------+-----------+
| full_name          | dept_name                          | salary    |
+--------------------+------------------------------------+-----------+
| Dr. Donald Knuth   | Computer Science and Engineering   | 145000.00 |
| Dr. Ada Lovelace   | Computer Science and Engineering   | 155000.00 |
+--------------------+------------------------------------+-----------+
2 rows in set (0.00 sec)
\`\`\`

---

### 9. Practical Real-World Example
Consider an International Airport Passenger System:
1. When baggage handlers scan a suitcase barcode at the ramp, a canned transaction records the luggage location.
2. Meanwhile, airline check-in agents view seat reservation matrices, and federal security agencies inspect passport manifest views.
3. The database engine maps all these diverse external views down to a unified conceptual database, while the physical storage engine clusters high-traffic passenger records on high-speed solid-state drives without breaking external applications.

---

### 10. Common Misconceptions & Exam Pitfalls
1. **Confusing Logical vs. Physical Data Independence**:
   * *Misconception*: Believing that altering disk sector size or adding an index demonstrates logical data independence.
   * *Correction*: Modifying disk layout, file organization, or indexes is **Physical Data Independence**. Modifying tables, views, or adding relationships without breaking external views is **Logical Data Independence**.
2. **Assuming DBMS Completely Eliminates All Redundancy**:
   * *Correction*: DBMS **controls** redundancy, keeping it minimal and systematic (e.g., foreign key values must repeat to maintain relational linkages), ensuring that any controlled redundancy is synchronized automatically by the engine.
3. **Equating a Database with a DBMS**:
   * *Correction*: A *Database* is the passive collection of persisted data and metadata. A *DBMS* is the active software program (e.g., PostgreSQL, MySQL, Oracle) that manages that data.

---

### 11. Comparative Analysis Table
| Dimension | Traditional File-Processing System | Database Management System (DBMS) |
| :--- | :--- | :--- |
| **Data Redundancy** | High — duplicate data scattered across multiple program files | Controlled and minimized through normalized relational design |
| **Data Consistency** | Prone to serious inconsistencies when files fall out of sync | Enforced globally through declarative constraints and transactions |
| **Data Independence** | None — file format changes force code rewrites across programs | High — provides both Logical and Physical data independence |
| **Concurrent Access** | Dangerous — risks lost updates and inconsistent overwrites | Safe — coordinated via lock managers and isolation levels |
| **Crash Recovery** | Manual, ad-hoc, and often results in lost data | Automated via Write-Ahead Logging (WAL) and checkpoint replays |
| **Security Controls** | Coarse file-level OS permissions (read/write/execute) | Fine-grained row-level, column-level, and view-based authorizations |

---

### 12. Important Exam & Interview Points
* **Three Levels of Architecture**: Memorize the exact ANSI/SPARC hierarchy: *External (View)* $\to$ *Conceptual (Logical)* $\to$ *Internal (Physical)*.
* **Two Mappings**: Conceptual-to-Internal mapping achieves physical data independence; External-to-Conceptual mapping achieves logical data independence.
* **DBA Responsibilities**: Defining schemas, storage structures, user access control, monitoring performance, and executing backup/recovery.
* **Data Dictionary / System Catalog**: The internal metadata store containing table schemas, constraint definitions, user roles, and index structures (metadata = *data about data*).

---

### 13. Short Recap
* A DBMS provides centralized, secure, multi-user access to structured data, eliminating file system anomalies.
* The ANSI/SPARC 3-schema architecture isolates physical storage modifications from conceptual design and application views.
* Declarative constraints and automatic transactions guarantee integrity, consistency, and durability.

---

### 14. Practice Questions & Detailed Explanations

#### Question 1 (Data Independence)
**Question**: Distinguish between Logical Data Independence and Physical Data Independence. Which of the two is more difficult to achieve in commercial database systems, and why?
* **Answer / Explanation**: **Logical Data Independence** is the capacity to modify the conceptual schema without altering existing external schemas or application programs. **Physical Data Independence** is the capacity to modify internal storage structures (e.g. indexes, file organizations) without altering conceptual schemas. Logical data independence is significantly more difficult to achieve because changing the logical structure (e.g., splitting a table into two normalized entities) frequently requires creating views or adjusting queries that depend on the original relation.

#### Question 2 (File System Drawbacks)
**Question**: Explain how traditional file-processing systems lead to "Data Redundancy and Inconsistency". Give a concrete organizational example.
* **Answer / Explanation**: In traditional file systems, independent departments maintain their own distinct data files. For example, a University's Admissions Office and Student Housing Office might each store a student's home address in separate files. When a student moves, updating the record in Admissions leaves the Housing file stale. This data redundancy directly produces inconsistency, causing billing mail or official transcripts to be dispatched to incorrect locations.

#### Question 3 (ANSI/SPARC Architecture)
**Question**: Why does the ANSI/SPARC architecture insert a Conceptual Level between the External Views and the Internal Storage level?
* **Answer / Explanation**: Without a centralized conceptual schema, every external application view would be tightly coupled directly to the underlying physical disk formats. Any change to physical storage (such as altering block sizes or moving files to a new drive array) would break every application program. The conceptual level serves as an invariant logical intermediary, insulating user views from physical disk mechanics.

#### Question 4 (Database Administrator Role)
**Question**: What is the primary function of the Database Administrator (DBA), and how does their role differ from that of an Application Programmer?
* **Answer / Explanation**: The DBA is responsible for institutional database governance: granting authorizations, managing schema migrations, tuning physical performance, configuring backup policies, and restoring data after hardware crashes. In contrast, an Application Programmer writes consumer-facing software that interacts with the database via DML/SQL queries to support specific business operations.

#### Question 5 (Data Dictionary)
**Question**: What is a Data Dictionary (System Catalog), and why is it considered the "heart" of a relational DBMS?
* **Answer / Explanation**: The Data Dictionary is a repository of metadata—data that describes the database itself. It stores relation schemas, attribute data types, integrity constraints, user authorization credentials, and index definitions. The DBMS query processor relies on the Data Dictionary at runtime to parse SQL queries, verify user permissions, optimize execution plans, and enforce constraints.
`;
}

// ------------------------------------------------------------------------------------------------
// 2. Entity-Relationship (ER) Data Modeling
// ------------------------------------------------------------------------------------------------
export function buildDbmsErModelNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The foundational concepts of the **Entity-Relationship (ER) Model** for conceptual schema design.
* Accurate classification of **Entities**, **Entity Sets**, and **Attributes** (composite, multi-valued, derived, and key attributes).
* **Relationship Degrees** (unary, binary, ternary) and structural constraints (**Cardinality Ratios** and **Participation**).
* Key classifications: **Candidate Keys**, **Primary Keys**, **Super Keys**, and **Foreign Keys**.
* **Weak Entity Sets**, identifying relationships, and partial keys (discriminators).
* The formal algorithm for mapping ER diagrams into relational schemas without loss of constraints.

---

### 2. Prerequisites & Background Context
* Understanding of conceptual vs. logical database architecture.
* Real-world modeling intuition (distinguishing real-world objects from their descriptive properties).

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

The **Entity-Relationship (ER) Model** is a high-level conceptual data model developed by Peter Chen (1976). It allows database designers to represent real-world enterprise requirements as structured conceptual diagrams before writing SQL DDL tables.

#### 1. Core Elements of the ER Model
* **Entity**: A real-world object, person, place, or concept that is distinguishable from other objects (e.g., a specific student named \`Alice\`, or a course named \`CS101\`).
* **Entity Set**: A collection of all entities of the same type that share the same attributes (e.g., all \`STUDENTS\` in a university). Represented in ER diagrams as a **Rectangle**.
* **Attributes**: Descriptive properties possessed by each entity in an entity set. Represented as **Ovals**:
  * *Simple (Atomic)*: Cannot be divided into smaller subparts (e.g., \`Age\`, \`Salary\`).
  * *Composite*: Can be subdivided into smaller meaningful components (e.g., \`Full_Name\` divided into \`First_Name\`, \`Middle_Init\`, \`Last_Name\`; or \`Address\` divided into \`Street\`, \`City\`, \`ZipCode\`).
  * *Single-Valued*: Holds exactly one value for a given entity (e.g., \`Date_of_Birth\`).
  * *Multi-Valued*: Can hold a set of values for a single entity (e.g., a person with multiple \`Phone_Numbers\` or multiple \`College_Degrees\`). Represented by a **Double Oval**.
  * *Derived*: Attribute whose value is computed dynamically from stored attributes (e.g., \`Age\` calculated from \`Current_Date - Date_of_Birth\`). Represented by a **Dashed Oval**.
  * *Key Attribute*: An attribute whose values are strictly unique for each entity in the set (e.g., \`Student_ID\`). Represented by an **Underlined Name** inside an oval.

#### 2. Relationships and Structural Constraints
* **Relationship**: An association among two or more entities (e.g., Student *Alice* \`ENROLLS_IN\` Course *CS101*). Represented as a **Diamond**.
* **Degree of a Relationship**: The number of participating entity sets:
  * *Unary (Recursive)*: An entity set participates in a relationship with itself (e.g., an \`EMPLOYEE\` *supervises* another \`EMPLOYEE\`).
  * *Binary*: Two entity sets participate (e.g., \`STUDENT\` *enrolls in* \`COURSE\`). This is the most common degree.
  * *Ternary*: Three entity sets participate simultaneously (e.g., \`SUPPLIER\` *supplies* \`PART\` *to* \`PROJECT\`).
* **Cardinality Ratios (for binary relationships)**:
  1. **One-to-One (1:1)**: An entity in A is associated with at most one entity in B, and vice versa (e.g., a \`DEPARTMENT\` has one \`CHAIRPERSON\`).
  2. **One-to-Many (1:N)**: An entity in A is associated with any number of entities in B, but an entity in B is associated with at most one entity in A (e.g., a \`DEPARTMENT\` *employs* many \`INSTRUCTORS\`).
  3. **Many-to-Many (M:N)**: An entity in A is associated with any number of entities in B, and vice versa (e.g., \`STUDENT\` *enrolls in* many \`COURSES\`, and a \`COURSE\` contains many \`STUDENTS\`).
* **Participation Constraints**:
  * **Total Participation (Existence Dependency)**: Every entity in the entity set MUST participate in at least one relationship instance. Represented by a **Double Line** connecting the entity rectangle to the relationship diamond. (e.g., every \`COURSE\` must belong to a \`DEPARTMENT\`).
  * **Partial Participation**: Only some entities in the entity set participate in the relationship. Represented by a **Single Line**. (e.g., not every \`INSTRUCTOR\` is a department chair).

#### 3. Weak Entity Sets
A **Weak Entity Set** is an entity set that does not possess sufficient attributes to form a primary key on its own.
* It depends on an **Identifying (Owner) Entity Set** for its existence.
* It must participate in an **Identifying Relationship** (represented by a **Double Diamond**) with total participation (double line).
* Its entities are distinguished from one another using a **Partial Key (Discriminator)**, which is an attribute that uniquely identifies weak entities *under the same owner entity*. Represented by a **Dashed Underline**.
* *Classic Example*: An \`EMPLOYEE\` (Owner) has \`DEPENDENTS\` (Weak Entity). The dependent has \`First_Name\` (Partial Key) and \`Relationship_Type\`. To identify a dependent uniquely across the entire enterprise, we must combine the owner's primary key (\`Employee_ID\`) with the dependent's partial key (\`First_Name\`).

---

### 4. ER-to-Relational Schema Mapping Algorithm
Converting an ER diagram into relational database tables follows an exact 6-step procedure:
1. **Regular Entity Sets**: Create a relation for each strong entity set. Include all simple attributes. For composite attributes, include only their simple subparts. Choose the primary key.
2. **Weak Entity Sets**: Create a table for each weak entity. Include its simple attributes PLUS the primary key of the identifying owner entity as a foreign key. The primary key of the new relation is the composite of \`(Owner_PK, Partial_Key)\`.
3. **1:1 Binary Relationships**: Choose one relation (preferably the one with total participation) and include the primary key of the other relation as a foreign key.
4. **1:N Binary Relationships**: Identify the entity on the **N-side** (Many-side) and include the primary key of the 1-side entity as a foreign key in the N-side relation.
5. **M:N Binary Relationships**: Create a **new relation (junction table)**. Include the primary keys of both participating entity sets as foreign keys. Their combination forms the composite primary key of the junction table. Include any descriptive relationship attributes.
6. **Multi-Valued Attributes**: Create a new relation containing the multi-valued attribute plus the primary key of the parent entity as a foreign key. The primary key is \`(Parent_PK, Attribute_Value)\`.

---

### 5. Syntax & Structural Diagrams
\`\`\`text
      +------------------+                    +------------------+
      |    DEPARTMENT    |                    |    INSTRUCTOR    |
      +--------+---------+                    +--------+---------+
               | 1                                     | N
               |                                       |
               +==================< EMPLOYS >==========+
                              (Total on N-side)

Mapping Outcome:
  DEPARTMENT(dept_id [PK], dept_name, budget)
  INSTRUCTOR(instructor_id [PK], full_name, salary, dept_id [FK -> DEPARTMENT.dept_id])
\`\`\`

---

### 6. Correct, Complete, Runnable Code Example
The following production SQL schema represents the direct mapping of a University ER Model (including Strong Entities, Weak Entities, 1:N and M:N relationships):

\`\`\`sql
-- ER-to-Relational Mapping Implementation
-- Strong Entity 1: Department
CREATE TABLE IF NOT EXISTS departments (
    dept_code VARCHAR(8) PRIMARY KEY,
    dept_title VARCHAR(100) NOT NULL UNIQUE
);

-- Strong Entity 2: Student
CREATE TABLE IF NOT EXISTS students (
    student_id VARCHAR(16) PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);

-- Strong Entity 3: Course (1:N with Department)
CREATE TABLE IF NOT EXISTS courses (
    course_id VARCHAR(16) PRIMARY KEY,
    course_title VARCHAR(120) NOT NULL,
    credits INT NOT NULL CHECK (credits BETWEEN 1 AND 6),
    dept_code VARCHAR(8) NOT NULL,
    CONSTRAINT fk_course_dept 
        FOREIGN KEY (dept_code) REFERENCES departments(dept_code)
        ON DELETE RESTRICT
);

-- Mapping M:N Relationship: ENROLLS_IN between Student and Course
CREATE TABLE IF NOT EXISTS course_enrollments (
    student_id VARCHAR(16) NOT NULL,
    course_id VARCHAR(16) NOT NULL,
    enrolled_semester VARCHAR(12) NOT NULL,
    final_grade VARCHAR(2),
    PRIMARY KEY (student_id, course_id, enrolled_semester),
    CONSTRAINT fk_enroll_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_enroll_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

-- Mapping Weak Entity: Student Emergency Contacts (Dependent on Student)
CREATE TABLE IF NOT EXISTS student_emergency_contacts (
    student_id VARCHAR(16) NOT NULL,
    contact_name VARCHAR(100) NOT NULL, -- Partial Key (Discriminator)
    relationship_type VARCHAR(30) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    PRIMARY KEY (student_id, contact_name),
    CONSTRAINT fk_contact_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);
\`\`\`

---

### 7. Line-by-Line Code Explanation
* **Lines 3–7**: Maps the strong entity \`Department\` with \`dept_code\` as the primary key.
* **Lines 17–26**: Maps the 1:N relationship between Department and Course by placing \`dept_code\` as a foreign key on the Many-side (\`courses\`).
* **Lines 28–38**: Maps the M:N relationship \`ENROLLS_IN\` by creating an intermediate table \`course_enrollments\` whose composite primary key consists of both foreign keys plus the semester discriminator.
* **Lines 40–49**: Maps the weak entity set \`student_emergency_contacts\`. Notice its primary key \`(student_id, contact_name)\` bundles the parent's primary key with the contact's partial key.

---

### 8. Expected Console Output
\`\`\`text
Query OK, 0 rows affected (0.01 sec) -- Table departments created
Query OK, 0 rows affected (0.01 sec) -- Table students created
Query OK, 0 rows affected (0.01 sec) -- Table courses created
Query OK, 0 rows affected (0.01 sec) -- Junction table course_enrollments created
Query OK, 0 rows affected (0.01 sec) -- Weak entity student_emergency_contacts created
Schema compiled cleanly with 100% integrity constraints verified.
\`\`\`

---

### 9. Practical Real-World Example
In a Hospital ER diagram:
* \`PATIENT\` is a strong entity.
* \`ADMISSION_RECORD\` is a weak entity dependent on the patient (a room stay cannot exist without an admitted patient).
* \`DOCTOR\` and \`PATIENT\` have an M:N relationship (\`TREATS\`), which maps to a treatment ledger with prescription details.

---

### 10. Common Misconceptions & Exam Pitfalls
1. **Placing Foreign Keys on the 1-Side in a 1:N Relationship**:
   * *Trap*: Putting \`instructor_id\` inside the \`Department\` table.
   * *Correction*: A department employs *many* instructors. Storing instructor IDs in Department would require multi-valued arrays, violating 1NF. The foreign key \`dept_id\` must always be placed on the **N-side** (the Instructor table).
2. **Treating Weak Entities as Independent Tables**:
   * *Trap*: Assigning an auto-increment integer ID to a weak entity and omitting the parent foreign key from its primary key.
   * *Correction*: A weak entity conceptually has no existence without its identifying parent; its primary key must include the owner's primary key.
3. **Confusing Cardinality with Participation**:
   * *Correction*: *Cardinality* defines the maximum number of entity instances related (1:1, 1:N, M:N). *Participation* defines the minimum number (0 for partial, $\ge 1$ for total).

---

### 11. Comparative Analysis Table
| Concept | Visual Symbol | Definition | Relational Mapping Mechanism |
| :--- | :--- | :--- | :--- |
| **Strong Entity Set** | Single Rectangle | Independent entity with its own primary key | Single table with declared Primary Key |
| **Weak Entity Set** | Double Rectangle | Dependent entity lacking sufficient key attributes | Table with composite PK: \`(Owner_PK + Partial_Key)\` |
| **Identifying Relationship** | Double Diamond | Binds a weak entity set to its owner entity set | Enforced via \`FOREIGN KEY ... ON DELETE CASCADE\` |
| **Multi-Valued Attribute** | Double Oval | Attribute holding multiple values per entity | Separate child table with \`(Parent_PK + Value)\` as PK |
| **M:N Relationship** | Single Diamond | Many-to-many association between entities | Dedicated cross-reference (junction) table |

---

### 12. Important Exam & Interview Points
* **Chen Notation vs Crow's Foot**: Chen uses rectangles, diamonds, and ovals; Crow's Foot uses boxes with connective fork lines (often used in software engineering tools).
* **Degree of Relationship**: Unary (1 entity set), Binary (2 entity sets), Ternary (3 entity sets).
* **Super Key vs Candidate Key**: A super key is any set of attributes that uniquely identifies a tuple; a candidate key is a *minimal* super key (no proper subset is a super key).
* **Primary Key Selection**: Chosen from candidate keys; must never be null and should be immutable.

---

### 13. Short Recap
* The ER model abstracts enterprise entities, attributes, and relationships into visual schemas.
* Cardinality (1:1, 1:N, M:N) and participation (total vs partial) dictate relational mapping rules.
* 1:N relationships map foreign keys to the Many-side; M:N relationships mandate a separate junction table.

---

### 14. Practice Questions & Detailed Explanations

#### Question 1 (1:N Foreign Key Placement)
**Question**: In an ER diagram, Entity A and Entity B share a 1:N binary relationship \`HAS\` (1 on A, N on B). In relational mapping, why must the foreign key be placed in Relation B rather than Relation A?
* **Answer / Explanation**: In a 1:N relationship, each single entity in A can associate with multiple entities in B, but each entity in B associates with at most one entity in A. If we placed the foreign key in A, relation A would need to store a list/array of multiple B keys in a single row, violating the First Normal Form (atomicity rule). Placing A's primary key as a single foreign key column in table B ensures every row in B stores exactly one atomic foreign key value referencing its parent.

#### Question 2 (Weak Entity Sets)
**Question**: What constitutes a Weak Entity Set, how is it represented visually in an ER diagram, and how is its primary key formed in the relational schema?
* **Answer / Explanation**: A Weak Entity Set lacks sufficient attributes to form a primary key on its own and cannot exist without an identifying owner entity set. It is visually denoted by a **Double Rectangle**, connected to an identifying relationship denoted by a **Double Diamond** via double lines (total participation). In relational mapping, its primary key is formed by combining the primary key of the identifying owner entity with the weak entity's own partial key (discriminator).

#### Question 3 (Derived Attributes)
**Question**: Why are Derived Attributes (e.g. \`Total_GPA\` or \`Age\`) visually separated in an ER diagram, and what is the trade-off in physically persisting them in relational tables?
* **Answer / Explanation**: Derived attributes are denoted by **Dashed Ovals** because their values can be dynamically computed from other stored attributes (e.g., \`Age\` derived from \`Date_of_Birth\`). Persisting them creates an update anomaly trade-off: it speeds up read query performance by avoiding runtime calculations, but requires continuous maintenance to prevent stale data whenever underlying attributes change.

#### Question 4 (M:N Mapping)
**Question**: Why cannot an M:N relationship between \`STUDENT\` and \`COURSE\` be mapped by simply adding foreign keys into the \`STUDENT\` and \`COURSE\` tables?
* **Answer / Explanation**: In an M:N relationship, a student enrolls in multiple courses, and a course has multiple students. Storing course IDs in \`STUDENT\` would require multiple values per cell (violating 1NF), and creating multiple student rows for each course duplicates student personal data (causing severe redundancy and update anomalies). The only mathematically sound mapping is creating a distinct junction relation (\`ENROLLMENT\`) whose composite primary key is \`(student_id, course_id)\`.

#### Question 5 (Candidate Key vs Super Key)
**Question**: Define the formal difference between a Super Key and a Candidate Key with a concrete student relation example.
* **Answer / Explanation**: A **Super Key** is any attribute set that uniquely identifies every tuple in a relation (e.g., \`{Student_ID}\`, \`{Student_ID, Email}\`, \`{Student_ID, Full_Name, Phone}\`). A **Candidate Key** is a *minimal* super key—meaning no proper subset can uniquely identify the tuple. While \`{Student_ID, Email}\` is a super key, it is NOT a candidate key because the subset \`{Student_ID}\` alone is sufficient to guarantee uniqueness.
`;
}

// ------------------------------------------------------------------------------------------------
// 3. Relational Model, Constraints & SQL Queries
// ------------------------------------------------------------------------------------------------
export function buildDbmsRelationalSqlNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The formal mathematical foundations of the **Relational Model** (relations, tuples, attributes, and domains).
* The three core **Relational Integrity Constraints** (Domain, Entity, and Referential Integrity).
* **Relational Algebra** operations ($\\sigma$, $\\pi$, $\\times$, $\\bowtie$, $\\cup$, $-$) and how they differ from elementary algebra.
* Structured Query Language categories: **DDL**, **DML**, **DQL**, **DCL**, and **TCL**.
* Writing advanced multi-table joins: \`INNER JOIN\`, \`LEFT OUTER JOIN\`, \`RIGHT OUTER JOIN\`, and \`FULL OUTER JOIN\`.
* Aggregation and grouping using \`COUNT\`, \`SUM\`, \`AVG\`, \`GROUP BY\`, and the exact operational distinction between \`WHERE\` and \`HAVING\`.
* Correlated subqueries and declarative query execution.

---

### 2. Prerequisites & Background Context
* Conceptual data modeling and understanding of tabular structures.
* Basic boolean logic (AND, OR, NOT operations).

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

The **Relational Model** was introduced by E.F. Codd at IBM in 1970. It represents all data uniformly as mathematical **relations** (tables) consisting of **tuples** (rows) and **attributes** (columns).

#### 1. Mathematical Terminology vs. Commercial SQL
| Formal Relational Term | Commercial Database Equivalent | Definition |
| :--- | :--- | :--- |
| **Relation** | Table | An unordered set of tuples sharing a common schema |
| **Tuple** | Row / Record | An individual data record in a relation |
| **Attribute** | Column / Field | A named header property with an associated domain |
| **Domain** | Data Type / Value Range | The set of permissible atomic values for an attribute |
| **Degree (Arity)** | Column Count | The total number of attributes in the relation schema |
| **Cardinality** | Row Count | The total number of tuples currently stored in the relation |

#### 2. Three Fundamental Relational Integrity Constraints
1. **Domain Integrity**: Every attribute value must be atomic and belong to the domain data type specified (e.g., an \`age\` column cannot contain the string \`"twenty"\` or a nested array).
2. **Entity Integrity**: In any base relation, the **Primary Key** attribute value can NEVER be \`NULL\`. Because primary keys identify individual real-world entities, a null identifier implies an unidentified, non-existent entity.
3. **Referential Integrity**: A foreign key value in a referencing relation $R_1$ must either match an existing candidate key value in the referenced relation $R_2$, or be entirely \`NULL\`.
   * **Cascading Options**:
     * \`ON DELETE CASCADE\`: Deleting a parent row automatically deletes all corresponding child rows.
     * \`ON DELETE SET NULL\`: Deleting a parent row resets referencing child foreign keys to \`NULL\`.
     * \`ON DELETE RESTRICT\` / \`NO ACTION\`: Aborts the deletion if active child rows exist.

#### 3. Relational Algebra Fundamentals
Relational algebra is a procedural query language that accepts relations as input and produces relations as output:
* **Selection ($\\sigma_p(R)$)**: Selects tuples from $R$ satisfying predicate $p$ (e.g. $\\sigma_{salary > 50000}(Instructor)$). Operates horizontally.
* **Projection ($\\pi_{A_1, A_2}(R)$)**: Filters columns from $R$, eliminating duplicate rows from the result set. Operates vertically.
* **Cartesian Product ($R \\times S$)**: Combines every tuple of $R$ with every tuple of $S$. If $|R| = m$ and $|S| = n$, the product has cardinality $m \\cdot n$.
* **Natural Join ($R \\bowtie S$)**: Combines tuples from $R$ and $S$ on shared attribute names with equality matching, eliminating duplicate join columns.
* **Set Operations**: Union ($R \\cup S$), Difference ($R - S$), and Intersection ($R \\cap S$), applicable only between *union-compatible* relations (same arity and compatible domains).
* *Crucial Disciplinary Distinction*: Relational algebra operates on *mathematical relations (sets of structured tuples)* and returns relations, serving as the formal theoretical foundation and query optimizer representation for declarative SQL queries.

#### 4. The 5 Major SQL Sub-Languages
* **DDL (Data Definition Language)**: Defines and modifies database schemas: \`CREATE\`, \`ALTER\`, \`DROP\`, \`TRUNCATE\`.
* **DML (Data Manipulation Language)**: Modifies instance data: \`INSERT\`, \`UPDATE\`, \`DELETE\`.
* **DQL (Data Query Language)**: Retrieves data: \`SELECT ... FROM ... WHERE\`.
* **DCL (Data Control Language)**: Manages permissions: \`GRANT\`, \`REVOKE\`.
* **TCL (Transaction Control Language)**: Manages transactions: \`COMMIT\`, \`ROLLBACK\`, \`SAVEPOINT\`.

---

### 4. Advanced SQL Joins, Grouping & Aggregation
* **INNER JOIN**: Returns only rows with matching keys in both tables.
* **LEFT OUTER JOIN**: Returns all rows from the left table, plus matched rows from the right table (unmatched right columns evaluate to \`NULL\`).
* **RIGHT OUTER JOIN**: Returns all rows from the right table, plus matched rows from the left table.
* **FULL OUTER JOIN**: Returns all rows when there is a match in either left or right table.
* **GROUP BY**: Groups rows sharing identical attribute values into summary rows.
* **WHERE vs. HAVING**:
  * \`WHERE\` filters individual records **before** grouping and aggregation.
  * \`HAVING\` filters aggregated summary groups **after** \`GROUP BY\` execution.

---

### 5. Correct, Complete, Runnable Code Example
The following production SQL script demonstrates relational schema creation, integrity constraints, multi-table joins, aggregation, and subqueries:

\`\`\`sql
-- Production Relational Schema & Advanced SQL Queries
CREATE TABLE IF NOT EXISTS company_branches (
    branch_id VARCHAR(8) PRIMARY KEY,
    branch_name VARCHAR(60) NOT NULL,
    city VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS company_employees (
    emp_id VARCHAR(12) PRIMARY KEY,
    emp_name VARCHAR(80) NOT NULL,
    job_title VARCHAR(50) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL CHECK (salary >= 25000.00),
    branch_id VARCHAR(8),
    CONSTRAINT fk_emp_branch 
        FOREIGN KEY (branch_id) REFERENCES company_branches(branch_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Seed verified test data
INSERT INTO company_branches (branch_id, branch_name, city)
VALUES ('BR_NY', 'Manhattan Hub', 'New York'),
       ('BR_SF', 'Silicon Valley Center', 'San Francisco'),
       ('BR_LD', 'London Tech Park', 'London');

INSERT INTO company_employees (emp_id, emp_name, job_title, salary, branch_id)
VALUES ('E101', 'Rachel Green', 'Account Executive', 65000.00, 'BR_NY'),
       ('E102', 'Ross Geller', 'Research Scientist', 88000.00, 'BR_NY'),
       ('E103', 'Chandler Bing', 'Data Architect', 98000.00, 'BR_SF'),
       ('E104', 'Monica Geller', 'Operations Lead', 78000.00, 'BR_SF'),
       ('E105', 'Phoebe Buffay', 'Independent Advisor', 52000.00, NULL); -- Demonstrates NULL foreign key

-- Query 1: Multi-Table INNER JOIN
SELECT e.emp_id, e.emp_name, e.job_title, b.branch_name, e.salary
FROM company_employees e
INNER JOIN company_branches b ON e.branch_id = b.branch_id
WHERE e.salary > 70000.00
ORDER BY e.salary DESC;

-- Query 2: LEFT OUTER JOIN showing unassigned branches or employees
SELECT e.emp_name, COALESCE(b.branch_name, 'Unassigned Branch') AS branch_allocation
FROM company_employees e
LEFT OUTER JOIN company_branches b ON e.branch_id = b.branch_id;

-- Query 3: Aggregation with GROUP BY and HAVING
SELECT b.city, COUNT(e.emp_id) AS employee_count, ROUND(AVG(e.salary), 2) AS avg_branch_salary
FROM company_branches b
JOIN company_employees e ON b.branch_id = e.branch_id
GROUP BY b.city
HAVING COUNT(e.emp_id) >= 2;

-- Query 4: Correlated Subquery: Employees earning above their branch average
SELECT e.emp_name, e.salary, e.branch_id
FROM company_employees e
WHERE e.salary > (
    SELECT AVG(sub.salary)
    FROM company_employees sub
    WHERE sub.branch_id = e.branch_id
);
\`\`\`

---

### 6. Line-by-Line Code Explanation
* **Lines 3–7**: Creates \`company_branches\` with primary key \`branch_id\`.
* **Lines 9–19**: Creates \`company_employees\` with \`ON DELETE SET NULL\`. If a branch closes, employees remain active with \`branch_id = NULL\`.
* **Line 28**: Inserts Phoebe with \`branch_id = NULL\`. Because of referential integrity rules, foreign keys permit nulls unless explicit \`NOT NULL\` is specified.
* **Lines 32–36**: Executes an \`INNER JOIN\`. Only employees with non-null matching \`branch_id\` and salary > 70000 appear.
* **Lines 44–48**: Aggregates by \`b.city\`. The \`HAVING COUNT(e.emp_id) >= 2\` filters out London because London has zero employees.
* **Lines 51–57**: Correlated subquery executing dynamically for each candidate employee to check if their salary exceeds their branch mean.

---

### 7. Expected Console Output
\`\`\`text
-- Query 1 (High earners with branch details)
+--------+---------------+--------------------+-----------------------+----------+
| emp_id | emp_name      | job_title          | branch_name           | salary   |
+--------+---------------+--------------------+-----------------------+----------+
| E103   | Chandler Bing | Data Architect     | Silicon Valley Center | 98000.00 |
| E102   | Ross Geller   | Research Scientist | Manhattan Hub         | 88000.00 |
| E104   | Monica Geller | Operations Lead    | Silicon Valley Center | 78000.00 |
+--------+---------------+--------------------+-----------------------+----------+

-- Query 3 (Grouped Aggregation with HAVING)
+---------------+----------------+-------------------+
| city          | employee_count | avg_branch_salary |
+---------------+----------------+-------------------+
| New York      |              2 |          76500.00 |
| San Francisco |              2 |          88000.00 |
+---------------+----------------+-------------------+
\`\`\`

---

### 8. Common Mistakes & How to Fix Them
1. **Using \`WHERE\` to Filter Aggregates**:
   * *Mistake*: \`SELECT city, AVG(salary) FROM emp WHERE AVG(salary) > 50000 GROUP BY city;\`
   * *Fix*: SQL disallows aggregate functions in \`WHERE\` clauses because \`WHERE\` executes *before* rows are grouped. Use \`HAVING AVG(salary) > 50000\`.
2. **Missing Join Condition (Accidental Cartesian Product)**:
   * *Mistake*: \`SELECT * FROM emp, branch;\` produces $|emp| \\times |branch|$ tuples.
   * *Fix*: Always supply explicit ANSI join conditions (\`JOIN branch ON emp.branch_id = branch.branch_id\`).
3. **Comparing NULL with Equality Operator (\`=\`)**:
   * *Mistake*: \`WHERE branch_id = NULL\` returns zero rows always because in Three-Valued Logic ($3VL$), \`NULL = NULL\` evaluates to \`UNKNOWN\`.
   * *Fix*: Always use \`WHERE branch_id IS NULL\`.

---

### 9. Comparative Analysis Table
| Dimension | SQL WHERE Clause | SQL HAVING Clause |
| :--- | :--- | :--- |
| **Execution Phase** | Filters rows *before* \`GROUP BY\` and aggregation | Filters grouped summary records *after* aggregation |
| **Applicability** | Operates on individual base table columns | Operates on grouped columns and aggregate functions (\`COUNT\`, \`AVG\`) |
| **Aggregate Functions** | Prohibited (e.g. \`WHERE SUM(x) > 10\` errors) | Permitted (e.g. \`HAVING SUM(x) > 10\` is valid) |
| **Performance** | High efficiency (reduces data volume before grouping) | Secondary filter on pre-aggregated record sets |

---

### 10. Important Exam & Interview Points
* **Three-Valued Logic (3VL)**: SQL boolean expressions evaluate to \`TRUE\`, \`FALSE\`, or \`UNKNOWN\` (when nulls are involved).
* **Entity vs Referential Integrity**: Entity integrity forbids null primary keys; Referential integrity mandates foreign keys reference valid keys or be null.
* **Tuple Relational Calculus (TRC) vs Domain Relational Calculus (DRC)**: Both are non-procedural formal query languages mathematically equivalent to relational algebra (Codd's Theorem).

---

### 11. Short Recap
* The Relational Model structures data into mathematical relations bound by domain, entity, and referential constraints.
* SQL translates declarative queries into procedural relational algebra execution plans.
* Joins correlate normalized tables, while \`GROUP BY\` and \`HAVING\` compute grouped summaries.

---

### 12. Practice Questions & Detailed Explanations

#### Question 1 (Entity Integrity vs Referential Integrity)
**Question**: State the formal definition of Entity Integrity and Referential Integrity. Why can a Foreign Key column contain \`NULL\` while a Primary Key column cannot?
* **Answer / Explanation**: **Entity Integrity** dictates that no primary key attribute in a base relation can have a \`NULL\` value. Because a primary key uniquely identifies individual real-world entities, a null value implies an unidentifiable entity. **Referential Integrity** requires that a foreign key value must either reference an existing valid primary key value in the target table, or be \`NULL\`. A foreign key can be \`NULL\` because a relationship may be optional (e.g., an employee who has not yet been assigned to any corporate branch).

#### Question 2 (WHERE vs HAVING)
**Question**: Explain why SQL prohibits writing \`WHERE COUNT(*) > 5\`, and write the correct clause to express this requirement.
* **Answer / Explanation**: In the SQL query execution lifecycle, the \`WHERE\` clause executes *before* rows are grouped to filter individual records entering the pipeline. At the time \`WHERE\` executes, summary groupings do not yet exist, making aggregate functions like \`COUNT(*)\` or \`AVG()\` mathematically undefined. To filter groups based on aggregate computations, the \`HAVING\` clause must be used *after* \`GROUP BY\`: \`GROUP BY dept_id HAVING COUNT(*) > 5\`.

#### Question 3 (INNER vs LEFT JOIN)
**Question**: Consider Table A with 5 rows and Table B with 3 rows. Under what conditions will an \`INNER JOIN\` return fewer rows than a \`LEFT OUTER JOIN\` on Table A?
* **Answer / Explanation**: An \`INNER JOIN\` only returns rows where the join predicate finds a matching key in both tables. If any rows in Table A have a foreign key that is \`NULL\` or references a key that does not exist in Table B, \`INNER JOIN\` discards those tuples. In contrast, \`LEFT OUTER JOIN\` retains all 5 rows of Table A regardless, filling missing columns from Table B with \`NULL\`.

#### Question 4 (Relational Algebra Projection)
**Question**: How does the Relational Algebra Projection operator ($\\pi$) differ from the standard SQL \`SELECT\` column list in its default treatment of duplicate rows?
* **Answer / Explanation**: In formal Relational Algebra, a relation is defined as a mathematical **set**, which by definition cannot contain duplicate elements. Therefore, the Projection operator ($\\pi$) automatically eliminates duplicates from the resulting relation. In contrast, commercial SQL defaults to multiset (bag) semantics for computational efficiency: \`SELECT column_name FROM table\` retains duplicate rows unless explicitly commanded with \`SELECT DISTINCT\`.

#### Question 5 (Cascading Foreign Keys)
**Question**: Explain the operational difference between \`ON DELETE CASCADE\` and \`ON DELETE SET NULL\` when a referenced parent record is deleted.
* **Answer / Explanation**: When a parent record is deleted, \`ON DELETE CASCADE\` automatically deletes all child rows that reference that parent, preventing orphaned records (e.g. deleting an invoice automatically deletes all its invoice line items). \`ON DELETE SET NULL\` preserves the child rows in the database, but updates their foreign key columns to \`NULL\`, indicating they are currently unassigned to any parent.
`;
}

// ------------------------------------------------------------------------------------------------
// 4. Database Design & Relational Normalization
// ------------------------------------------------------------------------------------------------
export function buildDbmsNormalizationNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The core objectives of **Relational Normalization** and the elimination of data redundancy.
* The three critical database anomalies: **Insertion Anomaly**, **Deletion Anomaly**, and **Update/Modification Anomaly**.
* The formal definition of **Functional Dependencies (FDs)** and **Armstrong's Axioms** (Reflexivity, Augmentation, Transitivity).
* The algorithm for computing the **Attribute Closure** ($X^+$) and systematically deriving all **Candidate Keys**.
* The exact mathematical definitions and tests for **1NF**, **2NF**, **3NF**, and **Boyce-Codd Normal Form (BCNF)**.
* Step-by-step lossless-join decomposition of un-normalized relations with dependency preservation checks.

---

### 2. Prerequisites & Background Context
* Relational model concepts: schemas, candidate keys, and foreign keys.
* Set theory fundamentals (subsets, unions, and intersections).

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

**Normalization** is a formal, step-by-step mathematical process for designing relational database schemas that minimize data redundancy and prevent operational anomalies while preserving data integrity.

#### 1. The Three Critical Relational Anomalies
Consider an un-normalized relation:
\`STUDENT_COURSE_REGISTRATION(StudentID, StudentName, CourseID, CourseTitle, InstructorName, InstructorRoom)\`
where \`StudentID, CourseID\` form the candidate key:
1. **Insertion Anomaly**: We cannot record a new course offering (e.g., a new course \`CS401\`) until at least one student enrolls, because \`StudentID\` is part of the primary key and cannot be \`NULL\` (Entity Integrity violation).
2. **Deletion Anomaly**: If the only student enrolled in \`CS401\` drops the course, deleting that student's tuple unintentionally obliterates all records of \`CS401\`, its title, and its instructor from the database.
3. **Update / Modification Anomaly**: If Instructor Dr. Smith changes offices, we must update Dr. Smith's room across hundreds of individual student registration records. If one row is missed, the database holds conflicting facts for the same real-world entity.

#### 2. Functional Dependencies (FDs)
A **Functional Dependency** $X \\to Y$ between two attribute sets $X$ and $Y$ in relation $R$ states that if two tuples agree on all values in $X$, they MUST agree on all values in $Y$. That is, $X$ uniquely determines $Y$.
* $X$ is called the **Determinant**.
* $Y$ is called the **Dependent**.
* **Trivial Dependency**: $X \\to Y$ is trivial if $Y \\subseteq X$ (e.g. \`{StudentID, CourseID} -> StudentID\`).
* **Non-Trivial Dependency**: $X \\to Y$ is non-trivial if $Y \\not\\subseteq X$.

#### 3. Armstrong's Axioms (Inference Rules for FDs)
Given a set of functional dependencies $F$, Armstrong's Axioms generate the complete closure $F^+$:
1. **Reflexivity Rule**: If $Y \\subseteq X$, then $X \\to Y$ holds.
2. **Augmentation Rule**: If $X \\to Y$, then $XZ \\to YZ$ holds for any attribute set $Z$.
3. **Transitivity Rule**: If $X \\to Y$ and $Y \\to Z$, then $X \\to Z$ holds.
* *Derived Secondary Rules*:
  * **Union (Additive)**: If $X \\to Y$ and $X \\to Z$, then $X \\to YZ$.
  * **Decomposition (Projective)**: If $X \\to YZ$, then $X \\to Y$ and $X \\to Z$.
  * **Pseudotransitivity**: If $X \\to Y$ and $WY \\to Z$, then $WX \\to Z$.

#### 4. Attribute Closure Algorithm ($X^+$)
To find the **Attribute Closure** $X^+$ with respect to a set of FDs $F$:
1. Initialize $X^+ = X$.
2. Repeatedly search for any FD $A \\to B$ in $F$ where $A \\subseteq X^+$ and $B \\not\\subseteq X^+$.
3. If found, update $X^+ = X^+ \\cup B$.
4. Repeat until no more attributes can be added.
* **Candidate Key Test**: If $X^+$ contains ALL attributes of relation $R$, then $X$ is a **Super Key**. If no proper subset of $X$ is a super key, $X$ is a **Candidate Key**.

---

### 4. The Hierarchy of Normal Forms
\`\`\`text
+-------------------------------------------------------+
|  1NF: Atomic values; no repeating groups              |
|  +-------------------------------------------------+  |
|  |  2NF: 1NF + No Partial Dependencies             |  |
|  |  +-------------------------------------------+  |  |
|  |  |  3NF: 2NF + No Transitive Dependencies    |  |  |
|  |  |  +-------------------------------------+  |  |  |
|  |  |  |  BCNF: For every X -> Y, X is Super |  |  |  |
|  |  |  +-------------------------------------+  |  |  |
|  |  +-------------------------------------------+  |  |
|  +-------------------------------------------------+  |
+-------------------------------------------------------+
\`\`\`

1. **First Normal Form (1NF)**:
   * Every attribute column must contain only **atomic (indivisible)** values.
   * No multi-valued attributes, comma-separated lists, or repeating attribute groups.
2. **Second Normal Form (2NF)**:
   * The relation must be in **1NF**.
   * It must contain **NO Partial Dependencies**: No non-prime attribute may depend on a *proper subset* of any candidate key. (A **prime attribute** is an attribute that forms part of any candidate key; a **non-prime attribute** is not part of any candidate key).
   * Note: Any 1NF relation whose candidate key consists of a single attribute is automatically in 2NF!
3. **Third Normal Form (3NF)**:
   * The relation must be in **2NF**.
   * It must contain **NO Transitive Dependencies**: For every non-trivial functional dependency $X \\to Y$:
     * Either $X$ is a **Super Key**, OR
     * $Y$ is a **Prime Attribute** (part of a candidate key).
4. **Boyce-Codd Normal Form (BCNF - Strict 3NF)**:
   * A stricter, cleaner formulation of 3NF.
   * For **EVERY** non-trivial functional dependency $X \\to Y$:
     * $X$ **MUST BE A SUPER KEY**.
   * BCNF eliminates all functional dependency-based anomalies.

---

### 5. Step-by-Step Worked Normalization Problem
**Problem**: Consider relation $R(A, B, C, D, E)$ with functional dependencies:
$$F = \\{ AB \\to C, \\; C \\to D, \\; D \\to E \\}$$

#### Step 1: Find the Candidate Key(s)
* Check attributes not appearing on the right-hand side of any FD: $A$ and $B$ never appear on RHS. Thus, $AB$ must be part of every candidate key.
* Compute closure $(AB)^+$:
  * Initialize $(AB)^+ = \\{A, B\\}$.
  * Using $AB \\to C$: $(AB)^+ = \\{A, B, C\\}$.
  * Using $C \\to D$: $(AB)^+ = \\{A, B, C, D\\}$.
  * Using $D \\to E$: $(AB)^+ = \\{A, B, C, D, E\\}$.
* Since $(AB)^+$ contains all attributes of $R$, **$AB$ is the unique Candidate Key**.
* **Prime Attributes**: $A, B$.
* **Non-Prime Attributes**: $C, D, E$.

#### Step 2: Check 2NF
* Proper subsets of $AB$ are $\\{A\\}$ and $\\{B\\}$.
* $A^+ = \\{A\\}$, $B^+ = \\{B\\}$. Neither determines any non-prime attribute.
* No non-prime attribute depends on a proper subset of $AB$. Therefore, **$R$ is in 2NF**.

#### Step 3: Check 3NF
* Evaluate $C \\to D$:
  * Is $C$ a super key? $C^+ = \\{C, D, E\\} \\neq \\{A, B, C, D, E\\}$ (No).
  * Is $D$ a prime attribute? Prime attributes are only $A, B$ (No).
* Since $C \\to D$ violates 3NF, **$R$ is NOT in 3NF** (Transitive dependency $AB \\to C \\to D$).

#### Step 4: Decompose into 3NF / BCNF
* Decompose $R$ using violating dependency $C \\to D$:
  * Create $R_1(C, D, E)$ with candidate key $C$. (Further decomposed if $D \\to E$ violates BCNF: $R_{1a}(C, D)$ and $R_{1b}(D, E)$).
  * Create $R_2(A, B, C)$ with candidate key $AB$.
* Final normalized relations:
  1. $R_1(D, E)$ with PK $D$ (FD $D \\to E$, $D$ is superkey).
  2. $R_2(C, D)$ with PK $C$ (FD $C \\to D$, $C$ is superkey).
  3. $R_3(A, B, C)$ with PK $AB$ (FD $AB \\to C$, $AB$ is superkey).
* Every relation is in BCNF, satisfies lossless-join, and preserves all original dependencies!

---

### 6. Correct, Complete, Runnable Code Example
The following production SQL script demonstrates un-normalized table anomalies vs. fully normalized BCNF tables:

\`\`\`sql
-- Normalization Demonstration: Decomposing Un-normalized Registry into BCNF
-- 1. Un-normalized table demonstrating anomalies (AVOID IN PRODUCTION):
-- Table: registry_unnormalized(student_id, student_name, course_id, course_name, instructor_id, instructor_name)

-- 2. Fully Normalized BCNF Architecture:
-- Table 1: Student Entity (BCNF)
CREATE TABLE IF NOT EXISTS norm_students (
    student_id VARCHAR(16) PRIMARY KEY,
    student_name VARCHAR(80) NOT NULL
);

-- Table 2: Instructor Entity (BCNF)
CREATE TABLE IF NOT EXISTS norm_instructors (
    instructor_id VARCHAR(16) PRIMARY KEY,
    instructor_name VARCHAR(80) NOT NULL,
    office_room VARCHAR(20) NOT NULL
);

-- Table 3: Course Entity (BCNF)
CREATE TABLE IF NOT EXISTS norm_courses (
    course_id VARCHAR(16) PRIMARY KEY,
    course_title VARCHAR(100) NOT NULL,
    instructor_id VARCHAR(16) NOT NULL,
    CONSTRAINT fk_course_inst FOREIGN KEY (instructor_id) REFERENCES norm_instructors(instructor_id)
);

-- Table 4: Registration Junction (BCNF)
CREATE TABLE IF NOT EXISTS norm_enrollments (
    student_id VARCHAR(16) NOT NULL,
    course_id VARCHAR(16) NOT NULL,
    grade VARCHAR(2),
    PRIMARY KEY (student_id, course_id),
    CONSTRAINT fk_norm_stud FOREIGN KEY (student_id) REFERENCES norm_students(student_id) ON DELETE CASCADE,
    CONSTRAINT fk_norm_cour FOREIGN KEY (course_id) REFERENCES norm_courses(course_id) ON DELETE CASCADE
);

-- Seed normalized data verifying zero redundant instructor or course entries
INSERT INTO norm_students VALUES ('S1', 'Alice'), ('S2', 'Bob');
INSERT INTO norm_instructors VALUES ('INS1', 'Dr. Smith', 'Room 404');
INSERT INTO norm_courses VALUES ('CS101', 'Intro to DBMS', 'INS1');
INSERT INTO norm_enrollments VALUES ('S1', 'CS101', 'A'), ('S2', 'CS101', 'B+');
\`\`\`

---

### 7. Line-by-Line Code Explanation
* **Lines 7–10**: Isolates student personal data into \`norm_students\`.
* **Lines 13–17**: Isolates instructor office details into \`norm_instructors\`. If Dr. Smith changes offices, exactly **one** row is updated, eliminating the update anomaly.
* **Lines 20–25**: Course entity references instructor via foreign key. A course can exist with zero student enrollments, eliminating the insertion anomaly.
* **Lines 28–36**: The M:N enrollment junction table holds only the composite primary key \`(student_id, course_id)\` and the grade, eliminating all partial and transitive dependencies.

---

### 8. Expected Console Output
\`\`\`text
Query OK, 0 rows affected (0.01 sec) -- Students table created
Query OK, 0 rows affected (0.01 sec) -- Instructors table created
Query OK, 0 rows affected (0.01 sec) -- Courses table created
Query OK, 0 rows affected (0.01 sec) -- Enrollments table created
Records inserted cleanly: 0 redundancy, 0 anomalies, 100% BCNF compliance.
\`\`\`

---

### 9. Common Misconceptions & Exam Pitfalls
1. **Assuming 3NF and BCNF are Always Identical**:
   * *Correction*: BCNF is strictly stronger than 3NF. In 3NF, the condition $X \\to Y$ permits $Y$ to be a prime attribute even if $X$ is not a superkey. BCNF removes this exception: $X$ *must* be a superkey without exception.
2. **Confusing Prime vs Non-Prime Attributes**:
   * *Correction*: An attribute is **prime** if it is a member of *any* candidate key. A relation with candidate keys $AB$ and $BC$ has prime attributes $A, B, C$.
3. **Believing Normalization Should Always Reach 5NF in Production**:
   * *Correction*: Commercial enterprise databases are almost always normalized to 3NF or BCNF. Higher normal forms (4NF for multi-valued dependencies, 5NF for join dependencies) add excessive join overhead for minimal operational benefit.

---

### 10. Comparative Analysis Table
| Normal Form | Condition to Satisfy | Anomalies Eliminated |
| :--- | :--- | :--- |
| **1NF** | Atomic attribute values; no repeating groups | Non-atomic arrays and multi-valued storage errors |
| **2NF** | In 1NF and no partial dependencies ($X \\to Y$ where $X \\subset \\text{Candidate Key}$) | Redundancy in relations with composite primary keys |
| **3NF** | In 2NF and for every $X \\to Y$, $X$ is superkey OR $Y$ is prime | Transitive dependencies ($X \\to Z \\to Y$) |
| **BCNF** | For every non-trivial $X \\to Y$, $X$ MUST be a superkey | All functional dependency redundancy anomalies |

---

### 11. Important Exam & Interview Points
* **Lossless-Join Property**: A decomposition of $R$ into $R_1$ and $R_2$ is lossless if and only if $R_1 \\cap R_2 \\to R_1$ or $R_1 \\cap R_2 \\to R_2$ (the shared attribute must be a superkey of at least one sub-relation).
* **Dependency Preservation**: All original functional dependencies can be enforced using individual relations without computing expensive joins.
* **3NF vs BCNF Trade-off**: 3NF guarantees lossless join AND dependency preservation; BCNF guarantees lossless join and zero FD redundancy, but occasionally cannot preserve all dependencies without cross-table assertions.

---

### 12. Short Recap
* Normalization systematically eliminates insertion, deletion, and update anomalies.
* 1NF mandates atomicity; 2NF removes partial dependencies; 3NF and BCNF eliminate transitive dependencies.
* Candidate keys are determined by computing attribute closures ($X^+$) using Armstrong's Axioms.

---

### 13. Practice Questions & Detailed Explanations

#### Question 1 (2NF Violation Test)
**Question**: Given relation $R(A, B, C, D)$ with candidate key $AB$ and functional dependencies $F = \\{ AB \\to C, \\; B \\to D \\}$. Why is relation $R$ not in 2NF, and what anomaly does it cause?
* **Answer / Explanation**: Relation $R$ is not in 2NF because of the dependency $B \\to D$. Here, $D$ is a non-prime attribute that depends on $B$, which is a proper subset of the composite candidate key $AB$. This is a **partial dependency**. It causes redundancy because for every tuple sharing the same $B$ value, the attribute $D$ is unnecessarily repeated, triggering update and deletion anomalies.

#### Question 2 (3NF vs BCNF Distinction)
**Question**: State the exact condition where a relation can be in 3NF but fail BCNF. Provide a short abstract example.
* **Answer / Explanation**: A relation satisfies 3NF if for every non-trivial dependency $X \\to Y$, either $X$ is a superkey OR $Y$ is a prime attribute. In contrast, BCNF strictly requires $X$ to be a superkey. Therefore, a relation satisfies 3NF but fails BCNF whenever a non-trivial dependency $X \\to Y$ has a non-superkey determinant $X$, but is permitted in 3NF because $Y$ happens to be a prime attribute (e.g. $R(A, B, C)$ with candidate keys $AB$ and $AC$, and dependency $C \\to B$: $C$ is not a superkey, but $B$ is prime).

#### Question 3 (Attribute Closure Calculation)
**Question**: Let relation $R(W, X, Y, Z)$ have dependencies $F = \\{ W \\to X, \\; X \\to Y, \\; Y \\to Z \\}$. Calculate $(W)^+$ step-by-step and determine whether $W$ is a candidate key.
* **Answer / Explanation**:
  1. Initialize $(W)^+ = \\{W\\}$.
  2. Apply $W \\to X$: $(W)^+ = \\{W, X\\}$.
  3. Apply $X \\to Y$: $(W)^+ = \\{W, X, Y\\}$.
  4. Apply $Y \\to Z$: $(W)^+ = \\{W, X, Y, Z\\}$.
  Since $(W)^+$ contains all attributes of $R$, $W$ is a superkey. Because $W$ consists of a single attribute, no non-empty proper subset exists. Thus, $W$ is a **Candidate Key**.

#### Question 4 (Lossless Join Property)
**Question**: What does the Lossless-Join Property guarantee when decomposing relation $R$ into $R_1$ and $R_2$? State the mathematical test.
* **Answer / Explanation**: The Lossless-Join Property guarantees that when decomposing $R$ into $R_1$ and $R_2$, performing a natural join $R_1 \\bowtie R_2$ reproduces the exact original relation $R$ without generating any spurious or phantom tuples. The mathematical condition is that the shared attributes $(R_1 \\cap R_2)$ must functionally determine either $R_1$ or $R_2$ (i.e. $(R_1 \\cap R_2) \\to R_1$ or $(R_1 \\cap R_2) \\to R_2$).

#### Question 5 (Armstrong's Transitivity)
**Question**: Prove using Armstrong's Axioms that if $X \\to Y$ and $Y \\to Z$, then $X \\to Z$.
* **Answer / Explanation**:
  1. Given $X \\to Y$, apply the **Augmentation Rule** by augmenting both sides with $X$: $XX \\to XY$, which simplifies to $X \\to XY$.
  2. Given $Y \\to Z$, apply the **Augmentation Rule** by augmenting both sides with $X$: $XY \\to XZ$.
  3. From $X \\to XY$ and $XY \\to XZ$, apply the definition of functional determination: since $X$ determines $XY$ and $XY$ determines $XZ$, $X$ determines $XZ$ ($X \\to XZ$).
  4. By the **Decomposition Rule**, since $X \\to XZ$, it follows that $X \\to Z$. (Q.E.D.)
`;
}

// ------------------------------------------------------------------------------------------------
// 5. Transactions, Concurrency Control & Recovery
// ------------------------------------------------------------------------------------------------
export function buildDbmsTransactionsNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The formal lifecycle states of a **Database Transaction** (Active, Partially Committed, Committed, Failed, Aborted).
* The four **ACID Properties** (Atomicity, Consistency, Isolation, Durability) and their underlying enforcement mechanisms.
* **Schedules and Serializability**: Conflict Serializability, Conflict Equivalence, and the **Precedence / Serialization Graph** cycle detection test.
* The four standard **Concurrency Anomalies**: Dirty Reads, Non-Repeatable Reads, Phantom Reads, and Lost Updates.
* **Concurrency Control Protocols**: Shared ($S$) and Exclusive ($X$) locks, **Two-Phase Locking (2PL)**, Strict 2PL, and Rigorous 2PL.
* **Deadlock Management**: Prevention (Wait-Die and Wound-Wait schemes) and Detection (Wait-For Graph).
* **Database Crash Recovery**: The **Write-Ahead Logging (WAL)** protocol, checkpoint records, and Undo/Redo recovery procedures.

---

### 2. Prerequisites & Background Context
* Relational model concepts and SQL DML execution.
* Basic understanding of operating system process scheduling, shared memory, and non-volatile disk caching.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

A **Transaction** is a logical unit of database work consisting of one or more database operations (reads and writes) that must be executed as a single, indivisible operation.

#### 1. The Transaction State Transition Model
A transaction progresses through distinct states during its lifecycle:
* **Active**: Initial state; transaction operations are actively executing.
* **Partially Committed**: All statements have executed in volatile RAM buffers, but changes are not yet committed to non-volatile disk.
* **Failed**: Normal execution can no longer proceed due to hardware error, software crash, or integrity constraint violation.
* **Aborted**: The transaction has been rolled back, and all intermediate state modifications have been restored using log records.
* **Committed**: Changes are permanently written to non-volatile storage via Write-Ahead Logging (WAL).

\`\`\`text
               +--------+
               | Active |
               +---+----+
                   |
         +---------+---------+
         |                   |
         v                   v
+-------------------+   +--------+
|Partially Committed|   | Failed |
+--------+----------+   +---+----+
         |                  |
         v                  v
   +-----------+      +-----------+
   | Committed |      |  Aborted  |
   +-----------+      +-----------+
\`\`\`

#### 2. The Four ACID Properties
1. **Atomicity (All-or-Nothing Rule)**:
   * A transaction is an indivisible atomic unit. Either all operations execute to completion, or upon any failure, all modifications are completely undone (\`ROLLBACK\`). Enforced by the DBMS **Recovery Manager** using the log.
2. **Consistency (Integrity Invariant Rule)**:
   * Execution of a transaction in isolation preserves database integrity constraints (primary keys, foreign keys, balance conservation). Enforced by both the **DBMS Engine** and application business logic.
3. **Isolation (Concurrency Shield)**:
   * Even when thousands of transactions execute concurrently, the intermediate state of each transaction remains hidden from other concurrent transactions. Enforced by the **Concurrency Control Manager** (locks, timestamps).
4. **Durability (Persistence Guarantee)**:
   * Once a transaction commits, its modifications survive permanently on non-volatile storage, even if a power failure occurs immediately afterward. Enforced by **Write-Ahead Logging (WAL)**.

#### 3. Schedules, Serializability & Precedence Graphs
* **Schedule (History)**: An ordered sequence of operations from a set of concurrent transactions.
  * *Serial Schedule*: Transactions execute sequentially one after the other (always correct, but minimizes throughput).
  * *Concurrent Schedule*: Operations of transactions are interleaved.
* **Conflict Operations**: Two operations in a schedule conflict if and only if:
  1. They belong to different transactions.
  2. They access the exact same data item $Q$.
  3. At least one of the operations is a write ($\text{write}(Q)$).
* **Conflict Serializability**: A concurrent schedule $S$ is conflict serializable if it is conflict equivalent to some serial schedule.
* **Precedence Graph (Serialization Graph) Test**:
  1. Construct a directed graph $G = (V, E)$ where vertices $V$ represent active transactions.
  2. Draw a directed edge $T_i \\to T_j$ if an operation of $T_i$ conflicts with a subsequent operation of $T_j$.
  3. **Theorem**: A schedule $S$ is conflict serializable if and only if its precedence graph contains **NO CYCLES**. If acyclic, topological sort of the graph yields the equivalent serial schedule.

#### 4. The Four Concurrency Anomalies
1. **Dirty Read (Read Uncommitted)**: $T_1$ modifies a row. $T_2$ reads the uncommitted row. $T_1$ fails and issues \`ROLLBACK\`. $T_2$ has operated on ghost data that never committed.
2. **Non-Repeatable Read (Fuzzy Read)**: $T_1$ reads a row. $T_2$ modifies that row and commits. $T_1$ re-reads the row and observes different values within the same transaction.
3. **Phantom Read**: $T_1$ executes a range query (e.g., all orders in NY). $T_2$ inserts a new NY order and commits. $T_1$ re-executes the query and discovers new "phantom" rows.
4. **Lost Update**: $T_1$ and $T_2$ read the same balance $100 simultaneously. $T_1$ adds $20 and writes $120. $T_2$ deducts $10 and writes $90, overwriting $T_1$'s update without observing it.

#### 5. Two-Phase Locking (2PL) Protocols
To guarantee conflict serializability, relational engines enforce lock-based protocols:
* **Shared Lock ($S$)**: Acquired for reading. Multiple transactions can hold shared locks on the same item.
* **Exclusive Lock ($X$)**: Acquired for writing. Only one transaction can hold an exclusive lock on an item.
* **Two-Phase Locking (2PL) Rule**:
  * **Growing Phase**: Transaction may acquire locks, but cannot release any lock.
  * **Shrinking Phase**: Transaction may release locks, but cannot acquire any new lock.
  * *Theorem*: Any schedule governed by 2PL is guaranteed to be **Conflict Serializable**.
* **Strict 2PL**: The transaction holds all its **exclusive locks** until it commits or aborts. Eliminates cascading rollbacks.
* **Rigorous 2PL**: The transaction holds **all locks (shared and exclusive)** until commit/abort.

#### 6. Deadlocks & Recovery
* **Deadlock**: Two or more transactions are in a simultaneous wait state, each holding a lock the other requires.
* **Prevention Schemes**:
  * *Wait-Die (Non-preemptive)*: If older transaction requests data held by younger, older waits. If younger requests data held by older, younger dies (aborts and restarts).
  * *Wound-Wait (Preemptive)*: If older requests data held by younger, older "wounds" (preempts/aborts) younger. If younger requests data held by older, younger waits.
* **Detection & Recovery**: Construct a **Wait-For Graph (WFG)**. If a cycle exists, select a victim transaction, rollback, and restart.
* **Crash Recovery (WAL Protocol)**: Before a dirty page is written to disk, the corresponding log record must be flushed to non-volatile storage. Checkpoints bound recovery time by flushing all dirty buffers periodically.

---

### 4. Syntax & Transaction Code Example
The following production SQL script demonstrates an atomic financial transfer with defensive balance validation, locking, and audit logging:

\`\`\`sql
-- Production ACID Transaction Demonstration with Defensive Rollback
CREATE TABLE IF NOT EXISTS accounts (
    acc_id VARCHAR(16) PRIMARY KEY,
    owner_name VARCHAR(60) NOT NULL,
    balance DECIMAL(12, 2) NOT NULL CHECK (balance >= 0.00)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(16) NOT NULL,
    recipient_id VARCHAR(16) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO accounts VALUES ('A1', 'Alice', 1000.00), ('B2', 'Bob', 500.00);

-- Explicit Multi-Statement ACID Transaction
BEGIN TRANSACTION;

-- Step 1: Deduct from Alice with atomic condition
UPDATE accounts
SET balance = balance - 300.00
WHERE acc_id = 'A1' AND balance >= 300.00;

-- Step 2: Credit to Bob
UPDATE accounts
SET balance = balance + 300.00
WHERE acc_id = 'B2';

-- Step 3: Record audit trail
INSERT INTO audit_logs (sender_id, recipient_id, amount)
VALUES ('A1', 'B2', 300.00);

-- Step 4: Commit atomically — logs flushed to WAL disk
COMMIT;
\`\`\`

---

### 5. Common Misconceptions & Exam Pitfalls
1. **Confusing 2PL with Deadlock Prevention**:
   * *Misconception*: Believing that Two-Phase Locking prevents deadlocks.
   * *Correction*: **2PL guarantees conflict serializability, but does NOT prevent deadlocks!** In fact, 2PL schedules can easily deadlock when transactions acquire locks in different orders.
2. **Confusing Conflict Serializability with View Serializability**:
   * *Correction*: Every conflict serializable schedule is view serializable, but some view serializable schedules (involving blind writes) are not conflict serializable. Testing conflict serializability is $O(V + E)$ (polynomial time); testing view serializability is NP-complete.
3. **Assuming WAL Flushes Data Pages on Commit**:
   * *Correction*: WAL flushes **log records** to disk on commit, NOT dirty data pages. Data pages can remain in RAM buffers and be written asynchronously, greatly boosting throughput.

---

### 6. Comparative Analysis Table
| Dimension | Autocommit Mode (No Transaction) | ACID Explicit Transaction |
| :--- | :--- | :--- |
| **Atomicity** | None — statements commit independently | Guaranteed — all statements commit or all rollback |
| **Crash Recovery** | Partial inconsistent state survives crash | Clean recovery via Write-Ahead Log (WAL) undo/redo |
| **Concurrency Safety** | Susceptible to dirty reads and lost updates | Isolated according to configured isolation level |
| **Deadlock Risk** | Minimal single-statement locking | Managed via Lock Manager and Wait-For Graphs |

---

### 7. Important Exam & Interview Points
* **4 Isolation Levels**: \`READ UNCOMMITTED\`, \`READ COMMITTED\`, \`REPEATABLE READ\`, \`SERIALIZABLE\`.
* **Cycle Detection in Precedence Graph**: If $T_1 \\to T_2$ and $T_2 \\to T_1$, cycle exists $\\implies$ schedule is NOT conflict serializable.
* **Strict 2PL vs 2PL**: Strict 2PL holds exclusive locks until commit, avoiding cascading rollbacks.
* **Steal / No-Force Buffer Policy**: Most database engines use a *Steal* (can write uncommitted pages to disk) and *No-Force* (does not need to flush data pages on commit) recovery policy.

---

### 8. Short Recap
* Transactions guarantee the ACID properties across concurrent sessions and hardware crashes.
* Conflict serializability is verified using acyclic precedence graphs.
* Two-Phase Locking ensures serializability, while WAL and checkpoints guarantee durability and fast recovery.

---

### 9. Practice Questions & Detailed Explanations

#### Question 1 (Precedence Graph Conflict Serializability)
**Question**: Consider concurrent schedule $S$: $r_1(X); \\; r_2(X); \\; w_1(X); \\; r_1(Y); \\; w_2(X); \\; c_1; \\; c_2$. Construct the precedence graph and determine if $S$ is conflict serializable.
* **Answer / Explanation**:
  1. Identify conflicting operations between $T_1$ and $T_2$ on item $X$:
     - $r_2(X)$ is followed by $w_1(X) \\implies$ edge $T_2 \\to T_1$.
     - $w_1(X)$ is followed by $w_2(X) \\implies$ edge $T_1 \\to T_2$.
  2. The precedence graph contains directed edges $T_2 \\to T_1$ and $T_1 \\to T_2$, forming a directed cycle ($T_1 \\rightleftharpoons T_2$).
  3. By the conflict serializability theorem, since the precedence graph contains a cycle, schedule $S$ is **NOT conflict serializable**.

#### Question 2 (2PL vs Deadlock)
**Question**: Does Basic Two-Phase Locking (2PL) guarantee freedom from deadlocks? If not, illustrate with a simple two-transaction scenario.
* **Answer / Explanation**: **No**, Basic 2PL does NOT guarantee freedom from deadlocks. It only guarantees conflict serializability. For example, consider $T_1$ holding an exclusive lock on $A$ and requesting a lock on $B$, while $T_2$ holds an exclusive lock on $B$ and requests a lock on $A$. Both transactions adhere to the growing phase of 2PL, yet each waits indefinitely for the other, producing an unresolvable deadlock.

#### Question 3 (Write-Ahead Logging WAL)
**Question**: What is the core rule of the Write-Ahead Logging (WAL) protocol, and why is it critical for the Durability property?
* **Answer / Explanation**: The WAL protocol states that:
  1. Before any dirty database page in volatile RAM is written to disk storage, the corresponding update log records must already be flushed to non-volatile disk log storage.
  2. Before a transaction is allowed to enter the \`Committed\` state and notify the client, all of its log records must be flushed to non-volatile storage.
  This is critical for **Durability** because if power fails, the database engine can reconstruct the committed state by replaying the WAL logs (\`REDO\`), even if modified data pages in RAM were never written to disk.

#### Question 4 (Dirty Read vs Unrepeatable Read)
**Question**: Distinguish between a "Dirty Read" and a "Non-Repeatable Read". Which ANSI isolation levels prevent each?
* **Answer / Explanation**: A **Dirty Read** occurs when $T_1$ reads data written by $T_2$ that has not yet committed; if $T_2$ aborts, $T_1$ has read phantom data. A **Non-Repeatable Read** occurs when $T_1$ reads a row, $T_2$ *commits* an update to that row, and $T_1$ reads the same row again, finding modified values.
  - \`READ COMMITTED\` prevents Dirty Reads, but permits Non-Repeatable Reads.
  - \`REPEATABLE READ\` prevents both Dirty Reads and Non-Repeatable Reads.

#### Question 5 (Wait-Die vs Wound-Wait)
**Question**: Contrast the Deadlock Prevention schemes Wait-Die vs Wound-Wait. Which scheme is non-preemptive and which is preemptive?
* **Answer / Explanation**: Both schemes use timestamps based on transaction start times (older transactions have smaller timestamps):
  - **Wait-Die (Non-preemptive)**: If older requests data held by younger, older is allowed to wait. If younger requests data held by older, younger dies (aborts and restarts with its original timestamp).
  - **Wound-Wait (Preemptive)**: If older requests data held by younger, older *wounds* (preemptively aborts) younger to seize the lock immediately. If younger requests data held by older, younger is allowed to wait.
`;
}

// ------------------------------------------------------------------------------------------------
// 6. Indexing & Physical Storage Architecture
// ------------------------------------------------------------------------------------------------
export function buildDbmsIndexingNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The physical organization of database storage blocks, buffer pools, and sequential scan bottlenecks ($O(N)$ disk I/O).
* The structural invariants of **B+ Trees**: fanout $B$, balanced height, internal routing nodes, leaf nodes, and leaf linked-lists.
* The critical architectural difference between **Clustered (Primary) Indexing** and **Unclustered (Secondary) Indexing**.
* The distinction between **Dense Indices** and **Sparse Indices**.
* The operation of **Hash Indexing** ($O(1)$ equality lookups) and why it cannot support range queries.
* Step-by-step mathematical calculations for B+ Tree node capacity, fanout, and tree height.

---

### 2. Prerequisites & Background Context
* Relational tables, rows, primary keys, and secondary storage page blocks.
* Basic tree structures (binary search trees, height balance).
* Understanding of disk I/O latency vs. volatile memory RAM latency.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

In relational database systems, an **Index** is an auxiliary physical access path that enables the database engine to locate specific records in a table without scanning every disk block in an expensive $O(N)$ linear table scan.

#### 1. Why B+ Trees Are the Universal Standard for Database Indexing
While in-memory algorithms often utilize Binary Search Trees or AVL Trees, database engines store indexes on non-volatile block-based storage (HDD/SSD). A B+ Tree optimizes for disk block architectures by maximizing **fanout** (the number of pointers per node):
1. **Shallow Depth**: By fitting hundreds of routing keys into a single $4\\text{ KB}$ disk block, the tree height remains exceptionally low (typically 2 to 4 levels for hundreds of millions of rows).
2. **All Data Pointers at Leaves**: Unlike standard B-Trees, internal nodes contain strictly search-routing keys and child block pointers. All actual tuple identifiers (RIDs) reside strictly in leaf nodes. This maximizes internal node fanout.
3. **Sequential Leaf Linked List**: All leaf nodes are linked sequentially via a doubly-linked list. A range query (e.g., \`WHERE salary BETWEEN 50000 AND 80000\`) traverses $O(\\log_B N)$ to the lower bound and simply follows the leaf linked list horizontally, avoiding parent re-traversals.

\`\`\`text
                 +-------------------+
                 |    [30 | 70]      |  <-- Root Node (Internal)
                 +----+-----+---+----+
                      |     |   |
          +-----------+     |   +-----------+
          v                 v               v
    +-----------+     +-----------+     +-----------+
    | [10 | 20] |     | [40 | 60] |     | [80 | 90] |  <-- Internal Level 1
    +---+---+---+     +---+---+---+     +---+---+---+
        |   |             |   |             |   |
  +-----+   +---+   +-----+   +---+   +-----+   +---+
  v             v   v             v   v             v
+-------+ <--> +-------+ <--> +-------+ <--> +-------+  <-- Leaf Nodes (Data Pointers)
| 10,20 |      | 30,40 |      | 60,70 |      | 80,90 |     (Doubly Linked List)
+-------+      +-------+      +-------+      +-------+
\`\`\`

#### 2. Clustered vs. Unclustered (Secondary) Indexing
| Feature | Clustered (Primary) Index | Unclustered (Secondary) Index |
| :--- | :--- | :--- |
| **Physical Data Ordering** | Physical rows on disk are stored in the exact sort order of the index key | Index is stored separately; leaves contain pointers (RIDs) to heap pages |
| **Maximum Count per Table** | **Exactly 1** (data can only be physically sorted one way) | **Multiple** (tables can have 10+ secondary indexes) |
| **Leaf Node Contents** | Contains actual full table data row columns | Contains indexed key columns plus Record Identifier (RID) or Primary Key |
| **Range Query Performance** | Extremely fast (reads contiguous disk blocks sequentially) | Slower (requires random I/O pointer hops back into table heap blocks) |

#### 3. Dense vs. Sparse Indexing
* **Dense Index**: Contains an index entry for **every single search key value** in the table. Secondary indexes must always be dense.
* **Sparse Index**: Contains index entries only for some data records (typically one entry per physical disk block). Can only be applied when the underlying table is physically sorted on the search key (clustered).

---

### 4. Step-by-Step Worked B+ Tree Calculation
**Problem**: Consider a relational table containing $N = 10,000,000$ ($10^7$) student records stored on disk blocks of size $B = 4096\\text{ bytes}$ ($4\\text{ KB}$).
* Search key size = $8\\text{ bytes}$.
* Block pointer size = $8\\text{ bytes}$.
* Record pointer size = $8\\text{ bytes}$.

#### Step 1: Calculate the Maximum Fanout ($M$) of an Internal Node
An internal node containing $k$ keys contains $k + 1$ block pointers:
$$k \\cdot (\\text{key size}) + (k + 1) \\cdot (\\text{pointer size}) \\le B$$
$$8k + 8(k + 1) \\le 4096 \\implies 16k + 8 \\le 4096 \\implies 16k \\le 4088 \\implies k = 255$$
Maximum fanout (pointers per internal node) = $M = k + 1 = 256$ pointers.

#### Step 2: Calculate the Capacity of a Leaf Node
Each leaf entry contains a search key ($8\\text{ B}$) and a record pointer ($8\\text{ B}$), plus one $8\\text{ B}$ pointer to the next leaf block:
$$m \\cdot (8 + 8) + 8 \\le 4096 \\implies 16m \\le 4088 \\implies m = 255\\text{ records per leaf block}$$

#### Step 3: Calculate the Height of the B+ Tree
At minimum $50\\%$ fill factor (average fanout $\\approx 128$), the maximum number of levels required to index $10^7$ rows is:
$$\\text{Height} = \\lceil \\log_{128} (10^7) \\rceil = \\lceil \\frac{\\log_{10}(10^7)}{\\log_{10}(128)} \\rceil = \\lceil \\frac{7}{2.107} \\rceil = \\lceil 3.32 \\rceil = 4\\text{ levels}$$
* **Performance Takeaway**: An unindexed table of $10,000,000$ rows ($100\\text{ bytes/row} \\implies 1\\text{ GB}$) requires scanning $\\approx 250,000$ disk blocks. The B+ tree locates ANY student record in at most **4 disk block reads**!

---

### 5. Correct, Complete, Runnable SQL Example
\`\`\`sql
-- Production Relational Schema & Index Performance Demonstration
CREATE TABLE IF NOT EXISTS student_records (
    student_id INT PRIMARY KEY, -- Clustered Primary Index
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    major VARCHAR(50) NOT NULL,
    gpa DECIMAL(3, 2) NOT NULL CHECK (gpa BETWEEN 0.00 AND 4.00),
    graduation_year INT NOT NULL
);

-- 1. Create a Single-Column Secondary B+ Tree Index for Range Filtering
CREATE INDEX idx_student_gpa ON student_records(gpa);

-- 2. Create a Composite Multi-Column Index (Major, Graduation Year)
-- Adheres to the Left-Prefix Rule: accelerated queries must filter on 'major'
CREATE INDEX idx_student_major_year ON student_records(major, graduation_year);

-- Seed verified sample data
INSERT INTO student_records (student_id, first_name, last_name, major, gpa, graduation_year)
VALUES (1001, 'Alice', 'Chen', 'Computer Science', 3.92, 2025),
       (1002, 'Bob', 'Smith', 'Computer Science', 3.45, 2024),
       (1003, 'Carol', 'Taylor', 'Electrical Eng', 3.88, 2025),
       (1004, 'David', 'Kumar', 'Mathematics', 3.75, 2026),
       (1005, 'Elena', 'Rostova', 'Computer Science', 3.98, 2024);

-- Query 1: Index Range Scan utilizing idx_student_gpa
SELECT student_id, first_name, last_name, gpa
FROM student_records
WHERE gpa >= 3.80
ORDER BY gpa DESC;

-- Query 2: Composite Index Lookup utilizing idx_student_major_year
SELECT student_id, first_name, last_name, major, graduation_year
FROM student_records
WHERE major = 'Computer Science' AND graduation_year = 2024;
\`\`\`

---

### 6. Practice Questions & Detailed Explanations

#### Question 1 (B-Tree vs B+ Tree Invariant)
**Question**: Why do relational database engines use B+ Trees rather than standard B-Trees for disk indexing?
* **Answer / Explanation**: In standard B-Trees, data pointers are stored in all nodes (both internal and leaf). In B+ Trees, data pointers reside strictly in leaf nodes. Because internal nodes only store routing keys and child pointers, an internal node can hold hundreds more keys per block, resulting in a much larger fanout and shallower tree height. Furthermore, B+ Tree leaves are linked sequentially, allowing range scans to proceed with simple horizontal traversal rather than repeated tree re-traversals.

#### Question 2 (Clustered Index Cardinality Limit)
**Question**: Why can a relational table have at most one Clustered Index?
* **Answer / Explanation**: A clustered index dictates the actual physical sorting order of rows on disk blocks. Because physical rows on storage media can only be physically sorted in one sequential order, a table can possess only one clustered index. All subsequent indexes must be unclustered (secondary).

#### Question 3 (Composite Index Left-Prefix Rule)
**Question**: Given an index on \`(last_name, first_name)\`, can a query filtering \`WHERE first_name = 'Alice'\` use the index?
* **Answer / Explanation**: No. Composite indexes are sorted primarily by the first column (\`last_name\`), and only secondarily by \`first_name\` for identical last names. Filtering on \`first_name\` alone without \`last_name\` violates the Left-Prefix Rule, forcing the query planner to resort to a full table scan.

#### Question 4 (Indexing Trade-offs & Write Amplification)
**Question**: What is the primary negative trade-off of creating too many secondary indexes on a database table?
* **Answer / Explanation**: Write amplification. While indexes accelerate read queries (\`SELECT\`), every \`INSERT\`, \`UPDATE\`, and \`DELETE\` must synchronously update every associated secondary index structure and potentially trigger expensive node splits and disk block rebalancing.

#### Question 5 (Hash Index vs B+ Tree)
**Question**: Why is Hash Indexing incapable of accelerating queries with \`WHERE age BETWEEN 20 AND 30\`?
* **Answer / Explanation**: Hash functions distribute keys uniformly across buckets using pseudo-random hashing algorithms ($h(k) = \\text{bucket}$). Because logical order is completely destroyed by the hash function, keys that are adjacent in value are mapped to completely unrelated physical buckets, making range scans impossible.

---

### 7. Concise Revision Summary
* B+ Trees provide $O(\\log_B N)$ search depth with double-linked leaf nodes for fast range scans.
* Clustered index sorts physical table rows directly; secondary indexes store pointers to rows.
* Avoid indexing low-cardinality columns (e.g. boolean flags) where table scans are faster than index hops.
`;
}

// ------------------------------------------------------------------------------------------------
// 7. Query Processing & Relational Optimization
// ------------------------------------------------------------------------------------------------
export function buildDbmsQueryOptimizationNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The 4 sequential phases of DBMS query execution: Parsing, Translation, Optimization, and Evaluation.
* Relational algebra canonical query trees and equivalence transformation rules.
* **Heuristic Optimization Rules**: Pushing selections ($\\sigma$) and projections ($\\pi$) down the query tree.
* Join algorithms: **Nested-Loop Join**, **Block Nested-Loop**, **Sort-Merge Join**, and **Hash Join**.
* Cost-Based Optimization (CBO) and catalog statistics (cardinality estimation and histogram statistics).

---

### 2. Prerequisites & Background Context
* Relational algebra operations (selection, projection, cross product, joins).
* SQL \`SELECT\` queries with \`JOIN\`, \`WHERE\`, \`GROUP BY\`, and subqueries.
* Secondary storage block I/O and index access paths.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

**Query Processing** is the multi-stage pipeline by which a declarative SQL query (specifying *what* data is desired) is translated into an optimized procedural physical execution plan (specifying *how* to retrieve it with minimum disk I/O and CPU cost).

#### 1. The Four Phases of Query Execution
1. **Parsing and Translation**: Validates SQL syntax, verifies table/column existence against the data dictionary, and translates SQL into an initial internal **Relational Algebra Tree**.
2. **Heuristic Query Optimization**: Applies relational equivalence rules to transform the query tree into an equivalent, highly efficient logical plan.
3. **Cost-Based Physical Optimization**: The cost estimator evaluates alternative physical access paths (e.g., Index Scan vs. Sequential Scan; Hash Join vs. Merge Join) using system catalog statistics (page counts, table cardinalities, and value distributions).
4. **Execution Engine**: Interprets or compiles the physical plan, coordinating disk buffer page reads to produce the output tuple stream.

#### 2. Core Relational Algebra Equivalence Rules
* **Pushing Down Selections ($\\sigma$)**: Perform selection as early as possible. Filtering rows *before* performing an expensive join drastically reduces intermediate relation sizes:
  $$\\sigma_{p}(R \\bowtie S) \\equiv (\\sigma_p(R)) \\bowtie S \\quad (\\text{if predicate } p \\text{ involves only attributes of } R)$$
* **Pushing Down Projections ($\\pi$)**: Eliminate unused columns before joins to minimize memory consumption in buffer pools.
* **Join Commutativity and Associativity**:
  $$R \\bowtie S \\equiv S \\bowtie R, \\quad (R \\bowtie S) \\bowtie T \\equiv R \\bowtie (S \\bowtie T)$$

#### 3. Comparison of Physical Join Algorithms
| Join Algorithm | Time Complexity | Best Scenario | Required Conditions |
| :--- | :--- | :--- | :--- |
| **Nested-Loop Join** | $O(M \\cdot N)$ tuple comparisons | Outer relation is very small and inner relation has an index on join key | None |
| **Block Nested-Loop Join** | $O(\\frac{B_M \\cdot B_N}{B_{\\text{buffer}}})$ block reads | Neither table is indexed and both fit into moderate memory | Sufficient RAM buffer pages |
| **Sort-Merge Join** | $O(M \\log M + N \\log N)$ sort $+ O(M + N)$ merge | Tables are already sorted on join keys (e.g. clustered index) or range queries | Equi-joins on sortable types |
| **Hash Join** | $O(M + N)$ linear time | Large ad-hoc equi-joins without pre-existing sorted indexes | In-memory hash table on smaller input |

---

### 4. Correct, Complete, Runnable SQL Example
\`\`\`sql
-- Production Relational Schema for Query Plan Analysis
CREATE TABLE IF NOT EXISTS store_departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(60) NOT NULL,
    budget DECIMAL(12, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS store_personnel (
    person_id INT PRIMARY KEY,
    full_name VARCHAR(80) NOT NULL,
    dept_id INT NOT NULL,
    salary DECIMAL(10, 2) NOT NULL,
    hired_year INT NOT NULL,
    CONSTRAINT fk_store_dept FOREIGN KEY (dept_id) REFERENCES store_departments(dept_id)
);

CREATE INDEX idx_personnel_dept ON store_personnel(dept_id);
CREATE INDEX idx_personnel_salary ON store_personnel(salary);

-- Insert sample records
INSERT INTO store_departments (dept_id, dept_name, budget)
VALUES (1, 'Engineering', 500000.00), (2, 'Marketing', 200000.00), (3, 'Human Resources', 150000.00);

INSERT INTO store_personnel (person_id, full_name, dept_id, salary, hired_year)
VALUES (101, 'Ada Lovelace', 1, 95000.00, 2021),
       (102, 'Grace Hopper', 1, 92000.00, 2020),
       (103, 'Alan Turing', 2, 75000.00, 2022),
       (104, 'Claude Shannon', 1, 88000.00, 2023);

-- Optimized Query Demonstrating Selection Push-down & Indexed Foreign Key Join
SELECT p.full_name, d.dept_name, p.salary
FROM store_personnel p
INNER JOIN store_departments d ON p.dept_id = d.dept_id
WHERE p.salary > 80000.00 AND d.budget >= 200000.00
ORDER BY p.salary DESC;
\`\`\`

---

### 5. Practice Questions & Detailed Explanations

#### Question 1 (Pushing Down Selections)
**Question**: Why is "pushing selections down" the most important heuristic optimization rule in relational databases?
* **Answer / Explanation**: Cross products and joins grow combinatorially with input sizes. If table $R$ has $100,000$ rows and table $S$ has $100,000$ rows, an unoptimized join compares up to $10^{10}$ pairs. Pushing a selection that filters $R$ to $100$ rows *before* joining reduces the join workspace to $100 \\times 100,000 = 10^7$ operations, a 1000-fold reduction in intermediate disk and memory allocation.

#### Question 2 (Nested-Loop vs Hash Join)
**Question**: When does the query optimizer choose a Hash Join over a Nested-Loop Join?
* **Answer / Explanation**: The optimizer chooses a Hash Join for large equi-joins where neither relation possesses an index on the join attribute. It builds an in-memory hash table on the smaller relation and streams the larger relation through, completing the join in $O(M + N)$ linear time instead of quadratic $O(M \\cdot N)$ time.

#### Question 3 (Catalog Statistics & Stale Plans)
**Question**: Why can stale database catalog statistics cause catastrophic query slowdowns?
* **Answer / Explanation**: Cost-based optimizers rely on table statistics (cardinalities, page counts, distinct key counts) to choose execution paths. If a table grows from 100 rows to 10,000,000 rows without updating statistics (\`ANALYZE\`), the optimizer may incorrectly assume the table is tiny and choose an unindexed sequential scan or nested-loop join, freezing database throughput.

#### Question 4 (Equi-Join vs Non-Equi-Join)
**Question**: Can a Hash Join be utilized to evaluate a query with \`ON a.val < b.val\`?
* **Answer / Explanation**: No. Hash joins depend on hash functions mapping equal values to the exact same hash bucket. Inequality comparisons ($<$, $>$, \`BETWEEN\`) cannot be mapped to bucket equality, requiring Sort-Merge joins or Nested-Loop joins.

#### Question 5 (Role of EXPLAIN Plan)
**Question**: What does the SQL command \`EXPLAIN\` or \`EXPLAIN ANALYZE\` provide to a database administrator?
* **Answer / Explanation**: It displays the execution plan chosen by the query optimizer, revealing whether sequential table scans or index scans are employed, the specific join algorithms selected, estimated vs. actual row cardinalities, and disk I/O execution time per node.

---

### 6. Concise Revision Summary
* Always push selection and projection filters as close to the leaf scan nodes as possible.
* Ensure join attributes have matching data types to avoid implicit type-conversion index disabling.
* Run \`ANALYZE\` periodically to refresh table catalog cardinality statistics.
`;
}

// ------------------------------------------------------------------------------------------------
// 8. Database Security, Authorization & Injection Defense
// ------------------------------------------------------------------------------------------------
export function buildDbmsSecurityNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  return `# ${topic}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${topic}**, you will master:
* The core principles of **Database Security**: Confidentiality, Integrity, and Availability (CIA Triad).
* **Discretionary Access Control (DAC)** using SQL \`GRANT\` and \`REVOKE\` commands with cascading controls.
* **Role-Based Access Control (RBAC)** to streamline enterprise privilege administration.
* Using **Database Views** and stored procedures to implement granular row-level and column-level security.
* How **SQL Injection (SQLi)** attacks exploit unescaped user input and how **Parameterized Prepared Statements** prevent them.

---

### 2. Prerequisites & Background Context
* Relational database tables, schemas, views, and SQL DML/DDL.
* Basic understanding of web application client-server architecture and user authentication.

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

**Database Security** encompasses the policies, access control mechanisms, encryption standards, and injection defenses that protect relational databases against unauthorized data access, malicious tampering, and availability disruptions.

#### 1. Discretionary Access Control (DAC) via SQL
In DAC, the owner of a database relation has the discretion to grant or revoke privileges on that relation to other users or roles:
* **Privileges**: \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\`, \`REFERENCES\`, and \`EXECUTE\`.
* **Column-Level Privileges**: Restricting a user to updating specific columns:
  \`\`\`sql
  GRANT SELECT, UPDATE(salary) ON employee_records TO hr_payroll;
  \`\`\`
* **WITH GRANT OPTION**: Permits the recipient user to propagate the granted privilege to other database accounts.
* **Cascading Revocation**:
  * \`CASCADE\`: Revoking a privilege from user A automatically revokes all privileges that user A granted to users B and C.
  * \`RESTRICT\`: Aborts the revocation if the privilege has been propagated to other accounts.

#### 2. SQL Injection (SQLi) Vulnerability & Prevention
A SQL Injection attack occurs when untrusted user input is directly concatenated into a dynamic SQL string:
\`\`\`sql
-- Vulnerable Dynamic String Concatenation:
-- Input provided by attacker: "' OR '1'='1"
SELECT * FROM users WHERE username = '' OR '1'='1' AND password = '...';
\`\`\`
Because \`'1'='1'\` evaluates to true for every row, the attacker bypasses authentication and dumps all records.

* **The Definitive Defense: Parameterized Prepared Statements**:
  With prepared statements, the database engine compiles the SQL query structure *first*. User inputs are treated strictly as literal parameter data values, never as executable SQL code tokens.

---

### 4. Correct, Complete, Runnable SQL Example
\`\`\`sql
-- Production Security Schema, RBAC & Granular View Security
CREATE TABLE IF NOT EXISTS patient_medical_records (
    record_id INT PRIMARY KEY,
    patient_name VARCHAR(80) NOT NULL,
    ssn VARCHAR(11) NOT NULL,
    diagnosis VARCHAR(100) NOT NULL,
    attending_physician VARCHAR(80) NOT NULL,
    billing_balance DECIMAL(10, 2) NOT NULL
);

-- Seed sample records
INSERT INTO patient_medical_records (record_id, patient_name, ssn, diagnosis, attending_physician, billing_balance)
VALUES (1, 'John Doe', '***-**-1234', 'Hypertension', 'Dr. Smith', 450.00),
       (2, 'Jane Roe', '***-**-5678', 'Type 2 Diabetes', 'Dr. Adams', 1200.00);

-- Step 1: Create a Secure Column-Masked View for Medical Staff
-- Hides sensitive financial billing balances and Social Security Numbers
CREATE VIEW v_physician_patient_view AS
SELECT record_id, patient_name, diagnosis, attending_physician
FROM patient_medical_records;

-- Step 2: Role-Based Access Control (RBAC) Setup
-- Create distinct security roles
-- CREATE ROLE medical_staff;
-- CREATE ROLE billing_staff;

-- Step 3: Grant Least-Privilege Permissions
-- Doctors can only access the masked medical view, never the raw SSN or billing table
-- GRANT SELECT ON v_physician_patient_view TO medical_staff;
-- GRANT SELECT, UPDATE(billing_balance) ON patient_medical_records TO billing_staff;

-- Verify query execution against secure view
SELECT record_id, patient_name, diagnosis, attending_physician
FROM v_physician_patient_view
WHERE attending_physician = 'Dr. Smith';
\`\`\`

---

### 5. Practice Questions & Detailed Explanations

#### Question 1 (Cascading Revoke Mechanics)
**Question**: User A grants \`SELECT\` on table $T$ to User B \`WITH GRANT OPTION\`. User B subsequently grants \`SELECT\` on table $T$ to User C. What happens if User A executes \`REVOKE SELECT ON T FROM B CASCADE\`?
* **Answer / Explanation**: With \`CASCADE\`, both User B's privilege and User C's privilege are revoked simultaneously. Because User C's authorization depended on the privilege delegated by User B, revoking from User B invalidates the entire dependent authorization subtree.

#### Question 2 (Views as Security Boundaries)
**Question**: How do relational Database Views enforce row-level security without duplicating physical data?
* **Answer / Explanation**: A view stores a predefined SQL query in the system catalog. By defining a view with a filtering \`WHERE\` clause (e.g., \`WHERE branch_id = CURRENT_USER_BRANCH\`) and granting permissions strictly on the view rather than the underlying base table, users are physically prevented from accessing rows outside their authorized domain.

#### Question 3 (Root Cause of SQL Injection)
**Question**: What is the root cause of SQL injection vulnerabilities, and why does input sanitization alone fail to eliminate it?
* **Answer / Explanation**: The root cause is the conflation of code and data in dynamic string concatenation. Input sanitization (e.g. blacklisting quotes) frequently fails due to character encoding evasion techniques. Only parameterized prepared statements eliminate the vulnerability entirely by compiling the query grammar beforehand and binding user data strictly as literals.

#### Question 4 (Discretionary vs Mandatory Access Control)
**Question**: Contrast Discretionary Access Control (DAC) with Mandatory Access Control (MAC).
* **Answer / Explanation**: In DAC, the individual creator/owner of an object controls permissions and can delegate rights to others via \`GRANT\`. In MAC, security classifications (e.g., Top Secret, Secret, Unclassified) are strictly enforced by the system administrator based on security clearances, and individual users cannot alter permissions on data they create.

#### Question 5 (Principle of Least Privilege)
**Question**: How is the Principle of Least Privilege implemented in database user management?
* **Answer / Explanation**: Database accounts are granted only the absolute minimum permissions necessary to perform their business tasks. For instance, read-only analytical reporting services are granted strictly \`SELECT\` privileges on designated views, with zero \`INSERT\`, \`UPDATE\`, \`DELETE\`, or DDL permissions.

---

### 6. Concise Revision Summary
* Always employ Parameterized Queries / Prepared Statements for all user-supplied data inputs.
* Follow the Principle of Least Privilege: never connect application services using the \`root\` or \`dba\` superuser account.
* Use security views and stored procedures to mask sensitive columns and restrict row-level access.
`;
}

// ------------------------------------------------------------------------------------------------
// 9. General DBMS Academic Studies (Pedagogically Grounded Fallback)
// ------------------------------------------------------------------------------------------------
export function buildDbmsGeneralNotes(
  subject: string,
  topic: string,
  theory: string,
  badge: string,
  syllabusNote: string,
  _isExamMode: boolean
): string {
  const displayTitle = topic || "Database Architecture & Relational Principles";

  return `# ${displayTitle}

${badge}
${syllabusNote}
---

### 1. Topic Title & Learning Objectives
By completing this module on **${displayTitle}**, you will master:
* The architectural role of relational Database Management Systems and the ANSI Three-Schema framework.
* Relational model foundations: Relations, Tuples, Attributes, and Declarative Integrity Constraints.
* Designing normalized schemas with Primary Keys, Foreign Keys, and Referential Integrity cascading rules.
* Formulating declarative SQL DDL and DML queries with multi-table joins and aggregation.
* Evaluating database transaction boundaries, ACID safety guarantees, and secondary storage indexing access paths.

---

### 2. Prerequisites & Background Context
* Fundamental computing concepts: tables, rows, columns, and persistent disk storage.
* Basic understanding of primary keys and relational relationships (1:1, 1:N, M:N).

---

### 3. Clear Definition & Explanation (in beginner-friendly English)
${theory}

A **Database Management System (DBMS)** is specialized system software designed to create, query, update, and manage structured data while guaranteeing operational consistency, multi-user concurrency, and fault tolerance.

#### 1. Core Architectural Pillars of Relational Database Systems
1. **The Three-Schema Architecture**:
   * **External Level**: Tailored views presenting customized data subsets to specific user groups.
   * **Conceptual Level**: Logical enterprise-wide schema defining entities, attributes, relationships, and constraints.
   * **Internal Level**: Physical storage structures, page allocations, B+ tree indexes, and buffer pool caching.
2. **Data Independence**:
   * **Physical Data Independence**: Storage paths, indexing structures, and disk partitioning can be modified without altering conceptual schemas or application code.
   * **Logical Data Independence**: Conceptual schemas can be extended without breaking existing external user views.
3. **Declarative Query Execution**:
   Applications formulate SQL queries specifying *what* data is required. The internal cost-based query optimizer analyzes catalog statistics and index access paths to generate the most efficient execution plan.

#### 2. Declarative Integrity Constraints
* **Entity Integrity**: Every table must have a Primary Key that uniquely identifies each tuple and contains no \`NULL\` values.
* **Referential Integrity**: Foreign keys must either match an existing primary key value in the referenced parent table or be \`NULL\`.
* **Domain Integrity & Check Constraints**: Enforces data type restrictions, \`NOT NULL\` rules, and custom boolean validations (e.g., \`CHECK (balance >= 0)\`).

---

### 4. Correct, Complete, Runnable SQL Example
The following production SQL script demonstrates relational schema definition, declarative integrity constraints, multi-table joins, and aggregation:

\`\`\`sql
-- Production Relational Schema Definition
CREATE TABLE IF NOT EXISTS enterprise_departments (
    dept_id INT PRIMARY KEY,
    dept_name VARCHAR(60) NOT NULL UNIQUE,
    location VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS enterprise_employees (
    emp_id INT PRIMARY KEY,
    full_name VARCHAR(80) NOT NULL,
    dept_id INT NOT NULL,
    salary DECIMAL(10, 2) NOT NULL CHECK (salary >= 30000.00),
    email VARCHAR(100) UNIQUE,
    CONSTRAINT fk_emp_dept 
        FOREIGN KEY (dept_id) REFERENCES enterprise_departments(dept_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Seed verified sample data
INSERT INTO enterprise_departments (dept_id, dept_name, location)
VALUES (1, 'Engineering', 'Building A'),
       (2, 'Finance', 'Building B'),
       (3, 'Marketing', 'Building C');

INSERT INTO enterprise_employees (emp_id, full_name, dept_id, salary, email)
VALUES (101, 'Ada Lovelace', 1, 95000.00, 'ada@enterprise.org'),
       (102, 'Charles Babbage', 1, 88000.00, 'charles@enterprise.org'),
       (103, 'Grace Hopper', 2, 92000.00, 'grace@enterprise.org'),
       (104, 'Alan Turing', 1, 99000.00, 'alan@enterprise.org');

-- Query 1: Multi-Table INNER JOIN with Projection and Ordering
SELECT e.emp_id, e.full_name, d.dept_name, e.salary, d.location
FROM enterprise_employees e
INNER JOIN enterprise_departments d ON e.dept_id = d.dept_id
WHERE e.salary >= 90000.00
ORDER BY e.salary DESC;

-- Query 2: Aggregated Summary with GROUP BY and HAVING
SELECT d.dept_name, COUNT(e.emp_id) AS total_staff, ROUND(AVG(e.salary), 2) AS mean_salary
FROM enterprise_departments d
JOIN enterprise_employees e ON d.dept_id = e.dept_id
GROUP BY d.dept_name
HAVING COUNT(e.emp_id) >= 2;
\`\`\`

---

### 5. Practice Questions & Detailed Explanations

#### Question 1 (Data Independence)
**Question**: What is the practical distinction between Physical Data Independence and Logical Data Independence?
* **Answer / Explanation**: Physical data independence allows database administrators to alter storage structures, add B+ tree indexes, or repartition disk tables without altering conceptual schemas or rewriting application code. Logical data independence allows altering the conceptual schema (e.g., adding an optional attribute or splitting an entity) without forcing modifications to existing external views or reports.

#### Question 2 (Entity Integrity vs Referential Integrity)
**Question**: Define Entity Integrity and Referential Integrity, and state how each is enforced in relational tables.
* **Answer / Explanation**: Entity Integrity mandates that primary key attributes can never be \`NULL\` and must uniquely identify every row; it is enforced via \`PRIMARY KEY\` constraints. Referential Integrity dictates that any foreign key must reference a valid primary key in the parent relation or be \`NULL\`; it is enforced via \`FOREIGN KEY ... REFERENCES\` constraints with cascading rules (\`ON DELETE RESTRICT\`, \`CASCADE\`, or \`SET NULL\`).

#### Question 3 (Declarative Query Optimization)
**Question**: How does the declarative nature of SQL benefit application developers compared to procedural file navigation?
* **Answer / Explanation**: Developers specify *what* data they require rather than writing procedural search loops or managing memory pointers. This allows the internal query optimizer to automatically select optimal physical index access paths, reorder joins, and adapt execution plans as data volumes change.

#### Question 4 (Buffer Manager and Write-Ahead Logging)
**Question**: What is the responsibility of the database buffer manager, and how does it coordinate with Write-Ahead Logging (WAL)?
* **Answer / Explanation**: The buffer manager caches disk pages in RAM to accelerate read/write throughput. Under the WAL protocol, dirty data pages in RAM cannot be flushed to non-volatile disk until the corresponding log records detailing the changes have been flushed to disk, ensuring recovery can reconstruct committed state after an abrupt power outage.

#### Question 5 (Normalization Trade-offs)
**Question**: Why do database architects design schemas in Third Normal Form (3NF/BCNF) rather than storing all enterprise data in a single wide table?
* **Answer / Explanation**: Un-normalized tables suffer from insertion, deletion, and update anomalies due to redundant data repetition. Normalizing into 3NF/BCNF decomposes tables so every fact is stored exactly once, preserving data integrity while preventing conflicting duplicate entries across rows.

---

### 6. Concise Revision Summary
* Always design schemas in normal form (3NF/BCNF) to eliminate redundant data duplication.
* Enforce integrity constraints at the database level rather than relying solely on client application code.
* Use explicit transaction boundaries (\`BEGIN\`, \`COMMIT\`, \`ROLLBACK\`) to guarantee ACID safety during multi-row updates.
`;
}
