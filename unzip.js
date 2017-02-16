var fs = require('fs'), unzip = require('unzip2'), ffmpeg = require('fluent-ffmpeg'), dir = './tmp', path = require('path'), zipfinder = require('./zipfinder');
/*
1: Find Zip Files
2: convert Zipfiles to new direcory with zipfile name
3: merge files cameraVoip_x_x.flv with screenshare_x_x.flv 
4: safe to output directory
*/

// var outputpathName, firstFileName,  secondFileName,  outputName;
/*zipFile = zipfilesFound[i], */
/*find zipfiles*/

console.log(zipfinder.zipfilesFound);

/*convert zip files */

fs.createReadStream('input/videofile.zip').pipe(unzip.Extract({ path: 'input/videofile' }));

/*convert files to pip*/


var firstFile = "./input/videofile/cameravoip2.flv";
var secondFile = "./input/videofile/screenshare2.flv";
var outputFile = "./output/pip1_output.mp4"

var proc = ffmpeg(firstFile)
.input(secondFile)
.complexFilter([
  '[0:v]scale=320:180[0scaled]',
  '[1:v]scale=1024:768[1scaled]',
  '[0scaled]pad=1280:720[0padded]',
  '[0padded][1scaled]overlay=shortest=1:x=290[output]'
])
.outputOptions([
  '-map [output]',
  '-map 0:a'
])
.output(outputFile)
.on("error",function(er){
  console.log("error occured: "+er.message);
})
.on("end",function(){
  console.log("success");
})
.run();