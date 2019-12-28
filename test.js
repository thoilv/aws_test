const express = require("express");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 8001;

let stream;
let refreshInterval;

//Route to provide homepage
// Example - http://localhost:8001/
app.get('/', (req, res) => {
    res.sendFile(__dirname+"/views/main.html", (err) => {
        if (err){
            console.log("Error occured while sending the response");
        } else {
            console.log("Successfully sent the response on the homepage");
        }
    });
});


// Route to start streaming logs to app.log
// Example route - http://localhost:8001/start-streaming?rate=0.25 - For streaming logs at a rate of 1 log per 0.25 seconds or 4 logs per second
// Example route - http://localhost:8001/start-streaming - For streaming logs at a rate of 1 log per second
app.get("/start-streaming", (req, res) => {

    //Reading the log rate from the query parameter in the url "rate"
    let rate = req.query.rate || 1;
    let log_rate_in_seconds = parseFloat(rate) * 1000;

    // Checking if already an existing log stream is live in the background or not
    // If there is one, then tell the user to stop that stream first
    if (stream) {
        res.status(403).json({
            success: false,
            message: "Already logs are being written in the background. Please stop them fist so as to start a new log stream",
            status: 403
        });
    } else {
        // Instantiate an "append" flagged write stream
        stream = fs.createWriteStream("./logs/app.log", { flags: 'a' });

        // Append to the app.log, the log entry at a rate of 1 log per "log_rate" seconds
        refreshInterval = setInterval(() => {
            stream.write(`${new Date()} - Some cool log!\n`);
        }, log_rate_in_seconds);
        res.json({
            success: true,
            message: `Started writing the logs in background at a rate of 1 log per ${rate} seconds!`,
            status: 200
        });
    }

});

// Route to stop streaming the logs
// Example - http://localhost:8001/stop-streaming
app.get("/stop-streaming", (req, res) => {

    // Check if there is not any stream present in background
    // If there is none, then tell the user that there nothing to stop in background
    if (!stream) {
        res.status(403).json({
            success: false,
            message: "No logs to stop in background!",
            status: 403
        });
    } else {

        // Stopping the streaming
        clearInterval(refreshInterval);
        // Nullifying the stream
        stream = null;
        res.json({
            success: true,
            message: "Stopped writing the logs in background!",
            status: 200
        });
    }
});

// Route to clear the logs (app.log)
// Example - http://localhost:8001/clear-log
app.get("/clear-log", (req, res) => {

    // Check if a stream is live currently
    // If there is one, then, tell the user to stop it first
    if (stream) {
        res.status(403).json({
            success: false,
            message: "You can't clear the logs write now because currently, a log stream is live. Please execute GET /stop-writing so as to stop that log stream. Then, execute this route again to clear the logs.",
            code: 403
        });
    } else {
        // Instantiate a write stream
        stream = fs.createWriteStream("./logs/app.log");
        // Overwrite the app.log with an empty character to empty
        stream.write('');
        stream = null;
        res.json({
            success: true,
            message: "Cleared the app.log!",
            code: 200
        });
    }
});

app.listen(port, () => console.log(`Main application running on port number: ${port}...`));



