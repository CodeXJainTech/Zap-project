import express from "express"
import { userRouter } from "./router/user.js";
import { zapRouter } from "./router/zap.js";
import cors from "cors"

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1/user", userRouter);
app.use("/api/v1/zap", zapRouter);

app.listen(3000, () => {
  console.log("server started!")
})