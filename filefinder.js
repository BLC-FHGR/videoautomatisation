// for nodejs we need not bother about old browsers, so we can take full
// benefit of ES6

// imported components should be always used as constants.
// make require imports explicit: ONE require() statement per line.
const path = require('path');
const fs   = require('fs');

// This finds all relevant zip files.
function filesFinder(startPath, filter) {
    if (fs.existsSync(startPath)) {
        const files = fs.readdirSync(startPath);

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
        //
        // theFiles will contain the result for the reduce() call.
        return files
            .map(function fetchFiles(filename) {                           // 1
                var result = []; // lets make the default an empty array
                const suffix = filename.split(".").pop(); // extract the suffix

                // get the absolute path for the present file.
                filename   = path.join(startPath, filename);

                if (suffix == filter) {
                    // the filename ends with the expected suffix
                    result = [filename];
                }
                // we want to travers also directories with the filter suffix
                if (fs.lstatSync(filename).isDirectory()) {
                    result = selectFiles(filename, filter);
                }

                return result;
            })
            .reduce(function (resultArray, fileList) {                    // 2
                return fileList.concat(resultArray);
            });
    }
    return []; // return an empty array on default.
}

// console.log(selectFiles("input/", "zip"));

module.exports = fileFinder; // so we can use require('filefinder');
