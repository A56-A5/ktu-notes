// Study notes for PCCDT503 Data Analytics (KTU 2024 Scheme, Semester 5).
// Original summaries written for this notebook, aligned with the official
// module topics. They are ordinary editable notes, not locked content.

const n = (intro, points, exam = '') =>
  `<p>${intro}</p><h3>Key points</h3><ul>${points
    .map((p) => `<li>${p}</li>`)
    .join('')}</ul>${
    exam ? `<blockquote><p><strong>Exam focus.</strong> ${exam}</p></blockquote>` : ''
  }`;

const fig = (src, caption, width = 100) =>
  `<p><img src="/diagrams/da/${src}" alt="${caption}" data-width="${width}"><br><em>${caption}</em></p>`;

const M1 = {
  'Analytics Process Model': n(
    'An analytics process model defines the stages that turn raw data into decisions, usually as a repeatable cycle.',
    [
      'Typical stages: <strong>business understanding → data understanding → data preparation → modelling → evaluation → deployment</strong>.',
      'The CRISP-DM model is the best-known standard and is explicitly iterative — you go back when evaluation fails.',
      'Analytics divides into <strong>descriptive</strong> (what happened), <strong>diagnostic</strong> (why), <strong>predictive</strong> (what will happen) and <strong>prescriptive</strong> (what to do).',
      'Each stage has inputs and outputs; the process documents who does what and how quality is checked.',
      'A clear process prevents garbage-in-garbage-out and makes results reproducible.',
    ],
    'List the CRISP-DM stages in order and say why the loop back to earlier stages matters.'
  ),
  'Analytical Model Requirements': n(
    'Before building a model you must specify what the model must satisfy.',
    [
      '<strong>Problem definition</strong> — a precise, measurable question (classification, prediction, clustering, association).',
      '<strong>Data requirements</strong> — which variables, granularity, coverage and quality are needed.',
      '<strong>Performance criteria</strong> — accuracy, precision/recall, interpretability, latency, cost of errors.',
      '<strong>Constraints</strong> — privacy, ethics, regulation, hardware, and the deployment environment.',
      '<strong>Validation plan</strong> — train/test split, cross-validation and the baseline to beat.',
      'Clear requirements drive the choice of algorithm and the acceptance tests.',
    ],
    'Name the four requirement groups (problem, data, criteria, constraints) and one validation plan element.'
  ),
  'Data Analytics Life Cycle Overview': n(
    'The life cycle organises an analytics project from problem framing to ongoing operation.',
    [
      'The EMC data analytics life cycle has six phases: <strong>discovery, data preparation, model planning, model building, communicating results, operationalisation</strong>.',
      'Discovery frames the business question and identifies the data sources.',
      'Data preparation cleans and integrates the data; model planning picks the analytical approach.',
      'Model building trains and tests; communicating turns results into insight; operationalising deploys into production.',
      'It is iterative — evaluation feeds back to earlier phases.',
      fig('lifecycle.svg', 'The six-phase EMC data analytics life cycle, an iterative cycle.'),
    ],
    'Name the six phases in order and explain the feedback loops between them.'
  ),
  'Probability Calculus and Probability Distributions': n(
    'Probability quantifies uncertainty and is the foundation of inference used throughout analytics.',
    [
      '<strong>Sample space</strong> S is the set of all outcomes; an <strong>event</strong> is a subset of S.',
      'Axioms: P(A) ≥ 0, P(S) = 1, and disjoint events add (P(A∪B) = P(A) + P(B) when A∩B = ∅).',
      '<strong>Conditional probability</strong> P(A|B) = P(A∩B)/P(B); independence means P(A∩B) = P(A)P(B).',
      '<strong>Bayes\' theorem</strong> P(A|B) = P(B|A)P(A)/P(B) — the engine of classification and inference.',
      'A <strong>random variable</strong> maps outcomes to numbers; its <strong>distribution</strong> describes its probabilities.',
      'Discrete distributions: Bernoulli, Binomial, Poisson. Continuous: Normal (Gaussian), Uniform, Exponential.',
      'Key summaries: expectation E[X] and variance Var(X).',
    ],
    'State the axioms, Bayes\' theorem and the mean/variance of Normal and Binomial. One worked conditional-probability problem is typical.'
  ),
  'Hypothesis Testing — Basic Definitions': n(
    'Hypothesis testing is a formal procedure to decide whether data supports a claim.',
    [
      'The <strong>null hypothesis H₀</strong> is the default assumption (e.g. no effect); the <strong>alternative H₁</strong> is the claim under test.',
      'A <strong>test statistic</strong> summarises the data; its distribution under H₀ decides the outcome.',
      'The <strong>p-value</strong> is the probability of seeing a statistic at least as extreme as observed, assuming H₀ is true.',
      'If p-value ≤ α (significance level, often 0.05) we <strong>reject H₀</strong>; otherwise we fail to reject.',
      '<strong>Type I error</strong> = rejecting a true H₀; <strong>Type II error</strong> = failing to reject a false H₀. Power = 1 − Type II error.',
      'Common tests: z-test, t-test, chi-square, ANOVA.',
    ],
    'Define H₀/H₁, p-value, α, and the two error types with one sentence each; "reject if p ≤ α".'
  ),
  'Data Objects and Attribute Types': n(
    'A data object (record, point, sample) is described by attributes; the attribute type dictates which operations are valid.',
    [
      '<strong>Nominal:</strong> categories with no order (colour, city). Only equality works; mode is the central measure.',
      '<strong>Ordinal:</strong> ordered categories (rank, size). Comparison works; median is appropriate.',
      '<strong>Interval:</strong> ordered with meaningful differences but no true zero (temperature °C). Mean works.',
      '<strong>Ratio:</strong> interval with a true zero (height, age, income). Ratios are meaningful.',
      'Discrete vs continuous describes the value set; mixed-type objects combine several attribute types.',
      'Operations allowed: nominal = =, ordinal = + ordering, interval = + −, ratio = + − × ÷.',
    ],
    'Classify attributes into the four types and state which statistics each supports; map an example dataset.'
  ),
  'Dissimilarity and Similarity Measures': n(
    'Proximity between objects underpins clustering and nearest-neighbour methods.',
    [
      '<strong>Dissimilarity</strong> d is small when objects are alike; <strong>similarity</strong> s is its inverse (often s = 1 − d).',
      'For numeric attributes: Euclidean distance (sum of squared differences, square root), Manhattan (sum of absolute differences).',
      'Minkowski distance generalises both with a parameter p.',
      'For binary attributes, the Jaccard coefficient s = (number of matches in both 1s) / (size of union).',
      'Cosine similarity measures the angle between vectors — popular in text.',
      'Distance must be <strong>normalised</strong> when attributes have different scales.',
    ],
    'Write Euclidean and Manhattan formulas, the Jaccard formula and cosine similarity; normalisation is the key practical point.'
  ),
  'Central Tendency and Dispersion': n(
    'Central tendency summarises the "middle" of data; dispersion measures how spread out it is.',
    [
      '<strong>Mean</strong> = average; <strong>median</strong> = middle value; <strong>mode</strong> = most frequent value.',
      'The mean is sensitive to outliers; the median is robust and preferred for skewed data.',
      '<strong>Range</strong> = max − min; it uses only two values and is unstable.',
      '<strong>Variance</strong> = average squared deviation from the mean; <strong>standard deviation</strong> is its square root, in the data\'s units.',
      'Dispersion tells us how reliable the central value is — small spread means a representative centre.',
    ],
    'Define mean/median/mode and variance/SD; explain why median beats mean for skewed distributions.'
  ),
  'Range, Quartiles, Variance and Standard Deviation': n(
    'These are the standard numeric summaries for one variable.',
    [
      'Range = max − min, the crudest spread measure.',
      'Quartiles split the ordered data into four parts: Q1 (25%), Q2 = median (50%), Q3 (75%).',
      'Variance σ² = Σ(xᵢ − μ)²/n (population) or /(n−1) (sample), giving an unbiased estimate.',
      'Standard deviation σ = √variance, expressed in the original units.',
      'The mean and SD characterise a Normal distribution completely (μ, σ).',
    ],
    'Compute range, Q1/Q3, variance and SD from a small dataset; note sample vs population denominator.'
  ),
  'Interquartile Range': n(
    'The interquartile range measures the spread of the middle 50% of the data.',
    [
      'IQR = Q3 − Q1, the difference between the third and first quartiles.',
      'It is robust to outliers because it ignores the extreme 25% on each side.',
      'The 1.5×IQR rule flags outliers: values below Q1 − 1.5·IQR or above Q3 + 1.5·IQR.',
      'Box plots visualise the five-number summary (min, Q1, median, Q3, max) with IQR as the box.',
      'Use IQR over range when data has outliers or is skewed.',
    ],
    'Define IQR and the 1.5×IQR outlier rule; draw a box plot for a small dataset.'
  ),
};

const M2 = {
  'Summarising the Distribution of Two Discrete Variables': n(
    'When two discrete variables are observed together, their joint distribution summarises how often each pair occurs.',
    [
      'A pair (X, Y) is recorded for every observation; the table of counts is the joint frequency distribution.',
      'Row and column totals give the marginal distributions of each variable.',
      'Conditional distributions fix one variable and describe the other within that group.',
      'Comparison of the joint and marginal distributions reveals association.',
      'Bivariate summaries are the first step before any association measure or test.',
    ],
    'Build the joint table and derive marginals and one conditional profile; the comparison shows association.'
  ),
  'Contingency Tables for Discrete Data': n(
    'A contingency table cross-tabulates two categorical variables, with counts in each cell.',
    [
      'Rows are the categories of one variable and columns the categories of the other.',
      'Independence means the cell frequencies equal row total × column total / grand total.',
      'The chi-square statistic χ² = Σ (observed − expected)² / expected tests independence.',
      'Cramér\'s V and the phi coefficient measure the strength of association.',
      'Yates\' correction improves the chi-square approximation for 2×2 tables.',
    ],
    'Build the table, compute expected values and the chi-square statistic; give Cramér\'s V as a strength measure.'
  ),
  'Joint, Marginal and Conditional Frequency Distributions': n(
    'These three views describe bivariate data at different levels of detail.',
    [
      '<strong>Joint:</strong> frequency of each (x, y) combination.',
      '<strong>Marginal:</strong> frequency of x alone (row total) or y alone (column total).',
      '<strong>Conditional:</strong> distribution of y given a fixed x — column frequencies divided by the column total.',
      'Independence holds when every conditional distribution equals the marginal distribution.',
      'Conditional probabilities are P(Y|X) = P(X,Y)/P(X).',
    ],
    'Define all three and show how to derive conditional from joint; state the independence relation.'
  ),
  'Graphical Representation of Two Nominal or Ordinal Variables': n(
    'Plots for categorical pairs show how the categories co-occur.',
    [
      '<strong>Grouped bar chart:</strong> bars of y categories side by side within each x category.',
      '<strong>Stacked bar chart:</strong> segments of y stacked to 100% within each x category — good for conditional profiles.',
      '<strong>Mosaic plot:</strong> tile areas proportional to cell frequencies; independence shows equal-height bands.',
      'Label axes, legends and totals so counts are unambiguous.',
      'The best plot depends on whether you compare marginals (grouped) or conditional composition (stacked/mosaic).',
    ],
    'Match each plot to a comparison goal; a mosaic plot is the classic association visual.'
  ),
  'Measures of Association for Two Discrete Variables': n(
    'Association measures quantify how strongly two categorical variables are related.',
    [
      '<strong>Chi-square χ²</strong> tests whether the observed association is significant.',
      '<strong>Phi coefficient</strong> is a 2×2 association measure normalised to [0,1] in magnitude (or signed).',
      '<strong>Cramér\'s V</strong> generalises phi to larger tables, V = √(χ²/(n·(min(r,c)−1))).',
      '<strong>Odds ratio</strong> compares the odds of an outcome in two groups (2×2 tables).',
      'Report the measure with its confidence interval, not just a p-value.',
    ],
    'Compute chi-square, then Cramér\'s V for effect size; state that χ² grows with n so V is needed.'
  ),
  'Association Between Ordinal and Continuous Variables': n(
    'When one variable is ordinal and the other continuous, rank-based measures are used.',
    [
      'Spearman\'s rank correlation ρ measures monotonic association between ranks.',
      'Kendall\'s tau τ compares concordant and discordant pairs.',
      'Pearson correlation is for two continuous/interval variables and measures linear association.',
      'Rank measures are robust to outliers and nonlinear monotone relationships.',
      'Correlation does not imply causation; check for confounders.',
    ],
    'Choose Spearman τ/ρ for ordinal-vs-continuous; give the formula and the 0.3/0.5/0.7 strength guide.'
  ),
  'Visualisation of Variables from Different Scales': n(
    'Mixed-scale variables need plots that respect each type.',
    [
      'Continuous variables: histograms, box plots, scatterplots, density plots.',
      'Nominal variables: bar charts, pie charts, mosaic plots.',
      'Ordinal variables: ordered bars, stacked bars.',
      'For mixed pairs use colour/shape for categories on a scatterplot, or a grouped bar.',
      'Always normalise or standardise before plotting mixed scales.',
    ],
    'Match each scale to a valid plot and standardise when mixing; a scatterplot with colour is the standard mixed plot.'
  ),
  'Cleaning': n(
    'Data cleaning detects and repairs quality problems.',
    [
      '<strong>Missing values:</strong> delete records/attributes, or impute (mean, median, mode, regression).',
      '<strong>Noise:</strong> smooth with binning, regression or clustering; remove outliers.',
      '<strong>Inconsistencies:</strong> standardise units, formats, codes and names.',
      '<strong>Duplicates:</strong> de-duplicate on a key or similarity.',
      'Document every cleaning step because it changes the data and the results.',
    ],
    'List imputation, smoothing and de-duplication methods; state that cleaning must be documented.'
  ),
  'Integration': n(
    'Integration combines data from multiple sources into one consistent store.',
    [
      'Schema integration reconciles differing entities, attributes and units.',
      'Entity identification matches the same real-world entity across sources.',
      'Redundancy is detected and removed (correlation between attributes, derived values).',
      'Conflicts in values, units and scales are resolved by rules.',
      'ETL pipelines perform integration in the warehouse.',
    ],
    'Name entity identification, redundancy removal and conflict resolution; a common integration example is merging customer records.'
  ),
  'Reduction': n(
    'Data reduction shrinks the data volume while preserving the useful structure.',
    [
      '<strong>Dimensionality reduction:</strong> feature selection, PCA/singular-value decomposition.',
      '<strong>Numerosity reduction:</strong> sampling, aggregation, histograms, clustering.',
      'Lossless vs lossy: lossless keeps all information, lossy discards some.',
      'Reduction speeds training and reduces overfitting.',
      'Validate that reduced data keeps the required accuracy.',
    ],
    'Distinguish feature and numerosity reduction and lossless vs lossy; validate accuracy after reduction.'
  ),
  'Transformation': n(
    'Transformation converts data into a form suitable for mining.',
    [
      '<strong>Smoothing:</strong> reduce noise.',
      '<strong>Normalisation:</strong> min-max to [0,1] or z-score to mean 0, SD 1.',
      '<strong>Discretisation:</strong> bin continuous values into intervals.',
      '<strong>Attribute construction:</strong> derive new attributes (ratios, sums).',
      '<strong>Concept hierarchies:</strong> map values to higher-level concepts.',
    ],
    'List the five transforms; min-max and z-score formulas are standard exam items.'
  ),
  'Discretization': n(
    'Discretisation turns continuous attributes into discrete intervals.',
    [
      '<strong>Equal-width</strong> bins divide the range into equal sizes.',
      '<strong>Equal-frequency</strong> bins put the same count in each bin.',
      '<strong>Entropy-based</strong> (cluster) bins split where class purity improves.',
      'Discretisation enables rule mining and reduces noise.',
      'Too many bins overfit; too few lose information.',
    ],
    'Compare equal-width, equal-frequency and entropy-based binning and their trade-offs.'
  ),
  'Associations and Correlations': n(
    'Association rules find items that co-occur; correlation measures linear dependence.',
    [
      'A rule X → Y has <strong>support</strong> = frequency of X∪Y and <strong>confidence</strong> = support(X∪Y)/support(X).',
      'Correlation r measures linear association between numeric variables.',
      'Association is symmetric; rules are directional.',
      'High support/confidence rules still need a lift check (lift > 1 beats chance).',
      'Apriori/FP-growth mine rules efficiently.',
    ],
    'Define support, confidence and lift, and explain why correlation differs from association.'
  ),
  'Apriori Algorithm': n(
    'Apriori mines frequent itemsets level by level using the anti-monotone property.',
    [
      'First find frequent 1-itemsets, then generate/filter k-itemsets from frequent (k−1)-itemsets.',
      'Anti-monotone rule: if an itemset is infrequent, all its supersets are infrequent (prune).',
      'Support(X∪Y) is the fraction of transactions containing both.',
      'The Apriori property keeps the candidate generation tractable.',
      'Finally derive rules meeting min support and min confidence.',
    ],
    'Write the join/prune steps and the Apriori property; state the support/confidence thresholds.'
  ),
};

const M3 = {
  'General Approach to Classification': n(
    'Classification learns a model from labelled training data and predicts labels for new records.',
    [
      'Two phases: <strong>learning</strong> (build the model) and <strong>classification</strong> (apply it).',
      'Algorithms: decision trees, Naive Bayes, k-NN, neural networks, SVM.',
      'Evaluation: accuracy, precision, recall, F1, ROC-AUC, on a held-out test set.',
      'The overfitting trap: a model too fitted to training does poorly on new data — use validation.',
      'Classification is supervised; clustering is unsupervised.',
    ],
    'Give the two phases, name three algorithms and evaluation metrics, and note the overfitting risk.'
  ),
  'ID3': n(
    'ID3 builds a decision tree by greedily choosing, at each node, the attribute with the highest information gain.',
    [
      'Information gain = entropy(parent) − weighted average entropy(children).',
      'Entropy H(S) = −Σ pᵢ log₂ pᵢ measures impurity.',
      'The attribute with maximum gain becomes the node; recurse on each value.',
      'ID3 handles nominal attributes and splits multi-way; it can overfit without pruning.',
      'ID3 does not handle continuous attributes or missing values natively.',
    ],
    'Write entropy and gain; show the split with the highest gain; know C4.5 adds pruning and continuous handling.'
  ),
  'Attribute Selection Measures': n(
    'Attribute selection decides which attribute best splits the data.',
    [
      '<strong>Information gain</strong> favours attributes with many values (ID3).',
      '<strong>Gain ratio</strong> corrects gain by the split information (C4.5).',
      '<strong>Gini index</strong> = 1 − Σ pᵢ² measures impurity; split maximises the Gini gain (CART).',
      '<strong>Chi-square</strong> and correlation are other measures.',
      'Gain ratio and Gini avoid the many-value bias of plain gain.',
    ],
    'Write gain ratio and Gini formulas and state why plain information gain needs correction.'
  ),
  'Naive Bayesian Classification': n(
    'Naive Bayes applies Bayes\' theorem with the assumption that attributes are conditionally independent given the class.',
    [
      'P(c|x) ∝ P(c) · Π P(xᵢ|c) selects the class with the larger posterior.',
      'The independence assumption is often violated yet Naive Bayes still works well.',
      'Laplace smoothing adds 1 to counts to avoid zero probabilities.',
      'It is very fast and handles high-dimensional data (text).',
      'Training estimates the class priors and the attribute-conditioned likelihoods.',
    ],
    'Write the Bayes decision rule, the independence assumption, and Laplace smoothing; note the assumption\'s violation.'
  ),
  'K-Means': n(
    'K-means partitions n points into k clusters, minimising the within-cluster sum of squares.',
    [
      'Initialise k centroids; repeat: assign each point to the nearest centroid, move each centroid to its points\' mean; stop when stable.',
      'The assignment step and update step both reduce WCSS monotonically, converging to a local optimum.',
      'It needs k in advance; it is sensitive to initialisation (k-means++) and to outliers.',
      'The algorithm assumes convex, similar-sized clusters.',
      'Complexity is O(n · k · iterations · d).',
      fig('kmeans.svg', 'k-means assignment and centroid-update iterations.'),
    ],
    'Write both steps, the WCSS objective and the k/initialisation caveats; give the complexity.'
  ),
  'Agglomerative versus Divisive Hierarchical Clustering': n(
    'Hierarchical clustering builds a dendrogram, either bottom-up or top-down.',
    [
      '<strong>Agglomerative:</strong> start with each point as a cluster and merge the closest pair until one cluster.',
      '<strong>Divisive:</strong> start with one cluster and split by the largest distance.',
      'Linkage defines cluster distance: single, complete, average, centroid.',
      'Cutting the dendrogram at a height gives a chosen number of clusters.',
      'No k needed, but O(n²)–O(n³) cost and merges are irreversible.',
      fig('hierarchical.svg', 'Agglomerative and divisive dendrograms.'),
    ],
    'Contrast bottom-up vs top-down and name the linkage methods; the cut height sets the cluster count.'
  ),
  'BIRCH': n(
    'BIRCH (Balanced Iterative Reducing and Clustering using Hierarchies) clusters large datasets in one scan using a CF-tree.',
    [
      'A Cluster Feature (CF) = (N, LS, SS): count, linear sum and squared sum of points.',
      'The CF-tree stores clusters as CF nodes with a branching factor and threshold.',
      'BIRCH builds the tree, then clusters the CF entries (e.g. with k-means).',
      'It handles noise and outliers and scales to large data, but assumes spherical clusters.',
      'It is approximate and order-sensitive.',
    ],
    'Define CF, the CF-tree and the two phases; note the spherical-cluster assumption.'
  ),
  'DBSCAN': n(
    'DBSCAN finds dense clusters separated by sparse regions, labelling isolated points as noise.',
    [
      'Parameters: ε (neighbourhood radius) and MinPts (minimum neighbours for a core point).',
      'Core points have ≥ MinPts neighbours within ε; border points are near a core but not core; others are noise.',
      'Clusters grow by connecting core points',
      'It finds arbitrary-shaped clusters and resists outliers; it does not need k.',
      'Choosing ε and MinPts is hard when density varies.',
      fig('dbscan.svg', 'DBSCAN core, border and noise points with ε and MinPts.'),
    ],
    'Define core/border/noise points and the ε/MinPts parameters; note the varying-density difficulty.'
  ),
};

const M4 = {
  'Boolean Retrieval': n(
    'Boolean retrieval answers queries formed with AND, OR, NOT over document terms, returning the exact set of matching documents.',
    [
      'A document matches only if it satisfies the full Boolean expression.',
      'It is simple and predictable but gives no relevance ranking — results are a set.',
      'Synonymy causes misses (different words for the same concept); polysemy causes false hits.',
      'Scales poorly to large query sets unless backed by an inverted index.',
      'Stone (1970) famously showed its unpredictability on realistic queries.',
    ],
    'State why Boolean retrieval has no ranking and suffers synonymy/polysemy; contrast with ranked retrieval.'
  ),
  'Example IR Problem': n(
    'An IR problem is stated as: given a collection and an information need, return the relevant documents.',
    [
      'Inputs: a document collection, a user query and a relevance definition.',
      'Output: a ranked or set list of documents matching the need.',
      'Boolean example: query "cat AND dog" over documents D1–D3.',
      'Relevance is judged against a gold standard (relevance judgments).',
      'Metrics: precision, recall, F1, MAP, NDCG.',
    ],
    'Write the problem statement (collection, query, relevance) and the matching output; evaluate with precision/recall.'
  ),
  'Inverted Index': n(
    'An inverted index maps each term to the list of documents (and positions) containing it.',
    [
      'Build: tokenise each document, then append its id to the term\'s posting list.',
      'Posting lists are sorted by document id so merges are linear.',
      'Skip pointers shorten long lists during intersection.',
      'Positional indexes store term positions for phrase queries.',
      'Index compression (variable-byte, delta) reduces size.',
      fig('inverted-index.svg', 'An inverted index with posting lists and an AND query.'),
    ],
    'Draw a small inverted index and show the AND intersection; mention skip pointers and positional data.'
  ),
  'Processing Boolean Queries': n(
    'Boolean queries are processed by merging posting lists.',
    [
      'AND: intersect two sorted posting lists in linear time, keeping common ids.',
      'OR: union the lists; NOT: complement against the document set.',
      'Optimise by processing terms in increasing posting-list length (cheapest first).',
      'Skip pointers jump to the target id, avoiding full scans.',
      'Phrase queries also check positions.',
    ],
    'Give the two-pointer intersection algorithm and the shortest-list-first optimisation; show skip pointers.'
  ),
  'Tokenization': n(
    'Tokenisation splits text into indexable tokens.',
    [
      'Whitespace and punctuation splitting are the basic rules.',
      'Case folding, accent stripping and stop-word removal follow.',
      'Hyphenated words, numbers and abbreviations need care.',
      'Language-specific rules (CJK segmentation) differ.',
      'Tokenisers must be consistent between indexing and querying.',
    ],
    'Give the tokenisation steps (split, fold, stop-word) and note the indexing/query consistency.'
  ),
  'Stemming': n(
    'Stemming reduces words to a common root so inflections match.',
    [
      'Porter\'s algorithm strips suffixes with rule sets.',
      'Stemming is crude but fast; lemmatisation is dictionary-based and precise.',
      'Stems can be non-words ("studies" → "studi").',
      'Over-stemming merges distinct words; under-stemming misses variants.',
      'Apply the same stemmer at index and query time.',
    ],
    'Contrast stemming (rule-based, crude) with lemmatisation (dictionary); note over/under-stemming errors.'
  ),
  'Phrase Queries': n(
    'Phrase queries match adjacent terms in order.',
    [
      'A positional index stores the positions of each term in each document.',
      'Matching requires the positions to be consecutive and the right order.',
      'Positional indexes are larger than term-only indexes.',
      'Biword indexes index pairs of terms as compound tokens (a cheaper alternative).',
      'Phrase search is common in "exact phrase" UI fields.',
    ],
    'Show the positional match condition; compare positional indexes with biword indexes.'
  ),
  'Vector Space Model': n(
    'The vector space model represents documents and queries as weighted term vectors.',
    [
      'Each term is a dimension; weight = tf · idf (term frequency × inverse document frequency).',
      'Documents are ranked by cosine similarity to the query vector.',
      'cos(q,d) = (q·d)/(|q||d|), independent of length.',
      'idf = log(N/df) down-weights common terms.',
      'It supports ranking and partial matches but ignores term order.',
    ],
    'Write the tf-idf weights and the cosine formula; note that the model ignores term order.'
  ),
  'Finite Automata and Language Model': n(
    'Finite automata recognise regular expressions; language models assign probabilities to sequences.',
    [
      'A finite automaton (states, transitions, accept states) matches patterns like wildcards.',
      'Regular-expression queries compile to automata and run in linear time.',
      'A language model gives P(query) or P(doc|query) and ranks by probability.',
      'N-gram language models predict the next term from the previous n−1.',
      'Smoothing avoids zero probabilities for unseen n-grams.',
    ],
    'Describe the automaton as a regex recogniser and the n-gram model with smoothing; the two mechanisms differ.'
  ),
  'Query Likelihood Model': n(
    'The query likelihood model ranks documents by the probability that they generated the query.',
    [
      'Score P(q|d) = Π P(tᵢ|d) for query terms tᵢ.',
      'P(t|d) combines the document term frequency with a collection prior (Jelinek-Mercer / Dirichlet smoothing).',
      'Smoothing is essential: query terms missing from a document must not zero the score.',
      'It is a probabilistic IR model with solid theoretical grounding.',
      'Ranking is by descending likelihood.',
    ],
    'Write P(q|d) and the smoothing formula; explain why smoothing is required.'
  ),
  'Naive Bayes Text Classification': n(
    'Naive Bayes classifies text using Bayes\' theorem with independence between terms.',
    [
      'P(c|d) ∝ P(c) · Π P(tᵢ|c) over the document terms.',
      'Class priors and term likelihoods are estimated from labelled training text.',
      'Laplace/add-one smoothing handles unseen terms.',
      'Despite the false independence assumption it performs well on spam and topic tasks.',
      'It is fast and incremental, but probabilities are poorly calibrated.',
    ],
    'Write the classification rule and Laplace smoothing; note the independence assumption and the good practical performance.'
  ),
};

export const DA_NOTES = { ...M1, ...M2, ...M3, ...M4 };
