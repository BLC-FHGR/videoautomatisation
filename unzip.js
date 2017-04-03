const fs         = require("fs");
const unzip      = require("unzip2");
const ffmpeg     = require("fluent-ffmpeg");
const path       = require("path");
const fileFinder = require("./filefinder");

//const dir = "./tmp";                                  // unused?

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
            const dirname = tFN.join(".");

        // Now we create a separate processing pipeline for each file that we
        // found.
        //
        // The trick about nodejs here is that nodejs allows us to run
        // each pipeline in parallel (depending on how many processor cores we
        // have).
        //
        // Promises allow us to structure the sequence of each pipeline through
        // then() calls.
        //
        // Having parallel pipelines is pretty useful in this case because
        // each pipeline is quite computation intense, so if we have multiple
        // files, we want to use as many CPU cores as possible.
        //
            return new Promise(function (resolve, reject) {                    // 2
                fs
                    .createReadStream(filename)
                    .pipe(unzip.Extract({ path: path.dirname(filename) }))
                    .on("close", function() {
                        resolve(dirname);
                    })
                    .on("error", function (error) {
                        reject(error);
                    });
            })
        //                                                                 // 3
        // as soon a zip is extracted, we start processing the files
        // this happens in 3 steps
        // A. read the configuration
        // B. build a stitching script using the FFMPEG options
        // C. run ffmpeg
        //
                .then(videoDirName => {                                            // A
            // FIXME we really want a config file for the videos.
            //
            // Ideally, we would process the mainstream.xml because all
            // screen events and layouts are visible there. All events are
            // connected to a timestamp, so we could create an automatic
            // stitching plan.
            //
            // Processing the mainstream.xml should follow these steps:
            // 1. use xml2js to parse the XML into a JS object.
            // 2. grep the root.Message object (is an array)
            // 3. Extract the stream's
            // - layouts (object.id == 19 and object.name == "layoutManagerSerialized")
            // - layout changes (need a few test cases for seeing how AC handles this)
            // - source files (via String == "streamAdded")
            //
            // I am unshure how the chat and other pods are working. It appears that
            // they are just blank in our case. Need to test how a chat looks like
            // with active users.
            //
            // The configuration processing should return an object for each zip
            // that contains all stream information, including the output file.
            //
            // for the time being, create a very basic configuration file
            // without parsing anything
                    return {
                        firstFile: path.join(videoDirName, "cameravoip2.flv"),
                        secondFile: path.join(videoDirName, "screenshare2.flv"),
                        output: videoDirName + ".mp4"
                    };
                })
        //
        // create the stitching script
        //
                .then(videoConfig => {                                              // B
                    const processor = ffmpeg(videoConfig.firstFile)
                .input(videoConfig.secondFile)
                .complexFilter([
                    "[0:v]scale=320:180[0scaled]",
                    "[1:v]scale=1024:768[1scaled]",
                    "[0scaled]pad=1280:720[0padded]",
                    "[0padded][1scaled]overlay=shortest=1:x=290[output]"
                ])
                .outputOptions([
                    "-map [output]",
                    "-map 0:a"
                ])
                .output(videoConfig.output);

            // add the script to our configuration.

                    videoConfig.processor = processor;
                    return videoConfig;
                })
        //
        // process the stitching script
        //
                .then(videoConfig => {                                            // C
                    return new Promise(function (resolve, reject) {
                        videoConfig.processor
                            .on("error",function(err){
                                reject(err);
                            })
                            .on("end",function(){
                        // strip the ffmpeg processor from the config
                                delete videoConfig.processor;

                        // if everything went smoothly we inform the core
                        // process that this process completed successfully
                        // and produced the output.
                        //
                        // we just pass the entire configuration.
                                resolve(videoConfig);
                            })
                            .run();                                                // 4
                    });
                });
        // FIXME: cleanup the extracted files after processing
        }));
    })
    .then(filelist => {
        console.log(filelist);
    })
    .catch(error   => {
        console.log(error);
    });
