/** Whether a problem came from the generator or the bundled set. */
export type ProblemSource = "ai" | "fallback";

export const LANGUAGES = ["javascript", "python"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export type TestCase = {
  /** Positional arguments passed to the solution. */
  args: unknown[];
  expected: unknown;
};

export type Problem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  prompt: string;
  /** Called by the harness. Must match the starter code in both languages. */
  entry: string;
  starters: Record<Language, string>;
  tests: TestCase[];
};

/*
 * Every problem returns a scalar or a fully ordered array, so the harness can
 * compare with plain deep equality. Anything order-ambiguous (grouping,
 * permutations) would need a per-problem comparator and is left out
 * deliberately.
 */
export const PROBLEMS: Problem[] = [
  {
    slug: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    prompt:
      "Given an array of integers and a target, return the indices of the two numbers that add up to the target, in ascending order. Exactly one solution exists.",
    entry: "twoSum",
    starters: {
      javascript: `function twoSum(nums, target) {\n  // return [i, j] with i < j\n}\n`,
      python: `def twoSum(nums, target):\n    # return [i, j] with i < j\n    pass\n`,
    },
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
    ],
  },
  {
    slug: "valid-palindrome",
    title: "Valid Palindrome",
    difficulty: "easy",
    prompt:
      "Return true if the string is a palindrome, considering only alphanumeric characters and ignoring case.",
    entry: "isPalindrome",
    starters: {
      javascript: `function isPalindrome(s) {\n  // return true or false\n}\n`,
      python: `def isPalindrome(s):\n    # return True or False\n    pass\n`,
    },
    tests: [
      { args: ["A man, a plan, a canal: Panama"], expected: true },
      { args: ["race a car"], expected: false },
      { args: [" "], expected: true },
      { args: ["0P"], expected: false },
    ],
  },
  {
    slug: "move-zeroes",
    title: "Move Zeroes",
    difficulty: "easy",
    prompt:
      "Return the array with all zeroes moved to the end, keeping the relative order of the non-zero elements.",
    entry: "moveZeroes",
    starters: {
      javascript: `function moveZeroes(nums) {\n  // return the reordered array\n}\n`,
      python: `def moveZeroes(nums):\n    # return the reordered list\n    pass\n`,
    },
    tests: [
      { args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
      { args: [[0]], expected: [0] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
      { args: [[0, 0, 1]], expected: [1, 0, 0] },
    ],
  },
  {
    slug: "longest-unique-substring",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    prompt:
      "Return the length of the longest substring that contains no repeated characters.",
    entry: "lengthOfLongestSubstring",
    starters: {
      javascript: `function lengthOfLongestSubstring(s) {\n  // return a number\n}\n`,
      python: `def lengthOfLongestSubstring(s):\n    # return an int\n    pass\n`,
    },
    tests: [
      { args: ["abcabcbb"], expected: 3 },
      { args: ["bbbbb"], expected: 1 },
      { args: ["pwwkew"], expected: 3 },
      { args: [""], expected: 0 },
    ],
  },
  {
    slug: "product-except-self",
    title: "Product of Array Except Self",
    difficulty: "medium",
    prompt:
      "Return an array where each element is the product of every other element. Solve it without using division.",
    entry: "productExceptSelf",
    starters: {
      javascript: `function productExceptSelf(nums) {\n  // return an array\n}\n`,
      python: `def productExceptSelf(nums):\n    # return a list\n    pass\n`,
    },
    tests: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
      { args: [[2, 3]], expected: [3, 2] },
    ],
  },
  {
    slug: "merge-intervals",
    title: "Merge Intervals",
    difficulty: "medium",
    prompt:
      "Merge all overlapping intervals and return them sorted by start value.",
    entry: "merge",
    starters: {
      javascript: `function merge(intervals) {\n  // return an array of [start, end]\n}\n`,
      python: `def merge(intervals):\n    # return a list of [start, end]\n    pass\n`,
    },
    tests: [
      {
        args: [
          [
            [1, 3],
            [2, 6],
            [8, 10],
            [15, 18],
          ],
        ],
        expected: [
          [1, 6],
          [8, 10],
          [15, 18],
        ],
      },
      {
        args: [
          [
            [1, 4],
            [4, 5],
          ],
        ],
        expected: [[1, 5]],
      },
      { args: [[[1, 4]]], expected: [[1, 4]] },
    ],
  },
  {
    slug: "trapping-rain-water",
    title: "Trapping Rain Water",
    difficulty: "hard",
    prompt:
      "Given an elevation map where each bar has width 1, return how much water it can trap after raining.",
    entry: "trap",
    starters: {
      javascript: `function trap(height) {\n  // return a number\n}\n`,
      python: `def trap(height):\n    # return an int\n    pass\n`,
    },
    tests: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
      { args: [[]], expected: 0 },
      { args: [[2, 0, 2]], expected: 2 },
    ],
  },
  {
    slug: "median-two-sorted",
    title: "Median of Two Sorted Arrays",
    difficulty: "hard",
    prompt:
      "Return the median of two sorted arrays. Aim for O(log(m+n)) rather than merging them.",
    entry: "findMedianSortedArrays",
    starters: {
      javascript: `function findMedianSortedArrays(a, b) {\n  // return a number\n}\n`,
      python: `def findMedianSortedArrays(a, b):\n    # return a float\n    pass\n`,
    },
    tests: [
      { args: [[1, 3], [2]], expected: 2 },
      {
        args: [
          [1, 2],
          [3, 4],
        ],
        expected: 2.5,
      },
      { args: [[], [1]], expected: 1 },
      { args: [[0, 0], [0, 0]], expected: 0 },
    ],
  },
  {
    slug: "longest-valid-parentheses",
    title: "Longest Valid Parentheses",
    difficulty: "hard",
    prompt:
      "Return the length of the longest substring of well-formed parentheses.",
    entry: "longestValidParentheses",
    starters: {
      javascript: `function longestValidParentheses(s) {\n  // return a number\n}\n`,
      python: `def longestValidParentheses(s):\n    # return an int\n    pass\n`,
    },
    tests: [
      { args: ["(()"], expected: 2 },
      { args: [")()())"], expected: 4 },
      { args: [""], expected: 0 },
      { args: ["()(())"], expected: 6 },
    ],
  },
];

export function problemsByDifficulty(difficulty: Difficulty) {
  return PROBLEMS.filter((problem) => problem.difficulty === difficulty);
}

/**
 * The first problem of a difficulty, deterministically.
 *
 * Initial render must not use `randomProblem` — the server and the client
 * would each roll their own and React would fail to hydrate. Randomisation
 * happens on interaction instead.
 */
export function firstProblem(difficulty: Difficulty) {
  return problemsByDifficulty(difficulty)[0];
}

/** Picks a different problem from the pool where one is available. */
export function randomProblem(difficulty: Difficulty, excludeSlug?: string) {
  const pool = problemsByDifficulty(difficulty);
  const candidates =
    pool.length > 1 ? pool.filter((p) => p.slug !== excludeSlug) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}
