const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const cmd = '"C:\\Users\\Acer\\.bubblewrap\\jdk\\jdk-17.0.11+9\\bin\\keytool.exe" -list -v -keystore android.keystore -alias android -storepass password123';
const output = execSync(cmd).toString();
const match = output.match(/SHA256:\s*([0-9A-F:]+)/);

if (match) {
  const sha = match[1];
  console.log("Found SHA256: " + sha);

  const dir = path.join(__dirname, '.well-known');
  if(!fs.existsSync(dir)) fs.mkdirSync(dir);
  
  const content = [{
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.bukumoney.twa",
      "sha256_cert_fingerprints": [sha]
    }
  }];
  fs.writeFileSync(path.join(dir, 'assetlinks.json'), JSON.stringify(content, null, 2));
  console.log("assetlinks.json created!");
} else {
  console.log("SHA256 not found in output:\n" + output);
}
