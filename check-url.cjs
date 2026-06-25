const https = require('https');

function checkUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(`${url}: ${res.statusCode}`);
    }).on('error', () => resolve(`${url}: error`));
  });
}

async function run() {
  console.log(await checkUrl('https://res.cloudinary.com/dgfjnugvr/image/upload/lenormand/1.jpg'));
  console.log(await checkUrl('https://res.cloudinary.com/dgfjnugvr/image/upload/lenormand/01.jpg'));
  console.log(await checkUrl('https://res.cloudinary.com/dgfjnugvr/image/upload/lenormand/back.jpg'));
  console.log(await checkUrl('https://res.cloudinary.com/dgfjnugvr/image/upload/lenormand/dorso.jpg'));
}
run();
