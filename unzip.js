const fs         = require('fs');
const unzip      = require('unzip2');
const ffmpeg     = require('fluent-ffmpeg');
const path       = require('path');
const fileFinder = require('./filefinder');

const dir = './tmp';                                  // unused?

/*
1: Find Zip Files
2: convert Zipfiles to new direcory with zipfile name
3: merge files cameraVoip_x_x.flv with screenshare_x_x.flv
4: safe to output directory
*/

// Code remark on ES6 Syntax
//
// someparam => { ... /* code */ ... }
// is the same as
// function (someparam) { ... /* code */ ... }
//
// (someparam, otherparam) => { ... /* code */ ... }
// is the same as
// function (someparam, otherparam) { ... /* code */ ... }
//

fileFinder("input/", "zip")                                                // 1
.then(filelist => {
    // create a separate processing chain for each zip file we find.
    // Again we split the process into different threads.
    //
    // The all-Promise collects the results of the conversion process
    return Promise.all(filelist.map( filename => {
        var tFN = filename.split(".");
        tFN.pop();
        const dirname = tFN.join('.');

        // Now we create a separate processing pipeline for each file that we
        // found.
        // The trick about nodejs here is that nodejs allows us to run
        // each pipeline in parallel (depending on how many processor cores we
        // have).
        // Promises allow us to structure the sequence of each pipeline through
        // then() calls.
        // Having parallel pipelines is pretty useful in this case because
        // each pipeline is quite computation intense, so if we have multiple
        // files, we want to use as many CPU cores as possible.

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

            // I changed the logic a bit: instead of creating the output
            // somewhere else, I place it with the same name but a different
            // suffix into the same folder as the original zip-file.
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
                        // if everything went smoothly we inform the core
                        // process that this process completed successfully
                        // and produced the outputFile.
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
