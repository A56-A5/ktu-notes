// Data Analytics Lab (PCCDL508) experiments, from the official lab manual.
// R experiments are written from scratch: no mean(), var(), cov(), cor(),
// lm(), glm(), knn(), naiveBayes(), svm() or rpart(), and no data(),
// runif(), order(), sort(), which() or ifelse() either - every
// formula, data set and train/test split lives in the program itself.

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
      'MapperClass reads each input line and splits it into tokens with StringTokenizer.',
      'Every token is lower cased and written as the pair (word, 1) - a Text key with an IntWritable value.',
      'ReducerClass receives all the 1 values for a key, sums them and writes (word, total).',
      'Compile with javac against the Hadoop classpath; MapperClass and ReducerClass are compiled together with WordCount.',
      'Package the three class files into a JAR with jar cf.',
      'Run the JAR with hadoop jar, giving an input path and an empty output path.',
      'Read the result from part-r-00000 with hdfs dfs -cat.',
    ],
    code: [
      {
        file: 'WordCount.java',
        lang: 'java',
        src: String.raw`import java.io.*;
import java.util.*;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.*;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

class MapperClass extends Mapper<Object, Text, Text, IntWritable> {
    public void map(Object key, Text value, Context context)
            throws IOException, InterruptedException {

        StringTokenizer itr = new StringTokenizer(value.toString());

        while (itr.hasMoreTokens()) {
            String word = itr.nextToken().toLowerCase();
            context.write(new Text(word), new IntWritable(1));
        }
    }
}

class ReducerClass extends Reducer<Text, IntWritable, Text, IntWritable> {
    public void reduce(Text key, Iterable<IntWritable> values, Context context)
            throws IOException, InterruptedException {

        int sum = 0;

        for (IntWritable val : values) {
            sum = sum + val.get();
        }

        context.write(key, new IntWritable(sum));
    }
}

public class WordCount {
    public static void main(String[] args) throws Exception {

        Configuration conf = new Configuration();

        Job job = Job.getInstance(conf, "Word Count");

        job.setJarByClass(WordCount.class);
        job.setMapperClass(MapperClass.class);
        job.setReducerClass(ReducerClass.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`# javac must match the JDK hadoop runs (java 17 here) - add --release 17 if needed
# Prepare the input (drops whatever the previous experiment left in HDFS)
start-dfs.sh && start-yarn.sh
printf "big data big analytics\ndata big hadoop\nhello hadoop\n" > input.txt
hdfs dfs -rm -r -f /user/labuser/input /user/labuser/output
hdfs dfs -mkdir -p /user/labuser/input
hdfs dfs -put -f input.txt /user/labuser/input/

# Compile, package and run
javac -classpath $(hadoop classpath) WordCount.java
jar cf WordCount.jar WordCount.class MapperClass.class ReducerClass.class
hadoop jar WordCount.jar WordCount /user/labuser/input /user/labuser/output

# Read the result
hdfs dfs -cat /user/labuser/output/part-r-00000`,
    output: 'analytics 1, big 3, data 2, hadoop 2, hello 1 - one word per line with its count, sorted by key.',
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
      'Read each input line and split it into tokens with StringTokenizer.',
      'Lower case the token and take its first character as the key.',
      'Emit (firstChar, word.length()) with a Text key and an IntWritable value.',
      'ReducerClass receives all the lengths recorded for one character.',
      'Accumulate the sum of the lengths and a count of the words.',
      'Compute average = sum / count and emit (character, average) as a DoubleWritable.',
      'Declare the map output types (Text, IntWritable) separately, since the final output value is a DoubleWritable.',
      'Run the job and read part-r-00000.',
    ],
    code: [
      {
        file: 'AverageLength.java',
        lang: 'java',
        src: String.raw`import java.io.*;
import java.util.*;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.*;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

class MapperClass extends Mapper<Object, Text, Text, IntWritable> {
    public void map(Object key, Text value, Context context)
            throws IOException, InterruptedException {

        StringTokenizer itr = new StringTokenizer(value.toString());

        while (itr.hasMoreTokens()) {
            String word = itr.nextToken().toLowerCase();
            
            String firstchar = word.substring(0, 1);
            int length = word.length();

            context.write(new Text(firstchar), new IntWritable(length));
        }
    }
}

class ReducerClass extends Reducer<Text, IntWritable, Text, DoubleWritable> {
    public void reduce(Text key, Iterable<IntWritable> values, Context context)
            throws IOException, InterruptedException {

        int sum = 0;
        int count = 0;

        for (IntWritable val : values) {
            sum = sum + val.get();
            count++;
        }
        double average = (double) sum/count;

        context.write(key, new DoubleWritable(average));
    }
}


public class AverageLength {
    public static void main(String[] args) throws Exception {

        Configuration conf = new Configuration();

        Job job = Job.getInstance(conf, "Average Word Length");

        job.setJarByClass(AverageLength.class);
        job.setMapperClass(MapperClass.class);
        job.setReducerClass(ReducerClass.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(DoubleWritable.class);

        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(IntWritable.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`# javac must match the JDK hadoop runs (java 17 here) - add --release 17 if needed
# Prepare the input (drops whatever the previous experiment left in HDFS)
start-dfs.sh && start-yarn.sh
printf "apple ant ball bat cat apple\n" > input.txt
hdfs dfs -rm -r -f /user/labuser/input /user/labuser/output-avg
hdfs dfs -mkdir -p /user/labuser/input
hdfs dfs -put -f input.txt /user/labuser/input/

# Compile, package and run
javac -classpath $(hadoop classpath) AverageLength.java
jar cf AverageLength.jar AverageLength.class MapperClass.class ReducerClass.class
hadoop jar AverageLength.jar AverageLength /user/labuser/input /user/labuser/output-avg

# Read the result
hdfs dfs -cat /user/labuser/output-avg/part-r-00000`,
    output: 'a 4.333333333333333, b 3.5, c 3.0 - the average length of the words beginning with each letter.',
    result:
      'The average word length for words starting with each character was successfully calculated using MapReduce.',
  },
  {
    no: 4,
    title: 'Stop Words Removal using MapReduce',
    aim: 'To write a MapReduce program for removing stop words from the given text files.',
    theory:
      'Stop words are common words such as the, a, an, is and are that carry little semantic meaning and are removed during text preprocessing. The mapper keeps the stop-word set in a field, lower cases every token and drops the ones that appear in that set, and the job is run with no reducer at all, so the surviving words are written straight to the output file.',
    algorithm: [
      'Fill a HashSet in the mapper with the stop words is, a, the, an, and, are, of, in, to and for.',
      'For every input line lower case the text and split it into tokens with StringTokenizer.',
      'Drop any token that is present in the stop-word set.',
      'Emit the surviving word as a Text value with a NullWritable key.',
      'Set the number of reduce tasks to 0 so the job is map only and the words land in part-m-00000.',
      'Run the job with hadoop jar and read part-m-00000 - one word per line, with no counts.',
    ],
    code: [
      {
        file: 'StopWord.java',
        lang: 'java',
        src: String.raw`
import java.io.*;
import java.util.*;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.*;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

class MapperClass extends Mapper<Object, Text, NullWritable, Text> {

    Set<String> stopwords = new HashSet<>(Arrays.asList(
        "is", "a", "the", "an", "and",
        "are", "of", "in", "to", "for"
    ));

    public void map(Object key, Text value, Context context)
            throws IOException, InterruptedException {

        StringTokenizer itr = new StringTokenizer(value.toString());

        while (itr.hasMoreTokens()) {

            String word = itr.nextToken().toLowerCase();

            if (!stopwords.contains(word)) {
                context.write(NullWritable.get(), new Text(word));
            }
        }
    }
}

public class StopWordRemoval {

    public static void main(String[] args) throws Exception {

        Configuration conf = new Configuration();

        Job job = Job.getInstance(conf, "Stop Word Removal");

        job.setJarByClass(StopWordRemoval.class);

        job.setMapperClass(MapperClass.class);

        job.setMapOutputKeyClass(NullWritable.class);
        job.setMapOutputValueClass(Text.class);

        job.setOutputKeyClass(NullWritable.class);
        job.setOutputValueClass(Text.class);

        job.setNumReduceTasks(0);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`# javac must match the JDK hadoop runs (java 17 here) - add --release 17 if needed
# Prepare the input (drops whatever the previous experiment left in HDFS)
start-dfs.sh && start-yarn.sh
printf "the quick brown fox and the lazy dog is a happy fox\n" > text.txt
hdfs dfs -rm -r -f /user/labuser/input /user/labuser/output-swr
hdfs dfs -mkdir -p /user/labuser/input
hdfs dfs -put -f text.txt /user/labuser/input/

# javac wants the file name to match the public class StopWordRemoval
cp StopWord.java StopWordRemoval.java
javac -classpath $(hadoop classpath) StopWordRemoval.java
jar cf StopWord.jar MapperClass.class StopWordRemoval.class
hadoop jar StopWord.jar StopWordRemoval /user/labuser/input /user/labuser/output-swr

# map only job, so the result is part-m-00000
hdfs dfs -cat /user/labuser/output-swr/part-m-00000`,
    output: 'quick, brown, fox, lazy, dog, happy, fox - one surviving word per line in part-m-00000; the stop words the, and, is and a never appear.',
    result: 'Stop words were filtered out of the input text by a map-only MapReduce job, and the output contains only the surviving words, one per line.',
  },
  {
    no: 5,
    title: 'Matrix Multiplication using MapReduce',
    aim: 'To implement matrix multiplication with Hadoop MapReduce.',
    theory:
      'For C = A x B every element C(i,k) is the sum of a(i,j) * b(j,k) over all j. The mapper routes each matrix element to every output cell it contributes to: a(i,j) of A goes to the cells (i,k) of its row and b(j,k) of B goes to the cells (i,k) of its column, both tagged with the shared index j. The reducer of a cell (i,k) collects the two sides, multiplies the matching entries and sums them into the final value. The program assumes 2 x 2 matrices because the size n is fixed inside it.',
    algorithm: [
      'Store the matrices as CSV lines of the form matrix,row,col,value - for example A,0,0,1.',
      'For an element a(i,j) of A write the key (i,k) with the value A,j,a(i,j) for every k from 0 to n-1.',
      'For an element b(j,k) of B write the key (i,k) with the value B,j,b(j,k) for every i from 0 to n-1.',
      'ReducerClass receives every value for the cell (i,k) and fills two maps indexed by j, one for the A side and one for the B side.',
      'For every j present in both maps add a(i,j) * b(j,k) to the running sum.',
      'Write the cell key (i,k) and the summed product as an IntWritable.',
      'Run the job with hadoop jar and read part-r-00000 as key, tab, value lines.',
    ],
    code: [
      {
        file: 'Matrix.java',
        lang: 'java',
        src: String.raw`
import java.io.*;
import java.util.*;

import org.apache.hadoop.conf.Configuration;
import org.apache.hadoop.fs.Path;
import org.apache.hadoop.io.*;
import org.apache.hadoop.mapreduce.*;
import org.apache.hadoop.mapreduce.lib.input.FileInputFormat;
import org.apache.hadoop.mapreduce.lib.output.FileOutputFormat;

class MapperClass extends Mapper<Object, Text, Text, Text> {

    int n = 2;

    public void map(Object key, Text value, Context context)
            throws IOException, InterruptedException {

        String[] data = value.toString().split(",");

        String matrix = data[0];
        int row = Integer.parseInt(data[1]);
        int col = Integer.parseInt(data[2]);
        int val = Integer.parseInt(data[3]);

        if (matrix.equals("A")) {

            for (int j = 0; j < n; j++) {

                context.write(
                    new Text(row + "," + j),
                    new Text("A," + col + "," + val)
                );
            }

        } else if (matrix.equals("B")) {

            for (int i = 0; i < n; i++) {

                context.write(
                    new Text(i + "," + col),
                    new Text("B," + row + "," + val)
                );
            }
        }
    }
}

class ReducerClass extends Reducer<Text, Text, Text, IntWritable> {

    public void reduce(Text key, Iterable<Text> values, Context context)
            throws IOException, InterruptedException {

        Map<Integer, Integer> A = new HashMap<>();
        Map<Integer, Integer> B = new HashMap<>();

        for (Text val : values) {

            String[] data = val.toString().split(",");

            String matrix = data[0];
            int index = Integer.parseInt(data[1]);
            int number = Integer.parseInt(data[2]);

            if (matrix.equals("A")) {
                A.put(index, number);
            } else {
                B.put(index, number);
            }
        }

        int sum = 0;

        for (int k = 0; k < 2; k++) {

            if (A.containsKey(k) && B.containsKey(k)) {
                sum += A.get(k) * B.get(k);
            }
        }

        context.write(key, new IntWritable(sum));
    }
}

public class MatrixMultiplication {

    public static void main(String[] args) throws Exception {

        Configuration conf = new Configuration();

        Job job = Job.getInstance(conf, "Matrix Multiplication");

        job.setJarByClass(MatrixMultiplication.class);

        job.setMapperClass(MapperClass.class);
        job.setReducerClass(ReducerClass.class);

        job.setMapOutputKeyClass(Text.class);
        job.setMapOutputValueClass(Text.class);

        job.setOutputKeyClass(Text.class);
        job.setOutputValueClass(IntWritable.class);

        FileInputFormat.addInputPath(job, new Path(args[0]));
        FileOutputFormat.setOutputPath(job, new Path(args[1]));

        System.exit(job.waitForCompletion(true) ? 0 : 1);
    }
}`,
      },
    ],
    run: String.raw`# javac must match the JDK hadoop runs (java 17 here) - add --release 17 if needed
# A = [[1,2],[3,4]]   B = [[5,6],[7,8]]   C = [[19,22],[43,50]]
start-dfs.sh && start-yarn.sh
printf "A,0,0,1\nA,0,1,2\nA,1,0,3\nA,1,1,4\nB,0,0,5\nB,0,1,6\nB,1,0,7\nB,1,1,8\n" > matrices.txt
hdfs dfs -rm -r -f /user/labuser/input /user/labuser/output-mm
hdfs dfs -mkdir -p /user/labuser/input
hdfs dfs -put -f matrices.txt /user/labuser/input/

# javac wants the file name to match the public class MatrixMultiplication
cp Matrix.java MatrixMultiplication.java
javac -classpath $(hadoop classpath) MatrixMultiplication.java
jar cf Matrix.jar MapperClass.class ReducerClass.class MatrixMultiplication.class
hadoop jar Matrix.jar MatrixMultiplication /user/labuser/input /user/labuser/output-mm

# Read the result
hdfs dfs -cat /user/labuser/output-mm/part-r-00000`,
    output: '0,0 19, 0,1 22, 1,0 43, 1,1 50 - every line is the cell key, a tab and its value, i.e. the product matrix C = A x B.',
    result: 'Matrix multiplication ran as a single MapReduce job: the mapper sent each element to the cells it contributes to and the reducer summed the products for every cell.',
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
  n <- 0
  for (col in df) n <- n + 1
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
  n <- 0
  for (col in df) n <- n + 1
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
      'Simple linear regression fits y = b0 + b1*x by least squares. The slope b1 and intercept b0 come from the closed form normal equations using the means and the sums of squares and cross products of the data, and the fitted line is drawn over the scatter plot.',
    algorithm: [
      'Enter the data as two vectors, hours and marks, and store n = length(hours).',
      'Compute mean_hours = sum(hours) / n and mean_marks = sum(marks) / n.',
      'Loop over the rows accumulating numerator = sum((hours - mean_hours) * (marks - mean_marks)) and denominator = sum((hours - mean_hours)^2).',
      'Slope b1 = numerator / denominator.',
      'Intercept b0 = mean_marks - b1 * mean_hours.',
      'Predict with b0 + b1 * new_hours for the new values 9 and 10.',
      'Plot hours against marks and draw the fitted line with abline(b0, b1, col = "red").',
    ],
    code: [
      {
        file: 'linear_regression.R',
        lang: 'r',
        src: String.raw`hours <- c(1, 2, 3, 4, 5, 6, 7, 8)
marks <- c(35, 40, 50, 55, 65, 70, 75, 85)

n <- length(hours)

mean_hours <- sum(hours) / n
mean_marks <- sum(marks) / n

numerator <- 0
denominator <- 0

for (i in 1:n) {
    numerator <- numerator + (hours[i] - mean_hours) * (marks[i] - mean_marks)
    denominator <- denominator + (hours[i] - mean_hours)^2
}

# (x - mean_x) * (y - mean_y) / (x - mean_x)^2
b1 <- numerator / denominator
# mean_y - b1 * mean_x
b0 <- mean_marks - b1 * mean_hours

new_hours <- c(9, 10)
# b0 + b1 * new_hours
predicted_marks <- b0 + b1 * new_hours

plot(hours, marks, 
     main = "Simple Linear Regression",
     xlab = "Study Hours",
     ylab = "Marks")

abline(b0, b1, col = "red")`,
      },
    ],
    run: String.raw`sudo apt install -y r-base
Rscript linear_regression.R`,
    output: 'The program prints nothing: it draws the scatter plot with the red fitted line. For this data the slope is b1 = 7.0833 and the intercept b0 = 27.5, so 9 hours predicts 91.25 marks and 10 hours predicts 98.33.',
    result: 'The least squares line was fitted with the sums written in the program, predictions were made for two new study times and the fit was drawn over the scatter plot.',
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
      'Write the data set into the program: 36 rows of two features, twelve rows per class - there is no data(iris).',
      'Split deterministically: every fourth row goes to the test set and the rest to training - no runif(), no set.seed() and no order().',
      'Scale each feature with the hand-computed training mean and standard deviation.',
      'Decision tree: for every feature collect its distinct values with a hand-written unique-and-sort, then test every midpoint threshold and compute the weighted Gini impurity of the two groups.',
      'Pick the split with the lowest weighted impurity, create the two child nodes and recurse until a node is pure or holds fewer than two rows.',
      'Classify a test row by walking the tree from the root to a leaf and taking the majority class of the leaf.',
      'SVM: start the weight vector and bias at zero and evaluate w.x + b with a hand-written dot product for every training row.',
      'Update w and b with the hinge-loss sub-gradient and an L2 learning-rate decay for a fixed number of epochs.',
      'Classify the test rows one class against the rest and report the accuracy.',
    ],
    code: [
      {
        file: 'decision_tree.R',
        lang: 'r',
        src: String.raw`# Decision tree (gini impurity) written from scratch.
# The data set, the train/test split and the split search are all in this
# file - no data(), runif(), order(), sort(), unique(), which() or rpart().

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

# distinct values of a column, ascending - no unique(), no sort()
distinct_sorted <- function(v) {
  out <- numeric(0)
  for (i in seq(1, length(v))) {
    seen <- FALSE
    if (length(out) > 0) {
      for (j in seq(1, length(out))) {
        if (out[j] == v[i]) seen <- TRUE
      }
    }
    if (!seen) out <- c(out, v[i])
  }
  if (length(out) >= 2) {
    for (i in seq(2, length(out))) {          # insertion sort
      key <- out[i]
      j <- i - 1
      while (j >= 1 && out[j] > key) {
        out[j + 1] <- out[j]
        j <- j - 1
      }
      out[j + 1] <- key
    }
  }
  return(out)
}

# positions where a logical vector is TRUE - no which()
rows_where <- function(cond) {
  out <- integer(0)
  for (i in seq(1, length(cond))) {
    if (cond[i]) out <- c(out, i)
  }
  return(out)
}

# ---- decision tree ------------------------------------------------

build_tree <- function(x, y, p, depth = 0, max_depth = 6, min_leaf = 2) {
  n <- length(y)
  if (depth >= max_depth || n < 2 * min_leaf || length(class_counts(y)) == 1) {
    return(list(leaf = TRUE, pred = majority_class(y)))
  }
  best_imp <- Inf
  best <- NULL
  for (f in seq(1, p)) {
    vals <- distinct_sorted(x[, f])
    if (length(vals) < 2) next
    for (t in seq(1, length(vals) - 1)) {
      thr <- (vals[t] + vals[t + 1]) / 2
      left <- rows_where(x[, f] <= thr)
      right <- rows_where(x[, f] > thr)
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
    left = build_tree(x[best$left, , drop = FALSE], y[best$left], p, depth + 1, max_depth, min_leaf),
    right = build_tree(x[best$right, , drop = FALSE], y[best$right], p, depth + 1, max_depth, min_leaf)
  ))
}

tree_predict <- function(node, row) {
  if (node$leaf) return(node$pred)
  if (row[node$feature] <= node$thr) return(tree_predict(node$left, row))
  return(tree_predict(node$right, row))
}

# ---- data : three classes written out as plain vectors ------------
# 36 rows, two features (sepal length and sepal width), twelve rows per
# class - written into the program instead of calling data(iris).

sl <- c(5.1, 4.9, 4.7, 4.6, 5.0, 4.6, 5.4, 4.6, 4.4, 4.9, 5.4, 4.8,
        7.0, 6.4, 6.9, 5.5, 6.5, 5.7, 6.3, 4.9, 6.6, 5.2, 5.0, 5.9,
        6.3, 5.8, 7.1, 6.3, 6.4, 7.6, 4.9, 7.3, 6.8, 7.3, 6.7, 6.0)
sw <- c(3.5, 3.0, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4,
        3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2.0, 3.0,
        2.5, 2.8, 3.2, 2.5, 2.8, 3.2, 2.4, 2.9, 2.7, 2.5, 3.0, 2.4)
y <- c("setosa", "setosa", "setosa", "setosa", "setosa", "setosa",
       "setosa", "setosa", "setosa", "setosa", "setosa", "setosa",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "virginica", "virginica", "virginica", "virginica",
       "virginica", "virginica", "virginica", "virginica",
       "virginica", "virginica", "virginica", "virginica")

n <- length(sl)          # 36 rows
p <- 2                   # two features

# deterministic split: every fourth row is held out for testing, so there is
# no runif(), no set.seed() and no order()
n_train <- (n * 3) %/% 4   # 27
n_test <- n - n_train    # 9
x_train <- matrix(0, nrow = n_train, ncol = p)
y_train <- character(n_train)
x_test <- matrix(0, nrow = n_test, ncol = p)
y_test <- character(n_test)
tr <- 0
te <- 0
for (i in seq(1, n)) {
  if (i %% 4 == 0) {
    te <- te + 1
    x_test[te, 1] <- sl[i]
    x_test[te, 2] <- sw[i]
    y_test[te] <- y[i]
  } else {
    tr <- tr + 1
    x_train[tr, 1] <- sl[i]
    x_train[tr, 2] <- sw[i]
    y_train[tr] <- y[i]
  }
}

# standardise with the training statistics (hand computed) so gradient
# descent on the hinge loss behaves
center <- numeric(p)
spread <- numeric(p)
for (f in seq(1, p)) {
  m <- 0
  for (i in seq(1, n_train)) m <- m + x_train[i, f]
  m <- m / n_train
  acc <- 0
  for (i in seq(1, n_train)) acc <- acc + (x_train[i, f] - m) * (x_train[i, f] - m)
  s <- sqrt(acc / (n_train - 1))
  if (s == 0) s <- 1
  center[f] <- m
  spread[f] <- s
}
for (i in seq(1, n_train)) {
  for (f in seq(1, p)) x_train[i, f] <- (x_train[i, f] - center[f]) / spread[f]
}
for (i in seq(1, n_test)) {
  for (f in seq(1, p)) x_test[i, f] <- (x_test[i, f] - center[f]) / spread[f]
}

classes <- c("setosa", "versicolor", "virginica")
# decision tree
tree <- build_tree(x_train, y_train, p)
tree_pred <- character(n_test)
for (i in seq(1, n_test)) tree_pred[i] <- tree_predict(tree, x_test[i, ])

tree_hits <- 0
for (i in seq(1, n_test)) {
  if (tree_pred[i] == y_test[i]) tree_hits <- tree_hits + 1
}
cat("Decision tree accuracy:", tree_hits / n_test, "\n")

cat("\nConfusion matrix - tree (rows = actual, cols = predicted):\n")
for (cls in classes) {
  row <- c()
  for (pred in classes) {
    cnt <- 0
    for (i in seq(1, n_test)) {
      if (y_test[i] == cls && tree_pred[i] == pred) cnt <- cnt + 1
    }
    row <- c(row, cnt)
  }
  cat(cls, ":", row, "\n")
}`,
      },
      {
        file: 'svm.R',
        lang: 'r',
        src: String.raw`# Linear support vector machine by hinge-loss gradient descent, written from
# scratch. The data set, the split, the scaling and the sub-gradient are all
# in this file - no data(), runif(), order(), mean(), sd() or svm().

# ---- linear SVM by hinge-loss gradient descent --------------------

dot <- function(w, row, p) {
  acc <- 0
  for (f in seq(1, p)) acc <- acc + w[f] * row[f]
  return(acc)
}

svm_fit <- function(x, y01, n, p, lr0 = 0.01, epochs = 400) {
  w <- numeric(p)
  b <- 0
  for (epoch in seq(1, epochs)) {
    lr <- lr0 / epoch
    gw <- numeric(p)
    gb <- 0
    for (i in seq(1, n)) {
      z <- dot(w, x[i, ], p) + b
      if (y01[i] * z < 1) {          # hinge term active
        for (f in seq(1, p)) gw[f] <- gw[f] - y01[i] * x[i, f]
        gb <- gb - y01[i]
      }
    }
    for (f in seq(1, p)) w[f] <- w[f] - lr * (gw[f] / n + 0.01 * w[f])
    b <- b - lr * (gb / n)
  }
  return(list(w = w, b = b))
}

svm_predict <- function(model, x, n, p) {
  out <- character(n)
  for (i in seq(1, n)) {
    z <- dot(model$w, x[i, ], p) + model$b
    if (z >= 0) out[i] <- "positive" else out[i] <- "negative"
  }
  return(out)
}

# ---- data : three classes written out as plain vectors ------------
# 36 rows, two features (sepal length and sepal width), twelve rows per
# class - written into the program instead of calling data(iris).

sl <- c(5.1, 4.9, 4.7, 4.6, 5.0, 4.6, 5.4, 4.6, 4.4, 4.9, 5.4, 4.8,
        7.0, 6.4, 6.9, 5.5, 6.5, 5.7, 6.3, 4.9, 6.6, 5.2, 5.0, 5.9,
        6.3, 5.8, 7.1, 6.3, 6.4, 7.6, 4.9, 7.3, 6.8, 7.3, 6.7, 6.0)
sw <- c(3.5, 3.0, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4,
        3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2.0, 3.0,
        2.5, 2.8, 3.2, 2.5, 2.8, 3.2, 2.4, 2.9, 2.7, 2.5, 3.0, 2.4)
y <- c("setosa", "setosa", "setosa", "setosa", "setosa", "setosa",
       "setosa", "setosa", "setosa", "setosa", "setosa", "setosa",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "virginica", "virginica", "virginica", "virginica",
       "virginica", "virginica", "virginica", "virginica",
       "virginica", "virginica", "virginica", "virginica")

n <- length(sl)          # 36 rows
p <- 2                   # two features

# deterministic split: every fourth row is held out for testing, so there is
# no runif(), no set.seed() and no order()
n_train <- (n * 3) %/% 4   # 27
n_test <- n - n_train    # 9
x_train <- matrix(0, nrow = n_train, ncol = p)
y_train <- character(n_train)
x_test <- matrix(0, nrow = n_test, ncol = p)
y_test <- character(n_test)
tr <- 0
te <- 0
for (i in seq(1, n)) {
  if (i %% 4 == 0) {
    te <- te + 1
    x_test[te, 1] <- sl[i]
    x_test[te, 2] <- sw[i]
    y_test[te] <- y[i]
  } else {
    tr <- tr + 1
    x_train[tr, 1] <- sl[i]
    x_train[tr, 2] <- sw[i]
    y_train[tr] <- y[i]
  }
}

# standardise with the training statistics (hand computed) so gradient
# descent on the hinge loss behaves
center <- numeric(p)
spread <- numeric(p)
for (f in seq(1, p)) {
  m <- 0
  for (i in seq(1, n_train)) m <- m + x_train[i, f]
  m <- m / n_train
  acc <- 0
  for (i in seq(1, n_train)) acc <- acc + (x_train[i, f] - m) * (x_train[i, f] - m)
  s <- sqrt(acc / (n_train - 1))
  if (s == 0) s <- 1
  center[f] <- m
  spread[f] <- s
}
for (i in seq(1, n_train)) {
  for (f in seq(1, p)) x_train[i, f] <- (x_train[i, f] - center[f]) / spread[f]
}
for (i in seq(1, n_test)) {
  for (f in seq(1, p)) x_test[i, f] <- (x_test[i, f] - center[f]) / spread[f]
}

classes <- c("setosa", "versicolor", "virginica")
svm_hits <- 0
for (k in seq(1, length(classes))) {
  cls <- classes[k]
  ytr <- numeric(n_train)
  for (i in seq(1, n_train)) {
    ytr[i] <- -1
    if (y_train[i] == cls) ytr[i] <- 1
  }
  model <- svm_fit(x_train, ytr, n_train, p)
  pte <- svm_predict(model, x_test, n_test, p)
  for (i in seq(1, n_test)) {
    got <- "other"
    if (pte[i] == "positive") got <- cls
    expect <- "other"
    if (y_test[i] == cls) expect <- cls
    if (got == expect) svm_hits <- svm_hits + 1
  }
}

cat("SVM (one vs rest) accuracy:", svm_hits / (n_test * length(classes)), "\n")`,
      },
    ],
    run: String.raw`sudo apt install -y r-base

# the two classifiers are separate programs, each with its own data set
Rscript decision_tree.R
Rscript svm.R`,
    output: 'Decision tree accuracy 0.8888889 with the confusion matrix setosa 3 0 0, versicolor 0 3 0, virginica 0 1 2; SVM one-versus-rest accuracy 0.7777778.',
    result: 'A gini decision tree and a hinge-loss linear SVM were implemented as two separate programs, each carrying its own data set, split and scaling, and evaluated with a manual confusion matrix and accuracy.',
  },
  {
    no: 13,
    title: 'KNN and Naive Bayes Classifier using R',
    aim: 'To implement KNN and Naive Bayes classifiers using R without ready-made classifier functions.',
    theory:
      'K-nearest neighbours classifies a test point by the majority class of its k closest training points, using Euclidean distance after feature scaling so that no single feature dominates. Naive Bayes multiplies the class prior by the conditional probability of every attribute value given the class and picks the larger score; with categorical attributes the counts are smoothed by adding one to every cell (Laplace smoothing), so a value never seen in a class does not zero the whole product.',
    algorithm: [
      'Write the data set into the program: 36 rows of two features, twelve rows per class - there is no data(iris).',
      'Split deterministically: every fourth row goes to the test set and the rest to training - no runif(), no set.seed() and no order().',
      'Scale every feature with z = (value - mean) / standard deviation, computed from the training rows.',
      'KNN: for each test row compute the Euclidean distance to every training row with a hand-written distance, pick the five smallest without sorting and vote for the most common class.',
      'Report the KNN accuracy and the confusion matrix.',
      'Naive Bayes: count the prior of every class and the frequency of every attribute value inside each class.',
      'Add one to every count and divide by the class total plus the number of distinct values - Laplace smoothing.',
      'Multiply the prior by the smoothed conditionals of the test record and predict the class with the larger score.',
    ],
    code: [
      {
        file: 'knn.R',
        lang: 'r',
        src: String.raw`# K-nearest neighbours written from scratch.
# The data set, the split, the scaling and the distances are all in this
# file - no data(), runif(), order(), sort(), mean() or knn().

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
scale_with <- function(x, center, spread, n, p) {
  out <- x
  for (i in seq(1, n)) {
    for (j in seq(1, p)) {
      out[i, j] <- (x[i, j] - center[j]) / spread[j]
    }
  }
  return(out)
}

euclid <- function(a, b, p) {
  acc <- 0
  for (i in seq(1, p)) {
    acc <- acc + (a[i] - b[i]) * (a[i] - b[i])
  }
  return(sqrt(acc))
}

knn_predict <- function(x_train, y_train, x_test, k, n_train, n_test, p) {
  preds <- character(n_test)
  for (i in seq(1, n_test)) {
    dists <- numeric(n_test)
    for (j in seq(1, n_train)) {
      dists[j] <- euclid(x_test[i, ], x_train[j, ], p)
    }
    # pick the k smallest distances without sort()
    idx <- integer(k)
    used <- logical(n_train)
    for (s in seq(1, k)) {
      best <- -1
      bestd <- Inf
      for (j in seq(1, n_train)) {
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

# ---- data : three classes written out as plain vectors ------------
# 36 rows, two features (sepal length and sepal width), twelve rows per
# class - written into the program instead of calling data(iris).

sl <- c(5.1, 4.9, 4.7, 4.6, 5.0, 4.6, 5.4, 4.6, 4.4, 4.9, 5.4, 4.8,
        7.0, 6.4, 6.9, 5.5, 6.5, 5.7, 6.3, 4.9, 6.6, 5.2, 5.0, 5.9,
        6.3, 5.8, 7.1, 6.3, 6.4, 7.6, 4.9, 7.3, 6.8, 7.3, 6.7, 6.0)
sw <- c(3.5, 3.0, 3.2, 3.1, 3.6, 3.9, 3.4, 3.4, 2.9, 3.1, 3.7, 3.4,
        3.2, 3.2, 3.1, 2.3, 2.8, 2.8, 3.3, 2.4, 2.9, 2.7, 2.0, 3.0,
        2.5, 2.8, 3.2, 2.5, 2.8, 3.2, 2.4, 2.9, 2.7, 2.5, 3.0, 2.4)
y <- c("setosa", "setosa", "setosa", "setosa", "setosa", "setosa",
       "setosa", "setosa", "setosa", "setosa", "setosa", "setosa",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "versicolor", "versicolor", "versicolor", "versicolor",
       "virginica", "virginica", "virginica", "virginica",
       "virginica", "virginica", "virginica", "virginica",
       "virginica", "virginica", "virginica", "virginica")

n <- length(sl)          # 36 rows
p <- 2                   # two features

# deterministic split: every fourth row is held out for testing, so there is
# no runif(), no set.seed() and no order()
n_train <- (n * 3) %/% 4   # 27
n_test <- n - n_train    # 9
x_train <- matrix(0, nrow = n_train, ncol = p)
y_train <- character(n_train)
x_test <- matrix(0, nrow = n_test, ncol = p)
y_test <- character(n_test)
tr <- 0
te <- 0
for (i in seq(1, n)) {
  if (i %% 4 == 0) {
    te <- te + 1
    x_test[te, 1] <- sl[i]
    x_test[te, 2] <- sw[i]
    y_test[te] <- y[i]
  } else {
    tr <- tr + 1
    x_train[tr, 1] <- sl[i]
    x_train[tr, 2] <- sw[i]
    y_train[tr] <- y[i]
  }
}

# training statistics for scaling
center <- numeric(p)
spread <- numeric(p)
for (f in seq(1, p)) {
  m <- 0
  for (i in seq(1, n_train)) m <- m + x_train[i, f]
  m <- m / n_train
  acc <- 0
  for (i in seq(1, n_train)) acc <- acc + (x_train[i, f] - m) * (x_train[i, f] - m)
  s <- sqrt(acc / (n_train - 1))
  if (s == 0) s <- 1
  center[f] <- m
  spread[f] <- s
}

x_train <- scale_with(x_train, center, spread, n_train, p)
x_test <- scale_with(x_test, center, spread, n_test, p)

knn_pred <- knn_predict(x_train, y_train, x_test, 5, n_train, n_test, p)

knn_hits <- 0
for (i in seq(1, n_test)) {
  if (knn_pred[i] == y_test[i]) knn_hits <- knn_hits + 1
}
cat("KNN accuracy:", knn_hits / n_test, "\n")

classes <- c("setosa", "versicolor", "virginica")
cat("\nConfusion matrix - KNN:\n")
for (cls in classes) {
  row <- c()
  for (pred in classes) {
    cnt <- 0
    for (i in seq(1, n_test)) {
      if (y_test[i] == cls && knn_pred[i] == pred) cnt <- cnt + 1
    }
    row <- c(row, cnt)
  }
  cat(cls, ":", row, "\n")
}`,
      },
      {
        file: 'naive_bayes.R',
        lang: 'r',
        src: String.raw`# Input data
weather <- c("Sunny", "Sunny", "Overcast", "Rain",
             "Rain", "Rain", "Overcast", "Sunny")

temperature <- c("Hot", "Hot", "Hot", "Mild",
                 "Cool", "Cool", "Mild", "Mild")

play <- c("No", "No", "Yes", "Yes",
          "Yes", "No", "Yes", "No")

n <- length(play)

test_weather <- "Sunny"
test_temperature <- "Mild"

# Calculate prior probabilities
p_yes <- sum(play == "Yes") / n
p_no <- sum(play == "No") / n

# Laplace smoothing
k_weather <- length(unique(weather))
k_temperature <- length(unique(temperature))

# Conditional probabilities for Yes
p_sunny_yes <- (sum(weather == "Sunny" & play == "Yes") + 1) /
               (sum(play == "Yes") + k_weather)

p_mild_yes <- (sum(temperature == "Mild" & play == "Yes") + 1) /
              (sum(play == "Yes") + k_temperature)

# Conditional probabilities for No
p_sunny_no <- (sum(weather == "Sunny" & play == "No") + 1) /
              (sum(play == "No") + k_weather)

p_mild_no <- (sum(temperature == "Mild" & play == "No") + 1) /
             (sum(play == "No") + k_temperature)

# Calculate Naive Bayes scores
score_yes <- p_yes * p_sunny_yes * p_mild_yes
score_no <- p_no * p_sunny_no * p_mild_no

# Predict the result
if (score_yes > score_no) {
  prediction <- "Yes"
} else {
  prediction <- "No"
}

print(paste("Prediction:", prediction))
print(paste("Yes score:", score_yes))
print(paste("No score:", score_no))`,
      },
    ],
    run: String.raw`sudo apt install -y r-base

# the two classifiers are separate programs
Rscript knn.R
Rscript naive_bayes.R`,
    output: 'KNN accuracy 1 with the confusion matrix setosa 3 0 0, versicolor 0 3 0, virginica 0 0 3; Naive Bayes predicts No for Sunny / Mild with scores Yes 0.0306 and No 0.0816.',
    result: 'K-nearest neighbours and a Laplace-smoothed Naive Bayes classifier were implemented as two separate programs and their predictions were verified.',
  },


];
