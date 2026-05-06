import https from 'https';

const query = "song";
const target = "https://inv.thepixora.com/api/v1/search?q=" + encodeURIComponent(query) + "&type=video";
const proxies = [
  "https://api.allorigins.win/raw?url=" + encodeURIComponent(target),
  "https://corsproxy.io/?" + encodeURIComponent(target)
];

function fetchApi(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`Status: ${res.statusCode}`));
      });
    }).on('error', (err) => { reject(err); });
  });
}

async function test() {
  console.log("--- FINAL PROXY-BYPASS TEST ---");
  for (const proxy of proxies) {
    console.log(`Testing Proxy: ${proxy.substring(0, 50)}...`);
    try {
      const data = await fetchApi(proxy);
      console.log(`Raw data length: ${data.length}`);
      const parsed = JSON.parse(data);
      const items = Array.isArray(parsed) ? parsed : (parsed.items || []);
      console.log(`Items found: ${items.length}`);
      if (items.length > 0) {
        console.log(`First item: ${items[0].title}`);
        console.log("--- SUCCESS ---");
        return;
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
  console.log("--- ALL PROXIES FAILED ---");
}

test();
