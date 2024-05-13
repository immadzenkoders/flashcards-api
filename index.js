
const http = require('http');
const url = require('url');
const fs = require('fs');

const PORT = process.env.PORT || 3000;


function readFlashcardsFromFile() {
    try {
        const data = fs.readFileSync('local.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Error reading file:', err);
        return [];
    }
}

function writeFlashcardsToFile(data) {
    try {
        fs.writeFileSync('local.json', JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error writing file:', err);
    }
}

let flashcards = readFlashcardsFromFile();

 
const server = http.createServer((req, res) => {
    const reqUrl = url.parse(req.url, true);
    const { pathname } = reqUrl;

    if (req.method === 'GET') {
        if (pathname === '/flashcards') {
            const queryParams = reqUrl.query;
            let flashcardsInRange = flashcards;
            if (queryParams.range) {
                const range = queryParams.range.split('-').map(num => parseInt(num));
                if (range.length !== 2 || isNaN(range[0]) || isNaN(range[1])) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid range format' }));
                    return;
                }
                flashcardsInRange = flashcards.filter(card => {
                    const cardId = parseInt(card.id);
                    return cardId >= range[0] && cardId <= range[1];
                });
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(flashcardsInRange));
        } else if (pathname.startsWith('/flashcards/')) {
            const id = pathname.split('/')[2];
            const flashcard = flashcards.find(card => card.id === id);
            if (!flashcard) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Flashcard not found' }));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(flashcard));
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
        }
    }  else if (req.method === 'POST') {
        if (pathname === '/flashcards') {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const { question, answer } = JSON.parse(body);
                const newFlashcard = {
                    id: (flashcards.length + 1).toString(),
                    question,
                    answer
                };
                flashcards.push(newFlashcard);
                writeFlashcardsToFile(flashcards);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(newFlashcard));
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
        }
    } else if (req.method === 'PUT') {
        if (pathname.startsWith('/flashcards/')) {
            const id = pathname.split('/')[2];
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                const { question, answer } = JSON.parse(body);
                const flashcardIndex = flashcards.findIndex(card => card.id === id);
                if (flashcardIndex === -1) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Flashcard not found' }));
                } else {
                    flashcards[flashcardIndex] = { id, question, answer };
                    writeFlashcardsToFile(flashcards);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(flashcards[flashcardIndex]));
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
        }
    } else if (req.method === 'DELETE') {
        if (pathname.startsWith('/flashcards/')) {
            const id = pathname.split('/')[2];
            const flashcardIndex = flashcards.findIndex(card => card.id === id);
            if (flashcardIndex === -1) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Flashcard not found' }));
            } else {
                flashcards.splice(flashcardIndex, 1);
                writeFlashcardsToFile(flashcards);
                res.writeHead(204);
                res.end();
            }
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Route not found' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});