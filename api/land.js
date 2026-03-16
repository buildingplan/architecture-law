export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: '좌표가 필요합니다' });
  }

  const API_KEY = process.env.VWORLD_API_KEY;
  const minLng = parseFloat(lng) - 0.0005;
  const minLat = parseFloat(lat) - 0.0005;
  const maxLng = parseFloat(lng) + 0.0005;
  const maxLat = parseFloat(lat) + 0.0005;

  const url = `https://api.vworld.kr/req/data?service=data&request=GetFeature&data=LT_C_UQ111&key=${API_KEY}&geometry=false&attribute=true&crs=EPSG:4326&bbox=${minLng},${minLat},${maxLng},${maxLat}&format=json&size=10`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch(e) { return res.status(200).json({ zone: null, raw: text.substring(0, 500) }); }

    if (data?.response?.status === 'OK' &&
        data?.response?.result?.featureCollection?.features?.length > 0) {
      const props = data.response.result.featureCollection.features[0].properties;
      const zone = props.uname || props.prpos_area1_nm || props.ugb_nm || '';
      return res.status(200).json({
        zone,
        isJigudan: zone.includes('지구단위') || zone.includes('특별계획'),
        raw: props
      });
    }
    return res.status(200).json({ zone: null, raw: data?.response });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
