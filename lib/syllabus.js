// Official KTU 2024 Scheme syllabus seed.
//
// Sources (verified against KTU curriculum documents, Nov 2025):
//  - B.Tech Curriculum-2024, Computer Science and Engineering (Group A), Semester 5
//  - B.Tech Curriculum-2024, Computer Science and Engineering (Data Science), Semester 5
//    (PCCDT503 Data Analytics; Big Data Processing is listed there as PBCDT504)
//  - KTU S5 syllabus compilation (mgmits.ac.in) for PECDT525 Data Mining
//
// Module numbering, titles and topic wording follow the published syllabus.
// Course codes follow the printed timetable (PBCDT504 Big Data Processing,
// PECDT525 Data Mining as Program Elective 2).
// Syllabus entries are editable and deletable in the app; nothing here is
// protected or hard-coded into the UI.

export const SCHEME = '2024 Scheme';
export const SEMESTER = 5;

const note = (title, body = '', extra = {}) => ({ title, body, ...extra });

// Semester 5 end-semester examination timetable (KTU 2024 scheme, slots A-E).
// `code` is the subject code used by this notebook (it keys the subject
// nodes); `paperCode` mirrors what the printed timetable shows.
export const EXAM_SCHEDULE = [
  { code: 'PCCST501', title: 'Computer Networks', paperCode: 'PCCST501', slot: 'A', date: '2026-11-23' },
  {
    code: 'PCCST502',
    title: 'Design and Analysis of Algorithms (DAA)',
    paperCode: 'PCCST502',
    slot: 'B',
    date: '2026-11-27',
  },
  { code: 'PCCDT503', title: 'Data Analytics', paperCode: 'PCCDT503', slot: 'C', date: '2026-12-01' },
  {
    code: 'PBCDT504',
    title: 'Big Data Processing',
    paperCode: 'PBCDT504',
    legacy: ['PCCDT504'],
    slot: 'D',
    date: '2026-12-03',
  },
  {
    code: 'PECDT525',
    title: 'Data Mining',
    paperCode: 'PECDT525',
    slot: 'E',
    date: '2026-12-07',
    elective: 'Program Elective 2',
    legacy: ['PECST525'],
  },
];

export function examFor(code) {
  return (
    EXAM_SCHEDULE.find(
      (e) => e.code === code || e.paperCode === code || (e.legacy || []).includes(code)
    ) || null
  );
}

// Official dates the published timetable has moved since a subject node stored
// its own copy of the date. A subject still carrying one of these dates is
// moved to the current published date; anything else the student changed by
// hand is left alone.
export const SUPERSEDED_EXAM_DATES = {
  PBCDT504: ['2026-12-04'],
};

// Exam details for a subject node: the node's own (editable) values win, with
// the published timetable as the fallback so dates survive a cloud pull from a
// notebook that never stored them.
export function examInfo(node) {
  if (!node) return null;
  const published = examFor(node.code);
  const date = node.examDate || published?.date;
  if (!date) return null;
  return {
    date,
    slot: node.examSlot || published?.slot || '',
    paperCode: node.examPaperCode || published?.paperCode || '',
    elective: published?.elective || '',
  };
}

export function formatExamDate(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatExamDay(iso) {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { weekday: 'long' });
}

export const DATA_MINING = {
  key: 'data-mining',
  title: 'Data Mining',
  code: 'PECDT525',
  description:
    'Data warehousing, preprocessing, classification, clustering, association rules, web and text mining.',
  source: 'official',
  credits: 3,
  contactHours: '8 + 9 + 9 + 10',
  objectives: [
    'To provide a thorough understanding of the key processes and concepts involved in data mining and data warehousing within application domains.',
    'To enable students to understand data preprocessing techniques, fundamentals and advanced concepts of classification, clustering, association rule mining, text mining and web mining, and apply these techniques in real-world scenarios.',
  ],
  outcomes: [
    'CO1 - Understand the key processes of data mining and data warehousing concepts in application domains.',
    'CO2 - Apply appropriate pre-processing techniques to convert raw data into a suitable format for practical data mining tasks.',
    'CO3 - Illustrate the use of classification and clustering algorithms in various application domains.',
    'CO4 - Comprehend the use of association rule mining techniques.',
    'CO5 - Explain advanced data mining concepts and their applications in emerging domains.',
  ],
  textbooks: [
    'Jiawei Han, Micheline Kamber, Data Mining: Concepts and Techniques, Elsevier, 3/e, 2006.',
    'M. H. Dunham, Data Mining: Introductory and Advanced Topics, Pearson Education, 1/e, 2006.',
  ],
  references: [
    'Pang-Ning Tan, Michael Steinbach, Introduction to Data Mining, Addison Wesley.',
    'Mehmed Kantardzic, Data Mining: Concepts, Models, Methods, and Algorithms, Wiley.',
  ],
  modules: [
    {
      title: 'Data Mining Fundamentals',
      hours: 8,
      description:
        'Data mining concepts and applications, KDD and data mining, architecture of a typical data mining system, data warehousing, multidimensional model, schemas and OLAP.',
      topics: [
        { title: 'Introduction to Data Mining', subs: [] },
        { title: 'Data Mining Concepts and Applications', subs: [] },
        { title: 'Knowledge Discovery in Databases (KDD) and Data Mining', subs: [] },
        { title: 'Architecture of a Typical Data Mining System', subs: [] },
        { title: 'Data Mining Functionalities', subs: [] },
        { title: 'Introduction to Data Warehousing', subs: [] },
        { title: 'Data Warehouse Architecture', subs: [] },
        { title: 'Multidimensional Data Model', subs: [] },
        { title: 'Data Warehouse Schemas', subs: [] },
        { title: 'Online Analytical Processing (OLAP)', subs: [] },
        { title: 'OLAP Operations', subs: [] },
      ],
    },
    {
      title: 'Data Preprocessing',
      hours: 9,
      description:
        'Need for data preprocessing, data cleaning, integration, transformation, reduction, discretization and concept hierarchy generation.',
      topics: [
        { title: 'Need for Data Preprocessing', subs: [] },
        {
          title: 'Data Cleaning',
          subs: [note('Handling Missing Values'), note('Noisy Data Identification and Removal')],
        },
        { title: 'Data Integration', subs: [] },
        { title: 'Data Transformation', subs: [] },
        {
          title: 'Data Reduction',
          subs: [
            note('Data Cube Aggregation'),
            note('Attribute Subset Selection'),
            note('Dimensionality Reduction'),
            note('Numerosity Reduction'),
          ],
        },
        { title: 'Data Discretization', subs: [] },
        { title: 'Concept Hierarchy Generation', subs: [] },
      ],
    },
    {
      title: 'Classification and Clustering',
      hours: 9,
      description:
        'Classification, decision tree construction, information gain, Gini index, ID3, neural networks with backpropagation, evaluation measures, clustering, k-means, hierarchical clustering and DBSCAN.',
      topics: [
        {
          title: 'Classification',
          subs: [
            note('Introduction to Classification'),
            note('Decision Tree Construction'),
            note('Information Gain'),
            note('Gini Index'),
            note('ID3 Algorithm'),
          ],
        },
        {
          title: 'Neural Networks',
          subs: [note('Backpropagation Algorithm')],
        },
        {
          title: 'Evaluation Measures for Classification',
          subs: [note('Accuracy'), note('Precision'), note('Recall'), note('F1-Score')],
        },
        {
          title: 'Clustering',
          subs: [
            note('Introduction to Clustering'),
            note('Distance and Similarity Measures'),
            note('Clustering Methods and Paradigms'),
            note('Partitioning-Based Clustering'),
            note('K-Means Algorithm'),
            note('Hierarchical Clustering'),
            note('DBSCAN Algorithm'),
          ],
        },
      ],
    },
    {
      title: 'Association Rule Analysis and Advanced Data Mining',
      hours: 10,
      description:
        'Association rule mining with Apriori and FP-Growth, web mining and PageRank, web usage mining, text mining and information retrieval.',
      topics: [
        {
          title: 'Association Rule Mining',
          subs: [
            note('Introduction to Association Rule Mining'),
            note('Basic Concepts and Terminologies'),
            note('Support and Confidence'),
            note('Frequent Itemset Generation'),
            note('Apriori Algorithm'),
            note('FP-Growth Algorithm'),
          ],
        },
        {
          title: 'Web Mining',
          subs: [
            note('Introduction to Web Mining'),
            note('Web Content Mining'),
            note('Web Structure Mining'),
            note('PageRank Algorithm'),
            note('Web Usage Mining'),
            note('Web Usage Data Preprocessing'),
            note('Data Structures for Web Usage Mining'),
            note('Pattern Discovery'),
            note('Pattern Analysis'),
          ],
        },
        {
          title: 'Text Mining',
          subs: [
            note('Introduction to Text Mining'),
            note('Text Data Analysis'),
            note('Information Retrieval'),
            note('Basic Measures for Text Retrieval'),
            note('Text Retrieval Methods'),
            note('Text Indexing Techniques'),
          ],
        },
      ],
    },
  ],
};

export const COMPUTER_NETWORKS = {
  key: 'computer-networks',
  title: 'Computer Networks',
  code: 'PCCST501',
  description:
    'Protocol layering, application and transport protocols, network layer routing, data-link layer, SNMP and the physical layer.',
  source: 'official',
  credits: 4,
  contactHours: '6 + 18 + 11 + 9',
  objectives: [
    'To introduce the core concepts of computer networking.',
    'To develop a big picture of the internetworking implementation on Linux-based systems.',
    'To impart an overview of network management concepts.',
  ],
  outcomes: [
    'CO1 - Understand the internetworking design in terms of protocol stack and the role of various application layer protocols.',
    'CO2 - Illustrate the functions of the transport layer from connectionless and connection-oriented perspectives.',
    'CO3 - Identify how the network layer achieves host-to-host connectivity and caters to diverse service requirements.',
    'CO4 - Explain the nuances of the data link layer design and demonstrate various data link layer protocols.',
    'CO5 - Describe the fundamental characteristics of the physical layer and how it supports the upper layers.',
  ],
  textbooks: [
    'Behrouz A. Forouzan, Data Communications and Networking, McGraw-Hill (Book 1).',
    'W. Richard Stevens, UNIX Network Programming (Book 2).',
    'Linux kernel networking documentation / Linux Network Administrator’s Guide (Book 3).',
  ],
  references: ['James F. Kurose, Keith W. Ross, Computer Networking: A Top-Down Approach.'],
  modules: [
    {
      title: 'Internet Overview and Application Layer',
      hours: 6,
      description:
        'Overview of the Internet, protocol layering, application-layer paradigms, client-server applications (WWW/HTTP, FTP, email, DNS) and peer-to-peer networks with BitTorrent.',
      topics: [
        {
          title: 'Overview of the Internet and Protocol Layering',
          subs: [
            note('Overview of the Internet', '', { source: 'official' }),
            note('Protocol Layering', '', { source: 'official' }),
          ],
        },
        {
          title: 'Application-Layer Paradigms',
          subs: [
            note('Client-Server Paradigm', '', { source: 'official' }),
            note('Peer-to-Peer Paradigm', '', { source: 'official' }),
          ],
        },
        {
          title: 'World Wide Web and HTTP',
          subs: [
            note('World Wide Web', '', { source: 'official' }),
            note('HTTP', '', { source: 'official' }),
          ],
        },
        {
          title: 'FTP, Electronic Mail and DNS',
          subs: [
            note('File Transfer Protocol (FTP)', '', { source: 'official' }),
            note('Electronic Mail (SMTP, POP3, IMAP)', '', { source: 'official' }),
            note('Domain Name System (DNS)', '', { source: 'official' }),
          ],
        },
        {
          title: 'P2P Networks and BitTorrent',
          subs: [
            note('P2P Networks', '', { source: 'official' }),
            note('Case Study: BitTorrent', '', { source: 'official' }),
          ],
        },
      ],
    },
    {
      title: 'Transport Layer, Network Layer and Sockets',
      hours: 18,
      description:
        'Transport services and protocols (UDP, TCP), socket programming with select/poll and advanced I/O, network-layer protocols, routing, next-generation IP, QoS and Linux routing tables.',
      topics: [
        {
          title: 'Transport Layer Services and Protocols',
          subs: [
            note('Transport Layer Services', '', { source: 'official' }),
            note('Transport Layer Protocols', '', { source: 'official' }),
            note('UDP', '', { source: 'official' }),
            note('TCP', '', { source: 'official' }),
          ],
        },
        {
          title: 'Hands-on: Sockets',
          subs: [
            note('Sockets Introduction', '', { source: 'official' }),
            note('Elementary TCP Sockets', '', { source: 'official' }),
            note('TCP Client/Server Example', '', { source: 'official' }),
            note('I/O Multiplexing - select and poll', '', { source: 'official' }),
            note('Elementary UDP Sockets', '', { source: 'official' }),
            note('Advanced I/O Functions', '', { source: 'official' }),
          ],
        },
        {
          title: 'Network Layer Introduction and Protocols',
          subs: [
            note('Network Layer Introduction', '', { source: 'official' }),
            note('Network-Layer Protocols', '', { source: 'official' }),
          ],
        },
        {
          title: 'Routing',
          subs: [
            note('Unicast Routing', '', { source: 'official' }),
            note('Multicast Routing - Multicasting Basics', '', { source: 'official' }),
            note('Intra-domain and Inter-domain Routing', '', { source: 'official' }),
          ],
        },
        {
          title: 'Next Generation IP and Quality of Service',
          subs: [
            note('Next Generation IP', '', { source: 'official' }),
            note('Quality of Service', '', { source: 'official' }),
          ],
        },
        {
          title: 'Hands-on: Linux Routing',
          subs: [
            note('Linux Kernel Implementation of Routing Table and Caches', '', { source: 'official' }),
            note('Routing Cache Implementation Overview', '', { source: 'official' }),
            note('Adding a Route with the ip Command', '', { source: 'official' }),
          ],
        },
      ],
    },
    {
      title: 'Data-Link Layer, Wireless LANs and Mobile IP',
      hours: 11,
      description:
        'Data link control, multiple access protocols, link-layer addressing, Ethernet, connecting devices, wireless LANs, mobile IP and packet sockets.',
      topics: [
        {
          title: 'Data Link Control and Multiple Access',
          subs: [
            note('Data Link Control (DLC)', '', { source: 'official' }),
            note('Multiple Access Protocols (MAC)', '', { source: 'official' }),
          ],
        },
        {
          title: 'Link-Layer Addressing and Ethernet',
          subs: [
            note('Link-Layer Addressing', '', { source: 'official' }),
            note('Ethernet Protocol', '', { source: 'official' }),
            note('Connecting Devices', '', { source: 'official' }),
          ],
        },
        {
          title: 'Wireless LANs and Mobile IP',
          subs: [
            note('Wireless LANs', '', { source: 'official' }),
            note('Mobile IP', '', { source: 'official' }),
          ],
        },
        {
          title: 'Hands-on: Packet Sockets',
          subs: [
            note('Datalink Provider Interface', '', { source: 'official' }),
            note('SOCK_PACKET and PF_PACKET', '', { source: 'official' }),
          ],
        },
      ],
    },
    {
      title: 'SNMP, ASN.1 and the Physical Layer',
      hours: 9,
      description:
        'Network management with SNMP and ASN.1, then data and signals, digital/analog transmission, bandwidth utilization and transmission media.',
      topics: [
        {
          title: 'Network Management',
          subs: [
            note('SNMP', '', { source: 'official' }),
            note('ASN.1', '', { source: 'official' }),
          ],
        },
        {
          title: 'Data and Signals',
          subs: [
            note('Data and Signals', '', { source: 'official' }),
            note('Analog and Digital Signals', '', { source: 'official' }),
          ],
        },
        {
          title: 'Transmission',
          subs: [
            note('Digital Transmission', '', { source: 'official' }),
            note('Analog Transmission', '', { source: 'official' }),
            note('Bandwidth Utilization', '', { source: 'official' }),
          ],
        },
        {
          title: 'Transmission Media',
          subs: [note('Guided and Unguided Media', '', { source: 'official' })],
        },
      ],
    },
  ],
};