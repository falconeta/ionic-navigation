const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  mkdir(dest);
  var files = fs.readdirSync(src);
  for (var i = 0; i < files.length; i++) {
    var current = fs.lstatSync(path.join(src, files[i]));
    if (current.isDirectory()) {
      copyDir(path.join(src, files[i]), path.join(dest, files[i]));
    } else if (current.isSymbolicLink()) {
      var symlink = fs.readlinkSync(path.join(src, files[i]));
      fs.symlinkSync(symlink, path.join(dest, files[i]));
    } else {
      copy(path.join(src, files[i]), path.join(dest, files[i]));
    }
  }
}

function copy(src, dest) {
  fs.copyFileSync(src, dest);
}


function mkdir(dir) {
  // making directory without exception if exists
  try {
    fs.mkdirSync(dir, { recursive: true, mode: "0775" });
  } catch (e) {
    if (e.code !== "EEXIST") {
      throw e;
    }
  }
}

function moveFile(from, to) {
  try {
    fs.renameSync(from, to);
    console.success(`Successfully moved`)
  } catch (error) {
    console.error(`Error occurred during moving the tgz file in the correct dist folder: \n${error}`);
    process.exit(1);
  }
}

module.exports = {
  moveFile: moveFile,
  copyDir: copyDir
}
