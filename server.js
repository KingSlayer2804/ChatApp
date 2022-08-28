const express=require("express");
const path=require("path");
const http=require("http");
const socketio=require("socket.io");
const formatMessage=require("./utils/messages.js");
const {userJoin,getCurrentUser,userLeave,getRoomUsers}=require("./utils/users")
const app=express();
const server=http.createServer(app);
const io=socketio(server);
const port=3000;
const botName='ChatBot';
const StaticPath=path.join(__dirname,"docs");
app.use(express.static(StaticPath));
io.on('connection',socket=>{
    socket.on('joinRoom',({username,room})=>{
        const user=userJoin(socket.id, username, room);
        socket.join(user.room);
        socket.emit('message',formatMessage(botName,'Welcome to ChatBot!'));
        //bRoadcast when a user connects
        socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has joined the chat`));
        io.to(user.room).emit('roomUsers',{
            room:user.room,
            users:getRoomUsers(user.room)
        });
    });
    socket.on('disconnect',()=>{ 
        const user=userLeave(socket.id);
        if(user)
        {
            socket.broadcast.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
            io.to(user.room).emit('roomUsers',{
                room:user.room,
                users:getRoomUsers(user.room)
            });
        }

    });
    // Listen for chat message
    socket.on('chatMessage',(msg)=>{
        const user=getCurrentUser(socket.id);
        io.to(user.room).emit('message',formatMessage(user.username,msg));
    })
});
server.listen(port,()=>{
    console.log("Listeing to port "+port);
});