// IndiaBIX-style complete concept directory & online test catalog for InterviewIQ

export const APTITUDE_SECTIONS = [
  {
    id: 'general-aptitude',
    title: 'General Aptitude',
    shortTitle: 'General Aptitude',
    subtitle: 'Quantitative arithmetic, time-speed-distance, combinatorics, and data interpretation.',
    accent: 'signal',
    groups: [
      {
        name: 'Arithmetic Aptitude',
        concepts: [
          {
            id: 'trains',
            name: 'Problems on Trains',
            summary: 'Relative speed, crossing poles, platforms, and two moving trains.',
            formulas: [
              'km/hr to m/s: multiply by 5/18',
              'm/s to km/hr: multiply by 18/5',
              'Time to pass a stationary pole/man = (Length of train) / (Speed of train)',
              'Time to pass a platform/bridge = (Train length + Platform length) / (Speed)',
              'Relative speed (opposite directions) = u + v; (same direction) = |u - v|',
            ],
          },
          {
            id: 'time-distance',
            name: 'Time and Distance',
            summary: 'Average speed, proportional speed ratios, and stoppages.',
            formulas: [
              'Speed = Distance / Time',
              'Average speed for equal distances at speeds x and y = 2xy / (x + y)',
              'If speed ratio is a : b, time ratio for fixed distance is b : a',
            ],
          },
          {
            id: 'time-work',
            name: 'Time and Work',
            summary: 'Work efficiency, combined rates, alternate days, and man-days.',
            formulas: [
              'If A finishes work in n days, 1 day work = 1/n',
              'If A takes x days and B takes y days, together they take xy / (x + y) days',
              'M1 * D1 * H1 / W1 = M2 * D2 * H2 / W2',
            ],
          },
          {
            id: 'pipes-cistern',
            name: 'Pipes and Cistern',
            summary: 'Inlet fill rates, outlet leak rates, and alternating pipe opening.',
            formulas: [
              'Inlet fills in x hrs => +1/x per hr; Outlet empties in y hrs => -1/y per hr',
              'Net part filled in 1 hr = (1/x - 1/y)',
            ],
          },
          {
            id: 'interest',
            name: 'Simple & Compound Interest',
            summary: 'Annual/half-yearly compounding, installments, and SI vs CI difference.',
            formulas: [
              'SI = (P * R * T) / 100',
              'CI Amount = P * (1 + R/100)^n',
              '2-year CI - SI difference = P * (R/100)^2',
            ],
          },
          {
            id: 'profit-loss',
            name: 'Profit and Loss',
            summary: 'Cost price, selling price, markup, successive discounts, and dishonest dealer.',
            formulas: [
              'Gain% = (Gain / CP) * 100; Loss% = (Loss / CP) * 100',
              'SP = CP * (100 + Gain%) / 100',
              'Single equivalent discount for x% and y% = (x + y - xy/100)%',
            ],
          },
          {
            id: 'percentage',
            name: 'Percentage',
            summary: 'Successive percentage changes, population growth, and consumption balance.',
            formulas: [
              'Net % change for +a% and +b% = (a + b + ab/100)%',
              'If price increases by R%, reduction in consumption = [R / (100 + R)] * 100%',
            ],
          },
          {
            id: 'ratio-proportion',
            name: 'Ratio and Proportion',
            summary: 'Compound ratios, mean proportional, third/fourth proportional, and coins.',
            formulas: [
              'Mean proportional between a and b = sqrt(ab)',
              'Third proportional to a, b = b^2 / a',
              'If a/b = c/d, then (a+b)/(a-b) = (c+d)/(c-d) (Componendo & Dividendo)',
            ],
          },
          {
            id: 'partnership',
            name: 'Partnership',
            summary: 'Capital-time product profit sharing between active and sleeping partners.',
            formulas: [
              'Profit ratio = (Investment_1 * Time_1) : (Investment_2 * Time_2)',
            ],
          },
          {
            id: 'ages',
            name: 'Problems on Ages',
            summary: 'Present, past, and future age ratio equations.',
            formulas: [
              'Age difference between two people always remains constant over time.',
              'If present age ratio is a:b and after t years is c:d, solve (ax+t)/(bx+t) = c/d.',
            ],
          },
          {
            id: 'average',
            name: 'Average',
            summary: 'Weighted averages, replacement errors, and consecutive series averages.',
            formulas: [
              'Average = Sum of observations / Number of observations',
              'Average of first n natural numbers = (n + 1) / 2',
            ],
          },
          {
            id: 'permutation-combination',
            name: 'Permutation & Combination',
            summary: 'Arrangements with repetition, circular permutations, and team selections.',
            formulas: [
              'nPr = n! / (n - r)!',
              'nCr = n! / (r! * (n - r)!)',
              'Circular arrangement of n distinct items = (n - 1)!',
            ],
          },
          {
            id: 'probability',
            name: 'Probability',
            summary: 'Dice, cards, coins, balls in urns, and conditional probability.',
            formulas: [
              'P(E) = Favorable outcomes / Total sample space outcomes',
              'P(not E) = 1 - P(E)',
              'P(A or B) = P(A) + P(B) - P(A and B)',
            ],
          },
          {
            id: 'calendar-clock',
            name: 'Calendar & Clock',
            summary: 'Odd days, leap year rules, clock hand angles, and coincidence times.',
            formulas: [
              'Angle between hour & minute hand = |30H - 5.5M| degrees',
              'Hands coincide every 65 (5/11) minutes (22 times in 12 hours)',
              'Ordinary year = 1 odd day; Leap year = 2 odd days',
            ],
          },
          {
            id: 'boats-streams',
            name: 'Boats and Streams',
            summary: 'Upstream/downstream speeds, still water speed, and stream velocity.',
            formulas: [
              'Downstream speed (D) = u + v; Upstream speed (U) = u - v',
              'Speed in still water (u) = (D + U) / 2; Stream speed (v) = (D - U) / 2',
            ],
          },
          {
            id: 'alligation-mixture',
            name: 'Alligation or Mixture',
            summary: 'Mean price ratio rule and repeated replacement dilution.',
            formulas: [
              'Cheaper qty : Dearer qty = (Dearer price - Mean) : (Mean - Cheaper price)',
              'Milk left after n replacements of y from x = x * (1 - y/x)^n',
            ],
          },
          {
            id: 'area-volume',
            name: 'Area, Volume & Surface Area',
            summary: '2D geometry areas/perimeters and 3D cylinders, cones, spheres.',
            formulas: [
              'Circle Area = pi * r^2; Circumference = 2 * pi * r',
              'Cylinder Volume = pi * r^2 * h; Cone Volume = (1/3) * pi * r^2 * h',
              'Sphere Volume = (4/3) * pi * r^3; Surface Area = 4 * pi * r^2',
            ],
          },
          {
            id: 'hcf-lcm',
            name: 'H.C.F. and L.C.M.',
            summary: 'Product identity, fraction HCF/LCM, and remainder theorems.',
            formulas: [
              'HCF * LCM = Product of the two numbers',
              'HCF of fractions = HCF(numerators) / LCM(denominators)',
              'LCM of fractions = LCM(numerators) / HCF(denominators)',
            ],
          },
        ],
      },
      {
        name: 'Data Interpretation',
        concepts: [
          {
            id: 'di-tables-charts',
            name: 'Table, Bar, Pie & Line Charts',
            summary: 'Percentage growth, ratio comparison, and degree-to-percent conversion.',
            formulas: [
              'Pie chart angle conversion: x% = (x / 100) * 360 degrees',
              'Percentage change = [(New - Old) / Old] * 100',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'verbal-reasoning',
    title: 'Verbal and Reasoning',
    shortTitle: 'Verbal & Reasoning',
    subtitle: 'Verbal grammar, vocabulary, logical deduction, series, syllogisms, and visual reasoning.',
    accent: 'jade',
    groups: [
      {
        name: 'Verbal Ability',
        concepts: [
          {
            id: 'synonyms-antonyms',
            name: 'Synonyms & Antonyms',
            summary: 'High-frequency placement vocabulary, context clues, and root words.',
            formulas: [
              'Identify prefix/suffix roots (e.g., bene- = good, mal- = bad, anti- = against)',
              'Eliminate options with wrong parts of speech first',
            ],
          },
          {
            id: 'spotting-errors',
            name: 'Spotting Errors & Sentence Correction',
            summary: 'Subject-verb agreement, tenses, modifiers, and parallelism.',
            formulas: [
              'Either/or and Neither/nor take a verb agreeing with the nearest subject',
              'Each, Every, Everyone, Nobody always take a singular verb',
            ],
          },
          {
            id: 'idioms-one-word',
            name: 'Idioms, Phrases & One Word Substitutes',
            summary: 'Common English idioms, phrasal verbs, and concise single-word meanings.',
            formulas: [
              'Focus on figurative meaning rather than literal word definitions',
            ],
          },
          {
            id: 'para-jumbles',
            name: 'Ordering of Sentences & Comprehension',
            summary: 'Mandatory pairs, pronoun antecedents, and inference from passages.',
            formulas: [
              'Find the independent opening sentence (usually introduces noun before pronouns)',
              'Link cause-effect transitions (however, therefore, consequently)',
            ],
          },
        ],
      },
      {
        name: 'Logical Reasoning',
        concepts: [
          {
            id: 'number-letter-series',
            name: 'Number & Letter Series',
            summary: 'AP/GP differences, alternating series, squares/cubes, and alphabet shifts.',
            formulas: [
              'Check first and second differences between consecutive terms',
              'Remember alphabet positions: E=5, J=10, O=15, T=20, Y=25 (EJOTY)',
            ],
          },
          {
            id: 'blood-relations',
            name: 'Blood Relations',
            summary: 'Family tree mapping, coded relations, and pointing-to-person puzzles.',
            formulas: [
              'Draw generation levels vertically and spouse links horizontally',
              'Do not assume gender from a name unless explicitly stated',
            ],
          },
          {
            id: 'direction-sense',
            name: 'Direction Sense Test',
            summary: 'Turns, shadow positions, and Pythagoras shortest-distance problems.',
            formulas: [
              'Shortest distance = sqrt(horizontal_net^2 + vertical_net^2)',
              'Sunrise shadow falls West; Sunset shadow falls East',
            ],
          },
          {
            id: 'coding-decoding',
            name: 'Coding and Decoding',
            summary: 'Letter shifting, opposite pairs (A<->Z), and substitution ciphers.',
            formulas: [
              'Opposite letter sum rule: Position(letter) + Position(opposite) = 27',
            ],
          },
          {
            id: 'seating-arrangement',
            name: 'Seating Arrangement & Order',
            summary: 'Linear rows, circular tables facing center/outward, and ranking.',
            formulas: [
              'Total persons in a row = Left rank + Right rank - 1',
              'Facing center in a circle: Right = counter-clockwise, Left = clockwise',
            ],
          },
          {
            id: 'syllogisms',
            name: 'Syllogisms & Statements',
            summary: 'Venn diagram logic for All, Some, No, and Either-Or conclusions.',
            formulas: [
              'A conclusion is definitely true only if it holds in ALL valid Venn diagrams',
              'Complementary pair (Some + No / All + Some not) triggers Either-Or when both individually fail',
            ],
          },
          {
            id: 'data-sufficiency',
            name: 'Data Sufficiency & Analogies',
            summary: 'Determining minimum statements required and word/number analogies.',
            formulas: [
              'Check Statement I alone first, then Statement II alone, before combining both',
            ],
          },
        ],
      },
      {
        name: 'Non-Verbal Reasoning',
        concepts: [
          {
            id: 'cubes-mirror-patterns',
            name: 'Cubes, Dice, Mirror & Patterns',
            summary: 'Opposite dice faces, painted cube cuts, mirror/water reflections.',
            formulas: [
              'Standard dice: opposite faces sum to 7',
              'Painted n x n x n cube: 3-face = 8; 2-face = 12(n-2); 1-face = 6(n-2)^2; 0-face = (n-2)^3',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'programming',
    title: 'Programming Questions',
    shortTitle: 'Programming',
    subtitle: 'Code output prediction, pointers, OOP, language internals, and DSA complexity.',
    accent: 'signal',
    groups: [
      {
        name: 'C & C++',
        concepts: [
          {
            id: 'c-pointers-arrays',
            name: 'C Pointers, Arrays & Strings',
            summary: 'Pointer arithmetic, array decay, sizeof traps, and string literals.',
            formulas: [
              '*(arr + i) is identical to arr[i]',
              'sizeof(array) gives total bytes; sizeof(pointer) gives word size (4 or 8 bytes)',
            ],
          },
          {
            id: 'c-functions-storage',
            name: 'C Functions, Recursion & Storage Classes',
            summary: 'auto, static, extern, register, macro expansion, and recursion trees.',
            formulas: [
              'static local variables retain their value across function calls',
              'Macros (#define) perform textual substitution before compilation',
            ],
          },
          {
            id: 'cpp-oop-stl',
            name: 'C++ OOP, Virtual Functions & STL',
            summary: 'Polymorphism, vtable dispatch, constructors/destructors, and STL complexity.',
            formulas: [
              'Virtual functions enable runtime polymorphism via vtable',
              'std::map lookup = O(log N); std::unordered_map average = O(1)',
            ],
          },
        ],
      },
      {
        name: 'Java & Python',
        concepts: [
          {
            id: 'java-core-collections',
            name: 'Java Core, Strings & Collections',
            summary: 'String pool, == vs .equals(), exceptions, interfaces, and collections.',
            formulas: [
              '== compares object references; .equals() compares content',
              'finally block executes even if try/catch throws or returns (unless System.exit)',
            ],
          },
          {
            id: 'python-internals',
            name: 'Python Data Types, Mutability & Scoping',
            summary: 'Mutable default args, slicing, list comprehensions, generators, and GIL.',
            formulas: [
              'Lists, dicts, sets are mutable; ints, strings, tuples are immutable',
              'LEGB scope rule: Local -> Enclosing -> Global -> Built-in',
            ],
          },
        ],
      },
      {
        name: 'Data Structures & Algorithms',
        concepts: [
          {
            id: 'dsa-complexity-structures',
            name: 'DSA, Trees, Graphs & Complexity',
            summary: 'Asymptotic Big-O, traversals, sorting stability, and heap/graph bounds.',
            formulas: [
              'Binary Search = O(log N); Merge Sort = O(N log N) worst-case',
              'Inorder traversal of a BST yields elements in sorted ascending order',
              'BFS uses a Queue (shortest unweighted path); DFS uses a Stack/Recursion',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'technical-mcqs',
    title: 'Technical MCQs',
    shortTitle: 'Technical MCQs',
    subtitle: 'Core CS subjects: DBMS, SQL, Operating Systems, Computer Networks, and Software Engineering.',
    accent: 'saffron',
    groups: [
      {
        name: 'Core Computer Science',
        concepts: [
          {
            id: 'dbms-sql',
            name: 'DBMS, Normalization & SQL',
            summary: '1NF/2NF/3NF/BCNF, ACID transactions, indexing, and SQL joins.',
            formulas: [
              '2NF removes partial dependency; 3NF removes transitive dependency',
              'ACID: Atomicity, Consistency, Isolation, Durability',
              'HAVING filters grouped rows after GROUP BY; WHERE filters rows before grouping',
            ],
          },
          {
            id: 'operating-systems',
            name: 'Operating Systems',
            summary: 'CPU scheduling, deadlocks, semaphores, virtual memory, and page faults.',
            formulas: [
              '4 Coffman deadlock conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait',
              'Turnaround Time = Completion - Arrival; Waiting Time = Turnaround - Burst',
            ],
          },
          {
            id: 'computer-networks',
            name: 'Computer Networks',
            summary: 'OSI 7 layers, TCP vs UDP, subnetting, HTTP status codes, and DNS.',
            formulas: [
              'Usable hosts in a /n IPv4 subnet = 2^(32 - n) - 2',
              'TCP = connection-oriented, reliable; UDP = connectionless, low overhead',
            ],
          },
          {
            id: 'software-eng-web',
            name: 'Software Engineering, Git & Cloud',
            summary: 'SDLC models, unit/integration testing, REST methods, and HTTP semantics.',
            formulas: [
              'Idempotent HTTP methods: GET, PUT, DELETE (not POST)',
              'Regression testing verifies old features still work after new changes',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'puzzles',
    title: 'Puzzles',
    shortTitle: 'Puzzles',
    subtitle: 'Classic tech-interview brainteasers, lateral thinking, logic grids, and probability puzzles.',
    accent: 'rose',
    groups: [
      {
        name: 'Interview Brainteasers',
        concepts: [
          {
            id: 'number-grid-puzzles',
            name: 'Number & Missing Matrix Puzzles',
            summary: 'Grid arithmetic patterns, magic squares, and operator puzzles.',
            formulas: [
              'Test row-wise, column-wise, and diagonal sum/product invariants',
            ],
          },
          {
            id: 'weighing-measuring',
            name: 'Weighing Coins & Water Jugs',
            summary: 'Minimum balance weighings and exact volume measurement using two jugs.',
            formulas: [
              'With k pan-balance weighings, you can distinguish up to 3^k outcomes (when heavier/lighter is known)',
              'Water jug target c is measurable iff c is a multiple of gcd(a, b) and c <= max(a, b)',
            ],
          },
          {
            id: 'bridge-races-logic',
            name: 'Bridge Crossing, Races & Truth/Liars',
            summary: 'Optimal scheduling, minimum horse races, and knight/knave deductions.',
            formulas: [
              'To minimize bridge time for 4 people (1,2,5,10): send fastest pair first, return fastest, send slowest pair together',
            ],
          },
          {
            id: 'lateral-probability-puzzles',
            name: 'Lateral Thinking & Probability Puzzles',
            summary: 'Ants on a triangle, birthday paradox, switches & bulbs, and Monty Hall.',
            formulas: [
              'Switches & 3 bulbs: Turn Switch 1 on for 5 mins then off, turn Switch 2 on, enter room (hot off = 1, lit = 2, cold off = 3)',
            ],
          },
        ],
      },
    ],
  },
];

export const ONLINE_TESTS = [
  {
    id: 'test-general-aptitude',
    title: 'General Aptitude Assessment',
    description: 'Timed arithmetic & data interpretation test modeled on campus placement screening rounds.',
    durationMinutes: 15,
    questionCount: 10,
    difficulty: 'Intermediate',
    sections: ['general-aptitude'],
  },
  {
    id: 'test-verbal-reasoning',
    title: 'Verbal & Logical Reasoning Test',
    description: 'Assess reading comprehension, grammar, series, blood relations, and syllogisms.',
    durationMinutes: 15,
    questionCount: 10,
    difficulty: 'Intermediate',
    sections: ['verbal-reasoning'],
  },
  {
    id: 'test-programming-tech',
    title: 'Programming & Technical MCQs Test',
    description: 'Evaluate C/C++/Java/Python output prediction alongside DBMS, OS, and Networks.',
    durationMinutes: 15,
    questionCount: 10,
    difficulty: 'Intermediate',
    sections: ['programming', 'technical-mcqs'],
  },
  {
    id: 'test-full-placement',
    title: 'Full Placement Mock Test (All Sections)',
    description: 'Comprehensive multi-section exam combining General Aptitude, Verbal, Reasoning, Programming, Technical MCQs, and Puzzles.',
    durationMinutes: 20,
    questionCount: 15,
    difficulty: 'Mixed',
    sections: ['general-aptitude', 'verbal-reasoning', 'programming', 'technical-mcqs', 'puzzles'],
  },
];

export function findConceptById(conceptId) {
  for (const section of APTITUDE_SECTIONS) {
    for (const group of section.groups) {
      const concept = group.concepts.find((c) => c.id === conceptId);
      if (concept) {
        return { section, group, concept };
      }
    }
  }
  return null;
}
