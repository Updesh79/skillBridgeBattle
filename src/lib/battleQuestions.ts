import { GoogleGenAI, Type } from '@google/genai';

export interface GeneratedBattleQuestion {
  uniqueQuestionId: string;
  question: string;
  options: [string, string, string, string];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  skill: string;
  topic: string;
}

export const TECHNOLOGY_SUBTOPICS: Record<string, string[]> = {
  Python: [
    'Variables',
    'Data Types',
    'Operators',
    'Conditions',
    'Loops',
    'Functions',
    'Lists',
    'Tuples',
    'Dictionaries',
    'Sets',
    'OOP',
    'Exceptions',
    'File Handling',
  ],
  JavaScript: [
    'Variables',
    'Functions',
    'Arrays',
    'Objects',
    'DOM',
    'Events',
    'Promises',
    'Async/Await',
    'ES6',
    'APIs',
  ],
  React: [
    'Components',
    'Props',
    'State',
    'Hooks',
    'useState',
    'useEffect',
    'Routing',
    'Forms',
    'Events',
    'API calls',
  ],
  SQL: [
    'SELECT',
    'WHERE',
    'JOIN',
    'GROUP BY',
    'ORDER BY',
    'Aggregate Functions',
    'Subqueries',
    'Keys',
    'Normalization',
  ],
  Flutter: [
    'Widgets',
    'StatelessWidget',
    'StatefulWidget',
    'setState',
    'Layouts',
    'Navigation',
    'Forms',
    'State Management',
    'Dart basics',
  ],
  'HTML/CSS': [
    'Semantic HTML',
    'Forms & Inputs',
    'Flexbox',
    'CSS Grid',
    'Box Model',
    'Selectors & Specificity',
    'Responsive Media Queries',
    'Positioning',
  ],
  HTML: [
    'Semantic Elements',
    'Forms & Validation',
    'Accessibility (ARIA)',
    'Document Structure',
    'Media & Tables',
  ],
  CSS: [
    'Flexbox',
    'CSS Grid',
    'Box Model',
    'Specificity & Cascade',
    'Responsive Design',
    'Transitions & Animations',
  ],
  MongoDB: [
    'Documents & BSON',
    'CRUD Operations',
    'Aggregation Pipeline',
    'Indexing',
    'Schema Modeling',
    'Query Operators',
  ],
  Java: [
    'Data Types & Variables',
    'OOP & Inheritance',
    'Interfaces & Abstract Classes',
    'Collections Framework',
    'Exception Handling',
    'Multithreading & Streams',
  ],
  'C++': [
    'Pointers & References',
    'OOP & Classes',
    'STL Containers',
    'Memory Management',
    'Templates',
    'Constructors & Destructors',
  ],
};

// Curated, verified academic question bank used for validation replacement or instant fallback
const VERIFIED_QUESTION_BANK: Record<string, GeneratedBattleQuestion[]> = {
  Python: [
    {
      uniqueQuestionId: 'python-functions-001',
      question: 'Which keyword is used to define a function in Python?',
      options: ['function', 'def', 'func', 'define'],
      correctAnswer: 'def',
      explanation: 'Python uses the def keyword followed by the function name and parentheses to define a function.',
      difficulty: 'easy',
      skill: 'Python',
      topic: 'Functions',
    },
    {
      uniqueQuestionId: 'python-datatypes-002',
      question: 'Which of the following data types is immutable in Python?',
      options: ['List', 'Dictionary', 'Tuple', 'Set'],
      correctAnswer: 'Tuple',
      explanation: 'Tuples are immutable sequences in Python; once created, their elements cannot be modified.',
      difficulty: 'easy',
      skill: 'Python',
      topic: 'Tuples',
    },
    {
      uniqueQuestionId: 'python-dicts-003',
      question: 'What does my_dict.get("key", 0) return if "key" does not exist in my_dict?',
      options: ['KeyError exception', 'None', '0', 'False'],
      correctAnswer: '0',
      explanation: 'The dictionary .get(key, default) method returns the specified default value (0) when the key is absent instead of raising a KeyError.',
      difficulty: 'easy',
      skill: 'Python',
      topic: 'Dictionaries',
    },
    {
      uniqueQuestionId: 'python-lists-004',
      question: 'What is the output of [x * 2 for x in range(3)] in Python?',
      options: ['[0, 2, 4]', '[2, 4, 6]', '[0, 1, 2]', '[1, 2, 3]'],
      correctAnswer: '[0, 2, 4]',
      explanation: 'range(3) produces 0, 1, 2. Multiplying each element by 2 in the list comprehension yields [0, 2, 4].',
      difficulty: 'medium',
      skill: 'Python',
      topic: 'Lists',
    },
    {
      uniqueQuestionId: 'python-oop-005',
      question: 'Which special method is automatically invoked when a new object instance of a class is initialized in Python?',
      options: ['__start__()', '__init__()', '__construct__()', '__object__()'],
      correctAnswer: '__init__()',
      explanation: '__init__(self, ...) is the instance initializer method in Python classes.',
      difficulty: 'easy',
      skill: 'Python',
      topic: 'OOP',
    },
    {
      uniqueQuestionId: 'python-exceptions-006',
      question: 'Which block in a Python try statement is guaranteed to execute regardless of whether an exception was raised?',
      options: ['except', 'else', 'finally', 'always'],
      correctAnswer: 'finally',
      explanation: 'The finally block always executes when leaving the try statement, making it ideal for cleanup actions.',
      difficulty: 'medium',
      skill: 'Python',
      topic: 'Exceptions',
    },
    {
      uniqueQuestionId: 'python-sets-007',
      question: 'Which operator returns the symmetric difference between two Python sets A and B?',
      options: ['A & B', 'A | B', 'A ^ B', 'A - B'],
      correctAnswer: 'A ^ B',
      explanation: 'The ^ operator (or A.symmetric_difference(B)) returns elements that are in either set A or B, but not in both.',
      difficulty: 'medium',
      skill: 'Python',
      topic: 'Sets',
    },
    {
      uniqueQuestionId: 'python-functions-008',
      question: 'Why is using a mutable default argument like def append_to(item, target=[]): considered a pitfall in Python?',
      options: [
        'Python raises a SyntaxError when a list is used as a default parameter',
        'The default list is created once at function definition time and shared across subsequent calls',
        'Lists cannot be modified inside a function scope without the global keyword',
        'It converts the list into an immutable tuple at runtime',
      ],
      correctAnswer: 'The default list is created once at function definition time and shared across subsequent calls',
      explanation: 'Default parameter values are evaluated only once when the def statement is executed, so mutating that list persists across future calls.',
      difficulty: 'hard',
      skill: 'Python',
      topic: 'Functions',
    },
    {
      uniqueQuestionId: 'python-files-009',
      question: 'Why is "with open(\'data.txt\', \'r\') as f:" preferred over manually calling f = open(\'data.txt\')?',
      options: [
        'It loads the entire file into GPU memory automatically',
        'It uses a context manager that automatically closes the file even if an exception occurs',
        'It encrypts the file contents while reading',
        'It bypasses operating system file permissions',
      ],
      correctAnswer: 'It uses a context manager that automatically closes the file even if an exception occurs',
      explanation: 'The with statement invokes the file context manager (__enter__ and __exit__), guaranteeing the file descriptor is closed.',
      difficulty: 'medium',
      skill: 'Python',
      topic: 'File Handling',
    },
    {
      uniqueQuestionId: 'python-oop-010',
      question: 'What does the @staticmethod decorator do to a method inside a Python class?',
      options: [
        'Passes the class itself (cls) as the first argument',
        'Defines a method that does not receive an implicit self or cls first argument',
        'Prevents subclasses from overriding the method',
        'Caches the return value of the method permanently',
      ],
      correctAnswer: 'Defines a method that does not receive an implicit self or cls first argument',
      explanation: '@staticmethod binds a function to the class namespace without passing self (instance) or cls (class) automatically.',
      difficulty: 'hard',
      skill: 'Python',
      topic: 'OOP',
    },
  ],
  JavaScript: [
    {
      uniqueQuestionId: 'js-variables-001',
      question: 'Which JavaScript keyword declares a block-scoped variable whose binding cannot be reassigned?',
      options: ['var', 'let', 'const', 'static'],
      correctAnswer: 'const',
      explanation: 'const creates a block-scoped constant reference that cannot be reassigned after initialization.',
      difficulty: 'easy',
      skill: 'JavaScript',
      topic: 'Variables',
    },
    {
      uniqueQuestionId: 'js-arrays-002',
      question: 'Which Array method creates a new array populated with the results of calling a function on every element?',
      options: ['forEach()', 'map()', 'filter()', 'reduce()'],
      correctAnswer: 'map()',
      explanation: 'Array.prototype.map() transforms each element and returns a new array of the same length.',
      difficulty: 'easy',
      skill: 'JavaScript',
      topic: 'Arrays',
    },
    {
      uniqueQuestionId: 'js-promises-003',
      question: 'What does Promise.all([p1, p2, p3]) do if p2 rejects immediately?',
      options: [
        'Waits for p1 and p3 to finish and returns partial results',
        'Rejects immediately with the rejection reason of p2',
        'Retries p2 up to three times automatically',
        'Resolves with undefined for p2',
      ],
      correctAnswer: 'Rejects immediately with the rejection reason of p2',
      explanation: 'Promise.all is fail-fast: it rejects as soon as any of the input promises rejects.',
      difficulty: 'medium',
      skill: 'JavaScript',
      topic: 'Promises',
    },
    {
      uniqueQuestionId: 'js-async-004',
      question: 'What value does an async function always return in JavaScript?',
      options: ['A synchronous primitive value', 'A Promise object', 'A Generator iterator', 'An EventTarget'],
      correctAnswer: 'A Promise object',
      explanation: 'Every async function implicitly wraps its return value in a Promise.',
      difficulty: 'easy',
      skill: 'JavaScript',
      topic: 'Async/Await',
    },
    {
      uniqueQuestionId: 'js-es6-005',
      question: 'How do arrow functions differ from regular functions regarding the "this" keyword?',
      options: [
        'Arrow functions bind "this" dynamically to the global window object only',
        'Arrow functions do not have their own "this" and inherit it lexically from the enclosing scope',
        'Arrow functions require .bind(this) to access outer variables',
        'Arrow functions create a new "this" instance on every invocation',
      ],
      correctAnswer: 'Arrow functions do not have their own "this" and inherit it lexically from the enclosing scope',
      explanation: 'Arrow functions capture the lexical "this" value of the surrounding execution context.',
      difficulty: 'medium',
      skill: 'JavaScript',
      topic: 'ES6',
    },
    {
      uniqueQuestionId: 'js-events-006',
      question: 'Which method prevents the default browser behavior of an event (such as form submission page reload)?',
      options: ['event.stopPropagation()', 'event.preventDefault()', 'event.cancelBubble()', 'event.halt()'],
      correctAnswer: 'event.preventDefault()',
      explanation: 'event.preventDefault() cancels the default action associated with the event without stopping event propagation.',
      difficulty: 'easy',
      skill: 'JavaScript',
      topic: 'Events',
    },
    {
      uniqueQuestionId: 'js-objects-007',
      question: 'Which method prevents any new properties from being added to an object and marks all existing properties as non-configurable and non-writable?',
      options: ['Object.seal()', 'Object.freeze()', 'Object.assign()', 'Object.lock()'],
      correctAnswer: 'Object.freeze()',
      explanation: 'Object.freeze() makes an object shallowly immutable so properties cannot be added, removed, or reassigned.',
      difficulty: 'medium',
      skill: 'JavaScript',
      topic: 'Objects',
    },
    {
      uniqueQuestionId: 'js-closures-008',
      question: 'What is a closure in JavaScript?',
      options: [
        'A tag that closes an HTML script block',
        'A function bundled together with lexical references to its surrounding state',
        'A method for terminating Web Workers',
        'An error thrown when a Promise never resolves',
      ],
      correctAnswer: 'A function bundled together with lexical references to its surrounding state',
      explanation: 'A closure gives an inner function access to variables in its outer enclosing function scope even after the outer function has returned.',
      difficulty: 'medium',
      skill: 'JavaScript',
      topic: 'Functions',
    },
    {
      uniqueQuestionId: 'js-eventloop-009',
      question: 'In the JavaScript event loop, which queue is processed immediately after the current synchronous execution stack clears and before the next macrotask (setTimeout)?',
      options: ['The AnimationFrame queue', 'The Microtask queue (Promise callbacks)', 'The DOM painting queue', 'The I/O polling queue'],
      correctAnswer: 'The Microtask queue (Promise callbacks)',
      explanation: 'Microtasks (such as Promise .then/.catch/await continuations) are drained completely before the event loop moves to the next macrotask.',
      difficulty: 'hard',
      skill: 'JavaScript',
      topic: 'Async/Await',
    },
    {
      uniqueQuestionId: 'js-arrays-010',
      question: 'What does [1, 2, 3, 4].reduce((acc, cur) => acc + cur, 10) evaluate to?',
      options: ['10', '20', '24', '101234'],
      correctAnswer: '20',
      explanation: 'Starting with initial accumulator 10, reduce adds 1 + 2 + 3 + 4 = 10 to 10, producing 20.',
      difficulty: 'medium',
      skill: 'JavaScript',
      topic: 'Arrays',
    },
  ],
  React: [
    {
      uniqueQuestionId: 'react-usestate-001',
      question: 'What does the useState hook return when called inside a React functional component?',
      options: [
        'An object with { state, setState } properties',
        'A two-element array containing [currentState, stateSetterFunction]',
        'Only the current state value',
        'A ref object with a .current property',
      ],
      correctAnswer: 'A two-element array containing [currentState, stateSetterFunction]',
      explanation: 'useState returns a tuple [state, setState] that is typically destructured by the component.',
      difficulty: 'easy',
      skill: 'React',
      topic: 'useState',
    },
    {
      uniqueQuestionId: 'react-useeffect-002',
      question: 'When does a useEffect hook run if you pass an empty dependency array [] as its second argument?',
      options: [
        'After every single render of the component',
        'Only once after the initial mount (and cleanup on unmount)',
        'Before the component renders for the first time',
        'Never, because the array is empty',
      ],
      correctAnswer: 'Only once after the initial mount (and cleanup on unmount)',
      explanation: 'An empty dependency array [] tells React the effect does not depend on any props or state, so it runs only on mount.',
      difficulty: 'easy',
      skill: 'React',
      topic: 'useEffect',
    },
    {
      uniqueQuestionId: 'react-props-003',
      question: 'Why does React require a unique "key" prop when rendering a list of elements with .map()?',
      options: [
        'To style each list item with unique CSS classes automatically',
        'To help React identify which items changed, were added, or were removed during reconciliation',
        'To store the list items in browser localStorage',
        'To make the array index accessible inside child components',
      ],
      correctAnswer: 'To help React identify which items changed, were added, or were removed during reconciliation',
      explanation: 'Keys give elements a stable identity across renders so React can efficiently reconcile the Virtual DOM.',
      difficulty: 'easy',
      skill: 'React',
      topic: 'Components',
    },
    {
      uniqueQuestionId: 'react-state-004',
      question: 'When updating state based on the previous state value in React, what is the safest pattern?',
      options: [
        'Mutating the state variable directly and calling forceUpdate()',
        'Passing an updater function to the setter: setCount(prev => prev + 1)',
        'Reading the DOM textContent and passing it to setCount()',
        'Calling setCount(count++)',
      ],
      correctAnswer: 'Passing an updater function to the setter: setCount(prev => prev + 1)',
      explanation: 'Functional updates (prev => prev + 1) guarantee you receive the latest pending state even when multiple updates are batched.',
      difficulty: 'medium',
      skill: 'React',
      topic: 'State',
    },
    {
      uniqueQuestionId: 'react-hooks-005',
      question: 'Which rule must always be followed when using React Hooks?',
      options: [
        'Hooks must be called inside loops or conditional if blocks',
        'Hooks must only be called at the top level of React functional components or custom hooks',
        'Hooks can only be used inside class component render() methods',
        'Only one useEffect hook is allowed per component',
      ],
      correctAnswer: 'Hooks must only be called at the top level of React functional components or custom hooks',
      explanation: 'React relies on the consistent call order of hooks between renders, so they must be called unconditionally at the top level.',
      difficulty: 'medium',
      skill: 'React',
      topic: 'Hooks',
    },
    {
      uniqueQuestionId: 'react-forms-006',
      question: 'What defines a "controlled component" for an <input> element in React?',
      options: [
        'An input that uses a DOM ref to read values only on submit',
        'An input whose value is driven by React state and updated via an onChange handler',
        'An input with the readOnly attribute enabled',
        'An input wrapped inside a Suspense boundary',
      ],
      correctAnswer: 'An input whose value is driven by React state and updated via an onChange handler',
      explanation: 'In a controlled component, React state serves as the single source of truth for the input value.',
      difficulty: 'medium',
      skill: 'React',
      topic: 'Forms',
    },
    {
      uniqueQuestionId: 'react-Cleanup-007',
      question: 'How do you clean up a subscription or timer created inside useEffect?',
      options: [
        'Call React.clearEffects() when the user navigates away',
        'Return a cleanup function from the callback passed to useEffect',
        'Pass true as the third argument to useEffect',
        'Set the dependency array to null',
      ],
      correctAnswer: 'Return a cleanup function from the callback passed to useEffect',
      explanation: 'React executes the function returned from useEffect before re-running the effect and when the component unmounts.',
      difficulty: 'medium',
      skill: 'React',
      topic: 'useEffect',
    },
    {
      uniqueQuestionId: 'react-memo-008',
      question: 'What is the primary difference between useMemo and useCallback in React?',
      options: [
        'useMemo caches the computed result of a function, while useCallback caches the function reference itself',
        'useMemo runs on the server, while useCallback runs in the browser',
        'useCallback triggers a re-render, while useMemo prevents mounting',
        'There is no difference; they are aliases of each other',
      ],
      correctAnswer: 'useMemo caches the computed result of a function, while useCallback caches the function reference itself',
      explanation: 'useMemo(() => fn(), deps) memoizes the returned value, whereas useCallback(fn, deps) memoizes the callback function instance.',
      difficulty: 'hard',
      skill: 'React',
      topic: 'Hooks',
    },
    {
      uniqueQuestionId: 'react-routing-009',
      question: 'In React Router, which hook is used to programmatically navigate to a different route inside an event handler?',
      options: ['useRouteMatch()', 'useNavigate()', 'useParams()', 'useOutlet()'],
      correctAnswer: 'useNavigate()',
      explanation: 'useNavigate() returns a navigation function that lets you imperatively route users (e.g., navigate("/dashboard")).',
      difficulty: 'easy',
      skill: 'React',
      topic: 'Routing',
    },
    {
      uniqueQuestionId: 'react-props-010',
      question: 'Which special prop allows a wrapper component in React to render whatever nested JSX elements were passed between its opening and closing tags?',
      options: ['props.content', 'props.children', 'props.slot', 'props.inner'],
      correctAnswer: 'props.children',
      explanation: 'React automatically populates props.children with the JSX nested inside a component invocation.',
      difficulty: 'easy',
      skill: 'React',
      topic: 'Props',
    },
  ],
  SQL: [
    {
      uniqueQuestionId: 'sql-select-001',
      question: 'Which SQL clause is used to filter rows BEFORE grouping occurs in a query?',
      options: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'],
      correctAnswer: 'WHERE',
      explanation: 'WHERE filters individual rows prior to GROUP BY aggregation, whereas HAVING filters aggregated groups.',
      difficulty: 'easy',
      skill: 'SQL',
      topic: 'WHERE',
    },
    {
      uniqueQuestionId: 'sql-join-002',
      question: 'Which SQL JOIN returns all rows from the left table and matched rows from the right table, filling in NULL when there is no match?',
      options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'CROSS JOIN'],
      correctAnswer: 'LEFT JOIN',
      explanation: 'LEFT JOIN (or LEFT OUTER JOIN) preserves every row from the left table and supplies NULL for right-table columns when no match exists.',
      difficulty: 'easy',
      skill: 'SQL',
      topic: 'JOIN',
    },
    {
      uniqueQuestionId: 'sql-agg-003',
      question: 'What is the difference between COUNT(*) and COUNT(column_name) in SQL?',
      options: [
        'COUNT(*) counts all rows including NULLs, while COUNT(column_name) counts only non-NULL values in that column',
        'COUNT(*) only counts primary keys, while COUNT(column_name) counts duplicates',
        'COUNT(column_name) is faster because it skips table scans',
        'They always return the exact same number regardless of NULL values',
      ],
      correctAnswer: 'COUNT(*) counts all rows including NULLs, while COUNT(column_name) counts only non-NULL values in that column',
      explanation: 'COUNT(column_name) ignores NULL entries in the specified column, whereas COUNT(*) counts every row in the group.',
      difficulty: 'medium',
      skill: 'SQL',
      topic: 'Aggregate Functions',
    },
    {
      uniqueQuestionId: 'sql-groupby-004',
      question: 'Which clause is used to filter groups created by a GROUP BY clause based on an aggregate condition like COUNT(id) > 5?',
      options: ['WHERE', 'HAVING', 'FILTER', 'LIMIT'],
      correctAnswer: 'HAVING',
      explanation: 'HAVING applies conditions to groups formed by GROUP BY and can reference aggregate functions.',
      difficulty: 'easy',
      skill: 'SQL',
      topic: 'GROUP BY',
    },
    {
      uniqueQuestionId: 'sql-keys-005',
      question: 'What constraint uniquely identifies each record in a relational database table and cannot contain NULL values?',
      options: ['FOREIGN KEY', 'PRIMARY KEY', 'CHECK CONSTRAINT', 'INDEX'],
      correctAnswer: 'PRIMARY KEY',
      explanation: 'A PRIMARY KEY enforces both uniqueness and NOT NULL on the identifying column(s) of a table.',
      difficulty: 'easy',
      skill: 'SQL',
      topic: 'Keys',
    },
    {
      uniqueQuestionId: 'sql-norm-006',
      question: 'A table is in Second Normal Form (2NF) when it is in 1NF and meets which additional requirement?',
      options: [
        'It contains no foreign keys',
        'All non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies)',
        'Every column contains comma-separated lists',
        'All tables are merged into a single denormalized table',
      ],
      correctAnswer: 'All non-key attributes are fully functionally dependent on the entire primary key (no partial dependencies)',
      explanation: '2NF eliminates partial dependencies where a non-prime attribute depends on only part of a composite primary key.',
      difficulty: 'hard',
      skill: 'SQL',
      topic: 'Normalization',
    },
    {
      uniqueQuestionId: 'sql-orderby-007',
      question: 'By default, in what order does the SQL ORDER BY clause sort the result set if neither ASC nor DESC is specified?',
      options: ['Descending (DESC)', 'Ascending (ASC)', 'Random order', 'Insertion order'],
      correctAnswer: 'Ascending (ASC)',
      explanation: 'SQL sorts in ascending order (ASC) by default when no direction keyword is provided.',
      difficulty: 'easy',
      skill: 'SQL',
      topic: 'ORDER BY',
    },
    {
      uniqueQuestionId: 'sql-subquery-008',
      question: 'What is a correlated subquery in SQL?',
      options: [
        'A subquery that executes once before the outer query and caches its result',
        'A subquery that references columns from the outer query and is evaluated per row',
        'A query that joins two tables without a WHERE clause',
        'A subquery used only inside INSERT statements',
      ],
      correctAnswer: 'A subquery that references columns from the outer query and is evaluated per row',
      explanation: 'A correlated subquery depends on values from the current row of the outer query.',
      difficulty: 'hard',
      skill: 'SQL',
      topic: 'Subqueries',
    },
  ],
  Flutter: [
    {
      uniqueQuestionId: 'flutter-widgets-001',
      question: 'Which Flutter widget class should you extend when the widget’s UI depends only on immutable configuration passed to its constructor and never changes dynamically?',
      options: ['StatefulWidget', 'StatelessWidget', 'InheritedWidget', 'RenderObjectWidget'],
      correctAnswer: 'StatelessWidget',
      explanation: 'StatelessWidget is used when the part of the user interface represented by the widget does not depend on mutable state.',
      difficulty: 'easy',
      skill: 'Flutter',
      topic: 'StatelessWidget',
    },
    {
      uniqueQuestionId: 'flutter-setstate-002',
      question: 'What is the purpose of calling setState(() { ... }) inside a State class in Flutter?',
      options: [
        'It restarts the entire Dart Virtual Machine',
        'It notifies the Flutter framework that the internal state has changed and schedules a rebuild of the widget subtree',
        'It saves the state permanently to SQLite',
        'It compiles Dart code into native C++',
      ],
      correctAnswer: 'It notifies the Flutter framework that the internal state has changed and schedules a rebuild of the widget subtree',
      explanation: 'setState marks the State object as dirty so Flutter calls build() on the next frame with the updated values.',
      difficulty: 'easy',
      skill: 'Flutter',
      topic: 'setState',
    },
    {
      uniqueQuestionId: 'flutter-layouts-003',
      question: 'Which Flutter layout widget arranges its children vertically in a linear array?',
      options: ['Row', 'Column', 'Stack', 'Positioned'],
      correctAnswer: 'Column',
      explanation: 'Column lays out its list of child widgets vertically along the main axis.',
      difficulty: 'easy',
      skill: 'Flutter',
      topic: 'Layouts',
    },
    {
      uniqueQuestionId: 'flutter-nav-004',
      question: 'Which Navigator method pushes a new route onto the navigation stack in Flutter?',
      options: ['Navigator.pop(context)', 'Navigator.push(context, route)', 'Navigator.replaceAll(context)', 'Navigator.back(context)'],
      correctAnswer: 'Navigator.push(context, route)',
      explanation: 'Navigator.push adds a Route to the top of the navigator stack, transitioning to the new screen.',
      difficulty: 'easy',
      skill: 'Flutter',
      topic: 'Navigation',
    },
    {
      uniqueQuestionId: 'flutter-lifecycle-005',
      question: 'In a Flutter StatefulWidget’s State class, which lifecycle method is called exactly once when the State object is first inserted into the widget tree?',
      options: ['build()', 'initState()', 'didUpdateWidget()', 'dispose()'],
      correctAnswer: 'initState()',
      explanation: 'initState() is invoked once when the State object is mounted, making it ideal for one-time initializations.',
      difficulty: 'medium',
      skill: 'Flutter',
      topic: 'StatefulWidget',
    },
    {
      uniqueQuestionId: 'flutter-dart-006',
      question: 'In Dart and Flutter, what does the "final" keyword signify when declaring a variable?',
      options: [
        'The variable can be reassigned multiple times as long as the type stays the same',
        'The variable can only be set once and is initialized at runtime when accessed',
        'The variable is globally shared across all isolates',
        'The variable is automatically garbage collected after one frame',
      ],
      correctAnswer: 'The variable can only be set once and is initialized at runtime when accessed',
      explanation: 'A final variable in Dart can be assigned only once; unlike const, its value can be determined at runtime.',
      difficulty: 'medium',
      skill: 'Flutter',
      topic: 'Dart basics',
    },
  ],
};

function getFallbackPoolForSkill(skill: string): GeneratedBattleQuestion[] {
  const normalized = skill.trim();
  if (VERIFIED_QUESTION_BANK[normalized]) {
    return VERIFIED_QUESTION_BANK[normalized];
  }
  const lower = normalized.toLowerCase();
  if (lower.includes('python')) return VERIFIED_QUESTION_BANK.Python;
  if (lower.includes('javascript') || lower === 'js') return VERIFIED_QUESTION_BANK.JavaScript;
  if (lower.includes('react')) return VERIFIED_QUESTION_BANK.React;
  if (lower.includes('sql') || lower.includes('database') || lower.includes('mongo')) {
    return VERIFIED_QUESTION_BANK.SQL.map((q) => ({ ...q, skill: normalized }));
  }
  if (lower.includes('flutter') || lower.includes('mobile')) {
    return VERIFIED_QUESTION_BANK.Flutter.map((q) => ({ ...q, skill: normalized }));
  }

  // Generic technology-adapted questions for any other catalog skill (HTML/CSS, Java, C++, UI/UX, etc.)
  const subtopics = TECHNOLOGY_SUBTOPICS[normalized] || [
    'Core Fundamentals',
    'Syntax & Structure',
    'Best Practices',
    'Architecture',
    'Debugging & Optimization',
    'Practical Application',
  ];

  return [
    {
      uniqueQuestionId: `${lower.replace(/[^a-z0-9]/g, '')}-001`,
      question: `In ${normalized}, what is the primary benefit of modularizing components and separating concerns?`,
      options: [
        'It increases code maintainability, reusability, and isolated testing',
        'It eliminates the need for any syntax validation',
        'It forces all logic to execute on a single thread without memory allocation',
        'It prevents version control systems from tracking file changes',
      ],
      correctAnswer: 'It increases code maintainability, reusability, and isolated testing',
      explanation: `Modular architecture in ${normalized} keeps responsibilities cleanly separated so teams can test and reuse modules reliably.`,
      difficulty: 'easy',
      skill: normalized,
      topic: subtopics[0] || 'Core Fundamentals',
    },
    {
      uniqueQuestionId: `${lower.replace(/[^a-z0-9]/g, '')}-002`,
      question: `When optimizing a ${normalized} project for production performance, which practice is most effective?`,
      options: [
        'Minimizing redundant computations and optimizing data/asset access paths',
        'Duplicating state variables across every file',
        'Disabling error handling to skip try/catch blocks',
        'Using deeply nested synchronous loops for I/O tasks',
      ],
      correctAnswer: 'Minimizing redundant computations and optimizing data/asset access paths',
      explanation: `Eliminating redundant work and optimizing critical paths directly improves responsiveness and resource usage in ${normalized}.`,
      difficulty: 'medium',
      skill: normalized,
      topic: subtopics[1] || 'Optimization',
    },
    {
      uniqueQuestionId: `${lower.replace(/[^a-z0-9]/g, '')}-003`,
      question: `Which principle is most important when validating external input in a ${normalized} workflow?`,
      options: [
        'Trusting client-formatted values without verification',
        'Validating structure, data types, and boundary constraints before processing',
        'Converting all inputs into global variables immediately',
        'Ignoring null or undefined edge cases',
      ],
      correctAnswer: 'Validating structure, data types, and boundary constraints before processing',
      explanation: `Strict input validation prevents runtime failures and security vulnerabilities in ${normalized} applications.`,
      difficulty: 'medium',
      skill: normalized,
      topic: subtopics[2] || 'Best Practices',
    },
    {
      uniqueQuestionId: `${lower.replace(/[^a-z0-9]/g, '')}-004`,
      question: `Why is deterministic state management important when building complex ${normalized} solutions?`,
      options: [
        'It ensures predictable outputs and easier debugging for any given sequence of inputs',
        'It randomizes execution order to prevent caching',
        'It removes the need for data structures',
        'It automatically rewrites compiler rules',
      ],
      correctAnswer: 'It ensures predictable outputs and easier debugging for any given sequence of inputs',
      explanation: `Deterministic state transitions make ${normalized} systems reproducible and straightforward to debug.`,
      difficulty: 'hard',
      skill: normalized,
      topic: subtopics[3] || 'Architecture',
    },
    {
      uniqueQuestionId: `${lower.replace(/[^a-z0-9]/g, '')}-005`,
      question: `During code review of a ${normalized} implementation, what indicates high-quality implementation?`,
      options: [
        'Clear naming conventions, edge-case handling, and adherence to idiomatic patterns',
        'Putting the entire project inside a single 5,000-line function',
        'Hardcoding environment credentials directly inside UI labels',
        'Suppressing all compiler and linter warnings globally',
      ],
      correctAnswer: 'Clear naming conventions, edge-case handling, and adherence to idiomatic patterns',
      explanation: `Idiomatic patterns, clear naming, and defensive edge-case handling are hallmarks of production-grade ${normalized} work.`,
      difficulty: 'easy',
      skill: normalized,
      topic: subtopics[4] || 'Best Practices',
    },
  ];
}

/**
 * Validates a single candidate question according to Section 8 & Section 9 rules.
 */
export function validateBattleQuestion(
  raw: any,
  expectedSkill: string,
  index: number
): GeneratedBattleQuestion | null {
  if (!raw || typeof raw !== 'object') return null;

  const question = typeof raw.question === 'string' ? raw.question.trim() : '';
  if (question.length < 10) return null;

  if (!Array.isArray(raw.options) || raw.options.length !== 4) return null;
  const cleanedOptions = raw.options.map((o: any) =>
    typeof o === 'string' ? o.trim() : String(o ?? '').trim()
  );
  if (cleanedOptions.some((o: string) => o.length === 0)) return null;

  // Prevent duplicate options (case-insensitive)
  const uniqueLower = new Set(cleanedOptions.map((o: string) => o.toLowerCase()));
  if (uniqueLower.size !== 4) return null;

  const rawCorrect = typeof raw.correctAnswer === 'string' ? raw.correctAnswer.trim() : '';
  if (!rawCorrect) return null;

  // Ensure exact match with one of the 4 options
  const matchedOption = cleanedOptions.find(
    (opt: string) => opt === rawCorrect || opt.toLowerCase() === rawCorrect.toLowerCase()
  );
  if (!matchedOption) return null;

  const explanation =
    typeof raw.explanation === 'string' && raw.explanation.trim().length > 5
      ? raw.explanation.trim()
      : `${matchedOption} is the correct answer for this ${expectedSkill} concept.`;

  const rawDiff = typeof raw.difficulty === 'string' ? raw.difficulty.toLowerCase().trim() : 'medium';
  const difficulty: 'easy' | 'medium' | 'hard' =
    rawDiff === 'easy' || rawDiff === 'hard' ? rawDiff : 'medium';

  const topic =
    typeof raw.topic === 'string' && raw.topic.trim().length > 0
      ? raw.topic.trim()
      : (TECHNOLOGY_SUBTOPICS[expectedSkill]?.[index % (TECHNOLOGY_SUBTOPICS[expectedSkill]?.length || 1)] ||
        'Core Concepts');

  const slug = expectedSkill.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const topicSlug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const uniqueQuestionId =
    typeof raw.uniqueQuestionId === 'string' && raw.uniqueQuestionId.trim().length > 3
      ? raw.uniqueQuestionId.trim()
      : `${slug}-${topicSlug}-${String(index + 1).padStart(3, '0')}`;

  return {
    uniqueQuestionId,
    question,
    options: [
      cleanedOptions[0],
      cleanedOptions[1],
      cleanedOptions[2],
      cleanedOptions[3],
    ],
    correctAnswer: matchedOption,
    explanation,
    difficulty,
    skill: expectedSkill,
    topic,
  };
}

/**
 * Generates a validated, deterministic question set ONCE per battle using Gemini AI
 * with strict validation and automatic regeneration/fallback so both players receive
 * the exact same verified questions.
 */
export async function generateValidatedBattleQuestions(params: {
  skill: string;
  difficulty: string; // 'Easy' | 'Medium' | 'Hard' | 'Adaptive'
  questionCount: number; // 5 | 10
  averageRating?: number;
}): Promise<GeneratedBattleQuestion[]> {
  const { skill, difficulty, questionCount, averageRating = 1200 } = params;
  const subtopics = TECHNOLOGY_SUBTOPICS[skill] || [
    'Fundamentals',
    'Syntax',
    'Data Structures',
    'Functions & Modularity',
    'Debugging & Best Practices',
    'Advanced Concepts',
  ];

  const validatedList: GeneratedBattleQuestion[] = [];
  const seenQuestions = new Set<string>();

  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const adaptiveNote =
        difficulty.toLowerCase() === 'adaptive'
          ? `Use an Adaptive progressive difficulty curve across the ${questionCount} questions (start with easy/medium and progress to hard; player rating context: ${averageRating}). Both players will receive this exact balanced question set.`
          : `All questions must match the "${difficulty.toLowerCase()}" difficulty level.`;

      const prompt = `Generate ${questionCount + 2} multiple-choice technical quiz questions for a 1v1 university student Skill Battle on the technology "${skill}".
Cover these ${skill} subtopics: ${subtopics.join(', ')}.
${adaptiveNote}
Rules:
1. Every question must be 100% factually unambiguous and specific to ${skill}.
2. Each question must have exactly 4 distinct options.
3. "correctAnswer" must exactly match one of the 4 strings in "options".
4. Include a concise, educational "explanation" (1-2 sentences).
5. Include "topic" from the subtopics list and a unique "uniqueQuestionId" (e.g. "${skill.toLowerCase()}-topic-001").`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                skill: { type: Type.STRING },
                topic: { type: Type.STRING },
                uniqueQuestionId: { type: Type.STRING },
              },
              required: [
                'question',
                'options',
                'correctAnswer',
                'explanation',
                'difficulty',
                'skill',
                'topic',
                'uniqueQuestionId',
              ],
            },
          },
        },
      });

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          for (let i = 0; i < parsed.length; i++) {
            const valid = validateBattleQuestion(parsed[i], skill, validatedList.length);
            if (valid) {
              const normKey = valid.question.toLowerCase();
              if (!seenQuestions.has(normKey)) {
                seenQuestions.add(normKey);
                validatedList.push(valid);
              }
            }
            if (validatedList.length >= questionCount) break;
          }
        }
      }
    } catch (err) {
      console.warn('AI question generation fallback triggered for battle:', err);
    }
  }

  // Fill any remaining slots from the verified academic bank so the battle always has exact questionCount valid questions
  if (validatedList.length < questionCount) {
    const pool = getFallbackPoolForSkill(skill);
    const targetDiff = difficulty.toLowerCase();

    // Sort fallback pool to prioritize matching difficulty if not adaptive
    const sortedPool = [...pool].sort((a, b) => {
      if (targetDiff === 'adaptive') return 0;
      const aMatch = a.difficulty === targetDiff ? 0 : 1;
      const bMatch = b.difficulty === targetDiff ? 0 : 1;
      return aMatch - bMatch;
    });

    for (const item of sortedPool) {
      if (validatedList.length >= questionCount) break;
      const normKey = item.question.toLowerCase();
      if (!seenQuestions.has(normKey)) {
        seenQuestions.add(normKey);
        validatedList.push({
          ...item,
          skill,
          difficulty:
            targetDiff === 'easy' || targetDiff === 'medium' || targetDiff === 'hard'
              ? (targetDiff as 'easy' | 'medium' | 'hard')
              : item.difficulty,
        });
      }
    }

    // If questionCount is 10 and pool had fewer than 10, cycle additional verified questions from related topics
    let extraIdx = 1;
    while (validatedList.length < questionCount) {
      const base = pool[(extraIdx - 1) % pool.length];
      validatedList.push({
        ...base,
        uniqueQuestionId: `${base.uniqueQuestionId}-r${extraIdx}`,
        question: `${base.question} (Round ${validatedList.length + 1})`,
        skill,
      });
      extraIdx++;
    }
  }

  return validatedList.slice(0, questionCount);
}
