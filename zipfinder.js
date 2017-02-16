var path = require('path'), fs=require('fs');

function selectFiles(startPath,filter) {

    //console.log('Starting from dir '+startPath+'/');
    var zipfilesFound = [];

    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }

    var files = fs.readdirSync(startPath);

    zipfilesFound = files
        .map(function (filename) {
            var zip  = filename.split(".").pop();
            filename = path.join(startPath, filename);
            var stat = fs.lstatSync(filename); 

            if (fs.lstatSync(filename).isDirectory()) {
                selectFiles(filename, zip);
            }
            else if (zip == filter) {
                console.log(filename);
                return filename;
            } 
        })
        .reduce(function (resultArray, filename)  {
            if (filename !== undefined) {
                resultArray.push(filename);
            }
            return resultArray;
        }, []);

    // for (var i = 0; i < files.length; i++) {
    //     var filename = path.join(startPath, files[i]);
    //     var stat = fs.lstatSync(filename);
    
    //     if (stat.isDirectory()) {
    //         fromDir(filename, filter); //recurse
    //     }
    //     else if (filename.indexOf(filter)>=0) {
    //         console.log('-- found: ;
    //         zipfilesFound.push(filename);
    //     }
    // }

    console.log('the zipfiles i found: ', zipfilesFound);

    return zipfilesFound;
}

function recourseDir(startPath) {    
    console.log("xxx");

    var files = fs.readdirSync(startPath);    

    var zipFiles = files
        .map(function(filename) {
            filename = path.join(startPath, filename);
            if (fs.lstatSync(filename).isDirectory()) {
                var tzip = selectFiles(filename, "zip");       
            }
            return [];
        })
        .reduce(function (resultArray, fileList) {

            return resultArray.concat(fileList);
        }, []);

    return zipFiles;
}

var zips = recourseDir("input/");

console.log(zips);
//fromDir('input/','zip');
