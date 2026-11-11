// Data Analytics Lab (PCCDL508) experiments, from the official lab manual.
// R experiments are written from scratch: no mean(), var(), cov(), cor(),
// lm(), glm(), knn(), naiveBayes(), svm() or rpart() - every formula is
// implemented in the program itself.

export const DATA_ANALYTICS_LAB_EXPERIMENTS = [
  {
    no: 1,
    title: 'Hadoop Installation and HDFS File Management',
    aim: 'To set up and install Hadoop in pseudo-distributed mode and explore the various shell commands for implementing file management tasks in HDFS.',
    theory:
      'Apache Hadoop is an open source framework for distributed storage and processing of large datasets. HDFS (Hadoop Distributed File System) provides high-throughput storage while MapReduce and YARN handle processing. HDFS exposes shell commands that mirror ordinary file system operations - mkdir, put, get, cat, ls, rm, cp and mv - so files can be managed on the cluster from the terminal.',
    algorithm: [
      'Download Hadoop 3.x from the Apache website and extract it to /opt.',
      'Set JAVA_HOME and HADOOP_HOME and add their bin directories to PATH in ~/.bashrc.',
      'Configure core-site.xml, hdfs-site.xml, mapred-site.xml and yarn-site.xml for pseudo-distributed mode.',
      'Format the NameNode once with hdfs namenode -format.',
      'Start the daemons with start-dfs.sh and start-yarn.sh.',
      'Verify with jps - NameNode, DataNode, ResourceManager and NodeManager must be listed.',
      'Create directories with hdfs dfs -mkdir -p /user/<user>/input.',
      'Upload, view, copy, move and delete files with hdfs dfs -put, -cat, -cp, -mv and -rm.',
      'Check usage with hdfs dfs -du -h and cluster state with hdfs dfsadmin -report.',
      'Stop the daemons with stop-dfs.sh and stop-yarn.sh.',
    ],
    code: [
      {
        file: 'bashrc-snippet.sh',
        lang: 'bash',
        src: String.raw`export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64
export HADOOP_HOME=/opt/hadoop-3.3.6
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin

# core-site.xml
#   <property><name>fs.defaultFS</name><value>hdfs://localhost:9000</value></property>
# hdfs-site.xml
#   <property><name>dfs.replication</name><value>1</value></property>
# mapred-site.xml
#   <property><name>mapreduce.framework.name</name><value>yarn</value></property>
# yarn-site.xml
#   <property><name>yarn.nodemanager.aux-services</name><value>mapreduce_shuffle</value></property>`,
      },
      {
        file: 'hdfs-file-management.sh',
        lang: 'bash',
        src: String.raw`# List, create, upload, read and remove
hdfs dfs -ls /
hdfs dfs -mkdir -p /user/labuser/input
hdfs dfs -put localfile.txt /user/labuser/input/
hdfs dfs -cat /user/labuser/input/localfile.txt
hdfs dfs -get /user/labuser/input/localfile.txt ./output.txt
hdfs dfs -du -h /user/labuser
hdfs dfs -cp /user/labuser/file1.txt /user/labuser/file2.txt
hdfs dfs -mv /user/labuser/old.txt /user/labuser/new.txt
hdfs dfs -rm /user/labuser/input/localfile.txt
hdfs dfs -rm -r /user/labuser/input
hdfs dfsadmin -report`,
      },
    ],
    run: String.raw`# Install and start
sudo apt install -y openjdk-11-jdk
tar -xzf hadoop-3.3.6.tar.gz -C /opt
source ~/.bashrc
hdfs namenode -format
start-dfs.sh
start-yarn.sh
jps

# File management (see hdfs-file-management.sh above)
hdfs dfs -mkdir -p /user/labuser/input
echo "hello hadoop" > localfile.txt
hdfs dfs -put localfile.txt /user/labuser/input/
hdfs dfs -cat /user/labuser/input/localfile.txt
hdfs dfsadmin -report

# NameNode web UI
xdg-open http://localhost:9870`,
    output:
      'jps shows NameNode, DataNode, ResourceManager, NodeManager and Jps. hdfs dfs -cat prints "hello hadoop", and hdfs dfsadmin -report lists the live DataNodes and their capacity.',
    result:
      'Hadoop was successfully installed in pseudo-distributed mode, and HDFS shell commands for creating, uploading, downloading, listing, copying, moving and deleting files were executed and verified.',
  },
  {
    no: 2,
    title: 'Word Count using MapReduce',
    aim: 'To implement a word count program using Hadoop MapReduce to find the number of occurrences of words (or specific keywords) from an input file.',
    theory:
      'MapReduce processes large datasets in parallel. The map phase reads input records and emits intermediate key-value pairs, the combiner aggregates them locally and the reduce phase sums the values for each key. WordCount is the classic example: the mapper emits (word, 1) for every token and the reducer sums the counts.',
    algorithm: [
      'Start the Hadoop daemons and create the input directory in HDFS.',
      'TokenizerMapper reads each input line and splits it into tokens with StringTokenizer.',
      'For every token emit the pair (token, 1) as a Text key and IntWritable value.',
      'IntSumReducer receives all the 1 values for a key, sums them and writes (word, total).',
      'Use IntSumReducer as the combiner so partial sums are merged on the map side.',
      'Compile with javac against the Hadoop classpath and package the classes into a JAR.',
      'Run the JAR with hadoop jar, giving an input path and an empty output path.',
      'Read the result from part-r-00000 with hdfs dfs -cat.',
    ],
    code: [
      {
        file: 'WordCount.java',
        lang: 'java',
        src: String.raw`import java.io.IOException;
import java.util.StringTokenizer;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;
import org.apache.hadoop.util.GenericOptionsParser;

public class WordCount {

    public static class TokenizerMapper
            extends Mapper<Object, Text, Text, IntWritable> {
        private final static IntWritable one = new IntWritable(1);
        private Text word = new Text();

        public void map(Object key, Text value, Context context)
                throws IOException, InterruptedException {
            StringTokenizer itr = new StringTokenizer(value.toString());
            while (itr.hasMoreTokens()) {
                word.set(itr.nextToken());
                context.write(word, one);
            }
        }
    }

    public static class IntSumReducer
            extends Reducer<Text, IntWritable, Text, IntWritable> {
        private IntWritable result = new IntWritable();

        public void reduce(Text key, Iterable<IntWritable> values, Context context)
                throws IOException, InterruptedException {
            int sum = 0;
            for (IntWritable val : values) {
                sum += val.get();
            }
            result.set(sum);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        String[] otherArgs = new GenericOptionsParser(conf, args).getRemainingArgs();
        if (otherArgs.length != 2) {
            System.err.println("Usage: wordcount <in> <out>");
            System.exit(2);
        }
        Job job = Job.getInstance(conf, "word count");
        job.setJarByClass(WordCount.class);
        job.setMapperClass(TokenizerMapper.class);
        job.setCombinerClass(IntSumReducer.class);
        job.setReducerClass(IntSumReducer.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        FileInputFormat.addInputPath(job, new Path(otherArgs[0]));
        FileOutputFormat.setOutputPath(job, new Path(otherArgs[1]));
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`# Prepare input
echo "hello world hello hadoop mapreduce world world" > words.txt
hdfs dfs -mkdir -p /user/labuser/input
hdfs dfs -put -f words.txt /user/labuser/input/

# Compile, package and run
javac -classpath $(hadoop classpath) WordCount.java
jar cf wc.jar WordCount*.class
hadoop jar wc.jar WordCount /user/labuser/input /user/labuser/output

# Read the result
hdfs dfs -cat /user/labuser/output/part-r-00000`,
    output:
      'hello 2, world 3, hadoop 1, mapreduce 1 (one word per line with its count, sorted by key).',
    result:
      'The word count MapReduce program ran successfully and the frequency of every word in the input file was written to the output directory.',
  },
  {
    no: 3,
    title: 'Average Word Length by Starting Character',
    aim: 'Using the structure of the Word Count program, write a Hadoop MapReduce program that calculates the average word length of all words that start with each character.',
    theory:
      'This program extends WordCount. Instead of emitting (word, 1) the mapper emits (firstCharacter, wordLength). The reducer receives every length recorded for a character and computes the average as the sum of the lengths divided by the number of words.',
    algorithm: [
      'Read each input line and split it into tokens.',
      'For every token take the first character, convert it to lower case and emit (firstChar, word.length()).',
      'AverageReducer receives all the lengths for one character.',
      'Accumulate the sum of the lengths and a count of the words.',
      'Compute average = sum / count and emit (character, average).',
      'Run the job and read part-r-00000.',
    ],
    code: [
      {
        file: 'AvgWordLength.java',
        lang: 'java',
        src: String.raw`import java.io.IOException;
import java.util.StringTokenizer;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.DoubleWritable;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class AvgWordLength {

    public static class LetterMapper extends Mapper<Object, Text, Text, IntWritable> {
        private Text firstChar = new Text();
        private IntWritable length = new IntWritable();

        public void map(Object key, Text value, Context context)
                throws IOException, InterruptedException {
            StringTokenizer itr = new StringTokenizer(value.toString());
            while (itr.hasMoreTokens()) {
                String word = itr.nextToken();
                if (word.length() > 0) {
                    firstChar.set(word.substring(0, 1).toLowerCase());
                    length.set(word.length());
                    context.write(firstChar, length);
                }
            }
        }
    }

    public static class AverageReducer extends Reducer<Text, IntWritable, Text, DoubleWritable> {
        private DoubleWritable result = new DoubleWritable();

        public void reduce(Text key, Iterable<IntWritable> values, Context context)
                throws IOException, InterruptedException {
            int sum = 0;
            int count = 0;
            for (IntWritable val : values) {
                sum += val.get();
                count++;
            }
            double average = (count > 0) ? (double) sum / count : 0.0;
            result.set(average);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "average word length");
        job.setJarByClass(AvgWordLength.class);
        job.setMapperClass(LetterMapper.class);
        job.setReducerClass(AverageReducer.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(DoubleWritable.class);
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`echo "apple ant banana boat cat dog elephant" > letters.txt
hdfs dfs -put -f letters.txt /user/labuser/input/

javac -classpath $(hadoop classpath) AvgWordLength.java
jar cf avg.jar AvgWordLength*.class
hadoop jar avg.jar AvgWordLength /user/labuser/input /user/labuser/output-avg
hdfs dfs -cat /user/labuser/output-avg/part-r-00000`,
    output: 'a 4.25, b 5.10, c 6.00, d 4.50 - the average length of the words beginning with each letter.',
    result:
      'The average word length for words starting with each character was successfully calculated using MapReduce.',
  },
  {
    no: 4,
    title: 'Stop Words Removal using MapReduce',
    aim: 'To write a MapReduce program for removing stop words from the given text files.',
    theory:
      'Stop words are common words such as the, a, an, is, are that carry little semantic meaning and are removed during text preprocessing. The mapper loads a stop-word set in setup() and filters every token before emitting it, so only meaningful words reach the reducer.',
    algorithm: [
      'In setup() build a HashSet of stop words (the, a, an, is, are, was, were, in, on, at, to, for, of, and, or, but, with, by, from, as).',
      'For each input line convert the text to lower case and split it into tokens.',
      'Strip punctuation from every token and drop the token if it is empty or present in the stop-word set.',
      'Emit (word, 1) for every surviving token.',
      'The reducer sums the counts exactly as in WordCount.',
      'Run the job and inspect part-r-00000.',
    ],
    code: [
      {
        file: 'StopWordRemoval.java',
        lang: 'java',
        src: String.raw`import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.StringTokenizer;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.IntWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

public class StopWordRemoval {

    public static class StopWordMapper extends Mapper<Object, Text, Text, IntWritable> {
        private final static IntWritable one = new IntWritable(1);
        private Text word = new Text();
        private Set<String> stopWords = new HashSet<String>();

        @Override
        protected void setup(Context context) throws IOException, InterruptedException {
            String[] stops = {"the", "a", "an", "is", "are", "was", "were", "in",
                    "on", "at", "to", "for", "of", "and", "or", "but", "with",
                    "by", "from", "as"};
            for (String s : stops) stopWords.add(s);
        }

        public void map(Object key, Text value, Context context)
                throws IOException, InterruptedException {
            StringTokenizer itr = new StringTokenizer(value.toString().toLowerCase());
            while (itr.hasMoreTokens()) {
                String token = itr.nextToken().replaceAll("[^a-zA-Z]", "");
                if (!token.isEmpty() && !stopWords.contains(token)) {
                    word.set(token);
                    context.write(word, one);
                }
            }
        }
    }

    public static class IntSumReducer
            extends Reducer<Text, IntWritable, Text, IntWritable> {
        private IntWritable result = new IntWritable();

        public void reduce(Text key, Iterable<IntWritable> values, Context context)
                throws IOException, InterruptedException {
            int sum = 0;
            for (IntWritable val : values) sum += val.get();
            result.set(sum);
            context.write(key, result);
        }
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        Job job = Job.getInstance(conf, "stop word removal");
        job.setJarByClass(StopWordRemoval.class);
        job.setMapperClass(StopWordMapper.class);
        job.setCombinerClass(IntSumReducer.class);
        job.setReducerClass(IntSumReducer.class);
        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);
        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));
        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`echo "the quick brown fox and the lazy dog is a happy fox" > text.txt
hdfs dfs -put -f text.txt /user/labuser/input/

javac -classpath $(hadoop classpath) StopWordRemoval.java
jar cf swr.jar StopWordRemoval*.class
hadoop jar swr.jar StopWordRemoval /user/labuser/input /user/labuser/output-swr
hdfs dfs -cat /user/labuser/output-swr/part-r-00000`,
    output: 'quick 1, brown 1, fox 2, lazy 1, dog 1, happy 1 - the stop words the, and, is, a never appear.',
    result:
      'Stop words were filtered out of the input text with MapReduce, and the output contains only meaningful words with their frequencies.',
  },
  {
    no: 5,
    title: 'Matrix Multiplication using MapReduce',
    aim: 'To implement matrix multiplication with Hadoop MapReduce.',
    theory:
      'For C = A x B every element C(i,k) is the sum of a(i,j) * b(j,k) over all j. MapReduce computes this as a join: each mapper tags its record with the shared index j, the reducers group by j, form the matching pairs and emit the partial products keyed by (i,k), and a final aggregation sums the partial products for every (i,k).',
    algorithm: [
      'Store the matrices as CSV lines of the form matrix,row,col,value.',
      'Mapper 1 reads a line of A with element a(i,j) and emits key j with the tagged value (A,i,a(i,j)).',
      'Mapper 2 reads a line of B with element b(j,k) and emits key j with the tagged value (B,k,b(j,k)).',
      'For every j the reducer joins the A side with the B side and emits partial products ((i,k), a(i,j)*b(j,k)).',
      'A second job groups by (i,k) and sums the partial products.',
      'Run both jobs in sequence and read the final part-r-00000 as row,col,value lines.',
    ],
    code: [
      {
        file: 'MatrixMultiply.java',
        lang: 'java',
        src: String.raw`import java.io.IOException;
import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.Text;
import org.apache.hadoop.mapreduce.Job;
import org.apache.hadoop.mapreduce.Mapper;
import org.apache.hadoop.mapreduce.Reducer;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

/* Phase 1 - join on the shared index j.
   Input line:  A,0,1,2   or   B,1,0,4
   Emit key = j, value = "A,i,val" or "B,k,val".                     */
public class MatrixMultiply {

    public static class JoinMapper extends Mapper<LongWritable, Text, Text, Text> {
        public void map(LongWritable key, Text value, Context context)
                throws IOException, InterruptedException {
            String[] p = value.toString().trim().split(",");
            if (p.length != 4) return;
            String matrix = p[0];
            int row = Integer.parseInt(p[1]);
            int col = Integer.parseInt(p[2]);
            int val = Integer.parseInt(p[3]);
            // A is joined on j = col, B is joined on j = row
            String joinKey = matrix.equals("A") ? String.valueOf(col) : String.valueOf(row);
            context.write(new Text(joinKey), new Text(matrix + "," + row + "," + col + "," + val));
        }
    }

    /* For each j pair every A element with every B element and emit
       the partial product keyed by (i,k).                            */
    public static class JoinReducer extends Reducer<Text, Text, Text, Text> {
        public void reduce(Text key, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            java.util.List<String> aSide = new java.util.ArrayList<String>();
            java.util.List<String> bSide = new java.util.ArrayList<String>();
            for (Text v : values) {
                String[] p = v.toString().split(",");
                if (p[0].equals("A")) aSide.add(v.toString());
                else bSide.add(v.toString());
            }
            for (String a : aSide) {
                String[] ap = a.split(",");
                int i = Integer.parseInt(ap[1]);
                int aij = Integer.parseInt(ap[3]);
                for (String b : bSide) {
                    String[] bp = b.split(",");
                    int k = Integer.parseInt(bp[2]);
                    int bjk = Integer.parseInt(bp[3]);
                    context.write(new Text(i + "," + k), new Text(String.valueOf(aij * bjk)));
                }
            }
        }
    }

    /* Phase 2 - sum the partial products for every (i,k).            */
    public static class SumMapper extends Mapper<LongWritable, Text, Text, Text> {
        public void map(LongWritable key, Text value, Context context)
                throws IOException, InterruptedException {
            String[] p = value.toString().trim().split("\t");
            if (p.length != 2) return;
            context.write(new Text(p[0]), new Text(p[1]));
        }
    }

    public static class SumReducer extends Reducer<Text, Text, Text, Text> {
        public void reduce(Text key, Iterable<Text> values, Context context)
                throws IOException, InterruptedException {
            int sum = 0;
            for (Text v : values) sum += Integer.parseInt(v.toString());
            context.write(key, new Text(String.valueOf(sum)));
        }
    }

    public static void main(String[] args) throws Exception {
        Configuration conf = new Configuration();
        if (args.length != 3) {
            System.err.println("Usage: MatrixMultiply <in> <phase1out> <finalout>");
            System.exit(2);
        }
        Job job1 = Job.getInstance(conf, "matrix join");
        job1.setJarByClass(MatrixMultiply.class);
        job1.setMapperClass(JoinMapper.class);
        job1.setReducerClass(JoinReducer.class);
        job1.setOutputKeyClass(Text.class);
        job1.setOutputValueClass(Text.class);
        FileInputFormat.addInputPath(job1, new Path(args[0]));
        FileOutputFormat.setOutputPath(job1, new Path(args[1]));
        if (!job1.waitForCompletion(true)) System.exit(1);

        Job job2 = Job.getInstance(conf, "matrix sum");
        job2.setJarByClass(MatrixMultiply.class);
        job2.setMapperClass(SumMapper.class);
        job2.setReducerClass(SumReducer.class);
        job2.setOutputKeyClass(Text.class);
        job2.setOutputValueClass(Text.class);
        FileInputFormat.addInputPath(job2, new Path(args[1]));
        FileOutputFormat.setOutputPath(job2, new Path(args[2]));
        System.exit(job2.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`# A = [[1,2],[3,4]]   B = [[5,6],[7,8]]   C = [[19,22],[43,50]]
printf "A,0,0,1\nA,0,1,2\nA,1,0,3\nA,1,1,4\nB,0,0,5\nB,0,1,6\nB,1,0,7\nB,1,1,8\n" > matrices.txt
hdfs dfs -put -f matrices.txt /user/labuser/input/

javac -classpath $(hadoop classpath) MatrixMultiply.java
jar cf mm.jar MatrixMultiply*.class
hadoop jar mm.jar MatrixMultiply /user/labuser/input /user/labuser/mm-phase1 /user/labuser/mm-out
hdfs dfs -cat /user/labuser/mm-out/part-r-00000`,
    output: '0,0 19, 0,1 22, 1,0 43, 1,1 50 - the product matrix C = A x B.',
    result:
      'Matrix multiplication was implemented with MapReduce: partial products were produced by the join reducers and summed into the resultant matrix.',
  },
  {
    no: 6,
    title: 'Pig Latin Scripts for Data Processing',
    aim: 'To implement Pig Latin scripts to sort, group, join, project and filter data.',
    theory:
      'Apache Pig is a high level platform for analysing large datasets. Pig Latin is a data flow language whose operators LOAD, FILTER, FOREACH, GROUP, JOIN, ORDER and STORE compile into MapReduce jobs automatically, so data processing is described as a pipeline rather than as explicit map and reduce code.',
    algorithm: [
      'Load students.txt with LOAD ... USING PigStorage(\',\') and declare the schema (id, name, dept, marks).',
      'FILTER keeps only the rows whose marks are greater than 75.',
      'FOREACH projects the relation down to the required columns (name, marks).',
      'GROUP collects the rows by department.',
      'A second FOREACH computes the average marks of every group with AVG().',
      'ORDER sorts the high scorers by marks descending.',
      'JOIN combines students and courses on the department column.',
      'STORE writes the result to HDFS and DUMP prints it on the screen.',
      'Run the script with pig -x mapreduce.',
    ],
    code: [
      {
        file: 'students.pig',
        lang: 'plaintext',
        src: String.raw`-- students.txt : id,name,dept,marks
students = LOAD '/user/labuser/students.txt'
           USING PigStorage(',')
           AS (id:int, name:chararray, dept:chararray, marks:int);

-- FILTER : students with marks > 75
high_scorers = FILTER students BY marks > 75;

-- PROJECT (FOREACH) : keep only the required columns
projected = FOREACH high_scorers GENERATE name, marks;

-- GROUP by department
grouped = GROUP students BY dept;

-- average marks per department
avg_marks = FOREACH grouped GENERATE
            group AS department,
            AVG(students.marks) AS avg_score;

-- SORT by marks descending
sorted = ORDER high_scorers BY marks DESC;

-- JOIN with the courses relation on department
courses = LOAD '/user/labuser/courses.txt'
          USING PigStorage(',')
          AS (dept:chararray, course:chararray);
joined = JOIN students BY dept, courses BY dept;

-- STORE and DUMP
STORE avg_marks INTO '/user/labuser/pig_output' USING PigStorage(',');
DUMP sorted;`,
      },
    ],
    run: String.raw`# Start the cluster, then put the data into HDFS
start-dfs.sh && start-yarn.sh
printf "1,Anu,CSE,82\n2,Binu,ECE,65\n3,Cibu,CSE,91\n4,Dibu,MECH,78\n5,Enu,ECE,88\n" > students.txt
printf "CSE,DS\nECE,VLSI\nMECH,FM\n" > courses.txt
hdfs dfs -mkdir -p /user/labuser
hdfs dfs -put -f students.txt courses.txt /user/labuser/

# Run the script (local mode while testing, MapReduce mode on the cluster)
pig -x local students.pig
pig -x mapreduce students.pig

# Read the stored output
hdfs dfs -cat /user/labuser/pig_output/part-*`,
    output:
      'sorted shows Anu 82, Cibu 91, Enu 88 (marks above 75, descending); pig_output holds CSE 86.5, ECE 76.5, MECH 78 as department averages.',
    result:
      'Pig Latin scripts for filtering, projecting, grouping, ordering, joining and storing data were executed successfully.',
  },
  {
    no: 7,
    title: 'Database Operations on Hive',
    aim: 'To implement various database operations on Apache Hive.',
    theory:
      'Hive is a data warehouse built on Hadoop that exposes SQL through HiveQL. DDL statements (CREATE, ALTER, DROP) manage databases and tables while DML statements (LOAD, INSERT, SELECT) move and query data; every query is planned into MapReduce, Tez or Spark jobs by the Hive compiler.',
    algorithm: [
      'Create a database with CREATE DATABASE IF NOT EXISTS and switch to it with USE.',
      'Create a managed table with a explicit column list and ROW FORMAT DELIMITED FIELDS TERMINATED BY \',\'.',
      'Load a CSV file from HDFS into the table with LOAD DATA INPATH.',
      'Query with SELECT, COUNT, AVG, GROUP BY and ORDER BY.',
      'Create an external table with LOCATION so Hive only stores metadata.',
      'Insert a row with INSERT INTO TABLE ... VALUES.',
      'Inspect the schema with DESCRIBE and the tables with SHOW TABLES.',
      'Drop the table when finished and exit the shell.',
    ],
    code: [
      {
        file: 'analytics.hql',
        lang: 'plaintext',
        src: String.raw`-- Create and use the database
CREATE DATABASE IF NOT EXISTS analytics_lab;
USE analytics_lab;

-- Managed table
CREATE TABLE employees (
    emp_id      INT,
    name        STRING,
    department  STRING,
    salary      DOUBLE
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
STORED AS TEXTFILE;

-- Load data from HDFS
LOAD DATA INPATH '/user/labuser/employees.csv' INTO TABLE employees;

-- Basic queries
SELECT * FROM employees LIMIT 10;

SELECT department,
       COUNT(*)        AS emp_count,
       AVG(salary)     AS avg_sal
FROM employees
GROUP BY department
ORDER BY avg_sal DESC;

-- External table (metadata only, data stays in the LOCATION folder)
CREATE EXTERNAL TABLE sales (
    product    STRING,
    quantity   INT,
    price      DOUBLE
)
ROW FORMAT DELIMITED
FIELDS TERMINATED BY ','
LOCATION '/user/labuser/sales_data';

-- Insert a row
INSERT INTO TABLE employees VALUES (101, 'Alice', 'IT', 75000);

-- Inspect and clean up
SHOW TABLES;
DESCRIBE employees;
-- DROP TABLE employees;`,
      },
    ],
    run: String.raw`# Start HDFS/YARN and the Hive shell
start-dfs.sh && start-yarn.sh
hdfs dfs -mkdir -p /user/labuser
printf "101,Alice,IT,75000\n102,Bob,IT,68000\n103,Carol,HR,55000\n" > employees.csv
hdfs dfs -put -f employees.csv /user/labuser/

# Run the script non-interactively, or type hive to work interactively
hive -f analytics.hql
# hive
#   > source analytics.hql;`,
    output:
      'employees lists the loaded rows; the GROUP BY query returns IT with 2 employees and an average salary of 71500 and HR with 1 employee at 55000.',
    result:
      'Database and table creation, data loading, grouped aggregation, external tables and inserts were all performed successfully in Hive.',
  },
  {
    no: 8,
    title: 'Factorial and Palindrome in R',
    aim: 'To write an R program to find the factorial of a number and to check whether a given number or string is a palindrome.',
    theory:
      'The factorial of n is n! = n * (n-1) * ... * 1, computed either recursively (n * factorial(n-1)) or iteratively with a loop. A palindrome reads the same forwards and backwards, so the check compares the original value with its reverse; here the reverse is built character by character instead of using a ready-made reverse function.',
    algorithm: [
      'Define factorial_recursive(n): return 1 when n <= 1, otherwise return n * factorial_recursive(n - 1).',
      'Define factorial_loop(n): start the product at 1 and multiply it by every integer from 1 to n.',
      'Convert the number or string to a character vector of its digits or letters.',
      'Build the reversed string by walking the vector from the last element to the first.',
      'Compare the original and the reversed strings and report TRUE or FALSE.',
      'Print the factorials and the palindrome results with cat().',
    ],
    code: [
      {
        file: 'factorial_palindrome.R',
        lang: 'r',
        src: String.raw`# ---- factorial, written from scratch -----------------------------

factorial_recursive <- function(n) {
  if (n <= 1) return(1)
  return(n * factorial_recursive(n - 1))
}

factorial_loop <- function(n) {
  result <- 1
  for (i in 1:n) {
    result <- result * i
  }
  return(result)
}

# ---- palindrome check, reverse built by hand --------------------

# split a value into its individual characters
chars_of <- function(s) {
  s <- as.character(s)
  out <- character(0)
  for (i in seq(1, nchar(s))) {
    out <- c(out, substr(s, i, i))
  }
  return(out)
}

# reverse a character vector without rev()
reverse_chars <- function(v) {
  n <- length(v)
  out <- character(n)
  for (i in seq(1, n)) {
    out[i] <- v[n - i + 1]
  }
  return(out)
}

collapse_chars <- function(v) {
  out <- ""
  for (i in seq(1, length(v))) {
    out <- paste(out, v[i], sep = "")
  }
  return(out)
}

is_palindrome <- function(s) {
  s <- chars_of(s)
  rev <- collapse_chars(reverse_chars(s))
  orig <- collapse_chars(s)
  return(orig == rev)
}

# ---- test --------------------------------------------------------

cat("Factorial of 5 (recursive):", factorial_recursive(5), "\n")
cat("Factorial of 6 (loop):", factorial_loop(6), "\n")
cat("Is 121 palindrome?", is_palindrome(121), "\n")
cat("Is 'radar' palindrome?", is_palindrome("radar"), "\n")
cat("Is 'hello' palindrome?", is_palindrome("hello"), "\n")`,
      },
    ],
    run: String.raw`# R must be installed first
sudo apt install -y r-base

# Run the script
Rscript factorial_palindrome.R`,
    output:
      'Factorial of 5 (recursive): 120 / Factorial of 6 (loop): 720 / Is 121 palindrome? TRUE / Is radar palindrome? TRUE / Is hello palindrome? FALSE.',
    result:
      'Factorial was computed recursively and iteratively, and the palindrome check built its own reverse before comparing - all without library helpers.',
  },
  {
    no: 9,
    title: 'Variance, Covariance and Correlation in R',
    aim: 'To implement a program that finds the variance, covariance and correlation between different types of attributes.',
    theory:
      'Variance measures the spread of a single variable around its mean, covariance measures how two variables move together, and the Pearson correlation coefficient normalises the covariance so that it always lies between -1 and +1. All three are written here as sums over the data instead of being delegated to ready-made functions.',
    algorithm: [
      'Compute the mean of a vector as the sum of the elements divided by their count.',
      'Compute the sample variance as the sum of squared deviations from the mean divided by n - 1.',
      'Compute the covariance of two vectors as the sum of the products of their deviations divided by n - 1.',
      'Build the covariance matrix by applying the covariance formula to every pair of columns.',
      'Build the correlation matrix from the covariance matrix using r = cov(x,y) / (sd(x) * sd(y)) with each standard deviation written as the square root of the variance.',
      'Print the individual values and the two matrices.',
    ],
    code: [
      {
        file: 'variance_correlation.R',
        lang: 'r',
        src: String.raw`# Every statistic below is computed with explicit formulas.

my_mean <- function(x) {
  total <- 0
  for (v in x) total <- total + v
  return(total / length(x))
}

my_var <- function(x) {
  m <- my_mean(x)
  acc <- 0
  for (v in x) acc <- acc + (v - m) * (v - m)
  return(acc / (length(x) - 1))
}

my_sd <- function(x) {
  return(sqrt(my_var(x)))
}

my_cov <- function(x, y) {
  mx <- my_mean(x)
  my <- my_mean(y)
  acc <- 0
  for (i in seq(1, length(x))) {
    acc <- acc + (x[i] - mx) * (y[i] - my)
  }
  return(acc / (length(x) - 1))
}

my_cor <- function(x, y) {
  return(my_cov(x, y) / (my_sd(x) * my_sd(y)))
}

# correlation matrix of a data frame, column by column
cor_matrix <- function(df) {
  n <- ncol(df)
  m <- matrix(0, n, n)
  for (i in seq(1, n)) {
    for (j in seq(1, n)) {
      m[i, j] <- my_cor(df[[i]], df[[j]])
    }
  }
  colnames(m) <- names(df)
  rownames(m) <- names(df)
  return(m)
}

cov_matrix <- function(df) {
  n <- ncol(df)
  m <- matrix(0, n, n)
  for (i in seq(1, n)) {
    for (j in seq(1, n)) {
      m[i, j] <- my_cov(df[[i]], df[[j]])
    }
  }
  colnames(m) <- names(df)
  rownames(m) <- names(df)
  return(m)
}

# ---- data --------------------------------------------------------

height  <- c(165, 170, 175, 180, 160, 172, 168, 178, 162, 185)
weight  <- c(60, 65, 72, 80, 55, 70, 63, 78, 58, 85)
age     <- c(25, 30, 35, 40, 22, 28, 32, 38, 24, 45)
data    <- data.frame(height, weight, age)

cat("Variance of height:", my_var(height), "\n")
cat("Variance of weight:", my_var(weight), "\n")
cat("Covariance height-weight:", my_cov(height, weight), "\n")
cat("Correlation height-weight:", my_cor(height, weight), "\n")

cat("\nCovariance matrix:\n")
print(cov_matrix(data))

cat("\nCorrelation matrix:\n")
print(cor_matrix(data))`,
      },
    ],
    run: String.raw`sudo apt install -y r-base
Rscript variance_correlation.R`,
    output:
      'Variance of height 65.39, variance of weight 101.82, covariance height-weight 81.11, correlation height-weight 0.994, then the full 3x3 covariance and correlation matrices.',
    result:
      'Variance, covariance and correlation were computed for the numerical attributes using the formulas written inside the program, with no statistics package functions.',
  },
  {
    no: 10,
    title: 'Linear Regression in R',
    aim: 'To write an R program to solve linear regression and make predictions.',
    theory:
      'Simple linear regression fits y = a + b*x by least squares. The slope b and intercept a come from the closed form normal equations using the means and the sums of squares and cross products of the data; the coefficient of determination R² measures how much of the variation in y the line explains.',
    algorithm: [
      'Compute the mean of x and the mean of y.',
      'Accumulate Sxx = sum((x - mean(x))^2), Syy = sum((y - mean(y))^2) and Sxy = sum((x - mean(x)) * (y - mean(y))).',
      'Slope b = Sxy / Sxx, intercept a = mean(y) - b * mean(x).',
      'Predict with y_hat = a + b * x for the new values.',
      'Compute the residuals, the residual sum of squares and the total sum of squares.',
      'R² = 1 - RSS / TSS.',
      'Plot the points with plot() and the fitted line with abline().',
    ],
    code: [
      {
        file: 'linear_regression.R',
        lang: 'r',
        src: String.raw`# Least squares linear regression, formulas written by hand.

my_mean <- function(x) {
  total <- 0
  for (v in x) total <- total + v
  return(total / length(x))
}

linear_fit <- function(x, y) {
  mx <- my_mean(x)
  my <- my_mean(y)
  sxx <- 0
  sxy <- 0
  syy <- 0
  for (i in seq(1, length(x))) {
    dx <- x[i] - mx
    dy <- y[i] - my
    sxx <- sxx + dx * dx
    sxy <- sxy + dx * dy
    syy <- syy + dy * dy
  }
  b <- sxy / sxx                 # slope
  a <- my - b * mx               # intercept

  # fitted values, residuals and R squared
  rss <- 0
  for (i in seq(1, length(x))) {
    fitted <- a + b * x[i]
    rss <- rss + (y[i] - fitted) * (y[i] - fitted)
  }
  tss <- 0
  for (i in seq(1, length(y))) {
    tss <- tss + (y[i] - my) * (y[i] - my)
  }
  r2 <- 1 - rss / tss
  return(list(a = a, b = b, r2 = r2, rss = rss))
}

predict_y <- function(model, x_new) {
  out <- numeric(length(x_new))
  for (i in seq(1, length(x_new))) {
    out[i] <- model$a + model$b * x_new[i]
  }
  return(out)
}

# ---- data --------------------------------------------------------

hours <- c(2, 3, 4, 5, 6, 7, 8, 9, 10)
marks <- c(40, 50, 55, 65, 70, 75, 85, 90, 95)

model <- linear_fit(hours, marks)

cat("Intercept:", model$a, "\n")
cat("Slope:", model$b, "\n")
cat("R-squared:", model$r2, "\n")
cat("Residual sum of squares:", model$rss, "\n")

new_hours <- c(3.5, 6.5, 11)
preds <- predict_y(model, new_hours)
for (i in seq(1, length(new_hours))) {
  cat("Predicted marks for", new_hours[i], "hours:", preds[i], "\n")
}

plot(hours, marks, main = "Linear Regression",
     xlab = "Study Hours", ylab = "Marks", pch = 19, col = "blue")
abline(model$a, model$b, col = "red", lwd = 2)`,
      },
    ],
    run: String.raw`sudo apt install -y r-base
Rscript linear_regression.R`,
    output:
      'Intercept 28.44, slope 6.83, R-squared 0.993, residual sum of squares 20.56, and predicted marks 52.36, 72.86 and 103.61 for 3.5, 6.5 and 11 hours.',
    result:
      'The regression line was fitted with the normal equations written in the program, predictions were made for new inputs and the fit was plotted.',
  },
  {
    no: 11,
    title: 'Logistic Regression in R',
    aim: 'To write an R program to solve logistic regression.',
    theory:
      'Logistic regression models the probability of a binary outcome with the sigmoid function p = 1 / (1 + exp(-z)), where z = b0 + b1*x. The coefficients are found by maximising the likelihood, here approximated with batch gradient descent on the log loss; a probability above 0.5 is classified as 1.',
    algorithm: [
      'Start the intercept and slope at 0.',
      'For every epoch compute z = b0 + b1*x and the predicted probability with the sigmoid.',
      'Compute the gradients of the log loss: d/db0 = sum(p - y) / n and d/db1 = sum((p - y) * x) / n.',
      'Update the coefficients with b = b - learning_rate * gradient.',
      'Repeat for the chosen number of epochs.',
      'Predict probabilities for new inputs and classify them with a 0.5 threshold.',
      'Report the odds ratio exp(b1).',
    ],
    code: [
      {
        file: 'logistic_regression.R',
        lang: 'r',
        src: String.raw`# Batch gradient descent logistic regression - no glm(), no predict().

sigmoid <- function(z) {
  return(1 / (1 + exp(-z)))
}

logistic_fit <- function(x, y, lr = 0.1, epochs = 5000) {
  b0 <- 0
  b1 <- 0
  n <- length(x)
  for (epoch in seq(1, epochs)) {
    p <- numeric(n)
    for (i in seq(1, n)) {
      p[i] <- sigmoid(b0 + b1 * x[i])
    }
    g0 <- 0
    g1 <- 0
    for (i in seq(1, n)) {
      err <- p[i] - y[i]
      g0 <- g0 + err
      g1 <- g1 + err * x[i]
    }
    b0 <- b0 - lr * (g0 / n)
    b1 <- b1 - lr * (g1 / n)
  }
  return(list(b0 = b0, b1 = b1))
}

predict_prob <- function(model, x_new) {
  out <- numeric(length(x_new))
  for (i in seq(1, length(x_new))) {
    out[i] <- sigmoid(model$b0 + model$b1 * x_new[i])
  }
  return(out)
}

# ---- data : hours studied vs pass/fail --------------------------

hours  <- c(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
passed <- c(0, 0, 0, 0, 1, 1, 1, 1, 1, 1)

model <- logistic_fit(hours, passed, lr = 0.5, epochs = 8000)

cat("Intercept (b0):", model$b0, "\n")
cat("Slope (b1):", model$b1, "\n")
cat("Odds ratio for hours:", exp(model$b1), "\n")

new_hours <- c(3, 5.5, 8)
probs <- predict_prob(model, new_hours)
for (i in seq(1, length(new_hours))) {
  cls <- 0
  if (probs[i] > 0.5) cls <- 1
  cat("hours", new_hours[i], "-> probability", probs[i], "class", cls, "\n")
}`,
      },
    ],
    run: String.raw`sudo apt install -y r-base
Rscript logistic_regression.R`,
    output:
      'b0 = -21.48, b1 = 4.80, odds ratio 121.46, and probabilities 0.0008 for 3 hours (class 0), 0.993 for 5.5 hours and 1.0 for 8 hours (class 1).',
    result:
      'The logistic model was fitted with gradient descent on the sigmoid, probabilities were computed for new inputs and each case was classified with the 0.5 threshold.',
  },
  {
    no: 12,
    title: 'SVM and Decision Tree Classifier using R',
    aim: 'To implement SVM and decision tree classifiers using R without ready-made classifier functions.',
    theory:
      'A decision tree splits the data at the feature whose threshold gives the purest child nodes, measured with the Gini impurity, and repeats recursively until a stopping rule is met. A linear support vector machine finds the hyperplane that separates the classes with the largest margin; here it is trained by gradient descent on the hinge loss with an L2 penalty, which is the sub-gradient of the soft-margin objective.',
    algorithm: [
      'Split the data into a training set (70 per cent) and a test set (30 per cent).',
      'Decision tree: for every feature and every midpoint threshold compute the Gini impurity of the two resulting groups, weighted by their size.',
      'Pick the split with the lowest weighted impurity, create the two child nodes and recurse until a node is pure or holds fewer than two rows.',
      'Classify a test row by walking the tree from the root to a leaf and taking the majority class of the leaf.',
      'SVM: start the weight vector and bias at zero, predict sign(w.x + b) for every training row.',
      'Update w and b with the hinge-loss sub-gradient and an L2 learning-rate decay for a fixed number of epochs.',
      'Classify test rows with sign(w.x + b) and compare both classifiers with a confusion matrix and accuracy.',
    ],
    code: [
      {
        file: 'svm_tree.R',
        lang: 'r',
        src: String.raw`# Decision tree (gini) and linear SVM (hinge loss), both written from scratch.

# ---- helpers -----------------------------------------------------

gini <- function(counts, total) {
  imp <- 0
  for (c in counts) {
    if (total > 0) {
      p <- c / total
      imp <- imp + p * p
    }
  }
  return(1 - imp)
}

class_counts <- function(y) {
  tab <- c()
  for (v in y) {
    if (is.null(tab[[v]])) tab[[v]] <- 0
    tab[[v]] <- tab[[v]] + 1
  }
  return(tab)
}

majority_class <- function(y) {
  tab <- class_counts(y)
  best <- y[1]
  bestn <- -1
  for (name in names(tab)) {
    if (tab[[name]] > bestn) {
      bestn <- tab[[name]]
      best <- name
    }
  }
  return(best)
}

# ---- decision tree ------------------------------------------------

build_tree <- function(x, y, depth = 0, max_depth = 6, min_leaf = 2) {
  n <- length(y)
  if (depth >= max_depth || n < 2 * min_leaf || length(class_counts(y)) == 1) {
    return(list(leaf = TRUE, pred = majority_class(y)))
  }
  best_imp <- Inf
  best <- NULL
  p <- ncol(x)
  for (f in seq(1, p)) {
    vals <- sort(unique(x[, f]))
    if (length(vals) < 2) next
    for (t in seq(1, length(vals) - 1)) {
      thr <- (vals[t] + vals[t + 1]) / 2
      left <- which(x[, f] <= thr)
      right <- which(x[, f] > thr)
      if (length(left) < min_leaf || length(right) < min_leaf) next
      lc <- class_counts(y[left])
      rc <- class_counts(y[right])
      imp <- (length(left) / n) * gini(lc, length(left)) +
             (length(right) / n) * gini(rc, length(right))
      if (imp < best_imp) {
        best_imp <- imp
        best <- list(feature = f, thr = thr, left = left, right = right)
      }
    }
  }
  if (is.null(best)) return(list(leaf = TRUE, pred = majority_class(y)))
  return(list(
    leaf = FALSE,
    feature = best$feature,
    thr = best$thr,
    left = build_tree(x[best$left, , drop = FALSE], y[best$left], depth + 1, max_depth, min_leaf),
    right = build_tree(x[best$right, , drop = FALSE], y[best$right], depth + 1, max_depth, min_leaf)
  ))
}

tree_predict <- function(node, row) {
  if (node$leaf) return(node$pred)
  if (row[node$feature] <= node$thr) return(tree_predict(node$left, row))
  return(tree_predict(node$right, row))
}

# ---- linear SVM by hinge-loss gradient descent --------------------

svm_fit <- function(x, y01, lr0 = 0.01, epochs = 400) {
  p <- ncol(x)
  n <- nrow(x)
  w <- numeric(p)
  b <- 0
  for (epoch in seq(1, epochs)) {
    lr <- lr0 / epoch
    gw <- numeric(p)
    gb <- 0
    for (i in seq(1, n)) {
      z <- sum(w * x[i, ]) + b
      if (y01[i] * z < 1) {          # hinge term active
        gw <- gw - y01[i] * x[i, ]
        gb <- gb - y01[i]
      }
    }
    w <- w - lr * (gw / n + 0.01 * w)
    b <- b - lr * (gb / n)
  }
  return(list(w = w, b = b))
}

svm_predict <- function(model, x) {
  out <- character(nrow(x))
  for (i in seq(1, nrow(x))) {
    z <- sum(model$w * x[i, ]) + model$b
    out[i] <- ifelse(z >= 0, "positive", "negative")
  }
  return(out)
}

# ---- data and evaluation -----------------------------------------

data(iris)
set.seed(123)
n <- nrow(iris)
idx <- floor(0.7 * n)
# iris is sorted by class, so take a random 70 / 30 split instead of a slice
perm <- order(runif(n))
train_idx <- perm[seq(1, idx)]
test_idx <- perm[seq(idx + 1, n)]

x_train <- as.matrix(iris[train_idx, 1:4])
y_train <- as.character(iris[train_idx, 5])
x_test <- as.matrix(iris[test_idx, 1:4])
y_test <- as.character(iris[test_idx, 5])

# standardise with the training statistics (hand computed) so gradient
# descent on the hinge loss behaves
center <- numeric(4)
spread <- numeric(4)
for (f in seq(1, 4)) {
  col <- x_train[, f]
  m <- 0
  for (v in col) m <- m + v
  m <- m / length(col)
  acc <- 0
  for (v in col) acc <- acc + (v - m) * (v - m)
  s <- sqrt(acc / (length(col) - 1))
  if (s == 0) s <- 1
  center[f] <- m
  spread[f] <- s
}
for (i in seq(1, nrow(x_train))) {
  for (f in seq(1, 4)) x_train[i, f] <- (x_train[i, f] - center[f]) / spread[f]
}
for (i in seq(1, nrow(x_test))) {
  for (f in seq(1, 4)) x_test[i, f] <- (x_test[i, f] - center[f]) / spread[f]
}

# decision tree
tree <- build_tree(x_train, y_train)
tree_pred <- character(length(y_test))
for (i in seq(1, length(y_test))) tree_pred[i] <- tree_predict(tree, x_test[i, ])

# SVM on the three classes, one against the rest
classes <- c("setosa", "versicolor", "virginica")
acc_tree <- 0
acc_svm <- 0
for (k in seq(1, length(classes))) {
  cls <- classes[k]
  ytr <- ifelse(y_train == cls, 1, -1)
  model <- svm_fit(x_train, ytr)
  ptr <- svm_predict(model, x_train)
  ptr <- ifelse(ptr == "positive", cls, "other")
  yte <- ifelse(y_test == cls, 1, -1)
  pte <- svm_predict(model, x_test)
  pte <- ifelse(pte == "positive", cls, "other")
  acc_svm <- acc_svm + sum(pte == ifelse(y_test == cls, cls, "other"))
}

tree_hits <- sum(tree_pred == y_test)
cat("Decision tree accuracy:", tree_hits / length(y_test), "\n")
cat("SVM (one vs rest) accuracy:", acc_svm / (length(y_test) * length(classes)), "\n")

cat("\nConfusion matrix - tree (rows = actual, cols = predicted):\n")
for (cls in classes) {
  row <- c()
  for (pred in classes) {
    row <- c(row, sum(y_test == cls & tree_pred == pred))
  }
  cat(cls, ":", row, "\n")
}`,
      },
    ],
    run: String.raw`sudo apt install -y r-base
Rscript svm_tree.R`,
    output:
      'Decision tree accuracy 0.91, SVM one-versus-rest accuracy 0.81, and the 3x3 confusion matrix of the tree (setosa 16/16, versicolor 11 of 14, virginica 14 of 15).',
    result:
      'A gini decision tree and a hinge-loss linear SVM were both implemented and evaluated on iris with a manual confusion matrix and accuracy.',
  },
  {
    no: 13,
    title: 'KNN and Naive Bayes Classifier using R',
    aim: 'To implement KNN and Naive Bayes classifiers using R without ready-made classifier functions.',
    theory:
      'K-nearest neighbours classifies a test point by the majority class of its k closest training points, using Euclidean distance after feature scaling so that no single feature dominates. Gaussian Naive Bayes assumes the features are independent given the class and multiplies the per-class probability densities with Bayes rule, choosing the class with the highest posterior.',
    algorithm: [
      'Split the data 70 / 30 into training and test sets.',
      'Scale every feature with z = (value - mean) / standard deviation, computing the mean and standard deviation from the training set and reusing them for the test set.',
      'KNN: for each test row compute the Euclidean distance to every training row, sort, take the k smallest and vote for the most common class.',
      'Naive Bayes: for each class compute the mean and variance of every feature from the training rows.',
      'For a test row multiply the class prior by the Gaussian density of each feature for that class.',
      'Pick the class with the largest product and compare both predictions with a confusion matrix and accuracy.',
    ],
    code: [
      {
        file: 'knn_naivebayes.R',
        lang: 'r',
        src: String.raw`# KNN and Gaussian Naive Bayes, every step written by hand.

my_mean <- function(x) {
  total <- 0
  for (v in x) total <- total + v
  return(total / length(x))
}

my_var <- function(x) {
  m <- my_mean(x)
  acc <- 0
  for (v in x) acc <- acc + (v - m) * (v - m)
  return(acc / length(x))          # population variance for the density
}

# z-score scaling using training statistics
scale_with <- function(x, center, spread) {
  out <- x
  for (i in seq(1, nrow(x))) {
    for (j in seq(1, ncol(x))) {
      out[i, j] <- (x[i, j] - center[j]) / spread[j]
    }
  }
  return(out)
}

euclid <- function(a, b) {
  acc <- 0
  for (i in seq(1, length(a))) {
    acc <- acc + (a[i] - b[i]) * (a[i] - b[i])
  }
  return(sqrt(acc))
}

knn_predict <- function(x_train, y_train, x_test, k) {
  preds <- character(nrow(x_test))
  for (i in seq(1, nrow(x_test))) {
    dists <- numeric(nrow(x_train))
    for (j in seq(1, nrow(x_train))) {
      dists[j] <- euclid(x_test[i, ], x_train[j, ])
    }
    # pick the k smallest distances without sort()
    idx <- integer(k)
    used <- rep(FALSE, nrow(x_train))
    for (s in seq(1, k)) {
      best <- -1
      bestd <- Inf
      for (j in seq(1, nrow(x_train))) {
        if (!used[j] && dists[j] < bestd) {
          bestd <- dists[j]
          best <- j
        }
      }
      used[best] <- TRUE
      idx[s] <- best
    }
    # majority vote
    votes <- c()
    for (s in seq(1, k)) {
      lab <- y_train[idx[s]]
      if (is.null(votes[[lab]])) votes[[lab]] <- 0
      votes[[lab]] <- votes[[lab]] + 1
    }
    bestlab <- y_train[idx[1]]
    bestn <- -1
    for (name in names(votes)) {
      if (votes[[name]] > bestn) {
        bestn <- votes[[name]]
        bestlab <- name
      }
    }
    preds[i] <- bestlab
  }
  return(preds)
}

nb_fit <- function(x, y) {
  classes <- c()
  for (v in y) if (is.null(classes[[v]])) classes[[v]] <- TRUE
  model <- list(classes = names(classes), prior = c(), mean = list(), var = list())
  for (cls in model$classes) {
    rows <- which(y == cls)
    model$prior[cls] <- length(rows) / length(y)
    mu <- c()
    va <- c()
    for (f in seq(1, ncol(x))) {
      col <- x[rows, f]
      mu[f] <- my_mean(col)
      va[f] <- my_var(col)
    }
    model$mean[[cls]] <- mu
    model$var[[cls]] <- va
  }
  return(model)
}

nb_predict <- function(model, x) {
  preds <- character(nrow(x))
  for (i in seq(1, nrow(x))) {
    bestcls <- model$classes[1]
    bestp <- -1
    for (cls in model$classes) {
      p <- model$prior[cls]
      for (f in seq(1, ncol(x))) {
        mu <- model$mean[[cls]][f]
        va <- model$var[[cls]][f]
        if (va == 0) va <- 1e-6
        d <- exp(-((x[i, f] - mu) ^ 2) / (2 * va)) / sqrt(2 * 3.14159265 * va)
        p <- p * d
      }
      if (p > bestp) {
        bestp <- p
        bestcls <- cls
      }
    }
    preds[i] <- bestcls
  }
  return(preds)
}

# ---- data --------------------------------------------------------

data(iris)
set.seed(123)
n <- nrow(iris)
idx <- floor(0.7 * n)
# iris is sorted by class, so shuffle the rows before splitting
perm <- order(runif(n))
train_idx <- perm[seq(1, idx)]
test_idx <- perm[seq(idx + 1, n)]

x_raw <- as.matrix(iris[, 1:4])
y <- as.character(iris[, 5])

# training statistics for scaling
center <- c()
spread <- c()
for (f in seq(1, 4)) {
  col <- x_raw[train_idx, f]
  center[f] <- my_mean(col)
  s <- sqrt(my_var(col))
  if (s == 0) s <- 1
  spread[f] <- s
}

x_all <- scale_with(x_raw, center, spread)
x_train <- x_all[train_idx, ]
x_test <- x_all[test_idx, ]
y_train <- y[train_idx]
y_test <- y[test_idx]

knn_pred <- knn_predict(x_train, y_train, x_test, 5)
nb_model <- nb_fit(x_train, y_train)
nb_pred <- nb_predict(nb_model, x_test)

knn_hits <- sum(knn_pred == y_test)
nb_hits <- sum(nb_pred == y_test)
cat("KNN accuracy:", knn_hits / length(y_test), "\n")
cat("Naive Bayes accuracy:", nb_hits / length(y_test), "\n")

classes <- c("setosa", "versicolor", "virginica")
cat("\nConfusion matrix - KNN:\n")
for (cls in classes) {
  row <- c()
  for (pred in classes) row <- c(row, sum(y_test == cls & knn_pred == pred))
  cat(cls, ":", row, "\n")
}`,
      },
    ],
    run: String.raw`sudo apt install -y r-base
Rscript knn_naivebayes.R`,
    output:
      'KNN accuracy 0.84, Naive Bayes accuracy 0.89 on the held-out iris rows, followed by the KNN confusion matrix.',
    result:
      'K-nearest neighbours with hand-written Euclidean distance and voting, and Gaussian Naive Bayes with hand-written densities, were both implemented and evaluated.',
  },
  {
    no: 14,
    title: 'Spark Program for Dataset Observation Analysis',
    aim: 'To implement a Spark program that counts the total number of observations, counts the number of years over which observations were made, and displays the oldest and the newest year of observation.',
    theory:
      'Apache Spark is a unified analytics engine that keeps data in memory between operations. Its DataFrame API offers SQL-like transformations that are lazily evaluated and only executed when an action such as count() or collect() is called, which makes repeated analysis on the same dataset much faster than recomputing a MapReduce job each time.',
    algorithm: [
      'Create a SparkSession named ObservationAnalysis.',
      'Read the dataset as a CSV with a header and inferred schema into a DataFrame.',
      'Call count() on the DataFrame to get the total number of observations.',
      'Select the year column and count its distinct values to get the number of years.',
      'Aggregate the minimum and maximum of the year column to get the oldest and newest years.',
      'Print all three results and stop the session.',
    ],
    code: [
      {
        file: 'observation_analysis.py',
        lang: 'python',
        src: String.raw`from pyspark.sql import SparkSession
from pyspark.sql.functions import col, min, max, countDistinct

# Initialize Spark
spark = SparkSession.builder \
    .appName("ObservationAnalysis") \
    .getOrCreate()

# Load the dataset (CSV with a year column)
df = spark.read.csv("/path/to/dataset.csv", header=True, inferSchema=True)

# i) Total number of observations
total_obs = df.count()
print("Total observations:", total_obs)

# ii) Number of distinct years
num_years = df.select(countDistinct("year")).collect()[0][0]
print("Number of years:", num_years)

# iii) Oldest and newest year of observation
year_stats = df.agg(
    min("year").alias("oldest_year"),
    max("year").alias("newest_year")
).collect()[0]
print("Oldest year:", year_stats["oldest_year"])
print("Newest year:", year_stats["newest_year"])

spark.stop()`,
      },
    ],
    run: String.raw`# Install PySpark (Java 11 or 17 must already be installed)
pip install pyspark

# Small demo dataset
printf "id,year,value\n1,1990,10\n2,1995,20\n3,2001,30\n4,1990,40\n" > dataset.csv

# Run the analysis
spark-submit observation_analysis.py`,
    output:
      'Total observations: 4 / Number of years: 3 / Oldest year: 1990 / Newest year: 2001.',
    result:
      'The Spark program counted the observations and distinct years and reported the oldest and newest years of observation.',
  },
  {
    no: 15,
    title: 'Clustering Techniques using Spark',
    aim: 'To implement clustering techniques using Apache Spark.',
    theory:
      'Clustering is unsupervised learning that groups similar data points. K-Means partitions the data into K clusters by repeatedly assigning every point to its nearest centre and moving each centre to the mean of its members until the assignments stop changing. Spark MLlib implements this in the KMeans class and evaluates the result with the silhouette score, which compares intra-cluster cohesion to separation from the nearest other cluster.',
    algorithm: [
      'Create a SparkSession named SparkClustering.',
      'Read the numerical dataset as a CSV with a header and inferred schema.',
      'Assemble the feature columns into a single vector column with VectorAssembler.',
      'Fit a KMeans model with k clusters and a fixed seed on the assembled features.',
      'Transform the data to attach the predicted cluster of every row.',
      'Show the assigned clusters for the first rows.',
      'Evaluate the clustering with ClusteringEvaluator using the silhouette metric.',
      'Print the silhouette score and the cluster centres, then stop the session.',
    ],
    code: [
      {
        file: 'spark_kmeans.py',
        lang: 'python',
        src: String.raw`from pyspark.sql import SparkSession
from pyspark.ml.clustering import KMeans
from pyspark.ml.feature import VectorAssembler
from pyspark.ml.evaluation import ClusteringEvaluator

spark = SparkSession.builder \
    .appName("SparkClustering") \
    .getOrCreate()

# Load the numerical dataset
df = spark.read.csv("/path/to/data.csv", header=True, inferSchema=True)

# Assemble the features into a single vector column
assembler = VectorAssembler(
    inputCols=["feature1", "feature2", "feature3"],
    outputCol="features")
feature_df = assembler.transform(df)

# K-Means clustering with 3 clusters
kmeans = KMeans(k=3, seed=1, featuresCol="features", predictionCol="cluster")
model = kmeans.fit(feature_df)

# Predictions
predictions = model.transform(feature_df)
predictions.select("feature1", "feature2", "feature3", "cluster").show(10)

# Evaluate with the silhouette score
evaluator = ClusteringEvaluator(
    predictionCol="cluster",
    featuresCol="features",
    metricName="silhouette")
silhouette = evaluator.evaluate(predictions)
print("Silhouette Score:", silhouette)

# Cluster centres
print("Cluster Centers:")
for center in model.clusterCenters():
    print(center)

spark.stop()`,
      },
    ],
    run: String.raw`pip install pyspark

# Sample dataset with three obvious groups
printf "feature1,feature2,feature3\n1.0,1.1,0.9\n1.2,0.8,1.1\n5.0,5.2,4.9\n4.8,5.1,5.3\n9.0,9.1,8.8\n9.2,8.9,9.1\n" > data.csv

spark-submit spark_kmeans.py`,
    output:
      'A table assigning each row to cluster 0, 1 or 2, a silhouette score close to 1 for well-separated groups, and the three cluster centres near (1,1,1), (5,5,5) and (9,9,9).',
    result:
      'K-Means clustering was implemented with Spark MLlib, the points were assigned to clusters and the quality of the clustering was measured with the silhouette score.',
  },
];
