import express from "express"
import { PrismaClient } from "@prisma/client"; 
const app = express();
app.use(express.json());
const client = new PrismaClient();

//password logic

app.post("/hooks/catch/:userId/:zapId", async (req,res) =>{
  const userId = req.params.userId;
  const zapId = req.params.zapId;
  const body = req.body;
  console.log(body);
  //store in db a new trigger
  await client?.$transaction(async tx => {
    const run = await tx.zapRun.create({
      data:{
        zapId: zapId,
        metadata: body
      }
    });
  
    await tx.zapRunOutbox.create({
      data: {
        zapRunId: run.id
      }
    })
  });
  res.json({
    "message": "recieved."
  })
  //push it on to a queue kafka or redis
})

app.listen(3000, () =>{
  console.log("server started at 3000");
})

