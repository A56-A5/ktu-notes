// Remaining KTU 2024 Scheme Semester 5 syllabi for the default subject set.
const note = (title) => ({ title, body: '', source: 'official' });

export const DAA = {
  key: 'daa',
  title: 'Design and Analysis of Algorithms (DAA)',
  code: 'PCCST502',
  description:
    'Algorithm analysis, recurrences, AVL trees, graphs, divide and conquer, greedy, dynamic programming, backtracking and complexity classes.',
  source: 'official',
  credits: 4,
  contactHours: '11 + 11 + 11 + 11',
  objectives: [
    'To gain a foundational understanding of algorithms and their analysis.',
    'To develop problem-solving skills using algorithm design paradigms like divide and conquer and dynamic programming.',
    'To understand tractable and intractable problems and the complexity classes P, NP, NP-hard and NP-complete.',
  ],
  outcomes: [
    'CO1 - Analyse the time and space complexity of algorithms using asymptotic notations and recurrence solving.',
    'CO2 - Apply disjoint sets, graph traversal and divide-and-conquer strategies.',
    'CO3 - Design solutions using greedy, dynamic programming and backtracking strategies.',
    'CO4 - Explain branch and bound, complexity classes and approximation/randomized algorithms.',
  ],
  textbooks: [
    'Ellis Horowitz, Sartaj Sahni, Sanguthevar Rajasekaran, Computer Algorithms, Universities Press.',
    'Thomas H. Cormen et al., Introduction to Algorithms, PHI.',
  ],
  references: ['Jon Kleinberg, Éva Tardos, Algorithm Design, Pearson.'],
  modules: [
    {
      title: 'Algorithm Analysis and Balanced Search Trees',
      hours: 11,
      description:
        'Algorithm characteristics, criteria for analysis, best/worst/average complexity, asymptotic notations, recurrence solving by iteration, recursion tree, substitution and Master theorem, AVL trees.',
      topics: [
        {
          title: 'Algorithm Analysis Fundamentals',
          subs: [
            note('Characteristics of Algorithms'),
            note('Criteria for Analysing Algorithms'),
            note('Time and Space Complexity'),
            note('Best, Worst and Average Case Complexities'),
          ],
        },
        {
          title: 'Asymptotic Notations',
          subs: [
            note('Big-O, Omega and Theta Notations'),
            note('Properties of Asymptotic Notations'),
            note('Complexity Calculation of Simple Algorithms'),
          ],
        },
        {
          title: 'Analysis of Recursive Algorithms',
          subs: [
            note('Recurrence Equations'),
            note('Iteration Method'),
            note('Recursion Tree Method'),
            note('Substitution Method'),
            note("Master's Theorem (proof not expected)"),
          ],
        },
        {
          title: 'Balanced Search Trees - AVL Trees',
          subs: [
            note('AVL Tree Properties'),
            note('Insertion with Rotations'),
            note('Deletion with Rotations'),
          ],
        },
      ],
    },
    {
      title: 'Disjoint Sets, Graphs and Divide and Conquer',
      hours: 11,
      description:
        'Union-find with rank and path compression, connected components, graph representations and traversals, strongly connected components, topological sorting, merge sort and Strassen’s multiplication.',
      topics: [
        {
          title: 'Disjoint Sets',
          subs: [
            note('Disjoint Set Operations'),
            note('Union and Find Algorithms'),
            note('Union by Rank with Path Compression'),
            note('Connected Components of a Graph'),
          ],
        },
        {
          title: 'Graphs and Traversals',
          subs: [
            note('Graph Representations'),
            note('BFS and its Analysis'),
            note('DFS and its Analysis'),
            note('Strongly Connected Components'),
            note('Topological Sorting'),
          ],
        },
        {
          title: 'Divide and Conquer',
          subs: [
            note('Control Abstraction'),
            note('Merge Sort'),
            note("Strassen's Matrix Multiplication"),
            note('Analysis of Divide and Conquer Algorithms'),
          ],
        },
      ],
    },
    {
      title: 'Greedy, Dynamic Programming and Backtracking',
      hours: 11,
      description:
        'Fractional knapsack, Kruskal’s and Prim’s MST, Dijkstra, optimality principle, matrix chain multiplication, Floyd–Warshall and N-Queens.',
      topics: [
        {
          title: 'Greedy Strategy',
          subs: [
            note('Control Abstraction'),
            note('Fractional Knapsack'),
            note("Minimum Cost Spanning Tree - Kruskal's"),
            note("Minimum Cost Spanning Tree - Prim's"),
            note("Shortest Path - Dijkstra's Algorithm"),
          ],
        },
        {
          title: 'Dynamic Programming',
          subs: [
            note('Control Abstraction'),
            note('Optimality Principle'),
            note('Matrix Chain Multiplication'),
            note('All Pairs Shortest Path - Floyd-Warshall'),
          ],
        },
        {
          title: 'Backtracking',
          subs: [note('Control Abstraction'), note('N-Queens Problem')],
        },
      ],
    },
    {
      title: 'Branch and Bound and Complexity Classes',
      hours: 11,
      description:
        'Branch and bound and the travelling salesman problem, tractable/intractable problems, P, NP, NP-hard, NP-complete, NP-completeness proofs, bin packing and randomized algorithms.',
      topics: [
        {
          title: 'Branch and Bound',
          subs: [
            note('Control Abstraction'),
            note('Travelling Salesman Problem'),
            note('Algorithm for TSP using Branch and Bound'),
          ],
        },
        {
          title: 'Complexity Classes',
          subs: [
            note('Tractable and Intractable Problems'),
            note('Class P'),
            note('Class NP'),
            note('NP-Hard and NP-Complete Classes'),
          ],
        },
        {
          title: 'NP-Completeness Proofs',
          subs: [note('Clique Problem'), note('Vertex Cover Problem')],
        },
        {
          title: 'Approximation and Randomized Algorithms',
          subs: [
            note('Approximation Algorithms - Bin Packing'),
            note('Monte Carlo and Las Vegas Algorithms'),
            note('Randomized Quick Sort with Analysis'),
          ],
        },
      ],
    },
  ],
};

export const DATA_ANALYTICS = {
  key: 'data-analytics',
  title: 'Data Analytics',
  code: 'PCCDT503',
  description:
    'Analytics life cycle, probability and hypothesis testing, proximity measures, association, preprocessing, classification, clustering and text processing.',
  source: 'official',
  credits: 3,
  contactHours: '11 + 11 + 11 + 11',
  objectives: [
    'To equip students with the knowledge and skills necessary to analyse and interpret complex data sets to extract useful patterns and relationships.',
    'To teach how to handle data effectively, perform exploratory data analysis, build predictive models and communicate findings through data visualisation.',
  ],
  outcomes: [
    'CO1 - Explain the data analytics process model, analytics life cycle and statistical foundations.',
    'CO2 - Apply association analysis and data preprocessing techniques.',
    'CO3 - Build classification and clustering models for practical data.',
    'CO4 - Apply text processing and information retrieval techniques.',
  ],
  textbooks: [
    'Christian Heumann, Michael Schomaker, Shalabh, Introduction to Statistics and Data Analysis, Springer.',
    'Jiawei Han, Micheline Kamber, Data Mining: Concepts and Techniques, Elsevier.',
  ],
  references: ['Pang-Ning Tan, Michael Steinbach, Introduction to Data Mining, Addison Wesley.'],
  modules: [
    {
      title: 'Introduction to Data Analytics and Statistical Foundations',
      hours: 11,
      description:
        'Analytics process model, analytical model requirements, analytics life cycle, probability distributions, hypothesis testing, proximity measures and statistical description.',
      topics: [
        {
          title: 'Analytics Process and Life Cycle',
          subs: [
            note('Analytics Process Model'),
            note('Analytical Model Requirements'),
            note('Data Analytics Life Cycle Overview'),
          ],
        },
        {
          title: 'Probability and Hypothesis Testing',
          subs: [
            note('Probability Calculus and Probability Distributions'),
            note('Hypothesis Testing - Basic Definitions'),
          ],
        },
        {
          title: 'Proximity Measures',
          subs: [
            note('Data Objects and Attribute Types'),
            note('Dissimilarity and Similarity Measures'),
          ],
        },
        {
          title: 'Statistical Description of Data',
          subs: [
            note('Central Tendency and Dispersion'),
            note('Range, Quartiles, Variance and Standard Deviation'),
            note('Interquartile Range'),
          ],
        },
      ],
    },
    {
      title: 'Association of Two Variables and Data Preprocessing',
      hours: 11,
      description:
        'Contingency tables, joint/marginal/conditional distributions, measures of association across variable scales, preprocessing and frequent pattern mining.',
      topics: [
        {
          title: 'Association of Two Variables',
          subs: [
            note('Summarising the Distribution of Two Discrete Variables'),
            note('Contingency Tables for Discrete Data'),
            note('Joint, Marginal and Conditional Frequency Distributions'),
            note('Graphical Representation of Two Nominal or Ordinal Variables'),
            note('Measures of Association for Two Discrete Variables'),
            note('Association Between Ordinal and Continuous Variables'),
            note('Visualisation of Variables from Different Scales'),
          ],
        },
        {
          title: 'Data Preprocessing',
          subs: [
            note('Cleaning'),
            note('Integration'),
            note('Reduction'),
            note('Transformation'),
            note('Discretization'),
          ],
        },
        {
          title: 'Mining Frequent Patterns',
          subs: [
            note('Associations and Correlations'),
            note('Apriori Algorithm'),
          ],
        },
      ],
    },
    {
      title: 'Classification and Clustering',
      hours: 11,
      description:
        'General approach to classification, ID3, attribute selection, Naive Bayes, k-means, hierarchical clustering, BIRCH and DBSCAN.',
      topics: [
        {
          title: 'Classification',
          subs: [
            note('General Approach to Classification'),
            note('ID3'),
            note('Attribute Selection Measures'),
            note('Naive Bayesian Classification'),
          ],
        },
        {
          title: 'Clustering',
          subs: [
            note('K-Means'),
            note('Agglomerative versus Divisive Hierarchical Clustering'),
            note('BIRCH'),
            note('DBSCAN'),
          ],
        },
      ],
    },
    {
      title: 'Text Processing',
      hours: 11,
      description:
        'Boolean retrieval, inverted indexes, tokenization, stemming, phrase queries, vector space model, language models and Naive Bayes text classification.',
      topics: [
        {
          title: 'Information Retrieval Fundamentals',
          subs: [
            note('Boolean Retrieval'),
            note('Example IR Problem'),
            note('Inverted Index'),
            note('Processing Boolean Queries'),
          ],
        },
        {
          title: 'Text Processing Pipeline',
          subs: [
            note('Tokenization'),
            note('Stemming'),
            note('Phrase Queries'),
          ],
        },
        {
          title: 'Retrieval Models',
          subs: [
            note('Vector Space Model'),
            note('Finite Automata and Language Model'),
            note('Query Likelihood Model'),
            note('Naive Bayes Text Classification'),
          ],
        },
      ],
    },
  ],
};

export const BIG_DATA = {
  key: 'big-data',
  title: 'Big Data Processing',
  code: 'PBCDT504',
  description:
    'Big data characteristics, Hadoop and HDFS, MapReduce, HBase, stream data, Hive, Pig and Spark.',
  source: 'official',
  credits: 4,
  contactHours: '11 + 11 + 11 + 11',
  objectives: [
    'To provide an overview of storage, retrieval and processing of big data.',
    'To introduce the tools and techniques used to handle big data such as MapReduce, Hadoop, HBase, Pig, Hive and Spark.',
  ],
  outcomes: [
    'CO1 - Explain big data characteristics and the Hadoop ecosystem including HDFS.',
    'CO2 - Design MapReduce programs for parallel data processing.',
    'CO3 - Describe HBase, stream data models and stream processing techniques.',
    'CO4 - Use Hive, Pig and Spark for big data processing.',
  ],
  textbooks: [
    'Tom White, Hadoop: The Definitive Guide, O’Reilly.',
    'Big Data, Black Book, Dreamtech Press.',
  ],
  references: ['Holden Karau et al., Learning Spark, O’Reilly.'],
  note:
    'The printed KTU CSE (Data Science) curriculum and timetable list this course as PBCDT504 (PBL), which is the code used here.',
  modules: [
    {
      title: 'Introduction to Big Data and HDFS',
      hours: 11,
      description:
        'Evolution and characteristics of big data, RDBMS vs big data, Hadoop history and ecosystem, HDFS architecture, file operations and read/write anatomy.',
      topics: [
        {
          title: 'Big Data Fundamentals',
          subs: [
            note('Evolution of Big Data'),
            note('Big Data Characteristics'),
            note('RDBMS and Big Data'),
          ],
        },
        {
          title: 'Hadoop',
          subs: [
            note('History of Hadoop'),
            note('Hadoop Ecosystem and Core Components'),
          ],
        },
        {
          title: 'HDFS Architecture',
          subs: [
            note('Blocks, NameNodes and DataNodes'),
            note('Using HDFS Files and Basic File System Operations'),
            note('Hadoop Specific File Types'),
            note('Anatomy of a File Read and Write'),
          ],
        },
      ],
    },
    {
      title: 'MapReduce Programming',
      hours: 11,
      description:
        'MapReduce execution pipeline, runtime coordination and task management, parallel processing design and worked examples.',
      topics: [
        {
          title: 'MapReduce Execution',
          subs: [
            note('Execution Pipeline'),
            note('Runtime Coordination and Task Management'),
          ],
        },
        {
          title: 'Designing MapReduce Implementations',
          subs: [
            note('MapReduce as a Framework for Parallel Processing'),
            note('Simple Data Processing with MapReduce'),
          ],
        },
        {
          title: 'Worked Examples',
          subs: [
            note('Face Recognition Example'),
            note('Inverted Indexes Example'),
            note('Road Enrichment Example'),
          ],
        },
        {
          title: 'Projects',
          subs: [
            note('Projects using R'),
            note('Projects using Python'),
            note('Projects using Java'),
          ],
        },
      ],
    },
    {
      title: 'HBase and Stream Data Model',
      hours: 11,
      description:
        'HBase architecture and schema design, stream concepts and architecture, stream sampling, filtering and distinct element counting.',
      topics: [
        {
          title: 'HBase',
          subs: [note('HBase Architecture'), note('HBase Schema Design')],
        },
        {
          title: 'Stream Data',
          subs: [
            note('Introduction to Stream Concepts'),
            note('Stream Data Model and Architecture'),
            note('Sampling Data in a Stream'),
            note('Filtering Streams'),
            note('Counting Distinct Elements in a Stream'),
          ],
        },
      ],
    },
    {
      title: 'Hive, Pig and Spark',
      hours: 11,
      description:
        'Hive features and HiveQL, Pig data model and Pig Latin, Spark storage layers, core concepts and RDD operations.',
      topics: [
        {
          title: 'Hive',
          subs: [
            note('Hive Features'),
            note('Data Types and File Formats'),
            note('Primitive and Collection Data Types'),
            note('HiveQL - Creating Tables'),
            note('HiveQL - Dropping Tables'),
            note('HiveQL - Alter Table'),
          ],
        },
        {
          title: 'Pig',
          subs: [note('Pig Data Model'), note('Pig Latin Structure'), note('Pig Latin Functions')],
        },
        {
          title: 'Spark',
          subs: [
            note('Storage Layers for Spark'),
            note('Core Spark Concepts'),
            note('RDD Basics'),
            note('RDD Operations'),
          ],
        },
      ],
    },
  ],
};
