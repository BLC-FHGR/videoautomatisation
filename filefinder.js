// for nodejs we need not bother about old browsers, so we can take full
// benefit of ES6

// imported components should be always used as constants.
// make require imports explicit: ONE require() statement per line.
const path = require('path');
const fs   = require('fs');

// This finds all relevant files.

function fileFinder(startPath, filter) {
    // Map-Reduce through the directories
    // 1. map all files matching our filter or recurse into subdirectories
    // 2. reduce the files into a flat array of filenames
    //
    // Here is a trick:
    // We always want a simple reduce function.
    // In this case we want a list of file names as a result.
    // Therefore, the map() function must return an array of arrays that
    // our reduce() function can flatten into an array of strings.
    //
    // For files we want to ignore, map() just creates an empty array,
    // because the array.concat([]) is just the original array. Thus, the
    // empty arrays just disappear during the reduce function.
    //
    // The reduce function uses the trick, that array.concat() can be called
    // with undefined values without harm. The side effect is that our
    // resulting array is reversed. In our case this is no problem, in
    // cases ordering is relevant, then we must use reduceRight().

    // map reduce through the directories the node style with Promises.
    // Using promises allows multi access storages to respond much faster than
    // with sequential processing.
    return new Promise(function (resolve, reject) {
        // check if the startPath directory exists.
        fs.stat(startPath, function (err, stat) {
            err ? reject(err) : resolve();
        });
    })
    .then(function() {
        // now read the files in the startPath directory
        return new Promise(function (resolve, reject) {
            fs.readdir(startPath, (err, filelist) => {
                err ? reject(err) : resolve(filelist);
            });
        });
    })
    .then(function(filelist) {
        // process each file separately in multiple threads.
        // speeds up things on SSDs and other multi access storages.
        return Promise.all(filelist.map(function(filename) {
            filename = path.join(startPath, filename);
            const suffix = filename.split(".").pop();
            var result = [];

            if (suffix == filter) {
                result = [filename];
            }

            // each map() creates a new process for finding files.
            return new Promise(function (resolve, reject) {
                fs.stat(filename, function (err, stat) {
                    if (stat && stat.isDirectory()) {
                        resolve(fileFinder(filename));
                    }
                    else if (stat) {
                        resolve(result);
                    }
                    else {
                        reject(err);
                    }
                });
            });
        }));
    })
    .then(results => {
        // once all results are present, reduce the results into a flat array
        return results.reduce((acc, list) => { return list.concat(acc); });
    });
}

// The main difference is that the function returns a promise instead of
// an array.
//
// A successful promise will pass the files the function has found.
//
// A promise might fail, so adding a catch() helps to become aware of errors.
//
// fileFinder("input/", "zip")
//     .then(list => { console.log(list); })
//     .catch(err => { console.log(err); });

module.exports = fileFinder; // so we can use require('filefinder');
