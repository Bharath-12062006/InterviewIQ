// Centralized mock data and state store for InterviewIQ Phase 1.
// Supports localStorage persistence with seamless fallbacks.

const STORAGE_KEYS = {
  USER: 'interviewiq_user_profile',
  REGISTERED_USERS: 'interviewiq_registered_users',
  SETTINGS: 'interviewiq_settings',
  RESUME: 'interviewiq_resume',
  INTERVIEWS: 'interviewiq_interviews',
  STUDY_PLAN: 'interviewiq_study_plan',
};

export const initialUserProfile = {
  name: '',
  email: '',
  phone: '',
  title: 'Candidate / Student',
  targetRole: 'Software Engineer',
  university: '',
  degree: '',
  gradYear: '',
  cgpa: '',
  location: '',
  bio: '',
  targetCompanies: [],
  skills: ['DSA', 'SQL', 'OOPs'],
  github: '',
  linkedin: '',
  portfolio: '',
};

export const initialSettings = {
  emailNotifications: true,
  dailyPracticeReminder: true,
  weeklyReportDigest: true,
  soundEffects: true,
  speechSynthesizerVoice: 'Samantha (AI Voice)',
  micDevice: 'Built-in Audio Microphone (Default)',
  cameraDevice: 'Integrated HD Webcam (1280x720)',
  theme: 'light',
  codeEditorTheme: 'vs-dark',
  autoSubmitTestCases: false,
  privacyShareStats: true,
};

export const initialResumeData = {
  fileName: 'Candidate_Resume.pdf',
  fileSize: '1.4 MB',
  uploadDate: '2026-11-21',
  atsScore: 84,
  targetRole: 'Software Engineer',
  summary: 'Strong backend & algorithms candidate with hands-on MERN stack and distributed systems projects. Excellent alignment with campus SDE placement criteria.',
  extracted: {
    education: [
      { institution: 'Anna University, CEG', degree: 'B.E. Computer Science and Engineering', period: '2023 - 2027', grade: '8.84 CGPA' },
      { institution: 'Kendriya Vidyalaya', degree: 'Higher Secondary (Class XII CBSE)', period: '2021 - 2023', grade: '96.2%' }
    ],
    experience: [
      {
        company: 'FinTech Labs',
        role: 'Software Engineering Intern',
        period: 'May 2026 - Jul 2026',
        location: 'Bengaluru, India',
        points: [
          'Engineered high-throughput idempotency keys for transaction processing pipeline handling 12,000 req/sec in Go & Redis.',
          'Reduced p99 database latency by 34% by redesigning PostgreSQL composite indexes and partitioning transaction logs.'
        ]
      }
    ],
    projects: [
      {
        name: 'Distributed Task Queue Engine',
        tech: 'Node.js, Redis, Docker, TypeScript',
        description: 'Fault-tolerant distributed job worker cluster supporting retry backoffs, dead-letter queues, and real-time WebSocket dashboard.'
      },
      {
        name: 'Campus Placement Prep Portal',
        tech: 'React, Tailwind, Express, MongoDB',
        description: 'Full-stack collaborative portal with real-time room scheduling, code evaluation sandbox, and peer benchmarking.'
      }
    ],
    skills: ['Python', 'Java', 'C++', 'Data Structures', 'Algorithms', 'SQL', 'PostgreSQL', 'Redis', 'React', 'Node.js', 'Docker', 'Git']
  },
  missingSkills: [
    { skill: 'Kubernetes & CI/CD', importance: 'High', reason: 'Commonly expected in enterprise cloud microservices deployments.' },
    { skill: 'System Design / LLD Patterns', importance: 'High', reason: 'Crucial for SDE second technical and machine coding rounds.' },
    { skill: 'Unit & Integration Testing (Jest/JUnit)', importance: 'Medium', reason: 'Industry standard for code quality assurance in product companies.' }
  ],
  suggestedQuestions: [
    { category: 'Distributed Systems', question: 'In your Distributed Task Queue project, how did you guarantee at-least-once message delivery when worker nodes crashed?' },
    { category: 'Databases & Concurrency', question: 'At FinTech Labs, how did you manage race conditions and transaction isolation levels when handling 12,000 requests per second?' },
    { category: 'Data Structures & Algorithms', question: 'How would you implement an LRU cache eviction policy for your Redis-backed caching layer from scratch?' },
    { category: 'OOP & Clean Architecture', question: 'Walk me through the design patterns you utilized to separate the job scheduler from the worker execution pool.' }
  ]
};

export const initialInterviews = [
  {
    id: 'iv-112',
    category: 'DSA',
    mode: 'Strict Technical',
    difficulty: 'Intermediate',
    date: '2026-11-20',
    score: 76,
    minutes: 32,
    rubric: { technical: 78, problemSolving: 74, communication: 80, confidence: 72 },
    summary: 'Demonstrated solid grasp of graph algorithms and dynamic programming state transitions, with minor syntax hesitation and missed corner case in cycle detection.',
    strengths: ['Accurate asymptotic analysis (Big-O)', 'Clear verbalization of trade-offs before coding', 'Effective use of adjacency lists for graph memory efficiency'],
    improvements: ['Need faster identification of bipartite graph coloring approach', 'Remember to account for disconnected graph components', 'Review dynamic programming space optimization with rolling arrays'],
    questions: [
      {
        id: 1,
        question: 'Given an undirected graph, how do you determine if it contains an odd-length cycle (i.e. is it bipartite)?',
        candidateAnswer: 'We can use BFS or DFS with 2-coloring. If we encounter an already visited neighbor with the exact same color as current node, there exists an odd cycle and it is not bipartite.',
        score: 8.5,
        feedback: 'Spot-on conceptual explanation and correctly identified 2-coloring principle.',
        modelAnswer: 'A graph is bipartite if and only if it has no odd-length cycles. Perform BFS/DFS from every unvisited vertex (to handle disconnected components). Color starting vertex 0, and all neighbors 1. If any visited neighbor has the same color, return false; otherwise true in O(V+E) time.'
      },
      {
        id: 2,
        question: 'How does Dijkstra’s algorithm behave with negative edge weights, and why?',
        candidateAnswer: 'Dijkstra fails on negative edge weights because it greedily marks vertices as finalized assuming edge weights are non-negative. Once marked, it never revisits them, which can miss a cheaper path through a negative weight.',
        score: 9.0,
        feedback: 'Excellent explanation of the greedy invariant failure.',
        modelAnswer: 'Dijkstra’s algorithm assumes that adding an edge to a path only increases or maintains path cost. With negative weights, this monotonicity property breaks. For graphs with negative edge weights, Bellman-Ford or SPFA must be used instead.'
      },
      {
        id: 3,
        question: 'Explain the difference between Top-Down Memoization and Bottom-Up Tabulation in Dynamic Programming.',
        candidateAnswer: 'Top-down uses recursion starting from the target state down to base cases and stores results in a table or hash map. Bottom-up starts from base cases iteratively filling the table up to the target state.',
        score: 8.0,
        feedback: 'Solid answer; could have discussed call stack memory limitations with deep recursion in top-down.',
        modelAnswer: 'Top-down is recursive and explores only subproblems reachable from the target state, but incurs recursion call stack overhead O(N). Bottom-up is iterative, avoids recursion depth limits, and often enables memory optimization from O(N) to O(1) by discarding older states.'
      }
    ]
  },
  {
    id: 'iv-111',
    category: 'HR',
    mode: 'HR',
    difficulty: 'Beginner',
    date: '2026-11-17',
    score: 88,
    minutes: 18,
    rubric: { technical: 90, problemSolving: 85, communication: 92, confidence: 86 },
    summary: 'Exceptional communication using the STAR methodology. Answers reflected genuine collaborative spirit and strong adaptability under tight deadlines.',
    strengths: ['Structured STAR technique responses', 'Compelling authentic examples from college hackathons', 'Poised tone and concise phrasing'],
    improvements: ['Include quantitative impact metrics where possible (e.g., % time saved or users impacted)'],
    questions: [
      {
        id: 1,
        question: 'Tell me about a time when you faced a conflict within your project team and how you resolved it.',
        candidateAnswer: 'During our final semester capstone project, our team was divided between using PostgreSQL vs MongoDB. I arranged a mini-benchmark test assessing our schema relational needs and led a consensus discussion that chose Postgres due to ACID requirements.',
        score: 9.0,
        feedback: 'Constructive conflict resolution driven by data rather than subjective arguments.',
        modelAnswer: 'Use the STAR method: State the Situation (differing opinions), Task (align on architecture), Action (set objective criteria, proof-of-concept, team retro), and Result (delivered on schedule with team buy-in).'
      }
    ]
  },
  {
    id: 'iv-110',
    category: 'DBMS',
    mode: 'Friendly',
    difficulty: 'Intermediate',
    date: '2026-11-13',
    score: 54,
    minutes: 27,
    rubric: { technical: 52, problemSolving: 55, communication: 60, confidence: 50 },
    summary: 'Needs targeted revision in transaction isolation levels, phantom reads, and B-Tree indexing mechanisms.',
    strengths: ['Understood primary vs foreign keys', 'Good basic SQL join syntax'],
    improvements: ['Revise ACID properties in detail', 'Understand difference between Read Committed and Repeatable Read', 'Practice writing subqueries and window functions'],
    questions: [
      {
        id: 1,
        question: 'What is the difference between Dirty Read, Non-Repeatable Read, and Phantom Read?',
        candidateAnswer: 'Dirty read is reading uncommitted data. Non-repeatable read is reading modified rows during a transaction. Phantom read is when new rows appear that match a query condition.',
        score: 6.5,
        feedback: 'Understood definitions roughly, but struggled to map them to ANSI SQL Isolation Levels.',
        modelAnswer: 'Dirty Read: Transaction reads data written by uncommitted concurrent transaction. Non-Repeatable Read: Row re-read returns different values because another transaction updated and committed. Phantom Read: A range query returns new qualifying rows inserted by another committed transaction. Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable.'
      }
    ]
  },
  {
    id: 'iv-109',
    category: 'MERN Stack',
    mode: 'Senior Engineer',
    difficulty: 'Advanced',
    date: '2026-11-09',
    score: 71,
    minutes: 41,
    rubric: { technical: 72, problemSolving: 70, communication: 75, confidence: 68 },
    summary: 'Good practical experience with React hooks and Express middleware. Could strengthen understanding of React 18 concurrency, SSR, and MongoDB aggregation pipelines.',
    strengths: ['Deep understanding of useEffect dependency arrays', 'Clean Express route architecture'],
    improvements: ['Review React Fiber reconciliation', 'Master MongoDB $lookup and $facet aggregation stages'],
    questions: [
      {
        id: 1,
        question: 'How does React Virtual DOM reconciliation work, and what role do keys play in lists?',
        candidateAnswer: 'Virtual DOM creates an in-memory representation. When state changes, React diffs trees. Keys give persistent identity to list elements so React knows which were added, moved, or removed rather than re-rendering all.',
        score: 8.0,
        feedback: 'Good fundamental understanding. Mentioning heuristic O(N) diffing algorithm would make it 10/10.',
        modelAnswer: 'React uses a heuristic O(N) diff algorithm based on two assumptions: elements of different types produce different trees, and children can be tagged with stable unique keys. Keys allow React to match existing children during re-renders, avoiding unnecessary DOM re-creations.'
      }
    ]
  },
  {
    id: 'iv-108',
    category: 'Python',
    mode: 'Friendly',
    difficulty: 'Beginner',
    date: '2026-11-04',
    score: 84,
    minutes: 22,
    rubric: { technical: 85, problemSolving: 82, communication: 88, confidence: 82 },
    summary: 'High proficiency in Python syntax, list comprehensions, decorators, and memory management basics.',
    strengths: ['Understood Python GIL (Global Interpreter Lock)', 'Correct explanation of generators vs iterators'],
    improvements: ['Explore asyncio and concurrent.futures deeper'],
    questions: [
      {
        id: 1,
        question: 'What is a Python generator and how does yield differ from return?',
        candidateAnswer: 'A generator produces items lazily using yield without storing the entire sequence in memory. Return terminates function execution while yield freezes state and resumes on next().',
        score: 9.0,
        feedback: 'Precise and concise answer.',
        modelAnswer: 'Generators implement the iterator protocol lazily. When yield is hit, execution state, local variables, and instruction pointer are preserved, returning a value to the caller. On subsequent next() calls, execution continues immediately after the yield.'
      }
    ]
  }
];

export const mockCodingProblems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    acceptance: '51.8%',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly one solution***, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    starterCode: {
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        seen = {}
        for i, n in enumerate(nums):
            diff = target - n
            if diff in seen:
                return [seen[diff], i]
            seen[n] = i
        return []`,
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (seen.has(complement)) {
            return [seen.get(complement), i];
        }
        seen.set(nums[i], i);
    }
    return [];
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int comp = target - nums[i];
            if (seen.count(comp)) return {seen[comp], i};
            seen[nums[i]] = i;
        }
        return {};
    }
};`
    },
    testCases: [
      { input: 'nums = [2, 7, 11, 15], target = 9', expected: '[0, 1]', isHidden: false },
      { input: 'nums = [3, 2, 4], target = 6', expected: '[1, 2]', isHidden: false },
      { input: 'nums = [3, 3], target = 6', expected: '[0, 1]', isHidden: false },
      { input: 'nums = [-1, -2, -3, -4, -5], target = -8', expected: '[2, 4]', isHidden: true },
      { input: 'nums = [1000000000, 3, 5, 1000000000], target = 2000000000', expected: '[0, 3]', isHidden: true }
    ],
    optimalComplexity: 'Time: O(N) · Space: O(N)'
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    category: 'Stack',
    acceptance: '40.6%',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only \'()[]{}\'.'],
    starterCode: {
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        return not stack`,
      javascript: `var isValid = function(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const ch of s) {
        if (map[ch]) {
            if (stack.pop() !== map[ch]) return false;
        } else {
            stack.push(ch);
        }
    }
    return stack.length === 0;
};`,
      java: `class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(') stack.push(')');
            else if (c == '{') stack.push('}');
            else if (c == '[') stack.push(']');
            else if (stack.isEmpty() || stack.pop() != c) return false;
        }
        return stack.isEmpty();
    }
}`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        stack<char> st;
        for (char c : s) {
            if (c == '(' || c == '{' || c == '[') st.push(c);
            else {
                if (st.empty()) return false;
                char top = st.top(); st.pop();
                if (c == ')' && top != '(') return false;
                if (c == '}' && top != '{') return false;
                if (c == ']' && top != '[') return false;
            }
        }
        return st.empty();
    }
};`
    },
    testCases: [
      { input: 's = "()"', expected: 'true', isHidden: false },
      { input: 's = "()[]{}"', expected: 'true', isHidden: false },
      { input: 's = "([)]"', expected: 'false', isHidden: true },
      { input: 's = "{[]}"', expected: 'true', isHidden: true }
    ],
    optimalComplexity: 'Time: O(N) · Space: O(N)'
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'Medium',
    category: 'Design & Linked List',
    acceptance: '42.1%',
    description: `Design a data structure that follows the constraints of a **Least Recently Used (LRU) cache**.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if the key exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of the key if that key exists. Otherwise, add the key-value pair to the cache. If the number of keys exceeds the capacity from this operation, evict the least recently used key.

The functions \`get\` and \`put\` must each run in **O(1)** average time complexity.`,
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]'
      }
    ],
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.'
    ],
    starterCode: {
      python: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head, self.tail = Node(), Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def get(self, key: int) -> int:
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._insert(node)
            return node.val
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self._remove(self.cache[key])
        node = Node(key, value)
        self.cache[key] = node
        self._insert(node)
        if len(self.cache) > self.cap:
            lru = self.head.next
            self._remove(lru)
            del self.cache[lru.key]

    def _remove(self, node):
        p, n = node.prev, node.next
        p.next, n.prev = n, p

    def _insert(self, node):
        p, n = self.tail.prev, self.tail
        p.next = node
        node.prev, node.next = p, n
        n.prev = node`,
      javascript: `class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.map = new Map();
    }
    get(key) {
        if (!this.map.has(key)) return -1;
        const val = this.map.get(key);
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }
    put(key, value) {
        if (this.map.has(key)) this.map.delete(key);
        this.map.set(key, value);
        if (this.map.size > this.capacity) {
            const firstKey = this.map.keys().next().value;
            this.map.delete(firstKey);
        }
    }
}`,
      java: `class LRUCache {
    private final int capacity;
    private final LinkedHashMap<Integer, Integer> map;

    public LRUCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(capacity, 0.75f, true) {
            protected boolean removeEldestEntry(Map.Entry<Integer, Integer> eldest) {
                return size() > LRUCache.this.capacity;
            }
        };
    }
    public int get(int key) {
        return map.getOrDefault(key, -1);
    }
    public void put(int key, int value) {
        map.put(key, value);
    }
}`,
      cpp: `class LRUCache {
    int cap;
    list<pair<int, int>> l;
    unordered_map<int, list<pair<int, int>>::iterator> m;
public:
    LRUCache(int capacity) : cap(capacity) {}
    int get(int key) {
        if (!m.count(key)) return -1;
        l.splice(l.begin(), l, m[key]);
        return m[key]->second;
    }
    void put(int key, int value) {
        if (m.count(key)) {
            l.splice(l.begin(), l, m[key]);
            m[key]->second = value;
            return;
        }
        if (l.size() == cap) {
            int delKey = l.back().first;
            l.pop_back();
            m.erase(delKey);
        }
        l.emplace_front(key, value);
        m[key] = l.begin();
    }
};`
    },
    testCases: [
      { input: 'Capacity: 2, put(1, 1), put(2, 2), get(1)', expected: '1', isHidden: false },
      { input: 'put(3, 3), get(2) (evicted)', expected: '-1', isHidden: false },
      { input: 'put(4, 4), get(1) (evicted)', expected: '-1', isHidden: true },
      { input: 'get(3), get(4)', expected: '3, 4', isHidden: true }
    ],
    optimalComplexity: 'Time: O(1) for both operations · Space: O(Capacity)'
  }
];

export const mockStudyPlan = {
  placementCountdownDays: 42,
  readinessScore: 68,
  dailyGoalMinutes: 45,
  dailyCompletedMinutes: 25,
  weeklySchedule: [
    { day: 'Monday', title: 'DBMS: Transactions & Isolation Levels', category: 'DBMS', duration: 30, completed: true, questions: 4 },
    { day: 'Tuesday', title: 'DSA: Tree Traversals & Binary Search Trees', category: 'DSA', duration: 45, completed: true, questions: 5 },
    { day: 'Wednesday', title: 'System Design: Rate Limiters & Caching', category: 'System Design', duration: 40, completed: false, questions: 3 },
    { day: 'Thursday', title: 'Mock Interview: Full Stack & Node.js', category: 'Full Stack', duration: 35, completed: false, questions: 6 },
    { day: 'Friday', title: 'SQL: Window Functions & Recursive CTEs', category: 'SQL', duration: 30, completed: false, questions: 4 },
    { day: 'Saturday', title: 'Coding Sprint: Dynamic Programming Patterns', category: 'DSA', duration: 60, completed: false, questions: 3 },
    { day: 'Sunday', title: 'Behavioral & Leadership Principles (STAR)', category: 'HR', duration: 25, completed: false, questions: 5 }
  ],
  priorityDomains: [
    { name: 'DBMS', currentScore: 52, targetScore: 80, gap: '-28%', recommendedActions: 'Practice concurrency and recovery protocols' },
    { name: 'DSA', currentScore: 61, targetScore: 85, gap: '-24%', recommendedActions: 'Focus on graphs and dynamic programming memoization' },
    { name: 'Java', currentScore: 68, targetScore: 80, gap: '-12%', recommendedActions: 'Review multithreading and JVM memory model' }
  ]
};

// Safe LocalStorage helpers with graceful fallback
export function getStoredData(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

export function setStoredData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage (${key}):`, err);
  }
}

export function getUserProfile() {
  return getStoredData(STORAGE_KEYS.USER, initialUserProfile);
}

export function saveUserProfile(profile) {
  setStoredData(STORAGE_KEYS.USER, profile);
}

export function clearUserProfile() {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
  } catch {}
}

export function getRegisteredUsers() {
  return getStoredData(STORAGE_KEYS.REGISTERED_USERS, []);
}

export function saveRegisteredUsers(users) {
  setStoredData(STORAGE_KEYS.REGISTERED_USERS, users);
}

export function getSettings() {
  return getStoredData(STORAGE_KEYS.SETTINGS, initialSettings);
}

export function saveSettings(settings) {
  setStoredData(STORAGE_KEYS.SETTINGS, settings);
}

export function getResumeData() {
  return getStoredData(STORAGE_KEYS.RESUME, initialResumeData);
}

export function saveResumeData(resume) {
  setStoredData(STORAGE_KEYS.RESUME, resume);
}

export function getInterviews() {
  return getStoredData(STORAGE_KEYS.INTERVIEWS, initialInterviews);
}

export function saveInterviews(interviews) {
  setStoredData(STORAGE_KEYS.INTERVIEWS, interviews);
}

export function getInterviewById(id) {
  const list = getInterviews();
  return list.find((i) => i.id === id) || initialInterviews[0];
}

export function addInterview(interview) {
  const list = getInterviews();
  const updated = [interview, ...list];
  saveInterviews(updated);
  return updated;
}

export function getStudyPlan() {
  return getStoredData(STORAGE_KEYS.STUDY_PLAN, mockStudyPlan);
}

export function saveStudyPlan(plan) {
  setStoredData(STORAGE_KEYS.STUDY_PLAN, plan);
}

// Retain compatibility with existing dashboard
export const mockDashboard = {
  get user() {
    return getUserProfile();
  },
  stats: {
    interviews: { value: 12, delta: '+3 this month' },
    averageScore: { value: 71, delta: '+6 vs last month' },
    codingSolved: { value: 38, delta: '+9 this month' },
    streakDays: { value: 6, delta: 'Best: 11 days' },
  },
  readiness: { score: 64, basedOn: 8 },
  scoreHistory: [
    { label: '2 Oct', score: 52 },
    { label: '9 Oct', score: 58 },
    { label: '16 Oct', score: 55 },
    { label: '23 Oct', score: 64 },
    { label: '30 Oct', score: 67 },
    { label: '6 Nov', score: 66 },
    { label: '13 Nov', score: 74 },
    { label: '20 Nov', score: 76 },
  ],
  skills: [
    { name: 'HR', score: 85 },
    { name: 'Python', score: 82 },
    { name: 'OOPs', score: 79 },
    { name: 'MERN Stack', score: 77 },
    { name: 'C', score: 74 },
    { name: 'SQL', score: 70 },
    { name: 'Java', score: 68 },
    { name: 'DSA', score: 61 },
    { name: 'DBMS', score: 52 },
  ],
  topics: [
    { id: 1, title: 'Normalization and transactions', category: 'DBMS', reason: 'Averaged 52% across 3 interviews', minutes: 25 },
    { id: 2, title: 'Dynamic programming patterns', category: 'DSA', reason: 'Missed 4 of 6 hidden test cases', minutes: 40 },
    { id: 3, title: 'Java concurrency basics', category: 'Java', reason: 'Answers lacked depth on threads', minutes: 30 },
    { id: 4, title: 'SQL window functions', category: 'SQL', reason: 'Skipped 2 questions last session', minutes: 20 },
  ],
  get recentInterviews() {
    return getInterviews();
  },
  notifications: [
    { id: 1, text: 'Your DSA report from 20 Nov is ready to review.', time: '4 days ago' },
    { id: 2, text: 'Study plan updated: 2 new DBMS topics added.', time: '5 days ago' },
    { id: 3, text: 'You are on a 6-day practice streak.', time: 'Today' },
  ],
};
