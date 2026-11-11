// KTU 2024 Scheme Semester 5 laboratory courses, taken from the official
// lab manuals (Networks Lab Manual - Students, Data Analytics Lab Manual).

const objectives = (list) => list;

export const NETWORKS_LAB = {
  key: 'networks-lab',
  title: 'Networks Lab',
  code: 'PCCSL507',
  lab: true,
  description:
    'Linux networking commands, Wireshark protocol analysis, TCP and UDP client-server programs, multi-user chat, concurrent servers and routing in Packet Tracer.',
  source: 'official',
  credits: 2,
  contactHours: '0:0:3:0',
  courseType: 'Lab',
  marks: '50 / 50',
  examDuration: '2 Hours 30 Minutes',
  prerequisites: 'PCCST501 Computer Networks',
  objectives: objectives([
    'To familiarise students with Linux networking commands and network monitoring tools.',
    'To capture and analyse real protocol traffic (HTTP, SMTP, DNS) using Wireshark.',
    'To implement TCP and UDP client-server applications, concurrent servers and multi-user services using socket programming.',
    'To configure routers, static routes and verify connectivity using Cisco Packet Tracer.',
  ]),
  outcomes: [
    { code: 'CO1', text: 'Use Linux networking commands and Wireshark to monitor and troubleshoot networks.' },
    { code: 'CO2', text: 'Implement TCP and UDP client-server applications using socket APIs.' },
    { code: 'CO3', text: 'Build concurrent servers with fork() for chat, time and file services.' },
    { code: 'CO4', text: 'Configure router modes, interfaces and static routing, and verify with ping.' },
  ],
  assessment: [
    'CIE - 50 marks: attendance, preparation / pre-lab work, viva and record, internal exam.',
    'ESE - 50 marks: procedure / algorithm, conduct / execution, result and inference, viva, record.',
    'The record must be duly certified before the end semester examination.',
  ],
  software: [
    'Linux terminal with gcc',
    'Wireshark',
    'Cisco Packet Tracer',
    'Python 3 with aiosmtpd (for the SMTP experiment)',
    'telnet',
  ],
  references: [
    'Andrew S. Tanenbaum, Computer Networks, Pearson.',
    'Behrouz A. Forouzan, Data Communications and Networking, McGraw-Hill.',
    'W. Richard Stevens, UNIX Network Programming, Prentice Hall.',
  ],
};

export const DATA_ANALYTICS_LAB = {
  key: 'data-analytics-lab',
  title: 'Data Analytics Lab',
  code: 'PCCDL508',
  lab: true,
  description:
    'Hadoop and HDFS, MapReduce, Pig and Hive, statistics and machine learning in R, and Spark for large-scale analysis.',
  source: 'official',
  credits: 2,
  contactHours: '0:0:3:0',
  courseType: 'Lab',
  marks: '50 / 50',
  examDuration: '2 Hours 30 Minutes',
  prerequisites: 'PCCDT503 Data Analytics',
  objectives: objectives([
    'To impart knowledge of big data technologies for processing different types of data, configure Hadoop and perform file management tasks.',
    'To enable the learner to analyse big data using machine learning techniques.',
  ]),
  outcomes: [
    { code: 'CO1', text: 'Configure Hadoop and perform file management tasks.' },
    { code: 'CO2', text: 'Implement different tasks using the Hadoop MapReduce programming model.' },
    { code: 'CO3', text: 'Apply data processing tools like Pig and Hive to real-time issues such as weather and sales datasets.' },
    { code: 'CO4', text: 'Implement data extraction from files and analyse big data using machine learning techniques in R.' },
    { code: 'CO5', text: 'Illustrate the knowledge of Spark to analyse data in real-life scenarios.' },
  ],
  assessment: [
    'CIE - 50 marks: attendance 5, preparation / pre-lab work, viva and record 25, internal exam 20.',
    'ESE - 50 marks: procedure / algorithm 10, conduct / execution 15, result and inference 10, viva 10, record 5.',
    'The record must be duly certified before the end semester examination; the external examiner endorses it.',
  ],
  software: [
    'Apache Hadoop 3.x (pseudo-distributed mode)',
    'Apache Pig',
    'Apache Hive',
    'R (programs written from scratch - no ready-made statistics functions)',
    'Apache Spark (PySpark)',
    'Java JDK with the Hadoop classpath',
  ],
  references: [
    'Tom White, Hadoop: The Definitive Guide, O.Reilly.',
    'Mike Frampton, Mastering Apache Spark, Packt.',
    'Nick Pentreath, Machine Learning with Spark, Packt.',
    'Mohammed Guller, Big Data Analytics with Spark, Apress.',
  ],
};

export const LAB_DEFS = [NETWORKS_LAB, DATA_ANALYTICS_LAB];
