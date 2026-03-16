export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다' });
  }

  const API_KEY = process.env.LAND_API_KEY;

  try {
    const url = `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_UQ111&key=${API_KEY}&geometry=false&attribute=true&filter=<Filter><Contains><PropertyName>the_geom</PropertyName><Point><coordinates>${lng},${lat}</coordinates></Point></Contains></Filter>&format=json&size=10`;

    const response = await fetch(url);
    const data = await response.json();

    if (
      data.response &&
      data.response.status === 'OK' &&
      data.response.result &&
      data.response.result.featureCollection &&
      data.response.result.featureCollection.features &&
      data.response.result.featureCollection.features.length > 0
    ) {
      const feature = data.response.result.featureCollection.features[0];
      const zone = feature.properties.uname || feature.properties.prpos_area1_nm || '';
      const isJigudan = zone.includes('지구단위') || zone.includes('특별계획');

      return res.status(200).json({
        zone: zone,
        isJigudan: isJigudan,
        raw: feature.properties
      });
    } else {
      return res.status(200).json({ zone: null, message: '해당 좌표의 용도지역 정보를 찾을 수 없습니다' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'API 호출 실패', detail: error.message });
  }
}
