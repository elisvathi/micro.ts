const fs = require('fs');
const defPackage = fs.readFileSync(__dirname + "/package.json").toString();
const version = JSON.parse(defPackage).version;
console.log(version);
const prodPackage = JSON.parse(fs.readFileSync(__dirname + "/package-production.json").toString());
prodPackage.version = version;
const prodPackageStr = JSON.stringify(prodPackage, null, 2);
fs.writeFileSync(__dirname + "/package-production.json", prodPackageStr);
