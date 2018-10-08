# image store in mongoDB MEAN Stack
Store Base64url of image directly to the mongoDB (key,value) that is key= image and value=Base64url of image.
if your file size is more than 16MB then use GridFS to store file in mongoDB database.
This project also contains storing large file (videos) by using GridFS.
