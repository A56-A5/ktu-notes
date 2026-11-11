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
      'STEP 1: Start the program.',
      'STEP 2: Include the required header files for socket programming.',
      'STEP 3: Create a TCP socket using socket().',
      'STEP 4: Define the server address structure. Set address family as AF_INET, port number as 9002 and IP address as 127.0.0.1.',
      'STEP 5: Establish connection with the server using connect().',
      'STEP 6: Read the order n of the square matrix from the user.',
      'STEP 7: Read the n x n matrix elements from the user and display the matrix.',
      'STEP 8: Send the order n to the server using send().',
      'STEP 9: Send the matrix elements to the server using send().',
      'STEP 10: Receive the matrix type from the server using recv().',
      'STEP 11: Display the received matrix type.',
      'STEP 12: Close the socket connection using close().',
      'STEP 13: On the server, create a TCP socket and set address family AF_INET, port 9002 and IP INADDR_ANY.',
      'STEP 14: Bind the socket to the specified port using bind() and put it into listening mode using listen().',
      'STEP 15: Accept the client connection using accept().',
      'STEP 16: Receive the order n from the client using recv() and then receive the matrix elements using recv().',
      'STEP 17: Initialize three flags upper = 1, lower = 1 and diagonal = 1.',
      'STEP 18: Check whether all elements below the principal diagonal are zero; if any non-zero element is found below the diagonal, set upper = 0.',
      'STEP 19: Check whether all elements above the principal diagonal are zero; if any non-zero element is found above the diagonal, set lower = 0.',
      'STEP 20: Check whether all non-diagonal elements are zero; if any non-zero element is found outside the principal diagonal, set diagonal = 0.',
      'STEP 21: Determine the matrix type. If diagonal = 1 the matrix is a Diagonal Matrix, else if upper = 1 it is an Upper Triangular Matrix, else if lower = 1 it is a Lower Triangular Matrix, otherwise it is a Normal Matrix.',
      'STEP 22: Send the matrix type to the client using send().',
      'STEP 23: Close the client socket and server socket using close().',
      'STEP 24: Stop.',
    ],
    code: [
      {
        file: 'server.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

int main()
{
    int server_fd, client_fd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t addr_size;

    int n;
    int matrix[50][50];
    int upper = 1, lower = 1, diagonal = 1;
    char result[100];

    /* Create TCP socket */
    server_fd = socket(AF_INET, SOCK_STREAM, 0);

    if (server_fd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(9002);

    /* Bind socket */
    if (bind(server_fd, (struct sockaddr *)&server_addr,
             sizeof(server_addr)) < 0)
    {
        perror("Bind failed");
        exit(1);
    }

    /* Listen for client */
    listen(server_fd, 5);

    printf("Server waiting for connection...\n");

    /* Accept client connection */
    addr_size = sizeof(client_addr);

    client_fd = accept(server_fd,
                       (struct sockaddr *)&client_addr,
                       &addr_size);

    if (client_fd < 0)
    {
        perror("Accept failed");
        exit(1);
    }

    printf("Client connected.\n");

    /* Receive order of matrix */
    recv(client_fd, &n, sizeof(n), 0);

    printf("Order of matrix received: %d\n", n);

    /* Receive matrix */
    recv(client_fd, matrix, sizeof(matrix), 0);

    printf("Matrix received from client:\n");

    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            printf("%d\t", matrix[i][j]);
        }
        printf("\n");
    }

    /* Check matrix type */

    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            /* Check elements below principal diagonal */
            if (i > j && matrix[i][j] != 0)
            {
                upper = 0;
            }

            /* Check elements above principal diagonal */
            if (i < j && matrix[i][j] != 0)
            {
                lower = 0;
            }

            /* Check non-diagonal elements */
            if (i != j && matrix[i][j] != 0)
            {
                diagonal = 0;
            }
        }
    }

    /* Determine matrix type */

    if (diagonal == 1)
    {
        strcpy(result, "Diagonal Matrix");
    }
    else if (upper == 1)
    {
        strcpy(result, "Upper Triangular Matrix");
    }
    else if (lower == 1)
    {
        strcpy(result, "Lower Triangular Matrix");
    }
    else
    {
        strcpy(result, "Normal Matrix");
    }

    printf("Matrix Type: %s\n", result);

    /* Send result to client */
    send(client_fd, result, strlen(result) + 1, 0);

    /* Close sockets */
    close(client_fd);
    close(server_fd);

    return 0;
}`,
      },
      {
        file: 'client.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

int main()
{
    int sockfd;
    struct sockaddr_in server_addr;

    int n;
    int matrix[50][50];
    char buffer[100];

    /* Create TCP socket */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);

    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(9002);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    /* Connect to server */
    if (connect(sockfd, (struct sockaddr *)&server_addr,
                sizeof(server_addr)) < 0)
    {
        perror("Connection failed");
        exit(1);
    }

    printf("Connected to server.\n");

    /* Read order of matrix */
    printf("Enter the order of square matrix: ");
    scanf("%d", &n);

    /* Read matrix elements */
    printf("Enter the matrix elements:\n");

    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            scanf("%d", &matrix[i][j]);
        }
    }

    /* Display matrix */
    printf("\nMatrix entered by client:\n");

    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            printf("%d\t", matrix[i][j]);
        }
        printf("\n");
    }

    /* Send order of matrix */
    send(sockfd, &n, sizeof(n), 0);

    /* Send matrix */
    send(sockfd, matrix, sizeof(matrix), 0);

    /* Receive matrix type */
    recv(sockfd, buffer, sizeof(buffer), 0);

    printf("\nMatrix Type received from server: %s\n", buffer);

    /* Close socket */
    close(sockfd);

    return 0;
}`,
      },
    ],
    run: String.raw`# Terminal 1 - compile and run the server
gcc server.c -o server
./server

# Terminal 2 - compile and run the client
gcc client.c -o client
./client
# Enter the order of square matrix: 3
# Enter the matrix elements:
# 1 2 3
# 0 4 5
# 0 0 6`,
    output:
      'The client prints the entered matrix and the line Matrix Type received from server: Upper Triangular Matrix, while the server prints the connection notice, the received matrix and Matrix Type: Upper Triangular Matrix.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 6,
    title: 'Client-Server Communication Using UDP',
    aim: 'To implement UDP-based client-server communication in which the client inputs a new-generation English sentence from the user and sends it to the server, the server translates the sentence to formal English and sends it back, and the client prints the translated sentence.',
    theory:
      'UDP is a connectionless transport layer protocol that sends datagrams without establishing a connection, which makes it fast and lightweight but without delivery, ordering or error recovery guarantees. The client sends a sentence written in modern internet slang as a single datagram, the server expands each abbreviation such as tbh, ig, tbf, atm, irl, lol, asap, omg, ttyl, idk and nvm into its formal phrase, and the translated sentence is sent back over UDP. The exchange shows how UDP suits simple request response applications and how text processing can be added on the server side.',
    algorithm: [
      'STEP 1: Start the program.',
      'STEP 2: Include the required header files for socket programming and string manipulation.',
      'STEP 3: Define a function replace() to replace abbreviations with their expanded forms in a string.',
      'STEP 4: Create a UDP socket using socket(AF_INET, SOCK_DGRAM, 0).',
      'STEP 5: Define the server address structure. Set address family as AF_INET, port number as 9002 and IP address as INADDR_ANY.',
      'STEP 6: Bind the socket to the specified port using bind().',
      'STEP 7: Wait for a message from the client using recvfrom() and store it in a buffer.',
      'STEP 8: Replace all predefined abbreviations with their expanded forms: tbh becomes to be honest, ig becomes I guess, tbf becomes to be fair, atm becomes at the moment, irl becomes in real life, lol becomes laughing out loud, asap becomes as soon as possible, omg becomes oh my God, ttyl becomes talk to you later, idk becomes I don\'t know and nvm becomes never mind.',
      'STEP 9: Send the modified message back to the client using sendto().',
      'STEP 10: Close the socket using close() and stop the program.',
      'STEP 11: On the client, create a UDP socket and set the server address family AF_INET, port 9002 and IP 127.0.0.1.',
      'STEP 12: Read a sentence containing abbreviations from the user using fgets() and remove the newline character.',
      'STEP 13: Send the sentence to the server using sendto().',
      'STEP 14: Receive the expanded sentence from the server using recvfrom().',
      'STEP 15: Display the expanded sentence on the screen, close the socket and stop the program.',
    ],
    code: [
      {
        file: 'server.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

/* Function to replace abbreviations */
void replace(char *str)
{
    char *abbreviations[] = {
        "tbh", "ig", "tbf", "atm", "irl",
        "lol", "asap", "omg", "ttyl", "idk", "nvm"
    };

    char *expanded[] = {
        "to be honest",
        "I guess",
        "to be fair",
        "at the moment",
        "in real life",
        "laughing out loud",
        "as soon as possible",
        "oh my God",
        "talk to you later",
        "I don't know",
        "never mind"
    };

    char result[2048];
    char temp[1024];
    char *pos;
    int i;

    strcpy(result, str);

    for (i = 0; i < 11; i++)
    {
        while ((pos = strstr(result, abbreviations[i])) != NULL)
        {
            strcpy(temp, pos + strlen(abbreviations[i]));

            *pos = '\0';

            strcat(result, expanded[i]);
            strcat(result, temp);
        }
    }

    strcpy(str, result);
}

int main()
{
    int sockfd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t len;
    char buffer[1024];

    /* Create UDP socket */
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);

    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(9002);

    /* Bind socket */
    if (bind(sockfd, (struct sockaddr *)&server_addr,
             sizeof(server_addr)) < 0)
    {
        perror("Bind failed");
        exit(1);
    }

    printf("UDP Server waiting...\n");

    /* Receive message from client */
    len = sizeof(client_addr);

    recvfrom(sockfd, buffer, sizeof(buffer), 0,
             (struct sockaddr *)&client_addr, &len);

    printf("Client: %s\n", buffer);

    /* Replace abbreviations */
    replace(buffer);

    printf("Expanded message: %s\n", buffer);

    /* Send modified message to client */
    sendto(sockfd, buffer, strlen(buffer) + 1, 0,
           (struct sockaddr *)&client_addr, len);

    /* Close socket */
    close(sockfd);

    return 0;
}`,
      },
      {
        file: 'client.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <arpa/inet.h>

int main()
{
    int sockfd;
    struct sockaddr_in server_addr;
    socklen_t len;
    char buffer[1024];

    /* Create UDP socket */
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);

    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(9002);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    /* Read sentence from user */
    printf("Enter a sentence containing abbreviations:\n");
    fgets(buffer, sizeof(buffer), stdin);

    /* Remove newline character */
    buffer[strcspn(buffer, "\n")] = '\0';

    /* Set address length */
    len = sizeof(server_addr);

    /* Send message to server */
    sendto(sockfd, buffer, strlen(buffer) + 1, 0,
           (struct sockaddr *)&server_addr, len);

    /* Receive expanded message */
    recvfrom(sockfd, buffer, sizeof(buffer), 0,
             (struct sockaddr *)&server_addr, &len);

    /* Display result */
    printf("Expanded sentence: %s\n", buffer);

    /* Close socket */
    close(sockfd);

    return 0;
}`,
      },
    ],
    run: String.raw`# Terminal 1 - compile and run the UDP server
gcc server.c -o server
./server

# Terminal 2 - compile and run the UDP client
gcc client.c -o client
./client
# Enter a sentence containing abbreviations:
# tbh ig tbf atm irl lol asap omg ttyl idk nvm`,
    output:
      'The server prints the slang sentence and the expanded message, and the client prints Expanded sentence followed by the formal English translation with all eleven abbreviations replaced.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 7,
    title: 'Multi-user Chat Server Using TCP',
    aim: 'To implement a multi-user chat server using TCP in which several clients are connected at the same time and every message typed by one user is broadcast to all the others.',
    theory:
      'A multi-user chat server lets several clients talk to each other at the same time over TCP, which guarantees that every message arrives intact and in the order it was sent. The parent server accepts each new connection and forks a child process for it, while the children publish incoming lines into a shared memory ring buffer protected by a process shared semaphore. Every child waits on select() with a short timeout, drains the messages it has not sent yet and broadcasts them to its own client, so all users see the same conversation.',
    algorithm: [
      'Step 1: Start the program.',
      'Step 2: Create a TCP socket using the socket() system call and bind it to port 9002 using bind().',
      'Step 3: Put the socket into listening mode using the listen() system call.',
      'Step 4: Create a shared memory region with mmap(MAP_SHARED | MAP_ANONYMOUS) holding a semaphore, a publish counter and a ring buffer of messages, and initialize the semaphore with sem_init(sem, 1, 1) so it is shared between processes.',
      'Step 5: Wait for incoming client connections and accept() one at a time.',
      'Step 6: Create a new child process using the fork() system call; the child closes the listening socket and the parent closes the connected socket, then the parent returns to accept().',
      'Step 7: In the child, receive the display name sent as the first message by the client and record the current ring position as the cursor for this client.',
      'Step 8: Publish a join notice into the shared ring buffer under the semaphore.',
      'Step 9: Use select() with a 200 ms timeout on the client socket.',
      'Step 10: If the socket is readable, receive the line typed by the client. If it is exit or the client has disconnected, publish a leave notice and terminate the child; otherwise publish the line prefixed with the display name.',
      'Step 11: Lock the semaphore, copy every message published since the last visit into a local buffer, advance the cursor and unlock the semaphore.',
      'Step 12: Send each copied message to this client so it appears on the chat screen of that user.',
      'Step 13: Repeat Steps 9 to 12 until the client leaves, then close the client socket and stop the child process.',
      'Step 14: On the client, create a TCP socket, connect to 127.0.0.1 port 9002 and send the display name as the first message.',
      'Step 15: Use select() on both the socket and standard input, print every message received from the server and send every line typed by the user.',
      'Step 16: When the user types exit, close the socket and stop the program.',
    ],
    code: [
      {
        file: 'server.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/mman.h>
#include <sys/select.h>
#include <arpa/inet.h>
#include <semaphore.h>

#define PORT      9002
#define RING_SIZE 64
#define MSG_SIZE  256
#define NAME_LEN  32

/* Shared chat state living in MAP_SHARED memory */
struct chat_shm {
    sem_t sem;                      /* guards head and the slots */
    int head;                       /* number of messages published so far */
    char lines[RING_SIZE][MSG_SIZE];
};

/* Publish one line into the shared ring buffer */
static void publish(struct chat_shm *chat, const char *line)
{
    sem_wait(&chat->sem);
    snprintf(chat->lines[chat->head % RING_SIZE], MSG_SIZE, "%s", line);
    chat->head++;
    sem_post(&chat->sem);
}

/* Read one NUL terminated chat message (TCP has no message boundaries) */
static ssize_t recv_msg(int fd, char *buf, size_t size)
{
    size_t got = 0;

    while (got < size - 1)
    {
        ssize_t n = recv(fd, buf + got, 1, 0);
        if (n <= 0)
            return n;
        if (buf[got] == '\0')
            return (ssize_t)(got + 1);
        if (buf[got] == '\n')
        {
            buf[got] = '\0';
            return (ssize_t)(got + 1);
        }
        got++;
    }
    buf[got] = '\0';
    return (ssize_t)got;
}

/* Serve one client inside a forked child process */
static void serve_client(int fd, struct chat_shm *chat)
{
    char name[NAME_LEN];
    char inbuf[MSG_SIZE];
    char line[MSG_SIZE + NAME_LEN + 8];
    char pending[RING_SIZE][MSG_SIZE];
    ssize_t n;
    int seen;

    /* The first message the client sends is its display name */
    n = recv_msg(fd, name, sizeof(name));
    if (n <= 0)
        return;
    if (name[0] == '\0')
        strcpy(name, "guest");

    /* Only messages published from now on are new for this client */
    sem_wait(&chat->sem);
    seen = chat->head;
    sem_post(&chat->sem);

    snprintf(line, sizeof(line), "*** %s has joined the chat", name);
    printf("%s\n", line);
    publish(chat, line);

    while (1)
    {
        fd_set rfds;
        struct timeval tv;
        int ready;
        int count, i;

        /* select() with a timeout so pending messages are drained regularly */
        FD_ZERO(&rfds);
        FD_SET(fd, &rfds);
        tv.tv_sec = 0;
        tv.tv_usec = 200000;

        ready = select(fd + 1, &rfds, NULL, NULL, &tv);
        if (ready < 0)
        {
            if (errno == EINTR)
                continue;
            perror("select");
            break;
        }

        /* A line typed by this client is published for everybody */
        if (ready > 0 && FD_ISSET(fd, &rfds))
        {
            memset(inbuf, 0, sizeof(inbuf));
            n = recv_msg(fd, inbuf, sizeof(inbuf));
            if (n <= 0)
                break;                      /* client hung up */
            if (strcmp(inbuf, "exit") == 0)
                break;                      /* client asked to quit */
            if (inbuf[0] == '\0')
                continue;
            snprintf(line, sizeof(line), "%s: %s", name, inbuf);
            printf("%s\n", line);
            publish(chat, line);
        }

        /* Drain every message published since the last visit */
        count = 0;
        sem_wait(&chat->sem);
        if (chat->head - seen > RING_SIZE)
            seen = chat->head - RING_SIZE;          /* ring overran us */
        while (seen < chat->head && count < RING_SIZE)
        {
            snprintf(pending[count], MSG_SIZE, "%s",
                     chat->lines[seen % RING_SIZE]);
            seen++;
            count++;
        }
        sem_post(&chat->sem);

        for (i = 0; i < count; i++)
        {
            if (send(fd, pending[i], strlen(pending[i]) + 1, 0) < 0)
                break;
        }
    }

    snprintf(line, sizeof(line), "*** %s has left the chat", name);
    printf("%s\n", line);
    publish(chat, line);
}

int main(void)
{
    int server_fd;
    int opt = 1;
    struct chat_shm *chat;
    struct sockaddr_in server_addr;

    /* Auto-reap child processes when they finish */
    signal(SIGCHLD, SIG_IGN);

    /* Shared memory ring buffer and process shared semaphore */
    chat = mmap(NULL, sizeof(*chat), PROT_READ | PROT_WRITE,
                MAP_SHARED | MAP_ANONYMOUS, -1, 0);
    if (chat == MAP_FAILED)
    {
        perror("mmap");
        exit(1);
    }
    chat->head = 0;
    if (sem_init(&chat->sem, 1, 1) != 0)
    {
        perror("sem_init");
        exit(1);
    }

    /* Create TCP socket */
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    if (bind(server_fd, (struct sockaddr *)&server_addr,
             sizeof(server_addr)) < 0)
    {
        perror("Bind failed");
        exit(1);
    }

    listen(server_fd, 10);
    printf("Chat server listening on port %d ...\n", PORT);

    while (1)
    {
        struct sockaddr_in client_addr;
        socklen_t addr_size = sizeof(client_addr);
        int client_fd;
        pid_t pid;

        client_fd = accept(server_fd,
                           (struct sockaddr *)&client_addr,
                           &addr_size);
        if (client_fd < 0)
        {
            perror("Accept failed");
            continue;
        }

        /* Flush so the child does not inherit a copy of our buffer */
        fflush(stdout);

        pid = fork();
        if (pid < 0)
        {
            perror("fork failed");
            close(client_fd);
            continue;
        }

        if (pid == 0)
        {
            /* Child: one process handles one connected client */
            close(server_fd);
            serve_client(client_fd, chat);
            close(client_fd);
            exit(0);
        }

        /* Parent keeps only the listening socket */
        close(client_fd);
    }

    close(server_fd);
    return 0;
}`,
      },
      {
        file: 'client.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <errno.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <sys/select.h>
#include <arpa/inet.h>

#define PORT     9002
#define MSG_SIZE 256

/* Read one NUL terminated chat message from the server */
static ssize_t recv_msg(int fd, char *buf, size_t size)
{
    size_t got = 0;

    while (got < size - 1)
    {
        ssize_t n = recv(fd, buf + got, 1, 0);
        if (n <= 0)
            return n;
        if (buf[got] == '\0')
            return (ssize_t)(got + 1);
        if (buf[got] == '\n')
        {
            buf[got] = '\0';
            return (ssize_t)(got + 1);
        }
        got++;
    }
    buf[got] = '\0';
    return (ssize_t)got;
}

int main(int argc, char *argv[])
{
    int sockfd;
    struct sockaddr_in server_addr;
    char name[32];
    char buffer[MSG_SIZE];

    /* Display name comes from the command line or from a prompt */
    if (argc > 1)
    {
        snprintf(name, sizeof(name), "%s", argv[1]);
    }
    else
    {
        printf("Enter your display name: ");
        if (fgets(name, sizeof(name), stdin) == NULL)
            return 1;
        name[strcspn(name, "\n")] = '\0';
    }

    /* Create TCP socket */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    if (connect(sockfd, (struct sockaddr *)&server_addr,
                sizeof(server_addr)) < 0)
    {
        perror("Connection failed");
        exit(1);
    }

    printf("Connected to the chat server as %s\n", name);
    printf("Type your messages (exit to quit)\n");

    /* Register the display name with the server */
    send(sockfd, name, strlen(name) + 1, 0);

    while (1)
    {
        fd_set rfds;
        struct timeval tv;
        int ready;
        int maxfd;

        /* Wait for either a broadcast message or a line typed by the user */
        FD_ZERO(&rfds);
        FD_SET(sockfd, &rfds);
        FD_SET(STDIN_FILENO, &rfds);
        maxfd = (sockfd > STDIN_FILENO) ? sockfd : STDIN_FILENO;
        tv.tv_sec = 1;
        tv.tv_usec = 0;

        ready = select(maxfd + 1, &rfds, NULL, NULL, &tv);
        if (ready < 0)
        {
            if (errno == EINTR)
                continue;
            perror("select");
            break;
        }

        if (ready == 0)
            continue;

        /* Message broadcast by the server */
        if (FD_ISSET(sockfd, &rfds))
        {
            memset(buffer, 0, sizeof(buffer));
            if (recv_msg(sockfd, buffer, sizeof(buffer)) <= 0)
            {
                printf("Server closed the connection.\n");
                break;
            }
            printf("%s\n", buffer);
            fflush(stdout);
        }

        /* Line typed by the user */
        if (FD_ISSET(STDIN_FILENO, &rfds))
        {
            if (fgets(buffer, sizeof(buffer), stdin) == NULL)
                break;
            buffer[strcspn(buffer, "\n")] = '\0';
            if (strcmp(buffer, "exit") == 0)
                break;
            if (buffer[0] == '\0')
                continue;
            send(sockfd, buffer, strlen(buffer) + 1, 0);
        }
    }

    close(sockfd);
    return 0;
}`,
      },
    ],
    run: String.raw`# Terminal 1 - compile and start the chat server
# (-pthread is required for the process shared semaphore sem_*)
gcc -pthread server.c -o server
./server

# Terminal 2 - first user, display name given on the command line
gcc client.c -o client
./client Alice
# Connected to the chat server as Alice
# hello everyone

# Terminal 3 - second user, the name is prompted instead
./client
# Enter your display name: Bob
# hi Alice, the chat works

# Every line typed by one user appears on the screen of the others.
# Type exit in any client to leave the chat; Ctrl+C stops the server.`,
    output:
      'Each connected client prints the join notice, the messages typed by the other users prefixed with their display names, and a leave notice when somebody exits, while the server terminal logs every join, message and leave event.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 8,
    title: 'Concurrent Time Server Application Using UDP',
    aim: 'To implement a concurrent Time Server application using UDP in which the client sends a time request to the server, the server sends its system time back, and the client displays the received time value until the user enters stop.',
    theory:
      'UDP is a connectionless transport layer protocol used for fast data transmission between systems; it uses datagram sockets (SOCK_DGRAM) and does not require connection establishment before communication. In this program the client sends a message to the server using UDP sockets, the server receives it, obtains the current system time using time() and localtime(), formats it with strftime() and sends it back, and the client displays the received time. Communication continues until the user enters stop, which the server detects and uses to terminate the session.',
    algorithm: [
      'STEP 1: Start the program.',
      'STEP 2: Include the required header files for socket programming and time handling.',
      'STEP 3: Create a UDP socket using socket(AF_INET, SOCK_DGRAM, 0).',
      'STEP 4: Define the server address structure. Set address family as AF_INET, port number as 1234 and IP address as INADDR_ANY.',
      'STEP 5: Bind the socket to the specified port using bind().',
      'STEP 6: Wait for a message from the client using recvfrom().',
      'STEP 7: Display the received message.',
      'STEP 8: Check whether the received message is stop. If yes, terminate the communication and go to STEP 13.',
      'STEP 9: Obtain the current system time using time() and localtime().',
      'STEP 10: Format the time as a string with strftime() and store it in the buffer.',
      'STEP 11: Send the formatted time to the client using sendto().',
      'STEP 12: Repeat Steps 6 to 11 until the client sends stop.',
      'STEP 13: Close the socket using close() and stop the program.',
      'STEP 14: On the client, create a UDP socket and set the server address family AF_INET, port 1234 and the server IP address.',
      'STEP 15: Read a message from the user. If it is stop, send it to the server, terminate the communication and go to STEP 19.',
      'STEP 16: Send the message to the server using sendto().',
      'STEP 17: Receive the current time from the server using recvfrom().',
      'STEP 18: Display the received time and repeat Steps 15 to 18.',
      'STEP 19: Close the socket using close() and stop the program.',
    ],
    code: [
      {
        file: 'server.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT        1234
#define BUFFER_SIZE 128

int main()
{
    int sockfd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t len;
    char buffer[BUFFER_SIZE];

    /* Create UDP socket */
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    /* Bind socket */
    if (bind(sockfd, (struct sockaddr *)&server_addr,
             sizeof(server_addr)) < 0)
    {
        perror("Bind failed");
        exit(1);
    }

    printf("UDP Time Server waiting on port %d ...\n", PORT);

    while (1)
    {
        /* STEP 6: Wait for a message from the client */
        len = sizeof(client_addr);
        int n = recvfrom(sockfd, buffer, sizeof(buffer) - 1, 0,
                         (struct sockaddr *)&client_addr, &len);
        if (n < 0)
        {
            perror("recvfrom failed");
            continue;
        }
        buffer[n] = '\0';
        buffer[strcspn(buffer, "\n")] = '\0';

        /* STEP 7: Display the received message */
        printf("Request from %s: %s\n",
               inet_ntoa(client_addr.sin_addr), buffer);

        /* STEP 8: Check whether the received message is stop */
        if (strcmp(buffer, "stop") == 0)
        {
            printf("Stop received, shutting down.\n");
            break;
        }

        /* STEP 9 and 10: Obtain and format the current system time */
        time_t current_time = time(NULL);
        struct tm *time_info = localtime(&current_time);
        char time_buffer[BUFFER_SIZE];

        strftime(time_buffer, sizeof(time_buffer),
                 "%Y-%m-%d %H:%M:%S", time_info);

        /* STEP 11: Send the formatted time to the client */
        sendto(sockfd, time_buffer, strlen(time_buffer) + 1, 0,
               (struct sockaddr *)&client_addr, len);

        printf("Time sent: %s\n", time_buffer);
    }

    /* STEP 13: Close the socket */
    close(sockfd);
    return 0;
}`,
      },
      {
        file: 'client.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT        1234
#define BUFFER_SIZE 128

int main()
{
    int sockfd;
    struct sockaddr_in server_addr;
    char buffer[BUFFER_SIZE];

    /* Create UDP socket */
    sockfd = socket(AF_INET, SOCK_DGRAM, 0);
    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    printf("Connected to the UDP time server.\n");
    printf("Enter a message, stop to quit.\n");

    while (1)
    {
        printf("\nEnter message: ");
        if (fgets(buffer, BUFFER_SIZE, stdin) == NULL)
            break;

        /* Remove newline character */
        buffer[strcspn(buffer, "\n")] = '\0';

        /* STEP 6: Check for stop */
        if (strcmp(buffer, "stop") == 0)
        {
            sendto(sockfd, buffer, strlen(buffer) + 1, 0,
                   (struct sockaddr *)&server_addr,
                   sizeof(server_addr));
            printf("Stopped.\n");
            break;
        }

        /* STEP 7: Send message to server */
        sendto(sockfd, buffer, strlen(buffer) + 1, 0,
               (struct sockaddr *)&server_addr,
               sizeof(server_addr));

        /* STEP 8: Receive time from server */
        int n = recvfrom(sockfd, buffer, BUFFER_SIZE - 1, 0,
                         NULL, NULL);
        if (n < 0)
        {
            perror("recvfrom failed");
            continue;
        }
        buffer[n] = '\0';

        /* STEP 9: Display received time */
        printf("Current Server Time: %s\n", buffer);
    }

    /* STEP 11: Close the socket */
    close(sockfd);
    return 0;
}`,
      },
    ],
    run: String.raw`# Terminal 1 - compile and run the UDP time server on port 1234
gcc server.c -o server
./server

# Terminal 2 - compile and run the client
gcc client.c -o client
./client
# Enter a message, stop to quit.
#
# Enter message: time
# Current Server Time: 2026-01-12 10:35:41
#
# Enter message: again
# Current Server Time: 2026-01-12 10:35:46
#
# Enter message: stop
# Stopped.`,
    output:
      'For every request other than stop the client prints Current Server Time followed by the formatted server clock in YYYY-MM-DD HH:MM:SS form, and entering stop ends the session on both the client and the server.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 9,
    title: 'Concurrent File Server',
    aim: 'To develop a concurrent file server that provides the file requested by the client if it exists, sends an appropriate message if it does not, and sends its process ID (PID) to clients for displaying along with the file contents or the message.',
    theory:
      'A concurrent file server is a client-server application that allows multiple clients to request files at the same time over TCP, which provides reliable and connection oriented data transfer. The server listens for incoming requests and creates a separate child process for each client using fork(), so no request blocks another. The client sends a filename, the child opens it, replies with its own getpid() followed by either the file contents or a File not found message, and the client displays whatever it received.',
    algorithm: [
      'Step 1: Start the client program.',
      'Step 2: Create a TCP socket using the socket() system call.',
      'Step 3: Initialize the server address structure with the server IP address 127.0.0.1 and port number 9002.',
      'Step 4: Establish a connection with the server using the connect() system call.',
      'Step 5: Prompt the user to enter the name of the required file and read it into a buffer.',
      'Step 6: Send the filename to the server using the send() system call.',
      'Step 7: Wait for the server response and receive either the file contents or a File not found message, both prefixed with the server process ID.',
      'Step 8: Display the received information on the client screen, close the socket and stop the program.',
      'Step 9: Start the server program and create a TCP socket using the socket() system call.',
      'Step 10: Initialize the server address structure with address family AF_INET, IP address INADDR_ANY and port number 9002.',
      'Step 11: Bind the socket using bind(), put it into listening mode using listen() and display a message that the server is ready.',
      'Step 12: Accept a client connection using accept().',
      'Step 13: Create a new child process using fork(); in the child close the listening socket, receive the filename and continue at Step 15, while the parent closes the connected socket and returns to Step 12.',
      'Step 14: In the child, attempt to open the requested file using fopen().',
      'Step 15: If the file exists, read it line by line into a buffer after writing a header that contains the child PID from getpid() and the text File Contents.',
      'Step 16: If the file does not exist, prepare a response containing the PID from getpid() and the message File not found.',
      'Step 17: Send the prepared response to the client using send().',
      'Step 18: Close the file if it was opened, close the client socket and terminate the child process.',
      'Step 19: Repeat Steps 12 to 18 for every incoming client request so that several clients are served concurrently.',
      'Step 20: Close the server socket when the server is terminated and stop the program.',
    ],
    code: [
      {
        file: 'server.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <signal.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT        9002
#define BUFFER_SIZE 4096

int main()
{
    int server_fd, client_fd;
    struct sockaddr_in server_addr, client_addr;
    socklen_t addr_size;

    /* Auto-reap child processes when they finish */
    signal(SIGCHLD, SIG_IGN);

    /* Create TCP socket */
    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    {
        int opt = 1;
        setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons(PORT);

    /* Bind socket */
    if (bind(server_fd, (struct sockaddr *)&server_addr,
             sizeof(server_addr)) < 0)
    {
        perror("Bind failed");
        exit(1);
    }

    /* Listen for clients */
    listen(server_fd, 5);
    printf("File Server waiting for connection...\n");

    while (1)
    {
        /* Accept client connection */
        addr_size = sizeof(client_addr);
        client_fd = accept(server_fd,
                           (struct sockaddr *)&client_addr,
                           &addr_size);
        if (client_fd < 0)
        {
            perror("Accept failed");
            continue;
        }

        /* Flush so the child does not inherit a copy of our buffer */
        fflush(stdout);

        /* STEP 13: Create a new child process for this client */
        pid_t pid = fork();
        if (pid < 0)
        {
            perror("fork failed");
            close(client_fd);
            continue;
        }

        if (pid == 0)
        {
            /* =====================================================
               STEP 9 to 18: CHILD PROCESS
               ===================================================== */
            char filename[100];
            char buffer[BUFFER_SIZE];
            FILE *fp;
            int offset = 0;
            pid_t child_pid;

            /* The child does not need the listening socket */
            close(server_fd);

            memset(filename, 0, sizeof(filename));
            int bytes_received = recv(client_fd,
                                      filename,
                                      sizeof(filename) - 1,
                                      0);
            if (bytes_received <= 0)
            {
                printf("Failed to receive filename.\n");
                close(client_fd);
                exit(1);
            }
            /* Add null character at the end of filename */
            filename[bytes_received] = '\0';
            filename[strcspn(filename, "\n")] = '\0';

            printf("Requested file: %s\n", filename);

            /* -------------------------------------------------
               STEP 14: Attempt to open the requested file
               using fopen()
               ------------------------------------------------- */
            fp = fopen(filename, "r");
            memset(buffer, 0, sizeof(buffer));
            child_pid = getpid();

            if (fp != NULL)
            {
                char line[512];

                /* -------------------------------------------------
                   Header with the child PID and the file contents
                   ------------------------------------------------- */
                offset += snprintf(buffer + offset,
                                   sizeof(buffer) - offset,
                                   "Server Child PID: %d\n"
                                   "File Contents:\n",
                                   child_pid);

                /* -------------------------------------------------
                   Read the file contents line by line
                   ------------------------------------------------- */
                while (fgets(line, sizeof(line), fp) != NULL)
                {
                    /* Check whether enough space is available
                       in the buffer */
                    if (offset + strlen(line) < sizeof(buffer))
                    {
                        strcpy(buffer + offset, line);
                        offset += strlen(line);
                    }
                    else
                    {
                        printf("File is too large for buffer.\n");
                        break;
                    }
                }
                fclose(fp);
            }
            else
            {
                /* -------------------------------------------------
                   STEP 16: The file does not exist
                   ------------------------------------------------- */
                snprintf(buffer, sizeof(buffer),
                         "Server Child PID: %d\n"
                         "File not found\n",
                         child_pid);
            }

            /* -----------------------------------------------------
               STEP 17: Send the prepared response to the client
               ----------------------------------------------------- */
            send(client_fd, buffer, strlen(buffer), 0);
            printf("Response sent to client.\n");

            /* STEP 18: Close the client socket and terminate */
            close(client_fd);
            exit(0);
        }

        /* The parent does not communicate with the current client */
        close(client_fd);
    }

    close(server_fd);
    return 0;
}`,
      },
      {
        file: 'client.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>

#define PORT        9002
#define BUFFER_SIZE 4096

int main()
{
    int sockfd;
    struct sockaddr_in server_addr;
    char filename[100];
    char buffer[BUFFER_SIZE];
    int total = 0;

    /* Create TCP socket */
    sockfd = socket(AF_INET, SOCK_STREAM, 0);
    if (sockfd < 0)
    {
        perror("Socket creation failed");
        exit(1);
    }

    /* Define server address */
    server_addr.sin_family = AF_INET;
    server_addr.sin_port = htons(PORT);
    server_addr.sin_addr.s_addr = inet_addr("127.0.0.1");

    /* Connect to server */
    if (connect(sockfd, (struct sockaddr *)&server_addr,
                sizeof(server_addr)) < 0)
    {
        perror("Connection failed");
        exit(1);
    }

    /* Prompt the user for the name of the required file */
    printf("Enter the name of the required file: ");
    if (fgets(filename, sizeof(filename), stdin) == NULL)
    {
        close(sockfd);
        return 1;
    }
    filename[strcspn(filename, "\n")] = '\0';

    /* Send filename to the server */
    send(sockfd, filename, strlen(filename), 0);

    /* Receive the response: PID plus contents or the error message */
    memset(buffer, 0, sizeof(buffer));
    while (total < (int)sizeof(buffer) - 1)
    {
        int n = recv(sockfd, buffer + total,
                     sizeof(buffer) - 1 - total, 0);
        if (n <= 0)
            break;
        total += n;
    }
    buffer[total] = '\0';

    /* Display the received information */
    printf("%s", buffer);

    /* Close socket */
    close(sockfd);
    return 0;
}`,
      },
    ],
    run: String.raw`# Terminal 1 - compile and run the file server
gcc server.c -o server
./server

# Create a small sample file next to the server program
printf 'Line one of the sample file.\nLine two of the sample file.\n' > sample.txt

# Terminal 2 - request an existing file
gcc client.c -o client
./client
# Enter the name of the required file: sample.txt

# Terminal 3 - request a missing file while the first client is running
./client
# Enter the name of the required file: missing.txt`,
    output:
      'The client requesting sample.txt prints Server Child PID with the file contents, the client requesting missing.txt prints Server Child PID followed by File not found, and the two answers carry different child PIDs because each request is handled by its own forked process.',
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
      'STEP 3: Create a raw socket using socket(PF_PACKET, SOCK_RAW, htons(ETH_P_ALL)).',
      'STEP 4: Check whether the socket is created successfully. If not, display an error message and terminate the program.',
      'STEP 5: Display Packet Capturing Started...',
      'STEP 6: Receive packets continuously using recvfrom().',
      'STEP 7: Extract the Ethernet header from the received packet and check whether h_proto equals ETH_P_IP; skip the packet if it is not an IPv4 packet.',
      'STEP 8: Extract the IP header that sits right after the Ethernet header.',
      'STEP 9: Obtain and display the source IP address, the destination IP address and the protocol number, naming the common ones such as 1 for ICMP, 6 for TCP and 17 for UDP.',
      'STEP 10: Repeat Steps 6 to 9 for every incoming packet.',
      'STEP 11: Close the socket when the program is stopped.',
      'STEP 12: Stop the program.',
    ],
    code: [
      {
        file: 'sniffer.c',
        lang: 'c',
        src: String.raw`#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <arpa/inet.h>
#include <netinet/ip.h>        /* IP header */
#include <linux/if_ether.h>    /* Ethernet header */

int main()
{
    int raw_socket;
    unsigned char buffer[65536];

    /* ---------------------------------------------------------
       Create a raw socket
       PF_PACKET  -> Access packets at the Ethernet level
       SOCK_RAW   -> Raw socket
       ETH_P_ALL  -> Capture all Ethernet protocols
       htons() converts the protocol number to network byte order.
       --------------------------------------------------------- */
    raw_socket = socket(PF_PACKET, SOCK_RAW, htons(ETH_P_ALL));

    if (raw_socket < 0)
    {
        perror("Socket creation failed (run the program with sudo)");
        exit(1);
    }

    printf("Packet Capturing Started...\n");

    /* Receive packets continuously using recvfrom() */
    while (1)
    {
        int packet_size;
        packet_size = recvfrom(raw_socket, buffer, sizeof(buffer),
                               0, NULL, NULL);
        if (packet_size < 0)
        {
            perror("Packet receiving failed");
            break;
        }

        /* -----------------------------------------------------
           Extract the Ethernet header
           ----------------------------------------------------- */
        struct ethhdr *eth_header;
        eth_header = (struct ethhdr *)buffer;

        /* Check whether the Ethernet frame contains an IPv4 packet.
           h_proto holds the Ethernet protocol type, ETH_P_IP means IPv4. */
        if (ntohs(eth_header->h_proto) != ETH_P_IP)
        {
            continue;
        }

        /* -----------------------------------------------------
           Extract the IP header. The Ethernet header is normally
           14 bytes, so the IP header starts right after it.
           ----------------------------------------------------- */
        struct iphdr *ip_header;
        ip_header = (struct iphdr *)(buffer + sizeof(struct ethhdr));

        /* -----------------------------------------------------
           Obtain and display the source IP address,
           the destination IP address and the protocol number
           ----------------------------------------------------- */
        struct in_addr source_ip;
        struct in_addr destination_ip;
        char src_str[INET_ADDRSTRLEN];
        char dst_str[INET_ADDRSTRLEN];
        char proto_name[16];

        source_ip.s_addr = ip_header->saddr;
        destination_ip.s_addr = ip_header->daddr;

        inet_ntop(AF_INET, &source_ip, src_str, sizeof(src_str));
        inet_ntop(AF_INET, &destination_ip, dst_str, sizeof(dst_str));

        switch (ip_header->protocol)
        {
            case 1:   strcpy(proto_name, "ICMP"); break;
            case 6:   strcpy(proto_name, "TCP");  break;
            case 17:  strcpy(proto_name, "UDP");  break;
            default:  snprintf(proto_name, sizeof(proto_name),
                               "%d", ip_header->protocol);
        }

        printf("Packet size: %d bytes  Src IP: %-15s Dst IP: %-15s "
               "Protocol: %s (%d)\n",
               packet_size, src_str, dst_str,
               proto_name, ip_header->protocol);
    }

    close(raw_socket);
    return 0;
}`,
      },
    ],
    run: String.raw`# Raw sockets need root privileges, so compile and run with sudo
gcc sniffer.c -o sniffer
sudo ./sniffer
# Packet Capturing Started...
# Packet size: 98 bytes  Src IP: 192.168.1.10    Dst IP: 8.8.8.8         Protocol: ICMP (1)
# Packet size: 74 bytes  Src IP: 192.168.1.10    Dst IP: 142.250.190.14  Protocol: TCP (6)

# Generate some traffic in a second terminal while the sniffer runs
ping -c 3 8.8.8.8
nslookup example.com

# Stop the sniffer with Ctrl+C`,
    output:
      'Every captured IPv4 packet prints its size, source IP address, destination IP address and protocol such as ICMP (1), TCP (6) or UDP (17) until the program is stopped with Ctrl+C.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 11,
    title: "Router Commands Using Cisco's Packet Tracer",
    aim: 'To familiarize with router commands: knowing the current mode and switching to privileged mode, switching to configuration mode, obtaining router information such as type, OS, memory and interface details, viewing routing protocols and the routing table, saving the running configuration, viewing the command history, clock and host list, displaying interface statistics and the controller type, and configuring serial and ethernet interfaces.',
    theory:
      'A Cisco router runs the IOS command line interface with distinct modes: the user EXEC mode shown as Router>, the privileged EXEC mode shown as Router# and the global configuration mode shown as Router(config)#. Privileged mode unlocks the show family of commands that report the router model, IOS version, memory, interfaces, routing protocols, routing table, history, clock and hosts, while configuration mode is used to set interface addresses and enable them. Interfaces are configured with interface, ip address, clock rate on the DCE side of a serial link and no shutdown, and the result is saved with copy running-config startup-config.',
    algorithm: [
      'Step 1: At the Router> prompt check that the router is in user EXEC mode, then switch to privileged mode with enable and return with disable.',
      'Step 2: Enter global configuration mode with configure terminal (short form conf t) and leave it with exit.',
      'Step 3: Run show version to read the router model, IOS version, memory statistics and uptime.',
      'Step 4: Run show interfaces to obtain the interface details of the router.',
      'Step 5: Run show ip protocols to view the status of the routing protocol currently configured, the advertised networks, the update timers and the administrative distance.',
      'Step 6: Run show ip route to show the routing table.',
      'Step 7: Run copy running-config startup-config to save the running configuration.',
      'Step 8: Run show history to view the command history.',
      'Step 9: Run show clock to view the router clock.',
      'Step 10: Run show hosts to view the list of hosts known to the router.',
      'Step 11: Run show interfaces for the detailed statistics of all interfaces and show ip interface brief for the brief view.',
      'Step 12: Run show controllers serial 0/0/0 to know whether the controller is DTE or DCE.',
      'Step 13: Configure an ethernet interface: interface gigabitethernet 0/0, ip address 192.168.1.1 255.255.255.0, no shutdown, exit.',
      'Step 14: Configure a serial interface: interface serial 0/0/0, ip address 10.0.0.1 255.255.255.252, clock rate 64000 on the DCE side only, no shutdown, exit.',
      'Step 15: Leave configuration mode with end, save the configuration again and verify it with show running-config.',
    ],
    code: [
      {
        file: 'router-commands.txt',
        lang: 'plaintext',
        src: String.raw`Router> enable
Router# disable
Router> enable
Router# configure terminal
Router(config)# exit
Router# show version
Router# show interfaces
Router# show ip protocols
Router# show ip route
Router# copy running-config startup-config
Router# show history
Router# show clock
Router# show hosts
Router# show interfaces
Router# show ip interface brief
Router# show controllers serial 0/0/0
Router# configure terminal
Router(config)# interface gigabitethernet 0/0
Router(config-if)# ip address 192.168.1.1 255.255.255.0
Router(config-if)# no shutdown
Router(config-if)# exit
Router(config)# interface serial 0/0/0
Router(config-if)# ip address 10.0.0.1 255.255.255.252
Router(config-if)# clock rate 64000
Router(config-if)# no shutdown
Router(config-if)# exit
Router(config)# end
Router# copy running-config startup-config
Router# show running-config`,
      },
    ],
    run: String.raw`# Open Cisco Packet Tracer on the lab machine
packettracer
# or double-click the Packet Tracer icon on the desktop

# 1. Choose File -> New to open an empty workspace.
# 2. Drag a generic router (for example 2911 or 2621) onto the workspace.
# 3. Click the router, open the CLI tab and press Enter to get the Router> prompt.
# 4. Copy the commands from router-commands.txt, then click inside the CLI
#    window and paste them (right click -> Paste, or Ctrl+V).
# 5. Answer yes when the router asks to save the configuration.
# 6. Repeat for every router or switch used in the experiment.`,
    output:
      'The router CLI accepted every command at the matching prompts Router>, Router#, Router(config)# and Router(config-if)#, and displayed the version, interface, routing protocol, routing table, history, clock, host and controller information before saving the configuration.',
    result: 'The required program was successfully executed, and output was verified.',
  },
  {
    no: 12,
    title: 'Static Routing for the Given Network',
    aim: 'To implement static routing for the given network, display the routing table of each router once the routes are set up, and verify the connectivity using ping.',
    theory:
      'Static routing is configured manually by telling a router the next hop address for every network that is not directly connected to it. In the given network the routers 2621, 2501A and 2501B are chained together so that the LANs 172.16.10.0/24, 172.16.20.0/24 and 172.16.30.0/24 can reach each other: 2621 reaches the last two networks through 2501A at 172.16.10.2, 2501A reaches 172.16.30.0/24 through 2501B at 172.16.20.2, and 2501B reaches 172.16.10.0/24 through 2501A at 172.16.20.1. After the ip route commands are entered, show ip route lists them with the S (static) code and ping between hosts in different LANs proves end to end connectivity.',
    algorithm: [
      'Step 1: Place the three routers 2621, 2501A and 2501B with PC1 in 172.16.10.0/24 and PC2 in 172.16.30.0/24, connect them with serial and ethernet links and configure the IP address and mask of every interface with no shutdown.',
      'Step 2: On router 2621 enter enable, then configure terminal.',
      'Step 3: Add ip route 172.16.20.0 255.255.255.0 172.16.10.2 so that 172.16.20.0/24 is reached through router 2501A.',
      'Step 4: Add ip route 172.16.30.0 255.255.255.0 172.16.10.2 so that 172.16.30.0/24 is also reached through router 2501A, then leave configuration mode with end.',
      'Step 5: On router 2501A enter enable, configure terminal, add ip route 172.16.30.0 255.255.255.0 172.16.20.2 because 172.16.30.0/24 is reachable through 2501B, and end.',
      'Step 6: On router 2501B enter enable, configure terminal, add ip route 172.16.10.0 255.255.255.0 172.16.20.1 because 172.16.10.0/24 and 172.16.20.0/24 are reachable through 2501A, and end.',
      'Step 7: Display the routing table of each router with show ip route and confirm that the static entries appear with the code S.',
      'Step 8: From PC1 run ping 172.16.30.10 to reach PC2.',
      'Step 9: From router 2501A run ping 172.16.30.10 to verify its own route.',
      'Step 10: From PC2 run ping 172.16.10.10 to verify the reverse path.',
      'Step 11: Confirm that every ping receives replies, which verifies the static routing configuration.',
    ],
    code: [
      {
        file: 'static-routing.txt',
        lang: 'plaintext',
        src: String.raw`Router 2621
2621> enable
2621# configure terminal
2621(config)# ip route 172.16.20.0 255.255.255.0 172.16.10.2
2621(config)# ip route 172.16.30.0 255.255.255.0 172.16.10.2
2621(config)# end
2621# show ip route
S    172.16.20.0/24 [1/0] via 172.16.10.2
S    172.16.30.0/24 [1/0] via 172.16.10.2

Router 2501A
2501A> enable
2501A# configure terminal
2501A(config)# ip route 172.16.30.0 255.255.255.0 172.16.20.2
2501A(config)# end
2501A# show ip route
S    172.16.30.0/24 [1/0] via 172.16.20.2

Router 2501B
2501B> enable
2501B# configure terminal
2501B(config)# ip route 172.16.10.0 255.255.255.0 172.16.20.1
2501B(config)# end
2501B# show ip route
S    172.16.10.0/24 [1/0] via 172.16.20.1

Connectivity checks
PC1> ping 172.16.30.10
2501A# ping 172.16.30.10
PC2> ping 172.16.10.10`,
      },
    ],
    run: String.raw`# 1. Open Cisco Packet Tracer and create a new blank workspace
packettracer

# 2. Place three routers 2621, 2501A and 2501B plus PC1 and PC2
# 3. Connect them with serial DCE/DTE cables (set clock rate on the DCE end)
#    and straight-through links to the PCs, then configure the interface
#    IP addresses and bring them up with no shutdown
# 4. Open the CLI tab of router 2621 and paste the 2621 block of
#    static-routing.txt, then do the same for 2501A and for 2501B
# 5. Check the tables with show ip route on all three routers
# 6. From the Desktop -> Command Prompt of PC1 run: ping 172.16.30.10
# 7. From the Desktop -> Command Prompt of PC2 run: ping 172.16.10.10
# 8. From the CLI of router 2501A run: ping 172.16.30.10`,
    output:
      'show ip route on each router lists the static entries marked with S for the remote networks, and the pings from PC1 to 172.16.30.10, from PC2 to 172.16.10.10 and from 2501A to 172.16.30.10 all receive replies.',
    result: 'The required program was successfully executed, and output was verified.',
  },
];
