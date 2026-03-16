export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다' });
  }

  const API_KEY = process.env.LAND_API_KEY;
  const minLng = parseFloat(lng) - 0.0005;
  const minLat = parseFloat(lat) - 0.0005;
  const maxLng = parseFloat(lng) + 0.0005;
  const maxLat = parseFloat(lat) + 0.0005;

  try {
    const url = `http://apis.data.go.kr/1611000/nsdi/LandUseService/wfs/LandUseWFS?service=WFS&version=1.0.0&request=GetFeature&typeName=LandUse:LT_C_UQ111&srsName=EPSG:4326&bbox=${minLng},${minLat},${maxLng},${maxLat}&ServiceKey=${API_KEY}`;

    const response = await fetch(url);
    const text = await response.text();

    // XML에서 용도지역명 추출
    const match = text.match(/<LandUse:UNAME>([^<]+)<\/LandUse:UNAME>/) ||
                  text.match(/<UNAME>([^<]+)<\/UNAME>/) ||
                  text.match(/UNAME[^>]*>([^<]+)</);

    if (match && match[1]) {
      const zone = match[1].trim();
      return res.status(200).json({
        zone,
        isJigudan: zone.includes('지구단위') || zone.includes('특별계획'),
      });
    }

    // 응답 원문 일부 반환 (디버깅용)
    return res.status(200).json({ zone: null, raw: text.substring(0, 500) });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
```

Commit 후 다시 API 주소 열어서 결과 보내주세요!
```
https://architecture-law.vercel.app/api/land?lat=37.5135&lng=127.0622
