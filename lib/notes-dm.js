// Study notes for PECST525 Data Mining (KTU 2024 Scheme, Semester 5).
// These are original summaries written for this notebook, aligned with the
// official module topics. They are ordinary editable notes, not locked content.

const n = (intro, points, exam = '') =>
  `<p>${intro}</p><h3>Key points</h3><ul>${points
    .map((p) => `<li>${p}</li>`)
    .join('')}</ul>${
    exam ? `<blockquote><p><strong>Exam focus.</strong> ${exam}</p></blockquote>` : ''
  }`;

const M1 = {
  'What is Data Mining?': n(
    'Data mining is the non-trivial extraction of implicit, previously unknown and potentially useful information from large amounts of data. It sits at the intersection of database systems, statistics, machine learning, artificial intelligence and data visualisation.',
    [
      'The input is usually a large, possibly noisy data set; the output is a pattern, model or rule that supports a decision.',
      'It is <strong>not</strong> simply running a SQL query: the pattern must be hidden, non-obvious and useful.',
      'Descriptive mining explains the data (clusters, associations); predictive mining builds models to forecast (classification, regression).',
      'The term is often used loosely for the whole knowledge-discovery pipeline, although strictly it is one step of KDD.',
    ],
    'Define data mining, distinguish it from querying, and place it in the KDD process.'
  ),
  'Applications of Data Mining': n(
    'Data mining is used wherever large volumes of operational data need to be turned into decisions.',
    [
      '<strong>Retail:</strong> market-basket analysis, customer segmentation, demand forecasting and shelf layout.',
      '<strong>Banking and finance:</strong> credit scoring, fraud detection, risk analysis and customer churn prediction.',
      '<strong>Telecom:</strong> call-detail analysis, churn prediction, network fault detection and usage profiling.',
      '<strong>Healthcare and bioinformatics:</strong> diagnosis support, gene-expression analysis and drug discovery.',
      '<strong>Web and text:</strong> search ranking, recommender systems, sentiment analysis and web usage mining.',
      '<strong>Security and science:</strong> intrusion detection, astronomy, climate modelling and manufacturing quality control.',
    ],
    'Give one concrete application per domain and name the mining task it uses.'
  ),
  'Knowledge Discovery in Databases (KDD) Process': n(
    'KDD is the complete, iterative process that converts raw data into useful knowledge. Data mining is the core pattern-extraction step inside it.',
    [
      '<strong>1. Data selection</strong> — choose the relevant sources and the subset of records/attributes.',
      '<strong>2. Preprocessing</strong> — clean noise, handle missing values and remove inconsistencies.',
      '<strong>3. Transformation</strong> — normalise, aggregate, discretise and construct derived attributes.',
      '<strong>4. Data mining</strong> — apply classification, clustering, association or other algorithms to extract patterns.',
      '<strong>5. Interpretation and evaluation</strong> — validate patterns against domain knowledge, resolve redundancy and present knowledge.',
      'The loop is iterative: a failed evaluation sends the analyst back to an earlier step.',
    ],
    'Draw the five stages and state clearly that data mining is only stage four.'
  ),
  'How Data Mining Differs from KDD': n(
    'KDD is the umbrella process; data mining is the algorithmic step that discovers patterns within that process.',
    [
      'KDD includes data selection, cleaning, transformation, mining and evaluation; data mining is only the mining step.',
      'KDD is broader and more application-oriented; data mining is narrower and algorithm-oriented.',
      'A data-mining algorithm can produce a pattern, but KDD decides whether that pattern is valid, novel, useful and understandable.',
      'In practice the terms are often used interchangeably, but an exam answer should keep the distinction.',
    ],
    'A common two-mark question: “Is data mining the same as KDD?” Answer no, and justify with the pipeline.'
  ),
  'Components of a Data Mining System': n(
    'A typical data-mining system has five cooperating components around a data source.',
    [
      '<strong>Database, data warehouse or data mart</strong> — the cleaned data source, often with a database/data-warehouse server.',
      '<strong>Knowledge base</strong> — domain constraints, concept hierarchies, metadata and user beliefs used to guide and evaluate mining.',
      '<strong>Data-mining engine</strong> — the collection of algorithms (classification, clustering, association, etc.).',
      '<strong>Pattern-evaluation module</strong> — filters patterns using interestingness measures and domain knowledge.',
      '<strong>User interface</strong> — lets the user specify tasks, query results and visualise patterns.',
    ],
    'Sketch the architecture with arrows from the data source through the engine to the user interface.'
  ),
  'Functionalities and Classifications of Data Mining Systems': n(
    'Data-mining functionalities describe what patterns can be found; classifications describe how systems differ.',
    [
      '<strong>Characterisation and discrimination</strong> — summarise a target class or compare it with another class.',
      '<strong>Association and correlation</strong> — find items that frequently occur together (market basket).',
      '<strong>Classification and prediction</strong> — learn a model from labelled data and predict a class or value.',
      '<strong>Clustering</strong> — group unlabelled objects so that intra-cluster similarity is high and inter-cluster similarity is low.',
      '<strong>Outlier analysis</strong> — detect rare observations that do not fit the general pattern.',
      'Systems are also classified by data source (relational, warehouse, web), by mining task (descriptive/predictive) and by technique (machine learning, statistics, neural networks).',
    ],
    'Be ready to match a scenario to a functionality: fraud detection is outlier/classification, basket analysis is association.'
  ),
  'Operational Database Systems vs Data Warehouses': n(
    'An operational (OLTP) database runs day-to-day transactions; a data warehouse is a subject-oriented, integrated, time-variant, non-volatile store built for analysis.',
    [
      '<strong>Subject-oriented:</strong> warehouse data is organised around subjects such as sales or students, not around applications.',
      '<strong>Integrated:</strong> data from many sources is cleaned and made consistent before loading.',
      '<strong>Time-variant:</strong> every record carries a time dimension, and history is retained.',
      '<strong>Non-volatile:</strong> data is loaded and read; it is not updated transaction by transaction.',
      'OLTP uses normalised schemas, current data, many short writes and high concurrency; OLAP uses denormalised schemas, historical data, complex reads and fewer updates.',
    ],
    'Contrast the two in a table using the four warehouse properties plus workload and schema.'
  ),
  'Data Warehouse Architecture': n(
    'A data warehouse is usually described as a three-tier architecture fed by an ETL pipeline.',
    [
      '<strong>Bottom tier — warehouse server:</strong> a relational or multidimensional server that stores the warehouse and data marts.',
      '<strong>Middle tier — OLAP server:</strong> presents a multidimensional view using ROLAP, MOLAP or HOLAP.',
      '<strong>Top tier — front-end tools:</strong> query, reporting, analysis, data-mining and visualisation tools.',
      '<strong>ETL:</strong> extract from sources, transform (clean, integrate, conform) and load into the warehouse.',
      'A <strong>data mart</strong> is a smaller, subject-specific subset; it may be dependent (sourced from the warehouse) or independent.',
    ],
    'Label the three tiers and explain where ETL and data marts fit.'
  ),
  'Warehouse Schema (Star, Snowflake, Fact Constellation)': n(
    'Multidimensional models are implemented with fact tables and dimension tables.',
    [
      '<strong>Fact table:</strong> contains numeric measures (sales amount, quantity) and foreign keys to dimensions; its grain defines the level of detail.',
      '<strong>Star schema:</strong> one central fact table surrounded by denormalised dimension tables; simple and fast, some redundancy.',
      '<strong>Snowflake schema:</strong> dimensions are normalised into hierarchies (category → subcategory); saves space but needs more joins.',
      '<strong>Fact constellation (galaxy):</strong> several fact tables share dimension tables, used for enterprise-wide warehouses.',
      'Dimension tables hold descriptive attributes used for slicing, dicing and drill-down.',
    ],
    'Draw a star schema for sales and convert it to a snowflake by normalising the product dimension.'
  ),
  'OLAP Operations': n(
    'OLAP operations navigate a multidimensional data cube.',
    [
      '<strong>Roll-up:</strong> aggregate to a coarser level (day → month → year) or drop a dimension.',
      '<strong>Drill-down:</strong> move to finer detail (year → quarter → month), the reverse of roll-up.',
      '<strong>Slice:</strong> select one value of a dimension, producing a sub-cube.',
      '<strong>Dice:</strong> select a range or multiple values on two or more dimensions.',
      '<strong>Pivot (rotate):</strong> reorient the cube to view it from another perspective.',
      'Drill-across and drill-through are related operations that query other cubes or the underlying detail.',
    ],
    'Use a sales cube (time, product, region) and give one concrete example of each operation.'
  ),
};

const M2 = {
  'Why Raw Data Must Be Preprocessed': n(
    'Real data is incomplete, noisy and inconsistent, so mining it directly gives unreliable models. Preprocessing is typically the largest part of a data-mining project.',
    [
      '<strong>Incomplete:</strong> missing attributes, missing values or missing records.',
      '<strong>Noisy:</strong> errors, outliers, instrument faults and data-entry mistakes.',
      '<strong>Inconsistent:</strong> conflicting codes, units or duplicates across sources.',
      'Poor quality causes wrong patterns, overfitting and biased conclusions; “garbage in, garbage out”.',
      'The main tasks are cleaning, integration, transformation and reduction (including discretisation).',
    ],
    'List the three data-quality problems and map each to a preprocessing task.'
  ),
  'Handling Missing Values': n(
    'Missing values can be handled by removing data, filling it in, or modelling the missingness.',
    [
      '<strong>Ignore the tuple</strong> — simple, but loses information and can bias the sample if missingness is not random.',
      '<strong>Fill with a global constant</strong> — easy, but creates a misleading spike at that value.',
      '<strong>Fill with the attribute mean/median/mode</strong> — reasonable for numeric or categorical data, but ignores relationships.',
      '<strong>Fill with the class mean or the most probable value</strong> — uses other attributes and usually gives better estimates.',
      'Advanced methods include regression, k-nearest-neighbour imputation and multiple imputation.',
    ],
    'State the trade-off: deletion is unbiased only when values are missing completely at random.'
  ),
  'Handling Noisy Data': n(
    'Noise is a random error or variance in a measured value. Smoothing tries to remove it without destroying genuine patterns.',
    [
      '<strong>Binning:</strong> sort values into equal-width or equal-frequency bins, then smooth by bin mean, median or boundaries.',
      '<strong>Regression:</strong> fit a line or curve and replace values with the fitted value.',
      '<strong>Clustering:</strong> group similar values and treat points far from any cluster as outliers.',
      '<strong>Outlier analysis:</strong> detect and remove or correct extreme values after investigation.',
      'Binning example: values 4, 8, 15, 21, 21, 24, 25, 28, 34 in three equal-frequency bins → smooth by bin means 9, 22, 29.',
    ],
    'Show a small binning calculation; examiners often ask for equal-width versus equal-frequency.'
  ),
  'Integration, Transformation and Normalization': n(
    'Integration combines data from multiple sources; transformation converts it into a form suitable for mining.',
    [
      '<strong>Entity identification</strong> — match equivalent real-world entities across sources (same student, different IDs).',
      '<strong>Redundancy</strong> — detect duplicate attributes using correlation (numeric) or chi-square (categorical).',
      '<strong>Smoothing</strong> — remove noise; <strong>aggregation</strong> — summarise (daily → monthly).',
      '<strong>Normalisation</strong> — min-max to [0,1], z-score to zero mean/unit variance, or decimal scaling.',
      '<strong>Attribute construction</strong> — create useful derived attributes such as BMI or total price.',
      'Normalisation stops large-range attributes from dominating distance-based algorithms.',
    ],
    'Write the min-max and z-score formulas and say when each is preferred.'
  ),
  'Data Cube Aggregation': n(
    'Data-cube aggregation replaces a detailed cube with a coarser summary, reducing the number of cells that must be stored and mined.',
    [
      'Example: monthly sales can be aggregated to quarterly or yearly totals.',
      'The operation is a roll-up on one or more dimensions.',
      'It preserves the measures that make sense at the coarser level (sum, count, average) but loses individual detail.',
      'It is a form of data reduction and is closely related to materialised views in a warehouse.',
    ],
    'Mention that aggregation is lossy: you cannot recover the original tuples from the summary.'
  ),
  'Attribute Subset Selection': n(
    'Attribute subset selection removes irrelevant or redundant attributes so that mining is faster and the model is easier to interpret.',
    [
      '<strong>Forward selection:</strong> start empty and add the best attribute at each step.',
      '<strong>Backward elimination:</strong> start with all attributes and remove the worst one repeatedly.',
      '<strong>Stepwise selection:</strong> combine forward and backward steps.',
      'Attributes can be ranked by information gain, statistical significance or correlation with the class.',
      'Decision-tree induction is a practical heuristic: attributes used in the tree are kept, unused ones are dropped.',
    ],
    'Distinguish irrelevant attributes (no information) from redundant ones (information duplicated by another attribute).'
  ),
  'Dimensionality Reduction': n(
    'Dimensionality reduction maps many attributes into fewer dimensions while preserving the essential structure of the data.',
    [
      '<strong>Principal Component Analysis (PCA):</strong> finds orthogonal components that capture maximum variance.',
      '<strong>Wavelet transform:</strong> keeps the largest wavelet coefficients and discards the rest.',
      '<strong>Feature selection:</strong> keeps a subset of the original attributes rather than creating new ones.',
      'Benefits: less noise, faster mining, lower storage and avoidance of the curse of dimensionality.',
      'The cost is some loss of information and reduced interpretability when components are linear combinations.',
    ],
    'PCA is the standard example; know that it is unsupervised and variance-based.'
  ),
  'Numerosity Reduction': n(
    'Numerosity reduction reduces the number of data objects rather than the number of attributes.',
    [
      '<strong>Histograms:</strong> store bucket counts instead of individual values.',
      '<strong>Clustering:</strong> replace each cluster by its representative (centroid or medoid).',
      '<strong>Sampling:</strong> simple random with/without replacement, stratified, cluster and systematic sampling.',
      '<strong>Parametric models:</strong> fit a regression or distribution and store only its parameters.',
      '<strong>Data compression:</strong> lossless or lossy encoding of the data.',
      'Sampling is the most common choice for very large data sets, but the sample must be representative.',
    ],
    'Know the difference between stratified sampling (strata preserved) and cluster sampling (whole groups chosen).'
  ),
  'Discretization and Concept Hierarchies': n(
    'Discretization converts continuous attributes into intervals; a concept hierarchy organises values from specific to general.',
    [
      'Binning: equal-width or equal-frequency intervals; simple but sensitive to skew and outliers.',
      'Entropy-based (MDL) discretization chooses split points that minimise class entropy.',
      'Chi-merge and cluster analysis are other data-driven methods.',
      'Concept hierarchies can come from the schema (street → city → state), explicit grouping, or automatic rule-based generation.',
      'Discretisation reduces noise and makes association-rule mining and decision trees easier to apply.',
    ],
    'Give a hierarchy example for age: 0–12 child, 13–19 teen, 20–59 adult, 60+ senior.'
  ),
};

const M3 = {
  'General Approach to Classification': n(
    'Classification is supervised learning: a model is built from labelled training tuples and then used to assign a class label to unseen tuples.',
    [
      '<strong>Learning step:</strong> fit a classifier (decision tree, naïve Bayes, neural network, SVM) on training data.',
      '<strong>Classification step:</strong> apply the model to test data and compare predicted with actual labels.',
      'The model may be represented as a tree, a set of rules, a network of weights or a probability distribution.',
      'Classification predicts a discrete class; prediction (regression) estimates a continuous value.',
      'The key quality issues are accuracy, speed, interpretability, robustness and scalability.',
    ],
    'Remember the two-step diagram: training data → model → test data → accuracy.'
  ),
  'Decision Tree Construction Principle': n(
    'A decision tree partitions data recursively by testing attributes, producing branches for outcomes and leaf nodes for class labels.',
    [
      'Internal nodes are tests on an attribute; branches are the possible outcomes; leaves carry a class.',
      'Attribute selection is greedy: choose the test that best separates the classes at the current node.',
      'Common measures are information gain, gain ratio and Gini index.',
      'Growing stops when a node is pure, no attributes remain, or a stopping criterion is met.',
      'Unrestricted trees overfit; pruning (pre-pruning or post-pruning) removes weak branches.',
    ],
    'Explain that the split is local and greedy, so the tree is not guaranteed to be globally optimal.'
  ),
  'Information Gain': n(
    'Information gain measures the reduction in entropy after splitting on an attribute.',
    [
      'Entropy of a data set: <code>H(D) = −Σ p<sub>i</sub> log<sub>2</sub> p<sub>i</sub></code>.',
      'Conditional entropy after splitting on attribute A is the weighted average of child entropies.',
      'Information gain: <code>Gain(D,A) = H(D) − Σ (|D<sub>v</sub>|/|D|) H(D<sub>v</sub>)</code>.',
      'Choose the attribute with the largest gain; ID3 uses exactly this criterion.',
      'The measure is biased towards attributes with many distinct values, which gain ratio corrects.',
    ],
    'Be able to compute entropy for a small table; use log<sub>2</sub> (1/2) = −1, log<sub>2</sub>(1/4) = −2.'
  ),
  'Gini Index': n(
    'The Gini index measures the impurity of a node and is used by CART to choose binary splits.',
    [
      'For a data set with classes, <code>Gini(D) = 1 − Σ p<sub>i</sub><sup>2</sup></code>.',
      'After a binary split, the weighted Gini is the sum of child Gini values weighted by their sizes.',
      'The reduction in Gini (<code>Gini(D) − Gini<sub>A</sub>(D)</code>) is the split’s goodness; CART picks the smallest weighted Gini.',
      'A pure node has Gini 0; maximum impurity for two equal classes is 0.5.',
      'Gini is cheaper than entropy (no logarithms) and tends to favour binary splits.',
    ],
    'For two classes with proportions 0.7/0.3, Gini = 1 − 0.49 − 0.09 = 0.42.'
  ),
  'ID3 Algorithm': n(
    'ID3 is a top-down, greedy decision-tree algorithm that uses information gain and handles categorical attributes.',
    [
      'Start with all training tuples at the root.',
      'If all tuples are in one class, return a leaf with that class.',
      'Otherwise choose the attribute with maximum information gain; make one branch per value.',
      'Recurse on each branch; if a branch has no tuples, use the majority class at the parent.',
      'Stop when attributes are exhausted or a stopping rule is satisfied; the classic algorithm has no pruning.',
      'Extensions such as C4.5 handle continuous attributes, missing values and pruning (gain ratio).',
    ],
    'ID3 cannot directly handle numeric attributes; mention discretisation or C4.5 if asked.'
  ),
  'Neural Networks and Back Propagation': n(
    'A multi-layer feed-forward neural network learns a non-linear mapping by propagating errors backwards and adjusting weights.',
    [
      'Each neuron computes a weighted sum plus bias and applies an activation function (sigmoid, ReLU, tanh).',
      '<strong>Forward pass:</strong> feed the input through hidden layers to the output.',
      'Compute the error (for example squared error or cross-entropy) between predicted and actual output.',
      '<strong>Backward pass:</strong> propagate the error using the chain rule and update weights by gradient descent: <code>w ← w − η ∂E/∂w</code>.',
      'Repeat for many epochs; the learning rate η controls the step size.',
      'Multiple hidden layers allow non-linear decision boundaries (for example XOR), but training can be slow and may overfit.',
    ],
    'Know the order: initialise weights, forward propagate, compute error, back-propagate, update, repeat.'
  ),
  'Accuracy, Precision, Recall and F1 Score': n(
    'Classification quality is summarised by the confusion matrix and the measures derived from it.',
    [
      '<strong>TP, FP, TN, FN</strong> count correct/incorrect positive and negative predictions.',
      '<strong>Accuracy</strong> = (TP + TN) / (TP + FP + TN + FN); misleading when classes are imbalanced.',
      '<strong>Precision</strong> = TP / (TP + FP): of the items predicted positive, how many are correct.',
      '<strong>Recall (sensitivity)</strong> = TP / (TP + FN): of the actual positives, how many were found.',
      '<strong>F1</strong> = 2 · precision · recall / (precision + recall), the harmonic mean of the two.',
      'Specificity = TN / (TN + FP) is the true-negative rate; ROC/AUC summarise thresholds.',
    ],
    'For a spam filter, high precision means few genuine mails marked spam; high recall means few spam mails missed.'
  ),
  'Introduction to Clustering and Distance Measures': n(
    'Clustering is unsupervised learning that groups objects so that objects in a group are similar to each other and dissimilar to objects in other groups.',
    [
      'Goal: high intra-cluster similarity and low inter-cluster similarity; no class labels are available.',
      '<strong>Euclidean distance:</strong> <code>√Σ(x<sub>i</sub> − y<sub>i</sub>)<sup>2</sup></code>.',
      '<strong>Manhattan distance:</strong> <code>Σ|x<sub>i</sub> − y<sub>i</sub>|</code>.',
      '<strong>Minkowski distance:</strong> the generalisation with parameter p.',
      '<strong>Cosine similarity:</strong> angle between vectors, useful for text; <strong>Jaccard</strong> for sets.',
      'Choose a measure that matches the data type and normalise attributes so units do not dominate.',
    ],
    'Distance is a dissimilarity: small distance means similar. Similarity and distance are inversely related.'
  ),
  'Clustering Paradigms': n(
    'Clustering algorithms are grouped by how they build clusters.',
    [
      '<strong>Partitioning:</strong> divide objects into k clusters (k-means, k-medoids); need k in advance.',
      '<strong>Hierarchical:</strong> build a tree of clusters by merging or splitting; no k needed.',
      '<strong>Density-based:</strong> grow clusters from dense regions and label isolated points as noise (DBSCAN).',
      '<strong>Grid-based:</strong> quantise space into cells and operate on cells (STING, CLIQUE).',
      '<strong>Model-based:</strong> fit a statistical model such as a mixture of Gaussians (EM).',
      'Hard clustering assigns each object to one cluster; soft/fuzzy clustering gives membership degrees.',
    ],
    'Match each paradigm to its strength: arbitrary shapes (density), no k (hierarchical), speed (k-means).'
  ),
  'Partitioning Algorithm — k-Means': n(
    'k-means partitions n objects into k clusters by iteratively assigning objects to the nearest centroid and recomputing centroids.',
    [
      'Choose k and initialise k centroids (random objects or k-means++).',
      'Assign each object to the cluster with the nearest centroid (usually Euclidean).',
      'Recompute each centroid as the mean of the objects in its cluster.',
      'Repeat until assignments or centroids stop changing (or a maximum number of iterations is reached).',
      'Objective: minimise the sum of squared errors (SSE) within clusters. Complexity is about O(n · k · d · iterations).',
      'Limitations: k must be chosen, sensitive to initialisation and outliers, finds spherical clusters of similar size.',
    ],
    'Use the elbow method or silhouette score to choose k; k-means++ improves initialisation.'
  ),
  'Hierarchical Clustering': n(
    'Hierarchical clustering creates a nested sequence of clusters, usually visualised as a dendrogram.',
    [
      '<strong>Agglomerative (bottom-up):</strong> start with each object as a cluster and repeatedly merge the two closest clusters.',
      '<strong>Divisive (top-down):</strong> start with one cluster and repeatedly split it.',
      'Linkage defines cluster distance: single (minimum), complete (maximum), average, centroid or Ward.',
      'The dendrogram records merge heights; cutting it at a chosen level gives a flat clustering.',
      'Typical complexity is O(n<sup>2</sup>) time and memory, so it is best for moderate n.',
      'Single linkage can chain long clusters; complete and average linkage are more balanced.',
    ],
    'Explain that the algorithm is deterministic (apart from ties) and does not require k in advance.'
  ),
  'DBSCAN': n(
    'DBSCAN is a density-based clustering algorithm that finds arbitrarily shaped clusters and explicitly identifies noise.',
    [
      'Parameters: <code>ε</code> (neighbourhood radius) and <code>MinPts</code> (minimum neighbours to be a core point).',
      'A <strong>core point</strong> has at least MinPts points within ε; a <strong>border point</strong> is within ε of a core point; other points are <strong>noise</strong>.',
      'Clusters are formed by connecting density-reachable points, starting from an unvisited core point.',
      'Advantages: arbitrary shapes, no k, robust to outliers.',
      'Limitations: ε and MinPts are hard to choose, performance degrades with varying density and high dimensions.',
      'With a spatial index the typical complexity is O(n log n); without one it can be O(n<sup>2</sup>).',
    ],
    'Distinguish core, border and noise; a cluster must contain at least one core point.'
  ),
};

const M4 = {
  'Association Rule Concepts': n(
    'Association-rule mining finds items that co-occur frequently in transactions, expressed as implications X → Y.',
    [
      'An <strong>itemset</strong> is a set of items; a <strong>transaction</strong> is one basket containing an itemset.',
      '<strong>Support</strong> of X → Y = fraction of transactions containing X ∪ Y.',
      '<strong>Confidence</strong> of X → Y = support(X ∪ Y) / support(X).',
      '<strong>Lift</strong> = confidence / support(Y); lift > 1 means positive correlation, = 1 independence, < 1 negative.',
      'A rule is frequent if support ≥ minimum support and strong if confidence ≥ minimum confidence.',
      'The goal is to find all strong rules without enumerating the exponential number of itemsets.',
    ],
    'Example: 100 transactions, 30 contain bread and butter, 40 contain bread, 50 contain butter. Support = 0.3, confidence = 0.75, lift = 1.5.'
  ),
  'Apriori Algorithm': n(
    'Apriori uses the downward-closure property to generate frequent itemsets level by level.',
    [
      'Property: every subset of a frequent itemset is frequent; if an itemset is infrequent, all its supersets are infrequent.',
      'Scan the database to find frequent 1-itemsets (L<sub>1</sub>).',
      'Generate candidate k-itemsets C<sub>k</sub> by joining L<sub>k−1</sub> with itself; prune candidates whose (k−1)-subsets are not frequent.',
      'Count support for C<sub>k</sub> in another database scan, keep those above minimum support as L<sub>k</sub>.',
      'Repeat until no candidates remain; then generate rules from frequent itemsets and keep those meeting minimum confidence.',
      'Cost is dominated by repeated scans and candidate generation; it can be slow for long or dense itemsets.',
    ],
    'Work through the standard 5-transaction example; show the join and prune steps, not just the final rules.'
  ),
  'FP Growth Algorithm': n(
    'FP-Growth mines frequent itemsets without candidate generation by compressing the database into an FP-tree.',
    [
      'First scan: count item frequencies and discard infrequent items; sort frequent items in descending frequency.',
      'Second scan: insert each transaction into the FP-tree, sharing prefixes; keep a header table linking equal items.',
      'For each item (bottom-up), build its conditional pattern base and conditional FP-tree.',
      'Mine each conditional tree recursively to obtain frequent itemsets.',
      'Only two database scans; no candidate generation; usually faster than Apriori on dense data.',
      'The tree can be large, and support counting still requires care for large itemsets.',
    ],
    'Describe the compressed tree and the divide-and-conquer conditional pattern bases.'
  ),
  'Web Content Mining': n(
    'Web content mining extracts knowledge from the content of web pages: text, images, audio, video and structured markup.',
    [
      'Content may be unstructured (free text), semi-structured (HTML/XML) or structured (tables, databases).',
      'Text mining techniques handle tokenisation, classification, clustering and summarisation of page text.',
      'Wrapper induction and information extraction pull structured records from semi-structured pages.',
      'Challenges: huge scale, heterogeneity, noise (navigation, ads), dynamic pages and ambiguity of language.',
      'Applications: news categorisation, opinion mining, product comparison and web search.',
    ],
    'Contrast web content mining with structure mining (links) and usage mining (logs).'
  ),
  'Web Structure Mining — PageRank': n(
    'Web structure mining analyses hyperlinks. PageRank scores a page by the number and quality of pages linking to it.',
    [
      'Model a random surfer who follows links with probability d and jumps to a random page with probability 1 − d.',
      'PageRank formula: <code>PR(A) = (1 − d)/N + d · Σ PR(T<sub>i</sub>)/C(T<sub>i</sub>)</code>, over pages T<sub>i</sub> linking to A.',
      'C(T<sub>i</sub>) is the out-degree of the linking page; d is usually 0.85.',
      'Compute iteratively (power iteration) until scores converge; dangling pages need a redistribution rule.',
      'A link from a high-PageRank page with few outlinks contributes more than one from a low-ranked hub.',
      'HITS is an alternative that computes hub and authority scores from the same link graph.',
    ],
    'Know the formula and that PageRank is query-independent; it is computed once over the link graph.'
  ),
  'Web Usage Mining — Preprocessing and Data Structures': n(
    'Web usage mining discovers patterns from user interaction data such as server logs, cookies and clickstreams.',
    [
      'Sources: web-server logs, proxy logs, browser logs, cookies and user profiles.',
      '<strong>Cleaning:</strong> remove robot/spider requests, error requests and irrelevant entries.',
      '<strong>User identification:</strong> distinguish users by IP, cookies or registration.',
      '<strong>Session identification:</strong> split activity by timeouts or navigation boundaries.',
      '<strong>Path completion:</strong> infer missing page requests from cached links and the site graph.',
      'Data is stored as a graph, a matrix (users × pages) or a multidimensional cube for mining.',
    ],
    'Explain why a raw log entry is not a user session; preprocessing reconstructs sessions.'
  ),
  'Web Usage Mining — Pattern Discovery and Pattern Analysis': n(
    'After preprocessing, usage data is mined for navigation and behavioural patterns, which are then analysed and visualised.',
    [
      'Pattern discovery: statistical summaries, association rules, clustering of users/pages, classification and sequential patterns.',
      'Frequent traversal paths show common navigation routes; association rules relate pages visited together.',
      'Pattern analysis: OLAP on usage cubes, visualisation, and filtering by domain knowledge.',
      'Applications: personalisation, recommender systems, adaptive sites, cache/prefetch policy and site redesign.',
      'Challenges: privacy, incomplete logs, caching and session ambiguity.',
    ],
    'Give one application for each discovered pattern type (path, association, cluster).'
  ),
  'Text Data Analysis and Information Retrieval': n(
    'Text mining extracts useful information from unstructured text; information retrieval (IR) finds relevant documents for a query.',
    [
      'Text is tokenised, stop words are removed, and terms are stemmed or lemmatised.',
      'Documents are represented as a bag of terms, a term vector or a probabilistic model.',
      'IR returns a ranked list of documents; data mining discovers patterns across the collection.',
      'Key difference from a database query: text is unstructured and relevance is approximate.',
      'Applications: search engines, document classification, clustering, sentiment analysis and summarisation.',
    ],
    'Know the IR problem statement: given a query and a document collection, return relevant documents ranked by relevance.'
  ),
  'Basic Measures for Text Retrieval': n(
    'Retrieval quality is judged against a known set of relevant documents.',
    [
      '<strong>Precision</strong> = relevant retrieved / retrieved.',
      '<strong>Recall</strong> = relevant retrieved / all relevant documents.',
      '<strong>F-measure</strong> = 2PR / (P + R), the harmonic mean.',
      '<strong>Accuracy</strong> = (relevant retrieved + non-relevant not retrieved) / all documents.',
      'Precision and recall trade off as the retrieval threshold changes; a precision–recall curve shows this.',
      'For ranked retrieval, measures at cut-off k (precision@k) and mean average precision are common.',
    ],
    'Use the standard 2×2 contingency table: retrieved/not retrieved versus relevant/not relevant.'
  ),
  'Text Retrieval Methods': n(
    'Retrieval models rank documents by how well they match a query.',
    [
      '<strong>Boolean model:</strong> documents match if the Boolean query is true; no ranking, simple but rigid.',
      '<strong>Vector space model:</strong> documents and queries are term vectors weighted by TF-IDF; rank by cosine similarity.',
      '<strong>Probabilistic model:</strong> estimate the probability that a document is relevant (BM25 is a practical variant).',
      '<strong>Language model:</strong> rank by the probability that the query was generated from the document model, often with smoothing.',
      'Latent semantic indexing reduces dimensions to capture synonymy; neural models learn dense embeddings.',
      'TF-IDF rewards terms frequent in a document but rare in the collection.',
    ],
    'Be able to compute cosine similarity for tiny term vectors; normalise vectors first.'
  ),
  'Text Indexing Techniques': n(
    'An index makes retrieval fast without scanning every document.',
    [
      '<strong>Inverted index:</strong> for each term, store a postings list of document IDs (and positions/frequencies).',
      'Build by tokenising documents, assigning term IDs, sorting terms and merging postings.',
      'The dictionary stores terms and pointers to postings; it can be a hash table, B-tree or trie.',
      'Positional indexes support phrase and proximity queries at the cost of more space.',
      'Compression (delta encoding, variable-byte codes) reduces index size; skip pointers speed up intersections.',
      'Boolean queries are answered by intersecting or merging postings lists.',
    ],
    'Draw a small inverted index for three documents and show an AND query using postings intersection.'
  ),
};

export const DM_NOTES = { ...M1, ...M2, ...M3, ...M4 };
