import User from "../models/userModels.js";
import Message from "../models/messageModel.js";


export const getUserSideBar = async(req,res)=>{
    try{
        const loggedInUserId = req.user._id;

        const filteredUsers = await User.find({_id : {$ne:loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers)
    }catch(error){
        console.log("Error in getUserSideBar", error.message);
        res.status(500).json({error:"Internal server error"})

    }

};


export const getMessages = async(req,res)=>{
    try{
        const {id: userToChatId }= req.params;
        const senderId = req.user._id;

        const messages = await Message.find(
            {$or:
            [
                {senderId:senderId, receriverId:userToChatId},
                {senderId:userToChatId, receriverId:senderId}
            ]
        }
    );
        res.status(200).json(messages);


    }catch(error){
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({error:"Internal server error"});
    }
    

};

export const sendMessage= async(req,res)=>{
    try{
        const {text,image}= req.body;
        const {id: receriverId} = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image){
            imageUrl = image;

        }

        const newMessage = new Message({
            senderId,
            receriverId,
            text,
            image: imageUrl,
        });
        await newMessage.save();

        //todo: realtime functionality => socket.io
        res.status(201).json(newMessage);

    }catch(error){
        console.log("error in sendMessage controller",error.message);
        res.status(500).json({error:"Internal server error"});

    }
}