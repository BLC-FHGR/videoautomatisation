var ffmpeg = require("fluent-ffmpeg");
/*
var firstFile = "./outputfiles/PIP_output1.mp4";
var secondFile = "./outputfiles/PIP_output2.mp4";
var outPath = "output_new.mp4";


var proc = ffmpeg(firstFile)
    .input(secondFile)
    .input(thirdFile)
    .on('end', function() {
      console.log('files have been merged succesfully');
    })
    .on('error', function(err) {
      console.log('an error happened: ' + err.message);
    })
    .mergeToFile(outPath);
*/

/*
var firstFile = "./input/videofile/cameraVoip_0_4.flv"";
var secondFile = "./input/videofile/screenshare_1_2.flv";
var outPath = "output_new.mp4";

var proc = ffmpeg(firstFile)
        .input(secondFile)
        .complexFilter([
        "scale=200:299[rescaled]",
        {
        filter:"pad",options:{w:"200",h:"120"},
        inputs:"rescaled",outputs:"padded"
        },
        {
        filter:"overlay", options:{x:"300",y:"0"},
        inputs:["padded","vid2.mp4"],outputs:"output"
        }
        ], 'output')
        .output("output.mp4")
        .on("error",function(er){
        console.log("error occured: "+er.message);
        })
        .on("end",function(){
        console.log("success");
        })
        .run();
*/
var firstFile = "./input/videofile/cameravoip2.flv";
var secondFile = "./input/videofile/screenshare2.flv";
var outputFile = "output.mp4";

var proc = ffmpeg(firstFile)
.input(secondFile)
.complexFilter([
    "[0:v]scale=256:144[0scaled]",
    "[1:v]scale=1024:567[1scaled]",
    "[0scaled]pad=1280:720[0padded]",
    "[0padded][1scaled]overlay=shortest=1:x=200[output]"
])
.outputOptions([
    "-map [output]"
])
.output(outputFile)
.on("error",function(er){
    console.log("error occured: " + er.message);
})
.on("end",function(){
    console.log("success");
})
.run();
