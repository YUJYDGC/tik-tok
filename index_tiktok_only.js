const fs = require('fs');

let botToken;

// Load the JSON file
try {
    const data = fs.readFileSync('date.json', 'utf8');
    const jsonData = JSON.parse(data);
    botToken = jsonData.token;
} catch (error) {
    console.error('Error reading or parsing date.json:', error);
    process.exit(1); // Exit the process if the file is missing or has a parse error
}

if (!botToken) {
    console.error('Bot token is missing from date.json');
    process.exit(1);
}

// Use the bot token in your bot logic
console.log('Bot token loaded successfully:', botToken);
// ... rest of your code using the botToken
