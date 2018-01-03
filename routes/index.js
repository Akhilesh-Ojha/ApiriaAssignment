var express = require('express');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var xlsxtojson = require("xlsx-to-json-lc");
var router = express.Router();
var methodOverride = require('method-override');
var User = require('../models/users');

router.use(methodOverride("_method"));

/* GET home page. */
var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        cb(null, file.fieldname + '-' + datetimestamp + '.' + file.originalname.split('.')[file.originalname.split('.').length -1])
    }
});
var upload = multer({ //multer settings
    storage: storage,
    fileFilter : function(req, file, callback) { //file filter
        if (['xls', 'xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length-1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');
/** API path that will upload the files */
router.get('/',function(req,res){
    //res.sendFile(__dirname + "../views/index");

    res.render("index");
});
router.post('/upload', function(req, res) {
    var exceltojson;
    upload(req,res,function(err){
        if(err){
            res.json({error_code:1,err_desc:err});
            return;
        }
        /** Multer gives us file info in req.file object */
        if(!req.file){
            res.json({error_code:1,err_desc:"No file passed"});
            return;
        }
        /** Check the extension of the incoming file and
         *  use the appropriate module
         */
        if(req.file.originalname.split('.')[req.file.originalname.split('.').length-1] === 'xlsx'){
            exceltojson = xlsxtojson;
        } else {
            exceltojson = xlstojson;
        }
        try {
            exceltojson({
                input: req.file.path,
                output: null, //since we don't need output.json
                lowerCaseHeaders:true
            }, function(err,result){
                if(err) {
                    return res.json({error_code:1,err_desc:err, data: null});
                }
                else {
                    result.forEach(function (t) {
                        User.create(t , function (err , createdUser) {
                            if(err)
                            {
                                console.log(err);
                                res.json({
                                    status: "error",
                                    data: err
                                })
                            }
                            else
                            {
                                createdUser.save(function (err, save) {
                                    if(err){}
                                    else{

                                    }
                                });
                            }
                        })
                    });
                    res.redirect('/view');
                }
                /*res.json({error_code:0,err_desc:null, data: result});*/
                // console.log(result);

            });
        } catch (e){
            res.json({error_code:1,err_desc:"Corrupted excel file"});
        }
    })
});


router.get('/view', function (req, res) {
    User.find({}, function (err, result) {
        if(err){

        }
        else{
            res.render("records",{result:result})
        }
    })
});

router.get("/:id/edit" , function (req ,res) {
    User.findById(req.params.id , function (err , foundUser) {
        res.render("edit" , {user:foundUser});
    });
});
router.put("/:id" , function (req , res) {
    User.findByIdAndUpdate(req.params.id , req.body.user , function (err , updatedUser) {
        if(err)
        {
            res.redirect("/view");
        }
        else
        {
            updatedUser.save(function (err, saveUser) {
                if(err)
                {
                    res.redirect("/view");
                }
                else
                {
                    res.redirect("/");
                }
            })

        }
    });

});

router.delete("/:id", function(req, res){
    User.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/view");
        } else {
            res.redirect("/view");
        }
    });
});




module.exports = router;
