import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: './.env'
});

// Function to start the server and export it
async function startServer() {
  try {
    await connectDB();
    const server = app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙️ Server is running at port: ${process.env.PORT || 8000}`);
    });
    return server; // Return the server instance
  } catch (err) {
    console.log("MONGO db connection failed !!! ", err);
    throw err;
  }
}

// Export the server as the default export
export default startServer();
