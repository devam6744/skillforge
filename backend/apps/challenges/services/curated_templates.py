"""
Curated foundation challenge templates across languages and core topics.
Used for:
1. Guaranteed offline fallback if Gemini API is unreachable, throttled, or offline.
2. Cold-start database warming without incurring unnecessary external AI latency.
"""

CURATED_CHALLENGES = [
    # ------------------ PYTHON ------------------
    {
        "language_slug": "python",
        "topic_slug": "lists-dicts-comprehensions",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Safe Config Parser with Dictionary Fallbacks",
        "statement": (
            "Write a function `parse_database_config(raw_env: dict, defaults: dict) -> dict` "
            "that merges user-provided environment settings with default configurations.\n"
            "Requirements:\n"
            "1. Do not mutate the original `raw_env` or `defaults` dictionaries.\n"
            "2. For keys present in `raw_env` whose value is not `None`:\n"
            "   - 'port' and 'timeout' must be safely converted to `int`.\n"
            "   - All other keys must be converted to `str`.\n"
            "3. If a value in `raw_env` cannot be converted to `int` (raises `ValueError`), "
            "fall back safely to the value in `defaults` for that key."
        ),
        "constraints_text": (
            "- Time Complexity: O(k) where k is the number of configuration keys.\n"
            "- Space Complexity: O(k) for the newly allocated configuration dictionary.\n"
            "- Must never raise unhandled exceptions on malformed string values."
        ),
        "target_concepts": ["Dictionary Lookups", "Type Coercion", "Defensive Copying", "Exception Handling"],
        "starter_code": (
            "def parse_database_config(raw_env: dict, defaults: dict) -> dict:\n"
            "    # TODO: Implement safe config parser with fallback defaults\n"
            "    config = defaults.copy()\n"
            "    return config\n"
        ),
        "hints": [
            "Use `defaults.copy()` or dictionary unpacking `{**defaults}` to ensure the input isn't mutated.",
            "Use `try ... except (ValueError, TypeError):` when casting integer values."
        ],
        "examples": [
            {
                "input": "raw_env={'port': '5432', 'host': 'db.internal'}, defaults={'port': 5432, 'host': 'localhost', 'timeout': 30}",
                "output": "{'port': 5432, 'host': 'db.internal', 'timeout': 30}"
            }
        ]
    },
    {
        "language_slug": "python",
        "topic_slug": "oop-classes",
        "difficulty": "MEDIUM",
        "practice_mode": "CODING",
        "title": "Encapsulated Token Bucket Rate Limiter",
        "statement": (
            "Implement a class `TokenBucket` for in-memory rate limiting:\n"
            "1. `__init__(self, capacity: int, refill_rate_per_sec: float)`: Initializes bucket capacity and refill rate. "
            "Raise `ValueError` if capacity <= 0 or refill_rate <= 0.\n"
            "2. `allow_request(self, current_time: float, tokens: int = 1) -> bool`: Computes tokens accumulated since last refill, "
            "caps at capacity, and deducts requested tokens if available, returning `True`; otherwise returns `False` without deducting.\n"
            "3. Maintain internal state using private attributes (`_tokens`, `_last_refill_time`)."
        ),
        "constraints_text": (
            "- All methods must execute in O(1) time.\n"
            "- Private attributes must not be modified directly from outside the class."
        ),
        "target_concepts": ["Class Invariants", "OOP Encapsulation", "State Transitions"],
        "starter_code": (
            "class TokenBucket:\n"
            "    def __init__(self, capacity: int, refill_rate_per_sec: float):\n"
            "        if capacity <= 0 or refill_rate_per_sec <= 0:\n"
            "            raise ValueError('Capacity and refill rate must be positive')\n"
            "        self._capacity = float(capacity)\n"
            "        self._refill_rate = float(refill_rate_per_sec)\n"
            "        self._tokens = float(capacity)\n"
            "        self._last_refill_time = 0.0\n"
            "\n"
            "    def allow_request(self, current_time: float, tokens: int = 1) -> bool:\n"
            "        # TODO: Refill based on elapsed time and evaluate allowance\n"
            "        pass\n"
        ),
        "hints": [
            "Compute elapsed time as `current_time - self._last_refill_time`.",
            "Refill tokens = `min(self._capacity, self._tokens + elapsed * self._refill_rate)`."
        ],
        "examples": []
    },
    {
        "language_slug": "python",
        "topic_slug": "error-handling",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Safe JSON Payload Extractor",
        "statement": (
            "Write a function `extract_user_fields(raw_payload: str) -> dict` that parses an untrusted JSON string:\n"
            "1. If `raw_payload` is not valid JSON, return `{'error': 'INVALID_JSON', 'data': None}`.\n"
            "2. If valid JSON, extract `username` (str), `email` (str), and `age` (int).\n"
            "3. If any field is missing or invalid type, return `{'error': 'SCHEMA_MISMATCH', 'data': None}`.\n"
            "4. Otherwise return `{'error': None, 'data': {...}}`."
        ),
        "constraints_text": (
            "- Never let `json.JSONDecodeError` propagate to caller.\n"
            "- Perform strict type validation for all extracted fields."
        ),
        "target_concepts": ["Exception Handling", "JSON Parsing", "Defensive Validation"],
        "starter_code": (
            "import json\n"
            "\n"
            "def extract_user_fields(raw_payload: str) -> dict:\n"
            "    # TODO: Safely parse JSON and validate schema\n"
            "    pass\n"
        ),
        "hints": [
            "Use `try ... except json.JSONDecodeError:` to catch malformed strings.",
            "Use `isinstance(val, type)` to verify field types."
        ],
        "examples": []
    },

    # ------------------ JAVASCRIPT ------------------
    {
        "language_slug": "javascript",
        "topic_slug": "variables-operators",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Deep Normalize User Settings",
        "statement": (
            "Write a function `normalizeSettings(userSettings, defaultSettings)` in JavaScript:\n"
            "1. Return a new object with values from `userSettings` falling back to `defaultSettings`.\n"
            "2. Use nullish coalescing (`??`) so that boolean `false` and number `0` in `userSettings` are preserved and not replaced by defaults.\n"
            "3. Strictly check types: if a property in `userSettings` has a different `typeof` than the corresponding property in `defaultSettings`, use the default."
        ),
        "constraints_text": (
            "- Pure function: do not mutate either parameter.\n"
            "- O(n) time where n is the number of keys in defaultSettings."
        ),
        "target_concepts": ["Nullish Coalescing", "Strict Type Checking", "Immutability"],
        "starter_code": (
            "export function normalizeSettings(userSettings, defaultSettings) {\n"
            "    // TODO: Implement safe settings normalizer\n"
            "    const result = { ...defaultSettings };\n"
            "    return result;\n"
            "}\n"
        ),
        "hints": [
            "Remember that `??` checks for `null` and `undefined`, whereas `||` also treats `false` and `0` as falsy.",
            "Iterate using `Object.keys(defaultSettings)`."
        ],
        "examples": []
    },
    {
        "language_slug": "javascript",
        "topic_slug": "functions-scope",
        "difficulty": "MEDIUM",
        "practice_mode": "CODING",
        "title": "Resilient Auto-Retry Closure with Exponential Backoff",
        "statement": (
            "Implement a higher-order function `createRetrier(asyncFn, maxAttempts, baseDelayMs)`:\n"
            "1. Returns an async function that wraps `asyncFn`.\n"
            "2. If `asyncFn` rejects or throws, retry up to `maxAttempts` times with exponential backoff (`baseDelayMs * 2^(attempt - 1)`).\n"
            "3. If all attempts fail, reject with the last error encountered.\n"
            "4. Maintain retry state cleanly inside the closure."
        ),
        "constraints_text": (
            "- Must work for any asynchronous promise-returning function.\n"
            "- Clean closure state without leaking variables to outer scope."
        ),
        "target_concepts": ["Closures", "Higher-Order Functions", "Async/Await & Promises"],
        "starter_code": (
            "export function createRetrier(asyncFn, maxAttempts = 3, baseDelayMs = 100) {\n"
            "    return async function(...args) {\n"
            "        // TODO: Implement exponential retry closure\n"
            "    };\n"
            "}\n"
        ),
        "hints": [
            "Use a loop from `attempt = 1` to `maxAttempts`.",
            "Use `await new Promise(r => setTimeout(r, delay))` for the delay."
        ],
        "examples": []
    },

    # ------------------ C++ ------------------
    {
        "language_slug": "cpp",
        "topic_slug": "classes-objects",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Safe Bounded Counter: Class Invariants & Const-Correctness",
        "statement": (
            "Implement a C++ class `BoundedCounter` with strict invariant guarantees:\n"
            "1. Private members: `int count` and `const int maxLimit`.\n"
            "2. Constructor `explicit BoundedCounter(int limit)`: initializes count to 0 and maxLimit to limit. "
            "Use member initializer list. If limit <= 0, throw `std::invalid_argument`.\n"
            "3. `bool increment()`: increases count by 1 if `count < maxLimit` and returns true; otherwise returns false.\n"
            "4. `int getCount() const`: returns current count (marked const).\n"
            "5. `void reset()`: resets count back to 0."
        ),
        "constraints_text": (
            "- All methods must be marked const where appropriate.\n"
            "- Explicit constructor prevents accidental implicit type conversion."
        ),
        "target_concepts": ["Class Invariants", "Const-Correctness", "Constructor Initializer Lists"],
        "starter_code": (
            "#include <stdexcept>\n"
            "\n"
            "class BoundedCounter {\n"
            "private:\n"
            "    int count;\n"
            "    const int maxLimit;\n"
            "\n"
            "public:\n"
            "    explicit BoundedCounter(int limit) : count(0), maxLimit(limit) {\n"
            "        if (limit <= 0) {\n"
            "            throw std::invalid_argument(\"Limit must be positive\");\n"
            "        }\n"
            "    }\n"
            "\n"
            "    bool increment() {\n"
            "        // TODO: Implement boundary-checked increment\n"
            "        return false;\n"
            "    }\n"
            "\n"
            "    int getCount() const {\n"
            "        return count;\n"
            "    }\n"
            "\n"
            "    void reset() {\n"
            "        count = 0;\n"
            "    }\n"
            "};\n"
        ),
        "hints": [
            "Check `count < maxLimit` before incrementing.",
            "Make sure query methods like `getCount` are marked `const`."
        ],
        "examples": []
    },
    {
        "language_slug": "cpp",
        "topic_slug": "pointers-memory",
        "difficulty": "MEDIUM",
        "practice_mode": "CODING",
        "title": "RAII Managed Buffer Wrapper",
        "statement": (
            "Create a lightweight RAII buffer class `SafeBuffer`:\n"
            "1. Constructor allocates a heap buffer of given `size_t bytes` using `new char[bytes]`.\n"
            "2. Destructor safely frees memory using `delete[]`.\n"
            "3. Delete copy constructor and copy assignment operator (`= delete`) to prevent double-free bugs.\n"
            "4. Implement move constructor and move assignment operator for safe transfer of ownership."
        ),
        "constraints_text": (
            "- Rule of Five compliance.\n"
            "- Zero memory leaks under all allocation paths."
        ),
        "target_concepts": ["RAII", "Pointers & Dynamic Memory", "Rule of Five", "Move Semantics"],
        "starter_code": (
            "#include <cstddef>\n"
            "#include <utility>\n"
            "\n"
            "class SafeBuffer {\n"
            "private:\n"
            "    char* data;\n"
            "    size_t size;\n"
            "\n"
            "public:\n"
            "    explicit SafeBuffer(size_t bytes) : data(new char[bytes]), size(bytes) {}\n"
            "    ~SafeBuffer() { delete[] data; }\n"
            "\n"
            "    // Disable copy\n"
            "    SafeBuffer(const SafeBuffer&) = delete;\n"
            "    SafeBuffer& operator=(const SafeBuffer&) = delete;\n"
            "\n"
            "    // Move constructor\n"
            "    SafeBuffer(SafeBuffer&& other) noexcept : data(other.data), size(other.size) {\n"
            "        other.data = nullptr;\n"
            "        other.size = 0;\n"
            "    }\n"
            "};\n"
        ),
        "hints": [
            "Set moved-from pointer to `nullptr` to avoid double-free when the source object destructs."
        ],
        "examples": []
    },

    # ------------------ JAVA ------------------
    {
        "language_slug": "java",
        "topic_slug": "oop-fundamentals",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Bank Account: Encapsulation & Robust Preconditions",
        "statement": (
            "Implement a Java class `BankAccount` demonstrating fundamental OOP encapsulation:\n"
            "1. Private fields `String accountNumber` and `double balance`.\n"
            "2. Constructor `BankAccount(String accountNumber, double initialBalance)`: "
            "if `initialBalance < 0`, throw `IllegalArgumentException`.\n"
            "3. `void deposit(double amount)`: adds amount to balance if `amount > 0`; otherwise throws `IllegalArgumentException`.\n"
            "4. `boolean withdraw(double amount)`: deducts amount if `amount > 0` and `amount <= balance`, returning true; otherwise returns false.\n"
            "5. `double getBalance()`: returns current balance."
        ),
        "constraints_text": (
            "- balance must never become negative.\n"
            "- accountNumber must be immutable (marked final)."
        ),
        "target_concepts": ["Data Encapsulation", "Precondition Checks", "Immutability"],
        "starter_code": (
            "public class BankAccount {\n"
            "    private final String accountNumber;\n"
            "    private double balance;\n"
            "\n"
            "    public BankAccount(String accountNumber, double initialBalance) {\n"
            "        if (initialBalance < 0) {\n"
            "            throw new IllegalArgumentException(\"Initial balance cannot be negative\");\n"
            "        }\n"
            "        this.accountNumber = accountNumber;\n"
            "        this.balance = initialBalance;\n"
            "    }\n"
            "\n"
            "    public void deposit(double amount) {\n"
            "        // TODO: Validate amount > 0 and add to balance\n"
            "    }\n"
            "\n"
            "    public boolean withdraw(double amount) {\n"
            "        // TODO: Validate amount and deduct if sufficient funds\n"
            "        return false;\n"
            "    }\n"
            "\n"
            "    public double getBalance() {\n"
            "        return this.balance;\n"
            "    }\n"
            "}\n"
        ),
        "hints": [
            "Never provide direct public setter access to balance.",
            "Throw `IllegalArgumentException` when deposit amount is <= 0."
        ],
        "examples": []
    },

    # ------------------ C ------------------
    {
        "language_slug": "c",
        "topic_slug": "pointers-addresses",
        "difficulty": "EASY",
        "practice_mode": "CODING",
        "title": "Safe String Case Converter: Pointer Traversal",
        "statement": (
            "Write a C function `void to_uppercase(char *str)` that converts all lowercase English letters "
            "in a null-terminated string to uppercase in-place:\n"
            "1. Safely check for `NULL` pointer before dereferencing to prevent segmentation faults.\n"
            "2. Traverse the character buffer using pointer arithmetic until encountering `\'\\0\'`.\n"
            "3. If character is between `\'a\'` and `\'z\'`, convert it to uppercase by subtracting `(\'a\' - \'A\')` or 32.\n"
            "4. Modify buffer in-place without allocating auxiliary memory."
        ),
        "constraints_text": (
            "- NULL pointer check must be first statement.\n"
            "- O(1) auxiliary memory.\n"
            "- Do not alter punctuation or numbers."
        ),
        "target_concepts": ["Pointer Dereferencing", "Null Pointer Safety", "In-Place Modification"],
        "starter_code": (
            "#include <stddef.h>\n"
            "\n"
            "void to_uppercase(char *str) {\n"
            "    // TODO: Verify NULL pointer then traverse buffer\n"
            "    if (str == NULL) return;\n"
            "    while (*str != '\\0') {\n"
            "        // convert character\n"
            "        str++;\n"
            "    }\n"
            "}\n"
        ),
        "hints": [
            "Check `*str >= 'a' && *str <= 'z'` before modifying.",
            "Increment pointer using `str++` in loop."
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
