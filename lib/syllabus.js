// Official KTU 2024 Scheme syllabus seed.
//
// Sources (verified against KTU curriculum documents, Nov 2025):
//  - B.Tech Curriculum-2024, Computer Science and Engineering (Group A), Semester 5
//  - B.Tech Curriculum-2024, Computer Science and Engineering (Data Science), Semester 5
//    (PCCDT503 Data Analytics; Big Data Processing is listed there as PBCDT504)
//  - KTU S5 syllabus compilation (mgmits.ac.in) for PECST525 Data Mining
//
// Module numbering, titles and topic wording follow the published syllabus.
// Course code PCCDT504 is kept exactly as requested even though the printed
// curriculum lists the Big Data Processing course as PBCDT504 (PBL course).
// Syllabus entries are editable and deletable in the app; nothing here is
// protected or hard-coded into the UI.

export const SCHEME = '2024 Scheme';
export const SEMESTER = 5;

const note = (title, body = '', extra = {}) => ({ title, body, ...extra });

export const DATA_MINING = {
  key: 'data-mining',
  title: 'Data Mining',
  code: 'PECST525',
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
    'CO1 — Understand the key processes of data mining and data warehousing concepts in application domains.',
    'CO2 — Apply appropriate pre-processing techniques to convert raw data into a suitable format for practical data mining tasks.',
    'CO3 — Illustrate the use of classification and clustering algorithms in various application domains.',
    'CO4 — Comprehend the use of association rule mining techniques.',
    'CO5 — Explain advanced data mining concepts and their applications in emerging domains.',
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
        'Data mining concepts and applications, KDD vs data mining, architecture of a typical data mining system, data warehouse and multidimensional model.',
      topics: [
        {
          title: 'Data Mining — Concepts and Applications',
          subs: [
            note('What is Data Mining?', '', { source: 'official' }),
            note('Applications of Data Mining', '', { source: 'official' }),
          ],
        },
        {
          title: 'KDD vs Data Mining',
          subs: [
            note('Knowledge Discovery in Databases (KDD) Process', '', { source: 'official' }),
            note('How Data Mining Differs from KDD', '', { source: 'official' }),
          ],
        },
        {
          title: 'Architecture of a Typical Data Mining System',
          subs: [note('Components of a Data Mining System', '', { source: 'official' })],
        },
        {
          title: 'Data Mining Functionalities',
          subs: [note('Functionalities and Classifications of Data Mining Systems', '', { source: 'official' })],
        },
        {
          title: 'Data Warehouse',
          subs: [
            note('Operational Database Systems vs Data Warehouses', '', { source: 'official' }),
            note('Data Warehouse Architecture', '', { source: 'official' }),
          ],
        },
        {
          title: 'Multidimensional Data Model',
          subs: [
            note('Warehouse Schema (Star, Snowflake, Fact Constellation)', '', { source: 'official' }),
            note('OLAP Operations', '', { source: 'official' }),
          ],
        },
      ],
    },
    {
      title: 'Data Preprocessing',
      hours: 9,
      description:
        'Need for preprocessing, data cleaning, integration and transformation, reduction, discretization and concept hierarchies.',
      topics: [
        {
          title: 'Need of Data Preprocessing',
          subs: [note('Why Raw Data Must Be Preprocessed', '', { source: 'official' })],
        },
        {
          title: 'Data Cleaning',
          subs: [
            note('Handling Missing Values', '', { source: 'official' }),
            note('Handling Noisy Data', '', { source: 'official' }),
          ],
        },
        {
          title: 'Data Integration and Transformation',
          subs: [note('Integration, Transformation and Normalization', '', { source: 'official' })],
        },
        {
          title: 'Data Reduction',
          subs: [
            note('Data Cube Aggregation', '', { source: 'official' }),
            note('Attribute Subset Selection', '', { source: 'official' }),
            note('Dimensionality Reduction', '', { source: 'official' }),
            note('Numerosity Reduction', '', { source: 'official' }),
          ],
        },
        {
          title: 'Discretization and Concept Hierarchy Generation',
          subs: [note('Discretization and Concept Hierarchies', '', { source: 'official' })],
        },
      ],
    },
    {
      title: 'Classification and Clustering',
      hours: 9,
      description:
        'Decision tree construction, information gain, Gini index, ID3, neural networks with back propagation, evaluation measures, k-means, hierarchical clustering and DBSCAN.',
      topics: [
        {
          title: 'Classification — Introduction',
          subs: [note('General Approach to Classification', '', { source: 'official' })],
        },
        {
          title: 'Decision Tree Construction',
          subs: [
            note('Decision Tree Construction Principle', '', { source: 'official' }),
            note('Information Gain', '', { source: 'official' }),
            note('Gini Index', '', { source: 'official' }),
            note('ID3 Algorithm', '', { source: 'official' }),
          ],
        },
        {
          title: 'Neural Networks',
          subs: [note('Neural Networks and Back Propagation', '', { source: 'official' })],
        },
        {
          title: 'Evaluation Measures',
          subs: [note('Accuracy, Precision, Recall and F1 Score', '', { source: 'official' })],
        },
        {
          title: 'Clustering',
          subs: [
            note('Introduction to Clustering and Distance Measures', '', { source: 'official' }),
            note('Clustering Paradigms', '', { source: 'official' }),
            note('Partitioning Algorithm — k-Means', '', { source: 'official' }),
            note('Hierarchical Clustering', '', { source: 'official' }),
            note('DBSCAN', '', { source: 'official' }),
          ],
        },
      ],
    },
    {
      title: 'Association Rule Analysis and Advanced Data Mining',
      hours: 10,
      description:
        'Association rule mining with Apriori and FP-Growth, web mining and PageRank, web usage mining, text mining and retrieval.',
      topics: [
        {
          title: 'Association Rule Mining',
          subs: [
            note('Association Rule Concepts', '', { source: 'official' }),
            note('Apriori Algorithm', '', { source: 'official' }),
            note('FP Growth Algorithm', '', { source: 'official' }),
          ],
        },
        {
          title: 'Web Mining',
          subs: [
            note('Web Content Mining', '', { source: 'official' }),
            note('Web Structure Mining — PageRank', '', { source: 'official' }),
            note('Web Usage Mining — Preprocessing and Data Structures', '', { source: 'official' }),
            note('Web Usage Mining — Pattern Discovery and Pattern Analysis', '', { source: 'official' }),
          ],
        },
        {
          title: 'Text Mining',
          subs: [
            note('Text Data Analysis and Information Retrieval', '', { source: 'official' }),
            note('Basic Measures for Text Retrieval', '', { source: 'official' }),
            note('Text Retrieval Methods', '', { source: 'official' }),
            note('Text Indexing Techniques', '', { source: 'official' }),
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
    'CO1 — Understand the internetworking design in terms of protocol stack and the role of various application layer protocols.',
    'CO2 — Illustrate the functions of the transport layer from connectionless and connection-oriented perspectives.',
    'CO3 — Identify how the network layer achieves host-to-host connectivity and caters to diverse service requirements.',
    'CO4 — Explain the nuances of the data link layer design and demonstrate various data link layer protocols.',
    'CO5 — Describe the fundamental characteristics of the physical layer and how it supports the upper layers.',
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
            note('I/O Multiplexing — select and poll', '', { source: 'official' }),
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
            note('Multicast Routing — Multicasting Basics', '', { source: 'official' }),
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