# Student Search Feature - Backend Requirements

## Overview
We need a high-performance global search API to find students across the entire database (approx. 1.7 million rows). This feature will be used by OMR Editors/Admins to locate students who might be in different tasks/exams.

## API Specification

### Endpoint
`GET /students/search`

### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `q` | string | Yes | The search query input by the user. |
| `limit` | number | No | Max number of results to return (default: 50). |
| `offset` | number | No | Pagination offset (default: 0). |

### Search Logic (Backend-Side)
The backend must parse the `q` parameter and apply the following logic:

#### 1. Task ID Pattern (Numeric, 6-8 digits)
If the input starts with 6-8 digits:
- **Case 1.1: Numeric Only** (e.g., "102001", append 11 to start range and append 33 to end range i.e. 10200111 to 10200133)
  - `WHERE task_id between 10200111 and 10200133`

- **Case 1.2: Numeric + 1 Word** (e.g., "102001 Somchai", append 11 to start range and append 33 to end range i.e. 10200111 to 10200133)
  - `WHERE task_id between 10200111 and 10200133 AND (firstname LIKE 'Somchai%' OR lastname LIKE 'Somchai%')`

- **Case 1.3: Numeric + 2 Words** (e.g., "102001 Somchai Jaidee", append 11 to start range and append 33 to end range i.e. 10200111 to 10200133)
  - `WHERE task_id between 10200111 and 10200133 AND (firstname LIKE 'Somchai%' AND lastname LIKE 'Jaidee%')`

#### 2. Name Pattern (Text Only)
If the input does not start with a 6-8 digit number:
- **Case 2.1: Single Word** (e.g., "Somchai")
  - `WHERE firstname LIKE 'Somchai%' OR lastname LIKE 'Somchai%'`
  
- **Case 2.2: Two Words** (e.g., "Somchai Jaidee")
  - `WHERE firstname LIKE 'Somchai%' AND lastname LIKE 'Jaidee%'`

- All cases should be ordered by `task_id, student_roll`.

#### 3. General Constraints
- **Pattern Matching**: All text searches should be prefix-based (e.g., `LIKE 'term%'`) to utilize indexes efficiently.
- **Performance**: Given 1.7M rows, ensure `task_id`, `firstname`, `lastname`, `student_roll` are indexed.

### Response Format
The API should return a JSON object containing the list of students.

```json
{
  "data": [
    {
      "snr_name": "String",        // Name of School/Center
      "task_id": "String",         // Task ID
      "exam_center_code": "String",
      "class_level": "String/Int", // Class Level
      "class_group": "String/Int", // Class Group/Range
      "master_roll": "String",     // Student ID/Roll No
      "student_roll": "String",    // Exam Seat No
      "prefix_name": "String",
      "firstname": "String",
      "lastname": "String",
      "present_status": "String"           // 'Present', 'Absent', etc.
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

## UI Requirements (Context for Backend)
- A "Telescope" icon button will be placed in the student list header.
- Clicking the button opens a modal/popover dialog.
- The dialog allows searching and displays the results in a grid.
- Columns to display: `snr_name`, `task_id`, `exam_center_code`, `class_level`, `class_group`, `master_roll`, `student_roll`, `prefix_name`, `firstname`, `lastname`, `present_status`.

## Notes
- The search should ignore inputs that don't match the defined patterns (or return empty).
- Pagination is required to handle large result sets.


## Example of cases, sql queries

### 1st case, user input 6-8 digits:
- case 6 digits: append 11 to start range and append 33 to end range i.e.
101001 > between 10100111 and 10100133 
- case 7 digits: append 1 to start range and append 3 to end range i.e. 
1010012 > between 10100121 and 10100123
- case 8 digits: simply task_id=x i.e.
10100111 > task_id=10100111

compound index:
KEY `task_id` (`task_id`,`student_roll`,`absent1`),

### query for 1st case, using between (using index)
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where ex.task_id between 10100111 and 10100133
order by ex.task_id, ex.student_roll -- 0.043s
LIMIT 50

+--------------------------------------------------+----------+------------------+-------------+--------------+-------------+-------------+--------------------------+------------------------------------------------+--------------------------------------------+--------------------+
| snr_name                                         | task_id  | exam_center_code | master_roll | student_roll | class_level | class_group | prefix_name              | firstname                                      | lastname                                   | present_status     |
+--------------------------------------------------+----------+------------------+-------------+--------------+-------------+-------------+--------------------------+------------------------------------------------+--------------------------------------------+--------------------+
| วัดบวรนิเวศวิหาร                                 | 10100111 |           101001 |           1 |        10001 |           4 |           1 | เด็กชาย                  | กิตติธัช                                       | ศิลา                                       | มาสอบ              |
| วัดบวรนิเวศวิหาร                                 | 10100111 |           101001 |           2 |        10002 |           4 |           1 | เด็กชาย                  | ชยพัทร์                                        | จ้อยทองมูล                                 | มาสอบ              |
...


Explain:
1	SIMPLE	ex		range	task_id	task_id	4		233	100.00	Using index condition
1	SIMPLE	pr		eq_ref	PRIMARY	PRIMARY	2	moe.ex.prefix_id	1	100.00	
1	SIMPLE	sn		eq_ref	PRIMARY,idx_merge1	PRIMARY	2	moe.ex.snr_id	1	100.00	

### query for 1st case, using like task_id% (using where)
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where ex.task_id like '10100111%'
order by ex.task_id, ex.student_roll -- 0.277s
LIMIT 50

### 2nd case, single word, search for firstname% or lastname%, 1 character or higher (using where)
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where (firstname like 'ก%' or lastname like 'ก%')
order by ex.task_id, ex.student_roll -- 0.047s
LIMIT 50

### 2nd case, 2 words, search for firstname% AND lastname%, 1 character or higher (using where)
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where (firstname like 'ก%' or lastname like 'ก%')
order by ex.task_id, ex.student_roll -- 0.047s
LIMIT 50

### 3rd case, 1 task_id follow by 1 word, 
- 1st param numeber handle similar with 1st case.
- 2nd parameter, a word handle similar with 2nd case single word.
i.e. 1st param: 101001 2nd param: 'ก'
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where task_id between 10100111 and 10100133 and (firstname like 'ก%' or lastname like 'ก%')
order by ex.task_id, ex.student_roll -- 0.047s
LIMIT 50

### using like task_id%
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where task_id like '101001%' and (firstname like 'ก%' or lastname like 'ก%')
order by ex.task_id, ex.student_roll -- 4.048s
LIMIT 50

### 4th case, 1 task_id followed by 2 words 
- 1st param numeber handle similar with 1st case.
- 2nd and 3rd parameter, handle similar with 2nd case 2 words.
i.e. 1st param: 101001 2nd param: 'ก' 3rd param: 'ข'
select concat(replace(sn.snr_name, 'คณะจังหวัด',''), if(ex.ss_id NOT between 600000 and 700000, '','-ธ')) as snr_name,
ex.task_id, ex.ss_id as exam_center_code, 
ex.stu_number as master_roll, ex.student_roll,
ex.class_level_id as class_level, ex.class_group_id as class_group,
pr.prefix_name, ex.firstname, ex.lastname,
if(ex.absent1=0, 'มาสอบ','ขาดสอบ') as present_status
from moe.examinee ex
left join moe.prefix pr on ex.prefix_id=pr.id
left join moe.snr sn on ex.snr_id=sn.id
where task_id between 10100111 and 10100133 and (firstname like 'ก%' AND lastname like 'ข%')
order by ex.task_id, ex.student_roll -- 0.039s
LIMIT 50