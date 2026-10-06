import { db } from '../db/index.ts';
import { certificates, skillTests, skillTestQuestions, profiles } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface GeneratedTestQuestion {
  questionNumber: number;
  questionType: 'MCQ' | 'CODE';
  questionText: string;
  options: string[];
  starterCode: string;
  expectedKeywords: string[];
  correctAnswer: string;
  explanation: string;
  points: number;
}

const SKILL_BANK: Record<
  string,
  {
    mcqs: Array<{
      q: string;
      options: string[];
      a: string;
      exp: string;
    }>;
    codeQuestions: Array<{
      q: string;
      starter: string;
      keywords: string[];
      solution: string;
      exp: string;
    }>;
  }
> = {
  JavaScript: {
    mcqs: [
      {
        q: 'What is the output of `typeof null` in JavaScript?',
        options: ['"object"', '"null"', '"undefined"', '"boolean"'],
        a: '"object"',
        exp: 'In JavaScript, `typeof null` returns `"object"` due to a legacy type tag implementation in the original specification.',
      },
      {
        q: 'Which array method creates a new array populated with the results of calling a provided function on every element?',
        options: ['Array.prototype.map()', 'Array.prototype.forEach()', 'Array.prototype.reduce()', 'Array.prototype.filter()'],
        a: 'Array.prototype.map()',
        exp: '`map()` transforms each element and returns a new array of the same length.',
      },
      {
        q: 'What does `Promise.all([p1, p2, p3])` do if `p2` rejects immediately?',
        options: [
          'Rejects immediately with the reason from p2',
          'Waits for p1 and p3 to settle before rejecting',
          'Returns an array containing an Error object at index 1',
          'Retries p2 automatically once',
        ],
        a: 'Rejects immediately with the reason from p2',
        exp: '`Promise.all` is fail-fast and rejects as soon as any input promise rejects.',
      },
      {
        q: 'Which keyword declares a block-scoped variable that cannot be reassigned?',
        options: ['const', 'let', 'var', 'static'],
        a: 'const',
        exp: '`const` creates a block-scoped binding whose reference cannot be reassigned.',
      },
      {
        q: 'What is a closure in JavaScript?',
        options: [
          'A function bundled together with lexical references to its surrounding state',
          'A method used to close a WebSocket connection',
          'An immediately invoked arrow function expression',
          'A private class destructor',
        ],
        a: 'A function bundled together with lexical references to its surrounding state',
        exp: 'Closures allow inner functions to access variables from an enclosing scope even after the outer function finishes executing.',
      },
      {
        q: 'In the JavaScript Event Loop, which queue has higher execution priority after the current call stack clears?',
        options: ['Microtask queue (Promises)', 'Macrotask queue (setTimeout)', 'Animation frame queue', 'I/O polling queue'],
        a: 'Microtask queue (Promises)',
        exp: 'All queued microtasks (such as `.then` callbacks) run to completion before the next macrotask.',
      },
      {
        q: 'What does the `===` operator check in JavaScript?',
        options: [
          'Both value and data type without type coercion',
          'Value equality after implicit type conversion',
          'Prototype chain inheritance',
          'Memory address reference for primitives only',
        ],
        a: 'Both value and data type without type coercion',
        exp: 'Strict equality (`===`) compares both type and value without performing coercion.',
      },
      {
        q: 'Which syntax correctly destructures the property `name` from `user` with a fallback value of `"Guest"`?',
        options: [
          'const { name = "Guest" } = user;',
          'const { name : "Guest" } = user;',
          'const [ name = "Guest" ] = user;',
          'const { name || "Guest" } = user;',
        ],
        a: 'const { name = "Guest" } = user;',
        exp: 'Default values in object destructuring use `=` syntax (`{ prop = defaultVal }`).',
      },
      {
        q: 'How do you prevent an event from bubbling up the DOM tree?',
        options: ['event.stopPropagation()', 'event.preventDefault()', 'event.haltBubble()', 'return false'],
        a: 'event.stopPropagation()',
        exp: '`event.stopPropagation()` stops the event from bubbling to parent elements.',
      },
      {
        q: 'What is the value of `Boolean([])` in JavaScript?',
        options: ['true', 'false', 'undefined', 'NaN'],
        a: 'true',
        exp: 'All objects, including empty arrays `[]` and empty objects `{}`, are truthy in JavaScript.',
      },
      {
        q: 'Which built-in object stores unique values of any type, whether primitive values or object references?',
        options: ['Set', 'Map', 'WeakMap', 'Array'],
        a: 'Set',
        exp: 'A `Set` collection lets you store unique values with O(1) lookup.',
      },
      {
        q: 'What does `Object.freeze(obj)` do?',
        options: [
          'Prevents adding, deleting, or modifying top-level properties of obj',
          'Deeply clones the object into read-only memory',
          'Converts all object properties into getters',
          'Deletes all prototype methods on obj',
        ],
        a: 'Prevents adding, deleting, or modifying top-level properties of obj',
        exp: '`Object.freeze` performs a shallow freeze on the target object.',
      },
      {
        q: 'What is the result of `"5" - 2` in JavaScript?',
        options: ['3', '"52"', 'NaN', '"3"'],
        a: '3',
        exp: 'The binary `-` operator converts numeric strings to numbers (`5 - 2 = 3`).',
      },
      {
        q: 'Which method converts a JavaScript object or value into a JSON string?',
        options: ['JSON.stringify()', 'JSON.parse()', 'Object.toJSON()', 'String.fromJSON()'],
        a: 'JSON.stringify()',
        exp: '`JSON.stringify()` serializes a JavaScript value into a JSON-formatted string.',
      },
      {
        q: 'How does an arrow function `() => {}` handle the `this` binding?',
        options: [
          'It lexically inherits `this` from its enclosing scope',
          'It binds `this` to the global window object in strict mode',
          'It creates a new `this` context on every invocation',
          'It binds `this` to the function itself',
        ],
        a: 'It lexically inherits `this` from its enclosing scope',
        exp: 'Arrow functions do not have their own `this`; they capture `this` from the surrounding lexical context.',
      },
      {
        q: 'Which operator safely accesses deeply nested object properties without throwing an error if a reference is nullish?',
        options: ['Optional chaining (?.)', 'Nullish coalescing (??)', 'Logical AND (&&)', 'Spread operator (...)'],
        a: 'Optional chaining (?.)',
        exp: 'Optional chaining `?.` short-circuits and evaluates to `undefined` if the left operand is `null` or `undefined`.',
      },
    ],
    codeQuestions: [
      {
        q: 'Write a JavaScript function `sumEvenNumbers(arr)` that takes an array of integers and returns the sum of all even numbers in the array.',
        starter: 'function sumEvenNumbers(arr) {\n  // Write your implementation here\n  \n}',
        keywords: ['return', '%', '2'],
        solution: 'function sumEvenNumbers(arr) {\n  return arr.filter(n => n % 2 === 0).reduce((a, b) => a + b, 0);\n}',
        exp: 'Check each number with `n % 2 === 0` and accumulate the sum using `reduce` or a `for` loop.',
      },
      {
        q: 'Write a JavaScript function `reverseWords(str)` that reverses the order of words in a sentence separated by spaces (e.g. `"hello world"` -> `"world hello"`).',
        starter: 'function reverseWords(str) {\n  // Write your implementation here\n  \n}',
        keywords: ['split', 'reverse', 'join', 'return'],
        solution: 'function reverseWords(str) {\n  return str.trim().split(/\\s+/).reverse().join(" ");\n}',
        exp: 'Split the string into words, reverse the array, and join back with a space.',
      },
      {
        q: 'Write a JavaScript function `removeDuplicates(arr)` that returns a new array with duplicate values removed while preserving order.',
        starter: 'function removeDuplicates(arr) {\n  // Write your implementation here\n  \n}',
        keywords: ['return', 'Set'],
        solution: 'function removeDuplicates(arr) {\n  return [...new Set(arr)];\n}',
        exp: 'Using `[...new Set(arr)]` or `Array.from(new Set(arr))` or `filter` removes duplicates in O(n) time.',
      },
      {
        q: 'Write an async JavaScript function `fetchUserData(url)` that uses `fetch` to get JSON data from `url` and returns the parsed object.',
        starter: 'async function fetchUserData(url) {\n  // Write your implementation here\n  \n}',
        keywords: ['await', 'fetch', 'json', 'return'],
        solution: 'async function fetchUserData(url) {\n  const res = await fetch(url);\n  return await res.json();\n}',
        exp: 'Await `fetch(url)` and then return `await res.json()`.',
      },
    ],
  },
  Python: {
    mcqs: [
      {
        q: 'What is the output of `[x * 2 for x in range(4) if x % 2 == 1]` in Python?',
        options: ['[2, 6]', '[0, 2, 4, 6]', '[1, 3]', '[2, 4]'],
        a: '[2, 6]',
        exp: 'Odd numbers in `range(4)` are `1` and `3`; multiplied by 2 gives `[2, 6]`.',
      },
      {
        q: 'Which Python data structure is immutable?',
        options: ['tuple', 'list', 'dict', 'set'],
        a: 'tuple',
        exp: 'Tuples are immutable sequences in Python, whereas lists, dicts, and sets are mutable.',
      },
      {
        q: 'What does `*args` allow a Python function to accept?',
        options: [
          'A variable number of positional arguments packed into a tuple',
          'A variable number of keyword arguments packed into a dictionary',
          'Pointer references to C variables',
          'Only list arguments',
        ],
        a: 'A variable number of positional arguments packed into a tuple',
        exp: '`*args` collects extra positional arguments as a tuple; `**kwargs` collects keyword arguments as a dict.',
      },
      {
        q: 'What is the time complexity of looking up a key in a Python `dict` on average?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        a: 'O(1)',
        exp: 'Python dictionaries are implemented as hash tables, providing O(1) average lookup time.',
      },
      {
        q: 'Which keyword is used in Python to create an anonymous inline function?',
        options: ['lambda', 'def', 'func', 'yield'],
        a: 'lambda',
        exp: '`lambda arguments: expression` creates an anonymous function in Python.',
      },
      {
        q: 'What does a function containing the `yield` keyword return when called?',
        options: ['A generator iterator object', 'A tuple of all yielded values', 'A coroutine thread', 'None'],
        a: 'A generator iterator object',
        exp: 'Using `yield` turns a function into a generator that produces values lazily on iteration.',
      },
      {
        q: 'What is the difference between `is` and `==` in Python?',
        options: [
          '`is` checks object identity in memory; `==` checks value equality',
          '`is` checks value equality; `==` checks memory reference',
          'They are identical in all cases',
          '`is` is only valid for strings',
        ],
        a: '`is` checks object identity in memory; `==` checks value equality',
        exp: '`is` compares `id(a) == id(b)` while `==` invokes `__eq__()`.',
      },
      {
        q: 'Which built-in function pairs elements from two iterables into tuples?',
        options: ['zip()', 'enumerate()', 'map()', 'islice()'],
        a: 'zip()',
        exp: '`zip(a, b)` yields tuples pairing elements at matching indices.',
      },
      {
        q: 'How is a context manager typically invoked in Python to ensure automatic resource cleanup?',
        options: ['Using the `with` statement', 'Using the `defer` statement', 'Using `finally:` without `try:`', 'Using `@cleanup`'],
        a: 'Using the `with` statement',
        exp: 'The `with` statement invokes `__enter__()` and guarantees `__exit__()` runs on block exit.',
      },
      {
        q: 'What does `nums[::-1]` return for a list `nums`?',
        options: ['A new list with elements in reverse order', 'The last element of the list', 'All elements except the last', 'An IndexError'],
        a: 'A new list with elements in reverse order',
        exp: 'A slice with step `-1` (`[::-1]`) returns a reversed shallow copy of the sequence.',
      },
      {
        q: 'Which decorator defines a method on a class that receives the class (`cls`) rather than the instance (`self`) as its first argument?',
        options: ['@classmethod', '@staticmethod', '@property', '@abstractmethod'],
        a: '@classmethod',
        exp: '`@classmethod` passes the class object `cls` as the first parameter.',
      },
      {
        q: 'What does `dict.get("key", 0)` return if `"key"` is not present in `dict`?',
        options: ['0', 'None', 'KeyError', 'False'],
        a: '0',
        exp: 'The second argument to `dict.get()` specifies the default value when the key is missing.',
      },
      {
        q: 'In Python OOP, what is `__init__`?',
        options: [
          'The instance initializer method called after object creation',
          'The static class destructor',
          'A module import hook',
          'A private variable declarator',
        ],
        a: 'The instance initializer method called after object creation',
        exp: '`__init__(self, ...)` initializes a newly created object instance.',
      },
      {
        q: 'Which module in the Python Standard Library provides `Counter`, `defaultdict`, and `deque`?',
        options: ['collections', 'itertools', 'functools', 'typing'],
        a: 'collections',
        exp: 'The `collections` module provides specialized container datatypes.',
      },
      {
        q: 'What is the result of `bool("")` and `bool([0])` in Python?',
        options: ['False and True', 'False and False', 'True and True', 'True and False'],
        a: 'False and True',
        exp: 'An empty string `""` is falsy (`False`), whereas a non-empty list `[0]` is truthy (`True`).',
      },
      {
        q: 'Which exception is raised when trying to access a non-existent key in a Python dictionary using `d[key]`?',
        options: ['KeyError', 'IndexError', 'AttributeError', 'ValueError'],
        a: 'KeyError',
        exp: 'Direct bracket lookup `d[key]` raises `KeyError` when `key` is not found.',
      },
    ],
    codeQuestions: [
      {
        q: 'Write a Python function `count_vowels(text)` that counts and returns the total number of vowels (`a, e, i, o, u`, case-insensitive) in `text`.',
        starter: 'def count_vowels(text: str) -> int:\n    # Write your Python solution here\n    pass',
        keywords: ['return', 'for', 'in', 'aeiou'],
        solution: 'def count_vowels(text: str) -> int:\n    return sum(1 for ch in text.lower() if ch in "aeiou")',
        exp: 'Iterate through `text.lower()` and count characters that belong to `"aeiou"`.',
      },
      {
        q: 'Write a Python function `find_duplicates(nums)` that returns a list of elements that appear more than once in `nums`.',
        starter: 'def find_duplicates(nums: list[int]) -> list[int]:\n    # Write your Python solution here\n    pass',
        keywords: ['def', 'return', 'for'],
        solution: 'def find_duplicates(nums: list[int]) -> list[int]:\n    seen = set()\n    dups = set()\n    for n in nums:\n        if n in seen:\n            dups.add(n)\n        seen.add(n)\n    return list(dups)',
        exp: 'Track visited numbers in a `set` and collect numbers encountered more than once.',
      },
      {
        q: 'Write a Python function `is_palindrome(s)` that returns `True` if string `s` reads the same forward and backward (ignoring case and spaces), and `False` otherwise.',
        starter: 'def is_palindrome(s: str) -> bool:\n    # Write your Python solution here\n    pass',
        keywords: ['return', 'lower', '::-1'],
        solution: 'def is_palindrome(s: str) -> bool:\n    cleaned = s.replace(" ", "").lower()\n    return cleaned == cleaned[::-1]',
        exp: 'Normalize case and spaces, then compare `cleaned == cleaned[::-1]`.',
      },
      {
        q: 'Write a Python function `factorial(n)` that returns the factorial of a non-negative integer `n`.',
        starter: 'def factorial(n: int) -> int:\n    # Write your Python solution here\n    pass',
        keywords: ['def', 'return'],
        solution: 'def factorial(n: int) -> int:\n    result = 1\n    for i in range(2, n + 1):\n        result *= i\n    return result',
        exp: 'Multiply integers from `1` to `n` (with `0! = 1`).',
      },
    ],
  },
};

function buildSkillQuestionsForSkill(skillName: string): GeneratedTestQuestion[] {
  const normalized = skillName.trim();
  const bank = SKILL_BANK[normalized];

  if (bank) {
    const questions: GeneratedTestQuestion[] = [];
    bank.mcqs.slice(0, 16).forEach((m, idx) => {
      questions.push({
        questionNumber: idx + 1,
        questionType: 'MCQ',
        questionText: m.q,
        options: m.options,
        starterCode: '',
        expectedKeywords: [],
        correctAnswer: m.a,
        explanation: m.exp,
        points: 5,
      });
    });
    bank.codeQuestions.slice(0, 4).forEach((c, idx) => {
      questions.push({
        questionNumber: 17 + idx,
        questionType: 'CODE',
        questionText: c.q,
        options: [],
        starterCode: c.starter,
        expectedKeywords: c.keywords,
        correctAnswer: c.solution,
        explanation: c.exp,
        points: 5,
      });
    });
    return questions;
  }

  // Dynamic domain-specific question set for any other technical/academic skill (React, SQL, Java, C++, Node.js, HTML/CSS, Flutter, MongoDB, etc.)
  const mcqs: Array<{ q: string; options: string[]; a: string; exp: string }> = [
    {
      q: `In ${normalized}, what is the primary advantage of modular architecture and separation of concerns?`,
      options: [
        'Improved maintainability, testability, and independent component reuse',
        'Eliminating the need for runtime error handling',
        'Forcing all logic into a single global execution file',
        'Disabling compile-time and runtime validation',
      ],
      a: 'Improved maintainability, testability, and independent component reuse',
      exp: `Modular design in ${normalized} isolates responsibilities so components can be tested and maintained independently.`,
    },
    {
      q: `When optimizing performance in a production ${normalized} project, which step should come first?`,
      options: [
        'Profile and measure actual bottlenecks with benchmarks/metrics',
        'Rewrite the entire codebase without measuring',
        'Remove all validation checks in production',
        'Disable caching across all layers',
      ],
      a: 'Profile and measure actual bottlenecks with benchmarks/metrics',
      exp: 'Profiling identifies real bottlenecks before applying targeted optimizations.',
    },
    {
      q: `Which practice is essential when mentoring a peer in ${normalized} during a live technical session?`,
      options: [
        'Walking through small, verifiable examples and explaining root causes of errors',
        'Sharing only compiled binaries without source code explanation',
        'Skipping foundational concepts and edge cases',
        'Avoiding debugging tools or console inspection',
      ],
      a: 'Walking through small, verifiable examples and explaining root causes of errors',
      exp: 'Incremental hands-on verification builds lasting technical mastery.',
    },
    {
      q: `How should sensitive credentials or configuration secrets be handled in a ${normalized} application?`,
      options: [
        'Stored in environment variables outside source control',
        'Hardcoded directly inside public client source files',
        'Committed in plain text to public Git repositories',
        'Passed in URL query strings',
      ],
      a: 'Stored in environment variables outside source control',
      exp: 'Environment variables keep secrets out of version control and client bundles.',
    },
    {
      q: `What is the role of automated unit and integration testing in ${normalized}?`,
      options: [
        'Verifying expected behavior and preventing regressions when refactoring',
        'Replacing all user input validation',
        'Increasing network latency in production',
        'Bypassing code review processes',
      ],
      a: 'Verifying expected behavior and preventing regressions when refactoring',
      exp: 'Tests provide deterministic confidence that code changes do not break existing functionality.',
    },
    {
      q: `When handling asynchronous or I/O operations in ${normalized}, what is the recommended error-handling pattern?`,
      options: [
        'Use structured try/catch or error callbacks with meaningful error states',
        'Silently ignore all failed operations',
        'Terminate the entire application process on minor user input errors',
        'Retry infinitely in a blocking synchronous loop',
      ],
      a: 'Use structured try/catch or error callbacks with meaningful error states',
      exp: 'Structured error handling prevents unhandled crashes and gives clear feedback.',
    },
    {
      q: `Which data structure provides O(1) average time complexity for key-based lookups in ${normalized} workflows?`,
      options: ['Hash Map / Dictionary', 'Unsorted Linear Array', 'Singly Linked List', 'Binary Search Tree'],
      a: 'Hash Map / Dictionary',
      exp: 'Hash maps compute a key hash to locate entries in constant average time O(1).',
    },
    {
      q: `What does idempotency mean in ${normalized} API and state operations?`,
      options: [
        'Performing the same operation multiple times produces the same state as performing it once',
        'Every request generates a random side effect',
        'Operations can only be executed once per server restart',
        'Data is never persisted to disk',
      ],
      a: 'Performing the same operation multiple times produces the same state as performing it once',
      exp: 'Idempotent operations safely handle network retries without unintended duplicate side effects.',
    },
    {
      q: `Why is input sanitization and validation critical in ${normalized} systems?`,
      options: [
        'To prevent injection attacks, malformed state, and unexpected runtime crashes',
        'To make source code files larger',
        'To bypass authentication tokens',
        'To slow down database reads',
      ],
      a: 'To prevent injection attacks, malformed state, and unexpected runtime crashes',
      exp: 'Validating inputs at system boundaries protects both security and data integrity.',
    },
    {
      q: `In ${normalized} version control workflows, what is the purpose of a feature branch and pull request?`,
      options: [
        'Isolating changes for peer code review and automated checks before merging to main',
        'Deleting git commit history permanently',
        'Deploying untested code directly to production',
        'Disabling collaboration between developers',
      ],
      a: 'Isolating changes for peer code review and automated checks before merging to main',
      exp: 'Feature branches enable safe review and CI verification prior to merging.',
    },
    {
      q: `What is the time complexity of binary search on a sorted collection of N elements in ${normalized}?`,
      options: ['O(log N)', 'O(N)', 'O(N log N)', 'O(N^2)'],
      a: 'O(log N)',
      exp: 'Binary search halves the search space on each comparison, resulting in O(log N) time complexity.',
    },
    {
      q: `When designing reusable components or functions in ${normalized}, what does "pure function / deterministic output" mean?`,
      options: [
        'Given the same inputs, it always returns the same output without side effects',
        'It modifies global variables on every call',
        'It relies on random number generators',
        'It cannot accept parameters',
      ],
      a: 'Given the same inputs, it always returns the same output without side effects',
      exp: 'Pure functions are predictable, cacheable, and easy to unit test.',
    },
    {
      q: `Which HTTP status code indicates that a resource was successfully created in a RESTful ${normalized} service?`,
      options: ['201 Created', '204 No Content', '400 Bad Request', '500 Internal Server Error'],
      a: '201 Created',
      exp: 'HTTP 201 indicates that the request succeeded and a new resource was created.',
    },
    {
      q: `What is the main benefit of pagination or lazy loading when handling large datasets in ${normalized}?`,
      options: [
        'Reduces memory footprint and improves initial response/render time',
        'Forces the database to scan all rows twice',
        'Increases bandwidth usage on mobile devices',
        'Prevents users from searching records',
      ],
      a: 'Reduces memory footprint and improves initial response/render time',
      exp: 'Fetching bounded pages keeps memory and network payloads fast and predictable.',
    },
    {
      q: `When debugging a regression in ${normalized}, what is the most effective way to isolate the cause?`,
      options: [
        'Create a minimal reproducible test case and inspect state transitions step by step',
        'Guess randomly and change multiple unrelated files at once',
        'Delete error logs so warnings disappear',
        'Restart the computer without reading the stack trace',
      ],
      a: 'Create a minimal reproducible test case and inspect state transitions step by step',
      exp: 'A minimal reproduction isolates variables and pinpoints the exact failing line.',
    },
    {
      q: `What is the primary purpose of indexing columns in database-backed ${normalized} applications?`,
      options: [
        'Accelerating query lookup and filtering operations without full table scans',
        'Encrypting user passwords automatically',
        'Increasing disk storage usage with no query benefit',
        'Preventing foreign key relationships',
      ],
      a: 'Accelerating query lookup and filtering operations without full table scans',
      exp: 'B-tree and hash indexes allow the database engine to locate matching rows in logarithmic or constant time.',
    },
  ];

  const codeQuestions = [
    {
      q: `[${normalized} Coding Task 1] Write a function or routine \`filterActiveItems(items)\` that filters a collection of objects and returns only those where \`isActive\` is truthy.`,
      starter: `// Skill: ${normalized}\nfunction filterActiveItems(items) {\n  // Write your implementation here\n  \n}`,
      keywords: ['return', 'filter', 'isActive'],
      solution: `function filterActiveItems(items) {\n  return items.filter(item => Boolean(item.isActive));\n}`,
      exp: 'Filter the input collection by checking the `isActive` property on each item.',
    },
    {
      q: `[${normalized} Coding Task 2] Write a function \`calculateAverage(scores)\` that takes an array/list of numeric scores and returns their arithmetic mean (or 0 if empty).`,
      starter: `// Skill: ${normalized}\nfunction calculateAverage(scores) {\n  // Write your implementation here\n  \n}`,
      keywords: ['return', 'length'],
      solution: `function calculateAverage(scores) {\n  if (!scores || scores.length === 0) return 0;\n  return scores.reduce((a, b) => a + b, 0) / scores.length;\n}`,
      exp: 'Guard against an empty list, sum all elements, and divide by `scores.length`.',
    },
    {
      q: `[${normalized} Coding Task 3] Write a function \`formatSkillBadge(skillName, level)\` that returns a formatted label string \`"<skillName> (<level>)"\` after trimming whitespace.`,
      starter: `// Skill: ${normalized}\nfunction formatSkillBadge(skillName, level) {\n  // Write your implementation here\n  \n}`,
      keywords: ['return', 'skillName', 'level'],
      solution: `function formatSkillBadge(skillName, level) {\n  return \`\${String(skillName).trim()} (\${String(level).trim()})\`;\n}`,
      exp: 'Trim both inputs and combine them into the formatted string.',
    },
    {
      q: `[${normalized} Coding Task 4] Write a function \`groupByCategory(skills)\` that groups an array of skill objects (\`{ name, category }\`) into an object/map keyed by \`category\`.`,
      starter: `// Skill: ${normalized}\nfunction groupByCategory(skills) {\n  // Write your implementation here\n  \n}`,
      keywords: ['return', 'category'],
      solution: `function groupByCategory(skills) {\n  return skills.reduce((acc, item) => {\n    (acc[item.category] = acc[item.category] || []).push(item);\n    return acc;\n  }, {});\n}`,
      exp: 'Iterate through the items and accumulate arrays keyed by `item.category`.',
    },
  ];

  const questions: GeneratedTestQuestion[] = [];
  mcqs.forEach((m, idx) => {
    questions.push({
      questionNumber: idx + 1,
      questionType: 'MCQ',
      questionText: m.q,
      options: m.options,
      starterCode: '',
      expectedKeywords: [],
      correctAnswer: m.a,
      explanation: m.exp,
      points: 5,
    });
  });
  codeQuestions.forEach((c, idx) => {
    questions.push({
      questionNumber: 17 + idx,
      questionType: 'CODE',
      questionText: c.q,
      options: [],
      starterCode: c.starter,
      expectedKeywords: c.keywords,
      correctAnswer: c.solution,
      explanation: c.exp,
      points: 5,
    });
  });
  return questions;
}

export function generateSkillTestQuestions(skill: string): GeneratedTestQuestion[] {
  return buildSkillQuestionsForSkill(skill);
}

export function evaluateTestQuestion(
  questionType: string,
  userAnswer: string,
  correctAnswer: string,
  starterCode: string,
  expectedKeywordsJson: string,
  maxPoints: number
): { isAnswered: boolean; isCorrect: boolean; pointsEarned: number } {
  const trimmed = (userAnswer || '').trim();
  if (!trimmed) {
    return { isAnswered: false, isCorrect: false, pointsEarned: 0 };
  }

  if (questionType === 'MCQ') {
    const isCorrect = trimmed === correctAnswer.trim();
    return {
      isAnswered: true,
      isCorrect,
      pointsEarned: isCorrect ? maxPoints : 0,
    };
  }

  // CODE question evaluation
  const normalizedStarter = (starterCode || '').replace(/\s+/g, '');
  const normalizedUser = trimmed.replace(/\s+/g, '');

  // If user didn't change starter code at all or only left comments
  if (normalizedUser === normalizedStarter || normalizedUser.length < 15) {
    return { isAnswered: false, isCorrect: false, pointsEarned: 0 };
  }

  let keywords: string[] = [];
  try {
    keywords = JSON.parse(expectedKeywordsJson || '[]');
  } catch {
    keywords = [];
  }

  const lowerUser = trimmed.toLowerCase();
  if (keywords.length === 0) {
    const ok = trimmed.length > starterCode.length + 10;
    return {
      isAnswered: true,
      isCorrect: ok,
      pointsEarned: ok ? maxPoints : 0,
    };
  }

  const matchedCount = keywords.filter((kw) => lowerUser.includes(kw.toLowerCase())).length;
  const ratio = matchedCount / keywords.length;

  if (ratio >= 0.5) {
    return {
      isAnswered: true,
      isCorrect: true,
      pointsEarned: maxPoints,
    };
  }

  return {
    isAnswered: true,
    isCorrect: false,
    pointsEarned: 0,
  };
}

export async function finalizeSkillTestAttempt(testId: string, timedOut = false) {
  const [test] = await db.select().from(skillTests).where(eq(skillTests.id, testId));
  if (!test) return null;

  if (test.status !== 'IN_PROGRESS') {
    const questions = await db
      .select()
      .from(skillTestQuestions)
      .where(eq(skillTestQuestions.testId, testId));
    return { test, questions };
  }

  const questions = await db
    .select()
    .from(skillTestQuestions)
    .where(eq(skillTestQuestions.testId, testId));

  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;

  for (const q of questions) {
    maxScore += q.points;
    const evalResult = evaluateTestQuestion(
      q.questionType,
      q.userAnswer,
      q.correctAnswer,
      q.starterCode,
      q.expectedKeywords,
      q.points
    );

    if (!evalResult.isAnswered) {
      unansweredCount += 1;
    } else if (evalResult.isCorrect) {
      correctCount += 1;
      totalScore += evalResult.pointsEarned;
    } else {
      incorrectCount += 1;
    }

    await db
      .update(skillTestQuestions)
      .set({
        isAnswered: evalResult.isAnswered,
        isCorrect: evalResult.isCorrect,
        pointsEarned: evalResult.pointsEarned,
      })
      .where(eq(skillTestQuestions.id, q.id));
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const passed = percentage >= 60;
  const now = new Date();
  const startedMs = new Date(test.startedAt).getTime();
  const rawElapsedSec = Math.max(1, Math.round((now.getTime() - startedMs) / 1000));
  const timeTakenSeconds = Math.min(test.durationSeconds, rawElapsedSec);

  const [updatedTest] = await db
    .update(skillTests)
    .set({
      status: timedOut ? 'TIMED_OUT' : 'SUBMITTED',
      submittedAt: now,
      timeTakenSeconds,
      score: totalScore,
      maxScore: maxScore || 100,
      percentage,
      correctCount,
      incorrectCount,
      unansweredCount,
      passed,
    })
    .where(eq(skillTests.id, testId))
    .returning();

  // Move mentor verification status to 'Pending Review' if not already Approved
  const [userProfile] = await db.select().from(profiles).where(eq(profiles.id, test.userId));
  if (userProfile && userProfile.mentorVerificationStatus !== 'Approved') {
    await db
      .update(profiles)
      .set({
        accountType: 'MENTOR',
        mentorVerificationStatus: 'Pending Review',
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, test.userId));
  }

  const updatedQuestions = await db
    .select()
    .from(skillTestQuestions)
    .where(eq(skillTestQuestions.testId, testId));

  return { test: updatedTest, questions: updatedQuestions };
}

export async function generateUniqueCertificateId(): Promise<string> {
  const year = new Date().getFullYear();
  const allCerts = await db
    .select({ certificateId: certificates.certificateId })
    .from(certificates)
    .orderBy(desc(certificates.id));

  const existingIds = new Set(allCerts.map((c) => c.certificateId));
  let seq = allCerts.length + 101;

  while (true) {
    const candidate = `SB-CERT-${year}-${String(seq).padStart(6, '0')}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
    seq += 1;
  }
}

export async function issueCertificateIfNotExists(params: {
  userId: string;
  recipientName: string;
  title: string;
  skillName: string;
  certificateType: 'SKILL_COMPLETION' | 'MENTOR_VERIFICATION' | 'PEER_EXCHANGE';
  score?: number | null;
  issuedBy?: string;
}) {
  // Check if an identical certificate already exists for this user, skill, and type
  const existing = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.userId, params.userId),
        eq(certificates.skillName, params.skillName),
        eq(certificates.certificateType, params.certificateType)
      )
    );

  if (existing.length > 0) {
    return existing[0];
  }

  const certificateId = await generateUniqueCertificateId();
  const issueDate = new Date().toISOString().split('T')[0];

  const [created] = await db
    .insert(certificates)
    .values({
      certificateId,
      userId: params.userId,
      recipientName: params.recipientName,
      title: params.title,
      skillName: params.skillName,
      certificateType: params.certificateType,
      verificationStatus: 'Verified',
      score: params.score ?? null,
      issuedBy: params.issuedBy || 'SkillBridge Academic Board',
      issueDate,
    })
    .returning();

  return created;
}
