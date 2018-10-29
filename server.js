var express =require('express');
var app=express();
var mongojs=require('mongojs');
var bodyparser=require('body-parser');
var cors = require('cors');
app.use(bodyparser.json({limit: '500mb', parameterLimit: 1000000}));
app.use(bodyparser.urlencoded({limit: '500mb', extended: true, parameterLimit: 1000000}));
app.use(cors());
app.use(express.static(__dirname+"/public"));


var multer = require('multer');
var GridFSStorage = require('multer-gridfs-storage');
var mongo = require('mongodb');
var MongoClient=require('mongodb').MongoClient;
var Grid = require('gridfs-stream');
 var gfs;
// create or use an existing mongodb-native db instance
MongoClient.connect('mongodb://localhost:27017').then(client => {
  const database = client.db('imageupload')
  gfs= Grid(database, mongo);
});
 

var db=mongojs('imageupload',['coll_upload']);

// Allows cross-origin domains to access this API
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

storage = new GridFSStorage(
  { 
  	url: 'mongodb://localhost:27017/imageupload',
  	file: (req, file) => {
      //console.log(file);
		    return {
		      filename: file.originalname,
		      bucketName: 'uploads'
		    };
          }
  });
var upload = multer({
    storage: storage
}).single('file');
// Route for file upload
app.post('/upload', (req, res) => {
    upload(req,res, (err) => {
     
        if(err){
             res.json({error_code:1,err_desc:err});
             return;
        }
        res.json({error_code:0, error_desc: null, file_uploaded: true});
    });
});

app.post('/imageupload',function(req,res){
                 db.coll_upload.insert(req.body,function(err,doc){
		                res.json("true");
                   });

     });
app.get('/getimageupload',function(req,res){
                 db.coll_upload.find({},function(err,doc){
		                res.json(doc);
                   });

     });

app.get('/getvideoupload',function(req,res){
    gfs.collection('uploads'); //set collection name to lookup into
          gfs.files.find({}).toArray(function (err, files) {
          if (err) res.json(false);
          res.json(files);
        })
 });


app.get('/getfile/:video_id',function(req,res){
	//console.log(req.body);
    gfs.collection('uploads'); //set collection name to lookup into

    /** First check if file exists */
    console.log(req.params.video_id);
    gfs.files.findOne({_id: mongojs.ObjectId(req.params.video_id)},function(err, file){
    	        if (err) {
                console.log(err);
            return res.status(400).send({
                err: errorHandler.getErrorMessage(err)
            });
        }
        if (!file) {
            return res.status(404).send({
                err: 'No file found'
            });
        }

        if (req.headers['range']) {
            var parts = req.headers['range'].replace(/bytes=/, "").split("-");
            console.log(parts);
            var partialstart = parts[0];
            var partialend = parts[1];

            var start = parseInt(partialstart, 10);
            var end = partialend ? parseInt(partialend, 10) : file.length - 1;
            var chunksize = (end - start) + 1;

            res.writeHead(206, {
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
                'Content-Type': file.contentType
            });

            gfs.createReadStream({
                _id: file._id,
                range: {
                    startPos: start,
                    endPos: end
                }
            }).pipe(res);
        } else {
            res.header('Content-Length', file.length);
            res.header('Content-Type', file.contentType);

            gfs.createReadStream({
                _id: file._id
            }).pipe(res);
        }
    });

     });
app.listen("5000");