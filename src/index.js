import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: './.env'
});

let server;

async function startServer() {
  try {
    await connectDB();
    if (!server) {
      server = app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port: ${process.env.PORT || 8000}`);
      });
    } else {
      console.log("Server is already running.");
    }
  } catch (err) {
    console.log("MONGO db connection failed !!! ", err);
    throw err;
  }
}

startServer().catch((err) => console.error(err));

// Export for serverless environments if necessary
export default server;
