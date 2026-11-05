// Study notes for PCCST501 Computer Networks (KTU 2024 Scheme, Semester 5).
// Original summaries aligned to the official module topics; all editable.

const n = (intro, points, exam = '') =>
  `<p>${intro}</p><h3>Key points</h3><ul>${points
    .map((p) => `<li>${p}</li>`)
    .join('')}</ul>${
    exam ? `<blockquote><p><strong>Exam focus.</strong> ${exam}</p></blockquote>` : ''
  }`;

const M1 = {
  'Overview of the Internet': n(
    'The Internet is a worldwide network of interconnected networks that uses the TCP/IP protocol suite to move packets between hosts.',
    [
      '<strong>Edge:</strong> end systems (hosts) and access networks (DSL, cable, fibre, Wi-Fi, cellular).',
      '<strong>Core:</strong> packet switches (routers) connected by high-speed links; forwarding is store-and-forward.',
      '<strong>ISP hierarchy:</strong> access ISPs connect to regional and tier-1 ISPs, with peering and Internet exchange points.',
      'Packet switching statistically multiplexes links; it is efficient but offers best-effort service, so packets can be delayed, lost or reordered.',
      'Standards come from IETF RFCs, IEEE 802 and other bodies; protocols define formats, order and actions.',
      'Key metrics: bandwidth, throughput, delay (processing, queueing, transmission, propagation) and loss.',
    ],
    'Distinguish the Internet (infrastructure) from the WWW (an application running on it).'
  ),
  'Protocol Layering': n(
    'Layering divides network communication into independent modules, each providing a service to the layer above and using the layer below.',
    [
      'Benefits: modularity, easier design and testing, interoperability and independent evolution.',
      '<strong>OSI reference model:</strong> physical, data link, network, transport, session, presentation, application.',
      '<strong>TCP/IP model:</strong> network access (link), internet, transport, application; often drawn as five layers including physical.',
      '<strong>Encapsulation:</strong> each layer adds its own header (and sometimes trailer) to the data from above, forming a PDU.',
      'Peer layers communicate logically using protocols; adjacent layers communicate through interfaces.',
      'Layer responsibilities: link = framing/medium access, network = routing/forwarding, transport = end-to-end delivery, application = user services.',
    ],
    'Be able to map OSI layers to TCP/IP layers and name the PDU at each layer.'
  ),
  'Client-Server Paradigm': n(
    'In the client-server model a client requests a service and a server, which is usually always-on and has a fixed address, provides it.',
    [
      'The server listens on a well-known port; the client initiates the connection with an ephemeral port.',
      'The exchange is request-response; the server may be stateless (HTTP) or keep session state (FTP).',
      'Servers are often concurrent, handling many clients with processes, threads or event-driven I/O.',
      'Scaling is vertical (stronger server) or horizontal (multiple servers behind a load balancer, CDN or cache).',
      'Advantages: centralised control, easier management and security. Drawbacks: server bottlenecks, single point of failure and cost.',
      'Examples: web, e-mail, DNS and file servers.',
    ],
    'Compare with peer-to-peer on scalability, cost and fault tolerance.'
  ),
  'Peer-to-Peer Paradigm': n(
    'In a peer-to-peer (P2P) system, participating nodes (peers) act as both clients and servers and share resources directly.',
    [
      'Peers join and leave dynamically (churn), so the overlay must handle discovery and resilience.',
      'An overlay network maps logical peers onto the underlying Internet.',
      'Centralised P2P uses a directory server (Napster); pure P2P is fully decentralised (Gnutella); hybrid systems use a tracker or supernodes.',
      'Advantages: scalability, lower server cost, resilience and censorship resistance.',
      'Challenges: security, trust, free-riding, legal issues and inconsistent availability.',
      'Examples: BitTorrent, IPFS, blockchain networks and some voice/video systems.',
    ],
    'Know that the distinction from client-server is about symmetry of roles, not about the underlying TCP/IP.'
  ),
  'World Wide Web': n(
    'The World Wide Web is a hypertext application that lets clients retrieve linked resources from web servers using URLs and HTTP.',
    [
      '<strong>URL</strong> identifies a resource: scheme, host, port, path and query.',
      '<strong>HTML</strong> describes the structure and links of a page; CSS handles presentation.',
      'A browser resolves the host name through DNS, opens a TCP connection (usually TLS for HTTPS), sends an HTTP request and renders the response.',
      'Hyperlinks connect documents, creating a graph that search engines crawl and rank.',
      'The Web is stateless at the protocol level, but cookies and server-side sessions add state.',
      'The Web is an application on top of the Internet, not the Internet itself.',
    ],
    'Trace the steps from typing a URL to seeing the page; this is a favourite long answer.'
  ),
  'HTTP': n(
    'HTTP is an application-layer, request-response protocol for transferring web resources over TCP (or QUIC in HTTP/3).',
    [
      'Request line: method, path, version; common methods are GET, POST, PUT, PATCH, DELETE, HEAD and OPTIONS.',
      'Response contains a status line: 1xx information, 2xx success, 3xx redirection, 4xx client error, 5xx server error.',
      'Headers carry metadata (Host, Content-Type, Content-Length, Cache-Control, Cookie, User-Agent).',
      'HTTP/1.0 uses a new connection per request; HTTP/1.1 added persistent connections and pipelining.',
      'HTTP/2 multiplexes streams over one connection and compresses headers; HTTP/3 uses QUIC over UDP.',
      'HTTP is stateless, so cookies and tokens carry session identity. HTTPS is HTTP over TLS.',
    ],
    'Know 200, 301/302, 400, 403, 404, 500 and the difference between GET and POST.'
  ),
  'File Transfer Protocol (FTP)': n(
    'FTP transfers files between a client and server using two separate TCP connections.',
    [
      '<strong>Control connection</strong> on port 21 carries commands and replies; it stays open for the session.',
      '<strong>Data connection</strong> carries the file, opened for each transfer.',
      '<strong>Active mode:</strong> the server opens the data connection to the client (PORT); often blocked by NAT/firewalls.',
      '<strong>Passive mode:</strong> the client opens the data connection to the server (PASV); more firewall-friendly.',
      'Common commands: USER, PASS, PWD, CWD, LIST, RETR, STOR, TYPE, QUIT.',
      'FTP sends credentials in plaintext; SFTP/FTPS add encryption. Anonymous FTP allows public downloads.',
    ],
    'A classic exam question: why does FTP need two connections? Control is out-of-band from data.'
  ),
  'Electronic Mail (SMTP, POP3, IMAP)': n(
    'E-mail uses push protocols to move messages between servers and pull protocols to retrieve them.',
    [
      'A user agent (MUA) submits a message to the sender’s mail server; SMTP transfers it to the recipient’s mail server.',
      '<strong>SMTP</strong> (port 25/587) is a push protocol between mail servers; it uses commands such as HELO/EHLO, MAIL FROM, RCPT TO, DATA.',
      '<strong>POP3</strong> (port 110/995) downloads messages, often deleting them from the server; simple but poor multi-device sync.',
      '<strong>IMAP</strong> (port 143/993) keeps messages on the server and synchronises folders and flags across devices.',
      'MIME describes content type and encoding so non-ASCII text and attachments can be carried.',
      'SMTP is not used by the recipient to fetch mail; POP3/IMAP or webmail do that.',
    ],
    'Contrast SMTP (push, server-server) with POP3/IMAP (pull, client-server).'
  ),
  'Domain Name System (DNS)': n(
    'DNS is a hierarchical, distributed naming system that maps domain names to IP addresses and other records.',
    [
      'Namespace is a tree: root → top-level domains (com, org, in) → authoritative domains → hosts.',
      'A resolver asks a root server, then the TLD server, then the authoritative server (iterative resolution); a local resolver may do recursion for the client.',
      'Common records: A (IPv4), AAAA (IPv6), CNAME (alias), MX (mail), NS (name server), TXT and SOA.',
      'Responses are cached with a TTL to reduce latency and load.',
      'DNS normally uses UDP port 53; TCP is used for large responses and zone transfers.',
      'DNS is often called the Internet’s phone book, but it also supports service discovery and mail routing.',
    ],
    'Walk through a recursive and an iterative query; know why caching matters.'
  ),
  'P2P Networks': n(
    'Peer-to-peer networks distribute data and control across peers instead of concentrating them on a server.',
    [
      '<strong>Centralised:</strong> a directory server indexes files; simple but a single point of failure (Napster).',
      '<strong>Unstructured decentralised:</strong> peers flood queries over an overlay (Gnutella); resilient but inefficient.',
      '<strong>Structured:</strong> Distributed Hash Tables such as Chord map keys to peers in a logical ring with O(log n) lookup.',
      '<strong>Hybrid:</strong> central tracker or supernodes assist discovery while data flows peer-to-peer (BitTorrent).',
      'Overlay topology is logical, independent of the physical Internet topology.',
      'Design issues: churn, NAT traversal, security, incentives and search efficiency.',
    ],
    'Compare centralised, unstructured, structured and hybrid P2P with one example each.'
  ),
  'Case Study: BitTorrent': n(
    'BitTorrent is a P2P file-distribution protocol that splits files into pieces and exchanges them among peers in a swarm.',
    [
      'A <code>.torrent</code> file contains metadata: tracker URL, piece length, piece hashes and file list.',
      'A tracker helps peers find each other; DHT and peer exchange can reduce tracker dependence.',
      'A <strong>seeder</strong> has the complete file; a <strong>leecher</strong> is downloading.',
      'Peers request rare pieces first (rarest-first) to improve availability, then verify each piece by hash.',
      'Tit-for-tat: a peer uploads mainly to peers that upload to it; choking/unchoking provides incentives.',
      'BitTorrent scales well because upload capacity grows with the number of peers, but it depends on seeds and correct pieces.',
    ],
    'Explain choking, optimistic unchoking and rarest-first; these are the distinctive mechanisms.'
  ),
};

const M2 = {
  'Transport Layer Services': n(
    'The transport layer provides logical process-to-process communication between hosts.',
    [
      'It multiplexes data from several applications onto the network and demultiplexes it at the receiver using port numbers.',
      'Services can include reliable delivery, flow control, congestion control, connection setup and message boundaries.',
      'The network layer delivers host-to-host; the transport layer identifies the application process.',
      'TCP offers connection-oriented, reliable, byte-stream service; UDP offers connectionless, unreliable datagram service.',
      'Transport protocols may be connectionless (UDP) or connection-oriented (TCP); reliability is optional.',
    ],
    'Remember: IP addresses identify hosts, port numbers identify processes; the pair is a socket address.'
  ),
  'Transport Layer Protocols': n(
    'The Internet transport layer has two main protocols with opposite trade-offs.',
    [
      '<strong>UDP:</strong> connectionless, unreliable, no ordering, preserves message boundaries, 8-byte header, low overhead.',
      '<strong>TCP:</strong> connection-oriented, reliable, ordered byte stream, flow and congestion control, 20-byte minimum header.',
      'TCP is used for HTTP, SMTP, FTP, SSH and file transfer; UDP for DNS, DHCP, VoIP, streaming and online games.',
      'TCP retransmits lost segments and adapts its rate; UDP leaves recovery and timing to the application (or QUIC builds it on top).',
      'Neither protocol provides security; TLS runs above TCP (or QUIC uses TLS).',
    ],
    'A comparison table is the safest answer: connection, reliability, ordering, header, speed and examples.'
  ),
  'UDP': n(
    'The User Datagram Protocol is a minimal, connectionless transport protocol.',
    [
      'Header is 8 bytes: source port, destination port, length and checksum.',
      'It preserves datagram boundaries: one send corresponds to one receive (or a lost datagram).',
      'No handshake, no acknowledgements, no retransmission, no congestion or flow control.',
      'Checksum covers the pseudo-header, UDP header and data; it is optional in IPv4 but mandatory in IPv6.',
      'Low overhead and no head-of-line blocking make it suitable for DNS, DHCP, VoIP, video and games.',
      'Applications that need reliability must implement it themselves; QUIC does exactly this over UDP.',
    ],
    'Be ready to list the four header fields and explain why DNS uses UDP for normal queries.'
  ),
  'TCP': n(
    'TCP provides a reliable, ordered, connection-oriented byte stream with flow and congestion control.',
    [
      'Header fields include source/destination ports, sequence number, acknowledgement number, data offset, flags, window, checksum and urgent pointer.',
      '<strong>Three-way handshake:</strong> SYN → SYN+ACK → ACK establishes sequence numbers and options.',
      'Cumulative acknowledgements and a sliding window provide reliability and pipelining; lost segments are retransmitted (timeout or fast retransmit).',
      '<strong>Flow control:</strong> the receiver advertises a window (rwnd) so the sender does not overwhelm it.',
      '<strong>Congestion control:</strong> slow start, congestion avoidance (AIMD), fast retransmit/fast recovery; cwnd limits in-flight data.',
      'Connection termination uses FIN/ACK in both directions; TIME_WAIT lets delayed segments expire.',
    ],
    'Draw the handshake with sequence numbers and explain the difference between rwnd and cwnd.'
  ),
  'Sockets Introduction': n(
    'A socket is the programming interface to the transport layer: an endpoint identified by an IP address and a port.',
    [
      'In the BSD/POSIX API a socket is a file descriptor returned by <code>socket(domain, type, protocol)</code>.',
      'Common domains: AF_INET (IPv4), AF_INET6 (IPv6), AF_UNIX (local). Types: SOCK_STREAM (TCP), SOCK_DGRAM (UDP), SOCK_RAW.',
      'Server calls bind() to attach an address, listen() to accept connections, accept() to return a new connected socket.',
      'Client calls connect() to establish the association; then both use read()/write() or send()/recv().',
      'Addresses use network byte order (big-endian), converted with htons/htonl and ntohs/ntohl.',
      'Sockets can be blocking or non-blocking; the latter is used with select/poll/epoll for concurrency.',
    ],
    'Recall the server/client call order; a diagram of socket(), bind(), listen(), accept(), connect() is often asked.'
  ),
  'Elementary TCP Sockets': n(
    'Elementary TCP sockets follow a fixed sequence of calls for a connection-oriented byte stream.',
    [
      'Server: socket() → bind() → listen() → accept() → read()/write() → close().',
      'Client: socket() → connect() → write()/read() → close().',
      'listen() sets the backlog of pending connections; accept() blocks until a client connects and returns a new descriptor.',
      'The original listening socket stays open for further clients; each accepted connection has its own socket.',
      'TCP is a byte stream, so read() may return fewer bytes than requested; loop or use buffered I/O.',
      'close() sends FIN after queued data; SO_REUSEADDR helps restart a server without waiting for TIME_WAIT.',
    ],
    'Emphasise that accept() returns a new socket and that message boundaries are not preserved.'
  ),
  'TCP Client/Server Example': n(
    'A concurrent TCP server accepts connections and handles each client independently while continuing to accept new ones.',
    [
      'The server creates a listening socket, binds it to a port and calls listen().',
      'For each connection it accepts, it forks a child, creates a thread or registers the descriptor with an event loop.',
      'The child/thread reads the request, writes the response and closes its socket.',
      'The parent closes its copy of the accepted descriptor so the connection closes only when the child finishes.',
      'A simple echo server reads a line and writes it back; a real server must handle partial reads, signals (SIGPIPE) and timeouts.',
      'Iterative servers handle one client at a time; concurrent servers provide better responsiveness.',
    ],
    'Know the fork/thread/select variants and the reason for closing the accepted socket in the parent.'
  ),
  'I/O Multiplexing - select and poll': n(
    'I/O multiplexing lets one process wait on many descriptors without blocking on any single one.',
    [
      '<strong>select()</strong> uses fd_set bitmaps for read, write and exception sets, plus a timeout; it modifies the sets to indicate readiness.',
      'FD_ZERO, FD_SET, FD_CLR and FD_ISSET manipulate the sets; maxfd is one more than the largest descriptor.',
      'Limitations: FD_SETSIZE limit (often 1024), O(n) scanning and rebuilding sets on every call.',
      '<strong>poll()</strong> uses an array of pollfd structures with events and revents; no fixed descriptor limit and no bitmap rebuild.',
      'Both are level-triggered: they report readiness as long as data remains unread.',
      '<strong>epoll</strong> (Linux) registers descriptors once and scales better, with edge- or level-triggered modes.',
    ],
    'Compare select, poll and epoll on descriptor limit, complexity and triggering.'
  ),
  'Elementary UDP Sockets': n(
    'UDP sockets are connectionless: the server does not listen or accept, and each datagram carries its own destination.',
    [
      'Server: socket(AF_INET, SOCK_DGRAM, 0) → bind() → recvfrom() → sendto() → close().',
      'Client: socket() → sendto() → recvfrom() → close(); connect() is optional.',
      'recvfrom() returns the sender’s address so the server can reply; sendto() specifies the destination each time.',
      'One UDP socket can serve many peers; no per-connection state is created.',
      'Datagrams can be lost, duplicated or reordered; the application must add reliability if needed.',
      'A connected UDP socket fixes the peer address and can receive ICMP errors, but it still has no handshake.',
    ],
    'Emphasise that UDP preserves message boundaries and does not need listen/accept.'
  ),
  'Advanced I/O Functions': n(
    'Advanced socket I/O gives finer control over data transfer, buffering and event notification.',
    [
      '<strong>recv()/send()</strong> add flags such as MSG_PEEK, MSG_DONTWAIT, MSG_OOB and MSG_WAITALL.',
      '<strong>readv()/writev()</strong> perform scatter-gather I/O over multiple buffers in one system call.',
      '<strong>recvmsg()/sendmsg()</strong> use msghdr to carry control information (ancillary data, source address, flags).',
      'fcntl() sets O_NONBLOCK; non-blocking calls return EAGAIN/EWOULDBLOCK instead of waiting.',
      'Signal-driven I/O (O_ASYNC, SIGIO) and mmap() are other mechanisms; modern servers usually prefer epoll.',
      'These interfaces reduce system-call overhead and let servers handle many connections efficiently.',
    ],
    'Know what scatter-gather and ancillary data mean; a detailed code answer is rarely required.'
  ),
};

const M3 = {
  'Network Layer Introduction': n(
    'The network layer delivers packets from a source host to a destination host across multiple networks.',
    [
      '<strong>Forwarding</strong> moves a packet from an input to the correct output port using the local forwarding table; it is a fast, per-packet action.',
      '<strong>Routing</strong> computes the paths and builds the forwarding tables; it is a network-wide control process.',
      'IP provides a best-effort, connectionless datagram service: no guarantee of delivery, ordering or timing.',
      'Functions include logical addressing, encapsulation, fragmentation/reassembly, error reporting (ICMP) and sometimes QoS.',
      'Routers decrement the TTL, check the header checksum and may fragment if the next link has a smaller MTU.',
      'The network layer is implemented in every host and router, unlike transport and application layers.',
    ],
    'Keep forwarding (data plane) and routing (control plane) distinct; this distinction is frequently examined.'
  ),
  'Network-Layer Protocols': n(
    'The Internet network layer is a family of protocols around IPv4/IPv6.',
    [
      '<strong>IPv4</strong> header: version, IHL, DSCP/ECN, total length, identification, flags, fragment offset, TTL, protocol, header checksum, source and destination addresses.',
      '<strong>IPv6</strong> uses 128-bit addresses and a simplified fixed header with extension headers.',
      '<strong>ARP</strong> resolves an IPv4 address to a link-layer MAC address on the local network.',
      '<strong>ICMP</strong> reports errors and supports diagnostics (ping, traceroute).',
      '<strong>DHCP</strong> assigns IP addresses and configuration automatically.',
      '<strong>NAT</strong> translates private addresses to a public address, conserving IPv4 space.',
    ],
    'Be able to draw the IPv4 header and explain TTL, protocol and fragmentation fields.'
  ),
  'Unicast Routing': n(
    'Unicast routing finds a least-cost path from one source to one destination and installs it in forwarding tables.',
    [
      'The network is modelled as a graph with routers as nodes and links as weighted edges (cost, delay, hop count).',
      '<strong>Link-state (Dijkstra):</strong> every router floods link-state advertisements, builds the topology and runs Dijkstra for shortest paths (OSPF).',
      '<strong>Distance-vector (Bellman-Ford):</strong> each router exchanges distance vectors with neighbours and updates via <code>D(x,y) = min<sub>v</sub> {c(x,v) + D(v,y)}</code> (RIP).',
      'Distance vector suffers from slow convergence and the count-to-infinity problem; split horizon and poison reverse mitigate it.',
      'Hierarchical routing divides the network into areas/autonomous systems to reduce table size and control traffic.',
      'Routing must adapt to failures and traffic changes while avoiding loops and oscillation.',
    ],
    'Compare link-state and distance-vector on information exchanged, convergence and complexity.'
  ),
  'Multicast Routing - Multicasting Basics': n(
    'Multicast delivers one packet to a group of receivers, using a single address and a distribution tree.',
    [
      'IPv4 multicast addresses are class D (224.0.0.0/4); a host joins a group with IGMP.',
      'Routers build a multicast distribution tree: source-based (shortest-path) or shared (rendezvous point).',
      'Multicast forwarding uses reverse-path forwarding (RPF) to avoid loops and duplicates.',
      'IGMP lets hosts report membership; routers query hosts and maintain group state.',
      'Protocols include DVMRP, MOSPF and PIM (dense/sparse mode); multicast is useful for streaming and conferencing.',
      'Challenges: group management, tree maintenance, reliability and deployment across ISPs.',
    ],
    'Know IGMP’s role and the difference between source-based and shared trees.'
  ),
  'Intra-domain and Inter-domain Routing': n(
    'Routing is split into intra-domain (inside an autonomous system) and inter-domain (between autonomous systems).',
    [
      'An <strong>autonomous system (AS)</strong> is a network under one administrative authority with a single routing policy.',
      '<strong>Intra-domain (IGP):</strong> RIP, OSPF and IS-IS optimise paths inside the AS.',
      '<strong>Inter-domain (EGP):</strong> BGP exchanges reachability between ASes; it is a path-vector protocol.',
      'BGP chooses routes using policy (business relationships, preferences) rather than only shortest path.',
      'eBGP runs between ASes; iBGP distributes external routes inside an AS.',
      'Scalability, policy and trust are the main concerns at the inter-domain level.',
    ],
    'Explain why BGP is policy-based and why the Internet uses a hierarchy of routing domains.'
  ),
  'Next Generation IP': n(
    'IPv6 is the successor to IPv4, designed for a much larger address space and simpler forwarding.',
    [
      '128-bit addresses (about 3.4 × 10<sup>38</sup>), written as eight hexadecimal groups with :: compression.',
      'Fixed 40-byte base header with extension headers for options; routers do not fragment packets.',
      'No header checksum (link and transport layers handle integrity), which reduces per-hop work.',
      'Address types: unicast, multicast and anycast; broadcast is replaced by multicast.',
      'SLAAC lets hosts form addresses from router advertisements; DHCPv6 is also available.',
      'Transition mechanisms: dual stack, tunnelling (6to4, Teredo) and translation (NAT64).',
    ],
    'List the main header simplifications and the transition mechanisms.'
  ),
  'Quality of Service': n(
    'QoS provides different service levels for different traffic so that critical applications get the delay, jitter and bandwidth they need.',
    [
      'QoS parameters: reliability, delay, jitter and bandwidth.',
      '<strong>Traffic shaping:</strong> leaky bucket smooths bursts; token bucket allows a bounded burst.',
      '<strong>Scheduling:</strong> FIFO, priority queueing, weighted fair queueing and class-based queueing.',
      '<strong>Admission control:</strong> reserve resources before accepting a flow.',
      '<strong>IntServ</strong> reserves per-flow resources with RSVP; it scales poorly.',
      '<strong>DiffServ</strong> marks packets into classes (DSCP) and gives per-hop behaviour; it scales better.',
      'MPLS uses labels to forward traffic along engineered paths and support VPNs and traffic engineering.',
    ],
    'Compare IntServ (per-flow, reservation) with DiffServ (aggregate classes, no per-flow state).'
  ),
  'Linux Kernel Implementation of Routing Table and Caches': n(
    'Linux stores routes in a forwarding information base and uses the best matching route for each packet.',
    [
      'The main table is manipulated with <code>ip route</code>; multiple tables support policy routing.',
      'Lookup uses longest-prefix match over a compressed trie (LC-trie) for speed.',
      'A route contains destination/prefix, gateway, output device, metric, scope and table.',
      'The neighbour (ARP) table resolves next-hop link addresses; unresolved packets are queued or dropped.',
      'The kernel caches negative lookups and PMTU exceptions; modern kernels removed the old routing cache.',
      'Policy routing can select a table based on source address, mark or interface using rules.',
    ],
    'Know that the kernel does longest-prefix matching and that the old route cache is gone in current kernels.'
  ),
  'Routing Cache Implementation Overview': n(
    'Older Linux kernels kept a per-destination routing cache in front of the main table; it was removed because it was hard to scale and vulnerable to cache pollution.',
    [
      'The cache stored resolved routes (rtable/dst_entry) keyed by destination, source and TOS.',
      'It held PMTU exceptions and redirect information, avoiding a full lookup for every packet.',
      'Hash collisions and memory pressure made performance unpredictable; garbage collection was complex.',
      'Linux 3.6 removed the routing cache; lookups now go directly to the FIB trie, which is fast enough.',
      'Per-route exceptions (PMTU, redirects) are now stored with the route or in the neighbour table.',
      'The lesson: caching can help but must be designed for adversarial and high-churn traffic.',
    ],
    'If asked about the “routing cache”, mention that it is historical and explain why it was removed.'
  ),
  'Adding a Route with the ip Command': n(
    'The <code>ip route</code> command manages the kernel routing table.',
    [
      '<code>ip route show</code> lists routes; <code>ip route get 8.8.8.8</code> shows the route that would be used.',
      '<code>ip route add 10.0.0.0/8 via 192.168.1.1 dev eth0</code> adds a gateway route.',
      '<code>ip route add default via 192.168.1.1</code> sets the default route.',
      'Options include <code>metric</code>, <code>table</code>, <code>src</code>, <code>scope</code> and <code>proto</code>.',
      '<code>ip route del</code> removes a route; <code>ip route replace</code> adds or updates it.',
      'Persistent configuration belongs in the distribution’s network manager, not just the live command.',
    ],
    'Be able to write the command for a default route and a specific prefix via a gateway.'
  ),
};

const M4 = {
  'Data Link Control (DLC)': n(
    'The data-link layer turns a raw transmission link into a reliable frame-oriented channel between adjacent nodes.',
    [
      '<strong>Framing:</strong> character count, byte stuffing with escape characters, or bit stuffing with flags (01111110).',
      '<strong>Error detection:</strong> parity, checksum and CRC; CRC is the strongest common method.',
      '<strong>Error control:</strong> acknowledgements and retransmission (ARQ).',
      '<strong>Flow control:</strong> stop-and-wait, go-back-N and selective repeat keep the sender from overrunning the receiver.',
      'HDLC and PPP are common DLC protocols; PPP carries IP over point-to-point links.',
      'The link layer also handles addressing and medium access on shared links.',
    ],
    'Know bit stuffing and the three ARQ schemes with their window sizes and efficiency.'
  ),
  'Multiple Access Protocols (MAC)': n(
    'Medium access control decides how multiple stations share a common channel.',
    [
      '<strong>Channel partitioning:</strong> TDMA (time slots), FDMA (frequency bands), CDMA (codes).',
      '<strong>Random access:</strong> ALOHA, slotted ALOHA, CSMA, CSMA/CD (Ethernet) and CSMA/CA (Wi-Fi).',
      'ALOHA transmits immediately; slotted ALOHA doubles throughput to about 36.8%.',
      'CSMA listens before transmitting; CSMA/CD detects collisions and aborts early; CSMA/CA avoids collisions with ACKs and backoff.',
      '<strong>Controlled access:</strong> polling, token passing and reservation.',
      'Efficiency depends on load: contention works well at low load, controlled access at high load.',
    ],
    'Compare ALOHA, slotted ALOHA and CSMA throughput; know why Ethernet uses CSMA/CD and Wi-Fi uses CSMA/CA.'
  ),
  'Link-Layer Addressing': n(
    'Link-layer addresses identify network interfaces on a local link; Ethernet uses 48-bit MAC addresses.',
    [
      'A MAC address is written as six hexadecimal bytes, e.g. 00:1A:2B:3C:4D:5E.',
      'The first byte’s least significant bit distinguishes unicast (0) from multicast (1); all-ones is broadcast.',
      'The OUI (first 24 bits) identifies the manufacturer; the rest is assigned by the vendor.',
      'ARP maps an IPv4 address to a MAC address by broadcasting a request and caching the reply.',
      'Switches learn source MAC addresses and forward frames only to the port where the destination was seen.',
      'MAC addresses are local to the link; routers replace the link header at every hop.',
    ],
    'Explain why IP addresses are end-to-end while MAC addresses change hop by hop.'
  ),
  'Ethernet Protocol': n(
    'Ethernet is the dominant wired LAN technology, defined by IEEE 802.3.',
    [
      'Frame: preamble, SFD, destination MAC, source MAC, EtherType/length, payload, FCS (CRC).',
      'Minimum frame size is 64 bytes and maximum payload is 1500 bytes (jumbo frames are non-standard).',
      'Classic shared Ethernet uses CSMA/CD; modern switched full-duplex Ethernet does not need collision detection.',
      'Speeds evolved from 10 Mbps to 100 Mbps, 1 Gbps, 10 Gbps and beyond over twisted pair or fibre.',
      'Switches build a MAC address table and forward, filter or flood frames; VLANs (802.1Q) segment broadcast domains.',
      'Ethernet provides best-effort delivery; higher layers handle reliability.',
    ],
    'Draw the Ethernet frame and state the purpose of the FCS and the minimum frame size.'
  ),
  'Connecting Devices': n(
    'Devices operate at different layers and therefore connect networks in different ways.',
    [
      '<strong>Hub/repeater (L1):</strong> repeats bits; one collision domain, no filtering.',
      '<strong>Bridge/switch (L2):</strong> forwards frames by MAC address; separates collision domains.',
      '<strong>Router (L3):</strong> forwards packets between IP networks; separates broadcast domains.',
      '<strong>Gateway (L4–L7):</strong> translates between protocols or application formats.',
      'A switch reduces collisions but all ports still share a broadcast domain unless VLANs are used.',
      'Routers are needed to connect different subnets and to apply policy between them.',
    ],
    'Know which device separates a collision domain and which separates a broadcast domain.'
  ),
  'Wireless LANs': n(
    'Wireless LANs (IEEE 802.11, Wi-Fi) provide shared-medium local connectivity using radio.',
    [
      'Topology: a BSS has an access point; an ESS links BSSs through a distribution system; ad-hoc mode has no AP.',
      'CSMA/CA is used because a station cannot reliably detect collisions while transmitting; ACKs confirm delivery.',
      'DIFS/SIFS interframe spacing and random backoff coordinate access; RTS/CTS reduces the hidden-node problem.',
      'Stations may use fragmentation and rate adaptation; 802.11n/ac/ax add MIMO, wider channels and higher throughput.',
      'Security: WPA2/WPA3 with AES-CCMP; WEP is obsolete.',
      'Challenges: interference, hidden terminals, limited spectrum and power consumption.',
    ],
    'Explain the hidden-node problem and how RTS/CTS helps; contrast CSMA/CA with CSMA/CD.'
  ),
  'Mobile IP': n(
    'Mobile IP lets a mobile node keep its home IP address while moving between networks.',
    [
      'Entities: mobile node (MN), home agent (HA) on the home network, foreign agent (FA) on the visited network.',
      'The MN discovers an agent and obtains a care-of address (CoA), either foreign-agent or co-located.',
      'It registers the CoA with its home agent; the HA tunnels packets to the CoA.',
      'Correspondent nodes send packets to the home address; the HA intercepts and forwards them.',
      'Triangular routing is inefficient; route optimisation lets the correspondent node learn the CoA.',
      'Mobile IPv6 uses binding updates and avoids foreign agents; handover latency and security remain challenges.',
    ],
    'Draw the HA/FA/MN triangle and explain registration and tunnelling.'
  ),
  'Datalink Provider Interface': n(
    'The datalink provider interface is the kernel interface through which network protocols send and receive link-layer frames.',
    [
      'A protocol registers a packet handler for an EtherType with <code>dev_add_pack()</code>.',
      'Incoming frames are delivered by the network device driver to <code>netif_receive_skb()</code>, which dispatches to matching handlers.',
      'The <code>packet_type</code> structure holds the type, device, function and flags.',
      'Handlers can be protocol-specific (IP, ARP) or promiscuous taps (packet sockets).',
      'The interface hides device details and provides a consistent way to access the link layer.',
      'It is part of the Linux networking stack, not a separate wire protocol.',
    ],
    'Know the receive path: driver → netif_receive_skb → protocol handler.'
  ),
  'SOCK_PACKET and PF_PACKET': n(
    'Packet sockets give user space direct access to link-layer frames, which is how tools such as tcpdump and packet sniffers work.',
    [
      '<strong>SOCK_PACKET</strong> is the obsolete interface using <code>struct sockaddr</code> and a device name.',
      '<strong>PF_PACKET</strong> is the modern family with SOCK_RAW or SOCK_DGRAM and <code>sockaddr_ll</code>.',
      'A packet socket can bind to a protocol (ETH_P_ALL or a specific EtherType) and an interface index.',
      'It can capture outgoing and incoming frames; promiscuous mode is enabled with PACKET_ADD_MEMBERSHIP.',
      'SOCK_RAW includes the link header; SOCK_DGRAM strips it and provides a cooked header.',
      'Requires CAP_NET_RAW, so normal users cannot sniff arbitrary traffic.',
    ],
    'Mention that PF_PACKET replaced SOCK_PACKET and that tcpdump/libpcap use it.'
  ),
  'SNMP': n(
    'SNMP is an application-layer protocol for monitoring and managing network devices.',
    [
      'Components: manager, agent, managed objects and the Management Information Base (MIB).',
      'SMI defines the data types and object naming; objects are identified by OIDs in a tree.',
      'Operations: GET, GETNEXT, GETBULK, SET, RESPONSE and TRAP/INFORM.',
      'Agents listen on UDP 161; managers receive traps on UDP 162.',
      'SNMPv1/v2c use community strings (plaintext); SNMPv3 adds authentication and encryption (USM).',
      'MIB-II covers interfaces, IP, TCP, UDP and system information; RMON extends remote monitoring.',
    ],
    'Know the five basic operations and the difference between polling and traps.'
  ),
  'ASN.1': n(
    'ASN.1 (Abstract Syntax Notation One) is a standard language for describing data structures independent of machine encoding.',
    [
      'It defines types such as INTEGER, BOOLEAN, OCTET STRING, SEQUENCE, SET and CHOICE.',
      'Encoding rules include BER (basic), DER (distinguished, canonical) and PER (packed).',
      'BER uses tag-length-value (TLV) encoding; the tag identifies the type, the length the content size.',
      'Object identifiers (OIDs) name objects in a global tree, e.g. 1.3.6.1.2.1 for MIB-II.',
      'SMI is a subset of ASN.1 used by SNMP to define MIB objects.',
      'ASN.1 is also used in X.509 certificates, LDAP and telecommunications signalling.',
    ],
    'Be able to decode a simple TLV: tag 0x02, length, then the integer bytes.'
  ),
  'Data and Signals': n(
    'Data is an entity that conveys meaning; a signal is its physical representation for transmission.',
    [
      'Analog data takes continuous values (voice); digital data takes discrete values (text, binary files).',
      'A periodic analog signal is described by amplitude, frequency and phase; <code>T = 1/f</code>.',
      'Bandwidth is the range of frequencies a signal or channel can carry.',
      'A digital signal has discrete levels and a bit interval; its bandwidth depends on the bit rate and the pulse shape.',
      'Composite signals are sums of sine waves; Fourier analysis decomposes them into frequency components.',
      'Impairments: attenuation, distortion and noise reduce signal quality.',
    ],
    'Distinguish data (meaning) from signal (representation) and know amplitude/frequency/phase.'
  ),
  'Analog and Digital Signals': n(
    'Signals can be viewed in the time domain (amplitude versus time) or the frequency domain (amplitude versus frequency).',
    [
      'An analog signal is continuous in time and amplitude; a digital signal has discrete levels.',
      'A sine wave is the simplest periodic analog signal: <code>s(t) = A sin(2πft + φ)</code>.',
      'Digital signals are often drawn as square waves; real links smooth them, so bandwidth matters.',
      'The frequency domain shows the components of a composite signal; a channel must pass enough components to preserve the shape.',
      'Bit rate is bits per second; baud rate is signal changes per second. They differ when a symbol carries multiple bits.',
      'Digital transmission is generally more noise-resistant and easier to regenerate than analog transmission.',
    ],
    'Know that a digital signal has infinite bandwidth in theory; practical bandwidth limits the achievable bit rate.'
  ),
  'Digital Transmission': n(
    'Digital transmission sends digital data as digital signals over a link.',
    [
      '<strong>Line coding:</strong> NRZ, NRZ-L, Manchester, differential Manchester and AMI; Manchester is self-clocking.',
      '<strong>Block coding:</strong> adds redundancy (e.g. 4B/5B) to ensure transitions and detect errors.',
      '<strong>Scrambling:</strong> B8ZS and HDB3 replace long zero runs to maintain synchronisation.',
      '<strong>PCM:</strong> sampling (Nyquist rate ≥ 2 × highest frequency), quantisation and encoding.',
      'Quantisation error determines the signal-to-quantisation-noise ratio; more levels mean higher bit rate but more noise sensitivity.',
      'Delta modulation sends only the change in signal, trading quality for a lower bit rate.',
    ],
    'State the Nyquist sampling theorem and the PCM steps; Manchester encoding is a common short answer.'
  ),
  'Analog Transmission': n(
    'Analog transmission sends data by modulating a carrier signal.',
    [
      '<strong>ASK</strong> varies amplitude, <strong>FSK</strong> varies frequency, <strong>PSK</strong> varies phase.',
      '<strong>QAM</strong> combines amplitude and phase, so each symbol carries several bits.',
      'A modem modulates digital data onto an analog carrier and demodulates at the receiver.',
      'Baud rate is the number of symbols per second; bit rate = baud rate × bits per symbol.',
      'Higher-order modulation increases throughput but requires a better signal-to-noise ratio.',
      'Analog transmission is used on telephone lines, cable and radio links.',
    ],
    'Compare ASK, FSK, PSK and QAM on noise immunity and bits per symbol.'
  ),
  'Bandwidth Utilization': n(
    'Multiplexing and spread spectrum let multiple signals share a medium efficiently.',
    [
      '<strong>FDM:</strong> divide the channel into frequency bands; each signal gets its own band.',
      '<strong>WDM:</strong> FDM for optical fibre using different wavelengths.',
      '<strong>TDM:</strong> share time slots; synchronous TDM assigns fixed slots, statistical TDM allocates on demand.',
      '<strong>Spread spectrum:</strong> FHSS hops between frequencies; DSSS spreads with a code.',
      'Multiplexing increases utilisation but adds framing, guard bands and synchronisation overhead.',
      'Statistical multiplexing is more efficient for bursty traffic but can cause contention and delay.',
    ],
    'Know the difference between synchronous and statistical TDM and between FHSS and DSSS.'
  ),
  'Guided and Unguided Media': n(
    'Transmission media are either guided (a physical path) or unguided (free space).',
    [
      '<strong>Twisted pair:</strong> UTP/STP, cheap, used in Ethernet; categories 5e/6/6a support higher rates; susceptible to interference.',
      '<strong>Coaxial cable:</strong> better shielding and bandwidth than twisted pair; used in cable TV and older LANs.',
      '<strong>Optical fibre:</strong> very high bandwidth, low attenuation, immune to EMI; single-mode for long distance, multimode for shorter links.',
      '<strong>Radio waves:</strong> penetrate walls, used for Wi-Fi, cellular and broadcast; subject to interference and licensing.',
      '<strong>Microwaves:</strong> line-of-sight, high frequency, used for long-distance links and satellite.',
      '<strong>Infrared:</strong> short range, cannot pass through walls, used in remote controls and some indoor links.',
    ],
    'Match each medium to its bandwidth, distance, cost and interference characteristics.'
  ),
};

export const CN_NOTES = { ...M1, ...M2, ...M3, ...M4 };
