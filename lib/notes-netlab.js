// Networks Lab (PCCSL507) experiments, from the official lab manual
// "Networks Lab Manual_Students". Every experiment carries its aim, theory,
// algorithm, full code and the terminal commands used to run it.

export const NETWORKS_LAB_EXPERIMENTS = [
  {
    no: 1,
    title: 'Familiarization of Linux Networking Commands',
    aim: 'To learn and practise Linux networking commands for network configuration, monitoring, troubleshooting and analysis.',
    theory:
      'Linux ships a rich set of network utilities. ifconfig / ip show and configure interfaces, ping and traceroute test reachability and path, netstat and ss list connections and listening ports, nslookup and whois query name services, nmap scans hosts and ports, and iftop, bmon and speedtest-cli measure throughput. Modern distributions replace ifconfig and netstat with the ip and ss commands, but the older forms are still widely used in laboratories.',
    algorithm: [
      'Open a terminal and check the active interfaces with ifconfig (or ip addr show).',
      'Confirm link status on a wired interface with ifplugstatus eth0.',
      'Reach a host and measure round-trip time with ping -c 4 8.8.8.8.',
      'Trace the route and per-hop delay with traceroute 8.8.8.8 (or mtr 8.8.8.8).',
      'List connections and listening ports with netstat -tuln (or ss -tuln).',
      'Watch live bandwidth on an interface with iftop -i eth0 -n and bmon -p eth0.',
      'Resolve a domain with nslookup example.com and look it up with whois example.com.',
      'Scan the local host for open ports with nmap -sV localhost.',
      'Inspect NetworkManager state with nmcli device status and nmcli connection show.',
      'Measure link speed with speedtest-cli --simple.',
    ],
    code: [
      {
        file: 'netlab-commands.sh',
        lang: 'bash',
        src: String.raw`# 1. Interfaces and link status
ifconfig
ifconfig -a
ip addr show
ifplugstatus eth0

# 2. Reachability and path
ping -c 4 8.8.8.8
traceroute 8.8.8.8
mtr -r 8.8.8.8

# 3. Connections, routes and services
netstat -tuln
ss -tuln
netstat -r
ip route

# 4. Live bandwidth
iftop -i eth0 -n -N
bmon -p eth0

# 5. Name services and scanning
nslookup example.com
whois example.com
nmap -sV localhost

# 6. Connection management and link speed
nmcli device status
nmcli connection show
speedtest-cli --simple`,
      },
    ],
    run: String.raw`# Debian / Ubuntu: install the tools that are missing
sudo apt update
sudo apt install -y net-tools iproute2 traceroute mtr-tiny whois nmap iftop bmon speedtest-cli

# Run each block of the script above, for example
ifconfig -a
ping -c 4 8.8.8.8
netstat -tuln
nslookup example.com`,
    output:
      'ifconfig prints the interface name, flags, IP address, netmask and MAC address; ping reports round-trip times in ms; netstat -tuln lists the listening TCP/UDP ports; nslookup returns the A record of the queried domain.',
    result:
      'The Linux networking commands were executed successfully, and network configuration, connectivity, traffic and performance information were observed and analyzed.',
  },
  {
    no: 2,
    title: 'Wireshark HTTP Packet Analysis',
    aim: 'To capture and analyze HTTP packets using Wireshark and identify important HTTP request and response details including source and destination IP addresses, headers, status codes, and timing information.',
    theory:
      'Wireshark is a graphical network protocol analyzer that captures packets from a network interface and decodes them down to individual protocol fields. HTTP is a text based request response protocol: the browser sends a GET request carrying headers such as Host, User-Agent, Accept-Language and Accept-Encoding, and the server answers with a status line, headers such as Content-Length and Last-Modified, and the document body. Applying the display filter http isolates this exchange so every required field can be read off the packet details pane.',
    algorithm: [
      'Step 1: Open the web browser and clear the browser cache memory.',
      'Step 2: Open Wireshark and select the active network interface.',
      'Step 3: Click Start Capturing Packets.',
      'Step 4: Open any webpage in the browser.',
      'Step 5: In Wireshark, type http in the filter field and click Apply.',
      'Step 6: After sufficient packets are captured, select Capture then Stop.',
      'Step 7: Select the first HTTP GET request, expand the Internet Protocol section and note the source and destination IP addresses (compare with hostname -I for your own address).',
      'Step 8: Expand the Hypertext Transfer Protocol section of the GET request and read the Accept, Accept-Language, Accept-Encoding and Accept-Charset fields.',
      'Step 9: Find the Host and User-Agent fields to identify the URL of the website and the browser used.',
      'Step 10: Locate the first HTTP 200 OK response and note that its source and destination IPs are reversed compared with the GET request.',
      'Step 11: Read the Status Code and Reason Phrase of the first response message.',
      'Step 12: Read the Last-Modified header for the file age at the server and the Content-Length header for the size of the response body.',
      'Step 13: Subtract the Time column value of the GET packet from that of the corresponding response packet to get the round-trip time.',
      'Step 14: Read the request line of the GET packet to note the HTTP version used by the browser.',
    ],
    code: [
      {
        file: 'http-capture.sh',
        lang: 'bash',
        src: String.raw`# Wireshark HTTP packet analysis from the terminal.
# tshark is the command line companion of Wireshark and uses the same filters.

# 1. List the capture interfaces and pick the active one
tshark -D

# 2. Start capturing HTTP traffic on the chosen interface (1 = Wi-Fi / eth0)
#    into http-capture.pcapng, leave it running in one terminal
sudo tshark -i 1 -f "tcp port 80" -w http-capture.pcapng

# 3. While the capture runs, open a webpage in the browser, for example
#    http://example.com  (clear the browser cache first for a fresh GET)

# 4. Stop the capture with Ctrl+C once the page has loaded

# 5. Apply the http display filter and list the packets with the key fields
tshark -r http-capture.pcapng -Y http -T fields \
  -e frame.number -e ip.src -e ip.dst -e http.request.method \
  -e http.request.uri -e http.host -e http.user_agent -e http.response.code

# 6. Read the request headers of the first GET (accept, language, encoding, charset)
tshark -r http-capture.pcapng -Y "http.request.method == GET" -c 1 -V | \
  sed -n "/Hypertext Transfer Protocol/,/^$/p"

# 7. Read the response headers: status code, content-length and last-modified
tshark -r http-capture.pcapng -Y "http.response" -c 1 -V | \
  sed -n "/Hypertext Transfer Protocol/,/^$/p"

# 8. Time of every packet in the exchange, to subtract GET time from response time
tshark -r http-capture.pcapng -Y http -T fields \
  -e frame.number -e frame.time_relative -e http.request.method -e http.response.code`,
      },
    ],
    run: String.raw`# Install Wireshark, which also provides the tshark capture tool
sudo apt update
sudo apt install -y wireshark tshark

# Capture HTTP traffic for 60 seconds on the active interface (check with tshark -D)
# while you open a webpage in the browser
sudo tshark -i 1 -a duration:60 -f "tcp port 80" -w http-capture.pcapng

# Apply the http display filter to the saved capture
tshark -r http-capture.pcapng -Y http

# Same experiment in the GUI: start wireshark, pick the interface, click
# Start Capturing Packets, browse a page, type http in the display filter bar,
# then Capture -> Stop and read the packet details pane
wireshark http-capture.pcapng`,
    output:
      'The capture lists the GET request with the local IP as source and the server IP as destination together with the Host, User-Agent and Accept headers, and the 200 OK response with Content-Length, Last-Modified and the status code, from which the round-trip time and HTTP version were read.',
    result:
      'HTTP packets were successfully captured using Wireshark, and the GET request and corresponding response messages were analyzed to identify addresses, headers, status codes, response time and HTTP version.',
  },
  {
    no: 3,
    title: 'Capturing and Analyzing SMTP Packets Using Wireshark',
    aim: 'To capture and analyze SMTP packets using Wireshark and identify source and destination IP addresses, port numbers, SMTP commands, SMTP response codes, and email message content.',
    theory:
      'SMTP is a text based command reply protocol used to move mail: the client opens a TCP connection and exchanges commands such as HELO, MAIL FROM, RCPT TO, DATA and QUIT with three digit reply codes 220, 250, 354 and 221. Here a local aiosmtpd server listens on the non standard port 8025 so that no root privileges are needed, and a telnet session acts as the mail client. Capturing on the loopback interface keeps all traffic on the local host, and the filter tcp.port == 8025 shows only the SMTP conversation.',
    algorithm: [
      'Step 1: Start the local SMTP server in terminal 1 with python3 -m aiosmtpd -n -l localhost:8025 and keep the terminal running.',
      'Step 2: Open Wireshark, select the Loopback (lo) interface and click Start Capturing Packets.',
      'Step 3: In terminal 2 connect with telnet localhost 8025 and note the 220 service ready greeting.',
      'Step 4: Type HELO localhost and check for the 250 reply that identifies the client to the server.',
      'Step 5: Type MAIL FROM:<sender@test.com> and RCPT TO:<receiver@test.com>, each answered with 250 OK.',
      'Step 6: Type DATA, receive 354 Start mail input, then enter the From, To and Subject headers followed by the message body, one line at a time.',
      'Step 7: End the message with a single dot on a line by itself and check for 250 OK.',
      'Step 8: Type QUIT and check for the 221 reply that closes the transmission channel.',
      'Step 9: In Wireshark enter tcp.port == 8025 in the display filter bar so only the SMTP packets are shown.',
      'Step 10: Select Capture then Stop and save the capture file if required.',
      'Step 11: Note that both source and destination IP addresses are 127.0.0.1, the client port is assigned dynamically from the ephemeral range and the server port is 8025.',
      'Step 12: Identify the SMTP commands, the reply codes 220, 250, 354 and 221, and the IMF headers From, To and Subject carried inside the DATA payload.',
    ],
    code: [
      {
        file: 'smtp-capture.sh',
        lang: 'bash',
        src: String.raw`# SMTP packet capture with a local aiosmtpd server on port 8025

# 1. Install the async SMTP server module and wireshark
sudo apt update
sudo apt install -y python3-aiosmtpd wireshark tshark

# 2. Terminal 1: start the SMTP server on localhost:8025, keep it running
python3 -m aiosmtpd -n -l localhost:8025

# 3. Terminal 2: capture on the loopback interface, only port 8025 traffic
sudo tshark -i lo -f "tcp port 8025" -w smtp-capture.pcapng

# 4. Terminal 3: open the telnet session given in the run section
telnet localhost 8025

# 5. After QUIT stop the capture with Ctrl+C and list the SMTP packets
tshark -r smtp-capture.pcapng -Y "tcp.port == 8025" -T fields \
  -e frame.number -e ip.src -e ip.dst -e tcp.srcport -e tcp.dstport \
  -e smtp.command -e smtp.response.code

# 6. Dump the full conversation with commands, replies and the IMF content
tshark -r smtp-capture.pcapng -Y "smtp" -V

# 7. The same filter typed inside the Wireshark GUI display filter bar
#    tcp.port == 8025`,
      },
    ],
    run: String.raw`# Terminal 1 - start the local SMTP server on port 8025
python3 -m aiosmtpd -n -l localhost:8025

# Terminal 2 - start the capture on the loopback interface
sudo tshark -i lo -f "tcp port 8025" -w smtp-capture.pcapng

# Terminal 3 - connect with telnet and run the session exactly as shown.
# The indented comments are the expected server replies.
telnet localhost 8025
  # Trying 127.0.0.1...
  # Connected to localhost.
  # Escape character is '^]'.
  # 220 localhost Python SMTP 1.4.6
HELO localhost
  # 250 localhost Hello localhost, nice to meet you
MAIL FROM:<sender@test.com>
  # 250 OK
RCPT TO:<receiver@test.com>
  # 250 OK
DATA
  # 354 End data with <CR><LF>.<CR><LF>
From: sender@test.com
To: receiver@test.com
Subject: SMTP Test Mail

This is a test email sent for SMTP packet analysis. It contains a header section and a message body.
.
  # 250 OK
QUIT
  # 221 Bye

# Back in Wireshark type this in the display filter bar and press Enter
tcp.port == 8025
# then choose Capture -> Stop and save the capture file`,
    output:
      'The telnet session shows the 220 greeting, the 250 replies to HELO, MAIL FROM and RCPT TO, the 354 prompt after DATA, the 250 OK after the terminating dot and 221 Bye after QUIT, and the filter tcp.port == 8025 lists only those packets between 127.0.0.1 and 127.0.0.1 on server port 8025.',
    result:
      'SMTP packets were successfully captured and analyzed using Wireshark, and the source and destination addresses, ports, SMTP commands, reply codes and the IMF message content were identified and studied.',
  },
  {
    no: 4,
    title: 'Capturing and Analyzing DNS Packets Using Wireshark',
    aim: 'To capture and analyze DNS packets using Wireshark and identify DNS query and response messages, the transport protocol used, source and destination ports, message (transaction) IDs, flags, and DNS resource records.',
    theory:
      'The Domain Name System translates human readable names into IP addresses, and an ordinary lookup is a small request response exchange over UDP port 53. The query and its response share a 16 bit transaction ID so that replies can be matched to requests, and the QR bit in the flags field tells a query from a response. Clearing the resolver cache before the capture forces a fresh lookup, after which the query and response packets can be examined record by record.',
    algorithm: [
      'Step 1: Open Wireshark and select the active network interface on which traffic is to be captured.',
      'Step 2: Clear the system DNS cache with sudo systemd-resolve --flush-caches or sudo resolvectl flush-caches.',
      'Step 3: Clear the browser cache so that no previously cached DNS entry is reused.',
      'Step 4: Click Start Capturing Packets in Wireshark.',
      'Step 5: Visit a website that has not been recently accessed, or run nslookup for a domain, so a fresh DNS query is triggered.',
      'Step 6: Type dns in the Display Filter field and press Enter to display only DNS packets.',
      'Step 7: Select Capture then Stop once the DNS packets are captured.',
      'Step 8: Save the capture file with a .pcapng extension using File then Save As.',
      'Step 9: Locate the first DNS query packet, note its packet number and confirm that it uses UDP rather than TCP.',
      'Step 10: Find the source and destination port numbers of the query (ephemeral port to 53) and of the response (53 to the ephemeral port) and the destination IP address of the query.',
      'Step 11: Locate the corresponding DNS response, compare the transaction IDs of query and response and explain that they must match.',
      'Step 12: Determine the length of the DNS Flags field and identify the QR bit that distinguishes a query from a response.',
      'Step 13: Identify the response only flag fields AA, RA and RCODE and explain their functions.',
      'Step 14: Record the number of Question, Answer, Authority and Additional records in both the query and the response.',
    ],
    code: [
      {
        file: 'dns-capture.sh',
        lang: 'bash',
        src: String.raw`# DNS packet capture and analysis

# 1. Install wireshark / tshark
sudo apt update
sudo apt install -y wireshark tshark

# 2. Clear the DNS cache so the next lookup is a fresh query
sudo systemd-resolve --flush-caches
# or
sudo resolvectl flush-caches

# 3. Start capturing on the active interface (1 = Wi-Fi / eth0)
sudo tshark -i 1 -f "udp port 53" -w dns-capture.pcapng

# 4. While capturing, visit a new website in the browser or force a lookup
nslookup example.com

# 5. Stop the capture with Ctrl+C and apply the dns display filter
tshark -r dns-capture.pcapng -Y dns

# 6. List query and response with ports, transaction id, flags and records
tshark -r dns-capture.pcapng -Y dns -T fields \
  -e frame.number -e ip.src -e ip.dst -e udp.srcport -e udp.dstport \
  -e dns.flags.response -e dns.id -e dns.qry.name -e dns.a \
  -e dns.count.questions -e dns.count.answers -e dns.count.auth_rr \
  -e dns.count.add_rr

# 7. Verbose decode of the first query and then of its response
tshark -r dns-capture.pcapng -Y "dns.flags.response == 0" -c 1 -V
tshark -r dns-capture.pcapng -Y "dns.flags.response == 1" -c 1 -V`,
      },
    ],
    run: String.raw`# Flush the resolver cache before the capture (use the one your system has)
sudo systemd-resolve --flush-caches
sudo resolvectl flush-caches

# Capture DNS traffic for 60 seconds on the active interface
sudo tshark -i 1 -a duration:60 -f "udp port 53" -w dns-capture.pcapng

# Generate a fresh query while the capture runs
nslookup example.com

# Apply the dns display filter and open the capture in the GUI
tshark -r dns-capture.pcapng -Y dns
wireshark dns-capture.pcapng`,
    output:
      'The filter dns lists the query from an ephemeral port to port 53 and the response from port 53 back, both carrying the same transaction ID, with the QR bit distinguishing them and the answer records holding the resolved IP address.',
    result:
      'DNS packets were successfully captured and analyzed using Wireshark, and the query and response messages, transport protocol, ports, transaction IDs, flags and resource records were identified and studied.',
  },
  {
    no: 5,
    title: 'Client-Server Communication Using TCP',
    aim: 'To implement TCP-based client-server communication in which the client inputs an integer N and a square matrix of order N, sends the matrix to the server, and the server identifies the matrix type (upper triangular, lower triangular, diagonal or normal) and informs the client, which prints it.',
    theory:
      'Client-server communication using TCP is a model in which a client and a server exchange data over a reliable, connection oriented channel, so data is delivered accurately, in order and without loss. The server listens on a fixed port while the client initiates the connection, and once the connection is established both parties can send and receive data. In this application the client transmits a square matrix through a TCP socket, the server classifies it and returns the classification as a string that the client displays.',
    algorithm: [
      'STEP 1: Start the program and enter 1 at the prompt to run the server, or enter 2 to run the client.',
      'STEP 2: Include the required header files for socket programming.',
      'STEP 3: On the server, create a TCP socket using socket(AF_INET, SOCK_STREAM, 0) with address family AF_INET, port 8080 and IP address INADDR_ANY.',
      'STEP 4: Bind the socket to port 8080 using bind() and put it into listening mode using listen().',
      'STEP 5: On the client, create a TCP socket and set the server address family as AF_INET, port 8080 and IP address 127.0.0.1.',
      'STEP 6: Establish the connection with the server using connect().',
      'STEP 7: Read the order n of the square matrix from the user and send it to the server using send().',
      'STEP 8: Read the n x n matrix elements from the user and send every element to the server using send().',
      'STEP 9: On the server, accept the client connection using accept().',
      'STEP 10: Receive the order n and then the n x n matrix elements from the client using recv().',
      'STEP 11: Display the received matrix on the server.',
      'STEP 12: Initialize three flags upper = 1, lower = 1 and diagonal = 1.',
      'STEP 13: For every element, if a non-zero element is found below the principal diagonal set upper = 0, if a non-zero element is found above the principal diagonal set lower = 0, and if a non-zero element is found outside the principal diagonal set diagonal = 0.',
      'STEP 14: Determine the matrix type: if diagonal = 1 the matrix is diagonal, else if upper = 1 it is upper triangular, else if lower = 1 it is lower triangular, otherwise it is neither upper nor lower triangular nor diagonal.',
      'STEP 15: Send the result string to the client using send().',
      'STEP 16: On the client, receive the result using recv() and print it.',
      'STEP 17: Close the sockets with close() and stop the program.',
    ],
    code: [
      {
        file: 'exp5.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <arpa/inet.h>
#include <string.h>
#include <unistd.h>
#include <time.h>

void server(){
    int n;
    int data[100][100];
    struct sockaddr_in server_addr, client_addr;

    int sockfd = socket(AF_INET, SOCK_STREAM, 0);
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    
    bind(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr));
    listen(sockfd, 5);

    socklen_t len = sizeof(client_addr);
    int newsockfd = accept(sockfd, (struct sockaddr *)&client_addr, &len);

    recv(newsockfd, &n, sizeof(n), 0);   

    for (int i=0; i<n; i++){
        for (int j=0; j<n; j++){
            recv(newsockfd, &data[i][j], sizeof(int), 0);
        }
    }

    printf("Received matrix:\n");
    for (int i=0; i<n; i++){
        for (int j=0; j<n; j++){
            printf("%d ", data[i][j]);
        }
        printf("\n");
    }

    int upper = 1, lower = 1, diagonal = 1;

    for (int i=0; i<n; i++){
        for (int j=0; j<n; j++){
            if (i < j && data[i][j] != 0){
                lower = 0;
            }
            if (i > j && data[i][j] != 0){
                upper = 0;
            }
            if (i != j && data[i][j] != 0){
                diagonal = 0;
            }
        }
    }
    char msg[100];

    if (diagonal){
        strcpy(msg, "The matrix is diagonal.\n");
    }
    else if (upper){
        strcpy(msg, "The matrix is upper triangular.\n");
    }
    else if (lower){
        strcpy(msg, "The matrix is lower triangular.\n");
    }
    else{
        strcpy(msg, "The matrix is neither upper triangular, lower triangular, nor diagonal.\n");
    }

    send(newsockfd, msg, sizeof(msg), 0);

    close(newsockfd);
    close(sockfd);
}

void client(){
    int n;
    int data[100][100];
    struct sockaddr_in client_addr;

    client_addr.sin_family = AF_INET;
    client_addr.sin_port = htons(8080);
    inet_pton(AF_INET, "127.0.0.1", &client_addr.sin_addr);

    int sockfd = socket(AF_INET, SOCK_STREAM, 0);

    connect(sockfd, (struct sockaddr *)&client_addr, sizeof(client_addr));

    printf("Enter the size of the matrix (n): ");
    scanf("%d", &n);
    send(sockfd, &n, sizeof(n), 0);

    printf("Enter the elements of the matrix:\n");
    for (int i=0; i<n; i++){
        for (int j=0; j<n; j++){
            scanf("%d", &data[i][j]);
            send(sockfd, &data[i][j], sizeof(int), 0);
        }
    }

    char msg[100];
    recv(sockfd, msg, sizeof(msg), 0);
    printf("%s", msg);

    close(sockfd);
}

void main(){
    int choice;
    printf("Enter 1 for server, 2 for client: ");
    scanf("%d", &choice);

    if (choice == 1){
        server();
    }else if (choice == 2){
        client();
    }else{
        printf("Invalid choice.\n");
    }
}
`,
      },
    ],
    run: String.raw`# Compile the combined program once
gcc exp5.c -o exp5

# Terminal 1 - run it and choose the server
./exp5
# Enter 1 for server, 2 for client: 1

# Terminal 2 - run the same program and choose the client
./exp5
# Enter 1 for server, 2 for client: 2
# Enter the size of the matrix (n): 3
# Enter the elements of the matrix:
# 1 2 3
# 0 4 5
# 0 0 6
# The matrix is upper triangular.`,
    output:'The server prints the received matrix and replies with its type, and the client prints the returned string such as The matrix is upper triangular., then both sides close the socket.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 6,
    title: 'Client-Server Communication Using UDP',
    aim: 'To implement UDP-based client-server communication in which the client inputs a sentence containing internet abbreviations such as lol or brb, the server expands every recognised abbreviation into formal English, and the client prints the expanded sentence.',
    theory:
      'UDP is a connectionless transport layer protocol that sends datagrams without establishing a connection, which makes it fast and lightweight but without delivery, ordering or error recovery guarantees. The client sends a whole sentence written in internet slang as a single datagram, the server splits it into words with strtok(), looks every word up in an abbreviation table and rebuilds the sentence with the expanded forms, and the reply comes back over UDP. The exchange shows how UDP suits simple request response applications and how text processing can be added on the server side.',
    algorithm: [
      'STEP 1: Start the program and enter 1 at the prompt to run the server, or enter 2 to run the client.',
      'STEP 2: Include the required header files for socket programming and string manipulation.',
      'STEP 3: On the server, create a UDP socket using socket(AF_INET, SOCK_DGRAM, 0) with address family AF_INET, port 8080 and IP address INADDR_ANY.',
      'STEP 4: Bind the socket to port 8080 using bind().',
      'STEP 5: On the client, create a UDP socket and set the server address family AF_INET, port 8080 and IP address 127.0.0.1.',
      'STEP 6: Read a sentence containing abbreviations from the user using fgets() and send it to the server using sendto().',
      'STEP 7: On the server, receive the sentence using recvfrom().',
      'STEP 8: Split the sentence into words with strtok() and compare every word against the abbreviation table (lol, brb, omg, btw, idk, u, ur, thx, pls, gonna).',
      'STEP 9: Replace a matching abbreviation with its expanded form and keep every other word unchanged, joining the words back into a sentence with spaces.',
      'STEP 10: Send the expanded sentence back to the client using sendto().',
      'STEP 11: On the client, receive the reply using recvfrom() and print it as Formal English.',
      'STEP 12: Close the sockets with close() and stop the program.',
    ],
    code: [
      {
        file: 'exp6.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

void server() {
    int sockfd;
    char buffer[1024], result[1024] = "";

    char *words[] = {"lol", "brb", "omg", "btw", "idk", "u", "ur", "thx", "pls", "gonna"};
    char *meaning[] = {"laugh out loud", "be right back", "oh my god",
                       "by the way", "I don't know", "you", "your",
                       "thanks", "please", "going to"};

    struct sockaddr_in server_addr, client_addr;
    socklen_t len = sizeof(client_addr);

    sockfd = socket(AF_INET, SOCK_DGRAM, 0);

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    bind(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr));

    int n = recvfrom(sockfd, buffer, sizeof(buffer)-1, 0,
                     (struct sockaddr *)&client_addr, &len);

    buffer[n] = '\0';

    char *token = strtok(buffer, " ");
    while (token != NULL) {
        int found = 0;

        for (int i = 0; i < 10; i++) {
            if (strcmp(token, words[i]) == 0) {
                strcat(result, meaning[i]);
                found = 1;
                break;
            }
        }

        if (!found)
            strcat(result, token);

        strcat(result, " ");
        token = strtok(NULL, " ");
    }

    sendto(sockfd, result, strlen(result)+1, 0,
           (struct sockaddr *)&client_addr, len);

    close(sockfd);
}

void client() {
    int sockfd;
    char buffer[1024];

    struct sockaddr_in server_addr;

    sockfd = socket(AF_INET, SOCK_DGRAM, 0);

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr);

    printf("Enter a sentence: ");
    fgets(buffer, sizeof(buffer), stdin);

    sendto(sockfd, buffer, strlen(buffer), 0,
           (struct sockaddr *)&server_addr, sizeof(server_addr));

    int n = recvfrom(sockfd, buffer, sizeof(buffer)-1, 0, NULL, NULL);
    buffer[n] = '\0';

    printf("Formal English: %s\n", buffer);

    close(sockfd);
}

int main() {
    int choice;

    printf("Enter 1 for server, 2 for client: ");
    scanf("%d", &choice);
    getchar();

    if (choice == 1)
        server();
    else if (choice == 2)
        client();
    else
        printf("Invalid choice.\n");

    return 0;
}
`,
      },
    ],
    run:  String.raw`# Compile the combined program once
gcc exp6.c -o exp6

# Terminal 1 - run it and choose the server
./exp6
# Enter 1 for server, 2 for client: 1

# Terminal 2 - run it again and choose the client
./exp6
# Enter 1 for server, 2 for client: 2
# Enter a sentence: lol brb gonna see you u
# Formal English: laugh out loud be right back going to see you you`,
    output:
      'The client prints the sentence with every recognised abbreviation expanded to formal English, for example lol becomes laugh out loud and brb becomes be right back, while words that are not in the table are kept unchanged.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 7,
    title: 'Multi-user Chat Server Using TCP',
    aim: 'To implement a multi-user chat server using TCP in which the server accepts several clients at the same time, forks a separate child process to serve each one, and displays every message received from a client until that client exits.',
    theory:
      'A multi-user chat server lets several clients stay connected at the same time over TCP, which guarantees that every message arrives intact and in the order it was sent. The parent server accepts each new connection and forks a child process for it, then immediately goes back to accepting the next client, so no client blocks another. Each child reads lines from its own client and prints them on the server screen, and leaves the loop when the client disconnects after typing exit, which is the basic structure on which a broadcast chat server is built.',
    algorithm: [
      'Step 1: Start the program and enter 1 at the prompt to run the server, or enter 2 to run the client.',
      'Step 2: Include the required header files for socket programming and process control.',
      'Step 3: On the server, create a TCP socket, set address family AF_INET, port 8080 and IP address INADDR_ANY, bind() it and put it into listening mode using listen().',
      'Step 4: Accept the next client connection using accept().',
      'Step 5: Fork a child process using fork(); the child closes the listening socket while the parent closes the connected socket and returns to Step 4.',
      'Step 6: On the client, create a TCP socket and connect() to the server at 127.0.0.1 port 8080.',
      'Step 7: On the client, read a line from the user using fgets(); if the line is exit, close the socket and stop.',
      'Step 8: Send the line to the server using send() and repeat Step 7.',
      'Step 9: In the child, receive the message from the client using recv().',
      'Step 10: If no bytes arrive the client has gone, so close the socket and terminate the child process.',
      'Step 11: Print the message on the server as Client message and repeat Step 9.',
      'Step 12: Repeat Steps 4 to 11 so every client is served concurrently by its own child process.',
    ],
    code: [
      {
        file: 'exp7.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <arpa/inet.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>

void server(){
    int sockfd, newsockfd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t len = sizeof(client_addr);

    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    bind(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr));
    listen(sockfd, 5);

    printf("Server started...\n");
    fflush(stdout);

    while(1){
        len = sizeof(client_addr);
        newsockfd = accept(sockfd, (struct sockaddr *)&client_addr, &len);

        if(fork() == 0){
            close(sockfd);
            char buffer[1024];

            while(1){
                int n = recv(newsockfd, buffer, sizeof(buffer)-1, 0);

                if(n <= 0) break;

                buffer[n] = '\0';
                printf("Client message: %s", buffer);
                fflush(stdout);
            }

            close(newsockfd);
            exit(0);
        }

        close(newsockfd);
    }
}

void client(){
    int sockfd;
    char buffer[1024];
    struct sockaddr_in server_addr;

    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr);

    connect(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr));

    while(1){
        printf("Enter message: ");
        fgets(buffer, sizeof(buffer), stdin);

        if(strcmp(buffer, "exit\n") == 0) break;

        send(sockfd, buffer, strlen(buffer), 0);
    }

    close(sockfd);
}

int main(){
    int choice;

    printf("Enter 1 for server, 2 for client: ");
    scanf("%d", &choice);

    if(choice == 1)
        server();
    else if(choice == 2){
        getchar();
        client();
    }
    else
        printf("Invalid choice.\n");

    return 0;
}
`,
      },
    ],
    run:  String.raw`# Compile the combined program once
gcc exp7.c -o exp7

# Terminal 1 - run it and choose the server
./exp7
# Enter 1 for server, 2 for client: 1
# Server started...

# Terminal 2 - run it and choose the client
./exp7
# Enter 1 for server, 2 for client: 2
# Enter message: hello
# Enter message: exit

# The server terminal prints Client message: hello.
# More clients can run in further terminals; each is served
# by its own forked child process. Type exit to leave.`,
    output:
      'Each message sent by a client is printed on the server as Client message, and typing exit closes that client session while the server keeps serving the others.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 8,
    title: 'Concurrent Time Server Application Using UDP',
    aim: 'To implement a time server using UDP in which the client sends a word to the server, the server replies with the current date and time, and the client prints it until the user enters exit.',
    theory:
      'UDP is a connectionless transport layer protocol used for fast data transmission between systems; it uses datagram sockets (SOCK_DGRAM) and does not require connection establishment before communication. In this program the client sends a word to the server using UDP sockets, the server receives it, obtains the current system time using time() and ctime() and sends it back, and the client displays the received time. Communication continues until the user enters exit, which the server detects and uses to terminate the session.',
    algorithm: [
      'STEP 1: Start the program and enter 1 at the prompt to run the server, or enter 2 to run the client.',
      'STEP 2: Include the required header files for socket programming and time handling.',
      'STEP 3: Create a UDP socket using socket(AF_INET, SOCK_DGRAM, 0).',
      'STEP 4: On the server, set address family AF_INET, port number 8080 and IP address INADDR_ANY and bind() the socket to the port.',
      'STEP 5: On the client, set the server address family as AF_INET, port 8080 and server IP address 127.0.0.1.',
      'STEP 6: On the client, read a message from the user using scanf() and send it to the server using sendto().',
      'STEP 7: On the server, receive the message using recvfrom() and display it.',
      'STEP 8: Check whether the received message is exit; if yes, close the socket and stop the program.',
      'STEP 9: Otherwise obtain the current system time using time() and convert it to a string with ctime().',
      'STEP 10: Send the time string to the client using sendto().',
      'STEP 11: On the client, receive the time using recvfrom() and display it, then repeat Steps 6 to 11.',
      'STEP 12: When the client sends exit it closes the socket without waiting for a reply, and the server stops as well.',
    ],
    code: [
      {
        file: 'exp8.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <arpa/inet.h>
#include <string.h>
#include <time.h>
#include <unistd.h>

void server(){
    struct sockaddr_in server_addr, client_addr;
    
    char buffer[1024];
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    server_addr.sin_addr.s_addr = INADDR_ANY;

    bind(sockfd, (struct sockaddr *)&server_addr, sizeof(server_addr));
    socklen_t client_len = sizeof(client_addr);
    
    while(1){
        int n = recvfrom(sockfd, buffer, sizeof(buffer), 0, (struct sockaddr *)&client_addr, &client_len);
        
        if (n < 0) continue;
        buffer[n] = '\0';
        printf("Received: %s\n", buffer);
        if (strcmp(buffer, "exit") == 0) break;

        time_t now = time(NULL);
        snprintf(buffer, sizeof(buffer), "Server time: %s", ctime(&now));
        sendto(sockfd, buffer, strlen(buffer), 0, (struct sockaddr *)&client_addr, sizeof(client_addr));
    }
    close(sockfd);
}

void client(){
    struct sockaddr_in server_addr;
    char buffer[1024];
    
    int sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(8080);
    inet_pton(AF_INET, "127.0.0.1", &server_addr.sin_addr);

    while(1){
        printf("Enter message to send (or 'exit' to quit): ");
        scanf(" %[^\n]", buffer);

        sendto(sockfd, buffer, strlen(buffer), 0, (struct sockaddr *)&server_addr, sizeof(server_addr));
        
        if (strcmp(buffer, "exit") == 0) break;

        int n = recvfrom(sockfd, buffer, sizeof(buffer), 0, NULL, NULL);
        if (n < 0) continue;
        buffer[n] = '\0';
        printf("Received from server: %s\n", buffer);
    }
    close(sockfd);
}

void main(){
    int choice;
    printf("Enter 1 for server, 2 for client: ");
    scanf("%d", &choice);

    if (choice == 1){
        server();
    }else if (choice == 2){
        client();
    }else{
        printf("Invalid choice.\n");
    }
}
`,
      },
    ],
    run:  String.raw`# Compile the combined program once
gcc exp8.c -o exp8

# Terminal 1 - run it and choose the server
./exp8
# Enter 1 for server, 2 for client: 1

# Terminal 2 - run it and choose the client
./exp8
# Enter 1 for server, 2 for client: 2
# Enter message to send (or 'exit' to quit): time
# Received from server: Server time: Wed Nov 11 18:04:22 2026
# Enter message to send (or 'exit' to quit): exit`,
    output:
      'For every message other than exit the client prints the server clock returned by ctime() as Server time, and entering exit ends the session on both the client and the server.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 9,
    title: 'Concurrent File Server',
    aim: 'To develop a concurrent file server that provides the file requested by the client if it exists, sends an appropriate message if it does not, and sends its process ID (PID) to clients for displaying along with the file contents or the message.',
    theory:
      'A concurrent file server is a client-server application that allows multiple clients to request files at the same time over TCP, which provides reliable and connection oriented data transfer. The server listens for incoming requests and creates a separate child process for each client using fork(), so no request blocks another. The client sends a filename, the child opens it, replies with its own getpid() followed by either the file contents or a File not found message, and the client displays whatever it received.',
    algorithm: [
      'Step 1: Start the program and enter 1 at the prompt to run the server, or enter 2 to run the client.',
      'Step 2: Include the required header files for socket programming and process control.',
      'Step 3: On the server, create a TCP socket, set address family AF_INET, port 8080 and IP address INADDR_ANY, bind() it and put it into listening mode using listen().',
      'Step 4: Accept the next client connection using accept().',
      'Step 5: Fork a child process using fork(); the child closes the listening socket while the parent closes the connected socket and returns to Step 4.',
      'Step 6: In the child, receive the requested filename from the client using recv().',
      'Step 7: Send the child process ID obtained with getpid() to the client using send().',
      'Step 8: Open the requested file with fopen(); if it does not exist send the message File not found instead.',
      'Step 9: If the file exists, read it in blocks with fread() and send each block to the client using send().',
      'Step 10: Close the file and the client socket and terminate the child process.',
      'Step 11: On the client, create a TCP socket and connect() to the server at 127.0.0.1 port 8080.',
      'Step 12: Read the name of the required file from the user and send it to the server using send().',
      'Step 13: Receive the PID followed by the file contents or the File not found message and write it to the screen.',
      'Step 14: Close the socket; repeat Steps 4 to 10 so every client is served by its own child process.',
    ],
    code: [
      {
        file: 'exp9.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <sys/types.h>

void server(){
    int sockfd, newsockfd;
    struct sockaddr_in addr, client;
    socklen_t len = sizeof(client);

    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    addr.sin_addr.s_addr = INADDR_ANY;

    bind(sockfd, (struct sockaddr *)&addr, sizeof(addr));
    listen(sockfd, 5);

    printf("Server started...\n");

    while(1){
        newsockfd = accept(sockfd, (struct sockaddr *)&client, &len);

        if(fork() == 0){
            close(sockfd);

            char filename[1024], buffer[1024];
            int n = recv(newsockfd, filename, sizeof(filename)-1, 0);

            filename[n] = '\0';

            FILE *fp = fopen(filename, "r");

            char message[1024];
            snprintf(message, sizeof(message), "PID: %d\n", getpid());
            send(newsockfd, message, strlen(message), 0);

            if(fp == NULL){
                send(newsockfd, "File not found\n", 15, 0);
            }
            else{
                while((n = fread(buffer, 1, sizeof(buffer), fp)) > 0){
                    send(newsockfd, buffer, n, 0);
                }

                fclose(fp);
            }

            close(newsockfd);
            exit(0);
        }

        close(newsockfd);
    }
}

void client(){
    int sockfd;
    char filename[1024], buffer[1024];
    struct sockaddr_in addr;

    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    addr.sin_family = AF_INET;
    addr.sin_port = htons(8080);
    inet_pton(AF_INET, "127.0.0.1", &addr.sin_addr);

    connect(sockfd, (struct sockaddr *)&addr, sizeof(addr));

    printf("Enter filename: ");
    scanf("%1023s", filename);

    send(sockfd, filename, strlen(filename), 0);

    int n;
    while((n = recv(sockfd, buffer, sizeof(buffer), 0)) > 0){
        fwrite(buffer, 1, n, stdout);
    }

    close(sockfd);
}

int main(){
    int choice;

    printf("1. Server  2. Client: ");
    scanf("%d", &choice);

    if(choice == 1)
        server();
    else if(choice == 2)
        client();

    return 0;
}
`,
      },
    ],
    run: String.raw`# Compile the combined program once
gcc exp9.c -o exp9

# Terminal 1 - run it and choose the server
./exp9
# 1. Server  2. Client: 1
# Server started...

# Create a small sample file next to the program
printf 'Line one of the sample file.\nLine two of the sample file.\n' > sample.txt

# Terminal 2 - request an existing file
./exp9
# 1. Server  2. Client: 2
# Enter filename: sample.txt
# PID: 12345
# Line one of the sample file.
# Line two of the sample file.

# Terminal 3 - request a missing file while the first client is running
./exp9
# 1. Server  2. Client: 2
# Enter filename: missing.txt
# PID: 12346
# File not found`,
    output:
      'The client requesting sample.txt prints PID followed by the file contents, the client requesting missing.txt prints PID followed by File not found, and the two answers carry different child PIDs because each request is handled by its own forked process.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 10,
    title: 'Packet-Capturing Application',
    aim: 'To develop a packet-capturing application using raw sockets that captures every packet arriving at the network interface and prints its source IP address, destination IP address and protocol.',
    theory:
      'Packet capturing is the process of monitoring and analyzing network packets transmitted over a network. In Linux, raw sockets allow applications to access packets directly from the network interface at the data-link layer. This program creates a raw socket with PF_PACKET and SOCK_RAW to capture all incoming and outgoing packets, extracts the Ethernet and IP headers from each packet, and displays the source IP address, destination IP address and protocol type, demonstrating packet sniffing and the analysis of network traffic.',
    algorithm: [
      'STEP 1: Start the program.',
      'STEP 2: Include the required header files for raw socket programming.',
      'STEP 3: Create a raw socket using socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL)).',
      'STEP 4: Display Packet capturing started...',
      'STEP 5: Receive packets continuously using recvfrom().',
      'STEP 6: Extract the Ethernet header from the received packet and check whether h_proto equals ETH_P_IP; skip the packet if it is not an IPv4 packet.',
      'STEP 7: Extract the IP header that sits right after the Ethernet header.',
      'STEP 8: Display the source IP address, the destination IP address and the protocol number using inet_ntoa().',
      'STEP 9: Repeat Steps 5 to 8 for every incoming packet.',
      'STEP 10: Close the socket when the program is stopped.',
      'STEP 11: Stop the program.',
    ],
    code: [
      {
        file: 'exp10.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netinet/if_ether.h>
#include <netinet/ip.h>
#include <unistd.h>

void capture(){
    int sockfd;
    unsigned char buffer[65536];

    sockfd = socket(AF_PACKET, SOCK_RAW, htons(ETH_P_ALL));

    printf("Packet capturing started...\n");

    while(1){
        int n = recvfrom(sockfd, buffer, sizeof(buffer), 0, NULL, NULL);

        struct ethhdr *eth = (struct ethhdr *)buffer;

        if(ntohs(eth->h_proto) == ETH_P_IP){
            struct iphdr *ip = (struct iphdr *)(buffer + sizeof(struct ethhdr));

            struct in_addr src, dest;

            src.s_addr = ip->saddr;
            dest.s_addr = ip->daddr;

            printf("Source IP      : %s\n", inet_ntoa(src));
            printf("Destination IP : %s\n", inet_ntoa(dest));
            printf("Protocol       : %d\n", ip->protocol);
            printf("-----------------------------\n");
        }
    }

    close(sockfd);
}

int main(){
    capture();
    return 0;
}
`,
      },
    ],
    run:  String.raw`# Raw sockets need root privileges, so compile and run with sudo
gcc exp10.c -o exp10
sudo ./exp10
# Packet capturing started...
# Source IP      : 192.168.1.10
# Destination IP : 8.8.8.8
# Protocol       : 1
# -----------------------------

# Generate some traffic in a second terminal while the capture runs
ping -c 3 8.8.8.8
nslookup example.com

# Stop the capture with Ctrl+C`,
    output:
      'Every captured IPv4 packet prints its source IP address, destination IP address and protocol number until the program is stopped with Ctrl+C.',
    result: 'The required program was successfully executed, and output was verified.',
  },
];
