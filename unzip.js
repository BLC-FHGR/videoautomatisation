const fs         = require('fs');
const unzip      = require('unzip2');
const ffmpeg     = require('fluent-ffmpeg');
const path       = require('path');
const fileFinder = require('./filefinder');

const dir = './tmp';
/*
1: Find Zip Files
2: convert Zipfiles to new direcory with zipfile name
3: merge files cameraVoip_x_x.flv with screenshare_x_x.flv
4: safe to output directory
*/

fileFinder("input/", "zip")                                                // 1
.then(filelist => {
    // create a separate processing chain for each zip file we find.
    // The all-Promise collects the results of the conversion process
    return Promise.all(filelist.map( filename => {
        var tFN = filename.split(".");
        tFN.pop();
        const dirname = tFN.join('.');

        return new Promise(function (resolve, reject) {                    // 2
            fs
                .createReadStream(filename)
                .pipe(unzip.Extract({ path: path.dirname(filename) }))
                .on('close', function() {
                    resolve(dirname);
                });
        })
        // as soon a zip is extracted, we start processing the files
        .then(videoDirName => {                                            // 3
            // FIXME we really want a config file for the videos.

            const firstFile  = path.join(videoDirName, "cameravoip2.flv");
            const secondFile = path.join(videoDirName, "screenshare2.flv");
            const outputFile = dirname + ".mp4";

            return new Promise(function (resolve, reject) {
                ffmpeg(firstFile)
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
                    .on("error",function(err){
                        reject(err);
                    })
                    .on("end",function(){
                        resolve(outputFile);
                    })
                    .run();                                                // 4
            });
        });
        // FIXME: cleanup the extracted files after processing
    }));
})
.then(filelist => { console.log(filelist); })
.catch(error   => { console.log(error); });
