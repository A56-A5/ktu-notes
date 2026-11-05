// Study notes for PCCDT504 Big Data Processing (KTU 2024 Scheme, Semester 5).
// Original summaries written for this notebook, aligned with the official
// module topics. They are ordinary editable notes, not locked content.

const n = (intro, points, exam = '') =>
  `<p>${intro}</p><h3>Key points</h3><ul>${points
    .map((p) => `<li>${p}</li>`)
    .join('')}</ul>${
    exam ? `<blockquote><p><strong>Exam focus.</strong> ${exam}</p></blockquote>` : ''
  }`;

const fig = (src, caption, width = 100) =>
  `<p><img src="/diagrams/bd/${src}" alt="${caption}" data-width="${width}"><br><em>${caption}</em></p>`;

const M1 = {
  'Evolution of Big Data': n(
    'Big data grew out of the explosion of digital data produced by the web, mobile devices, sensors and logs.',
    [
      'Data volumes have grown from gigabytes to petabytes and exabytes in a few decades.',
      'Sources: social media, clickstreams, IoT sensors, transactions, scientific instruments and logs.',
      'Traditional RDBMS struggled with the volume, velocity and variety, driving new distributed systems.',
      'Google\'s 2003–2006 papers (GFS, MapReduce, BigTable) inspired Hadoop and NoSQL.',
      'Cost curves favour commodity hardware + software scale-out over expensive scale-up servers.',
    ],
    'Trace the triggers (web/IoT/social) and the limits of RDBMS that motivated distributed storage/compute.'
  ),
  'Big Data Characteristics': n(
    'Big data is characterised by the "V"s, most commonly volume, velocity, variety, veracity and value.',
    [
      '<strong>Volume:</strong> very large data sizes (terabytes to petabytes).',
      '<strong>Velocity:</strong> high speed of arrival and required processing.',
      '<strong>Variety:</strong> structured, semi-structured and unstructured types.',
      '<strong>Veracity:</strong> uncertainty and noise in the data.',
      '<strong>Value:</strong> the useful insight extracted.',
      'The combination - not any single V - defines big data; small data can be high-velocity.',
    ],
    'List and define the V\'s, then say which system property each demands (HDFS, streaming, schema-on-read, etc.).'
  ),
  'RDBMS and Big Data': n(
    'RDBMSs were designed for structured, moderately sized, strongly consistent transactional data; big data breaks those assumptions.',
    [
      'RDBMS enforces a fixed schema (schema-on-write) - costly for varied, evolving data.',
      'Vertical scaling (bigger server) is expensive and has a ceiling.',
      'ACID transactions are hard to distribute across thousands of nodes.',
      'Joins over billions of rows are slow under normalised schemas.',
      'NoSQL and Hadoop use schema-on-read, sharding and scale-out to cope; the right choice depends on the workload.',
    ],
    'Contrast schema-on-write vs schema-on-read and scale-up vs scale-out; don\'t claim RDBMS is "obsolete".'
  ),
  'History of Hadoop': n(
    'Hadoop began as an open-source clone of Google\'s GFS and MapReduce and grew into an ecosystem.',
    [
      'Doug Cutting built Lucene (1999) and Nutch (2002); the GFS/MapReduce papers (2003/2004) inspired Hadoop.',
      'Yahoo! hired Cutting (2006); Hadoop split out of Nutch and became an Apache project in 2006.',
      'Hadoop 1 had HDFS + MapReduce; Hadoop 2 introduced YARN and separated scheduling from processing.',
      'Hadoop 3 improved erasure coding and multi-NameNode HA.',
      'Spark (2009, AMPLab) later superseded MapReduce for many workloads.',
    ],
    'Give the v1 → v2 → v3 progression and the key components; note that YARN decouples scheduling.'
  ),
  'Hadoop Ecosystem and Core Components': n(
    'Hadoop is a suite of projects around storage, processing and management.',
    [
      '<strong>HDFS</strong> - distributed file system with replicated blocks.',
      '<strong>MapReduce</strong> - batch processing framework.',
      '<strong>YARN</strong> - cluster resource manager.',
      '<strong>HBase</strong> - distributed column store; <strong>Hive</strong> - SQL-on-Hadoop; <strong>Pig</strong> - dataflow scripting.',
      '<strong>Sqoop/Flume/Kafka</strong> - ingestion; <strong>ZooKeeper</strong> - coordination; <strong>Oozie</strong> - workflows.',
      fig('hadoop-ecosystem.svg', 'The layered Hadoop ecosystem: ingestion, storage, processing, management.'),
    ],
    'Name each component and its role; group them into the ingestion/storage/processing/management layers.'
  ),
  'Blocks, NameNodes and DataNodes': n(
    'HDFS splits files into large blocks and manages them with a NameNode (metadata) and DataNodes (data).',
    [
      'Default block size is 128 MB; blocks are far larger than disk blocks to reduce metadata.',
      'Each block is replicated (default 3×) on different racks.',
      'The <strong>NameNode</strong> stores the namespace and block-to-location map; it does not hold data.',
      'DataNodes store blocks and send periodic heartbeats.',
      'Replication makes the system fault tolerant; a lost replica is re-replicated automatically.',
      fig('hdfs-arch.svg', 'HDFS with a NameNode and three DataNodes holding replicated blocks.'),
    ],
    'Explain why blocks are large and why replication is 3× across racks; the NameNode is a single point of failure.'
  ),
  'Using HDFS Files and Basic File System Operations': n(
    'HDFS offers a small file-system API plus a shell for the usual operations.',
    [
      'Shell: <code>hdfs dfs -put</code>, <code>-get</code>, <code>-ls</code>, <code>-cat</code>, <code>-mkdir</code>, <code>-rm</code>, <code>-du</code>.',
      'Java API: FileSystem.open/create/delete/rename/listStatus.',
      'HDFS is write-once, append-only - no random in-place edits.',
      'Permissions are POSIX-like but coarse; a superuser runs admin commands.',
      'The `hdfs fsck` tool checks block integrity and replica counts.',
    ],
    'List the common commands (put/get/ls/mkdir/rm) and state that HDFS is write-once/append-only.'
  ),
  'Hadoop Specific File Types': n(
    'Hadoop defines storage formats for different workloads.',
    [
      'SequenceFile - binary key/value pairs, supports block compression.',
      'Avro - row-based with a schema; Parquet and ORC - columnar formats optimised for query.',
      'Text/CSV - simple but parsing-heavy, no schema, poor for analytics.',
      'Columnar formats support predicate pushdown and compression (Hive/Spark).',
      'Choose format by access pattern; columnar is wrong for single-record writes.',
    ],
    'Classify format types and say which query pattern (row vs columnar) each suits.'
  ),
  'Anatomy of a File Read and Write': n(
    'HDFS reads and writes are pipelined through DataNodes with the NameNode consulted only for metadata.',
    [
      'Write: the client asks the NameNode for block locations, then streams packets to the first DataNode, which pipelines to replicas.',
      'Read: the client asks the NameNode for the block locations, then reads the nearest replica directly.',
      'Pipelines are chained; if a DataNode fails, the pipeline reconnects to another.',
      'Acknowledgements flow back through the pipeline; only metadata crosses the NameNode.',
      'This keeps the NameNode off the data path - the key scalability property.',
    ],
    'Describe the pipeline for write and read, and stress that data never flows through the NameNode.'
  ),
};

const M2 = {
  'Execution Pipeline': n(
    'A MapReduce job runs in phases: Map → Shuffle/Sort → Reduce, coordinated by the cluster scheduler.',
    [
      'The input is split into splits; each split is processed by one Map task.',
      'Map tasks emit (key, value) pairs written to a local circular buffer, spilled to disk as they grow.',
      'The framework partitions and sorts pairs by key (shuffle) so each reducer sees all values for a key.',
      'Reduce tasks merge, group and apply the reduce function, writing the output.',
      'Combiners perform local mini-reduction to cut shuffle traffic.',
      fig('mapreduce.svg', 'The MapReduce pipeline: Map, shuffle & sort, Reduce.'),
    ],
    'Draw the phases in order and state where each one runs (local vs framework) and where data is grouped.'
  ),
  'Runtime Coordination and Task Management': n(
    'The scheduler assigns tasks to nodes and recovers from failures automatically.',
    [
      'The JobTracker (MRv1) or ResourceManager (YARN) receives the job and asks the NameNode for block locations.',
      'Map tasks are placed on nodes that already hold the input split (data locality).',
      'TaskTrackers run tasks in slots and heartbeat their progress back.',
      'Failed tasks are retried elsewhere; the whole job is rescheduled after repeated failures.',
      'Because Map/Reduce are pure, re-execution cannot corrupt results.',
    ],
    'Explain data locality and task re-execution; give the retry threshold and why reruns are safe.'
  ),
  'MapReduce as a Framework for Parallel Processing': n(
    'MapReduce is a programming model and runtime that turns a simple pair of functions into a parallel distributed job.',
    [
      'The programmer writes only two functions: <code>map(k, v) → list(k′, v′)</code> and <code>reduce(k′, list(v′)) → list(k″, v″)</code>.',
      'The runtime handles partitioning, sorting, grouping, scheduling, failure and data locality.',
      'It suits embarrassingly parallel batch workloads, not interactive queries or iteration-heavy ML.',
      'Map tasks can run fully in parallel; reduces start only after all maps finish.',
      'Later frameworks (Spark, Flink) keep the model but add in-memory DAGs.',
    ],
    'State the contract of map and reduce and list what the runtime hides; mention the batch-only limitation.'
  ),
  'Simple Data Processing with MapReduce': n(
    'Simple analytics are expressed as pairs of map/reduce functions over records.',
    [
      'Word count: map emits (word, 1); reduce sums the 1s for each word.',
      'Maximum per key: map emits (key, value); reduce keeps the running max.',
      'Distinct count: map passes (value, 1); reduce sums distinct flag values; a combiner helps.',
      "Sorting: a range partitioner plus the framework's sort yields a sorted output.",
      'Join: map emits tagged records by key; reduce groups the tagged values and pairs them.',
    ],
    'Write the map and reduce functions for word count and max; the patterns generalise to most batch analytics.'
  ),
  'Face Recognition Example': n(
    'MapReduce applies a recognition pipeline (e.g. face detection) to a large set of images in parallel.',
    [
      'Map: each image split is processed independently - detect faces with a classifier (e.g. Viola-Jones, deep nets).',
      'The classification per image is embarrassingly parallel, so Map tasks scale linearly.',
      'Reduce: aggregate results (counts, metadata, dedup of detected faces).',
      'Data locality lets images be read from the local replica of HDFS.',
      'The pattern applies to any per-record transformation of media or documents.',
    ],
    'Show map=per-image detection and reduce=aggregation; this is the classic embarrassingly parallel case.'
  ),
  'Inverted Indexes Example': n(
    'MapReduce builds an inverted index over a document collection.',
    [
      'Map: for each document, emit (term, docId) for every term - possibly with positions for phrase queries.',
      'The shuffle groups all docIds by term automatically.',
      'Reduce: for each term, sort/merge the docIds into a posting list.',
      'A combiner merges duplicate (term, docId) pairs per mapper to cut traffic.',
      'The output is the standard term → posting-list index used by search engines.',
    ],
    'Give the map (term, docId) and reduce (build sorted posting list) functions; note the combiner.'
  ),
  'Road Enrichment Example': n(
    'Road enrichment joins raw GPS/vehicle data with static road-network reference data to enrich events.',
    [
      'Map: tag each GPS point with its segment/road using a spatial lookup against the reference set.',
      'A broadcast join keeps the small road table in memory on each mapper to avoid shuffling it.',
      'Reduce: aggregate enriched points per road segment (speeds, counts).',
      'This is a typical "reference-data enrichment" pattern in logistics and telematics.',
      'The join is the hard part - choose broadcast vs shuffle join by size.',
    ],
    'Explain the broadcast join and the enrich-in-map / aggregate-in-reduce pattern.'
  ),
  'Projects using R': n(
    'R is used for statistical modelling on top of big-data stores, typically via SparkR or the rhadoop stack.',
    [
      'SparkR/SparklyR expose DataFrames so R code runs distributed on Spark executors.',
      'The rhadoop stack (plyrmr, rmr2) provides MapReduce abstractions for R.',
      'R excels at prototyping statistical models; the distributed backend scales them out.',
      'Data is loaded once (parquet/CSV) and analysed with dplyr-like APIs.',
      'Know that R itself is single-threaded; scaling comes from the Spark engine.',
    ],
    'State the role of SparkR/SparklyR and that R gains scale from Spark, not from R itself.'
  ),
  'Projects using Python': n(
    'Python dominates big-data prototyping via PySpark, pandas-on-Spark and DataFrame APIs.',
    [
      "PySpark mirrors Spark's Scala API: <code>sc.textFile</code>, map/reduce, DataFrames, SQL.",
      'Python UDFs let you express custom logic; they cross a serialisation boundary so they are slower than native.',
      'pandas-on-Spark gives a pandas-like local API that executes on Spark.',
      'Jupyter notebooks are common for exploration and debugging.',
      'Production pipelines often mix Python UDFs with native DataFrame/SQL for speed.',
    ],
    'Write a small PySpark word count and say how pandas-on-Spark bridges the gap to the DataFrame model.'
  ),
  'Projects using Java': n(
    'Java is the native language of the Hadoop ecosystem and MapReduce.',
    [
      'Write Mapper/Reducer subclasses with Writable key/value types.',
      'Configure the job with Job API, set input/output formats and submit via the cluster.',
      'Hadoop and Spark are JVM-based, so Java code runs without a bridge.',
      'Java suits performance-critical pipeline code and enterprise integrations.',
      'The verbosity of Java MapReduce pushed Hive/Pig and Spark to the front.',
    ],
    'Outline the Mapper/Reducer class structure and the Job submission; know why Java gave way to higher-level tools.'
  ),
};

const M3 = {
  'HBase Architecture': n(
    'HBase is a distributed, column-oriented NoSQL database that runs on top of HDFS.',
    [
      'Data model: a sorted map - row key → {column family: [qualifier, timestamp] → value}.',
      'Tables split into <strong>regions</strong> served by <strong>RegionServers</strong>; the HMaster assigns regions.',
      'Each region keeps a <strong>MemStore</strong> (memory buffer) and a <strong>Write-Ahead Log (WAL)</strong> for durability.',
      'When a MemStore fills it is flushed to an <strong>HFile</strong> stored in HDFS; compactions merge HFiles.',
      'ZooKeeper tracks region locations; clients read/write directly to RegionServers.',
      fig('hbase.svg', 'HBase: clients, ZooKeeper, HMaster, RegionServers over HDFS.'),
    ],
    'Explain regions, MemStore/WAL flush and the read/write path; HBase is suited to wide, sparse, low-latency tables.'
  ),
  'HBase Schema Design': n(
    'Schema design in HBase is about row keys, column families and versioning.',
    [
      'The <strong>row key</strong> is a byte string; HBase orders rows lexicographically and shards by key range.',
      'Hotspotting: sequential keys concentrate writes on one region - use salt or hash prefixes.',
      'Design the key to co-locate related rows: key = (entity, timestamp reversed) is a common pattern.',
      'Column families hold related qualifiers; keep families few and co-read ones together.',
      'Cells are versioned by timestamp (maxVersions configurable); queries can read a snapshot.',
    ],
    'Justify a row-key design (salt/hash, ordering) and name the column-family trade-offs.'
  ),
  'Introduction to Stream Concepts': n(
    'A data stream is a continuous, ordered, unbounded sequence of items that arrives over time.',
    [
      'Streams are unbounded, so the full dataset cannot be stored; processing is one-pass over a sliding window.',
      'Sources: sensor readings, clickstreams, financial tick data, network logs, IoT devices.',
      'Processing must be fast and online, producing results as data arrives.',
      'Memory is bounded, so answers are usually approximate with probabilistic guarantees.',
      'Key tasks: sampling, filtering, counting, heavy-hitter and distinct-element estimation.',
    ],
    'Define a stream and state why approximations are unavoidable; the three constraints are unbounded data, one pass, bounded memory.'
  ),
  'Stream Data Model and Architecture': n(
    'A stream architecture has sources, a streaming engine and sinks, with a bounded-memory processing model.',
    [
      'Sources emit tuples continuously; the engine processes them with state held in memory or a store.',
      'Engines (Kafka Streams, Flink, Spark Streaming) support windows, aggregations and joins over streams.',
      'A <strong>window</strong> bounds the stream: tumbling (fixed), sliding (overlapping) or session windows.',
      'Time can be event time (embedded in data) or processing time (when seen).',
      'Bounded memory is enforced by windowing and sketches rather than by storing everything.',
      fig('stream.svg', 'Stream architecture: sources → processor → sink with bounded memory.'),
    ],
    'Name the three parts, define a window, and distinguish event time from processing time.'
  ),
  'Sampling Data in a Stream': n(
    'Reservoir sampling keeps a uniform random sample of size s from a stream of unknown length.',
    [
      'Keep the first s items in a reservoir; for the k-th item (k &gt; s), replace a random reservoir slot with probability s/k.',
      'Every item has probability s/k of being in the sample, so the sample is uniform.',
      'It needs only O(s) memory and one pass.',
      'The uniform sample answers statistical queries approximately.',
      'Contrast with biased sampling (first s items), which is not uniform.',
    ],
    'Write the reservoir rule and prove equal inclusion probabilities; give O(s) memory.'
  ),
  'Filtering Streams': n(
    'Filtering keeps items that belong to a set, using a Bloom filter when the set is huge.',
    [
      'A Bloom filter is a bit array with k hash functions; membership tests set or check bits.',
      'False positives are possible (all k bits happen to be set); false negatives are not.',
      'Insert: set the k hash positions. Query: answer yes only if all k positions are set.',
      'Error probability can be tuned with array size and k; it cannot be eliminated (no free lunch).',
      'Bloom filters are used in HBase, LevelDB and caches to avoid disk lookups.',
    ],
    'Describe insert/query, the false-positive trade-off, and why a hash table is impractical for huge sets.'
  ),
  'Counting Distinct Elements in a Stream': n(
    'Counting distinct items exactly needs too much memory; sketches approximate it.',
    [
      'The Flajolet-Martin (FM) sketch uses a random hash with trailing-zeros statistics to estimate distinct count.',
      'Let R = the maximum observed count of trailing zeros; the estimate is proportional to 2^R.',
      'Hash the element, look at the position of the rightmost 1-bit, and keep the max position over the stream.',
      'Averaging several independent FM sketches reduces variance.',
      'Exact counting needs O(number of distinct) memory - impossible for streams.',
    ],
    'Explain the FM estimator and why several averaged sketches are needed; give the O(log n) memory intuition.'
  ),
};

const M4 = {
  'Hive Features': n(
    'Hive turns SQL into MapReduce (or Spark/Tez) jobs over HDFS data, with a metastore for schema.',
    [
      'Users write <strong>HiveQL</strong>, a SQL dialect; the engine compiles it to a distributed job.',
      'The <strong>metastore</strong> holds table and partition metadata in a relational DB.',
      'SerDes map data files to tables; storage formats include text, Parquet, ORC and Avro.',
      'Partitioning and bucketing prune data for faster queries.',
      'It is batch-oriented (high latency); Apache Drill/Presto are alternatives for interactive SQL.',
    ],
    'Explain HiveQL → job compilation, the metastore and partitioning; note that Hive is not interactive SQL.'
  ),
  'Data Types and File Formats': n(
    'Hive tables read files whose format must match the declared schema.',
    [
      'TextFile, SequenceFile, RCFile, Parquet, ORC and Avro are supported as storage formats.',
      'Parquet/ORC (columnar) are fastest for analytics queries; Text is simplest for interchange.',
      'SERDE (Serializer/Deserializer) tells Hive how to parse the file rows.',
      "The table definition must match the data's delimiter/structure or queries return NULLs.",
    ],
    'Match each storage format to its use and explain why columnar formats speed up analytics.'
  ),
  'Primitive and Collection Data Types': n(
    'Hive types include primitive scalars and structured collections.',
    [
      'Primitives: TINYINT, SMALLINT, INT, BIGINT, FLOAT, DOUBLE, DECIMAL, BOOLEAN, STRING, DATE, TIMESTAMP.',
      'Collections: ARRAY&lt;T&gt;, MAP&lt;K,V&gt;, STRUCT&lt;fields&gt;, UNIONTYPE.',
      'Complex types are stored as delimited text or in columnar formats with proper SerDes.',
      'NULL is represented specially (often \\N); strings are UTF-8.',
    ],
    'Name the numeric/string primitives and the four collection types; give a STRUCT example.'
  ),
  'HiveQL - Creating Tables': n(
    'CREATE TABLE defines a table and its schema in the metastore.',
    [
      "Syntax: <code>CREATE TABLE t (col type, …) ROW FORMAT DELIMITED FIELDS TERMINATED BY ',' STORED AS textfile</code>.",
      'CREATE EXTERNAL TABLE links to an existing HDFS location without moving data.',
      'CREATE TABLE AS SELECT (CTAS) builds a table from a query.',
      'Partitions and bucketing clauses optimise later scans.',
    ],
    'Write a CREATE TABLE with delimiter + format and a CTAS; contrast internal vs external tables.'
  ),
  'HiveQL - Dropping Tables': n(
    'DROP TABLE removes a table and its metadata.',
    [
      '<code>DROP TABLE t</code> deletes the metadata and the data.',
      '<code>DROP TABLE t PURGE</code> bypasses the trash.',
      'Dropping an external table removes only the metadata, not the HDFS files.',
      'DROP TABLE IF EXISTS avoids errors when the table is absent.',
    ],
    'Contrast DROP on internal vs external tables and give the PURGE/IF EXISTS variants.'
  ),
  'HiveQL - Alter Table': n(
    'ALTER TABLE changes table metadata after creation.',
    [
      '<code>ALTER TABLE t RENAME TO t2</code>; ALTER TABLE t ADD/DROP COLUMNS; ALTER TABLE t CHANGE col new type.',
      'ALTER TABLE t ADD/DROP PARTITION manages partitions.',
      'ALTER TABLE t SET TBLPROPERTIES adjusts table properties.',
      'External tables can only change metadata, not the underlying files.',
    ],
    'Give RENAME, ADD/DROP PARTITION and ADD COLUMNS examples.'
  ),
  'Pig Data Model': n(
    'Pig is a high-level dataflow scripting platform on Hadoop; its language is Pig Latin.',
    [
      'The data model is loosely typed: scalars, maps, bags (unordered collections) and tuples.',
      'A <strong>bag</strong> is an unordered collection of tuples; a <strong>tuple</strong> is an ordered list of fields.',
      'Fields may be scalars, maps, bags or tuples, giving a flexible schema.',
      'Pig compiles Pig Latin into a DAG of MapReduce jobs.',
      'It is friendlier than raw MapReduce for ETL and exploration.',
    ],
    'Define tuple, bag and map and say how Pig Latin becomes MapReduce jobs.'
  ),
  'Pig Latin Structure': n(
    'Pig Latin programs are sequences of relational operations on named relations.',
    [
      "Statements like <code>records = LOAD 'input' USING PigStorage(',');</code> bind relations.",
      'Transformations: FILTER, FOREACH ... GENERATE, GROUP, ORDER BY, DISTINCT, JOIN.',
      'DUMP prints a relation; STORE saves it; DESCRIBE shows its schema.',
      'Expressions include arithmetic, comparisons and UDF calls.',
    ],
    'Write a small LOAD→FILTER→GROUP→DUMP pipeline.'
  ),
  'Pig Latin Functions': n(
    'Pig provides built-in functions and user-defined functions (UDFs).',
    [
      'Eval functions: UPPER, LOWER, SIZE, CONCAT, AVG, SUM, COUNT.',
      'Load/store functions: PigStorage, TextLoader, JsonLoader.',
      'UDFs can be written in Java, Python or JavaScript via DEFINE.',
      'FILTER/STAT functions evaluate per tuple and per group.',
    ],
    'Name the function classes and give one eval + one load/store example.'
  ),
  'Storage Layers for Spark': n(
    'Spark reads from and writes to many storage layers; it is not tied to HDFS.',
    [
      'File systems: HDFS, S3, Azure Data Lake, GCS, local FS.',
      'Structured sources: Parquet, ORC, JSON, CSV, Avro via DataSource API.',
      'Message buses: Kafka, Kinesis, and socket streams for streaming.',
      'Data stores: JDBC (Postgres/MySQL), Cassandra, HBase, Elasticsearch.',
      'Parquet is the default analytics format because of columnar efficiency.',
    ],
    'List a storage layer per category and justify Parquet as the analytics default.'
  ),
  'Core Spark Concepts': n(
    'Spark is a unified in-memory analytics engine built around resilient distributed datasets.',
    [
      'A <strong>driver</strong> runs the user program and coordinates executors.',
      '<strong>Executors</strong> run tasks on cluster nodes and cache data in memory.',
      'The cluster manager (Standalone, YARN, Mesos, Kubernetes) allocates resources.',
      'APIs: RDD (low level), DataFrame/Dataset (structured), SQL, MLlib, GraphX, Structured Streaming.',
      'In-memory caching makes iterative and interactive workloads fast.',
    ],
    'Explain driver/executor split and why caching beats MapReduce for iteration.'
  ),
  'RDD Basics': n(
    'An RDD is an immutable, partitioned, fault-tolerant collection of records.',
    [
      'RDDs are created by loading data (sc.textFile, spark.read) or transforming existing RDDs.',
      'They are lazy: transformations record lineage but nothing runs until an action.',
      'Lineage (the DAG of transformations) lets Spark recompute lost partitions after failures.',
      'Partitions enable parallel processing; partition count controls parallelism.',
      fig('spark-rdd.svg', 'RDD lineage, shuffle stage boundaries and the lazy-evaluation model.'),
    ],
    'Define the four RDD properties and contrast lazy transformations with actions.'
  ),
  'RDD Operations': n(
    'RDD operations divide into transformations (lazy) and actions (eager).',
    [
      'Transformations: map, flatMap, filter, distinct, union, sample, groupByKey, reduceByKey, join.',
      'Actions: collect, count, reduce, take, first, saveAsTextFile, foreach.',
      'Narrow transformations (map, filter) touch one partition; wide ones (reduceByKey) shuffle.',
      'reduceByKey is preferred over groupByKey because it merges locally first.',
      'Caching (persist/cache) keeps hot RDDs in memory across actions.',
    ],
    'Classify operations into narrow/wide and transformation/action; give reduceByKey over groupByKey reasoning.'
  ),
};

export const BD_NOTES = { ...M1, ...M2, ...M3, ...M4 };
