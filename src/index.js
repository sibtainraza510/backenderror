import dotenv from "dotenv";
import connectDB from "./db/index.js"
import app from "./app.js"

dotenv.config({
    path: './.env'
})
let PORT = process.env.PORT || 8080 

connectDB()
.then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running at port ${PORT}`);
    });
})

.catch((error) => {
    console.error(`MONGODB connection failed: ${error}`);
    // process.exit(1);  // Exit the process on failure
});

app.use((req, res, next) => {
    console.log(`Received request: ${req.method} ${req.url}`);
    next();
});


// app.post('/api/v1/users/newregister', (req, res) => {
//     // Handle the request and send a response
//     res.send('User registered!');
//   });