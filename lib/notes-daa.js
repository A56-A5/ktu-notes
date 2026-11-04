// Study notes for PCCST502 Design and Analysis of Algorithms (KTU 2024 Scheme, Semester 5).
// Original summaries written for this notebook, aligned with the official module
// topics. They are ordinary editable notes, not locked content.

const n = (intro, points, exam = '') =>
  `<p>${intro}</p><h3>Key points</h3><ul>${points
    .map((p) => `<li>${p}</li>`)
    .join('')}</ul>${
    exam ? `<blockquote><p><strong>Exam focus.</strong> ${exam}</p></blockquote>` : ''
  }`;

const fig = (src, caption, width = 100) =>
  `<p><img src="/diagrams/daa/${src}" alt="${caption}" data-width="${width}"><br><em>${caption}</em></p>`;

const M1 = {
  'Characteristics of Algorithms': n(
    'An algorithm is a finite, ordered sequence of unambiguous instructions that transforms a set of inputs into the desired output. The word comes from the 9th-century mathematician al-Khwarizmi.',
    [
      '<strong>Finiteness</strong> — it must terminate after a finite number of steps for every valid input.',
      '<strong>Definiteness</strong> — every step must be precisely and unambiguously specified.',
      '<strong>Input</strong> — zero or more inputs, each from a specified set.',
      '<strong>Output</strong> — at least one output that relates to the intended result.',
      '<strong>Effectiveness</strong> — each step must be basic enough to be performed exactly and in finite time with pen and paper.',
      'An algorithm must also be <strong>correct</strong> (delivers the intended output for all valid inputs) and ideally <strong>efficient</strong> in time and space.',
    ],
    'Be able to test a given procedure against the five properties and identify the missing one. "Finite sequence of steps" is the standard two-mark answer.'
  ),
  'Criteria for Analysing Algorithms': n(
    'Analysis judges an algorithm by its use of computational resources independent of any particular machine.',
    [
      'The two resources that matter are <strong>running time</strong> and <strong>memory space</strong>; both are expressed as functions of the input size n.',
      'Time complexity counts the primitive operations executed; space complexity counts the extra memory beyond the input/output.',
      'Correctness, simplicity, generality and readability are secondary criteria that support a good algorithm.',
      'Analysis is done on a <strong>model of computation</strong> (the RAM model), where each primitive operation costs one unit and memory access is uniform.',
      'We compare algorithms by their <strong>growth rates</strong>, not their exact running times, because constants depend on hardware and compiler.',
      'The <strong>algorithm vs program</strong> distinction matters: an algorithm is abstract; a program is one concrete implementation of it in some language.',
    ],
    'Name the two resource measures, the three cases of analysis and the RAM model. State why constants are ignored.'
  ),
  'Time and Space Complexity': n(
    'Complexity measures quantify how the cost of an algorithm grows as the input grows. They let us compare algorithms before writing code.',
    [
      '<strong>Time complexity</strong> T(n) counts the number of basic operations for an input of size n.',
      '<strong>Space complexity</strong> S(n) counts extra memory: the recursion stack, auxiliary arrays and temporary variables.',
      'Total space = fixed part (constants, program code) + variable part (both input-independent and input-dependent structures).',
      'A <strong>trade-off</strong> is common: a bigger table can turn exponential search into constant lookup (space–time trade-off).',
      'Complexity classes: constant < logarithm < linear < n log n < quadratic < cubic < exponential, in increasing growth order.',
      fig('big-o-graph.svg', 'Growth of common complexity functions; n² is an upper-bound band for O(n²).'),
    ],
    'The canonical example of a space–time trade-off is a lookup table: O(n) extra space can replace O(log n) search with O(1).'
  ),
  'Best, Worst and Average Case Complexities': n(
    'The same algorithm can take different amounts of work on different inputs of the same size, so analysis considers three cases.',
    [
      '<strong>Best case</strong> — the minimum work over all inputs of size n; often not representative (e.g., n=1 for searching).',
      '<strong>Worst case</strong> — the maximum work over all inputs of size n; guarantees the upper bound and is the standard basis for exam analysis.',
      '<strong>Average case</strong> — the expected work assuming a probability distribution over inputs; needs a statistical model.',
      'The worst case is used most because it is a guarantee: the algorithm always finishes within that bound.',
      'For sequential search, best, average and worst are on the order of 1, (n+1)/2 and n comparisons respectively.',
    ],
    'Define all three cases, then explain why the worst case is the standard measure: it is the only guarantee for any input.'
  ),
  'Big-O, Omega and Theta Notations': n(
    'Asymptotic notations describe the growth of a function as n → ∞, ignoring constants and lower-order terms. They are the language of algorithm analysis.',
    [
      '<strong>Big-O, O(g(n)):</strong> f(n) ≤ c·g(n) for all n ≥ n₀. An asymptotic <em>upper</em> bound (worst case).',
      '<strong>Big-Omega, Ω(g(n)):</strong> f(n) ≥ c·g(n) for all n ≥ n₀. A lower bound (at least this much work).',
      '<strong>Big-Theta, Θ(g(n)):</strong> c₁·g(n) ≤ f(n) ≤ c₂·g(n). A tight bound — both upper and lower.',
      '<strong>Little-o, o(g(n)):</strong> f(n) &lt; c·g(n) for every c &gt; 0 — strictly smaller growth (n = o(n²)).',
      '<strong>Little-omega, ω(g(n)):</strong> strictly larger growth.',
      'Formal definition of O: ∃ positive constants c and n₀ such that 0 ≤ f(n) ≤ c·g(n) for all n ≥ n₀.',
    ],
    'Write the formal definition with positive constants c and n₀. O is a set of functions; f(n) = O(g(n)) is abuse of notation for f ∈ O(g(n)).'
  ),
  'Properties of Asymptotic Notations': n(
    'Asymptotic notations obey rules of arithmetic and have properties that allow expressions to be simplified.',
    [
      '<strong>Transitivity:</strong> if f = O(g) and g = O(h) then f = O(h); likewise for Ω and Θ.',
      '<strong>Reflexivity:</strong> f = O(f), f = Ω(f) and f = Θ(f).',
      '<strong>Symmetry:</strong> f = Θ(g) if and only if g = Θ(f).',
      '<strong>Transpose symmetry:</strong> f = O(g) if and only if g = Ω(f).',
      'The <strong>highest-order term dominates</strong>: 3n² + 5n + 2 = Θ(n²); constants are dropped.',
      'Products and sums combine: O(f) + O(g) = O(max(f, g)); O(f)·O(g) = O(f·g).',
      'Common orders: O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n²) &lt; O(n³) &lt; O(2ⁿ) &lt; O(n!).',
    ],
    'Prove properties from the definition (choose suitable constants). Know the standard order list for multiple-choice questions.'
  ),
  'Complexity Calculation of Simple Algorithms': n(
    'Counting operations in loops and nested loops gives the complexity of simple code.',
    [
      'A single loop of n iterations has Θ(n) time; two nested loops of n have Θ(n²).',
      'A loop that halves its counter each iteration (i /= 2) runs Θ(log n) times.',
      'Independent consecutive loops add: O(n) + O(n²) = O(n²).',
      'Code with no input-dependent repetition is O(1).',
      'For example: finding the maximum of an array is Θ(n); bubble sort is Θ(n²); binary search is Θ(log n).',
      'Always count the <strong>dominant</strong> term and drop constants — 4n³ + 100n = O(n³).',
    ],
    'Work through a short snippet and count operations per iteration × iterations; then simplify to the dominant term.'
  ),
  'Recurrence Equations': n(
    'A recurrence relates the running time of a recursive algorithm to the running time on smaller inputs.',
    [
      'Example: merge sort gives T(n) = 2T(n/2) + Θ(n), with base case T(1) = Θ(1).',
      'Recurrences describe divide-and-conquer costs: a subproblems of size n/b plus the divide/merge cost f(n).',
      'They are solved by substitution, iteration, recursion trees or the master theorem.',
      'A recurrence is <strong>homogeneous</strong> if all terms depend only on T; a linear recurrence with constant coefficients has a characteristic equation.',
      'Boundary conditions complete the recurrence: T(1) = c for constant-time base cases.',
    ],
    'Write the recurrence from the algorithm structure, then solve it with the master theorem when it fits.'
  ),
  'Iteration Method': n(
    'The iteration method expands the recurrence layer by layer and sums the resulting series.',
    [
      'Expand T(n) = 2T(n/2) + n → 2(2T(n/4) + n/2) + n = 4T(n/4) + 2n → … → 2ᵏT(n/2ᵏ) + kn.',
      'Stop when the argument reaches the base case (n/2ᵏ = 1, so k = log₂n).',
      'Substitute back: n·T(1) + n log₂n = Θ(n log n).',
      'For T(n) = T(n−1) + n the sum becomes 1 + 2 + … + n = Θ(n²).',
      'The method is direct but needs a predictable pattern and a correct stopping condition.',
    ],
    'Show each expansion step, identify k for the base case, then sum the series. State the final Θ bound.'
  ),
  'Recursion Tree Method': n(
    'A recursion tree draws each level of recursive calls and sums the cost per level.',
    [
      'The root holds the cost f(n); its children are the costs of subproblem calls.',
      'Total cost = sum of all node costs across all levels.',
      'Shortcut: cost per level = number of nodes × cost per node; multiply by the number of levels (tree depth).',
      'For merge sort the tree has log₂n levels, each costing n, so the total is Θ(n log n).',
      'For skewed recurrences (e.g. T(n) = T(n/3) + T(2n/3) + n) the tree is unbalanced and the sum must be bounded carefully.',
      fig('recursion-tree.svg', 'Recursion tree for T(n) = 2T(n/2) + n: each level costs n, with log₂n levels.'),
    ],
    'Draw the tree, label the cost per level, sum the levels, and use the geometric-series formula.'
  ),
  'Substitution Method': n(
    'Guess a bound and prove it by induction; the method also verifies the guess.',
    [
      'Example: prove T(n) = 2T(n/2) + n = O(n log n).',
      'Guess T(n) ≤ c·n log n; assume it holds for the smaller arguments n/2.',
      'Substitute: T(n) ≤ 2·c·(n/2)·log(n/2) + n = c·n·log(n/2) + n = c·n log n − c·n + n ≤ c·n log n for c ≥ 1.',
      'Find constants that make the inequality hold, and check the base case.',
      'A wrong guess wastes effort; the method requires a good guess, often from a recursion tree.',
      'For lower bounds, prove Ω similarly with a different constant.',
    ],
    'State the guess, assume the inductive hypothesis for n/2, substitute, and choose constants so the induction completes.'
  ),
  "Master's Theorem (proof not expected)": n(
    'The master theorem solves divide-and-conquer recurrences of the form T(n) = a·T(n/b) + f(n), a ≥ 1, b &gt; 1.',
    [
      'There are three cases based on comparing f(n) with n^(log_b a).',
      '<strong>Case 1:</strong> if f(n) = O(n^(log_b a − ε)) then T(n) = Θ(n^(log_b a)).',
      '<strong>Case 2:</strong> if f(n) = Θ(n^(log_b a)) then T(n) = Θ(n^(log_b a) · log n).',
      '<strong>Case 3:</strong> if f(n) = Ω(n^(log_b a + ε)) and regularity holds (a·f(n/b) ≤ c·f(n) for c &lt; 1) then T(n) = Θ(f(n)).',
      'Example: T(n) = 2T(n/2) + n → a=2, b=2, n^(log₂2)=n, matches case 2 → Θ(n log n).',
      'Practice applies the correct case; the proof is not expected.',
      fig('master-theorem.svg', 'The three cases of the master theorem with worked examples.'),
    ],
    'Compute n^(log_b a) first, compare with f(n), pick the case, and state the bound. Beware recurrences that fall between cases.'
  ),
  'AVL Tree Properties': n(
    'An AVL tree is a self-balancing binary search tree in which the heights of the two child subtrees of every node differ by at most one.',
    [
      'It is named after its inventors Adelson-Velsky and Landis (1962) and is the first self-balancing BST.',
      'The <strong>balance factor</strong> of a node is height(right subtree) − height(left subtree), and is −1, 0 or +1 in a valid AVL tree.',
      'Insertion and deletion may disturb the balance, so the tree re-balances itself with rotations.',
      'The height is bounded by Θ(log n), so search, insert and delete are all O(log n).',
      'A node is <strong>balanced</strong> if its balance factor ∈ {−1, 0, +1}; else it is unbalanced and rotation is required.',
      'AVL trees keep tighter balance than red-black trees but need more rotations.',
    ],
    'Define the balance factor and the AVL invariant. Draw a valid tree and an invalid one with a +2 factor.'
  ),
  'Insertion with Rotations': n(
    'Insertion starts like a normal BST insert, then walks back to the root fixing balance factors and applying rotations.',
    [
      'Four cases can arise at the lowest unbalanced node, chosen by where the new key was inserted.',
      '<strong>LL</strong> (left-left): single <em>right</em> rotation. <strong>RR</strong> (right-right): single <em>left</em> rotation.',
      '<strong>LR</strong> (left-right): left rotation on the left child, then right rotation on the node.',
      '<strong>RL</strong> (right-left): right rotation on the right child, then left rotation on the node.',
      'Each rotation is O(1) and restores the height bound of the whole subtree.',
      'At most one insertion case can be repaired with two rotations (LR/RL); the tree is rebalanced in O(log n) total.',
      fig('avl-rotations.svg', 'RR single left rotation and LR double rotation restoring balance.'),
    ],
    'Identify the case from the position of the inserted key at the lowest unbalanced node, apply the matching rotation(s), and update balance factors.'
  ),
  'Deletion with Rotations': n(
    'Deletion from an AVL tree removes the node as in a BST (two children: replace with successor) then rebalances from the parent up.',
    [
      'After deletion, the parent\'s balance factor may become ±2, requiring rotation.',
      'Unlike insertion, a deletion may need <strong>several</strong> rotations along the path to the root.',
      'The four rotation cases (LL, RR, LR, RL) are the same as for insertion.',
      'If both subtrees of the unbalanced node have equal height, either single or double rotation works.',
      'The deletion plus rebalancing is still O(log n).',
    ],
    'Delete like a BST, then balance upwards using the matching rotation case; mention that multiple rotations may be needed.'
  ),
};

const M2 = {
  'Disjoint Set Operations': n(
    'A disjoint-set (union-find) structure maintains a collection of disjoint dynamic sets, each with a representative element.',
    [
      'The three operations are <strong>MAKE-SET(x)</strong> (create a singleton), <strong>FIND-SET(x)</strong> (return the representative) and <strong>UNION(x, y)</strong> (merge two sets).',
      'Elements are stored as a forest of trees; the root is the representative.',
      'Used in Kruskal\'s MST, connected-component detection and equivalence classes.',
      'SETS appear in the disjoint-set data structure for dynamic connectivity problems.',
      'After a sequence of m operations on n elements the running time is O(m · α(n)), where α is the inverse Ackermann function and grows extremely slowly.',
    ],
    'Define the three operations. α(n) ≤ 4 for all practical n, so the bound is effectively constant.'
  ),
  'Union and Find Algorithms': n(
    'The naive algorithms are simple: FIND walks to the root; UNION links one root under another.',
    [
      'MAKE-SET(x): parent[x] = x; rank[x] = 0.',
      'FIND-SET(x): follow parent pointers until parent[x] = x, then return x.',
      'UNION(x, y): take the roots rx = FIND(x), ry = FIND(y) and set parent[rx] = ry.',
      'The naive version can build tall trees, giving O(n) FIND in the worst case.',
      'Two heuristics fix this: <strong>union by rank</strong> and <strong>path compression</strong>.',
    ],
    'Show the naive arrays and then show why a tall chain makes FIND O(n); the fix is the heuristics in the next topic.'
  ),
  'Union by Rank with Path Compression': n(
    'The two heuristics together give near-constant amortised time.',
    [
      '<strong>Union by rank:</strong> always attach the shorter tree under the taller one, keeping the height O(log n).',
      '<strong>Path compression:</strong> during FIND, repoint every node directly to the root, flattening future finds.',
      'The two optimisations compose; path compression alone gives O(log n) amortised, and both together give O(α(n)).',
      'rank[x] is an upper bound on height and increases only when two equal ranks merge.',
      'This makes the structure effectively constant-time in practice.',
    ],
    'Write the two-heuristic FIND and UNION pseudocode; state the O(α(n)) amortised bound.'
  ),
  'Connected Components of a Graph': n(
    'Union-find computes the connected components of an undirected graph in near-linear time.',
    [
      'Initialise one set per vertex with MAKE-SET.',
      'For every edge (u, v), call UNION(u, v).',
      'Vertices with the same FIND-SET representative are in the same component.',
      'The number of distinct representatives is the number of components.',
      'This approach handles dynamic connectivity as edges are inserted; it is the foundation of Kruskal\'s algorithm.',
    ],
    'Give the algorithm, then the complexity O((V + E) α(V)); doing this before Kruskal is the exam link.'
  ),
  'Graph Representations': n(
    'A graph G = (V, E) can be stored as an adjacency matrix or adjacency list.',
    [
      '<strong>Adjacency matrix:</strong> a |V| × |V| table, entry 1/weight if an edge exists. O(V²) space; O(1) edge test.',
      '<strong>Adjacency list:</strong> an array of lists, one per vertex. O(V + E) space; O(deg) edge scan.',
      'Matrices suit dense graphs and constant-time edge queries; lists suit sparse graphs and traversals.',
      '<strong>Edge list:</strong> a list of pairs, used by Kruskal and Bellman-Ford.',
      'Choice of representation changes the complexity of an algorithm, so report it explicitly.',
    ],
    'Compare the two in space and edge-query cost, and pick the right one per graph density.'
  ),
  'BFS and its Analysis': n(
    'Breadth-first search explores a graph level by level from a source using a queue.',
    [
      'It marks the source discovered, enqueues it, then repeatedly dequeues a vertex and enqueues unvisited neighbours.',
      'BFS computes shortest-path distances in unweighted graphs.',
      'Every vertex is enqueued once and every edge scanned once; total time O(V + E) with adjacency lists.',
      'The queue can hold O(V) vertices, so space is O(V).',
      'BFS also discovers the layers and can produce a BFS tree.',
      fig('bfs-vs-dfs.svg', 'Graph traversal order: BFS visits level by level, DFS dives deep.'),
    ],
    'Write the queue algorithm and mark vertices; state the O(V + E) time and O(V) space bounds.'
  ),
  'DFS and its Analysis': n(
    'Depth-first search goes as deep as possible before backtracking, using a stack or recursion.',
    [
      'DFS marks a discovered vertex, recurses on each unvisited neighbour, then backtracks.',
      'Timestamps (discovery/finish) and colours (white/grey/black) let DFS classify edges.',
      'It detects cycles in directed graphs (a back edge) and finds strongly connected components.',
      'Time is O(V + E); the recursion stack can hold O(V) frames.',
      'DFS is the basis for topological sorting and articulation-point finding.',
    ],
    'Write the recursion with colours; give O(V + E) time, O(V) stack space, and the edge classification.'
  ),
  'Strongly Connected Components': n(
    'A strongly connected component (SCC) is a maximal set of vertices mutually reachable from one another.',
    [
      'Kosaraju\'s algorithm: DFS on G to finish-order the vertices, transpose G, then DFS in reverse finish order; each tree is an SCC.',
      'Tarjan\'s algorithm uses a single DFS with a stack and lowlink values to extract SCCs.',
      'Both run in O(V + E).',
      'Condensing every SCC yields the condensation DAG, used in problems like 2-SAT.',
      'In a DAG every vertex is its own SCC.',
    ],
    'Give the two-pass structure of Kosaraju and the O(V + E) bound; mention the lowlink variant for Tarjan.'
  ),
  'Topological Sorting': n(
    'A topological order linearly orders the vertices of a DAG so that every edge points forward.',
    [
      'Kahn\'s algorithm repeatedly emits a vertex of in-degree zero and removes its outgoing edges.',
      'DFS-based sorting pushes vertices onto a stack in finish order, then reverses it.',
      'Both are O(V + E).',
      'Topological orders exist only for DAGs; a cycle makes them impossible.',
      'Use cases: build dependencies, course prerequisites, task scheduling.',
    ],
    'Give Kahn\'s in-degree algorithm and the bound; note that a nonzero cycle means no order exists.'
  ),
  'Control Abstraction': n(
    'A control abstraction is the generic skeleton of an algorithmic strategy: the fixed control flow of the paradigm with the problem-specific details left as parameters. This same title is used across five paradigms in the syllabus — the shared template is DAndC / Greedy / DP / Backtracking / Branch-and-bound.',
    [
      '<strong>Divide and conquer:</strong> if small(P) solve directly; else divide P into P₁…Pₖ, recurse on each, and combine — recurrences have the form T(n) = a·T(n/b) + g(n).',
      '<strong>Greedy:</strong> iterate over candidates and always take the locally best feasible choice; never backtrack. Requires the greedy-choice property and optimal substructure.',
      '<strong>Dynamic programming:</strong> define the optimum of a subproblem recursively, then fill a table bottom-up (or memoise top-down) to avoid recomputation.',
      '<strong>Backtracking:</strong> depth-first search over a state-space tree, pruning dead branches; needs bounding/pruning rules.',
      '<strong>Branch and bound:</strong> best-first search with a bounding function that discards subtrees whose bound cannot beat the current best.',
      'The abstraction hides the problem-specific divide/combine/choose/prune step, so a single skeleton is reused by many algorithms.',
      fig('greedy-vs-dp-bt.svg', 'Greedy, DP and backtracking compared, with when to use each.'),
    ],
    'Be able to state the pseudo-code skeleton and identify which paradigm a given problem fits, with its feasibility/pruning rule.'
  ),
  'Merge Sort': n(
    'Merge sort splits the array in half, sorts each half recursively, and merges the two sorted halves.',
    [
      'The merge step walks both halves with two pointers and copies the smaller element into the output, in linear time.',
      'Recurrence: T(n) = 2T(n/2) + Θ(n), giving Θ(n log n) by the master theorem.',
      'Merge sort is stable and works well on linked lists and external data.',
      'It needs O(n) auxiliary space — the main drawback.',
      'Best, average and worst cases are all Θ(n log n).',
      fig('merge-sort.svg', 'Merge sort splits to single elements and merges them back in sorted order.'),
    ],
    'Show the split, the merge and the recurrence; state the Θ(n log n) bound and O(n) space.'
  ),
  "Strassen's Matrix Multiplication": n(
    "Strassen's algorithm multiplies n×n matrices using 7 recursive multiplications instead of 8.",
    [
      'The naive algorithm is 8 multiplications + 4 additions per level → Θ(n³).',
      'Strassen forms 7 combination products of submatrices, then combines them to yield the product in 7 multiplications + 18 additions.',
      'Recurrence: T(n) = 7T(n/2) + Θ(n²), giving Θ(n^log₂7) ≈ Θ(n^2.807).',
      'It is asymptotically faster than the naive method but has larger constants and is impractical for small n.',
      'It demonstrates that the exponent of matrix multiplication is below 3.',
    ],
    'Write the 7 products and the recurrence; give the Θ(n^2.807) bound and mention the constant-factor trade-off.'
  ),
  'Analysis of Divide and Conquer Algorithms': n(
    'D&C cost is analysed with a recurrence; the cost per level and the tree depth decide the result.',
    [
      'When the combine cost f(n) is small relative to the subproblem work, the leaves dominate (master theorem case 1).',
      'When f(n) is comparable to the subproblem work, every level costs the same and the total is f(n) × depth (case 2).',
      'When f(n) dominates, the top level dominates (case 3).',
      'Balanced splits minimise depth; unbalanced splits can degrade to O(n²) (e.g. naive quicksort).',
      'Use the master theorem or a recursion tree to bound the recurrence.',
    ],
    'Derive the recurrence from the algorithm, then apply the master theorem with the correct case; never skip the combine cost.'
  ),
};

const M3 = {
  'Fractional Knapsack': n(
    'In the fractional knapsack, items can be split; maximise value for a fixed capacity.',
    [
      'Compute each item\'s value/weight ratio and sort in descending order.',
      'Take whole items while they fit; split the last item by the remaining capacity.',
      'The greedy choice is safe because taking the highest ratio never wastes capacity.',
      'Time is O(n log n) for the sort.',
      'This differs from 0/1 knapsack (DP) because splitting is allowed.',
    ],
    'Give the ratio sort, the fill procedure and the O(n log n) bound; explain why the greedy choice is optimal.'
  ),
  "Minimum Cost Spanning Tree — Kruskal's": n(
    "Kruskal's algorithm builds an MST by adding the cheapest safe edges.",
    [
      'Sort the edges by weight.',
      'Scan edges, adding one only if it joins two different components (checked with union-find).',
      'Stop after n − 1 edges.',
      'Sorting costs O(E log E); the union-find operations cost O(E α(V)).',
      'The cut property proves the cheapest light edge is always safe.',
    ],
    'Write the edge sort and the union-find feasibility check; the cut property justifies it.'
  ),
  "Minimum Cost Spanning Tree — Prim's": n(
    "Prim's algorithm grows an MST from one vertex, always adding the cheapest edge to the growing tree.",
    [
      'Start from an arbitrary vertex; maintain a key = cheapest known edge cost to the tree.',
      'Extract the minimum-key vertex with a priority queue, then relax its edges.',
      'Costs O(V²) with arrays, O(E log V) with a binary heap.',
      'It works best on dense graphs; Kruskal suits sparse ones.',
      'Prim\'s algorithm grows a connected subtree, unlike Kruskal\'s forest-of-components.',
    ],
    'Give the priority-queue version, its O(E log V) bound and the cut-property justification.'
  ),
  "Shortest Path — Dijkstra's Algorithm": n(
    "Dijkstra's algorithm finds single-source shortest paths for graphs with non-negative weights.",
    [
      'Maintain finalised distances; repeatedly extract the closest unvisited vertex and relax its edges.',
      'dist[v] = min(dist[v], dist[u] + w(u,v)) for each neighbour.',
      'O(V²) with an array; O((V+E) log V) with a binary heap.',
      'It fails with negative weights (use Bellman-Ford there).',
      fig('dijkstra.svg', "Example graph for Dijkstra's algorithm with the relaxation step."),
    ],
    'Write the relaxation loop and the complexity; why negative edges break it is the key caveat.'
  ),
  'Optimality Principle': n(
    'The principle of optimality states that an optimal solution contains optimal solutions to its subproblems.',
    [
      'If a globally optimal solution used a suboptimal subsolution, replacing that subsolution would improve the whole — a contradiction.',
      'It is the property that makes dynamic programming valid; without it a table of subanswers is useless.',
      'It is proved per problem by an exchange/contradiction argument.',
      'Greedy algorithms also need a stronger version (the greedy-choice property) to be correct.',
    ],
    'State the principle, then prove it for the given problem with the contradiction argument; link it to why DP works.'
  ),
  'Matrix Chain Multiplication': n(
    'Matrix chain multiplication chooses the parenthesisation that minimises scalar multiplications.',
    [
      'For a chain A₁A₂…Aₙ with dimensions p₀×p₁, …, the cost of multiplying a p×q by q×r matrix is p·q·r.',
      'Let m[i,j] be the minimum cost for the subchain Aᵢ…Aⱼ; try every split k and take the cheapest.',
      'Recurrence: m[i,j] = min over i ≤ k &lt; j of m[i,k] + m[k+1,j] + pᵢ₋₁·pₖ·pⱼ, with m[i,i] = 0.',
      'Filling by increasing chain length keeps every subproblem ready; time is Θ(n³), space Θ(n²).',
      'The choice of parenthesisation changes the cost hugely (e.g. 2000 vs 20,000 operations for the same product).',
    ],
    'Write the recurrence and the table order, and give Θ(n³) time and Θ(n²) space; the trick is choosing the split.'
  ),
  'All Pairs Shortest Path — Floyd-Warshall': n(
    'Floyd-Warshall computes shortest paths between every pair of vertices in Θ(n³).',
    [
      'Keep a distance matrix D; initialise edge weights and 0 on the diagonal.',
      'For each intermediate vertex k, update D[i,j] = min(D[i,j], D[i,k] + D[k,j]).',
      'The optimality principle guarantees that the shortest path through k is built from shortest subpaths.',
      'It handles negative edges (but not negative cycles).',
      'Time Θ(n³), space Θ(n²); no better asymptotically-comparable algorithm for dense graphs.',
    ],
    'Write the three nested loops and the update rule; give the Θ(n³)/Θ(n²) bounds and the negative-cycle caveat.'
  ),
  'N-Queens Problem': n(
    'Place N non-attacking queens on an N×N board — no two share a row, column or diagonal.',
    [
      'Solve column by column (or row by row) with one queen per column.',
      'At each step, place a queen in the first column that does not attack an earlier queen.',
      'When no column is safe, backtrack to the previous column and try its next row.',
      'Prune with three checks: the column, the main diagonal (r+c) and the anti-diagonal (r−c).',
      'The state-space tree has up to N! leaves but pruning keeps it tractable for small N.',
      fig('n-queens.svg', 'State-space tree for the 4-queens problem; red ✗ branches are pruned by attacks.'),
    ],
    'Write the recursive place(col) with the three pruning checks and the backtracking; count nodes not copies.'
  ),
};

const M4 = {
  'Travelling Salesman Problem': n(
    'The travelling salesman problem (TSP) asks for the shortest tour visiting every city exactly once and returning to the start.',
    [
      'It is NP-hard; exhaustive search is Θ(n!).',
      'A branch-and-bound solution keeps a cost matrix, a current path and a lower bound on the cost to finish.',
      'The root holds all cities; each node adds one city, and children that exceed the best-known bound are pruned.',
      'A good bound (e.g. the sum of two smallest edges per city) makes pruning effective.',
      'The first complete tour sets an upper bound; later branches are pruned against it.',
    ],
    'State the problem, the bounding function and why pruning reduces the search; it is exponential in the worst case.'
  ),
  'Algorithm for TSP using Branch and Bound': n(
    'The branch-and-bound TSP algorithm reduces the search by computing reduced cost matrices and pruning.',
    [
      'Reduce each row and column by subtracting its minimum to obtain a lower bound.',
      'Branch on every edge (i,j) with a reduced cost of 0 in the current node.',
      'Add the reduction constants to the lower bound; prune any node whose bound ≥ the best tour found.',
      'Stop when a leaf gives a complete tour; that tour is optimal if all other nodes are pruned.',
      'The bound grows monotonically down a branch, so pruning is safe.',
    ],
    'Show row/column reduction, the bound update and the prune condition; the algorithm returns the optimal tour.'
  ),
  'Tractable and Intractable Problems': n(
    'Tractable problems have polynomial-time algorithms; intractable ones (believed) need super-polynomial time.',
    [
      'Polynomial algorithms — O(n^k) — are tractable for reasonable k.',
      'Problems with only exponential algorithms (e.g. TSP, SAT) are intractable in the practical sense.',
      'NP-hardness is the accepted evidence of intractability; no polynomial algorithm is known.',
      'Approximation and randomised algorithms are used to cope with intractability.',
      'Note that P vs NP is unsolved; intractability is a belief, not a proven impossibility today.',
    ],
    'Define tractability by polynomial time, name intractable examples and note the P vs NP open question.'
  ),
  'Class P': n(
    'The class P contains decision problems solvable by a deterministic Turing machine in polynomial time.',
    [
      'Examples: sorting, shortest path, connectivity, primality (AKS), 2-SAT.',
      'P problems are the tractable core of complexity theory.',
      'P ⊆ NP because a deterministic polynomial algorithm is also a verifier.',
      'P is closed under complement, union and composition.',
      'Whether P = NP is the central open question.',
    ],
    'Define P, give tractable examples and state P ⊆ NP; the P vs NP question is the key point.'
  ),
  'Class NP': n(
    'NP is the class of decision problems for which a YES answer has a polynomial-time verifiable certificate.',
    [
      'The certificate is a witness the verifier checks; NO answers need not have short witnesses.',
      'Every P problem is in NP (the algorithm is its own verifier).',
      'Examples: SAT, Hamiltonian cycle, subset sum, graph 3-colouring.',
      'NP is not “non-polynomial” — it stands for nondeterministic polynomial, and is defined via verifiers or nondeterministic machines.',
      'NP is closed under union, intersection and composition, but not under complement (co-NP).',
    ],
    'Define NP via a polynomial-time verifier and certificate, give examples, and note P ⊆ NP.'
  ),
  'NP-Hard and NP-Complete Classes': n(
    'A problem is NP-hard if every NP problem polynomially reduces to it; NP-complete problems are NP-hard and in NP.',
    [
      'Reduction: A ≤ₚ B means A is solved by translating to B in polynomial time; this transfers hardness.',
      'SAT (Cook\'s theorem) is the first NP-complete problem and the root of all NP-completeness proofs.',
      'Clique, vertex cover, Hamiltonian cycle and TSP (decision form) are all NP-complete/NP-hard.',
      'NP-complete problems are the hardest in NP; a polynomial algorithm for any one solves all of NP.',
      'NP-hard problems need not be in NP (e.g. TSP optimisation, halting problem).',
      fig('complexity-classes.svg', 'P, NP, NP-hard and NP-complete relations.'),
    ],
    'Define NP-hard and NP-complete, then the two-part reduction proof: show membership in NP and reduce a known NP-complete problem to it.'
  ),
  'Clique Problem': n(
    'CLIQUE asks whether a graph has a complete subgraph of size k.',
    [
      'CLIQUE is in NP: a certificate is the k vertices, checked for all C(k,2) edges.',
      'It is NP-complete by reduction from VERTEX COVER (or 3-SAT).',
      'Given an instance (G, k), build the complement graph Ḡ; a size-(n−k) clique in Ḡ is a size-k vertex cover in G.',
      'Maximum clique is the optimisation variant (NP-hard).',
      'A polynomial algorithm for clique implies P = NP.',
    ],
    'Prove both parts: the certificate for membership, then the reduction (usually from vertex cover).'
  ),
  'Vertex Cover Problem': n(
    'VERTEX COVER asks whether a graph has a vertex cover of size k — a set of vertices touching every edge.',
    [
      'It is in NP: the certificate is the cover set, checked to touch every edge.',
      'It is NP-complete; the standard reduction is from CLIQUE in the complement graph.',
      'If (G, n−k) has a vertex cover, then G has a clique of size k.',
      'The optimisation variant is NP-hard and has a 2-approximation: take both endpoints of a maximal matching.',
      'Vertex cover admits fixed-parameter tractable algorithms in the parameter k.',
    ],
    'Give the reduction from clique and the matching-based 2-approximation; both parts of NP-completeness are needed.'
  ),
  'Approximation Algorithms — Bin Packing': n(
    'Bin packing packs items of given sizes into the fewest bins of fixed capacity.',
    [
      'It is NP-hard, so approximation algorithms bound the ratio to the optimum instead.',
      'First-fit decreasing (FFD): sort descending, place each item in the first bin that fits.',
      'FFD uses at most 11/9 · OPT + 1 bins; the additive +1 is unavoidable.',
      'First-fit uses at most ⌈17/10 · OPT⌉ bins; next-fit up to 2·OPT.',
      'The lower bound for any deterministic online algorithm is 1.54× the optimum.',
    ],
    'State the approximation ratio and the greedy order; FFD is the standard near-3/2 example.'
  ),
  'Monte Carlo and Las Vegas Algorithms': n(
    'Randomised algorithms use random choices to gain speed or simplicity.',
    [
      '<strong>Monte Carlo:</strong> always fast, but may err with some (small) probability — e.g. Miller-Rabin primality.',
      '<strong>Las Vegas:</strong> always correct, but the running time is random — e.g. randomised quicksort.',
      'Monte Carlo error is bounded: one-sided algorithms never say YES incorrectly or never say NO incorrectly.',
      'Las Vegas algorithms can be made Monte Carlo by early termination with a possible wrong answer.',
      'Both are analysed by expected running time or error probability, not worst-case time.',
    ],
    'Contrast them by “fast but maybe wrong” vs “always right but maybe slow”, with one example each.'
  ),
  'Randomized Quick Sort with Analysis': n(
    'Randomised quicksort picks the pivot uniformly at random, defeating adversarial O(n²) inputs.',
    [
      'Each pivot is equally likely to be any element, so no input is consistently worst-case.',
      'Expected running time is O(n log n); the worst case O(n²) still exists but has small probability.',
      'Analysis counts expected comparisons over random pivot choices using indicator random variables.',
      'The expected number of comparisons is 2(n ln n) + O(n) = O(n log n).',
      'It is a Las Vegas algorithm — always correct, random time.',
    ],
    'Give the random-pivot rule, the O(n log n) expected bound and the indicator-variable analysis outline.'
  ),
};

export const DAA_NOTES = { ...M1, ...M2, ...M3, ...M4 };
