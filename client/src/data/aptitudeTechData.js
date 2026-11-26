// Verified Programming, Technical MCQs, and Puzzles questions mapped by conceptId

export const TECH_AND_PUZZLE_QUESTIONS = {
  'c-pointers-arrays': [
    {
      id: 'cp-1',
      question: 'What is the output of the following C code?\n\nint arr[] = {10, 20, 30, 40};\nint *p = arr;\nprintf("%d", *(p + 2));',
      options: ['10', '20', '30', '40'],
      answerIndex: 2,
      explanation: 'p points to arr[0]. p + 2 points to arr[2], so *(p + 2) dereferences arr[2] which is 30.',
    },
    {
      id: 'cp-2',
      question: 'What is the difference between `char s[] = "hello";` and `char *p = "hello";` in C?',
      options: [
        'Both are completely identical in memory and mutability.',
        's is a mutable array on stack; p points to a string literal (typically read-only).',
        'p stores the length whereas s does not include a null terminator.',
        's cannot be passed to printf().',
      ],
      answerIndex: 1,
      explanation: 's allocates a writable character array initialized with "hello\\0"; p points to a string literal whose modification is undefined behavior.',
    },
  ],
  'c-functions-storage': [
    {
      id: 'cf-1',
      question: 'What does the following C function print if called 3 times?\n\nvoid fun() {\n  static int x = 1;\n  printf("%d ", x++);\n}',
      options: ['1 1 1', '1 2 3', '2 3 4', 'Compile error'],
      answerIndex: 1,
      explanation: 'A static local variable is initialized once and retains its value across calls. Post-increment prints 1, then 2, then 3.',
    },
    {
      id: 'cf-2',
      question: 'Given `#define SQ(x) x * x`, what does `SQ(2 + 3)` evaluate to in C?',
      options: ['25', '11', '13', '10'],
      answerIndex: 1,
      explanation: 'Macro expands textually to `2 + 3 * 2 + 3` = `2 + 6 + 3` = 11 due to operator precedence.',
    },
  ],
  'cpp-oop-stl': [
    {
      id: 'cpp-1',
      question: 'Which mechanism in C++ enables runtime (dynamic) polymorphism?',
      options: [
        'Function overloading',
        'Operator overloading',
        'Virtual functions accessed via base pointer/reference',
        'Templates',
      ],
      answerIndex: 2,
      explanation: 'Virtual functions use the vtable/vptr to resolve the overridden derived method at runtime.',
    },
    {
      id: 'cpp-2',
      question: 'What is the average time complexity of lookup (`find`) in `std::unordered_map` vs `std::map`?',
      options: [
        'O(1) and O(log N)',
        'O(log N) and O(1)',
        'O(N) and O(log N)',
        'O(1) and O(1)',
      ],
      answerIndex: 0,
      explanation: 'unordered_map uses a hash table (O(1) average), while map uses a balanced Red-Black BST (O(log N)).',
    },
  ],
  'java-core-collections': [
    {
      id: 'jv-1',
      question: 'What is the output of:\nString a = new String("IQ");\nString b = new String("IQ");\nSystem.out.println((a == b) + " " + a.equals(b));',
      options: ['true true', 'false true', 'true false', 'false false'],
      answerIndex: 1,
      explanation: '`new String()` creates two distinct heap objects, so `a == b` is false, while `a.equals(b)` compares string content and returns true.',
    },
    {
      id: 'jv-2',
      question: 'Which Java collection guarantees no duplicate elements AND maintains insertion order?',
      options: ['HashSet', 'TreeSet', 'LinkedHashSet', 'ArrayList'],
      answerIndex: 2,
      explanation: 'LinkedHashSet prevents duplicates like HashSet while keeping insertion order via a doubly-linked list.',
    },
  ],
  'python-internals': [
    {
      id: 'py-1',
      question: 'What does `[x * 2 for x in range(3)]` produce in Python?',
      options: ['[0, 2, 4]', '[2, 4, 6]', '[0, 2, 4, 6]', '(0, 2, 4)'],
      answerIndex: 0,
      explanation: 'range(3) yields 0, 1, 2. Multiplying each by 2 yields the list [0, 2, 4].',
    },
    {
      id: 'py-2',
      question: 'What is the output of:\na = [1, 2]\nb = a\nb.append(3)\nprint(a)',
      options: ['[1, 2]', '[1, 2, 3]', 'Error', '[3]'],
      answerIndex: 1,
      explanation: 'b = a binds b to the exact same list object in memory, so mutating b also mutates a.',
    },
  ],
  'dsa-complexity-structures': [
    {
      id: 'dsa-1',
      question: 'Which traversal of a Binary Search Tree (BST) visits nodes in sorted non-decreasing order?',
      options: ['Preorder', 'Inorder', 'Postorder', 'Level-order'],
      answerIndex: 1,
      explanation: 'Inorder traversal visits Left subtree -> Root -> Right subtree, producing sorted keys for a BST.',
    },
    {
      id: 'dsa-2',
      question: 'What is the worst-case time complexity of Merge Sort and Quick Sort respectively?',
      options: [
        'O(N log N) and O(N^2)',
        'O(N^2) and O(N log N)',
        'O(N log N) and O(N log N)',
        'O(N) and O(N log N)',
      ],
      answerIndex: 0,
      explanation: 'Merge Sort always divides evenly for O(N log N) worst-case; Quick Sort degrades to O(N^2) on unbalanced pivots.',
    },
  ],
  'dbms-sql': [
    {
      id: 'db-1',
      question: 'Which normal form eliminates transitive dependencies of non-key attributes on candidate keys?',
      options: ['1NF', '2NF', '3NF', '4NF'],
      answerIndex: 2,
      explanation: '3NF requires 2NF and no transitive functional dependency (non-prime attribute -> non-prime attribute).',
    },
    {
      id: 'db-2',
      question: 'Which SQL clause is used to filter aggregated groups produced by `GROUP BY`?',
      options: ['WHERE', 'HAVING', 'ORDER BY', 'DISTINCT'],
      answerIndex: 1,
      explanation: 'WHERE filters individual rows before grouping; HAVING filters groups after aggregation.',
    },
  ],
  'operating-systems': [
    {
      id: 'os-1',
      question: 'Which CPU scheduling algorithm can cause starvation of long processes?',
      options: ['Round Robin', 'First Come First Served (FCFS)', 'Shortest Job First (SJF)', 'FIFO'],
      answerIndex: 2,
      explanation: 'In SJF (especially preemptive SRTF), continuous arrival of shorter jobs can starve longer jobs indefinitely.',
    },
    {
      id: 'os-2',
      question: 'What is "Thrashing" in virtual memory systems?',
      options: [
        'CPU spending more time swapping pages between disk and RAM than executing instructions',
        'A deadlock between two kernel threads',
        'Disk sector fragmentation in FAT32',
        'Overflowing the L1 instruction cache',
      ],
      answerIndex: 0,
      explanation: 'Thrashing occurs when active working sets exceed physical RAM, causing excessive page faults and paging.',
    },
  ],
  'computer-networks': [
    {
      id: 'cn-1',
      question: 'At which OSI layer does a traditional network Router operate?',
      options: ['Physical Layer (Layer 1)', 'Data Link Layer (Layer 2)', 'Network Layer (Layer 3)', 'Transport Layer (Layer 4)'],
      answerIndex: 2,
      explanation: 'Routers forward packets across networks using logical IP addresses at the Network Layer (Layer 3).',
    },
    {
      id: 'cn-2',
      question: 'How many usable host IP addresses are available in a `/26` IPv4 subnet?',
      options: ['30', '62', '64', '126'],
      answerIndex: 1,
      explanation: 'Host bits = 32 - 26 = 6. Total addresses = 2^6 = 64. Subtracting network & broadcast addresses gives 62 usable hosts.',
    },
  ],
  'software-eng-web': [
    {
      id: 'sew-1',
      question: 'Which HTTP status code indicates that a request succeeded and a new resource was created?',
      options: ['200 OK', '201 Created', '204 No Content', '304 Not Modified'],
      answerIndex: 1,
      explanation: 'HTTP 201 Created indicates successful fulfillment resulting in one or more newly created resources.',
    },
    {
      id: 'sew-2',
      question: 'Which Git command creates a new commit that safely undoes the changes of an earlier commit on a shared branch?',
      options: ['git reset --hard', 'git revert', 'git rebase', 'git clean -fd'],
      answerIndex: 1,
      explanation: '`git revert` creates a new inverse commit without rewriting shared commit history.',
    },
  ],
  'number-grid-puzzles': [
    {
      id: 'ngp-1',
      question: 'Find the missing number:\nRow 1: 4, 5, 21\nRow 2: 6, 3, 19\nRow 3: 7, 4, ?',
      options: ['28', '29', '30', '32'],
      answerIndex: 1,
      explanation: 'Rule: (First * Second) + 1. Row 1: 4*5+1 = 21. Row 2: 6*3+1 = 19. Row 3: 7*4+1 = 29.',
    },
    {
      id: 'ngp-2',
      question: 'If 2 + 3 = 10, 7 + 2 = 63, 6 + 5 = 66, then what is 8 + 4 = ?',
      options: ['32', '64', '96', '104'],
      answerIndex: 2,
      explanation: 'Pattern: A + B means A * (A + B). 2*(2+3)=10, 7*(7+2)=63, 6*(6+5)=66, so 8*(8+4) = 8*12 = 96.',
    },
  ],
  'weighing-measuring': [
    {
      id: 'wm-1',
      question: 'You have 9 identical-looking coins, one of which is slightly heavier. Using a two-pan balance scale, what is the MINIMUM number of weighings guaranteed to find the heavier coin?',
      options: ['1', '2', '3', '4'],
      answerIndex: 1,
      explanation: 'Divide into 3 groups of 3. Weigh group 1 vs group 2 (identifies the heavy group of 3 in 1 weighing). Then weigh 1 vs 1 from that group (2 weighings total).',
    },
    {
      id: 'wm-2',
      question: 'You have an unmarked 5-liter jug and a 3-liter jug with unlimited water. How can you measure exactly 4 liters?',
      options: [
        'Fill 5L, pour 3L out, empty 3L, pour remaining 2L into 3L, fill 5L and top up 3L with 1L',
        'Fill 3L twice and pour into 5L',
        'It is mathematically impossible',
        'Fill 5L halfway by eye',
      ],
      answerIndex: 0,
      explanation: '5L -> 3L leaves 2L in 5L. Move 2L to 3L jug. Refill 5L and pour 1L to fill 3L jug -> exactly 4L remains in 5L jug.',
    },
  ],
  'bridge-races-logic': [
    {
      id: 'brl-1',
      question: 'Four people need to cross a bridge at night with 1 torch (max 2 cross at a time, moving at the slower person’s pace). Their times are 1, 2, 5, and 10 minutes. What is the MINIMUM total time?',
      options: ['19 minutes', '17 minutes', '18 minutes', '21 minutes'],
      answerIndex: 1,
      explanation: '(1 & 2) cross -> 2m; (1) returns -> 1m; (5 & 10) cross -> 10m; (2) returns -> 2m; (1 & 2) cross -> 2m. Total = 2+1+10+2+2 = 17 minutes.',
    },
    {
      id: 'brl-2',
      question: 'There are 25 horses and a track with 5 lanes (no stopwatch). What is the minimum number of races needed to find the fastest 3 horses?',
      options: ['5', '6', '7', '8'],
      answerIndex: 2,
      explanation: '5 races for the 5 groups + 1 race among the 5 group winners (6th) + 1 final race among the 5 candidates for 2nd & 3rd place = 7 races.',
    },
  ],
  'lateral-probability-puzzles': [
    {
      id: 'lpp-1',
      question: 'Three ants sit at the 3 corners of an equilateral triangle. Each randomly picks a direction along an edge and walks at the same speed. What is the probability that NONE of them collide?',
      options: ['1/4', '1/2', '3/4', '1/8'],
      answerIndex: 0,
      explanation: 'Each ant has 2 choices -> 2^3 = 8 combinations. No collision occurs only if all 3 go clockwise OR all 3 go counter-clockwise (2/8 = 1/4).',
    },
    {
      id: 'lpp-2',
      question: 'Outside a closed room are 3 switches connected to 3 incandescent bulbs inside. You may enter the room ONLY ONCE. How do you identify which switch controls which bulb?',
      options: [
        'Turn switch 1 ON for 5 mins then OFF, turn switch 2 ON, and enter immediately',
        'Turn all 3 switches ON and observe brightness',
        'Toggle switch 1 and switch 2 rapidly',
        'Impossible with one visit',
      ],
      answerIndex: 0,
      explanation: 'Inside: the lit bulb belongs to Switch 2, the warm unlit bulb belongs to Switch 1, and the cold unlit bulb belongs to Switch 3.',
    },
  ],
};
