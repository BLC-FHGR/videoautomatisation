
var path = require('path'),
    fs   = require('fs');

// This finds all relevant zip files.
function selectFiles(startPath,filter) {

    //console.log('Starting from dir '+startPath+'/');
    var theFiles = [];

    if (fs.existsSync(startPath)) {
        var files = fs.readdirSync(startPath);

        // Map-Reduce through the directories
        // 1. map all files and recurse into the subdirectories
        // 2. reduce the files into a flat array.
        //
        // theFiles will contain the result for the reduce() call.
        theFiles = files
            .map(function fetchFiles(filename) {                           // 1
                var result = undefined;
                var suffix = filename.split(".").pop();
                filename   = path.join(startPath, filename);

                if (fs.lstatSync(filename).isDirectory()) {
                    // recursing into a subdirectory will add an Array
                    result = selectFiles(filename, filter);
                }
                else if (suffix == filter) {
                    result = filename;
                }
                // always return
                return result;
            })
            .reduce(function flattenArray(resultArray, nameOrArray)  {     // 2
                if (Array.isArray(nameOrArray)) {
                    // immediate return to avoid confusing assignments
                    return resultArray.concat(nameOrArray);
                }
                if (nameOrArray !== undefined) {
                    resultArray.push(nameOrArray);
                }
                return resultArray; // MUST return the result array
            }, []); // pass an empty array as reduce initializer
    }

    return theFiles; // return the final result
}
