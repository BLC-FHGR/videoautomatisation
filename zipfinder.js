var path = require('path'), fs=require('fs');

function selectFiles(startPath,filter) {

    //console.log('Starting from dir '+startPath+'/');
    var zipFiles = [];

    if (fs.existsSync(startPath)) {
        var files = fs.readdirSync(startPath);
        
        // the following is a bit 
        zipfilesFound = files
            .map(function (filename) {
                var zip  = filename.split(".").pop();
                filename = path.join(startPath, filename);

                if (fs.lstatSync(filename).isDirectory()) {
                    // this will add an Array to our result set
                    return selectFiles(filename, filter);
                }
                else if (zip == filter) {
                    // place just the filename of the zip into the result set
                    return filename;
                } 
            })
            .reduce(function (resultArray, nameOrArray)  {
                if (Array.isArray(nameOrArray)) {
                    resultArray.concat(nameOrArray);
                }
                if (nameOrArray !== undefined) {
                    resultArray.push(filename);
                }
                return resultArray;
            }, zipFiles);

        console.log('the zipfiles i found: ', zipfilesFound);
    }
    return zipFiles;
}

var zips = selectFiles("input/", "zip");

console.log(zips);

