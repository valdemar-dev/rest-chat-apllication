const fs = require('fs');
const path = require('path');
const http = require('http');

const server = http.createServer(async (req,res)=>{
    const method = req?.method;

    const { pathname, searchParams } = new URL(`http://localhost:3000${req.url}`);

    if (req.method === 'OPTIONS') {
        // Respond to preflight requests with the necessary CORS headers
        res.writeHead(200, {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, DELETE',
          'Access-Control-Allow-Headers': 'Content-Type',
        });
        res.end();
        return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');

    if (pathname === "/api/chat") {
        if (method === "GET") {
            const messagesRaw = fs.readFileSync(path.join(process.cwd(), "/messages.json"));

            res.writeHead(200, { "Content-Type": "application/json", });
            res.write(messagesRaw);
            res.end();
        } else if (method === "POST") {
            let body = '';

            req.on('data', (chunk) => {
              body += chunk;
            });
        
            req.on('end', () => {
                const jsonData = JSON.parse(body);
                
                if (
                    !jsonData?.author ||
                    !jsonData?.timestamp ||
                    !jsonData?.content
                ) {
                    res.writeHead(411);
                    return res.end();
                }
        
                const messagesRaw = fs.readFileSync(path.join(process.cwd(), "/messages.json"));
                const messages = JSON.parse(messagesRaw);
    
                let id;
                if (messages.length === -1) {
                    id = 0;
                } else {
                    id = messages.length;
                }

                const message = {
                    id: id,
                    timestamp: jsonData.timestamp,
                    author: jsonData.author,
                    content: jsonData.content,
                };

                messages.push(message);
    
                fs.writeFileSync("./messages.json", JSON.stringify(messages)); 
                    
                res.writeHead(200, { "Content-Type": "application/json", });
                res.write(JSON.stringify(message));
                res.end();
                return;
            });
        } else {
            res.writeHead(403);
            res.end();
        }

        return;
    }

    else if (pathname === "/api/chat/id") {
        if (method === "GET") {
            const id = searchParams.get("id");

            if (!id) {
                res.writeHead(411);
                res.end();
                return;
            }

            const messagesRaw = fs.readFileSync(path.join(process.cwd(), "/messages.json"));
            const messages = JSON.parse(messagesRaw);
            const filteredMessages = messages.filter(m => m.id > parseInt(id));

            res.writeHead(200, { "Content-Type": "application/json", });
            res.write(JSON.stringify(filteredMessages));
            res.end();
        } else if (method === "DELETE") {
            const id = searchParams.get("id");

            if (!id) {
                res.writeHead(411);
                res.end();
                return;
            }

            const messagesRaw = fs.readFileSync(path.join(process.cwd(), "/messages.json"));
            const messages = JSON.parse(messagesRaw);
            const message = messages.find(message => message.id === parseInt(id));
            message.content = "Tämä viesti on poistettu.";

            fs.writeFileSync("./messages.json", JSON.stringify(messages)); 

            res.writeHead(200);
            res.end();
        } else {
            res.writeHead(403);
            res.end();
        }
    }
});

server.listen(3000, "localhost", () => {
    console.log("Listening on port 3000");
});
        