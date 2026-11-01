"""
Real-world, university-level practical foundation challenges across 5 languages and core topics.
Focuses on clear scenario logic (voter checking, bill calculation, student grades, ATM validation).
Starter code provides ONLY clean function/class signatures with pass/TODOs (never leaks the solution).
"""

CURATED_CHALLENGES = [
    # =========================================================================
    # PYTHON FOUNDATIONS
    # =========================================================================
    {
        "language_slug": "python",
        "topic_slug": "variables-control-flow",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Voter Age & Eligibility Verification System",
        "statement": (
            "You are developing a citizen verification module for a digital voter registration portal.\n\n"
            "Write a function `check_voter_eligibility(age: int) -> str` that verifies eligibility based on the following rules:\n"
            "1. If `age < 0`, return `\"Invalid age: cannot be negative\"`.\n"
            "2. If `age >= 18`, return `\"Eligible to Vote\"`.\n"
            "3. If `age < 18` (and >= 0), return `\"Not eligible: must be at least 18 years old\"`."
        ),
        "constraints_text": (
            "- Input `age` is an integer.\n"
            "- Return the exact strings specified in the requirements.\n"
            "- Handle negative values before checking eligibility."
        ),
        "target_concepts": ["Conditionals (if-elif-else)", "Boundary Checking", "Comparison Operators"],
        "starter_code": (
            "def check_voter_eligibility(age: int) -> str:\n"
            "    \"\"\"\n"
            "    Returns voter eligibility status string based on the given age.\n"
            "    \"\"\"\n"
            "    # TODO: Write your condition checks here\n"
            "    pass\n"
        ),
        "hints": [
            "Check for negative age first: `if age < 0:`.",
            "Use `elif age >= 18:` to identify eligible voters."
        ],
        "examples": [
            {"input": "age = 20", "output": "'Eligible to Vote'"},
            {"input": "age = 16", "output": "'Not eligible: must be at least 18 years old'"},
            {"input": "age = -5", "output": "'Invalid age: cannot be negative'"}
        ]
    },
    {
        "language_slug": "python",
        "topic_slug": "functions-scope",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Residential Electricity Bill Slab Calculator",
        "statement": (
            "In a state electric utility company, residential billing is calculated using tiered consumption slabs:\n\n"
            "Write a function `calculate_electricity_bill(units: float) -> float`:\n"
            "1. If `units <= 0`, return `0.0`.\n"
            "2. For the first 100 units (0 to 100): charged at $1.50 per unit.\n"
            "3. For the next 100 units (101 to 200): charged at $2.50 per unit.\n"
            "4. For units consumed above 200: charged at $4.00 per unit.\n"
            "5. A fixed meter service surcharge of $25.00 is added to all bills with units > 0.\n"
            "6. Return the total bill amount rounded to 2 decimal places."
        ),
        "constraints_text": (
            "- `units` can be a float or integer.\n"
            "- Calculations must apply tiered marginal rates (e.g. 150 units = 100*1.5 + 50*2.5 + 25).\n"
            "- Return rounded to 2 decimal places using `round(total, 2)`."
        ),
        "target_concepts": ["Tiered Math Logic", "Function Parameters & Return", "Type Rounding"],
        "starter_code": (
            "def calculate_electricity_bill(units: float) -> float:\n"
            "    \"\"\"\n"
            "    Calculates total residential electricity bill based on progressive slab pricing.\n"
            "    \"\"\"\n"
            "    # TODO: Implement tiered slab calculations\n"
            "    pass\n"
        ),
        "hints": [
            "If units > 200, the first 100 units are at 1.50, the next 100 at 2.50, and only `(units - 200)` at 4.00.",
            "Don't forget to add the $25.00 fixed meter charge."
        ],
        "examples": [
            {"input": "units = 50", "output": "100.0"},
            {"input": "units = 150", "output": "300.0"}
        ]
    },
    {
        "language_slug": "python",
        "topic_slug": "lists-dicts-comprehensions",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Supermarket Shopping Cart Total & Discount",
        "statement": (
            "Write a function `calculate_cart_total(cart: dict, price_menu: dict) -> float` for a grocery store POS checkout:\n\n"
            "1. `cart` is a dictionary of `{item_name: quantity}`.\n"
            "2. `price_menu` is a dictionary of `{item_name: unit_price}`.\n"
            "3. Compute the subtotal by multiplying quantity by unit_price for each item found in `price_menu`. "
            "Ignore items not in `price_menu` or with quantity <= 0.\n"
            "4. If subtotal exceeds $500.0, apply a 10% discount on the entire subtotal.\n"
            "5. Add 5% sales tax to the discounted subtotal.\n"
            "6. Return the final payable amount rounded to 2 decimal places."
        ),
        "constraints_text": (
            "- Do not mutate the input dictionaries.\n"
            "- Handle empty carts gracefully by returning `0.0`.\n"
            "- Return value must be a float rounded to 2 decimals."
        ),
        "target_concepts": ["Dictionary Iteration", "Key Lookups with dict.get()", "Data Aggregation"],
        "starter_code": (
            "def calculate_cart_total(cart: dict, price_menu: dict) -> float:\n"
            "    \"\"\"\n"
            "    Calculates the final checkout bill with discount and sales tax.\n"
            "    \"\"\"\n"
            "    # TODO: Iterate through cart items and compute total\n"
            "    pass\n"
        ),
        "hints": [
            "Iterate through items using `for item, qty in cart.items():`.",
            "Check `if item in price_menu and qty > 0:`."
        ],
        "examples": [
            {"input": "cart={'milk': 2, 'bread': 1}, price_menu={'milk': 3.0, 'bread': 2.0}", "output": "8.4"}
        ]
    },
    {
        "language_slug": "python",
        "topic_slug": "oop-classes",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Student Grade Card & Performance Tracker",
        "statement": (
            "Implement a class `Student` to manage academic performance records:\n\n"
            "1. `__init__(self, name: str, marks: dict)`: Stores student name and marks dictionary `{subject: score}`.\n"
            "2. `get_average(self) -> float`: Returns average score across all subjects rounded to 2 decimal places. Return 0.0 if marks is empty.\n"
            "3. `get_grade(self) -> str`: Returns letter grade based on average score:\n"
            "   - Average >= 90: 'A'\n"
            "   - Average >= 80: 'B'\n"
            "   - Average >= 70: 'C'\n"
            "   - Average >= 60: 'D'\n"
            "   - Below 60: 'F'\n"
            "4. `is_passing(self) -> bool`: Returns `True` if every individual subject has score >= 40 AND average score >= 50; otherwise returns `False`."
        ),
        "constraints_text": (
            "- Store attributes privately or cleanly on self.\n"
            "- Avoid division by zero when calculating average of empty marks."
        ),
        "target_concepts": ["Class Definitions", "Methods & Instance Variables", "OOP Encapsulation"],
        "starter_code": (
            "class Student:\n"
            "    def __init__(self, name: str, marks: dict):\n"
            "        # TODO: Initialize instance variables\n"
            "        pass\n"
            "\n"
            "    def get_average(self) -> float:\n"
            "        # TODO: Calculate and return average score\n"
            "        pass\n"
            "\n"
            "    def get_grade(self) -> str:\n"
            "        # TODO: Determine letter grade from average\n"
            "        pass\n"
            "\n"
            "    def is_passing(self) -> bool:\n"
            "        # TODO: Check pass conditions\n"
            "        pass\n"
        ),
        "hints": [
            "Use `sum(self.marks.values()) / len(self.marks)` to compute average.",
            "Use `all(score >= 40 for score in self.marks.values())` for the passing check."
        ],
        "examples": []
    },
    {
        "language_slug": "python",
        "topic_slug": "error-handling",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Safe ATM Cash Withdrawal Processor",
        "statement": (
            "Write a function `process_atm_withdrawal(account_balance: float, withdraw_amount: float, daily_limit: float = 1000.0) -> dict` "
            "that handles real-world banking edge cases defensively:\n\n"
            "1. If `withdraw_amount <= 0`, return `{'success': False, 'error': 'INVALID_AMOUNT', 'balance': account_balance}`.\n"
            "2. If `withdraw_amount > daily_limit`, return `{'success': False, 'error': 'DAILY_LIMIT_EXCEEDED', 'balance': account_balance}`.\n"
            "3. If `withdraw_amount > account_balance`, return `{'success': False, 'error': 'INSUFFICIENT_FUNDS', 'balance': account_balance}`.\n"
            "4. If valid: deduct `withdraw_amount` from `account_balance` and return `{'success': True, 'error': None, 'balance': round(account_balance - withdraw_amount, 2)}`."
        ),
        "constraints_text": (
            "- Must never leave negative account balance.\n"
            "- Return exact error codes: INVALID_AMOUNT, DAILY_LIMIT_EXCEEDED, INSUFFICIENT_FUNDS."
        ),
        "target_concepts": ["Defensive Validation", "Status Dictionary Returns", "Business Invariants"],
        "starter_code": (
            "def process_atm_withdrawal(account_balance: float, withdraw_amount: float, daily_limit: float = 1000.0) -> dict:\n"
            "    \"\"\"\n"
            "    Processes an ATM withdrawal transaction with safety checks.\n"
            "    \"\"\"\n"
            "    # TODO: Implement withdrawal validation logic\n"
            "    pass\n"
        ),
        "hints": [
            "Validate amount <= 0 first, then daily limit, then account balance."
        ],
        "examples": [
            {"input": "account_balance=500.0, withdraw_amount=200.0", "output": "{'success': True, 'error': None, 'balance': 300.0}"}
        ]
    },
    {
        "language_slug": "python",
        "topic_slug": "file-io-modules",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Student Attendance CSV Data Parser",
        "statement": (
            "Write a function `parse_attendance_records(csv_text: str) -> dict` that summarizes university lecture attendance:\n\n"
            "Input is a multiline string where each non-empty line has the format `\"StudentName,Status\"` (Status is either `\"Present\"` or `\"Absent\"`).\n"
            "Return a dictionary with:\n"
            "- `\"total\"`: total number of valid student records parsed.\n"
            "- `\"present\"`: count of students with status 'Present'.\n"
            "- `\"absent\"`: count of students with status 'Absent'.\n"
            "- `\"percentage\"`: `(present / total) * 100` rounded to 1 decimal place. (Return `0.0` if total is 0)."
        ),
        "constraints_text": (
            "- Ignore empty or whitespace-only lines.\n"
            "- Handle lines with extra spaces around names or status (e.g. `' John , Present '`)."
        ),
        "target_concepts": ["String Splitting (.split)", "Data Cleansing (.strip)", "Record Aggregation"],
        "starter_code": (
            "def parse_attendance_records(csv_text: str) -> dict:\n"
            "    \"\"\"\n"
            "    Parses CSV lines and returns attendance totals and percentage.\n"
            "    \"\"\"\n"
            "    # TODO: Parse lines and count attendance\n"
            "    pass\n"
        ),
        "hints": [
            "Split string into lines using `csv_text.strip().split('\\n')`.",
            "Split each line with `line.split(',')` and strip whitespace from fields."
        ],
        "examples": []
    },

    # =========================================================================
    # JAVASCRIPT FOUNDATIONS
    # =========================================================================
    {
        "language_slug": "javascript",
        "topic_slug": "variables-operators",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Cinema Movie Ticket Pricing Calculator",
        "statement": (
            "Write a function `calculateTicketPrice(age, isStudent)` for a cinema ticketing kiosk:\n\n"
            "1. If `age < 0` or typeof age !== 'number', return `-1` (Invalid age).\n"
            "2. Under 5 years old: Free (`0.0`).\n"
            "3. Senior citizens (65 and older): `$10.0`.\n"
            "4. Students (`isStudent === true` and age between 5 and 64): `$12.0`.\n"
            "5. General adult admission (all other cases): `$16.0`."
        ),
        "constraints_text": (
            "- Return a number representing the ticket price in dollars.\n"
            "- Use strict equality (`===`) for boolean checking."
        ),
        "target_concepts": ["Variables & Primitives", "Comparison Operators", "Logical Branching"],
        "starter_code": (
            "export function calculateTicketPrice(age, isStudent) {\n"
            "  // TODO: Implement pricing rules\n"
            "}\n"
        ),
        "hints": [
            "Check for invalid age first: `if (age < 0 || typeof age !== 'number') return -1;`",
            "Order conditions: Under 5, then Senior (>= 65), then Student, then default."
        ],
        "examples": [
            {"input": "age = 22, isStudent = true", "output": "12"},
            {"input": "age = 70, isStudent = false", "output": "10"}
        ]
    },
    {
        "language_slug": "javascript",
        "topic_slug": "functions-scope",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Restaurant Bill Splitter with Tip",
        "statement": (
            "Write a function `splitRestaurantBill(billSubtotal, tipPercentage, numberOfGuests)`:\n\n"
            "1. If `numberOfGuests <= 0` or `billSubtotal <= 0`, return `0`.\n"
            "2. Calculate total bill: `billSubtotal + (billSubtotal * tipPercentage / 100)`.\n"
            "3. Divide total bill by `numberOfGuests` to get the individual share.\n"
            "4. Return individual share as a float rounded to 2 decimal places using `Number(share.toFixed(2))`."
        ),
        "constraints_text": (
            "- Handle zero or negative guests safely.\n"
            "- Return numeric float rounded to 2 decimal places."
        ),
        "target_concepts": ["Function Parameters", "Mathematical Expressions", "toFixed Conversion"],
        "starter_code": (
            "export function splitRestaurantBill(billSubtotal, tipPercentage, numberOfGuests) {\n"
            "  // TODO: Compute per-person bill share\n"
            "}\n"
        ),
        "hints": [
            "Check preconditions `if (numberOfGuests <= 0 || billSubtotal <= 0) return 0;`.",
            "Use `Number(perPerson.toFixed(2))` for rounding."
        ],
        "examples": []
    },
    {
        "language_slug": "javascript",
        "topic_slug": "arrays-objects",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Student Examination Filter & Honor Roll",
        "statement": (
            "Write a function `getHonorRollNames(students, cutoffScore = 75)`:\n\n"
            "1. `students` is an array of objects `{ name: string, score: number }`.\n"
            "2. Filter students whose `score >= cutoffScore`.\n"
            "3. Sort them in descending order of `score` (highest score first).\n"
            "4. Return an array containing only the student names in UPPERCASE."
        ),
        "constraints_text": (
            "- Do not mutate the original `students` array.\n"
            "- Return an empty array if no students meet the cutoff."
        ),
        "target_concepts": ["Array .filter()", "Array .sort()", "Array .map()"],
        "starter_code": (
            "export function getHonorRollNames(students, cutoffScore = 75) {\n"
            "  // TODO: Filter, sort and map student names\n"
            "}\n"
        ),
        "hints": [
            "Chain methods: `[...students].filter(...).sort(...).map(...)`."
        ],
        "examples": []
    },

    # =========================================================================
    # C++ FOUNDATIONS
    # =========================================================================
    {
        "language_slug": "cpp",
        "topic_slug": "syntax-basics",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Traffic Light Signal Command System",
        "statement": (
            "Write a C++ function `std::string getTrafficSignalAction(char lightCode)` for an autonomous car navigation controller:\n\n"
            "1. If `lightCode` is `'R'` or `'r'`, return `\"STOP\"`.\n"
            "2. If `lightCode` is `'Y'` or `'y'`, return `\"PREPARE_TO_STOP\"`.\n"
            "3. If `lightCode` is `'G'` or `'g'`, return `\"GO\"`.\n"
            "4. For any other character, return `\"INVALID_SIGNAL\"`."
        ),
        "constraints_text": (
            "- Handle both uppercase and lowercase signal characters.\n"
            "- Return standard `std::string`."
        ),
        "target_concepts": ["Switch or If-Else Branching", "Char Primitives", "std::string Returns"],
        "starter_code": (
            "#include <string>\n"
            "\n"
            "std::string getTrafficSignalAction(char lightCode) {\n"
            "    // TODO: Return navigation action based on signal light\n"
            "    return \"\";\n"
            "}\n"
        ),
        "hints": [
            "Use a `switch` statement or `if/else if` comparing with `'R'`, `'r'`, etc."
        ],
        "examples": []
    },
    {
        "language_slug": "cpp",
        "topic_slug": "functions-references",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "In-Place Integer Sorter with Pass-By-Reference",
        "statement": (
            "Write a C++ function `void orderTwoValues(int& a, int& b)`:\n\n"
            "1. Compares the two integers passed by reference.\n"
            "2. If `a > b`, swaps their values in-place so that after the function executes, `a <= b`.\n"
            "3. If `a <= b`, leaves both values unchanged."
        ),
        "constraints_text": (
            "- Must modify variables in-place via references (pass-by-reference `int&`).\n"
            "- Do not return any value (void return type)."
        ),
        "target_concepts": ["Pass-By-Reference", "In-Place Value Swapping", "Variable References"],
        "starter_code": (
            "void orderTwoValues(int& a, int& b) {\n"
            "    // TODO: Swap a and b if a > b\n"
            "}\n"
        ),
        "hints": [
            "Use `std::swap(a, b)` or a temporary variable `int temp = a; a = b; b = temp;`."
        ],
        "examples": []
    },
    {
        "language_slug": "cpp",
        "topic_slug": "classes-objects",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Bank Account Encapsulation & Transaction Logic",
        "statement": (
            "Implement a C++ class `BankAccount`:\n\n"
            "1. Private members: `std::string accountNumber` and `double balance`.\n"
            "2. Constructor `BankAccount(const std::string& accNum, double initialBalance)`: "
            "if `initialBalance < 0`, set balance to `0.0`.\n"
            "3. `bool deposit(double amount)`: if amount > 0, adds to balance and returns true; otherwise returns false.\n"
            "4. `bool withdraw(double amount)`: if amount > 0 and amount <= balance, deducts from balance and returns true; otherwise returns false.\n"
            "5. `double getBalance() const`: returns current balance."
        ),
        "constraints_text": (
            "- Balance must never be negative.\n"
            "- Mark `getBalance()` with `const`."
        ),
        "target_concepts": ["Class Invariants", "Const Methods", "Constructor Initializers"],
        "starter_code": (
            "#include <string>\n"
            "\n"
            "class BankAccount {\n"
            "private:\n"
            "    std::string accountNumber;\n"
            "    double balance;\n"
            "\n"
            "public:\n"
            "    BankAccount(const std::string& accNum, double initialBalance) {\n"
            "        // TODO: Initialize account and validate balance\n"
            "    }\n"
            "\n"
            "    bool deposit(double amount) {\n"
            "        // TODO: Implement deposit\n"
            "        return false;\n"
            "    }\n"
            "\n"
            "    bool withdraw(double amount) {\n"
            "        // TODO: Implement withdraw\n"
            "        return false;\n"
            "    }\n"
            "\n"
            "    double getBalance() const {\n"
            "        // TODO: Return balance\n"
            "        return 0.0;\n"
            "    }\n"
            "};\n"
        ),
        "hints": [
            "Check `amount > 0` before making changes in deposit and withdraw."
        ],
        "examples": []
    },

    # =========================================================================
    # JAVA FOUNDATIONS
    # =========================================================================
    {
        "language_slug": "java",
        "topic_slug": "basics-data-types",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Voter Registration Age Verification",
        "statement": (
            "In `VoterEligibility.java`, implement `public static String checkEligibility(int age)`:\n\n"
            "1. If `age < 0`: return `\"Invalid Age\"`.\n"
            "2. If `age >= 18`: return `\"Eligible to Vote\"`.\n"
            "3. If `age < 18`: return `\"Not Eligible to Vote\"`."
        ),
        "constraints_text": (
            "- Return exact strings specified.\n"
            "- Static method."
        ),
        "target_concepts": ["Java If-Else Branching", "Primitive int Type", "String Returns"],
        "starter_code": (
            "public class VoterEligibility {\n"
            "    public static String checkEligibility(int age) {\n"
            "        // TODO: Implement eligibility logic\n"
            "        return \"\";\n"
            "    }\n"
            "}\n"
        ),
        "hints": [
            "Check `if (age < 0)` first, followed by `else if (age >= 18)`."
        ],
        "examples": []
    },
    {
        "language_slug": "java",
        "topic_slug": "oop-fundamentals",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Student Grade Card Encapsulation",
        "statement": (
            "Implement a Java class `Student` with private fields `String name` and `int score`:\n\n"
            "1. Constructor `public Student(String name, int score)`.\n"
            "2. Getter `public String getName()`.\n"
            "3. Getter `public int getScore()` and setter `public void setScore(int score)` (only set if score is between 0 and 100).\n"
            "4. Method `public String getGrade()`: returns 'A' for score >= 90, 'B' for >= 80, 'C' for >= 70, 'D' for >= 60, else 'F'."
        ),
        "constraints_text": (
            "- Keep fields strictly private.\n"
            "- Validate setter inputs."
        ),
        "target_concepts": ["Encapsulation", "Getters & Setters", "Precondition Validation"],
        "starter_code": (
            "public class Student {\n"
            "    private String name;\n"
            "    private int score;\n"
            "\n"
            "    public Student(String name, int score) {\n"
            "        // TODO: Initialize fields\n"
            "    }\n"
            "\n"
            "    public String getName() {\n"
            "        // TODO: Return name\n"
            "        return null;\n"
            "    }\n"
            "\n"
            "    public int getScore() {\n"
            "        // TODO: Return score\n"
            "        return 0;\n"
            "    }\n"
            "\n"
            "    public void setScore(int score) {\n"
            "        // TODO: Validate and update score\n"
            "    }\n"
            "\n"
            "    public String getGrade() {\n"
            "        // TODO: Calculate and return grade\n"
            "        return \"\";\n"
            "    }\n"
            "}\n"
        ),
        "hints": [
            "Check `score >= 0 && score <= 100` before updating in setScore."
        ],
        "examples": []
    },

    # =========================================================================
    # C FOUNDATIONS
    # =========================================================================
    {
        "language_slug": "c",
        "topic_slug": "syntax-data-types",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Voter Age Eligibility Checker",
        "statement": (
            "Write a C function `int check_voter_eligibility(int age)`:\n\n"
            "1. If `age < 0`, return `-1` (Invalid input).\n"
            "2. If `age >= 18`, return `1` (Eligible).\n"
            "3. If `age < 18` (and >= 0), return `0` (Not eligible)."
        ),
        "constraints_text": (
            "- Integer return code: 1 for eligible, 0 for not eligible, -1 for invalid."
        ),
        "target_concepts": ["C Conditional Statements", "Primitive Integer Logic", "Return Codes"],
        "starter_code": (
            "int check_voter_eligibility(int age) {\n"
            "    // TODO: Return 1 if eligible, 0 if not eligible, -1 if negative\n"
            "    return 0;\n"
            "}\n"
        ),
        "hints": [
            "Check `age < 0` first and return -1."
        ],
        "examples": []
    },
    {
        "language_slug": "c",
        "topic_slug": "pointers-addresses",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Safe In-Place Pointer Swapper",
        "statement": (
            "Write a C function `void swap_values(int *a, int *b)`:\n\n"
            "1. Safely check if either pointer `a` or `b` is `NULL`. If either is NULL, return immediately without crashing.\n"
            "2. If both pointers are valid, swap the integer values they point to in memory."
        ),
        "constraints_text": (
            "- NULL pointer guard must be first line.\n"
            "- In-place memory swap using dereferencing (`*a`, `*b`)."
        ),
        "target_concepts": ["Pointer Dereferencing (*)", "Null Pointer Safety", "In-Place Swap"],
        "starter_code": (
            "#include <stddef.h>\n"
            "\n"
            "void swap_values(int *a, int *b) {\n"
            "    // TODO: Verify pointers and swap values\n"
            "}\n"
        ),
        "hints": [
            "Use `if (a == NULL || b == NULL) return;`.",
            "Use temporary variable: `int temp = *a; *a = *b; *b = temp;`."
        ],
        "examples": []
    }
]


def get_curated_challenge(language_slug: str, topic_slug: str = None, difficulty: str = "EASY") -> dict:
    """
    Finds the best matching curated challenge for a language and optional topic.
    Falls back gracefully to any curated challenge for that language.
    """
    matching = [
        c for c in CURATED_CHALLENGES
        if c["language_slug"] == language_slug
    ]
    if not matching:
        matching = CURATED_CHALLENGES

    if topic_slug:
        topic_match = [c for c in matching if c.get("topic_slug") == topic_slug]
        if topic_match:
            matching = topic_match

    diff_match = [c for c in matching if c.get("difficulty") == difficulty]
    if diff_match:
        return diff_match[0]

    return matching[0]
