const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '../../');
console.log(`Root path is ${ projectRoot }`);

let siteRel = "example";
const siteDir = () => path.join(projectRoot, siteRel);
const siteRoot = {
  setPath: (relPath) => {
    siteRel = relPath;
  },
  dir: siteDir()
};
console.log(`Site path is ${ siteRoot.dir }`);

module.exports = {
  files: (dirname) => {
    const name = "Files";
    const read = (cb) => {
      if (!cb) throw new Error("Invalid call to files.read - requires a callback function(content)");
      const thispath = path.join(siteRoot.dir, dirname);
      const files = fs.existsSync(thispath) ? fs.readdirSync(thispath) : [];
      const filelist = [];
      files.forEach(function(element) {
        const filePath = path.join(thispath, element);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          filelist.push({ name: element, path: `${ dirname }/${ element }`, stats , type: "file" });
        }
      }, this);
      cb(filelist);
    };
    return { read, name };
  },
  file: (id) => {
    const name = "File";
    const thisfile = path.join(siteRoot.dir, id);
    let stats;
    try {
      stats = fs.statSync(thisfile);
    } catch (err) {
      stats = { };
    }

    /* GET-Read an existing file */
    const read = (cb) => {
      if (!cb) throw new Error("Invalid call to file.read - requires a callback function(content)");
      if (stats.isFile()) {
        let returnFile = "";
        try {
          returnFile = fs.readFileSync(thisfile, 'utf8');
          cb(returnFile);
        } catch (err) {
          throw err;
        }
      } else {
        throw new Error("Invalid call to file.read - object path is not a file!");
      }
    };
    /* POST-Create a NEW file, ERROR if exists */
    const create = (body, cb) => {
      try {
        fs.writeFileSync(thisfile, body.content, { encoding: body.encoding, flag: 'wx' });
        cb(body.content);
      } catch (err) {
        throw err;
      }
    };
    /* PUT-Update an existing file */
    const update = (body, cb) => {
      try {
        fs.writeFileSync(thisfile, body.content, { encoding: body.encoding, flag: 'w' });
        cb(body.content);
      } catch (err) {
        throw err;
      }
    };
    /* DELETE an existing file */
    const del = (cb) => {
      try {
        fs.unlinkSync(thisfile);
        cb(`Deleted File ${ thisfile }`);
      } catch (err) {
        throw err;
      }
    };
    return { read, create, update, del, stats };
  },
};
